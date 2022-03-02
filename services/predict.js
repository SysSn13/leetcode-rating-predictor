const { fetchContestRankings } = require("./contests");
const { getContestParticipantsData } = require("./users");
const Contest = require("../models/contest");
const predictAddon = require("./predict-addon");
const THREAD_CNT = Number(process.env.THREAD_CNT) || 4;

const predict = async (job) => {
    try {
        console.time(`Predictions (${job.data.contestSlug})`);
        let contest, participantsData, err;
        console.log(`Fetching contest rankings (${job.data.contestSlug})...`);
        console.time(`fetchContestRankings(${job.data.contestSlug})`);
        [contest, err] = await fetchContestRankings(job.data.contestSlug);
        console.timeEnd(`fetchContestRankings(${job.data.contestSlug})`);
        if (err) {
            return err;
        }
        job.progress(30);

        console.log(`Fetching participants' data(${job.data.contestSlug})...`);
        console.time(`getContestParticipantsData(${job.data.contestSlug})`);
        participantsData = await getContestParticipantsData(contest);
        console.timeEnd(`getContestParticipantsData(${job.data.contestSlug})`);

        if (participantsData.length === 0) {
            return new Error(
                `Participants data not found (${job.data.contestSlug})`
            );
        }

        job.progress(70);
        console.log(`Predicting ratings for ${job.data.contestSlug}...`);
        console.time(`Predict ratings(${job.data.contestSlug})`);
        const predictedRatings = predictAddon.predict(
            participantsData,
            THREAD_CNT
        );
        console.timeEnd(`Predict ratings(${job.data.contestSlug})`);

        job.progress(85);

        console.log(
            `Updating db with predicted ratings (${job.data.contestSlug})...`
        );
        console.time(`Update db(${job.data.contestSlug})`);
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
        console.timeEnd(`Update db(${job.data.contestSlug})`);
        console.timeEnd(`Predictions (${job.data.contestSlug})`);
    } catch (err) {
        return err;
    }
};

exports.predict = predict;
