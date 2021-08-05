const mongoose = require("mongoose")

const contestHistorySchema = new mongoose.Schema({
    _id: String,
    title: String,
    startTime: Number,
    rating: {
        type: Number,
        default:1500,
    },
    ranking:{
        type:Number,
        default: 0
    },
})
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
    contestsHistory: [contestHistorySchema],
    lastUpdated:{
        type: Date,
        default: Date.now,
    },
})

exports.User = mongoose.model("User",userSchema)
exports.ContestHistory = mongoose.model("ContestHistory",contestHistorySchema)