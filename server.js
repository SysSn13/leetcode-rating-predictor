const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));
const expressLayouts = require("express-ejs-layouts");
const indexRouter = require("./routes/index");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.set("layout", "layouts/layout");
app.use(expressLayouts);
app.use(express.static("public"));
app.use("/", indexRouter);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", (err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("Listening on " + port);
});
