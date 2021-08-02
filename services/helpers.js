exports.getUserId = function (username, dataRegion = "US") {
    return dataRegion + "/" + username.trim().toLowerCase();
};
