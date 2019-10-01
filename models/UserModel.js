var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var { autoIncrement } = require('mongoose-plugin-autoinc');

var UserSchema = new Schema({
  username: {
    type: String,
    required: [true, '아이디는 필수입니다.']
  },
  password: {
    type: String,
    required: [true, '패스워드는 필수입니다.']
  },
  displayname: String,  //일종의 닉네임
  created_at: {
    type: Date,
    default: Date.now()
  }
});

//1씩 증가하는 primary Key를 만든다. field: 'id' 이 부분이 PK역할로 1씩 들어가는 것.
//model: dataBase에 들어갈 컬렉션명
UserSchema.plugin(autoIncrement, { model: "user", field: "id", startAt: 1 });
module.exports = mongoose.model('user', UserSchema);