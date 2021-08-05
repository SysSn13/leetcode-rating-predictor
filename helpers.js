exports.getUserId = (username, dataRegion = "US") => {
    return dataRegion + "/" + username.trim().toLowerCase();
};

exports.convertDateYYYYMMDD = (date) => {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString();
    var dd = date.getDate().toString();

    var mmChars = mm.split("");
    var ddChars = dd.split("");

    return (
        yyyy +
        "-" +
        (mmChars[1] ? mm : "0" + mmChars[0]) +
        "-" +
        (ddChars[1] ? dd : "0" + ddChars[0])
    );
};

exports.IsLatestContest = (time) => {
    return Date.now() - time <= 2 * 24 * 60 * 60 * 1000;
};

exports.getRemainingTime = (time) => {
    return Math.max(0, Math.ceil(time - Date.now()));
};

exports.isNumeric = (value) => {
    return /^\d+$/.test(value);
};
