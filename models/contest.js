const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rankingSchema = new Schema({
    _id: String,
    user_slug: String,
    country_code: String,
    country_name: String,
    data_region: {
        type: String,
        default: "US",
    },
    rank: Number,
    current_rating: {
        type: Number,
        default: null,
    },
    delta: {
        type: Number,
        default: null,
    },
});
const ContestRankingsSchema = new Schema({
    _id: String,
    startTime: Date,
    endTime: Date,
    contest_id: Number,
    user_num: Number,
    rankings_fetched: {
        type: Boolean,
        default: false,
    },
    ratings_predicted: {
        type: Boolean,
        default: false,
    },
    rankings: [rankingSchema],
    lastUpdated: {
        type: Date,
    },
});

module.exports = mongoose.model("Contest", ContestRankingsSchema);
