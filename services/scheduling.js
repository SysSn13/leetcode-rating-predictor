const {
    updateContestRankings,
    fetchContestsMetaData,
} = require("../services/contests");
const schedule = require("node-schedule");

//Variables For testing
const jobScheduleTime = {
    hour: 00,
    minute: 00,
};
const contestScheduleCall = {
    start: Date.now(),
    end: Date.now() + 1000 * 60 * 60,
    rule: "*/5 * * * *",
};

const job = schedule.scheduleJob(
    {
        hour: 00,
        minute: 00,
    },
    async function () {
        let contestList = await fetchContestsMetaData();
        for (let i = 0; i < contestList.length; i++) {
            if (
                Date.now() + 1000 * 60 * 60 * 24 > contestList[i].startTime &&
                Date.now() < contestList[i].startTime
            ) {
                const event = schedule.scheduleJob(
                    {
                        start: contestList[todaysContest].startTime,
                        end: contestList[todaysContest].endTime,
                        rule: "*/5 * * * *",
                    },
                    async function () {
                        getContestRankings(contestList[i].titleSlug);
                    }
                );
            }
            let endTime =
                contestList[i].startTime * 1000 +
                contestList[i].duration * 1000;
            if (Date.now() > endTime) {
                await getContestRankings(contestList[i].titleSlug);
            }
        }
    }
);

const fetchAllContests = async function () {
    let contestList = await fetchContestsMetaData();
    if (!contestList) {
        console.log("Not able to get contestsList");
        return;
    }
    let promises = contestList.map(async (contest) => {
        let endTime = contest.startTime * 1000 + contest.duration * 1000;
        if (Date.now() > endTime) {
            try {
                var err = await updateContestRankings(contest.titleSlug);
                if (err) {
                    console.error(err);
                }
            } catch (err) {
                console.error(err);
            }
        }
    });
};
exports.fetchAllContests = fetchAllContests;
