// /admin 관련 URL은 전부 여기서 처리한다
const express = require('express');
const router = express.Router();
const ProductsModel = require('../models/ProductsModel');
const CommentsModel = require('../models/CommentsModel');
const paginate = require('express-paginate');
const CheckoutModel = require('../models/CheckoutModel'); //주문 체크시 find를 해야하므로
const winston = require('../winston');

//csrf 셋팅
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true});

//File업로드를 위한 셋팅1
//이미지 저장되는 위치 설정
const path = require('path');
const uploadDir = path.join(__dirname, '../uploads'); // 루트의 uploads위치에 저장한다.
const fs = require('fs');

//File업로드를 위한 셋팅2
//multer 셋팅
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, callback) => { //이미지가 저장되는 도착지 지정
        callback(null, uploadDir);
    },
    filename: (req, file, callback) => { // products-날짜.jpg(png) 저장 
        callback(null, 'products-' + Date.now() + '.' + file.mimetype.split('/')[1]);
    }
});
const upload = multer({ storage: storage });
//upload라는 변수명으로 미들웨어만 걸어주면 req에 file이라는 변수가 생성되어 req.file로 갖고 다닐 수 있습니다.


/**
 * 관리자가 올린 상품들 목록을 처리하는 라우팅 
 */                   
router.get('/products', paginate.middleware(5, 50), csrfProtection, async (req, res) => {

    //한 페이지당 5개씩 보겠다. 50을 안 넘는 선에서. 근데 두 번째 변수는 별로 의미 없는 거 같음

    try {
        //Promise.all을 하게 되면 첫 번째 인자 값은 => results에, 두 번째 인자 값은 => itemCount에 꽂히게 된다.
    
        /*
            시작지점은 skip과 limit를 통해 계산을 한다. 
            skip이 처음 시작되는 지점! ex. skip은 1페이지면 0번부터, 2페이지면 11번부터 시작을 하는 것. 
            그걸 이제 미들웨어가 req.skip이라는 변수로 셋팅을 해주는데, paginate.middleware(3, 50) 얘가 셋팅을 해준다.
            limit는 끝나는 지점! 페이지당 보이는 갯수는 limit(req.query.limit)로 셋팅한다. 
            위에서 (3, 50) 으로 설정했으니 페이지당 보이는 갯수는 3개
        */
        //results: 
        //itemCount: 총 레코드의 수
        const [results, itemCount] = await Promise.all([
            //-created_at: 최신 데이터가 가장 앞에 오도록 셋팅
            ProductsModel.find().sort('-created_at').limit(req.query.limit).skip(req.skip).exec(),
            ProductsModel.count({})
        ]);

        //그 다음에 페이지의 개수를 세준다. 페이지 개수 = ceil(전체 레코드 개수 / 페이지 당 보려는 개수)
        const pageCount = Math.ceil(itemCount / req.query.limit);

        //슬라이딩블락을 의미한다: 블락을 한 번에 몇개씩 보여줄 것인가?
        const pages = paginate.getArrayPages(req)(5, pageCount, req.query.page);

        /*  ↑ 위 방식: return을 함수로 넘겨줄 때
            var b = a(10)(1,2,3)    <== 아래 함수 호출 방법

            function a(num) {
                return function(aa,bb,cc) {
                    console.log('hello');
                }
            }        
        */

        res.render('admin/products', {
            products: results,
            pages: pages,
            pageCount: pageCount,
            csrfToken: req.csrfToken(),
        });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 상품을 등록하는 라우팅
 */  
router.get('/products/write', csrfProtection, (req,res) => {  //템플릿을 뿌려줄 때는 render. 
    try {
        res.render( 'admin/form', { product: "", csrfToken: req.csrfToken() }); 
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 상품을 등록하는 라우팅
 * router에서 validation 체크
 */  
router.post('/products/write', upload.single('thumbnail'), csrfProtection, (req, res) => {  

    try {
        var products = new ProductsModel({
            name: req.body.name,
            thumbnail: (req.file) ? req.file.filename : "", //섬네일 값이 존재하면 db에 꽂고, 아니면 그냥 비워주세요.
            price: req.body.price,
            description: req.body.description
        });

        //save를 하기전에 validation체크를 넣어준다.
        if (!products.validateSync()) {
            products.save( err => {
                res.redirect('/admin/products');
            });
        } else {
            res.send("validation ERROR");
        }
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 하나의 상품을 조회하는 라우팅
 * URL에 있는 변수 받아오기
 */  
router.get('/products/detail/:id', csrfProtection, async(req, res) => {

    try {
        var product = await ProductsModel.findOne({ 'id': req.params.id }).exec();
        var comments = await CommentsModel.find({ 'product_id': req.params.id }).exec();

        res.render('admin/productsDetail', { product: product, comments: comments, csrfToken: req.csrfToken() });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 하나의 상품을 수정하는 라우팅
 * 수정 페이지 view
 */  
router.get('/products/edit/:id', csrfProtection, async(req, res) => {
    try {
        var product = await ProductsModel.findOne({ id: req.params.id }).exec();
        res.render('admin/form', { product: product, csrfToken: req.csrfToken() });
    } catch(e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 하나의 상품을 수정하는 라우팅
 * 수정 페이지 view
 */  
router.post('/products/edit/:id', upload.single('thumbnail'), csrfProtection, async (req, res) => {

    try {
        var product = await ProductsModel.findOne({ id: req.params.id }).exec();
        if (req.file && product.thumbnail) {
            fs.unlinkSync(uploadDir + '/' + product.thumbnail);
        }
        //넣을 변수 값을 셋팅한다
        var query = {
            name: req.body.name,
            thumbnail: (req.file) ? req.file.filename : product.thumbnail,
            price: req.body.price,
            description: req.body.description
        };
        var products = new ProductsModel(query);
        if (!products.validateSync()) {
            //update의 첫번째 인자는 조건, 두 번째 인자는 바뀔 값들. $를 쓰는 건 몽고DB 규칙이다. 
            //set은 바꿀껀 바꾸고, 나머지 필드는 유지해달라는 요청
            ProductsModel.update({ id: req.params.id }, { $set: query }, function (err) {
                res.redirect('/admin/products/detail/' + req.params.id); //수정후 본래보던 상세 페이지로 이동
            });
        } else {
            res.send("validation ERROR");
        }    

    } catch(e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }

});

/**
 * 하나의 상품을 삭제하는 라우팅
 */  
router.get('/products/delete/:id', (req, res) => {  
    try {
        ProductsModel.remove( { id: req.params. id}, function (err) {  
            res.redirect('/admin/products');
        });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


 /**
 * 댓글을 등록하는 라우팅
 */  
router.post('/products/ajax_comment/insert', (req, res) => {
    try {
        var comment = new CommentsModel({
            content: req.body.content,
            product_id: parseInt(req.body.product_id)   //parseInt 숫자로 저장
        });
        comment.save(function (err, comment) {
            res.json({
                id: comment.id,
                content: comment.content,
                message: "success"
            });
        });
    } catch(e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


 /**
 * 댓글을 삭제하는 라우팅
 */  
router.post('/products/ajax_comment/delete', (req, res) => {
    try {
        CommentsModel.remove({ id: req.body.comment_id }, function (err) {
            res.json({ message: "success" });
        });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


 /**
 * 위지웍 에디터를 사용하는 라우팅
 */  
router.post('/products/ajax_summernote', upload.single('thumbnail'), function (req, res) {
    try {
        res.send('/uploads/' + req.file.filename);
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 주문정보 목록을 보여주는 라우팅
 */  
router.get('/order', csrfProtection, async (req, res) => {

    try {
        var orderList = await CheckoutModel.find().sort('-created_at').exec();
        res.render('admin/orderList', { orderList: orderList, csrfToken: req.csrfToken() });
    } catch(e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 주문정보를 수정하는 라우팅
 */  
router.get('/order/edit/:id', csrfProtection, async(req, res) => {
    try {
        var order = await CheckoutModel.findOne({ id: req.params.id }).exec();
        res.render('admin/orderForm', { order: order, csrfToken: req.csrfToken() });
    } catch(e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 주문정보를 수정하는 라우팅
 */  
router.post('/order/edit/:id', csrfProtection, (req, res) => {
    try {
        var query = {
            status: req.body.status,
            song_jang: req.body.song_jang
        };
    
        CheckoutModel.update({ id: req.params.id }, { $set: query }, (err) => {
            res.redirect('/admin/order');
        });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }
});


/**
 * 판매상품의 통계를 처리하는 라우팅
 */  
router.get('/statistics', csrfProtection, async (req, res) => {

    try {
        var barData = [];
        var cursor = CheckoutModel.aggregate(
            [
                { $sort: { created_at: -1 } },
                {
                    $group: {
                        _id: {
                            year: { $year: "$created_at" },
                            month: { $month: "$created_at" },
                            day: { $dayOfMonth: "$created_at" }
                        },
                        count: { $sum: 1 }
                    }
                }
            ]
        ).cursor({ batchSize: 1000 }).exec();
    
        await cursor.eachAsync(function (doc) {
            if (doc !== null) {
                barData.push(doc)
            }
        });
    
        var pieData = [];
        //배송중, 배송완료, 결제완료자 수를 기준으로 묶는다.
        var cursor = CheckoutModel.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }])
            .cursor({ batchSize: 1000 }).exec();
    
        await cursor.eachAsync(function (doc) {
            if (doc !== null) {
                pieData.push(doc)
            }
        });
    
        res.render('admin/statistics', { barData: barData, pieData: pieData, csrfToken: req.csrfToken() });
    } catch (e) {
        winston.error("[ERROR]admin.js:: + e.message");
        throw(e);
    }    
});

//모듈화를 통해 파일을 분리하는 방법
//app.js에서 var admin = require('./routes/admin') 으로 사용 가능
module.exports = router;