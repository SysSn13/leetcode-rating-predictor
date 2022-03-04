const js2xmlparser = require("js2xmlparser");

const Contest = require("../models/contest");

const HOST = process.env.HOST || "https://lcpredictor.herokuapp.com/";
let sitemapXML;
exports.get = async function (req, res) {
    if (sitemapXML) {
        res.set("Content-Type", "text/xml");
        res.status(200);
        res.send(sitemapXML);
        return;
    }
    console.log("Generating Sitemap...");
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
        loc: HOST,
        lastmod: formatedDate(new Date(Date.now())),
        changefreq: "weekly",
        priority: "1.0",
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
                loc: HOST + `contest/${contest._id}/ranking/${i}`,
                lastmod: formatedDate(new Date(contest.lastUpdated)),
                priority: i == 1 ? 0.9 : 0.8,
            });
        }
    });

    const col = {
        "@": {
            xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
        },
        url: collection,
    };
    sitemapXML = js2xmlparser.parse("urlset", col);
    res.set("Content-Type", "text/xml");
    res.status(200);
    res.send(sitemapXML);
};
