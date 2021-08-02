if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const expressLayouts = require("express-ejs-layouts");

// database
const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => {
    console.info("Connected to Mongoose");
});

const app = express();

// background
if (process.env.BACKGROUND == true) {
    const { bullBoardServerAdapter } = require("./background");
    app.use("/bull-board", bullBoardServerAdapter.getRouter());
    console.info("BACKGROUND is up.");
}

// web
if (process.env.WEB == true) {
    const webRouter = require("./web");
    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.set("layout", "layouts/layout");
    app.use(expressLayouts);
    app.use(express.static("public"));
    app.use("/", webRouter);
    console.info("WEB is up.");
}

// api
if (!process.env.API_DISABLED) {
    const apiRoutes = require("./routes/api");
    app.use("/api/v1/", apiRoutes);
    console.info("API is up.");
}

const port = process.env.PORT || 8080;

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.info("Listening on " + port);
});
