if (!window.CFPredictorInjected) {
    window.CFPredictorInjected = true;
    let predictionsTimer;
    let isListenerActive = false;
    const setEventListener = () => {
        try {
            const tbody = document.querySelector("tbody");
            if (!tbody) {
                setTimeout(setEventListener, 100);
            }
            const trs = tbody.querySelectorAll("tr");
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
            isListenerActive = true;
            tds[1].addEventListener("DOMCharacterDataModified", () => {
                window.clearTimeout(predictionsTimer);
                predictionsTimer = setTimeout(fetchPredictions, 1000);
            });
        } catch (err) {
            console.error(err);
        }
    };

    let rowsChanged = new Map();
    let colInserted = false;

    const fetchPredictions = async () => {
        const thead = document.querySelector("thead");
        if (!thead) {
            predictionsTimer = setTimeout(fetchPredictions, 100);
            return;
        }
        console.log("fetching!");
        const tbody = document.querySelector("tbody");
        const rows = tbody.querySelectorAll("tr");
        const contestId = document
            .querySelector(".ranking-title-wrapper")
            .querySelector("span")
            .querySelector("a")
            .innerHTML.toLowerCase()
            .replace(/\s/g, "-");
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
                console.error(err);
            }
        });

        chrome.runtime.sendMessage(
            {
                message: "get_predictions",
                data: { contestId, handles },
            },
            (response) => {
                if (response.status === "OK") {
                    if (!colInserted) {
                        const th = document.createElement("th");
                        th.innerText = "Δ";
                        thead.querySelector("tr").appendChild(th);
                        colInserted = true;
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
                                const delta =
                                    Math.round(item.delta * 100) / 100;
                                td.innerText = delta > 0 ? "+" + delta : delta;
                                if (delta > 0) {
                                    td.style.color = "green";
                                } else {
                                    td.style.color = "gray";
                                }
                                td.style.fontWeight = "bold";

                                if (!rowsChanged.has(rowIndex)) {
                                    row.appendChild(td);
                                }
                                rowsUpdated.set(rowIndex, true);
                            }
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    for (rowIndex of rowsChanged.keys()) {
                        if (!rowsUpdated.has(rowIndex)) {
                            try {
                                const row = rows[rowIndex];
                                row.lastChild.innerText = "";
                            } catch (err) {
                                console.error(err);
                            }
                        }
                    }
                    for (rowIndex of rowsUpdated.keys()) {
                        rowsChanged.set(rowIndex, true);
                    }
                }
            }
        );
    };
    fetchPredictions();
    setEventListener();

    // event listener for "click" event on page-btn class items
    [...document.querySelectorAll(".page-btn")].forEach((item) => {
        item.addEventListener("click", (e) => {
            if (!isListenerActive) {
                setEventListener();
            }
        });
    });
}
