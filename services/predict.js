const { updateContestRankings } = require("./contests");
const {
    fetchContestParticipantsData,
    getContestParticipantsData,
} = require("./users");
const Contest = require("../models/contest");
const predictAddon = require("./predict-addon");
const predict = async (job) => {
    console.log(`Fetching contest rankings for ${job.data.contestSlug}`);
    let err = await updateContestRankings(job.data.contestSlug);
    if (err) {
        return err;
    }
    job.progress(30);
    console.log(`Fetching participants in db for ${job.data.contestSlug}`);
    err = await fetchContestParticipantsData(job.data.contestSlug);
    if (err) {
        return err;
    }
    job.progress(60);
    console.log(
        `Collecting participants' predictions data for ${job.data.contestSlug}`
    );
    const participantsData = await getContestParticipantsData(
        job.data.contestSlug,
        job.data.latest
    );

    if (participantsData.length === 0) {
        return new Error("Participants data not found");
    }

    job.progress(70);
    console.log(`Predicting ratings for ${job.data.contestSlug}`);
    const predictedRatings = predictAddon.predict(participantsData, 4);
    job.progress(85);

    console.log(
        `Updating db with predicted ratings for ${job.data.contestSlug}`
    );

    let contest = await Contest.findById(job.data.contestSlug);
    if (!contest) {
        return new Error("Contest not found in db");
    }

    for (
        let i = 0;
        i < contest.rankings.length && i < predictedRatings.length;
        i++
    ) {
        if (predictedRatings[i] != -1) {
            contest.rankings[i].current_rating = participantsData[i].rating;
            contest.rankings[i].delta =
                predictedRatings[i] - participantsData[i].rating;
        }
    }
    contest.lastUpdated = Date.now();
    contest.ratings_predicted = true;
    job.progress(90);
    await contest.save();
    job.progress(100);
};

exports.predict = predict;
