const express = require("express");
const Contest = require("../models/contest");
const router = express.Router();
const rankingsController = require("../controllers/rankingsController");
const sitemapController = require("../controllers/sitemapController");

router.get("/", async (req, res) => {
    try {
        let contests = await Contest.find({}, { rankings: 0 }).sort({
            startTime: "desc",
        });

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
router.get("/sitemap.xml", sitemapController.get);
module.exports = router;
