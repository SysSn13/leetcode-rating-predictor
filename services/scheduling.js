const {getContestRankings , fetchContest} = require('../services/contests')
const schedule = require('node-schedule');

//Variables For testing
const jobScheduleTime = {hour: 00,minute: 00}
const contestScheduleCall = { start: Date.now(), end: Date.now() + 1000*60*60, rule: '*/5 * * * *' }


const job = schedule.scheduleJob({hour: 00, minute: 00,},async function(){
    let contestList = await fetchContest()
    for(let i=0;i<contestList.length;i++){
        if(Date.now() + 1000*60*60*24 > contestList[i].startTime && Date.now()<contestList[i].startTime){
            const event = schedule.scheduleJob({ start: contestList[todaysContest].startTime, end: contestList[todaysContest].endTime, rule: '*/5 * * * *' }, 
            async function(){
                getContestRankings(contestList[i].titleSlug)
            });
        }
        let endTime = contestList[i].startTime*1000 + contestList[i].duration*1000
        if(Date.now()>endTime){
            await getContestRankings(contestList[i].titleSlug)
        }
    }
});

const fetchNow = async function(){
    let contestList = await fetchContest()
    if(!contestList)
        return
    let promises = contestList.map(async (contest)=>{
        let endTime = contest.startTime*1000 + contest.duration*1000
        if(Date.now()> endTime)
            await getContestRankings(contest.titleSlug)
    })
}
exports.fetchAllContests = fetchNow
