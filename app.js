require('dotenv').config(); // Trigger nodemon restart
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const { notFoundHandler, errorHandler } = require('./middlewares/error');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: {
    tableName: 'express_sessions'
  }
});

app.use(session({
  key: 'session_cookie_name',
  secret: process.env.SESSION_SECRET || 'secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Global middleware to fetch user details for EJS templates
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const db = require('./lib/db');
      const [rows] = await db.query(`
        SELECT u.name, u.email, u.photo, e.employee_number, e.status, es.name AS emp_status_name 
        FROM users u 
        LEFT JOIN employees e ON u.id = e.id 
        LEFT JOIN employment_statuses es ON e.employment_status_id = es.id 
        WHERE u.id = ?
      `, [req.session.userId]);
      if (rows.length > 0) {
        res.locals.user = rows[0];
      } else {
        res.locals.user = null;
      }
    } catch (err) {
      console.error('Error loading user session details:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(notFoundHandler);

// error handler
app.use(errorHandler);

module.exports = app;
