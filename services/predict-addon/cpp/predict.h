#include <vector>
#include <math.h>
#include <iostream>
#include <thread>
using namespace std;

struct Rank{
    double currentRating;
    double predictedRating;
    bool isFirstContest;
};

// reference: https://leetcode.com/discuss/general-discussion/468851/New-Contest-Rating-Algorithm-(Coming-Soon)

class Predict{
    
    public:

    Predict(vector<Rank> &data,int THREAD_CNT){
        int n = data.size();
        if(n==0)
            return;
        auto calculate = [this](vector<Rank> &data,int l,int r){
            for(int i=l;i<r;i++){
                if(data[i].currentRating==-1)
                    continue;
                const double expectedRank = 0.5 + getExpectedRank(data,data[i].currentRating);
                const double GMean = geometricMean(expectedRank,i+1);
                const double expectedRating = getRating(data,GMean);
                double delta = expectedRating - data[i].currentRating;
                if(data[i].isFirstContest)
                    delta *= 0.5;
                else delta = (delta*2)/9;
                data[i].predictedRating = data[i].currentRating + delta;   
                // cout<<i+1<<"=> Expected Rank: "<<expectedRank<<" GMean: "<<GMean<<" expectedRating: "<<expectedRating<<" Delta: "<<delta<<" New rating: "<<data[i].predictedRating<<endl;
            }
        };
        int itemsPerThread = n/THREAD_CNT;

        vector<thread> threads;
        for(int i=0;i<n;i+=itemsPerThread){
            threads.emplace_back(thread(calculate,ref(data),i,min(i+itemsPerThread,n)));
        }
        for(auto &th:threads){
            th.join();
        }
    }

    private:

    double getRating(vector<Rank> &data,double GMean){
        double l = 1,r=1e6,mid,seed;
        while(r-l>0.1){
            mid = l + (r-l)/2;
            seed = 1 + getExpectedRank(data,mid);
            if(seed > GMean){
                l = mid; // to reduce seed -> increase ERating
            } else {
                r = mid; // to increase seed -> decrease ERating
            }
        }
        return mid;
    }

    double getExpectedRank(vector<Rank> &data,double userRating){
        //  sum over all participants' probabilities to win
        double seed = 0;
        for(int i=0;i<(int)data.size();i++){
            if(data[i].currentRating !=-1){
                seed += meanWinningPercentage(data[i].currentRating,userRating);
            }
        }
        return seed;
    }

    double meanWinningPercentage(double ratingA,double ratingB){
        return 1/(1+pow(10,(ratingB-ratingA)/400));
    }
  
    double geometricMean(double eRank,double rank){
        return sqrt(eRank*rank);
    }
};