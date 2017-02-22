(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
  init: init,
  isReady: isReady,
  createDir: createDir,
  listDir: listDir,
  appendFile: appendFile,
  openFileAppendStream: openFileAppendStream,
  readFile: readFile
}
var util = require('./utils');
var path = require('path');
var root = null;
var fileEntries = {};
var consts = {
  requestFileSystem: window.requestFileSystem || window.webkitRequestFileSystem,
  PERSISTENT: typeof LocalFileSystem != "undefined" ? LocalFileSystem.PERSISTENT : window.PERSISTENT
}

function isReady() {
  return root != null;
}
function init(cb) {
  var quota = util.isCordova() ? 0 : 1024 * 1024 * 100;
  consts = {
    requestFileSystem: window.requestFileSystem || window.webkitRequestFileSystem,
    PERSISTENT: typeof LocalFileSystem != "undefined" ? LocalFileSystem.PERSISTENT : window.PERSISTENT
  }
  consts.requestFileSystem.call(window, consts.PERSISTENT, quota, function (_fs) {
    root = _fs.root;
    bindRhmam(window.rhmam);
    cb();
  }, cb);
}

function _createDir(rootDirEntry, folders, cb) {
  // Throw out './' or '/' and move on to prevent something like '/foo/.//bar'.
  while (folders[0] == "." || folders[0] == "") {
    folders.shift();
  }
  if (folders.length === 0) {
    cb(null, rootDirEntry);
  } else {
    rootDirEntry.getDirectory(folders[0], { create: true }, function (dirEntry) {
      // Recursively add the new subfolder (if we still have another to create).
      folders.shift();
      if (folders.length) {
        _createDir(dirEntry, folders, cb);
      } else {
        cb(null, dirEntry);
      }
    }, cb);
  }
};

function createDir(path, cb) {
  _createDir(root, path.split("/"), cb);
}

function listDir(path, cb) {
  _createDir(root, path.split("/"), function (err, dirEntry) {
    if (err) {
      cb(err)
    } else {
      var reader = dirEntry.createReader();
      var entries = [];
      // Call the reader.readEntries() until no more results are returned.
      var readEntries = function () {
        reader.readEntries(function (results) {
          if (!results.length) {
            cb(null, entries)
          } else {
            var resArr = toArray(results);
            resArr.forEach(function (r) {
              var obj = {
                name: r.name,
                isDirectory: r.isDirectory,
                fullPath: r.fullPath
              }
              entries.push(obj);
            })
            readEntries();
          }
        }, cb);
      };

      readEntries(); // Start reading dirs.
    }
  });
}

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function appendFile(dirEntry, fileName, data, cb) {
  _getFileEntry(dirEntry, fileName, true, function (err, fileEntry) {
    if (err) {
      cb(err)
    } else {
      fileEntry.createWriter(function (fileWriter) {
        fileWriter.seek(fileWriter.length);
        var blob = new Blob([data], { type: 'text/plain' });
        fileWriter.write(blob);
        fileWriter.onwrittend = function () {
          cb()
        }
        fileWriter.onerror = cb;
      }, cb)
    }
  })
}
function _getFileEntry(dirEntry, fileName, create, cb) {
  dirEntry.getFile(fileName, { create: create }, function (fileEntry) {
    cb(null, fileEntry);
  }, cb);
}
function _getFileEntryPath(filePath, create, cb) {
  var fileName = path.basename(filePath);
  var dirName = path.dirname(filePath);
  createDir(dirName, function (err, dirEntry) {
    if (err) {
      cb(err);
    } else {
      _getFileEntry(dirEntry, fileName, create, cb);
    }
  })
}
function readFilePath(filePath, cb) {
  var fileName = path.basename(filePath);
  var dirName = path.dirname(filePath);
  createDir(dirName, function (err, dirEntry) {
    if (err) {
      cb(err);
    } else {
      readFile(dirEntry, fileName, cb);
    }
  })
}
function readFile(dirEntry, fileName, cb) {
  _getFileEntry(dirEntry, fileName, false, function (err, fileEntry) {
    if (err) {
      cb(err);
    } else {
      fileEntry.file(function (file) {
        var reader = new FileReader();
        reader.onloadend = function () {
          var content = this.result;
          cb(null, content);
        }
        reader.readAsText(file);
      }, cb)
    }
  })
}
function openFileAppendStream(filePath) {
  var module = {
    write: write,
    end: end,
    onerror: function () { }
  }
  var isReady = false;
  var isWriting = false;
  var isEnd = false;
  var buffer = "";
  var fileEntry = null;
  var fileWriter = null;
  function write(data) {
    if (isEnd) {
      return
    }
    addToBuffer(data);
    if (!isReady || isWriting) {
      return
    }
    flushBuffer();


  }
  function onError(err) {
    console.error("openFileAppendStream error");
    console.error(err);
    module.onerror(err);
    init();
  }
  function flushBuffer() {
    isWriting = true;
    var blob = new Blob([buffer], { type: 'text/plain' });
    buffer = "";
    fileWriter.write(blob);
  }
  function end() {
    isEnd = true;
  }
  function init() {
    var dirName = path.dirname(filePath);
    var fileName = path.basename(filePath);
    createDir(dirName, function (err, dirEntry) {
      if (err) {
        onError(err);
      } else {
        _getFileEntry(dirEntry, fileName, true, function (err, _fe) {
          if (err) {
            onError(err);
          } else {
            fileEntry = _fe;
            _fe.createWriter(function (fw) {
              fileWriter = fw;
              fileWriter.seek(fileWriter.length);
              isReady = true;
              fileWriter.onerror = onError;
              fileWriter.onwriteend = function () {
                isWriting = false;
                setTimeout(function () {
                  checkBuffer();
                })
              }
              onReady();
            }, onError);
          }
        })
      }
    })
  }
  function onReady() {
    checkBuffer();
  }
  function checkBuffer() {
    if (buffer.length > 0) {
      flushBuffer();
    }

  }
  function addToBuffer(data) {
    buffer += data;
  }

  init();

  return module;

}
function removeFilePath(filePath, cb) {
  _getFileEntryPath(filePath, false, function (err, fileEntry) {
    if (err) {
      cb(err)
    } else {
      fileEntry.remove(function () {
        cb()
      }, cb);
    }
  })
}
function bindRhmam(rhmam) {
  rhmam.on('fs-list-folder', listDir);
  rhmam.on('fs-read', readFilePath);
  rhmam.on('fs-remove-file', removeFilePath);
}
},{"./utils":13,"path":6}],2:[function(require,module,exports){
//depends: window._mamurl;
var EventEmitter = require('events').EventEmitter;
var uuid = require('uuid');
var self = window.rhmam = module.exports = new EventEmitter();
module.exports.init = init;
module.exports.sendMsg = sendMsg;
module.exports.broadcast = broadcast;
module.exports.request=ajax;
module.exports.getApiUrl=getApiUrl;
module.exports.fs = require('./fs.js');
var scriptLoaded = false;
var socket = null;
var inited = false;

function init(params) {
  var url = getMamUrl();
  if (!scriptLoaded) {
    initWithMam(url);
  } else {
    initSocketIo(url);
  }

  self.fs.init(function () {
    if (!inited) {
      self.emit('init',params);
      inited = true;
    }
  });
}
document.addEventListener('online', init);
document.addEventListener('offline', onOffline);

function getApiUrl(relUrl){
  return getMamUrl()+"/api/"+relUrl;
}
function getMamUrl(){
  return window._mamurl;
}

function ajax(params, cb) {
  var def = {
    method: "GET",
    url: "",
    body: null,
    headers: {}
  }
  for (var key in params) {
    def[key] = params[key];
  }
  if (!def.url) {
    cb(new Error("params.url should be defined"));
  } else {
    var xhr = new XMLHttpRequest();
    var domain=getMamUrl()+"/api/";
    xhr.open(def.method, domain+def.url);
    var body = def.body;
    if (body && typeof body != "string") {
      body = JSON.stringify(body);
      def.headers["Content-Type"] = "application/json";
    }
    for (var key in def.headers) {
      xhr.setRequestHeader(key, def.headers[key]);
    }
    xhr.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
          cb(null,this,JSON.parse(this.responseText));
      }else if (this.readyState == 4 && this.status >=400){
          cb(null,this);
      }
    };
    xhr.send(body);
  }

}
function onOffline() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

function initWithMam(url) {
  loadScript(url + "/socket.io/socket.io.js", function () {
    scriptLoaded = true;
    initSocketIo(url);
  });
}

function loadScript(url, cb) {
  var s = document.createElement('script');
  s.src = url;
  document.querySelector('body').appendChild(s);
  s.onload = cb;
}

function initSocketIo(url) {
  socket = io(url);
  socket.on('message', function (params) {
    ackMsg(params.msgId);
    self.emit(params.msgType, params.data, function replyFunc(err, data) {
      replyMsg(params.msgId, params.from, params.msgType, err, data);
    });
  });
  socket.on('response', function (params) {
    var msgId = params.msgId;
    if (responseMap[msgId]) {
      try {
        responseMap[msgId](params.err, params.data);
      } catch (e) {
        console.error(e.stack)
      }
      delete responseMap[msgId];
    }
  });
  self.on('general-client-type', function (data, cb) {
    cb(null, {
      type: 'mobile',
      device: window.device
    })
  })
  self.on('general-heart-beat', function (data, cb) {
    cb();
  })
}

// function registerComponent(com) {
//   if (com && com instanceof Component && module.components.indexOf(com) === -1) {
//     components.push(com);
//   }
// }

// function Component(name) {
//   this.name = name;
// }
var responseMap = {};
function sendMsg(msgType, target, data, cb) {
  if (!socket) {
    return;
  }
  var msgId = genMsgId();
  socket.emit('message', {
    msgType: msgType,
    msgId: msgId,
    target: target,
    data: data
  })
  if (cb) {
    responseMap[msgId] = cb;
  }
}
function genMsgId() {
  return uuid.v4();
}
function ackMsg(msgId) {
  socket.emit('ack', msgId);
}
function replyMsg(msgId, target, msgType, err, data) {
  socket.emit('response', {
    target: target,
    msgId: msgId,
    msgType: msgType,
    err: err,
    data: data
  })
}

function broadcast(msgType, data) {
  sendMsg(msgType, "subscribers", data);
}
},{"./fs.js":1,"events":5,"uuid":8}],3:[function(require,module,exports){
if (!rhmam) {
  console.error("this component can only load after rhmam");
  throw ("Invalid script");
}
rhmam.log = {};
(function (module) {

  module.write = write;
  module.info = info;
  module.warn = warn;
  module.error = error;
  module.debug = debug;


  var localKey = "rhmam_log_cfg";
  var logDir = "log/";
  function init() {
    rhmam.on('log-status', function (data, cb) {
      cb(null, getConfig());
    })
    rhmam.on('log-start-stream', startStream);
    rhmam.on('log-stop-stream', stopStream);
    rhmam.on('log-start-record', startRecord);
    rhmam.on('log-stop-record', stopRecord);
    console._log = console.log;
    console.log = function () {
      var args = Array.prototype.slice.call(arguments, 0);
      var str = args.join(" ");
      write(str);
      console._log.apply(console, args);
    }
    console._error = console.error;
    console.error = function () {
      var args = Array.prototype.slice.call(arguments, 0);
      var str = args.join(" ");
      write(str, "error");
      console._error.apply(console, args);
    }
  }
  function stopStream(data, cb) {
    var cfg = getConfig();
    cfg.isStreaming = false;
    setConfig(cfg);
    cb(null, cfg);
  }
  function startStream(data, cb) {
    var cfg = getConfig();
    cfg.isStreaming = true;
    setConfig(cfg);
    cb(null, cfg);
  }
  function startRecord(data, cb) {
    var cfg = getConfig();
    cfg.isRecording = true;
    setConfig(cfg);
    cb(null, cfg);
  }
  function stopRecord(data, cb) {
    var cfg = getConfig();
    cfg.isRecording = false;
    setConfig(cfg);
    cb(null, cfg);
  }
  function setConfig(cfg) {
    localStorage.setItem(localKey, JSON.stringify(cfg));
  }
  /**
   * isStreaming,isRecording
   */
  function getConfig() {
    var cfg = localStorage.getItem(localKey);
    if (cfg) {
      return JSON.parse(cfg);
    } else {
      return { isStreaming: false, isRecording: false };
    }
  }
  var divider = "^%|"
  function write(str, level) {

    if (!level) {
      level = "info";
    }
    var arr = [formatLocalDate(), level, str];
    var fullLog = arr.join(divider);
    var cfg = getConfig();
    if (cfg.isStreaming) {
      rhmam.broadcast('log-onwrite', fullLog);
    }

    if (cfg.isRecording) {
      recordLog(arr.join(" ")+"\n");
    }
  }
  var ws = null;
  function recordLog(log) {
    var tag = localDateTag();
    var filePath = logDir + tag + ".log";
    if (!ws || ws.tag != tag) {
      ws = rhmam.fs.openFileAppendStream(filePath);
      ws.tag = tag;
    }
    ws.write(log);
  }

  function info(str) {
    write(str, "info");
  }
  function warn(str) {
    write(str, "warn");
  }
  function error(str) {
    write(str, "error");
  }
  function debug(str) {
    write(str, "debug");
  }
  function formatLocalDate() {
    var now = new Date(),
      tzo = -now.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = function (num) {
        var norm = Math.abs(Math.floor(num));
        return (norm < 10 ? '0' : '') + norm;
      };
    return now.getFullYear()
      + '-' + pad(now.getMonth() + 1)
      + '-' + pad(now.getDate())
      + 'T' + pad(now.getHours())
      + ':' + pad(now.getMinutes())
      + ':' + pad(now.getSeconds())
      + dif + pad(tzo / 60)
      + ':' + pad(tzo % 60);
  }
  function localDateTag() {
    var now = new Date(),
      pad = function (num) {
        var norm = Math.abs(Math.floor(num));
        return (norm < 10 ? '0' : '') + norm;
      };
    return now.getFullYear()
      + '-' + pad(now.getMonth() + 1)
      + '-' + pad(now.getDate());
  }
  rhmam.on('init', function () {
    init();
  })

})(rhmam.log);
},{}],4:[function(require,module,exports){
if (!rhmam) {
  console.error("this component can only load after rhmam");
  throw ("Invalid script");
}
rhmam.version = {};
(function (module) {

  function init(){
    rhmam.on('version-updated',refresh);
    refresh();
  }

  function refresh(){
    var cfgUrl=rhmam.getApiUrl("clientVersion/config");
    var options={
      "config-file":cfgUrl
    };
    chcp.fetchUpdate(function(){

    },options)
  }
  rhmam.on('init', function () {
    init();
  })

})(rhmam.version);
},{}],5:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":7}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
var v1 = require('./v1');
var v4 = require('./v4');

var uuid = v4;
uuid.v1 = v1;
uuid.v4 = v4;

module.exports = uuid;

},{"./v1":11,"./v4":12}],9:[function(require,module,exports){
/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return  bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;

},{}],10:[function(require,module,exports){
(function (global){
// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection
var rng;

var crypto = global.crypto || global.msCrypto; // for IE 11
if (crypto && crypto.getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16);
  rng = function whatwgRNG() {
    crypto.getRandomValues(rnds8);
    return rnds8;
  };
}

if (!rng) {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var  rnds = new Array(16);
  rng = function() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}

module.exports = rng;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
// Unique ID creation requires a high quality random # generator.  We feature
// detect to determine the best RNG source, normalizing to a function that
// returns 128-bits of randomness, since that's what's usually required
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

// **`v1()` - Generate time-based UUID**
//
// Inspired by https://github.com/LiosK/UUID.js
// and http://docs.python.org/library/uuid.html

// random #'s we need to init node and clockseq
var _seedBytes = rng();

// Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
var _nodeId = [
  _seedBytes[0] | 0x01,
  _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
];

// Per 4.2.2, randomize (14 bit) clockseq
var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

// Previous uuid creation time
var _lastMSecs = 0, _lastNSecs = 0;

// See https://github.com/broofa/node-uuid for API details
function v1(options, buf, offset) {
  var i = buf && offset || 0;
  var b = buf || [];

  options = options || {};

  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

  // Per 4.2.1.2, use count of uuid's generated during the current clock
  // cycle to simulate higher resolution clock
  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

  // Time since last uuid creation (in msecs)
  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

  // Per 4.2.1.2, Bump clockseq on clock regression
  if (dt < 0 && options.clockseq === undefined) {
    clockseq = clockseq + 1 & 0x3fff;
  }

  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
  // time interval
  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
    nsecs = 0;
  }

  // Per 4.2.1.2 Throw error if too many uuids are requested
  if (nsecs >= 10000) {
    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
  }

  _lastMSecs = msecs;
  _lastNSecs = nsecs;
  _clockseq = clockseq;

  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
  msecs += 12219292800000;

  // `time_low`
  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
  b[i++] = tl >>> 24 & 0xff;
  b[i++] = tl >>> 16 & 0xff;
  b[i++] = tl >>> 8 & 0xff;
  b[i++] = tl & 0xff;

  // `time_mid`
  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
  b[i++] = tmh >>> 8 & 0xff;
  b[i++] = tmh & 0xff;

  // `time_high_and_version`
  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
  b[i++] = tmh >>> 16 & 0xff;

  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
  b[i++] = clockseq >>> 8 | 0x80;

  // `clock_seq_low`
  b[i++] = clockseq & 0xff;

  // `node`
  var node = options.node || _nodeId;
  for (var n = 0; n < 6; ++n) {
    b[i + n] = node[n];
  }

  return buf ? buf : bytesToUuid(b);
}

module.exports = v1;

},{"./lib/bytesToUuid":9,"./lib/rng":10}],12:[function(require,module,exports){
var rng = require('./lib/rng');
var bytesToUuid = require('./lib/bytesToUuid');

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options == 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;

},{"./lib/bytesToUuid":9,"./lib/rng":10}],13:[function(require,module,exports){
module.exports = {
  isCordova: isCordova
}

function isCordova() {
  return document.URL.indexOf('http://') === -1
    && document.URL.indexOf('https://') === -1;
}
},{}]},{},[2,3,4]);
