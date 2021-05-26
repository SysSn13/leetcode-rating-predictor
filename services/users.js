const User = require("../models/users")
const fetch = require('node-fetch');
const oneDay = 24 * 60 * 60 * 1000;
const fs =  require("fs")
const BASE_URL = "https://leetcode.com"
const BASE_CN_URL = "https://leetcode-cn.com"

const fetchUserInfo = async function (username,dataRegion="US") {
    try {
        console.log(`fetching user ${username}'s info from leetcode...`)
        let attenedContestCount,rating,globalRanking
        if(dataRegion=="CN"){
            var resp = await fetch(BASE_CN_URL+"/graphql", {
                "headers": {
                  "accept": "*/*",
                  "accept-language": "en",
                  "content-type": "application/json",
                  "sec-ch-ua": "\" Not A;Brand\";v=\"99\", \"Chromium\";v=\"90\", \"Google Chrome\";v=\"90\"",
                  "sec-ch-ua-mobile": "?0",
                  "sec-fetch-dest": "empty",
                  "sec-fetch-mode": "cors",
                  "sec-fetch-site": "same-origin",
                  "sec-gpc": "1",
                  "x-definition-name": "userProfilePublicProfile",
                  "x-operation-name": "userPublicProfile",
                },
                "referrer": "https://leetcode-cn.com/u/ayamt/",
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `{"operationName":"userPublicProfile","variables":{"userSlug":"${username}"},"query":"query userPublicProfile($userSlug: String!) {\\n  userProfilePublicProfile(userSlug: $userSlug) {\\n  profile {\\n      userSlug\\n      realName\\n  contestCount\\n  ranking {\\n  currentLocalRanking\\n        currentGlobalRanking\\n        currentRating\\n}\\n }\\n}\\n}\\n\"}`,
                "method": "POST",
                "mode": "cors"
              })
            resp = await resp.json()
            if(resp.errors){
                return null
            }
            resp  = resp.data.userProfilePublicProfile.profile

            attenedContestCount = resp.contestCount
            if (resp.ranking){
                rating = parseFloat(resp.ranking.currentRating)
                globalRanking = resp.ranking.currentGlobalRanking
            }
        }
        else{
            var resp = await fetch(BASE_URL+"/graphql", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7,ru;q=0.6",
                    "content-type": "application/json",
                    "sec-ch-ua": `" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"`,
                    "sec-ch-ua-mobile": "?0",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "same-origin",
                    "sec-gpc": "1",
                    "x-newrelic-id": "UAQDVFVRGwEAXVlbBAg=",
                },
                "referrerPolicy": "strict-origin-when-cross-origin",
                "body": `{"operationName":"getContestRankingData","variables":{"username":"${username}"},"query":"query getContestRankingData($username: String!) {\\n  userContestRanking(username: $username) {\\n    attendedContestsCount\\n    rating\\n    globalRanking\\n    __typename\\n  }\\n}\\n\"}`,
                "method": "POST",
                "mode": "cors"
            })
        
            resp = await resp.json()
            if (resp.errors){
                return null
            }
            resp = resp.data.userContestRanking
            if(resp){
                attenedContestCount = resp.attendedContestsCount
                rating = resp.rating
                globalRanking = resp.globalRanking
            }    
        }
        var newUser = new User({
            _id: username,
            attendedContestsCount: attenedContestCount,
            rating: rating,
            globalRanking: globalRanking,
            lastUpdated: Date.now()
        })
        const user = await User.findById(username)
        if (user === null) {
            await newUser.save();
            console.log("created new user: "+username)
            
        } else {
            await User.findByIdAndUpdate(username, newUser)
            console.log(`user ${username}'s info updated`)
        }
        return newUser
    } catch (err) {
        console.error(`Error while fetching user ${username}'s info`,err)
        return null
    }
}
const getUser = async (username,dataRegion="US")=>{
    let user = await User.findById(username)
    if (user===null){
        user= await fetchUserInfo(username,dataRegion)
    }
    return user
}
exports.fetchUserInfo = fetchUserInfo
exports.getUser = getUser