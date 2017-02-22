module.exports={
  setOnline:setOnline,
  setOffline:setOffline,
  getDevices:getDevices,
  getDeviceByUuid:getDeviceByUuid
}
var _=require('lodash');

var devices=[];


function setOnline(device){
  var d=getDeviceByUuid(device.uuid);
  if (d){
    d.online=true;
  }else{
    device.online=true;
    devices.push(device);
  }
}

function setOffline(device){
  var d=getDeviceByUuid(device.uuid);
  if (d){
    d.online=false;
  }
}
function getDeviceByUuid(uuid){
  return _.find(devices,function(d){
    return d.uuid===uuid;
  })
}

function getDevices(){
  return devices;
}