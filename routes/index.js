const express = require('express')
const contest = require('../models/contest')
const { fetchContest, fetchContestRankings } = require('../services/contests')
const router = express.Router()

router.get('/',(req,res)=> {
    res.render("index")
})
//fetchContest()
//fetchContestRankings('weekly-contest-242')

router.get('/contests',async (req,res) => {
    try {
        let contests = await contest.find({})
        res.render('contests/index',{contests:contests})
    }
    catch(error) {
        console.log("SHITTT")
        res.send(error.message)
    }
})

router.get('/contests/:contestSlug/ranking/:page', async (req,res) => {
    try {
        let pageCount = 50
        let {contestSlug, page} = req.params
        let toSkip = (page - 1)*pageCount
        let contests = await contest.find({_id:contestSlug}, { 'rankings': { $slice: [toSkip,pageCount] }})
        let totalPages = 100
        if(contests[0].num_user){
            totalPages = contests[0].num_user/50
        }
        
        console.log(contests)
        //res.send(contests[0]['rankings'])
        res.render('contests/ranking', {contests,totalPages,page})
    }
    catch(error){
        console.log(error.message)
        res.send(error.message)
    }
})


module.exports = router