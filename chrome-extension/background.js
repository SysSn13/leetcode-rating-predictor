chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete" &&
        /^https:\/\/leetcode.com\/contest\/.+/.test(tab.url)
    ) {
        chrome.scripting
            .executeScript({
                target: {
                    tabId: tabId,
                },
                files: ["./foreground.js"],
            })
            .then(() => {
                console.log(
                    `Injected the foreground script into tab: ${tabId}`
                );
                chrome.tabs.sendMessage(tabId, {
                    message: "url_updated",
                    url: tab.url,
                });
            })
            .catch((err) => console.error(err));
    }
});

const API_URLS = [
    "https://lcpredictor.onrender.com/",
];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_predictions") {
        getPredictions(request.data)
            .then((res) => {
                // console.log(res);
                sendResponse(res);
            })
            .catch((err) => {
                console.error(err);
            });
        return true;
    }
});

async function getPredictions(data) {
    try {
        let urlIndex = await getURL_INDEX();
        if (urlIndex === undefined || urlIndex < 0 || urlIndex >= API_URLS) {
            urlIndex = 0;
        }
        for (let i = 0; i < API_URLS.length; i++) {
            try {
                const ind = (i + urlIndex) % API_URLS.length;
                const url = new URL(API_URLS[ind]);

                url.searchParams.set("contestId", data.contestId);
                let handles = "";
                data.handles.forEach((handle, index) => {
                    handles +=
                        handle + (index !== data.handles.length - 1 ? ";" : "");
                });
                url.searchParams.set("handles", handles);

                const resp = await fetchFromAPI(url);
                setURL_INDEX(ind).catch((err) => {
                    console.error(err);
                });
                return resp;
            } catch (err) {
                console.error(err);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchFromAPI(url, retries = 5) {
    let resp = await fetch(url);
    if (resp.status !== 200) {
        if (retries > 0) {
            resp = await fetchFromAPI(url, retries - 1);
            return resp;
        }
        throw new Error(resp.statusText);
    }
    resp = await resp.json();
    return resp;
}

async function setURL_INDEX(index) {
    try {
        const promise = new Promise((resolve, reject) => {
            chrome.storage.sync.set(
                {
                    url_index: index,
                },
                function () {
                    resolve();
                }
            );
        });
        await promise;
    } catch (err) {
        return err;
    }
}

async function getURL_INDEX() {
    try {
        const promise = new Promise((resolve, reject) => {
            chrome.storage.sync.get(["url_index"], function (result) {
                resolve(result.url_index);
            });
        });
        const index = await promise;
        return index;
    } catch (err) {
        console.error(err);
        return -1;
    }
}
