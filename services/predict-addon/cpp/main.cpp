#include <node.h>
#include <iostream>
#include <vector>
#include "helpers.h"

using namespace v8;
using namespace std;

void PredictRatings(const FunctionCallbackInfo<Value> &args){
    Isolate* isolate = args.GetIsolate();
    Local<Context> context = isolate->GetCurrentContext();
    vector<Rank> rankList = unpackRankList(isolate,args);
    int THREAD_CNT = 1;
    if(args.Length()>1){
        if(!args[1]->IsNumber()){
            isolate->ThrowException(
                Exception::TypeError(
                    String::NewFromUtf8(
                        isolate,"Wrong arguments"
                        ).ToLocalChecked()
                    )
            );
        }
        THREAD_CNT = max(THREAD_CNT,int(args[1]->NumberValue(context).FromMaybe(1)));
    }
    auto sol = Predict(rankList,THREAD_CNT);
    Local<String> result = String::NewFromUtf8(isolate,"Predicted!").ToLocalChecked();
    Local<Array> predictedRatings = packRankList(rankList);

    args.GetReturnValue().Set(predictedRatings);
}

void init(Local<Object> exports) {
    NODE_SET_METHOD(exports,"predict",PredictRatings);
}

NODE_MODULE(predict_addon, init)