const express = require('express');
const router = express.Router();
const winston = require('../winston');


/**
 * 채팅 로직을 처리하는 라우팅
 * 비회원이 접근 시 로그인이 필요한 서비스라고 알려줍니다
 */
router.get('/', (req, res) => {
  try {
    if (!req.isAuthenticated()) { //isAuthenticated()는 passport에서 제공해주는 함수 (로그인유무 체크)
      res.send('<script>alert("로그인이 필요한 서비스입니다."); \ location.href="/accounts/login";</script>');
    } else {
      res.render('chat/index');
    }
  } catch(e) {
    winston.error("[ERROR]chat.js:: + e.message");
    throw(e);
  }
});

module.exports = router;