module.exports = function () {
  Array.prototype.removeByValue = function (search) { //인자로 삭제할 값이 넘어옵니다.
    var index = this.indexOf(search); //this는 이 함수를 사용하는 userList 의미
    if (index !== -1) { //일치하는 게 있다면
      this.splice(index, 1);  //걔를 삭제해줍니다.
      //여기서 splice의미가 index부터 1칸없애는 것. 그래서 찾은 위치값을 삭제하는 게 됩니다.
    }
  };
};