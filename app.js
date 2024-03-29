require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var session = require('express-session')
const fileUpload = require('express-fileupload');

const { Pool } = require('pg')
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  }
})



var indexRouter = require('./routes/index')(pool);
var usersRouter = require('./routes/users')(pool);
var suppliersRouter = require('./routes/suppliers')(pool)
var barangRouter = require('./routes/barang')(pool)
var satuanRouter = require('./routes/satuan')(pool)
var gudangRouter = require('./routes/gudang')(pool)
var varianRouter = require('./routes/varian')(pool)
var barangMasukRouter = require('./routes/barang_masuk')(pool)
var barangKeluarRouter = require('./routes/barang_keluar')(pool)

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());
app.use(session({
  secret: 'rubicamp',
  resave: false,
  saveUninitialized: true
}))

app.use(flash())


app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/suppliers', suppliersRouter);
app.use('/barang', barangRouter);
app.use('/satuan', satuanRouter);
app.use('/gudang', gudangRouter);
app.use('/varian', varianRouter);
app.use('/barang_masuk', barangMasukRouter);
app.use('/barang_keluar', barangKeluarRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
