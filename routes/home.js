const express = require('express');
const router = express.Router();
const ProductsModel = require('../models/ProductsModel');
const winston = require('../winston');

const csrf = require('csurf');  //csrf셋팅
const csrfProtection = csrf({ cookie: true });  //csrf셋팅2

/**
 * Main Page를 보여주는 라우팅
 */
router.get('/', csrfProtection, async(req, res) => {

  //ProductsModel.find().sort('-created_at')
  try {
    var getData = await ProductsModel.find().sort('-created_at').exec();
    res.render('home', {products: getData, csrfToken: req.csrfToken() });
  } catch (e) {
    winston.error("[ERROR]home.js:: + e.message");
    throw(e);
  }
});


module.exports = router;