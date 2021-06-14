const fetch = require('node-fetch')

const Contest = require('../models/contest')
let halfHour = 1000 * 60 * 30

const fetchContestRankings = async function (contestSlug) {
    try {
        let contest = await Contest.findById(contestSlug)
        if (!contest) {
            console.error(`Contest ${contestSlug} not found in the db`)
            return null
        }

        console.log(`fetching ${contestSlug} ...`)
        rankings = []
        let resp = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=1&region=global`);
        resp = await resp.json()
        let contest_id = resp.total_rank[0].contest_id
        let num_user = resp.user_num
        let pages = Math.floor(resp.user_num / 25)
        for (let i = 1; i <= pages; i++) {
            console.log(`Fetching rankings (${contestSlug}): page: ${i}`)
            let res = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=${i}&region=global`);
            res = await res.json()
            for (ranks of res.total_rank) {
                let {
                    username,
                    user_slug,
                    country_code,
                    country_name,
                    data_region,
                    rank,
                    score,
                    finish_time,
                } = ranks

                // no submission 
                if (score === 0 && finish_time * 1000 == contest.startTime.getTime()) {
                    break // can also break page loop
                }
                let ranking = {
                    username,
                    user_slug,
                    country_code,
                    country_name,
                    data_region,
                    rank
                }
                ranking["_id"] = username
                rankings.push(ranking)
            }
        }

        let updatedContest = new Contest({
            contest_id: contest_id,
            lastUpdated: Date.now(),
            rankings: rankings,
            num_user: num_user,
            ratings_fetched: true
        })

        contest = await Contest.findByIdAndUpdate(contestSlug, updatedContest, {
            new: true
        })
        console.log(`Updated Rankings in ${contestSlug}`)

        return contest
    } catch (err) {
        console.error(err);
        return null
    }
}
const fetchContest = async () => {

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
const getContestRankings = async function (contestSlug) {
    let contest = await Contest.findById(contestSlug, {
        rankings: 0
    })
    if (!contest || !contest.ratings_fetched) {
        contest = await fetchContestRankings(contestSlug)
    }
    return contest
}

// exports 
module.exports.fetchContest = fetchContest
exports.getContestRankings = getContestRankings
exports.fetchContestRankings = fetchContestRankings