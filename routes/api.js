const router = require("express").Router();
const predictionsController = require("../controllers/predictionsController.js");
router.get("/ping", function (req, res) {
    res.json({
        status: "OK",
        message: "pong",
    });
});

router.route("/predictions").get(predictionsController.get);
module.exports = router;
