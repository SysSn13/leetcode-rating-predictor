const Contest = require("../models/contest");

exports.get = function (req, res) {
    if (!req.query.contestId || !req.query.handles) {
        res.status(400).send("Invalid query params");
        return;
    }
    const contestId = req.query.contestId;
    const handles = req.query.handles
        .split(";")
        .map((handle) => {
            return handle.trim();
        })
        .filter((handle) => handle != "");
    handles.length = Math.min(handles.length, 25);

    Contest.aggregate(
        [
            {
                $project: {
                    contest_id: 1,
                    _id: 1,
                    "rankings._id": 1,
                    "rankings.delta": 1,
                    "rankings.data_region": 1,
                },
            },
            { $match: { _id: contestId } },
            { $unwind: "$rankings" },
            { $match: { "rankings._id": { $in: handles } } },
        ],
        function (err, result) {
            let resp = {};
            if (err) {
                resp.status = "FAILED";
                res.status(500).send(err);
            } else {
                resp.status = "OK";
                resp.meta = {
                    total_count: result.length,
                    contest_id: contestId,
                };
                resp.items = result.map((item) => item.rankings);
                res.send(resp);
            }
        }
    );
};
