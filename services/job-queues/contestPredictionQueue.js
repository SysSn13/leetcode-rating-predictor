const Queue = require("bull");
const { predict } = require("../predict");
const opts = require("../redis");

const predictQueue = new Queue("Predictions", opts);
predictQueue.process(async (job, done) => {
    console.log("Processing job: ", job.id);
    const err = await predict(job);
    if (err) {
        done(err);
    }
    done();
});

predictQueue.on("completed", (job, result) => {
    console.log(`Prediction Job: ${job.id} completed.`);
});

module.exports = predictQueue;
