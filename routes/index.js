const express = require('express')
const contest = require('../models/contest')
const { fetchContest } = require('../services/contests')
const router = express.Router()

router.get('/',(req,res)=> {
    res.render("index")
})
//fetchContest()

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

module.exports = router