require('./removeByValue')(); //선언과 동시에 실행

module.exports = (io)=>{
  var userList = [];

  io.on('connection', (socket) => {

    //아래 두줄로 passport의 req.user의 데이터에 접근한다.
    var session = socket.request.session.passport;  //내 세션의 정보를 받기 위한 변수 설정
    var user = (typeof session !== 'undefined') ? (session.user) : "";
    //세션이 있다는 건 "로그인되어있다"는 상태를 의미합니다.

    // userList 필드에 사용자 명이 존재 하지 않으면 삽입
    if (userList.indexOf(user.displayname) === -1) {
      userList.push(user.displayname);
    }
    // io.emit('join', userList);
    io.emit('join', { displayname: user.displayname, list: userList });

    socket.on('client message', (data) => {
      // console.log(data);  //프론트엔드에서 날아온 데이터를 찍어봅니다. 이걸 받으려면 이벤트명을 일치시켜줘야 합니다.
      io.emit('server message', { message: data.message, displayname: user.displayname });
    });

    socket.on('disconnect', function () {
      userList.removeByValue(user.displayname);
      // io.emit('leave', userList);
      io.emit('leave', {displayname: user.displayname, list: userList});
    });
    
  });
}