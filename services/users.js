const User = require("../models/users")
const fetch = require('node-fetch');
const oneDay = 24 * 60 * 60 * 1000;
const getUserInfo = async function (username) {
    try {
        const user = await User.findById(username)
        if (user === null || Date.now() - user.lastUpdated >= oneDay) {
            console.log(`fetching user ${username}'s info from leetcode...`)
            var resp = await fetch("https://leetcode.com/graphql", {
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
            const attenedContestCount = resp.data.userContestRanking.attendedContestsCount
            const rating = resp.data.userContestRanking.rating
            const globalRanking = resp.data.userContestRanking.globalRanking
            var newUser = new User({
                _id: username,
                attendedContestsCount: attenedContestCount,
                rating: rating,
                globalRanking: globalRanking,
                lastUpdated: Date.now()
            })

            if (user === null) {
                newDate = await newUser.save();
                console.log("created new user: "+username)
            } else {
                await User.findByIdAndUpdate(username, newUser)
                console.log(`user ${username}'s info updated`)
            }
            return newUser
        } else {
            return user
        }

    } catch (err) {
        console.error(err)
    }
}

module.exports = getUserInfo