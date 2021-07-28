const fs = require("fs");
const filePath = "./test/weekly-contest-242.json";
const data = JSON.parse(fs.readFileSync(filePath));

const addon = require("../build/Release/predict_addon");

let predictedRatings = [];
console.time("rating predictions (C++)");
predictedRatings = addon.predict(data, 1);
console.timeEnd("rating predictions (C++)");

// calculates mean square error
const MSE = (predictedRatings) => {
    let mse = 0.0,
        total = data.length;
    data.forEach((ele, index) => {
        if (ele.rating !== -1) {
            mse += Math.pow(ele.actualRating - predictedRatings[index], 2);
        } else {
            total--;
        }
    });
    mse /= total;
    console.log("MSE: ", mse);
};

MSE(predictedRatings);

// predicts ratings for the given data (Js implementation)
const predictJs = (data) => {
    const getRating = (GMean) => {
        let l = 1,
            r = 100000,
            mid,
            seed;
        while (r - l > 0.1) {
            mid = l + (r - l) / 2;
            seed = 1 + getExpectedRank(mid);
            if (seed > GMean) {
                l = mid;
            } else {
                r = mid;
            }
        }
        return mid;
    };

    const getExpectedRank = (userRating) => {
        let seed = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].rating !== -1) {
                seed += meanWinningPercentage(data[i].rating, userRating);
            }
        }
        return seed;
    };

    const meanWinningPercentage = (ratingA, ratingB) => {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    };

    const geometricMean = (eRank, rank) => {
        return Math.sqrt(eRank * rank);
    };

    let result = new Array(data.length);
    const calculate = (i) => {
        if (data[i].rating === -1) return;
        const expectedRank = 0.5 + getExpectedRank(data[i].rating);
        const GMean = geometricMean(expectedRank, i + 1);
        const expectedRating = getRating(GMean);
        let delta = expectedRating - data[i].rating;
        if (data[i].isFirstContest) delta *= 0.5;
        else delta = (delta * 2) / 9;
        result[i] = data[i].rating + delta;
        // console.log(
        //     i + 1,
        //     "=> Expected Rank: ",
        //     expectedRank,
        //     " GMean: ",
        //     GMean,
        //     " expectedRating: ",
        //     expectedRating,
        //     " Delta: ",
        //     delta,
        //     " New rating: ",
        //     result[i]
        // );
    };

    for (let i = 0; i < data.length; i++) {
        calculate(i);
    }
    return result;
};

console.time("rating predictions (Js)");
predictedRatings = predictJs(data);
console.timeEnd("rating predictions (Js)");
MSE(predictedRatings);

// Js time: 200.617 sec

// function to calculate the r squared
const calculateRSquared = () => {
    let r = 0.0,
        sigmaXY = 0.0,
        sigmaX = 0.0,
        sigmaY = 0.0,
        sigmaXX = 0.0,
        sigmaYY = 0.0;

    data.forEach((ele, index) => {
        if (ele.rating !== -1) {
            sigmaXY += ele.actualRating * predictedRatings[index];
            sigmaX += ele.actualRating;
            sigmaY += predictedRatings[index];
            sigmaXX += ele.actualRating * ele.actualRating;
            sigmaYY += predictedRatings[index] * predictedRatings[index];
        }
    });
    let n = data.length;
    r =
        (n * sigmaXY - sigmaX * sigmaY) /
        Math.sqrt(
            (n * sigmaXX - sigmaX * sigmaX) * (n * sigmaYY - sigmaY * sigmaY)
        );
    console.log("r-squared: ", Math.pow(r, 2));
};

calculateRSquared();
