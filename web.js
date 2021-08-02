const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const indexRouter = require("./routes/index");

const router = express.Router();
router.use("/", indexRouter);

module.exports = router;
