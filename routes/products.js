const express = require('express');
const router = express.Router();
const ProductsModel = require('../models/ProductsModel');
const winston = require('../winston');

const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });


/**
 * 상품 한 개의 정보를 보여주는 라우팅
 */
router.get('/:id', csrfProtection, async(req,res) => {
  
  try {
    const product = await ProductsModel.findOne({ 'id': req.params.id }).exec();
    res.render('products/detail', { product: product, csrfToken: req.csrfToken() });
  } catch(e) {
    winston.error("[ERROR]products.js:: + e.message");
    throw(e);
  }

})

module.exports = router;