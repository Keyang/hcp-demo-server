var Router=require('express').Router;
var r=module.exports=new Router();

function hfn(func){
  return function(req,res,next){
    func(req,res)
    .then(function(result){
      res.json(result);
    },function(error){
      if (!res.statusCode || res.statusCode<400){
        res.status(400);
      }
      console.error(error.stack)
      res.end(error.toString());
    })
  }
}




r.get('/device',hfn(require('./handlers/getDevices')));
r.get('/device/:id',hfn(require('./handlers/getDeviceById')));


r.use('/clientVersion',require('./clientVersion.js'));