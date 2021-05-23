const mongoose = require('mongoose');
const Schema = mongoose.Schema

const ContestRankingsSchema = new Schema({
    _id: String,
    contest_id: Number,
    lastUpdated:{
        type: Date,
        default: Date.now()
    },
    rankings : [{
        _id: String,
        user_slug: String,
        country_code: String,
        country_name: String,
        rank: Number,
    }]
})


module.exports = mongoose.model('Contest',ContestRankingsSchema)
