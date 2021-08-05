const { isNumeric } = require("../helpers");
const Contest = require("../models/contest");

exports.get = async function (req, res) {
    try {
        let entries = 25;
        let { contestSlug, page } = req.params;
        if (page == null) {
            page = "1";
        }
        if (!isNumeric(page)) {
            res.sendStatus(404);
            return;
        }
        page = parseInt(page);
        if (page < 1) {
            res.sendStatus(404);
            return;
        }
        let toSkip = (page - 1) * entries;
        let contest = await Contest.findOne(
            { _id: contestSlug },
            {
                rankings: { $slice: [toSkip, entries] },
                title: 1,
                user_num: 1,
                rankings_fetched: 1,
            }
        );

        if (!contest || !contest.rankings_fetched) {
            res.sendStatus(404);
            return;
        }
        const totalPages = Math.ceil(contest.user_num / 25);
        if (page > totalPages) {
            res.sendStatus(404);
            return;
        }
        res.render("ranking", {
            contest,
            totalPages,
            page,
            searchResult: false,
            title: `${contest.title} | Leetcode Rating Predictor`,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

exports.search = async function (req, res) {
    try {
        let { user } = req.body;
        user = user.trim();
        const result = await Contest.aggregate([
            {
                $project: {
                    contest_id: 1,
                    _id: 1,
                    rankings: 1,
                },
            },
            { $match: { _id: req.params.contestSlug } },
            { $unwind: "$rankings" },
            { $match: { "rankings._id": user } },
        ]);
        const searchResult = result.map((item) => item.rankings);
        res.render("ranking", {
            contest: {
                _id: req.params.contestSlug,
                rankings: searchResult,
            },
            page: 1,
            totalPages: 1,
            searchResult: true,
            title: `Search | ${req.params.contestSlug} | Leetcode Rating Predictor`,
        });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};
