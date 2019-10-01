const express = require('express');
const router = express.Router();
const ContactsModel = require('../models/ContactsModel');
const paginate = require('express-paginate');
const loginRequired = require('../libs/loginRequired')
const path = require('path');
const uploadDir = path.join(__dirname, '../uploads_client'); // 루트의 uploads_client위치에 저장한다.
const fs = require('fs'); //fs 파일시스템;;
const winston = require('../winston');

//csrf 셋팅
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, callback) {  //이미지가 저장되는 도착지 지정
        callback(null, uploadDir);
    },
    filename: function (req, file, callback) {
        callback(null, 'client-' + Date.now() + '.' + file.mimetype.split('/')[1] );
                                                     //여기에는 확장자명이 들어가 있습니다.
    }
});

const upload = multer({ storage: storage});
//upload라는 변수명으로 미들웨어만 걸어주면 req에 file이라는 변수가 생성되어 req.file로 갖고 다닐 수 있습니다.


/**
 * 회원이 작성한 글 목록을 가져오는 라우팅
 */
router.get('/', paginate.middleware(5, 50), csrfProtection, async(req,res) => { 

    try {
        const [results, listCount] = await Promise.all([
            ContactsModel.find().sort('-created_at').limit(req.query.limit).skip(req.skip).exec(),
            ContactsModel.count({})
        ]);

        const pageCount = Math.ceil(listCount / req.query.limit);
        const pages = paginate.getArrayPages(req)(5, pageCount, req.query.page);

        res.render('contacts/list', {
            contacts: results,
            pages: pages,
            pageCount: pageCount,
            csrfToken: req.csrfToken(),
        })
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 글 작성을 처리하는 라우팅
 */
router.get('/write', loginRequired, csrfProtection, (req,res) => {
    try {
        // /contacts/write 글작성 URL
        res.render('contacts/form', { contact: "", csrfToken: req.csrfToken() });
    } catch (e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 글 작성을 처리하는 라우팅
 */
router.post('/write', loginRequired, upload.single('thumbnail'), csrfProtection, (req,res) => {

    try {
        var contacts = new ContactsModel({
            name : req.body.name,
            age : req.body.age,
            thumbnail: (req.file) ? req.file.filename : "",
            gender : req.body.gender,
            contents : req.body.contents
        });
        contacts.save((err) => {
            res.redirect('/contacts'); //이건 URL
        });    
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 상세 글 내용을 볼 수 있게 하는 라우팅
 */
router.get('/detail/:id', csrfProtection, async(req,res) => {  

    try {
        var contact = await ContactsModel.findOne({ 'id': req.params.id }).exec();
        res.render('contacts/contactsDetail', { contact: contact, csrfToken: req.csrfToken() });
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }

});


/**
 * 수정할 페이지를 보여주는 라우팅
 */
router.get('/edit/:id', loginRequired, csrfProtection, async (req,res) => {  

    try {
        var contact = await ContactsModel.findOne({ id: req.params.id }).exec();
        res.render('contacts/form', { contact: contact, csrfToken: req.csrfToken() });
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 수정할 페이지를 보여주는 라우팅
 */
router.post('/edit/:id', loginRequired, upload.single('thumbnail'), csrfProtection, async(req,res) => {  

    try {
        var user = await ContactsModel.findOne({ id: req.params.id }).exec();

        if (req.file && user.thumbnail) {
            fs.unlinkSync(uploadDir + '/' + user.thumbnail);
        }
        //넣을 변수값 셋팅
        var query = {
            name: req.body.name,
            thumbnail: (req.file) ? req.file.filename : user.thumbnail,
            age: req.body.age,
            gender: req.body.gender,
            contents: req.body.contents
        };
        //update
        ContactsModel.update({ id: req.params.id }, { $set: query }, (err) => {
            res.redirect('/contacts/detail/' + req.params.id);
        });
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 위지웍에디터 사용 라우팅
 */
router.post('/ajax_summernote', loginRequired, upload.single('thumbnail'), (req, res) => {
    try {
        res.send('/client/' + req.file.filename);
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});


/**
 * 글 삭제 라우팅
 */
router.get('/delete/:id', loginRequired, (req,res) => {  
    try {
        // /contacts/delete/:id 글 삭제하기 URL
        ContactsModel.remove({ id: req.params.id }, function (err) {  
            res.redirect('/contacts');
        });
    } catch(e) {
        winston.error("[ERROR]contacts.js:: + e.message");
        throw(e);
    }
});

module.exports = router;
