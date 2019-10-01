module.exports = function (req, res, next) {
  if (!req.isAuthenticated()) { //첫 번째 분기. 로그인이 되어있는지 체크. 
    res.redirect('/accounts/login');  //로그인이 되어있지 않다면 로그인 페이지로 
  } else {
    if (req.user.username !== 'admin') {  //두 번째 분기. admin 계정인지 체크
      res.send('<script>alert("관리자만 접근가능합니다.");location.href="/accounts/login";</script>');
    } else {
      return next();
    }
  }
};