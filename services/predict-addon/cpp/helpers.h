#include <node.h>
#include <vector>
#include "predict.h"
using namespace v8;

Rank unpackRank(Isolate* isolate,const Local<Object> rankObj){
    Local<Context> context = isolate->GetCurrentContext();
    Local<Value> rating = rankObj->Get(context,String::NewFromUtf8(isolate,"rating").ToLocalChecked()).ToLocalChecked();
    Local<Value> isFirstContest = rankObj->Get(context,String::NewFromUtf8(isolate,"isFirstContest").ToLocalChecked()).ToLocalChecked();
    if(!rating->IsNumber() || !isFirstContest->IsBoolean()){
            isolate->ThrowException(
                Exception::TypeError(
                    String::NewFromUtf8(
                        isolate,"Wrong arguments. Array element properties do not have correct datatype."
                        ).ToLocalChecked()
                    )
                );
    }
    Rank rank = {rating->NumberValue(context).FromMaybe(-1),-1,isFirstContest->BooleanValue(isolate)};
    return rank;
}

vector<Rank> unpackRankList(Isolate* isolate,const FunctionCallbackInfo<Value> &args){
    if(args.Length()==0 || !args[0]->IsArray()){
        isolate->ThrowException(
            Exception::TypeError(
                String::NewFromUtf8(
                    isolate,"Wrong arguments. First argument must be an array."
                ).ToLocalChecked()
                )
            );
            return {};
    }
    Local<Context> context = isolate->GetCurrentContext();
    vector<Rank> rankList;
    Local<Array> array = Local<Array>::Cast(args[0]);
    for(int i=0;i<(int)array->Length();i++){
        Local<Object> obj = Local<Object>::Cast(array->Get(context,i).ToLocalChecked());
        if(!(obj->Has(context,String::NewFromUtf8(isolate,"rating").ToLocalChecked())).ToChecked() || !(obj->Has(context,String::NewFromUtf8(isolate,"isFirstContest").ToLocalChecked())).ToChecked()){
            isolate->ThrowException(
                Exception::TypeError(
                    String::NewFromUtf8(
                        isolate,"Wrong arguments. Array element does not has all required properties."
                    ).ToLocalChecked()
                    )
                );
            return {};
        }
        auto rank = unpackRank(isolate,obj);
        rankList.push_back(rank);
    }
    return rankList;
}

Local<Array> packRankList(vector<Rank> &rankList){
    Local<Context> context = v8::Isolate::GetCurrent()->GetCurrentContext();
    Local<Array> array = Array::New(v8::Isolate::GetCurrent(),rankList.size());
    for(int i=0;i<(int)rankList.size();i++){
        Local<Number> predictedRating = Number::New(v8::Isolate::GetCurrent(),rankList[i].predictedRating);
        array->Set(context,i,predictedRating);
    }
    return array;
}


