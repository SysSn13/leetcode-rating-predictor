const fetch = require('node-fetch')

const Contest = require('../models/contest')
let halfHour = 1000 * 60 * 30

async function pushRankingsToContest(contest_id, rankings, pagesCnt, islastPage) {
    try {
        await Contest.findOneAndUpdate({
            _id: contest_id
        }, {
            $push: {
                rankings: rankings,
            },
            $inc: {
                pages_fetched: pagesCnt,
            },
            $set: {
                rankings_fetched: islastPage,
            },
        });

        return null
    } catch (err) {
        console.log(err)
        return err
    }
}
const fetchContestRankings = async function (contestSlug) {
    try {
        let contest = await Contest.findById(contestSlug, {
            rankings: 0
        })
        if (!contest) {
            return Error(`Contest ${contestSlug} not found in the db`)
        }

        console.log(`fetching ${contestSlug} ...`)
        let resp = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?region=global`);
        resp = await resp.json()
        // let num_user = resp.user_num
        let pages = Math.floor(resp.user_num / 25),
            page = contest.pages_fetched + 1
        for (let i = page; i <= pages; i++) {
            console.log(`Fetching rankings (${contestSlug}): page: ${i}`)
            let res = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=${i}&region=global`);
            res = await res.json()
            rankings = res.total_rank.filter(ranks => !(ranks.score == 0 && ranks.finish_time * 1000 == contest.startTime.getTime())).map((ranks) => {
                let {
                    username,
                    user_slug,
                    country_code,
                    country_name,
                    data_region,
                    rank,
                } = ranks
                let ranking = {
                    username,
                    user_slug,
                    country_code,
                    country_name,
                    data_region,
                    rank
                }
                ranking["_id"] = username
                return ranking
            })
            let err = await pushRankingsToContest(contest._id, rankings, 1, i === pages)
            if (err) {
                return err
            }
        }
        console.log(`Updated Rankings in ${contestSlug}.`)
        return null
    } catch (err) {
        return err
    }
}
const fetchContestsMetaData = async () => {
    console.log("fetching meta data for all contests...")
    try {
        let res = await fetch("https://leetcode.com/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                "content-type": "application/json",
                "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
                "sec-ch-ua-mobile": "?0",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
            },
            "referrer": "https://leetcode.com/contest/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": `{"operationName":null,"variables":{},"query":"{\
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
            "method": "POST",
            "mode": "cors"
        });
        res = await res.json()
        //console.log(res.data.allContests[0])
        //let contestSlug = res.data.allContests[0].titleSlug
        //let startTime = res.data.allContests[0].startTime*1000
        //let endTime = startTime + res.data.allContests[0].duration*1000
        for (let i = 0; i < res.data.allContests.length; i++) {
            let contest = res.data.allContests[i];
            let dbContest = await Contest.findById(contest.titleSlug)
            if (dbContest) {
                continue
            }
            let newContest = new Contest({
                _id: contest.titleSlug,
                startTime: contest.startTime * 1000,
                endTime: contest.startTime * 1000 + contest.duration * 1000,
                lastUpdated: Date.now(),
                num_user: contest.num_user
            })
            await newContest.save()
            console.log(`created new contest: ${contest.titleSlug}`)
        }
        return res.data.allContests
    } catch (err) {
        console.error(err)
        return null
    }
}
const updateContestRankings = async function (contestSlug) {
    let contest = await Contest.findById(contestSlug, {
        rankings: 0
    })
    if (!contest) {
        return Error(`contest ${contestSlug} not found in the db.`)
    } else if (!contest.rankings_fetched) {
        let err = await fetchContestRankings(contestSlug)
        return err
    }
    return null
}

// exports 
exports.fetchContestsMetaData = fetchContestsMetaData
exports.updateContestRankings = updateContestRankings
exports.fetchContestRankings = fetchContestRankings