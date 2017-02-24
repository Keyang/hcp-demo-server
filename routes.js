var Router = require('express').Router;
var r = module.exports = new Router();

var browserify = require('browserify');
r.use('/api', require('./api'));
var clientScript = null;
var host=null;
r.get('/client.js', function (req, res) {
  // browserify([
  //   "../client/index.js",
  //   "../client/module/log.js",
  //   "../client/module/version.js"
  // ])
  //   .bundle(function (err, buf) {
  //     res.end("window._mamurl='"+getFullUrl(req).split('/client.js')[0]+"';\n"+buf.toString("utf8"));
  //   })
  host=req.query.host?req.query.host:host; 
  var _mamurl="window._mamurl='"+host+"';\n";
  if (clientScript){
    res.end(_mamurl+clientScript);
  }else{
    clientScript=require('fs').readFileSync(__dirname+"/client.js","utf8");
    res.end(_mamurl+clientScript);
  }
})

r.get('/mam_url', function (req, res) {
  var fullUrl = getFullUrl();

  res.json({ url: fullUrl.split('/mam_url')[0] });
})


function getFullUrl(req) {
  return req.protocol + '://' + req.get('host') + req.originalUrl;
}