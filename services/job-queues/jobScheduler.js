const Queue = require("bull");
const Contest = require("../../models/contest");
const { User } = require("../../models/user");
const contestPredictionQueue = require("./contestPredictionQueue");
const opts = require("../redis");
const { fetchContestsMetaData } = require("../contests");
const {
    convertDateYYYYMMDD,
    IsLatestContest,
    getRemainingTime,
} = require("../../helpers");
const scheduler = new Queue("Scheduler", opts);

scheduler.process("contestScheduler", async (job, done) => {
    console.log(`Processing ${job.name} job (Id: ${job.id})...`);
    await fetchContestsMetaData();
    const contests = await Contest.find({}, { rankings: 0 });
    let cnt = 0;

    contests.forEach((contest) => {
        let remainingTime = getRemainingTime(contest.endTime);
        if (remainingTime > 0) {
            remainingTime += 5 * 60 * 1000; // 5 minutes delay for upcoming contests
        }
        if (!contest.ratings_predicted && IsLatestContest(contest.endTime)) {
            contestPredictionQueue.add(
                "predictRatings",
                {
                    contestSlug: contest._id,
                },
                {
                    jobId: contest._id,
                    attempts: 5,
                    delay: remainingTime,
                    backoff: 10000,
                    priority: 1,
                }
            );
            cnt++;
        }
    });

    job.progress(100);
    done(null, cnt);
});

scheduler.process("updateUserDataScheduler", async (job, done) => {
    console.log(`Processing ${job.name} job (Id: ${job.id})...`);
    const totalUsers = await User.estimatedDocumentCount({});
    const { rateLimit, limit } = job.data;
    let cnt = 0;
    console.log("Total users:", totalUsers);

    for (let i = 0; i < totalUsers; i += limit) {
        const date = new Date();
        const hoursWindow = date.getHours() / 4;
        const jobId = `updateUsers|${i}-${
            i + limit
        }|${hoursWindow}|${convertDateYYYYMMDD(date)}`;

        contestPredictionQueue.add(
            "updateUserData",
            {
                limit,
                offset: i,
                rateLimit,
            },
            {
                jobId,
                attempts: 5,
                backoff: 10000,
            }
        );
        cnt++;
    }
    job.progress(100);
    done(null, cnt);
});

scheduler.on("completed", function (job, result) {
    console.log(
        `${job.name} job (job id: ${job.id}) completed! Total scheduled jobs: ${result}`
    );
});

module.exports = scheduler;
