const fetch = require('node-fetch')

const Contest = require('../models/contest');
let halfHour = 1000*60*30

const fetchContestRankings = async function(contestSlug) {

    let contest = await Contest.findById(contestSlug)
    if(contest === null || Date.now() - contest.lastUpdated >= halfHour){
        
        try {
            rankings = []
            console.log(`fetching ${contestSlug}`)
            let response = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=1&region=global`);
            response = await response.json()
            let contest_id = response.total_rank[0].contest_id
            // TODO: remove hard coded lines
            let pages = 10//Math.floor(response.user_num/25)
            for(let i=1;i<=pages;i++){
                console.log("fetching page no.: "+ i)
                let res = await fetch(`https://leetcode.com/contest/api/ranking/${contestSlug}/?pagination=${i}&region=global`);
                res = await res.json()
                for(ranks of res.total_rank){
                    let {username , user_slug , country_code , country_name ,data_region, rank} = ranks
                    let ranking = {username, user_slug, country_code, country_name, data_region, rank}
                    ranking["_id"] = username
                    rankings.push(ranking)
                }
            }
            let newContest = new Contest({
                _id: contestSlug,
                contest_id: contest_id,
                lastUpdated: Date.now(),
                rankings: rankings
            })
            if(contest===null){
                await newContest.save()
            }
            else{
                await Contest.findByIdAndUpdate(contestSlug, newContest)
                console.log(`Updated contest ${contestSlug}`)
            }
            return newContest
        } 
        catch (error) {
            console.error(error);
            return null
        }
    }
    else{
        console.log("Aldready in db");
        return contest
    }
}
const getContestRankings = async function(contestSlug){
    let contest = await Contest.findById(contestSlug)
    if(!contest){
        contest = await fetchContestRankings(contestSlug)
    }
    return contest
} 
exports.getContestRankings = getContestRankings
exports.fetchContestRankings = fetchContestRankings