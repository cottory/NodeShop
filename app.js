const express = require('express');
const path = require('path');         //views에서 path.join에서 사용
const bodyParser = require('body-parser');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');   //flash 메시지 관련
const passport = require('passport');     //passport 로그인 관련
const session = require('express-session');   //passport 로그인 관련
const dotenv = require('dotenv');
const winston = require('./winston');

const admin = require('./routes/admin');
const contacts = require('./routes/contacts');
const accounts = require('./routes/accounts');
const products = require('./routes/products');
const auth = require('./routes/auth');
const home = require('./routes/home');
const chat = require('./routes/chat');
const cart = require('./routes/cart');
const checkout = require('./routes/checkout');
const profile = require('./routes/profile');
const socketConnection = require('./libs/socketConnection');
const adminRequired = require('./libs/adminRequired');
const loginRequired = require('./libs/loginRequired');

dotenv.config();

//MongoDB 접속
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;  //mongoose Promise에 문제가 있으니 nodejs 자체 내장 Promise로 바꿔주는 것.

const db = mongoose.connection;   //몽고 db에 접속하는 코드
db.on('error', function () {
    console.error;
    winston.error("[ERROR]app.js::Connection is not connected properly.");
});
db.once('open', function () {
    console.log('mongodb connect');
    winston.info("Connection has been established successfully.");
});

//exercise : database명
mongoose.connect(process.env.MONGO_URL, { useMongoClient: true });

const app = express();
const port = process.env.PORT;

// 미들웨어 셋팅 (bodyParser, logger)
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()); //얘를 통해 request에 cookies 변수가 추가된다.

//MVC: VIEWS : 확장자가 ejs로 끝나는 뷰엔진을 추가한다.
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//console.log(__dirname); ==> C:\Users\LG PC\Desktop\nodeShop 으로 찍힌다.

//업로드 path 추가
app.use('/uploads', express.static('uploads'));
//          ↑이건 URL
//uploads란 url이 왔을 때 => uploads폴더에 있는걸 가리켜라

app.use('/clients', express.static('uploads_client'));
//clients란 url이 왔을 때 => uploads_client폴더에 있는걸 가리켜라


//static path 추가
//static으로 URL이 들어왔을 때 static 폴더에 있는 애를 정적 static으로 하겠다.
app.use('/static', express.static('static'));

//※위치 중요
//session 관련 셋팅
const connectMongo = require('connect-mongo');
const MongoStore = connectMongo(session);

const sessionMiddleWare = session({   //지금은 변수를 직접 빼준 다음에 세션을 셋팅, 
                                    //굳이 변수로 빼준이유는 세션미들웨어함수를 소켓io로 세션데이터를 보내주기 위함.
                                    //그래야 로그인된 내정보를 보내줄 수 있습니다. (내 로그인된 정보 == req.user)
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 2000 * 60 * 60 //지속시간 2시간
    },
    store: new MongoStore({ //세션데이터의 저장소를 지정해주는 것. mongoDB에 저장한다는 의미입니다.
        mongooseConnection: mongoose.connection,
        ttl: 14 * 24 * 60 * 60
    })
});
app.use(sessionMiddleWare);

//passport 적용
app.use(passport.initialize());
app.use(passport.session());

//플래시 메시지 관련
app.use(flash());

//로그인 정보 뷰에서만 변수로 셋팅, 전체 미들웨어는 router위에 두어야 에러가 안난다
app.use( (req,res,next) => {
    app.locals.isLogin = req.isAuthenticated();
    //app.locals.urlparameter = req.url; //현재 url 정보를 보내고 싶으면 이와같이 셋팅
    app.locals.userData = req.user; //사용 정보를 보내고 싶으면 이와같이 셋팅
    //△△ 이걸 사용하면 header.js에서 req.user인자를 사용할 수 있습니다!!!
    next();
})

app.use('/admin', adminRequired, admin);
app.use('/profile', loginRequired, profile);
app.use('/contacts', contacts);
app.use('/accounts', accounts);
app.use('/auth', auth);
app.use('/', home);
app.use('/chat', chat);
app.use('/products', products);
app.use('/cart', cart);             
app.use('/checkout', checkout);

//MVC: ROUTES
const server = app.listen(port, function () {
    winston.info("Express listening on port", port);
});

const listen = require('socket.io'); //소켓io를 받는 변수
const io = listen(server);    //소켓io를 서버에 붙이는 동작

//socket io passport 접근하기 위한 미들웨어 적용
io.use(function (socket, next) {
    sessionMiddleWare(socket.request, socket.request.res, next);
});
socketConnection(io);

//축약버전:: 아래 두 줄과 같은 의미
//require('./libs/socketConnection')(io);

// var socketConnection = require('./libs/socketConnection');
// socketConnection(io);