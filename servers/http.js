// Final version
var express = require('express'),
  // actuatorsRoutes = require('./../routes/actuators'),
  // sensorRoutes = require('./../routes/sensors'),
  // thingsRoutes = require('./../routes/things'),
  resources = require('./../resources/model'),
  converter = require('./../middleware/converter'),
  cors = require('cors'),
  bodyParser = require('body-parser');
  var passport = require('passport');
  var Strategy = require('passport-local').Strategy;
  var localdb = require('./../localdb/index');
  // Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
  function(username, password, cb) {
    localdb.users.findByUsername(username, function(err, user) {
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
      if (user.password != password) { return cb(null, false); }
      return cb(null, user);
    });
}));
// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  localdb.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});
  // var path = require('path')
var app = express();
// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./views'));
app.use(express.static('./resources'));
app.use(bodyParser.json());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(cors());
// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());
// For representation design
app.use(converter());
// app.use('/pi/actuators', actuatorsRoutes);
// app.use('/pi/sensors', sensorRoutes);
// app.use('/things', thingsRoutes);

// app.engine('.html', require('ejs').__express);
// app.set('views', __dirname + '/View');
// app.set('view engine', 'html');
// app.get('/pi/sensors/humidity', function(req, res){
//   res.sendFile('humidity.html', { root: './resources' });
// });
const MongoClient = require('mongodb').MongoClient;
app.set('view engine', 'ejs')
 var db
const url = 'mongodb+srv://tommyfan:cnurobot@garderdb-ityx5.mongodb.net'
MongoClient.connect(url, (err, client) => {
  // ... start the server
  if (err) return console.log(err)
  db = client.db('gardenDB') // whatever your database name is
  console.log("server connect to mongdb!!!!")
  // app.listen(8484, () => {
  //   console.log('listening on 8484')
  // })
})
app.get('/index', (req, res) => {
  // res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
  // Mine was '/Users/zellwk/Projects/demo-repos/crud-express-mongo' for this app.
  //  db.collection('temperature').find().toArray((err, result) => {
  //  if (err) return console.log(err)
    res.render('index.ejs',{ user: req.user })
//  })
})

// Define routes.
app.get('/',
function(req, res) {
  res.render('login');
})
app.get('/utilities',
require('connect-ensure-login').ensureLoggedIn(),
function(req, res) {
  res.render('utilities');
})

app.get('/login',
function(req, res) {
  res.render('login');
})


app.get('/logout',
function(req, res){
  req.logout();
  res.redirect('/');
})

app.get('/profile',
require('connect-ensure-login').ensureLoggedIn(),
function(req, res){
  res.render('profile', { user: req.user });
})

app.get('/humidity', (req, res) => {
  require('connect-ensure-login').ensureLoggedIn(),
  // res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
    // renders index.ejs. humidity is the variable name in ejs. pass the nodejs resource humdity to ejs.
    res.render('utilities.ejs', {user: req.user,resources: resources})
})
app.get('/temperature', (req, res) => {
  require('connect-ensure-login').ensureLoggedIn(),
  // res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
    // renders index.ejs. temperature is the variable name in ejs. pass the nodejs resource temp to ejs.
    res.render('utilities.ejs', {user: req.user,temperature: resources.pi.sensors.temperature})
})
app.get('/LED', (req, res) => {
  require('connect-ensure-login').ensureLoggedIn(),
  // res.sendFile(__dirname + '/index.html')
  // Note: __dirname is directory that contains the JavaScript source code. Try logging it and see what you get!
    // renders index.ejs
    res.render('utilities.ejs', {user: req.user,LED_STATUS: resources.pi.actuators.leds})

})
// app.post('/quotes', (req, res) => {
//     db.collection('temperature').save(req.body, (err, result) => {
//     if (err) return console.log(err)
//     console.log('saved to database')
//     res.redirect('/')
//   })
// })

app.post('/login', 
passport.authenticate('local', { failureRedirect: '/login' }),
function(req, res) {
  res.redirect('/index');
})
// app.get('/pi', function(req, res){
//     res.sendFile('index.html', { root: './resources' });
// });
app.post('/update_humidity',(req, res) => {
     res.redirect('/utilities')
})
app.post('/update_temperature',(req, res) => {
  res.redirect('/utilities')
})
app.post('/openValve',(req, res) => {
    resources.pi.actuators.valve.status= !resources.pi.actuators.valve.status;
    console.log("VALVE STATUS CHANGE TO "+resources.pi.actuators.valve.status);
    res.redirect('/utilities')
})
app.post('/openLED',(req, res) => {
    resources.pi.actuators.leds.value= !resources.pi.actuators.leds.value;
    console.log("LED STATUS CHANGE TO "+resources.pi.actuators.leds.value);
    res.redirect('/utilities')
})
// app.get('/pi/sensors/temperature', function(req, res){
//   res.sendFile('temperature.html', { root: './resources' });
// });


module.exports = app;
