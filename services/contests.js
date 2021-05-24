const axios = require('axios');
const fetch = require('node-fetch')

const Contest = require('../models/contest')
let halfHour = 1000*60*30

const getContestRankings = async function(contestSlug) {

    let contest = await Contest.findById(contestSlug)
    if(contest===null || contest.rankings.length===0){
        
        try {
            rankings = []
            console.log(`fetching ${contestSlug}`)
            let response = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=1&region=global`);
            response = await response.json()
            let contest_id = response.total_rank[0].contest_id
            
            let pages = Math.floor(response.user_num/25)
            for(let i=1;i<=pages;i++){
                let res = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=${i}&region=global`);
                res = await res.json()
                for(ranks of res.total_rank){
                    let {username , user_slug , country_code , country_name , rank} = ranks
                    let ranking = {username , user_slug , country_code , country_name , rank}
                    rankings.push(ranking)
                }
            }
            let newContest = new Contest({
                _id: contestSlug,
                contest_id: contest_id,
                lastUpdated: Date.now(),
                rankings: rankings
            })
            if(contest===null ){
                await newContest.save()
                console.log(`Created contest ${contestSlug}`)

            }
            else{
                let updatedContest = new Contest({
                    _id: contestSlug,
                    contest_id: contest_id,
                    lastUpdated: Date.now(),
                    rankings: rankings,
                    startTime: contest.startTime,
                    endTime: contest.endTime,
                })
                await Contest.findByIdAndUpdate(contestSlug, updatedContest)
                console.log(`Updated Rankings in  contest ${contestSlug}`)
            }
        } 
        catch (error) {
            console.error(error);
        }
    }
    else{
        console.log("Aldready in db");
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
            "x-newrelic-id": "UAQDVFVRGwEAXVlbBAg="
            
        },
        "referrer": "https://leetcode.com/contest/",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": "{\"operationName\":null,\"variables\":{},\"query\":\"{\\n  brightTitle\\n  currentTimestamp\\n  allContests {\\n    containsPremium\\n    title\\n    cardImg\\n    titleSlug\\n    description\\n    startTime\\n    duration\\n    originStartTime\\n    isVirtual\\n    company {\\n      watermark\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}",
        "method": "POST",
        "mode": "cors"
        });
        res = await res.json()
        //console.log(res.data.allContests[0])
        let contestSlug = res.data.allContests[0].titleSlug
        let startTime = res.data.allContests[0].startTime
        let endTime = startTime + res.data.allContests[0].duration
        for(let i=0;i<res.data.allContests.length;i++)
        {
            let contest = res.data.allContests[i];
            let isfound = await Contest.findById(contest.titleSlug)
            if(isfound){
                break;
            }
            let newContest = new Contest({
                _id: contest.titleSlug,
                startTime: contest.startTime,
                endTime: startTime + contest.duration*1000,
                lastUpdated: Date.now(),
            })
            await newContest.save()
        }
        return res.data.allContests
    }
    catch(error){
        console.log(error)
    }



}








module.exports.getContestRankings = getContestRankings
module.exports.fetchContest = fetchContest

