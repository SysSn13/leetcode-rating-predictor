const predictQueue = require("./services/job-queues/contestPredictionQueue");
const jobScheduler = require("./services/job-queues/jobScheduler");
const { createBullBoard } = require("@bull-board/api");
const { BullAdapter } = require("@bull-board/api/bullAdapter");
const { ExpressAdapter } = require("@bull-board/express");

const serverAdapter = new ExpressAdapter();

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
    queues: [new BullAdapter(predictQueue), new BullAdapter(jobScheduler)],
    serverAdapter: serverAdapter,
});

serverAdapter.setBasePath("/bull-board");

const initScheduler = async () => {
    await jobScheduler.add({});
    await jobScheduler.add({}, { repeat: { cron: "0 0 * * *" } });
};
initScheduler();

module.exports.bullBoardServerAdapter = serverAdapter;
