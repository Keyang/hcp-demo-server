exports.get=get;
exports.set=set;
var def={
  MONGO_URL:"mongodb://127.0.0.1:27017/rhmam",
  "HEART_BEAT":30
};

var dynamic={

};

function get(key){
  return typeof dynamic[key]!=="undefined"?dynamic[key]:typeof process.env[key]!=="undefined"?process.env[key]:def[key];
}
function set (key,val){
   dynamic[key]=val;
}