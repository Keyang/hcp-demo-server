module.exports = Connection;

var connectionMgr = require('./connectionManager');
var uuid = require('uuid');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fromServer = "server";
var device = require('./device');

function Connection(socket, id) {
  EventEmitter.call(this);
  this.retry = 3;
  this.retryDelay = 5;
  this.timeout = 5000;
  this.id = id;
  this.type = "unknown";//mobile, admin, unknown
  this.socket = socket;
  this.socket.on("message", this.onMessage.bind(this));
  this.socket.on("response", this.onResponse.bind(this));
  this.socket.on("subscribe", this.onSubscribe.bind(this));
  this.socket.on("ack", this.onAck.bind(this));
  this.pendingMsgs = {};
  var self = this;
  this.checkClientType();
}
util.inherits(Connection, EventEmitter);
/**
 * {
 * msgType,
 * msgId,
 * target,
 * err,
 * data
 * }
 */
Connection.prototype.onResponse = function (params) {
  if (params.target === fromServer) {
    this.emit("response-" + params.msgId, params);
  } else {
    connectionMgr.forwardResponse(params)
  }
}
/**
 * msgType,
 * target,
 * msgId,
 * data
 */
Connection.prototype.onMessage = function (params) {
  params.from = this.id;
  connectionMgr.forwardMsg(params);
}
/**
 * msgType,
 * target
 */
Connection.prototype.onSubscribe = function (params) {
  connectionMgr.subscribe(params, this);
}

Connection.prototype.checkClientType = function () {
  var self = this;
  var msgId = uuid.v4();
  this.sendMsgWithResponse({
    msgType: "general-client-type",
    from: fromServer,
    msgId: msgId
  })
    .then(function (params) {
      var d = params.data;
      if (d) {
        self.type = d.type;
        if (d.type === "mobile" && d.device) {
          self.device = d.device;
          self.id = d.device.uuid;
          device.setOnline(d.device);
        }
        log.info("Connection made from: ", d.type, " connection id: ", self.id);
      }
    })
    .then(null, function (err) {
      log.error("Cannot initialise connection.", err);
      connectionMgr.removeConnection(self);
    })
}


Connection.prototype.onAck = function (msgId) {
  if (this.pendingMsgs && this.pendingMsgs[msgId]) {
    this.pendingMsgs[msgId]();
    delete this.pendingMsgs[msgId];
  }
}
Connection.prototype.send = function (eventName, data) {
  this.socket.emit(eventName, data);
  var self = this;
  return Promise.promisify(this.socket.once, { context: this.socket })(eventName + "-reply").timeout(this.timeout, "Time out. Client cannot reach.");
}
Connection.prototype.sendMsg = function (params) {
  this.socket.emit('message', params);
  var self = this;
  return new Promise(function (res, rej) {
    self.pendingMsgs[params.msgId] = function () {
      clearTimeout(timer);
      res();
    }
    var timer = setTimeout(function () {
      log.info("Timeout sending message: ", params);
      rej();
    }, self.timeout);
  })
}
Connection.prototype.sendMsgWithResponse = function (params) {
  var self = this;
  return new Promise(function (res, rej) {
    self.once("response-" + params.msgId, function (rparams) {
      clearTimeout(timer);
      res(rparams);
    });
    var timer=null;
    self.sendMsg(params)
      .then(function () {
        timer = setTimeout(function () {
          rej(new Error("Timeout while waiting for response."));
        }, self.timeout);
      }, rej);
  });
}
Connection.prototype.heartBeat = function (count) {
  if (count === undefined){
    count=this.retry;
  }
  var self = this;
  return this.sendMsgWithResponse({
    msgType: "general-heart-beat",
    msgId: uuid.v4(),
    from: fromServer
  })
    .then(function () { }, function () {
      count --;
      if (count>0){
        return Promise.delay(self.retryDelay*1000).then(function(){
          return self.heartBeat(count);
        }) 
      }else{
        log.info("Connection " + self.id + " died.");
        connectionMgr.removeConnection(self);
      }
    })
}

Connection.prototype.reply = function (eventName, err, replyData) {
  this.socket.emit(eventName, err, replyData);
}

Connection.prototype.sendResponse = function (params) {
  this.socket.emit('response', params);
}
