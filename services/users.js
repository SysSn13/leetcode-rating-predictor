const { User, ContestHistory } = require("../models/users");
const Contest = require("../models/contest");
const fetch = require("node-fetch");

const BASE_URL = "https://leetcode.com";
const BASE_CN_URL = "https://leetcode-cn.com";

function getUserId(username, dataRegion = "US") {
    return dataRegion + "/" + username.trim().toLowerCase();
}
async function getLastContestStartTime(user_id) {
    try {
        let lastStartTime = 0;
        const user = await User.findOne({
            _id: user_id,
        })
            .where("contestsHistory")
            .slice([-1, 1]);
        if (user && user.contestsHistory && user.contestsHistory.length > 0) {
            lastStartTime = user.contestsHistory[0].startTime;
        }
        return [lastStartTime, null];
    } catch (err) {
        return [0, err];
    }
}
async function pushContestHistory(user_id, contestsHistory) {
    try {
        await User.findOneAndUpdate(
            {
                _id: user_id,
            },
            {
                $push: {
                    contestsHistory: contestsHistory,
                },
            },
            {
                upsert: true,
            }
        );
        return null;
    } catch (err) {
        return err;
    }
}
async function fetchUserDataUSRegion(username) {
    try {
        console.log(`fetching user ${username}'s info from ${BASE_URL}...`);
        let attendedContestsCount,
            rating,
            globalRanking,
            contestsHistory,
            user_id = getUserId(username, "US");
        var resp = await fetch(BASE_URL + "/graphql", {
            headers: {
                accept: "*/*",
                "accept-language":
                    "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7,ru;q=0.6",
                "cache-control": "no-cache",
                "content-type": "application/json",
                pragma: "no-cache",
                "sec-ch-ua":
                    '" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
            },
            referrer: "https://leetcode.com/",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `{"operationName":"getContestRankingData","variables":{"username":"${username}"},"query":"query getContestRankingData($username: String!) {\
                userContestRanking(username: $username) {\
                attendedContestsCount\
                rating\
                globalRanking\
                }\
                userContestRankingHistory(username: $username) {\
                contest {\
                    title\
                    startTime\
                }\
                rating\
                ranking\
                }\
            }\
            "}`,
            method: "POST",
            mode: "cors",
        });
        resp = await resp.json();
        if (resp.errors || !resp.data) {
            return new Error(
                `Error while fetching ${username}'s data from ${BASE_URL}`
            );
        }
        // current rankings
        ranking = resp.data.userContestRanking;
        if (ranking) {
            attendedContestsCount = ranking.attendedContestsCount;
            rating = ranking.rating;
            globalRanking = ranking.globalRanking;
        }
        const exists = await User.exists({ _id: user_id });

        if (!exists) {
            const user = new User({
                _id: user_id,
                attendedContestsCount: attendedContestsCount,
                rating: rating,
                globalRanking: globalRanking,
                lastUpdated: Date.now(),
            });
            await user.save();
        }
        let lastStartTime = 0,
            err;
        if (exists) {
            [lastStartTime, err] = await getLastContestStartTime(user_id);
            if (err) {
                return err;
            }
        }
        // contests history
        history = resp.data.userContestRankingHistory;
        contestsHistory = history
            .map((ele) => {
                if (
                    ele.contest.startTime &&
                    ele.contest.startTime > lastStartTime
                ) {
                    return new ContestHistory({
                        _id: ele.contest.title
                            .trim()
                            .replace(/ /g, "-")
                            .toLowerCase(),
                        title: ele.contest.title,
                        startTime: ele.contest.startTime,
                        rating: ele.rating,
                        ranking: ele.ranking,
                    });
                }
            })
            .filter((item) => item != undefined);
        if (contestsHistory.length > 0) {
            return pushContestHistory(user_id, contestsHistory);
        }
    } catch (err) {
        return err;
    }
}

async function fetchUserDataCNRegion(username) {
    try {
        console.log(`fetching user ${username}'s info from ${BASE_CN_URL}...`);
        let attendedContestsCount,
            rating,
            globalRanking,
            contestsHistory,
            user_id = getUserId(username, "CN");
        let resp = await fetch(BASE_CN_URL + "/graphql/", {
            headers: {
                accept: "*/*",
                "accept-language": "en",
                "cache-control": "no-cache",
                "content-type": "application/json",
                pragma: "no-cache",
                "sec-ch-ua": `" Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"`,
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "sec-gpc": "1",
                "x-definition-name": "userProfilePublicProfile",
                "x-operation-name": "userPublicProfile",
            },
            referrer: "https://leetcode-cn.com",
            referrerPolicy: "strict-origin-when-cross-origin",
            body: `{"operationName":"userPublicProfile","variables":{"userSlug":"${username}"},"query":"query userPublicProfile($userSlug: String!) {\
            userProfilePublicProfile(userSlug: $userSlug) {\
              username\
              siteRanking\
              profile {\
                userSlug\
                contestCount\
                ranking {\
                  rating\
                  currentLocalRanking\
                  currentGlobalRanking\
                  currentRating\
                  totalLocalUsers\
                  totalGlobalUsers\
                }\
              }\
            }\
            userContestRanking(userSlug: $userSlug) {\
                currentRatingRanking\
                ratingHistory\
                contestRankingHistoryV2\
                contestHistory\
                __typename\
              }\
          }\
          "}`,
            method: "POST",
            mode: "cors",
        });
        resp = await resp.json();

        if (resp.errors || !resp.data) {
            return Error(
                `Error while fetching ${username}'s data from ${BASE_CN_URL}`
            );
        }

        let profile = resp.data.userProfilePublicProfile.profile;
        attendedContestsCount = parseInt(profile.contestCount);
        if (attendedContestsCount > 0) {
            // rankings
            let ranking = profile.ranking;
            globalRanking = ranking.currentGlobalRanking;
            rating = parseFloat(ranking.currentRating);

            // contests history
            let ratingHistory = JSON.parse(
                resp.data.userContestRanking.ratingHistory
            );
            let contestHistory = JSON.parse(
                resp.data.userContestRanking.contestHistory
            );
            let contestRankingHistoryV2 = JSON.parse(
                resp.data.userContestRanking.contestRankingHistoryV2
            );
            const getRanking = (rank) => {
                if (rank) {
                    return rank.ranking;
                }
                return 0;
            };
            let currRating = 1500;
            const getRating = (rating) => {
                if (rating) {
                    return (currRating = rating);
                }
                return currRating;
            };
            contestsHistory = ratingHistory.map(
                (val, ind) =>
                    new ContestHistory({
                        _id: contestHistory[ind].title_slug.trim(),
                        title: contestHistory[ind].title.trim(),
                        rating: getRating(val),
                        ranking: getRanking(contestRankingHistoryV2[ind]),
                    })
            );
        }

        user = new User({
            attendedContestsCount: attendedContestsCount,
            rating: rating,
            globalRanking: globalRanking,
            contestsHistory: contestsHistory,
            lastUpdated: Date.now(),
        });

        await User.findOneAndUpdate(
            {
                _id: user_id,
            },
            user,
            {
                upsert: true,
            }
        );
        return null;
    } catch (err) {
        return err;
    }
}

const getCurrentRating = async (
    username,
    dataRegion = "US",
    contestSlug = ""
) => {
    const user_id = getUserId(username, dataRegion);
    let result = {
        isFirstContest: false,
        rating: -1,
        actualRating: 1500,
    };
    let user;
    if (contestSlug === "") {
        user = await User.findById(user_id, {
            rating: 1,
            attendedContestsCount: 1,
        });
    } else {
        user = await User.findById(user_id);
    }
    if (!user) {
        return result;
    }

    result.isFirstContest = user.attendedContestsCount === 0;

    if (contestSlug === "") {
        result.rating = user.rating;
        return result;
    }

    if (result.isFirstContest) {
        result.rating = 1500;
        return result;
    }

    if (!user.contestsHistory) {
        return result;
    }
    let currentContest = user.attendedContestsCount;
    for (let i = user.contestsHistory.length - 1; i >= 0; i--) {
        if (user.contestsHistory[i]._id === contestSlug) {
            result.rating = i > 0 ? user.contestsHistory[i - 1].rating : 1500;
            result.actualRating = user.contestsHistory[i].rating;
            result.isFirstContest = currentContest === 1;
            if (user.contestsHistory[i].ranking != 0) {
                currentContest--;
            }
            break;
        }
    }
    if (result.rating === -1) {
        result.rating = user.rating;
    }
    return result;
};
const fetchUserInfo = async (username, dataRegion = "US") => {
    const exists = await User.exists({ _id: getUserId(username, dataRegion) });
    if (exists) {
        return null;
    }
    let err;
    if (dataRegion === "CN") {
        err = await fetchUserDataCNRegion(username);
    } else {
        err = await fetchUserDataUSRegion(username);
    }
    return err;
};

const getUser = async (username, dataRegion = "US") => {
    let user_id = getUserId(username, dataRegion);
    let user = await User.findById(user_id);
    if (!user) {
        let err;
        if (dataRegion === "CN") {
            err = await fetchUserDataCNRegion(username);
        } else {
            err = await fetchUserDataUSRegion(username);
        }

        if (err) {
            console.log(err);
        } else {
            user = await User.findById(user_id);
        }
    }
    return user;
};

// fetches data from leetcode
const fetchContestParticipantsData = async (contestSlug) => {
    try {
        const contest = await Contest.findById(contestSlug);
        if (!contest) {
            return Error(`Contest ${contestSlug} not found`);
        }
        const limit = 100;
        const total = contest.rankings.length;

        for (let i = 0; i < total; i += limit) {
            let promises = [];
            for (let j = 0; j < limit && i + j < total; j++) {
                promises.push(
                    fetchUserInfo(
                        contest.rankings[i + j].user_slug,
                        contest.rankings[i + j].data_region
                    )
                );
            }
            await Promise.all(promises);
        }
    } catch (err) {
        return err;
    }
};

// fetches data from db
const getContestParticipantsData = async (contestSlug, latest = false) => {
    try {
        const contest = await Contest.findById(contestSlug);
        if (!contest) {
            return [];
        }
        let result = new Array(contest.num_user);

        const promises = contest.rankings.map(async (rank) => {
            let userData = await getCurrentRating(
                rank.user_slug,
                rank.data_region,
                latest ? "" : contestSlug
            );
            userData.username = rank.user_slug;
            userData.rank = rank.rank;
            result[rank.rank - 1] = userData;
        });

        await Promise.all(promises);
        return result;
    } catch (err) {
        console.error(err);
        return [];
    }
};
exports.getContestParticipantsData = getContestParticipantsData;
exports.fetchContestParticipantsData = fetchContestParticipantsData;
exports.getUser = getUser;
