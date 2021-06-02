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
    }
});

// const fetchNow = async function(){
//     let contestList = await fetchContest()
//     for(let i=0;i<contestList.length;i++){
//         if(contestList[i].rankings && contestList[i].rankings.length>0)
//             break;    
//         await getContestRankings(contestList[i].titleSlug)
//     }

// }
// exports.fetchAllContests = fetchNow
