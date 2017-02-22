var device=require('../../ws/device');
var _=require('lodash');
module.exports=function(){
  return new Promise(function(res,rej){
    res(device.getDevices());
  })
}