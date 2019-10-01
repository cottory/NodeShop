const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const passport = require('passport');
const KakaoStrategy = require('passport-kakao').Strategy;
const NaverStrategy = require('passport-naver').Strategy;
const passwordHash = require('../libs/passwordHash');
const winston = require('../winston');
const dotenv = require('dotenv');

dotenv.config();

const kakaoKey = {
  clientID: process.env.KAKAO_APPID,
  callbackURL: `${process.env.SITE_DOMAIN}/auth/kakao/callback`,
};

const naverKey = {
  clientID: process.env.NAVER_APPID,
  clientSecret: process.env.NAVER_APPPW,
  callbackURL: `${process.env.SITE_DOMAIN}/auth/naver/callback`,
};

passport.serializeUser( (user, done) => {
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  done(null, user);
});

passport.use("naver-login",
  new NaverStrategy(naverKey, (accessToken, refreshToken, profile, done) => {
    //console.log(profile) //profile 객체를 들고 여기로 날아온다.
    try {
      UserModel.findOne({ username: "naver_" + profile.id }, (err, user) => {
        if (!user) {  //계정이 없다면
          const regData = {
            username: "naver_" + profile.id,
            password: passwordHash(process.env.USER_PW),
            displayname: profile.displayName,
          };
          const User = new UserModel(regData);
          User.save((err) => {
            done(null, regData);
          });
        } else {
          done(null, user);
        }
      })
    } catch(e) {
      winston.error("[ERROR]auth.js:: + e.message");
      throw(e);
    }
  })
);

passport.use("kakao-login",
  new KakaoStrategy(kakaoKey, (accessToken, refreshToken, profile, done) => {

    try {
      UserModel.findOne({ username: "kakao_" + profile.id }, (err, user) => {
        if (!user) {  //계정이 없다면
          const regData = {
            username: "kakao_" + profile.id,
            password: passwordHash(process.env.USER_PW),
            displayname: profile.displayName,
          };
          const User = new UserModel(regData);
          User.save((err) => {
            done(null, regData);
          });
        } else {
          done(null, user);
        }
      })
    } catch(e) {
      winston.error("[ERROR]auth.js:: + e.message");
      throw(e);
    }
  })
);


/**
 * 1st.이제 할 일은 라우터 작성을 통해 네이버로 접근하고 정보를 받아올 수 있게 한다.
 */
router.get("/naver", passport.authenticate("naver-login"));

/**
 * 2nd.인증이 되면 네이버에서 이 주소로 리턴을 해준다. (callbackURL과 일치)
 */
router.get("/naver/callback", 
  passport.authenticate("naver-login",{
    successRedirect: "/",
    failureRedirect: "/auth/naver/fail"
  })
);

/**
 * 로그인 실패 시 이동할 주소 라우팅
 */
router.get('/naver/fail', (req, res) => {
  try {
    res.send('naver-login fail');
  } catch (e) {
    winston.error("[ERROR]auth.js:: + e.message");
    throw(e);
  }
});


/**
 * 1st.이제 할 일은 라우터 작성을 통해 카카오로 접근하고 정보를 받아올 수 있게 한다.
 */
router.get("/kakao", passport.authenticate("kakao-login"));

/**
 * 2nd.인증이 되면 카카오에서 이 주소로 리턴을 해준다. (callbackURL과 일치)
 */
router.get("/kakao/callback",
  passport.authenticate("kakao-login", {
    successRedirect: "/",
    failureRedirect: "/auth/kakao/fail"
  })
);

/**
 * 로그인 실패 시 이동할 주소 라우팅
 */
router.get('/kakao/fail', (req, res) => {
  try {
    res.send('kakao-login fail');
  } catch (e) {
    winston.error("[ERROR]auth.js:: + e.message");
    throw(e);
  }
});

module.exports = router;
