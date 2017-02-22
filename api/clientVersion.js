var Router=require('express').Router;
var r=module.exports=new Router();
var jp=require('body-parser').json();
var request=require('request');
var currentCfg={};
var path=require('path');
var wsMgr=require("../ws/connectionManager");
r.post("/setWebContentUrl",jp,function(req,res){
  var url=req.body.url;
  if (url[url.length-1]!="/"){
    url+="/";
  }
  var chUrl=url+"chcp.json";
  request.get(chUrl,function(err,result,body){
    if (err){
      res.status(500).end(err.message);
    }else{
      if (res.statusCode===404){
        res.status(400).end("Cannot find chcp.json which is used for versioning. The web content url is not valid. Please read documentation and try again.")
      }else {
        try{
          var obj=JSON.parse(body);
          currentCfg={
            content_url:req.body.url,
            update:req.body.update,
            release:obj.release
          }
          wsMgr.sendToAllDevices('version-updated');
          res.end();
        }catch(e){
          res.status(400).end("Cannot parse chcp.json. Please make sure it is in correct JSON format");
        }
      }
    }
  })
})

r.get('/config',function(req,res){
  res.json(currentCfg);
})