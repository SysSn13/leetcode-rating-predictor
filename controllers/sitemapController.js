const Contest = require("../models/contest");
const { SitemapStream, streamToPromise } = require("sitemap");
const { createGzip } = require("zlib");

const HOST = process.env.HOST || "https://lcpredictor.herokuapp.com/";

const getURLsCollection = async () => {
    const collection = [];
    const formatedDate = function (date) {
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        if (month < 10) {
            month = "0" + month;
        }
        if (day < 10) {
            day = "0" + day;
        }

        return year + "-" + month + "-" + day;
    };

    collection.push({
        url: "/",
        lastmod: formatedDate(new Date(Date.now())),
        changefreq: "weekly",
        priority: 1,
    });
    contests = await Contest.find({}, { rankings: 0 });

    contests.forEach((contest) => {
        user_num = contest.user_num;
        if (user_num == undefined) {
            return;
        }
        totalPages = Math.ceil(user_num / 25);

        for (let i = 1; i <= totalPages; i++) {
            collection.push({
                url: `/contest/${contest._id}/ranking/${i}`,
                lastmod: new Date(contest.lastUpdated),
                priority: i == 1 ? 0.9 : 0.8,
            });
        }
    });
    return collection;
};

let sitemapXML;
exports.get = async function (req, res) {
    res.header("Content-Encoding", "gzip");
    // if we have a cached entry send it
    if (sitemapXML) {
        res.send(sitemapXML);
        return;
    }
    try {
        console.log("Generating Sitemap...");
        const smStream = new SitemapStream({ hostname: HOST });
        const pipeline = smStream.pipe(createGzip());
        const collection = await getURLsCollection();
        collection.forEach((ele) => {
            smStream.write(ele);
        });
        // cache the response
        streamToPromise(pipeline).then((sm) => (sitemapXML = sm));

        smStream.end();

        // stream write the response
        pipeline.pipe(res).on("error", (e) => {
            console.error(e);
        });
    } catch (e) {
        console.error(e);
        res.status(500).end();
    }
};
