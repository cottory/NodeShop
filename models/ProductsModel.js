//여기서 몽구스를 다 갖다박는다.

//여기에 Products라는 컬렉션을 만든다.
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var { autoIncrement } = require('mongoose-plugin-autoinc');

//생성될 필드명을 정해준다.
//mongoose의 경우 그냥 필드에 추가해버리면 알아서 필드가 추가된다. altertable 명령이 필요X
var ProductsSchema = new Schema({
    name : {    //제품명
        type: String,
        required: [true, '제목을 입력해주세요']
    },
    thumbnail: String, //이미지 파일명
    price: Number,  //가격
    description: String,    //설명
    created_at: {   //작성일
        type: Date,
        default: Date.now()
    },
    username: String    //작성자 필드 추가
});

//virtual 변수는 호출되면 실행하는 함수
//Object create 의 get과 set과 비슷함
//set은 변수의 값을 바꾸거나 셋팅하면 호출
//get은 getDate변수를 호출하는 순간 날짜 월일이 찍힌다.
ProductsSchema.virtual('getDate').get(function () {
    var date = new Date(this.created_at);
    return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(0)
    }
});

//1씩 증가하는 primary Key를 만든다. field: 'id' 이 부분이 PK역할로 1씩 들어가는 것.
//model: dataBase에 들어갈 컬렉션명
ProductsSchema.plugin( autoIncrement, { model: 'products', field: 'id', startAt: 1});
                                    //컬렉션명,             키값,        시작지점
module.exports = mongoose.model('products', ProductsSchema);
                                //컬렉션명, 구조
                                    
