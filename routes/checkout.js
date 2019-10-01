//결제기능 관련 라우터
const express = require('express');
const router = express.Router();
const CheckoutModel = require('../models/CheckoutModel');
const cheerio = require('cheerio');
const removeEmpty = require('../libs/removeEmpty');
const dotenv = require('dotenv');
const winston = require('../winston');

const csrf = require('csurf');  //csrf셋팅
const csrfProtection = csrf({ cookie: true });  //csrf셋팅2

dotenv.config();

/**
 * 결제정보를 처리하기에 앞서 장바구니 정보를 가져오는 라우팅 
 */
router.get('/', csrfProtection, (req,res) => {

  try {
    var totalAmount = 0;  //총 결제 금액
    var cartList = {};    //장바구니 리스트
    
    //쿠키가 있는지 확인 후 뷰로 넘겨준다.
    if( typeof(req.cookies.cartList) !== 'undefined') {
      cartList = JSON.parse(unescape(req.cookies.cartList));
      
      for (let key in cartList) {
        totalAmount += parseInt(cartList[key].amount);
      }
    }
    
    res.render('checkout/index', { cartList: cartList, totalAmount: totalAmount, csrfToken: req.csrfToken() });
  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }

});


/**
 * IAMPORT API 사용에 따라 추가되는 GET ROUTEING
 * GET방식으로 호출을 할텐데, IAMPORT 모듈을 호출하면 impuid라는 걸 res.send에서 만들어줍니다.
 * 웹 환경에서 결제정보를 처리할 때의 라우팅
 */
router.get('/complete', async (req, res) => {

  try {

    const { Iamporter, IamporterError } = require('iamporter');
    const iamporter = new Iamporter({
      apiKey: process.env.IAMPORT_APIKEY,  //'REST API 키'
      secret: process.env.IAMPORT_SECRET //'REST API secret'
    });

    var asyncFunc = async () => {
      const payData = await iamporter.findByImpUid(req.query.imp_uid);  //IAMPORTER에서 결제된 내 데이터 하나를 조회
      // 거기에 있는 iamport 정보들을 긁어오는 것.

      //if (payData.data.amount === DB에 저장하려는 amount 값) 추가해주는 게 좋다.

      var checkout = new CheckoutModel({
        imp_uid: payData.data.imp_uid,
        merchant_uid: payData.data.merchant_uid,
        paid_amount: payData.data.amount,
        apply_num: payData.data.apply_num,

        buyer_email: payData.data.buyer_email,
        buyer_name: payData.data.buyer_name,
        buyer_tel: payData.data.buyer_tel,
        buyer_addr: payData.data.buyer_addr,
        buyer_postcode: payData.data.buyer_postcode,

        status: "결제완료",
      });
      await checkout.save();
    };

    asyncFunc().then(function (result) {
      res.redirect('/checkout/success');
    });

  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }

});


/**
 * IAMPORT API 사용에 따라 추가되는 GET ROUTEING
 * GET방식으로 호출을 할텐데, IAMPORT 모듈을 호출하면 impuid라는 걸 res.send에서 만들어줍니다.
 * 모바일 환경에서 결제정보를 처리할 때의 라우팅
 */
router.post('/mobile_complete', (req, res) => {
  try {
    var checkout = new CheckoutModel({
      imp_uid: req.body.imp_uid,
      merchant_uid: req.body.merchant_uid,
      paid_amount: req.body.paid_amount,
      apply_num: req.body.apply_num,
  
      buyer_email: req.body.buyer_email,
      buyer_name: req.body.buyer_name,
      buyer_tel: req.body.buyer_tel,
      buyer_addr: req.body.buyer_addr,
      buyer_postcode: req.body.buyer_postcode,
  
      status: req.body.status,
    });
  
    checkout.save(function (err) {
      res.json({ message: "success" });
    });
  } catch (e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }
});


/**
 * 결제 성공 로직 처리 라우팅
 */
router.get('/success', function (req, res) {
  try {
    res.render('checkout/success');
  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }
});


/**
 * 구매조회를 처리하는 라우팅
 */
router.get('/nomember', csrfProtection, function (req, res) {
  try {
    res.render('checkout/nomember', { csrfToken: req.csrfToken() });     
  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }
});


/**
 * 구매이력을 처리하는 라우팅
 */
router.get('/nomember/search', csrfProtection, async (req, res) => {

  try {
    var checkoutList = await CheckoutModel.find({ buyer_email: req.query.email }).exec();
    res.render('checkout/search', { checkoutList: checkoutList, csrfToken: req.csrfToken() });
  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }
  
});



/**
 * 구매조회 로직을 처리하는 라우팅
 */
router.get('/shipping/:invc_no', csrfProtection, (req, res) => {
  
  try {
    //대한통운의 현재 배송위치 크롤링 주소
    var url = "https://www.doortodoor.co.kr/parcel/doortodoor.do?fsp_action=PARC_ACT_002&fsp_cmd=retrieveInvNoACT&invc_no=" + req.params.invc_no;
    var result = []; //최종 보내는 데이터
    request(url, (error, response, body) => {
      //한글 변환
      var $ = cheerio.load(body, { decodeEntities: false });

      var tdElements = $(".board_area").find("table.mb15 tbody tr td"); //td의 데이터를 전부 긁어온다
      // console.log(tdElements) 로 찍어본다.

      //한 row가 4개의 칼럼으로 이루어져 있으므로
      // 4로 나눠서 각각의 줄을 저장한 한줄을 만든다
      for (var i = 0; i < tdElements.length; i++) {

        if (i % 4 === 0) {
          var temp = {}; //임시로 한줄을 담을 변수
          temp["step"] = removeEmpty(tdElements[i].children[0].data);
          //removeEmpty의 경우 step의 경우 공백이 많이 포함됨
        } else if (i % 4 === 1) {
          temp["date"] = tdElements[i].children[0].data;
        } else if (i % 4 === 2) {

          //여기는 children을 1,2한게 배송상태와 두번째줄의 경우 담당자의 이름 br로 나뉘어져있다.
          // 0번째는 배송상태, 1은 br, 2는 담당자 이름
          temp["status"] = tdElements[i].children[0].data;
          if (tdElements[i].children.length > 1) {
            temp["status"] += tdElements[i].children[2].data;
          }

        } else if (i % 4 === 3) {
          temp["location"] = tdElements[i].children[1].children[0].data;
          result.push(temp); //한줄을 다 넣으면 result의 한줄을 푸시한다
          temp = {}; //임시변수 초기화 
        }
      }

      res.render('checkout/shipping', { result: result, csrfToken: req.csrfToken() }); //최종값 전달
    });
  } catch(e) {
    winston.error("[ERROR]checkout.js:: + e.message");
    throw(e);
  }
});

module.exports = router;