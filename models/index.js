var mongoose=require('mongoose');
var url=env.get('MONGO_URL');



module.exports=function(){
  return Promise.resolve();
  // log.info('Connecting to mongodb: ',url);
  // mongoose.connect(url);

  // return new Promise(function(res,rej){
  //   var db=mongoose.connection;
  //   db.once('open',res);
  //   db.once('error',rej);
  // })
}