const Queue = require("bull");
const Contest = require("../../models/contest");
const { predict } = require("../predict");
const opts = require("../redis");
const { updateUsers } = require("../users");

opts.lockDuration = 30 * 60 * 1000; // 30 minutes
opts.maxStalledCount = 0;

const predictQueue = new Queue("Predictions", opts);
predictQueue.process("predictRatings", async (job, done) => {
    try {
        console.log(`Processing ${job.name} job: ${job.id}`);
        const contest = await Contest.findById(job.data.contestSlug, {
            ratings_predicted: 1,
        });
        if (contest && contest.ratings_predicted) {
            done(null, { message: "skipped (already predicted)" });
            return;
        }
        const err = await predict(job);
        if (err) {
            console.error(err);
            done(err);
        }
        done(null, { message: "DONE" });
    } catch (err) {
        done(err);
    }
});

predictQueue.process("updateUserData", async (job, done) => {
    try {
        const predictRatingJobScheduled = await checkPredictRatingJobs();
        if (predictRatingJobScheduled) {
            done(
                new Error(
                    "PredictRating job is scheduled. Cannot process this job right now."
                )
            );
            return;
        }
        console.log("Processing job: ", job.id);
        const err = await updateUsers(job);
        if (err) {
            console.error(err);
            done(err);
        } else {
            done();
        }
    } catch (err) {
        done(err);
    }
});

// funtion to check if any predictRating job is scheduled
const checkPredictRatingJobs = async () => {
    let jobs = await predictQueue.getJobs([
        "active",
        "waiting",
        "delayed",
        "failed",
    ]);
    jobs = jobs.filter((job) => job.name === "predictRatings");
    let date = new Date();
    date.setDate(date.getDate() + 30);
    for (job of jobs) {
        date = Math.min(date, new Date(job.opts.timestamp + job.opts.delay));
    }
    return date - Date.now() <= 1 * 60 * 60 * 1000;
};

predictQueue.on("completed", (job, result) => {
    console.log(`${job.name} Job: ${job.id} completed.`);
});

module.exports = predictQueue;
