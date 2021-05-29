const express = require('express')
const contest = require('../models/contest')
const { fetchContest, fetchContestRankings } = require('../services/contests')
const router = express.Router()

//fetchContest()
//fetchContestRankings('weekly-contest-242')
//fetchContestRankings('weekly-contest-240')

router.get('/',async (req,res) => {
    try {
        let contests = await contest.find({}).sort({'startTime':'desc'})
        res.render('contests/index',{contests:contests})
    }
    catch(error) {
        console.log("error has occurred")
        res.send(error.message)
    }
})

router.get('/contests/:contestSlug/ranking/:page', async (req,res) => {
    try {
        let pageCount = 50
        let {contestSlug, page} = req.params
        let intPage = parseInt(page)
        if(page!=intPage){
            throw Error('Page number should be an integer')
        }
        if(page%1){
            intPage++;
        }
        page = intPage
        let toSkip = (page - 1)*pageCount
        let contests = await contest.find({_id:contestSlug}, { 'rankings': { $slice: [toSkip,pageCount] }})
        let totalPages = 100
        if(contests[0]==null){
            throw Error("Invalid Contest")
        }
        if(contests[0].num_user){
            totalPages = parseInt(contests[0].num_user/50)
            if(contests[0].num_user/50%1){
                totalPages++;
            }
        }
        
        //console.log(contests)
        //res.send(contests[0]['rankings'])
        res.render('contests/ranking', {contests,totalPages,page})
    }
    catch(error){
        console.log(error.message)
        res.send(error.message)
    }
})
router.post('/contests/:contestSlug/ranking/search', async (req,res) => {
    try {
        console.log(req.params)
        let {user} = req.body
        let contests = await contest.find({ _id: req.params.contestSlug} )
        console.log(contests)
        let searchUsers = []
        for(let i=0;i<contests[0].rankings.length;i++){
            if(contests[0].rankings[i]._id.includes(user)){
                searchUsers.push(contests[0].rankings[i])
            }
        }
        //console.log(searchUsers)
        //res.send(searchUsers)
        res.render('contests/search', {searchUsers,contestSlug: req.params.contestSlug})
    }
    catch(error){
        console.log(error.message)
        res.send(error.message)
    }
})

module.exports = router