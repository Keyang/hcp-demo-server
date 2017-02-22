var mbaasApi = require('fh-mbaas-api');
var express = require('express');
var mbaasExpress = mbaasApi.mbaasExpress();
var cors = require('cors');
require('./global');
var model=require('./models');


// list the endpoints which you want to make securable here
var securableEndpoints;
securableEndpoints = [];

var app = express();
var server=require('http').createServer(app);

// Enable CORS for all requests
app.use(cors());

// Note: the order which we add middleware to Express here is important!
app.use('/sys', mbaasExpress.sys(securableEndpoints));
app.use('/mbaas', mbaasExpress.mbaas);

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

var io= require('socket.io')(server);

io.on('connection',require('./ws/connectionManager').onConnection);
model().then(function(){
  log.info('Database connected');
  server.listen(port, host, function() {
    log.info("App started at: " + new Date() + " on port: " + port); 
  });
},function(err){
  log.error('database connection failed');
  log.error(err);
  process.exit(-1);
})
