module.exports = {
  onConnection: onNewConnection,
  findConnection: findConnection,
  removeConnection: removeConnection,
  getConnections: getConnections,
  startMonitorConnection: startMonitorConnection,
  forwardMsg: forwardMsg,
  forwardResponse: forwardResponse,
  subscribe: subscribe,
  sendToAllDevices: sendToAllDevices
}
var connections = [];
var uuid = require('uuid');
var _ = require('lodash');
var device = require('./device');
/**
 * {
 *  "connection id":{
 *    "event type":[Connections]
 * }
 * }
 */
var subscriptions = {};
function onNewConnection(socket) {
  var Connection = require('./Connection');
  var id = uuid.v4();
  var conn = new Connection(socket, id);
  connections.push(conn);
  socket.on("disconnect", function () {
    removeConnection(conn);
  });
}
function findConnection(target) {
  return _.find(connections, function (item) {
    return item.id === target;
  });
}

function removeConnection(connection) {
  if (connections.indexOf(connection) > -1) {
    log.info("Disconnect and remove connection: ", connection.id);
    connection.socket.disconnect();
    if (connection.type === "mobile") {
      device.setOffline(connection.device);
    }
    connections.splice(connections.indexOf(connection), 1);
    unsubscribe(connection);
  }
}

function getConnections() {
  return connections;
}

var timer = null;
var heartBeatInterval = env.get("HEART_BEAT");
function startMonitorConnection() {
  if (timer) {
    return;
  }
  timer = setInterval(function () {
    globalHeartBeat();
  }, heartBeatInterval * 1000);
}
var heartBeatInProgress = false;
function globalHeartBeat() {
  if (heartBeatInProgress) {
    return;
  }
  heartBeatInProgress = true;
  log.info("Start global heartbeat");
  Promise.all(_.map(connections, function (conn) { return conn.heartBeat() }))
    .then(function () {
      log.info("Global heartbeat finished successfully");
      heartBeatInProgress = false;
    }, function (err) {
      log.error("Global hearbeat failed with error:", err);
    })
}
function forwardMsg(params) {
  var target = params.target;
  if (target === "subscribers") {
    var fromId = params.from;
    var msgType = params.msgType;
    if (subscriptions[fromId] && subscriptions[fromId][msgType]) {
      _.each(subscriptions[fromId][msgType], function (conn) {
        conn.sendMsg(params);
      })
    }
  } else {
    var con = findConnection(target);
    if (con) {
      con.sendMsg(params);
    }
  }
}
function forwardResponse(params) {
  var target = params.target;
  var con = findConnection(target);
  if (con) {
    con.sendResponse(params);
  }
}

function subscribe(params, conn) {
  var target = params.target;
  var msgType = params.msgType;
  if (!subscriptions[target]) {
    subscriptions[target] = {};
  }
  if (!subscriptions[target][msgType]) {
    subscriptions[target][msgType] = [];
  }
  if (subscriptions[target][msgType].indexOf(conn) === -1) {
    subscriptions[target][msgType].push(conn);
  }
}
function unsubscribe(conn) {
  for (var key in subscriptions) {
    var item = subscriptions[key];
    for (var et in item) {
      var arr = item[et];
      if (arr.indexOf(conn) > -1) {
        arr.splice(arr.indexOf(conn), 1);
      }
    }
  }
}
function sendToAllDevices(msgType, data) {
  connections.forEach(function (item) {
    if (item.type === "mobile") {
      item.sendMsg({
        from: "server",
        msgType: msgType,
        msgId: uuid.v4(),
        data: data
      })
    }
  })
}
startMonitorConnection();