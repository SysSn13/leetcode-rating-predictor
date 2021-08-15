const express = require("express");
const Contest = require("../models/contest");
const router = express.Router();
const rankingsController = require("../controllers/rankingsController");
router.get("/", async (req, res) => {
    try {
        let contests = await Contest.find({}, { rankings: 0 }).sort({
            startTime: "desc",
        });

        contests.map((contest) => {
            contest.startTime = new Date(
                contest.startTime.toLocaleString('en-US', {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
            )

            contest.endTime = new Date(
                contest.endTime.toLocaleString('en-US', {
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
            )
        })

        res.render("index", {
            contests: contests,
            title: "Leetcode Rating Predictor",
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

router.get("/contest/:contestSlug/ranking/:page", rankingsController.get);
router.post("/contest/:contestSlug/ranking/search", rankingsController.search);

module.exports = router;
