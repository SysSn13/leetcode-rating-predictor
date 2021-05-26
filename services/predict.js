const contests = require("./contests")
const Contest = require("../models/contest") 
const users = require("./users")


// https://leetcode.com/discuss/general-discussion/468851/New-Contest-Rating-Algorithm-(Coming-Soon)

function meanWinningPercentage(ratingA,ratingB){
    return 1/(1+Math.pow(10,(ratingB-ratingA)/400))
}
function getExpectedRank(rankList,participantsData,userRating){
    //  sum over all other participants of probabilities to win + 1
    let seed = 0
    rankList.map(rank =>{
        if(participantsData[rank._id].rating!=-1){
            seed += meanWinningPercentage(participantsData[rank._id].rating,userRating)
        }
    })
    return seed
}

function geometricMean(eRank,rank){
    return Math.sqrt(eRank*rank)
}

function getRating(rankList,participantsData,GMean){
    let l = 1,r = 100000,mid,seed
    while(r-l>0.1){
        mid = l + (r-l)/2;
        seed = 1 + getExpectedRank(rankList,participantsData,mid)
        if(seed > GMean){
            // to reduce seed -> increase ERating
            l = mid
        } else {
            // to increase seed -> decrease ERating
            r  = mid
        }
    }
    return mid
}

// function to get all contest participants' rating before contest
async function getParticipantsData(rankList){
    let participantsData = {}

    let promises = rankList.map( async (participant) =>{
        try{
            user = await users.getUser(participant._id,participant.data_region)
            if(user===null){
                participantsData[participant._id] = {"rating":-1,"rank":participant.rank}
            }
            else{
                participantsData[participant._id] = {"rating":user.rating,"rank":participant.rank}
            }
        } catch(err){
            console.error(err)
        }
    });
    await Promise.all(promises)
    return participantsData
}
const predict = async (contestSlug)=> {
    try{
        contestData = await contests.getContestRankings(contestSlug)
        if(!contestData)
            return
        // console.log(contestData._id)
        participantsData = await getParticipantsData(contestData.rankings)
        // console.log(contestData.rankings,participantsData)
        for(let i=0;i<contestData.rankings.length;i++){
            const participant = contestData.rankings[i]
            if(participantsData[participant._id].rating===-1){
                continue
            }
            const currentRating = participantsData[participant._id].rating
            const expectedRank = 0.5 + getExpectedRank(contestData.rankings,participantsData,currentRating) //seed
            const GMean = geometricMean(expectedRank,participantsData[participant._id].rank)
            const expectedRating = getRating(contestData.rankings,participantsData,GMean)
            // TODO: handle initial value case of function f
            const delta  = (2/9)*(expectedRating-currentRating)
            const predictedRating = currentRating+delta
            contestData.rankings[i].predicted_rating = predictedRating 
            // console.log(participant._id,currentRating,expectedRank,GMean,expectedRating,delta,predictedRating)
        }
        await Contest.findByIdAndUpdate(contestSlug,contestData)
    } catch(err){
        console.log(err)
    }
}

exports.predict = predict