const fetch = require("node-fetch");
const Contest = require("../models/contest");
const { IsLatestContest } = require("../helpers");
const { BASE_CN_URL, BASE_URL } = require("./users");

const getContestParticipantsRankings = async (contest, dataRegion) => {
    const contestSlug = contest._id;
    console.log(`Fetching participant's rankings for ${dataRegion} region...`);
    const baseUrl = dataRegion === "CN" ? BASE_CN_URL : BASE_URL;
    let resp = await fetch(
        `${baseUrl}/contest/api/ranking/${contestSlug}/?region=global`
    );
    resp = await resp.json();
    let pages = Math.ceil(resp.user_num / 25);
    let all_rankings = [];
    let failed = [];
    let lastPage = Number.MAX_SAFE_INTEGER;
    const fetchPageRankings = async (
        pageNo,
        retries,
        throwError = false
    ) => {
        if (pageNo > lastPage) {
            return;
        }
        try {
            let res = await fetch(
                `${baseUrl}/contest/api/ranking/${contestSlug}/?pagination=${pageNo}&region=${dataRegion == "CN" ? "local" : "global"}`
            );
            if (res.status !== 200) {
                throw new Error(res.statusText);
            }
            res = await res.json();
            rankings = res.total_rank
                .filter(
                    (ranks) =>
                        !(
                            ranks.score == 0 &&
                            ranks.finish_time * 1000 ==
                            contest.startTime.getTime()
                        )
                );
            if (rankings.length < 25) {
                lastPage = Math.min(lastPage, pageNo);
            }
            all_rankings = all_rankings.concat(rankings);
            console.log(
                `Fetched rankings (${contestSlug} page: ${pageNo})`,
            );
        } catch (err) {
            console.error(err);
            if (retries > 0) {
                await fetchPageRankings(pageNo, retries - 1);
            } else if (throwError) {
                throw err;
            } else {
                failed.push(pageNo);
            }
        }
    };
    const limit = 5;
    const maxRetries = 5;
    for (let i = 0; i < pages && i < lastPage; i += limit) {
        let promises = [];
        for (let j = 0; j < limit && i + j < pages && i + j < lastPage; j++) {
            promises.push(fetchPageRankings(i + j + 1, maxRetries));
        }
        await Promise.all(promises);
    }
    for (let i = 0; i < failed.length; i++) {
        await fetchPageRankings(failed[i], maxRetries, true);
    }
    console.log(`(${contestSlug}) Rankings fetched from ${baseUrl}`);
    return all_rankings;
};

const mergeRankings = (us_rankings, cn_rankings) => {
    us_rankings.sort((a, b) => (a.rank > b.rank ? 1 : -1));
    cn_rankings.sort((a, b) => (a.rank > b.rank ? 1 : -1));
    let totalUsRankings = us_rankings.length;
    let totalCnRankings = cn_rankings.length;
    let currRank = 0;
    let i = 0, j = 0;
    all_rankings = [];
    while (i < totalUsRankings || j < totalCnRankings) {
        let currRanking;
        if (i == totalUsRankings) {
            currRanking = cn_rankings[j++];
        } else if (j == totalCnRankings) {
            currRanking = us_rankings[i++];
        } else {
            if (us_rankings[i].score > cn_rankings[j].score || (us_rankings[i].score === cn_rankings[j].score && us_rankings[i].finish_time <= cn_rankings[j].finish_time)) {
                currRanking = us_rankings[i++];
            } else {
                currRanking = cn_rankings[j++];
            }
        }
        currRanking.rank = currRank++;
        all_rankings.push(currRanking);
    }
    return all_rankings;
}

const fetchContestRankings = async function (contestSlug) {
    try {
        let contest = await Contest.findById(contestSlug);
        if (!contest) {
            return [null, Error(`Contest ${contestSlug} not found in the db`)];
        }
        if (!contest.refetch_rankings && contest.rankings_fetched) {
            return [contest, null];
        }
        contest.rankings = [];
        console.log(`fetching ${contestSlug} ...`);

        us_rankings = await getContestParticipantsRankings(contest, "US");
        cn_rankings = await getContestParticipantsRankings(contest, "CN");

        // Merged rankings sorted by rank
        all_rankings = mergeRankings(us_rankings, cn_rankings).map((ranking) => {
            let {
                username,
                user_slug,
                country_code,
                country_name,
                data_region,
                rank,
            } = ranking;
            if (data_region === "CN") {
                country_code = "CN";
            }
            return {
                _id: username,
                username,
                user_slug,
                country_code,
                country_name,
                data_region,
                rank,
            };;
        });

        contest.rankings = all_rankings;
        contest.rankings_fetched = true;
        contest.refetch_rankings = false;
        contest.user_num = all_rankings.length;
        console.time(`Saving rankings in db (${contestSlug})`);
        await contest.save();
        console.timeEnd(`Saving rankings in db (${contestSlug})`);
        console.log(`Updated rankings in db (${contestSlug}).`);

        return [contest, null];
    } catch (err) {
        return [null, err];
    }
};
const fetchContestsMetaData = async () => {
    console.log("fetching meta data for all contests...");
    try {
        let res = await fetch("https://leetcode.com/graphql", {
            headers: {
                accept: "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "content-type": "application/json",
                "sec-ch-ua":
                    '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
            },
            referrer: "https://leetcode.com/contest/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `{"operationName":null,"variables":{},"query":"{\
                currentTimestamp\
                allContests {\
                  containsPremium\
                  title\
                  titleSlug\
                  startTime\
                  duration\
                  originStartTime\
                  isVirtual\
                }\
              }\
              "}`,
            method: "POST",
            mode: "cors",
        });
        res = await res.json();

        for (let i = 0; i < res.data.allContests.length; i++) {
            let contest = res.data.allContests[i];
            const endTime = contest.startTime * 1000 + contest.duration * 1000;
            if (!IsLatestContest(endTime)) {
                continue;
            }
            let contestExists = await Contest.exists({
                _id: contest.titleSlug,
            });
            if (contestExists) {
                continue;
            }
            let newContest = new Contest({
                _id: contest.titleSlug,
                title: contest.title,
                startTime: contest.startTime * 1000,
                endTime: endTime,
                lastUpdated: Date.now(),
            });
            await newContest.save();
            console.log(`created new contest: ${contest.titleSlug}`);
        }
        console.log("Fetched contests' meta data");
        return res.data.allContests;
    } catch (err) {
        console.error(err);
        return null;
    }
};

// exports
exports.fetchContestsMetaData = fetchContestsMetaData;
exports.fetchContestRankings = fetchContestRankings;
