const fetch = require("node-fetch");

describe("Rate limit tests", () => {
    jest.setTimeout(20 * 1000);
    const itr = 10;

    test("Rate limit for web enpoints", async () => {
        const url = "http://127.0.0.1:8080/";
        const limit = 50;
        let success = 0;
        for (let i = 0; i < itr; i++) {
            let promises = [];
            for (let j = 0; j < 100; j++) {
                promises.push(
                    new Promise((resolve, reject) => {
                        fetch(url)
                            .then((res) => {
                                resolve(res.status !== 429);
                            })
                            .catch((err) => {
                                console.error(err);
                                reject();
                            });
                    })
                );
            }
            const resp = await Promise.all(promises);
            resp.forEach((res) => {
                if (res) {
                    success++;
                }
            });
        }
        expect(success).toBeLessThanOrEqual(limit);
    });
    it("wait for new window", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
    });

    test("Rate limit for api enpoints", async () => {
        const url = "http://127.0.0.1:8080/api/v1/ping";
        const limit = 20;
        let success = 0;
        for (let i = 0; i < itr; i++) {
            let promises = [];
            for (let j = 0; j < 100; j++) {
                promises.push(
                    new Promise((resolve, reject) => {
                        fetch(url)
                            .then((res) => {
                                resolve(res.status !== 429);
                            })
                            .catch((err) => {
                                console.error(err);
                                reject();
                            });
                    })
                );
            }
            const resp = await Promise.all(promises);
            resp.forEach((res) => {
                if (res) {
                    success++;
                }
            });
        }
        expect(success).toBeLessThanOrEqual(limit);
    });
});
