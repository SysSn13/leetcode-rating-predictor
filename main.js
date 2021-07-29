if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const expressLayouts = require("express-ejs-layouts");

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);

const db = mongoose.connection;

const app = express();

db.on("error", (error) => console.error(error));
db.once("open", () => {
    console.log("Connected to Mongoose");
});

if (process.env.BACKGROUND == true) {
    const { bullBoardServerAdapter } = require("./background");
    app.use("/bull-board", bullBoardServerAdapter.getRouter());
}
if (process.env.WEB == true) {
    const webRouter = require("./server");
    app.set("view engine", "ejs");
    app.set("views", __dirname + "/views");
    app.set("layout", "layouts/layout");
    app.use(expressLayouts);
    app.use(express.static("public"));
    app.use("/", webRouter);
}

const port = process.env.PORT || 8080;

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Listening on " + port);
});
