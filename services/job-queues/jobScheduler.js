const Queue = require("bull");
const Contest = require("../../models/contest");
const contestPredictionQueue = require("./contestPredictionQueue");
const opts = require("../redis");
const { fetchContestsMetaData } = require("../contests");
const scheduler = new Queue("Scheduler", opts);

scheduler.process(async (job, done) => {
    console.log(`Processing scheduler job (Id: ${job.id})...`);
    await fetchContestsMetaData();
    const contests = await Contest.find({}, { rankings: 0 });
    let cnt = 0;

    const getRemainingTime = (endTime) => {
        return Math.max(0, Math.ceil(endTime - Date.now() + 10 * 1000));
    };

    const isLatest = (endTime) => {
        return Date.now() - endTime >= 0;
    };

    const withinAWeek = (endTime) => {
        return Date.now() - endTime <= 7 * 24 * 60 * 60 * 1000;
    };

    contests.forEach((contest) => {
        if (!contest.ratings_predicted && withinAWeek(contest.endTime)) {
            contestPredictionQueue.add(
                { contestSlug: contest._id, latest: isLatest(contest.endTime) },
                {
                    jobId: contest._id,
                    attempts: 5,
                    delay: getRemainingTime(contest.endTime),
                    backoff: 10000,
                }
            );
            cnt++;
        }
    });

    job.progress(100);
    done(null, cnt);
});

scheduler.on("completed", function (job, result) {
    console.log(
        `Scheduler job (job id: ${job.id}) completed! Total scheduled jobs: ${result}`
    );
});

module.exports = scheduler;
