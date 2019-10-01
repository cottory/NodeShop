const express = require('express');
const router = express.Router();
const UserModel = require('../models/UserModel');
const passwordHash = require('../libs/passwordHash');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const passport = require('passport');
const winston = require('../winston');

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user,done) {
  done(null, user);
});


/**
 * 회원정보를 보여주는 라우팅
 */
router.get('/', csrfProtection, (req,res) => {
  try {
    res.render('profile/index', { user : req.user, csrfToken: req.csrfToken() });
  } catch(e) {
    winston.error("[ERROR]profile.js:: + e.message");
    throw(e);
  }
});


/**
 * 회원정보 수정 라우팅
 */
router.get('/edit', csrfProtection, (req,res) => {
  try {
    res.render('profile/form', {user: req.user, csrfToken: req.csrfToken() });
  } catch (e) {
    winston.error("[ERROR]profile.js:: + e.message");
    throw(e);
  }
});

/**
 * 회원정보 수정 라우팅
 */
router.post('/edit', csrfProtection, async(req,res) => {
  
  try {
    const query = { //넣을 변수값 셋팅
      displayname : req.body.displayname,
    };
    
    //패스워드가 있다면 셋팅
    if (req.body.password) {
      query.password = passwordHash(req.body.password);
    }

    await UserModel.update({ id: req.user.id }, { $set: query }).exec();
    const user = await UserModel.findOne({ id: req.user.id}).exec();

    req.login(user, () => {
      res.redirect('/profile');
    })

  } catch(e) {
    winston.error("[ERROR]profile.js:: + e.message");
    throw(e);
  }

});


module.exports = router;