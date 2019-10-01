//모델 생성 시 필요한 셋트 3개
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var { autoIncrement } = require('mongoose-plugin-autoinc'); 

//스키마 객체 생성 (동적 스키마 선언)
var CommentsSchema = new Schema({
    content: String,
    created_at : {
        type: Date,
        default: Date.now()
    },
    product_id: Number
});

//스키마 DB 컬렉션에 연결 (model => collection)
CommentsSchema.plugin( autoIncrement, { model: "comments", field: "id", startAt : 1});
module.exports= mongoose.model( "comments", CommentsSchema);