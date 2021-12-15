const { isNumeric,generatePagination } = require("../helpers");
const Contest = require("../models/contest");

exports.get = async function (req, res) {
    try {
        let entries = 25;
        let { contestSlug, page } = req.params;
        const country = req.query.country || "ALL";
        const firstPage = req.query.firstPage;

        if (firstPage || page == null) {
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
        let contest;
        if(country!=="ALL"){
            contest = await Contest.aggregate(
                [
                    {
                        $project: {
                            rankings_fetched:1,
                            user_num:1,
                            _id: 1,
                            title: 1,
                            rankings:1,
                        },
                    },
                    { $match: { _id: contestSlug } },
                    {$addFields:{
                        "rankings":{
                            $filter:{
                                input:"$rankings",
                                as:"ranking",
                                cond:{$eq:["$$ranking.country_code",country]}
                            }
                        },
                        
                    }},
                    {$addFields:{
                        "user_num": {$size:"$rankings"},
                    }},
                    {$addFields:{
                        "rankings":{
                            $slice:["$rankings",toSkip,entries],
                        }
                    }}
                ]);
                if(contest && contest.length!==0){
                    contest = contest[0]
                }
                else{
                    contest = NULL;
                }
        }
        else{
            contest = await Contest.findOne(
                { _id: contestSlug },
                {
                    rankings: { $slice: [toSkip, entries] },
                    title: 1,
                    user_num: 1,
                    rankings_fetched: 1,
                }
            );
        }
        
        if (!contest || !contest.rankings_fetched) {
            res.sendStatus(404);
            return;
        }
        const totalPages = Math.ceil(contest.user_num / 25);
        if (totalPages>0 && page > totalPages) {
            res.sendStatus(404);
            return;
        }
        const pages = generatePagination(totalPages,page);
        const params = new URLSearchParams({
            country,
        });
        res.render("ranking", {
            contest,
            totalPages,
            page,
            pages,
            searchResult: false,
            title: `${contest.title} | Leetcode Rating Predictor`,
            params:params.toString()
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
