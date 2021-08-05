chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete" &&
        /^https:\/\/leetcode.com\/contest\/.*\/ranking\//.test(tab.url)
    ) {
        chrome.scripting
            .executeScript({
                target: { tabId: tabId },
                files: ["./foreground.js"],
            })
            .then(() => {
                console.log(
                    `Injected the foreground script into tab: ${tabId}`
                );
            })
            .catch((err) => console.error(err));
    }
});

const BASE_URL = new URL("http://127.0.0.1:8080/api/v1/predictions"); // TODO: replace it

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "get_predictions") {
        const url = BASE_URL;
        url.searchParams.set("contestId", request.data.contestId);
        let handles = "";
        request.data.handles.forEach((handle, index) => {
            handles +=
                handle + (index !== request.data.handles.length - 1 ? ";" : "");
        });
        url.searchParams.set("handles", handles);
        fetch(url)
            .then((res) => res.json())
            .then((res) => {
                sendResponse(res);
            })
            .catch((err) => console.error(err));
        return true;
    }
});
