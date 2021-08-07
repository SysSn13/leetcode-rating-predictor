const predictQueue = require("./services/job-queues/contestPredictionQueue");
const jobScheduler = require("./services/job-queues/jobScheduler");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const serverAdapter = new ExpressAdapter();

const bullBoard = createBullBoard({
    queues: [new BullAdapter(predictQueue), new BullAdapter(jobScheduler)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath("/bull-board");

const initScheduler = async () => {
    await jobScheduler.add("contestScheduler", {});
    await jobScheduler.add("updateUserDataScheduler", {
        rateLimit: 3,
        limit: 1000,
    });

    // repeat contestScheduler every day at midnight
    await jobScheduler.add(
        "contestScheduler",
        {},
        { repeat: { cron: "0 0 * * *" } }
    );

    // Repeat updateUserDataScheduler every 4 hours
    await jobScheduler.add(
        "updateUserDataScheduler",
        { rateLimit: 3, limit: 1000 },
        { repeat: { cron: "0 */4 * * *" } }
    );
};

initScheduler();

module.exports.bullBoardServerAdapter = serverAdapter;
