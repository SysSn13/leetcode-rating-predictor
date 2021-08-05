if (!window.CFPredictorInjected) {
    window.CFPredictorInjected = true;
    let predictionsTimer;
    let isListenerActive = false;
    const setEventListener = () => {
        try {
            const tbody = document.querySelector("tbody");
            if (!tbody) {
                setTimeout(setEventListener, 100);
                return;
            }
            const trs = tbody.querySelectorAll("tr");
            if (!trs) {
                setTimeout(setEventListener, 100);
                return;
            }
            if (trs.length <= 1) {
                // listen only if there is more than one row
                isListenerActive = false;
                return;
            }
            const tds = trs[1].querySelectorAll("td");
            if (tds.length <= 1) {
                isListenerActive = false;
                return;
            }
            if (isListenerActive) return;
            isListenerActive = true;
            tds[1].addEventListener("DOMCharacterDataModified", async () => {
                window.clearTimeout(predictionsTimer);
                predictionsTimer = setTimeout(fetchPredictions, 500);
            });
        } catch (err) {
            console.error(err);
        }
    };

    const isContestRankingPage = (url) => {
        return /^https:\/\/leetcode.com\/contest\/.*\/ranking/.test(url);
    };

    let rowsChanged = new Map();
    let deltaTHInserted = false;

    const fetchPredictions = async () => {
        const thead = document.querySelector("thead");
        if (!thead) {
            predictionsTimer = setTimeout(fetchPredictions, 500);
            return;
        }

        const tbody = document.querySelector("tbody");
        if (!tbody) {
            predictionsTimer = setTimeout(fetchPredictions, 500);
            return;
        }

        const rows = tbody.querySelectorAll("tr");
        if (!rows) {
            predictionsTimer = setTimeout(fetchPredictions, 500);
            return;
        }
        let contestId;
        try {
            contestId = document
                .querySelector(".ranking-title-wrapper")
                .querySelector("span")
                .querySelector("a")
                .innerHTML.toLowerCase()
                .replace(/\s/g, "-");
        } catch {
            predictionsTimer = setTimeout(fetchPredictions, 500);
            return;
        }
        const handlesMap = new Map();

        const handles = [...rows].map((row, index) => {
            try {
                const tds = row.querySelectorAll("td");
                if (tds.length >= 2) {
                    let handle, url;
                    try {
                        handle = tds[1].querySelector("a").innerText.trim();
                        url = tds[1].querySelector("a").getAttribute("href");
                    } catch {
                        handle = tds[1].querySelector("span").innerText.trim();
                        url = ""; // TODO: get data_region in this case
                    }
                    const data_region = /^https:\/\/leetcode-cn.com/.test(url)
                        ? "CN"
                        : "US";
                    handlesMap.set(
                        (data_region + "/" + handle).toLowerCase(),
                        index
                    );
                    return handle;
                }
            } catch (err) {
                console.debug(err);
            }
        });

        chrome.runtime.sendMessage(
            {
                message: "get_predictions",
                data: {
                    contestId,
                    handles,
                },
            },
            (response) => {
                if (!response) {
                    return;
                }
                try {
                    if (response.status === "OK") {
                        if (!deltaTHInserted && response.meta.total_count) {
                            const th = document.createElement("th");
                            th.innerText = "Δ";
                            thead.querySelector("tr").appendChild(th);
                            deltaTHInserted = true;
                        }
                        const rowsUpdated = new Map();
                        for (item of response.items) {
                            try {
                                const id = (
                                    item.data_region +
                                    "/" +
                                    item._id
                                ).toLowerCase();
                                if (handlesMap.has(id)) {
                                    const rowIndex = handlesMap.get(id);
                                    const row = rows[rowIndex];
                                    let td;
                                    if (rowsChanged.has(rowIndex)) {
                                        td = row.lastChild;
                                    } else {
                                        td = document.createElement("td");
                                    }
                                    if (item.delta == null) {
                                        td.innerText = "?";
                                        td.style.color = "gray";
                                    } else {
                                        const delta =
                                            Math.round(item.delta * 100) / 100;
                                        td.innerText =
                                            delta > 0 ? "+" + delta : delta;
                                        if (delta > 0) {
                                            td.style.color = "green";
                                        } else {
                                            td.style.color = "gray";
                                        }
                                        // td.style.fontWeight = "bold";
                                    }
                                    if (!rowsChanged.has(rowIndex)) {
                                        row.appendChild(td);
                                    }
                                    rowsUpdated.set(rowIndex, true);
                                }
                            } catch (err) {
                                console.warn(err);
                            }
                        }
                        for (rowIndex of rowsChanged.keys()) {
                            if (
                                !rowsUpdated.has(rowIndex) &&
                                rowIndex < rows.length
                            ) {
                                try {
                                    const row = rows[rowIndex];
                                    row.lastChild.innerText = "";
                                } catch {}
                            }
                            if (rowIndex >= rows.length) {
                                rowsChanged.delete(rowIndex);
                            }
                        }
                        for (rowIndex of rowsUpdated.keys()) {
                            rowsChanged.set(rowIndex, true);
                        }
                    }
                } catch (err) {
                    console.warn(err);
                }
            }
        );
    };

    // listen to url changes
    chrome.runtime.onMessage.addListener(function (
        request,
        sender,
        sendResponse
    ) {
        if (request.message === "url_updated") {
            if (!isListenerActive && isContestRankingPage(request.url)) {
                window.clearTimeout(predictionsTimer);
                predictionsTimer = setTimeout(fetchPredictions, 500);
            }
            if (!isContestRankingPage(request.url)) {
                isListenerActive = false;
                rowsChanged.clear();
                deltaTHInserted = false;
            } else {
                setEventListener();
            }
        }
    });
}
