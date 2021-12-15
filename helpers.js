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

exports.generatePagination = (total,current)=>{
    let result = []
    let rem = 5;
    let start = Math.max(current-(2+Math.max(0,2-(total-current))),1);
    if(start>1){
        result.push(1);
    }
    if(start>2){
        result.push(-1);
    }
    for(let i=start;i<=current;i++){
        result.push(i);
    }
    rem -= current-start+1;
    for(let i=current+1;i<=current+rem && i<=total;i++){
        result.push(i);
    }
    if(current+rem<total-1){
        result.push(-1);
    }
    if(current+rem<total){
        result.push(total);
    }
    return result;
};