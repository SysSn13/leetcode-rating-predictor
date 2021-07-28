if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.set("useFindAndModify", false);

const db = mongoose.connection;

db.on("error", (error) => console.error(error));
db.once("open", () => {
    console.log("Connected to Mongoose");

    if (process.env.WEB == true) {
        require("./server");
    }
    if (process.env.BACKGROUND == true) {
        require("./background");
    }
});
