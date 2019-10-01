
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var { autoIncrement } = require('mongoose-plugin-autoinc');

var ContactsSchema = new Schema ({
    name : String,  //이름
    age : Number, //나이
    thumbnail: String,  //섬네일 이미지 파일명
    gender : String, //성별
    contents : String , //상담 내용
    created_at : {  //작성일
        type : Date,
        default : Date.now()
    }    
})

ContactsSchema.virtual('getDate').get(function () { //getDate라는 변수를 새로 만든 꼴이다. 
    var date = new Date(this.created_at);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate()
    };
});

ContactsSchema.plugin( autoIncrement, { model: 'contacts', field: 'id', startAt: 1});
module.exports = mongoose.model('contacts', ContactsSchema);