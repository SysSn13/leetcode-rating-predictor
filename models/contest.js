const mongoose = require('mongoose');
const Schema = mongoose.Schema

const ContestRankingsSchema = new Schema({
    _id: String,
    startTime: Date,
    endTime: Date,
    contest_id: Number,
    num_user: Number,
    lastUpdated:{
        type: Date,
    },
    rankings : [{
        _id: String,
        user_slug: String,
        country_code: String,
        country_name: String,
        data_region: {
            type: String,
            default: "US"
        },
        rank: Number,
        current_rating:{
            type: Number,
            default:-1
        },
        predicted_rating:{
            type: Number,
            default:-1
        }
    }]
})


module.exports = mongoose.model('Contest',ContestRankingsSchema)
