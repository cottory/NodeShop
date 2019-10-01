const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const csrf = require('csurf');  //csrf셋팅
const csrfProtection = csrf({ cookie: true });  //csrf셋팅2
const passwordHash = require('../libs/passwordHash');
const isLoggedIn = require('../libs/isLoggedIn');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const winston = require('../winston');

//2nd. serialize, deserialize
passport.serializeUser( (user, done) => {
  console.log('serializeUser');
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  console.log('deserializeUser');
  done(null, user);
});

//1st. 정책작성
passport.use(new LocalStrategy({
  //"input에 어떤 필드를 사용하겠다"를 작성
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true
},
  async(req, username, password, done) => {

    //이 안에서 로직이 들어가는 것. 일치하는 사용자가 있는지 없는지 체크.
    try {
      var user = await UserModel.findOne({ username: username, password: passwordHash(password) }).exec();
      if (!user) {
        return done(null, false, { message: '아이디 또는 비밀번호 오류 입니다.' });
      }
      else {
        return done(null, user);
      }
    } catch(e) {
      winston.error("[ERROR]accounts.js:: + e.message");
      throw(e);
    }
  }
));

/**
 * 회원가입 라우팅
 */
router.get('/join', csrfProtection, isLoggedIn, (req, res) => {
  try {
    res.render('accounts/join', { csrfToken: req.csrfToken() });
  } catch(e) {
    winston.error("[ERROR]accounts.js:: + e.message");
    throw(e);
  }
});

/**
 * 회원가입 라우팅
 */
router.post('/join', isLoggedIn, (req, res) => {
  try {
    var User = new UserModel({
      username : req.body.username,
      password : passwordHash(req.body.password),
      displayname : req.body.displayname
    });
  
    User.save((err) => {
      res.send('<script>alert("회원가입 성공");location.href="/accounts/login";</script>');
    });
  } catch (e) {
    winston.error("[ERROR]accounts.js:: + e.message");
    throw(e);
  }
});

/**
 * 로그인 라우팅
 */
router.get('/login', isLoggedIn, csrfProtection, (req, res) => {
  try {
    res.render('accounts/login', { flashMessage: req.flash().error, csrfToken: req.csrfToken() });
  } catch (e) {
    winston.error("[ERROR]accounts.js:: + e.message");
    throw(e);
  }
});

/**
 * 로그인 라우팅
 */
router.post('/login', isLoggedIn,
  passport.authenticate('local', {
    failureRedirect: '/accounts/login',
    failureFlash: true
  }),
  (req, res) => {
    res.send('<script>alert("로그인 성공"); location.href="/";</script>');
  }
);

/**
 * 로그아웃 라우팅
 */
router.get('/logout', (req, res) => {
  try {
    req.logout();
    res.redirect('/accounts/login');
  } catch (e) {
    winston.error("[ERROR]accounts.js:: + e.message");
    throw(e);
  }
});

module.exports = router;