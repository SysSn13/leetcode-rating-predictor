if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}
const express = require("express");
const rateLimit = require("express-rate-limit");
const unless = require("express-unless");

const expressLayouts = require("express-ejs-layouts");
expressLayouts.unless = unless;

const bodyParser = require("body-parser");

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

const limiter = rateLimit({
    max: process.env.RATE_LIMIT || 50,
    windowMs: process.env.RATE_LIMIT_WINDOW || 10 * 1000,
    message: "Too many requests, please try again later.",
});
app.enable("trust proxy");
app.use(limiter);

// body limit
app.use(express.json({ limit: "10kb" }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
    expressLayouts.unless({
        path: [/\/bull-board*/],
    })
);
app.set("layout", "layouts/layout");
app.set("layout extractScripts", true);

// background
if (process.env.BACKGROUND == true) {
    const { bullBoardServerAdapter } = require("./background");
    const { ensureLoggedIn } = require("connect-ensure-login");
    const passport = require("passport");
    const session = require("express-session");
    app.use(session({ secret: process.env.SESSION_SECRET }));
    app.use(passport.initialize({}));
    app.use(passport.session({}));
    const authRouter = require("./routes/auth");
    app.use("/login", authRouter);
    app.use(
        "/bull-board",
        ensureLoggedIn("/login"),
        bullBoardServerAdapter.getRouter()
    );
    console.info("BACKGROUND is up.");
}

// web
if (process.env.WEB == true) {
    const webRouter = require("./web");
    app.use("/", webRouter);
    console.info("WEB is up.");
}

// api
if (!process.env.API_DISABLED) {
    const apiLimiter = rateLimit({
        max: process.env.API_RATE_LIMIT || 20,
        windowMs: process.env.API_RATE_LIMIT_WINDOW || 10 * 1000,
        message: "Too many requests, please try again later.",
        // keyGenerator: function (req) {
        //     return req.ip;
        // },
    });
    app.use("/api/", apiLimiter);
    const apiRoutes = require("./routes/api");
    app.use("/api/v1/", apiRoutes);
    console.info("API is up.");
}

// 404 page
app.use((req, res) => {
    res.status(404).render("errors/404", {
        title: "404 Not Found",
    });
});

const port = process.env.PORT || 8080;

app.listen(port, (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.info("Listening on " + port);
});
