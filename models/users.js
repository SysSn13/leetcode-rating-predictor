const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    _id:{
        type: String
    },
    attendedContestsCount:{
        type: Number,
        default: 0
    },
    rating:{
        type: Number,
        default: 1500
    },
    globalRanking:{
        type: Number,
        default:0
    },
    lastUpdated:{
        type: Date,
        default: Date.now,
    },
})
module.exports = mongoose.model("User",userSchema)