var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
require('./global');
var model = require('./models');
var cookie = require('cookie-parser');

// list the endpoints which you want to make securable here
var securableEndpoints;
securableEndpoints = [];

var app = express();
var server = require('http').createServer(app);


// Enable CORS for all requests
app.use(cors());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);
app.use(cookie("somethingsecret"))
var bodyParser = require('body-parser');
var request = require('request');
app.get("/login_portal", express.static(__dirname, { fallthrough: false }));
app.get('/logout',function(req,res){
  if (req.signedCookies && req.signedCookies.user){
    delete tokens[req.signedCookies.user];
  }
  res.redirect('/');
})
var uuid = require('uuid');
app.post("/login", bodyParser.json(), function (req, res) {
  var url = 'http://ldapdevcfup.ocp.poc.dsb.dk/cloud/auth';
  request({
    strictSSL: false,
    url: url,
    method: 'POST',
    body: req.body,
    json: true
  }, function (err, response, body) {
    res.status(response.statusCode);

    if (response.statusCode === 200) {
      var token = uuid.v4();
      tokens[token] = Date.now() + 3600 * 1000 * 24;
      res.cookie('user', token, {
        signed: true
      });
      res.end();
    } else {
      if (body.message && body.message.message) {
        res.end(body.message.message);
      }
    }
  })
});
// userToken:exp
var tokens = {};
app.use(function (req, res, next) {
  if (req.signedCookies && req.signedCookies.user) {
    var token = req.signedCookies.user;
    if (tokens[token] && tokens[token] > Date.now()) {
      return next()
    }
  }
  res.redirect(302, '/login_portal');
});
// allow serving of static files from the public directory
app.use(express.static(__dirname + '/portal'));

app.use(require('./routes'));
// Note: important that this is added just before your own Routes
app.use(mbaasExpress.fhmiddleware());
// app.use('/hello', require('./lib/hello.js')());

// Important that this is last!
app.use(mbaasExpress.errorHandler());

var port = process.env.FH_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8001;
var host = process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

var io = require('socket.io')(server);

io.on('connection', require('./ws/connectionManager').onConnection);
model().then(function () {
  log.info('Database connected');
  server.listen(port, host, function () {
    log.info("App started at: " + new Date() + " on port: " + port);
  });
}, function (err) {
  log.error('database connection failed');
  log.error(err);
  process.exit(-1);
})
