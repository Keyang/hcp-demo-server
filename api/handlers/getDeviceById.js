var device=require('../../ws/device');
module.exports=function(req){
  var deviceId=req.params.id;
  return new Promise(function(res,rej){
    var d=device.getDeviceByUuid(deviceId);
    if (d){
      res(d);
    }else{
      rej(new Error("Device cannot be found."));
    }
  });
}