//미들웨어 라이브러리
module.exports = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  } else {
    res.redirect('/');  //로그인이 되어있는 상태에서 중복로그인 불허
  }
};