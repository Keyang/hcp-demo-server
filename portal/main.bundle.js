webpackJsonp([1,5],{

/***/ 129:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_events__ = __webpack_require__(532);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_events___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_events__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__(179);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_toPromise__ = __webpack_require__(560);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_toPromise___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_add_operator_toPromise__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_url__ = __webpack_require__(575);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_url___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_url__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_path__ = __webpack_require__(598);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_path___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_path__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CommService; });
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var uuid = __webpack_require__(577);
var CommService = (function (_super) {
    __extends(CommService, _super);
    function CommService(http) {
        _super.call(this);
        this.http = http;
        this.responseMap = {};
        var parsed = __WEBPACK_IMPORTED_MODULE_4_url__["parse"](location.href);
        this.host = parsed.protocol + "//" + parsed.host;
        this.pathName = parsed.pathname;
        if (this.pathName[this.pathName.length - 1] === '/') {
            this.pathName = this.pathName.substr(0, this.pathName.length - 2);
        }
        var s = document.createElement("script");
        s.onload = this.initSocketIo.bind(this);
        s.onerror = this.initSocketIoError.bind(this);
        var wsUrl = this.getHost() + "/socket.io/socket.io.js";
        s.src = wsUrl;
        document.querySelector('body').appendChild(s);
    }
    CommService.prototype.getPath = function () {
        return this.host + this.pathName;
    };
    CommService.prototype.getHost = function () {
        return this.host;
    };
    CommService.prototype.initSocketIoError = function (e) {
        console.error("Cannot init websocket: Cannot load socket.io.js");
    };
    CommService.prototype.initSocketIo = function () {
        this.socket = io(this.getHost());
        this.socket.on('message', this.onMessage.bind(this));
        this.socket.on('response', this.onResponse.bind(this));
        this.on("general-client-type", function (data, cb) {
            cb(null, { type: 'admin' });
        });
        this.on("general-heart-beat", function (data, cb) {
            cb();
        });
        this.emit("socketioready");
    };
    CommService.prototype.request = function (url, param) {
        var fullUrl = this.getPath() + __WEBPACK_IMPORTED_MODULE_5_path__["join"]("/api", url);
        return this.http.request(fullUrl, param).toPromise();
    };
    CommService.prototype.errorHandler = function (r) {
        var txt = r instanceof Error ? r.message : r.text();
        toastr.error(txt);
    };
    CommService.prototype.showErr = function (r) {
        toastr.error(r.message);
    };
    CommService.prototype.reply = function (event, err, data) {
        this.socket.emit(event + "-reply", err, data);
    };
    CommService.prototype.ackMsg = function (msgId) {
        this.socket.emit('ack', msgId);
    };
    CommService.prototype.onMessage = function (params) {
        var _this = this;
        this.ackMsg(params.msgId);
        this.emit(params.msgType, params.data, function (err, data) {
            _this.replyMsg(params.msgId, params.from, params.msgType, err, data);
        });
    };
    CommService.prototype.replyMsg = function (msgId, target, msgType, err, data) {
        this.socket.emit('response', {
            target: target,
            msgId: msgId,
            msgType: msgType,
            err: err,
            data: data
        });
    };
    CommService.prototype.onResponse = function (params) {
        var msgId = params.msgId;
        if (this.responseMap[msgId]) {
            try {
                this.responseMap[msgId](params.err, params.data);
            }
            catch (e) {
                console.error(e.stack);
            }
            delete this.responseMap[msgId];
        }
    };
    CommService.prototype.sendMsg = function (msgType, target, data, cb) {
        var _this = this;
        if (!this.socket) {
            this.once('socketioready', function () {
                _this.sendMsg(msgType, target, data, cb);
            });
            return;
        }
        var msgId = this.genMsgId();
        this.socket.emit('message', {
            msgType: msgType,
            msgId: msgId,
            target: target,
            data: data
        });
        if (cb) {
            this.responseMap[msgId] = cb;
        }
    };
    CommService.prototype.genMsgId = function () {
        return uuid.v4();
    };
    CommService.prototype.subscribe = function (msgType, target) {
        var _this = this;
        if (!this.socket) {
            this.once('socketioready', function () {
                _this.subscribe(msgType, target);
            });
            return;
        }
        this.socket.emit('subscribe', {
            msgType: msgType,
            target: target
        });
    };
    CommService = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["d" /* Injectable */])(), 
        __metadata('design:paramtypes', [(typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_2__angular_http__["b" /* Http */]) === 'function' && _a) || Object])
    ], CommService);
    return CommService;
    var _a;
}(__WEBPACK_IMPORTED_MODULE_1_events__["EventEmitter"]));
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/comm.service.js.map

/***/ }),

/***/ 193:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return Device; });
var Device = (function () {
    function Device(json) {
        for (var key in json) {
            this[key] = json[key];
        }
    }
    Device.getDeviceList = function (comm) {
        return comm.request("/device", { method: 'GET' }).then(function (v) {
            var rtn = [];
            var list = v.json();
            list.forEach(function (item) {
                rtn.push(new Device(item));
            });
            return rtn;
        });
    };
    Device.fromDeviceUuid = function (uuid, comm) {
        return comm.request("/device/" + uuid, { method: 'GET' }).then(function (v) {
            return new Device(v.json());
        });
    };
    return Device;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/Device.js.map

/***/ }),

/***/ 309:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__device_Device__ = __webpack_require__(193);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__(83);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__comm_comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientLogDetailComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ClientLogDetailComponent = (function () {
    function ClientLogDetailComponent(router, comm) {
        this.router = router;
        this.comm = comm;
        this.liveLogs = [];
        this.divider = "^%|";
        this.refreshing = false;
        this.loadingStatus = false;
    }
    Object.defineProperty(ClientLogDetailComponent.prototype, "status", {
        get: function () {
            return this._status;
        },
        set: function (val) {
            this._status = val;
            this.comm.removeAllListeners('log-onwrite');
            if (val.isStreaming) {
                this.comm.subscribe('log-onwrite', this.deviceId);
                this.comm.on('log-onwrite', this.onLogStream.bind(this));
            }
        },
        enumerable: true,
        configurable: true
    });
    ClientLogDetailComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.router.params.forEach(function (item) {
            _this.deviceId = item['deviceId'];
            _this.refresh();
        });
    };
    ClientLogDetailComponent.prototype.refresh = function () {
        var _this = this;
        this.refreshing = true;
        __WEBPACK_IMPORTED_MODULE_1__device_Device__["a" /* Device */].fromDeviceUuid(this.deviceId, this.comm)
            .then(function (d) {
            _this.device = d;
            if (_this.device.online) {
                _this.getStatus();
            }
        }, this.comm.errorHandler)
            .then(function () { return _this.refreshing = false; });
    };
    ClientLogDetailComponent.prototype.getStatus = function () {
        var _this = this;
        this.loadingStatus = true;
        this.comm.sendMsg("log-status", this.deviceId, null, function (err, data) {
            _this.status = data;
            _this.loadingStatus = false;
        });
    };
    ClientLogDetailComponent.prototype.startStream = function () {
        var _this = this;
        this.comm.sendMsg('log-start-stream', this.deviceId, null, function (err, data) {
            _this.status = data;
        });
    };
    ClientLogDetailComponent.prototype.stopStream = function () {
        var _this = this;
        this.comm.sendMsg('log-stop-stream', this.deviceId, null, function (err, data) {
            _this.status = data;
        });
    };
    ClientLogDetailComponent.prototype.onLogStream = function (data) {
        this.liveLogs.unshift(this.split(data));
    };
    ClientLogDetailComponent.prototype.split = function (log) {
        var split = log.split(this.divider);
        return {
            ts: split[0],
            level: split[1],
            txt: split[2]
        };
    };
    ClientLogDetailComponent.prototype.startRecord = function () {
        var _this = this;
        this.comm.sendMsg('log-start-record', this.deviceId, null, function (err, data) {
            _this.status = data;
        });
    };
    ClientLogDetailComponent.prototype.stopRecord = function () {
        var _this = this;
        this.comm.sendMsg('log-stop-record', this.deviceId, null, function (err, data) {
            _this.status = data;
        });
    };
    ClientLogDetailComponent.prototype.showLogContent = function (ev) {
        var f = ev.file;
        var data = ev.data;
        this.openedLog = ev;
        $(this.logModal.nativeElement).modal();
    };
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_3" /* ViewChild */])("logModal"), 
        __metadata('design:type', (typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["H" /* ElementRef */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_0__angular_core__["H" /* ElementRef */]) === 'function' && _a) || Object)
    ], ClientLogDetailComponent.prototype, "logModal", void 0);
    ClientLogDetailComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-client-log-detail',
            template: __webpack_require__(551),
            styles: [__webpack_require__(542)]
        }), 
        __metadata('design:paramtypes', [(typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__angular_router__["b" /* ActivatedRoute */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_2__angular_router__["b" /* ActivatedRoute */]) === 'function' && _b) || Object, (typeof (_c = typeof __WEBPACK_IMPORTED_MODULE_3__comm_comm_service__["a" /* CommService */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_3__comm_comm_service__["a" /* CommService */]) === 'function' && _c) || Object])
    ], ClientLogDetailComponent);
    return ClientLogDetailComponent;
    var _a, _b, _c;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-log-detail.component.js.map

/***/ }),

/***/ 310:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__(83);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientLogComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ClientLogComponent = (function () {
    function ClientLogComponent(router) {
        this.router = router;
    }
    ClientLogComponent.prototype.ngOnInit = function () {
    };
    ClientLogComponent.prototype.choseDevice = function (d) {
        this.router.navigate(['/clientLog', d.uuid]);
    };
    ClientLogComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-client-log',
            template: __webpack_require__(552),
            styles: [__webpack_require__(543)]
        }), 
        __metadata('design:paramtypes', [(typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* Router */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_1__angular_router__["c" /* Router */]) === 'function' && _a) || Object])
    ], ClientLogComponent);
    return ClientLogComponent;
    var _a;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-log.component.js.map

/***/ }),

/***/ 311:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__(179);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return CommModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var CommModule = (function () {
    function CommModule() {
    }
    CommModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_common__["a" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_http__["a" /* HttpModule */]
            ],
            declarations: [],
            providers: [__WEBPACK_IMPORTED_MODULE_3__comm_service__["a" /* CommService */]]
        }), 
        __metadata('design:paramtypes', [])
    ], CommModule);
    return CommModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/comm.module.js.map

/***/ }),

/***/ 312:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_forms__ = __webpack_require__(280);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_common__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__device_routes_module__ = __webpack_require__(471);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__device_component__ = __webpack_require__(472);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__devicelist_component__ = __webpack_require__(313);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__comm_comm_module__ = __webpack_require__(311);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DeviceModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var DeviceModule = (function () {
    function DeviceModule() {
    }
    DeviceModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_2__angular_common__["a" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_3__device_routes_module__["a" /* DeviceRouteModule */],
                __WEBPACK_IMPORTED_MODULE_6__comm_comm_module__["a" /* CommModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_forms__["a" /* FormsModule */]
            ],
            declarations: [__WEBPACK_IMPORTED_MODULE_5__devicelist_component__["a" /* DevicelistComponent */], __WEBPACK_IMPORTED_MODULE_4__device_component__["a" /* DeviceComponent */]],
            exports: [__WEBPACK_IMPORTED_MODULE_4__device_component__["a" /* DeviceComponent */], __WEBPACK_IMPORTED_MODULE_5__devicelist_component__["a" /* DevicelistComponent */]]
        }), 
        __metadata('design:paramtypes', [])
    ], DeviceModule);
    return DeviceModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/device.module.js.map

/***/ }),

/***/ 313:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Device__ = __webpack_require__(193);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__comm_comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DevicelistComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var DevicelistComponent = (function () {
    function DevicelistComponent(comm) {
        this.comm = comm;
        this.deviceList = [];
        this.refreshing = false;
        this.onChoseDevice = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */]();
    }
    DevicelistComponent.prototype.ngOnInit = function () {
        this.refresh();
    };
    DevicelistComponent.prototype.refresh = function () {
        var _this = this;
        this.refreshing = true;
        __WEBPACK_IMPORTED_MODULE_1__Device__["a" /* Device */].getDeviceList(this.comm).then(function (list) {
            _this.deviceList = list.sort(function (d1, d2) {
                if (d1.online) {
                    return -1;
                }
                else if (d2.online) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        }, this.comm.errorHandler).then(function () { _this.refreshing = false; });
    };
    DevicelistComponent.prototype.getDevices = function () {
        if (this.filterStr) {
            var f_1 = this.filterStr.toLowerCase();
            return this.deviceList.filter(function (item) {
                for (var key in item) {
                    if (item[key].toString && item[key].toString().toLowerCase().indexOf(f_1) > -1) {
                        return true;
                    }
                }
                return false;
            });
        }
        else {
            return this.deviceList;
        }
    };
    DevicelistComponent.prototype.clickDevice = function (d) {
        this.onChoseDevice.emit(d);
    };
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["R" /* Output */])(), 
        __metadata('design:type', (typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */]) === 'function' && _a) || Object)
    ], DevicelistComponent.prototype, "onChoseDevice", void 0);
    DevicelistComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-devicelist',
            template: __webpack_require__(554),
            styles: [__webpack_require__(545)]
        }), 
        __metadata('design:paramtypes', [(typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_2__comm_comm_service__["a" /* CommService */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_2__comm_comm_service__["a" /* CommService */]) === 'function' && _b) || Object])
    ], DevicelistComponent);
    return DevicelistComponent;
    var _a, _b;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/devicelist.component.js.map

/***/ }),

/***/ 344:
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	throw new Error("Cannot find module '" + req + "'.");
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 344;


/***/ }),

/***/ 345:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__ = __webpack_require__(437);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__environments_environment__ = __webpack_require__(476);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__app_app_module__ = __webpack_require__(468);




if (__WEBPACK_IMPORTED_MODULE_2__environments_environment__["a" /* environment */].production) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__angular_core__["a" /* enableProdMode */])();
}
__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_3__app_app_module__["a" /* AppModule */]);
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/main.js.map

/***/ }),

/***/ 467:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AppComponent = (function () {
    function AppComponent(comm) {
        this.comm = comm;
        this.title = 'app works!';
    }
    AppComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-root',
            template: __webpack_require__(550),
            styles: [__webpack_require__(541)]
        }), 
        __metadata('design:paramtypes', [(typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */]) === 'function' && _a) || Object])
    ], AppComponent);
    return AppComponent;
    var _a;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/app.component.js.map

/***/ }),

/***/ 468:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_forms__ = __webpack_require__(280);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_http__ = __webpack_require__(179);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__app_component__ = __webpack_require__(467);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__nav_nav_component__ = __webpack_require__(474);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__main_main_component__ = __webpack_require__(473);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__angular_router__ = __webpack_require__(83);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__client_log_client_log_module__ = __webpack_require__(469);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__comm_comm_module__ = __webpack_require__(311);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__device_device_module__ = __webpack_require__(312);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__routes__ = __webpack_require__(475);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__client_version_client_version_module__ = __webpack_require__(596);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};













var AppModule = (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__angular_core__["b" /* NgModule */])({
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */],
                __WEBPACK_IMPORTED_MODULE_5__nav_nav_component__["a" /* NavComponent */],
                __WEBPACK_IMPORTED_MODULE_6__main_main_component__["a" /* MainComponent */]
            ],
            imports: [
                __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_2__angular_forms__["a" /* FormsModule */],
                __WEBPACK_IMPORTED_MODULE_3__angular_http__["a" /* HttpModule */],
                __WEBPACK_IMPORTED_MODULE_8__client_log_client_log_module__["a" /* ClientLogModule */],
                __WEBPACK_IMPORTED_MODULE_7__angular_router__["a" /* RouterModule */].forRoot(__WEBPACK_IMPORTED_MODULE_11__routes__["a" /* route */], { useHash: true }),
                __WEBPACK_IMPORTED_MODULE_9__comm_comm_module__["a" /* CommModule */],
                __WEBPACK_IMPORTED_MODULE_10__device_device_module__["a" /* DeviceModule */],
                __WEBPACK_IMPORTED_MODULE_12__client_version_client_version_module__["a" /* ClientVersionModule */]
            ],
            providers: [],
            bootstrap: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]],
            exports: [__WEBPACK_IMPORTED_MODULE_4__app_component__["a" /* AppComponent */]]
        }), 
        __metadata('design:paramtypes', [])
    ], AppModule);
    return AppModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/app.module.js.map

/***/ }),

/***/ 469:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__ = __webpack_require__(82);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__client_log_component__ = __webpack_require__(310);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__client_routes_module__ = __webpack_require__(470);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__device_device_module__ = __webpack_require__(312);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__client_log_detail_component__ = __webpack_require__(309);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__client_file_client_file_module__ = __webpack_require__(592);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientLogModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};







var ClientLogModule = (function () {
    function ClientLogModule() {
    }
    ClientLogModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser__["a" /* BrowserModule */],
                __WEBPACK_IMPORTED_MODULE_3__client_routes_module__["a" /* ClientLogRouteModule */],
                __WEBPACK_IMPORTED_MODULE_4__device_device_module__["a" /* DeviceModule */],
                __WEBPACK_IMPORTED_MODULE_6__client_file_client_file_module__["a" /* ClientFileModule */]
            ],
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__client_log_component__["a" /* ClientLogComponent */],
                __WEBPACK_IMPORTED_MODULE_5__client_log_detail_component__["a" /* ClientLogDetailComponent */]
            ],
            exports: []
        }), 
        __metadata('design:paramtypes', [])
    ], ClientLogModule);
    return ClientLogModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-log.module.js.map

/***/ }),

/***/ 470:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__(83);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__client_log_component__ = __webpack_require__(310);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__client_log_detail_component__ = __webpack_require__(309);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientLogRouteModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var routes = [
    {
        'path': 'clientLogs', component: __WEBPACK_IMPORTED_MODULE_2__client_log_component__["a" /* ClientLogComponent */]
    },
    {
        'path': 'clientLog/:deviceId', component: __WEBPACK_IMPORTED_MODULE_3__client_log_detail_component__["a" /* ClientLogDetailComponent */]
    }
];
var ClientLogRouteModule = (function () {
    function ClientLogRouteModule() {
    }
    ClientLogRouteModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* RouterModule */].forChild(routes)
            ],
            exports: []
        }), 
        __metadata('design:paramtypes', [])
    ], ClientLogRouteModule);
    return ClientLogRouteModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-routes.module.js.map

/***/ }),

/***/ 471:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__(83);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__devicelist_component__ = __webpack_require__(313);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DeviceRouteModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var routes = [
    {
        path: 'devices', component: __WEBPACK_IMPORTED_MODULE_2__devicelist_component__["a" /* DevicelistComponent */]
    }
];
var DeviceRouteModule = (function () {
    function DeviceRouteModule() {
    }
    DeviceRouteModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* RouterModule */].forChild(routes)
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], DeviceRouteModule);
    return DeviceRouteModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/device-routes.module.js.map

/***/ }),

/***/ 472:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__Device__ = __webpack_require__(193);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return DeviceComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var DeviceComponent = (function () {
    function DeviceComponent() {
    }
    DeviceComponent.prototype.ngOnInit = function () {
    };
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', (typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__Device__["a" /* Device */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_1__Device__["a" /* Device */]) === 'function' && _a) || Object)
    ], DeviceComponent.prototype, "device", void 0);
    DeviceComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-device',
            template: __webpack_require__(553),
            styles: [__webpack_require__(544)]
        }), 
        __metadata('design:paramtypes', [])
    ], DeviceComponent);
    return DeviceComponent;
    var _a;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/device.component.js.map

/***/ }),

/***/ 473:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return MainComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var MainComponent = (function () {
    function MainComponent() {
    }
    MainComponent.prototype.ngOnInit = function () {
    };
    MainComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-main',
            template: __webpack_require__(555),
            styles: [__webpack_require__(546)]
        }), 
        __metadata('design:paramtypes', [])
    ], MainComponent);
    return MainComponent;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/main.component.js.map

/***/ }),

/***/ 474:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return NavComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var NavComponent = (function () {
    function NavComponent() {
    }
    NavComponent.prototype.ngOnInit = function () {
    };
    NavComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-nav',
            template: __webpack_require__(556),
            styles: [__webpack_require__(547)]
        }), 
        __metadata('design:paramtypes', [])
    ], NavComponent);
    return NavComponent;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/nav.component.js.map

/***/ }),

/***/ 475:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return route; });
var route = [];
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/routes.js.map

/***/ }),

/***/ 476:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.
var environment = {
    production: false
};
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/environment.js.map

/***/ }),

/***/ 541:
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ 542:
/***/ (function(module, exports) {

module.exports = ".deviceDetail .row>div>div{\n  margin-bottom:8px;\n}\n.deviceDetail .key{\n  font-weight: bold;\n}\n.logStreamBox{\n  background:black;\n  height:600px;\n  padding:15px;\n}\n.logStreamBox .log {\n  font-family: \"monaco, monospace\";\n  font-size:9pt;\n}\n.logStreamBox .log .time{\n  color:#efefef;\n}\n\n.logStreamBox .log .level.info{\n  color:#5b9aff;\n}\n.logStreamBox .log .level.warn{\n  color:#ffeb5b;\n}\n.logStreamBox .log .level.error{\n  color:#ff5b5b;\n}\n.logStreamBox .log .txt{\n  color:#5bf450;\n  letter-spacing: 1px;\n}\n.logStreamBox .cursor{\n  width:10px;\n  height:3px;\n  background: white;\n  margin-top:12px;\n  -webkit-animation: blink linear 0.4s;\n          animation: blink linear 0.4s;\n  -webkit-animation-iteration-count: infinite;\n          animation-iteration-count: infinite;\n}\n\n\n@-webkit-keyframes blink{\n  0% {\n    opacity:0; \n  }\n  50%{\n    opacity: 1;\n  }\n  100% {\n    opacity:0; \n  }\n}\n\n\n@keyframes blink{\n  0% {\n    opacity:0; \n  }\n  50%{\n    opacity: 1;\n  }\n  100% {\n    opacity:0; \n  }\n}\n.logContent{\n  resize:vertical;\n  width:100%;\n  height:500px;\n  \n}"

/***/ }),

/***/ 543:
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ 544:
/***/ (function(module, exports) {

module.exports = ".deviceBox{\n  padding:10px;\n  border-radius: 8px;\n  cursor: pointer;\n  box-shadow: 1px 1px 3px 0 #616161;\n}\n.deviceBox:hover{\n  \n}\n.deviceBox .deviceUuid{\n  display: block;\n  width:100%;\n  background: #efefef;\n}\n.deviceBox .key{\n  font-weight: bold;\n}"

/***/ }),

/***/ 545:
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ 546:
/***/ (function(module, exports) {

module.exports = ".moduleList{\n  width:180px;\n  background: #999;\n}"

/***/ }),

/***/ 547:
/***/ (function(module, exports) {

module.exports = ".navbar-nav i.glyphicon{\n  font-size:1.2em;\n}"

/***/ }),

/***/ 550:
/***/ (function(module, exports) {

module.exports = "<app-nav></app-nav>\n<router-outlet></router-outlet>\n"

/***/ }),

/***/ 551:
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <div class=\"page-header\">\n    <h3>Client Remote Logging</h3>\n  </div>\n  <div class=\"panel panel-primary deviceDetail\">\n    <div class=\"panel-heading\">\n      <h3 class=\"panel-title\">Device</h3>\n    </div>\n    <div class=\"panel-body\">\n      <div *ngIf=\"refreshing || loadingStatus\" class=\"alert alert-warning\">\n        Loading device information and status. Please wait...\n      </div>\n      <div *ngIf=\"!device?.online\" class=\"alert alert-danger\">\n        Device is currently offline. Please refresh and try again...\n      </div>\n      <div class=\"row\">\n        <div class=\"col-sm-4 col-xs-6\">\n          <div><span class=\"key\">Platform:</span> {{device?.platform}}</div>\n          <div><span class=\"key\">Alias:</span> {{device?.alias}}</div>\n        </div>\n        <div class=\"col-sm-4 col-xs-6\">\n          <div><span class=\"key\">Manufacturer:</span> {{device?.manufacturer}}</div>\n          <div><span class=\"key\">UUID:</span> {{device?.uuid}}</div>\n        </div>\n        <div class=\"col-sm-4 col-xs-6\">\n          <div><span class=\"key\">OS Version:</span> {{device?.version}}</div>\n          <div><span class=\"key\">Online:</span> <span class=\"label\" [class.label-danger]=\"!device?.online\" [class.label-success]=\"device?.online\"> {{device?.online}} </span></div>\n        </div>\n      </div>\n\n    </div>\n    <div class=\"panel-footer\">\n      <div class=\"clearfix\">\n        <div class=\"pull-right\">\n          <button class=\"btn btn-primary\" style=\"margin-right:20px;\" (click)=\"refresh()\">Refresh</button>\n          <button *ngIf=\"status && device?.online && !status?.isStreaming\" class=\"btn btn-primary\" (click)=\"startStream()\">Start Stream</button>\n          <button *ngIf=\"status && device?.online && status?.isStreaming\" class=\"btn btn-warning\" (click)=\"stopStream()\">Stop Stream</button>\n          <button *ngIf=\"status && device?.online && !status?.isRecording\" class=\"btn btn-primary\" (click)=\"startRecord()\">Start Record</button>\n          <button *ngIf=\"status && device?.online && status?.isRecording\" class=\"btn btn-warning\" (click)=\"stopRecord()\">Stop Record</button>\n        </div>\n      </div>\n    </div>\n  </div>\n  <div class=\"row\">\n    <div class=\"col-md-8\">\n      <div  class=\"panel panel-primary \">\n        <div class=\"panel-heading\">\n          <h3 class=\"panel-title\">Live Log Stream</h3>\n        </div>\n        <div class=\"panel-body\">\n          <div *ngIf=\"status && device?.online && status?.isStreaming\" class=\"logStreamBox\">\n            <div class=\"cursor\">\n            </div>\n            <div *ngFor=\"let t of liveLogs\" class=\"log\">\n              <span class='time'>{{t.ts}}</span> -\n              <span class='level {{t.level}}'>[{{t.level.toUpperCase()}}]</span>:\n              <span class='txt'>{{t.txt}}</span>\n            </div>\n          </div>\n          <div *ngIf=\"!(status && device?.online && status?.isStreaming)\"  class=\"alert alert-warning\">\n            Live stream is not turned on...\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"col-md-4\">\n      <div class=\"panel panel-primary \">\n        <div class=\"panel-heading\">\n          <h3 class=\"panel-title\">Log records</h3>\n        </div>\n        <div class=\"panel-body\">\n         <app-client-file\n          [deviceId]=\"deviceId\"\n          [rootPath]=\"'log/'\"\n          (onFileLoad)=\"showLogContent($event)\"\n         >\n         </app-client-file>\n        </div>\n      </div>\n    </div>\n  </div>\n<!-- Button trigger modal -->\n\n<!-- Modal -->\n<div class=\"modal fade\" #logModal tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\">\n  <div class=\"modal-dialog\" role=\"document\">\n    <div class=\"modal-content\">\n      <div class=\"modal-header\">\n        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n        <h4 class=\"modal-title\" id=\"myModalLabel\">{{openedLog?.file.name}}</h4>\n      </div>\n      <div class=\"modal-body\">\n        <textarea class=\"logContent\" readonly>{{openedLog?.data}}</textarea>\n      </div>\n      <div class=\"modal-footer\">\n        <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n        <button type=\"button\" class=\"btn btn-primary\">Save changes</button>\n      </div>\n    </div>\n  </div>\n</div>\n</div>"

/***/ }),

/***/ 552:
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <h3>Please choose a device</h3>\n  <app-devicelist (onChoseDevice)=\"choseDevice($event)\"></app-devicelist>\n</div>"

/***/ }),

/***/ 553:
/***/ (function(module, exports) {

module.exports = "<div class=\"deviceBox\" [class.bg-success]=\"device.online\" [class.bg-danger]=\"!device.online\">\n  <div class=\"deviceInfo\">\n    <div>{{device.manufacturer}}</div>\n    <div><span class='key'>OS: </span>{{device.platform}} {{device.version}}</div>\n    <div><span class='key'>Alias: </span>{{device.alias}}</div>\n    <div><span class='key'>uuid: </span><input (click)=\"$event.stopPropagation()\" class=\"readonly deviceUuid\" readonly [value]=\"device.uuid\" /></div>\n  </div>\n</div>"

/***/ }),

/***/ 554:
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <div class=\"form-inline\" style=\"margin-bottom:10px;\">\n    <div class=\"form-group\">\n      <label class=\"sr-only\" for=\"exampleInputEmail3\">Search</label>\n      <div class=\"input-group\">\n        <div class=\"input-group-addon\"><i class=\"glyphicon glyphicon-search\"></i></div>\n        <input style=\"width:300px;\" class=\"form-control\" placeholder=\"Search Text\" [(ngModel)]=\"filterStr\">\n      </div>\n    </div>\n    <div class=\"pull-right\">\n      <button title=\"Refresh device list\" [class.disabled]=\"refreshing\" (click)=\"refresh()\" class=\"btn btn-primary\"><i class=\"glyphicon glyphicon-refresh\"></i></button>\n    </div>\n  </div>\n  <div *ngIf=\"deviceList.length>0\" class=\"row\">\n    <app-device (click)=\"clickDevice(d)\" class=\"col-md-3 col-sm-4 col-xs-2\" *ngFor=\"let d of getDevices()\" [device]=\"d\">\n    </app-device>\n  </div>\n  <div *ngIf=\"deviceList.length ===0\">\n    <div class=\"alert alert-danger\" role=\"alert\">No device is currently online. Please try again later.</div>\n  </div>\n</div>"

/***/ }),

/***/ 555:
/***/ (function(module, exports) {

module.exports = "<div class=\"moduleDetail\">\n</div>"

/***/ }),

/***/ 556:
/***/ (function(module, exports) {

module.exports = "<nav class=\"navbar navbar-inverse\">\n  <div class=\"container-fluid\">\n    <!-- Brand and toggle get grouped for better mobile display -->\n    <div class=\"navbar-header\">\n      <button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#bs-example-navbar-collapse-1\" aria-expanded=\"false\">\n        <span class=\"sr-only\">Toggle navigation</span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n        <span class=\"icon-bar\"></span>\n      </button>\n      <a class=\"navbar-brand\" href=\"#\"><img src='assets/logo.png' width=\"25\"/></a>\n      <p class=\"navbar-text\">RHMAM</p>\n    </div>\n    <!-- Collect the nav links, forms, and other content for toggling -->\n    <div class=\"collapse navbar-collapse\" id=\"bs-example-navbar-collapse-1\">\n      <ul class=\"nav navbar-nav\">\n        <li routerLinkActive=\"active\"><a routerLink=\"/clientLogs\" >Client Logs</a></li>\n        <li routerLinkActive=\"active\"><a routerLink=\"/clientVersion\" >Client Version</a></li>\n      </ul>\n      <ul class=\"nav navbar-nav navbar-right\">\n        <li><a href=\"#\"><i class=\"glyphicon glyphicon-cog\"></i></a></li>\n        <li><a href=\"#\"><i class=\"glyphicon glyphicon-off\"></i></a></li>\n      </ul>\n    </div><!-- /.navbar-collapse -->\n  </div><!-- /.container-fluid -->\n</nav>"

/***/ }),

/***/ 583:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(345);


/***/ }),

/***/ 589:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientFileComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ClientFileComponent = (function () {
    function ClientFileComponent(comm) {
        this.comm = comm;
        this.rootPath = "/";
        this.canOpen = true;
        this.canRemove = true;
        this.loading = false;
        this.onFileLoad = new __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */]();
    }
    ClientFileComponent.prototype.ngOnInit = function () {
        if (!this.currentPath) {
            this.currentPath = this.rootPath;
        }
        this.refresh();
    };
    ClientFileComponent.prototype.refresh = function () {
        var _this = this;
        this.loading = true;
        this.comm.sendMsg("fs-list-folder", this.deviceId, this.currentPath, function (err, data) {
            _this.loading = false;
            if (err) {
                _this.comm.showErr(err);
            }
            else {
                _this.fileList = data;
            }
        });
    };
    ClientFileComponent.prototype.open = function (f) {
        var _this = this;
        if (f.isDirectory) {
            this.currentPath = f.fullPath;
            this.refresh();
        }
        else {
            this.loading = true;
            this.comm.sendMsg('fs-read', this.deviceId, f.fullPath, function (err, data) {
                _this.loading = false;
                if (err) {
                    _this.comm.showErr(err);
                }
                else {
                    _this.onFileLoad.emit({ file: f, data: data });
                }
            });
        }
    };
    ClientFileComponent.prototype.removeFile = function (f) {
        var _this = this;
        this.loading = true;
        var msg = f.isDirectory ? "fs-remove-dir" : "fs-remove-file";
        this.comm.sendMsg(msg, this.deviceId, f.fullPath, function (err, data) {
            if (err) {
                _this.comm.showErr(err);
            }
            else {
                _this.refresh();
            }
        });
    };
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', String)
    ], ClientFileComponent.prototype, "rootPath", void 0);
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', String)
    ], ClientFileComponent.prototype, "currentPath", void 0);
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', Object)
    ], ClientFileComponent.prototype, "canOpen", void 0);
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', Object)
    ], ClientFileComponent.prototype, "canRemove", void 0);
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["B" /* Input */])(), 
        __metadata('design:type', String)
    ], ClientFileComponent.prototype, "deviceId", void 0);
    __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["R" /* Output */])(), 
        __metadata('design:type', (typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_0__angular_core__["K" /* EventEmitter */]) === 'function' && _a) || Object)
    ], ClientFileComponent.prototype, "onFileLoad", void 0);
    ClientFileComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-client-file',
            template: __webpack_require__(591),
            styles: [__webpack_require__(590)]
        }), 
        __metadata('design:paramtypes', [(typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */]) === 'function' && _b) || Object])
    ], ClientFileComponent);
    return ClientFileComponent;
    var _a, _b;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-file.component.js.map

/***/ }),

/***/ 590:
/***/ (function(module, exports) {

module.exports = ".fileList{\n\n}\n.fileList>table{\n  width:100%;\n  max-width: 100%;\n  margin-bottom: 20px;\n}\n.fileList>table td{\n  padding:8px;\n  box-sizing: border-box;\n}\n.fileList tr:hover{\n  background: #efefef;\n}\n.fileList .icon{\n  width:38px;\n}\n.fileList .fileName{\n  cursor: pointer;\n}\n.fileList .actions{\n  width:40px;\n}\n.fileList .removeBtn{\n  cursor: pointer;\n}\n"

/***/ }),

/***/ 591:
/***/ (function(module, exports) {

module.exports = "<div class=\"row\" style=\"margin-bottom:15px\">\n  <div class=\"col-xs-8\">\n    <div><span style=\"font-weight:bold\">Path:</span> <input readonly [value]=\"currentPath\" /></div>\n  </div>\n  <div class=\"col-xs-4\">\n    <button class=\"btn btn-xs btn-primary\" (click)=\"refresh()\">Refresh</button>\n  </div>\n</div>\n<div *ngIf=\"fileList\" class=\"fileList\">\n  <table>\n    <tr *ngFor=\"let f of fileList\">\n      <td class=\"icon\">\n        <span class=\"glyphicon\" [class.glyphicon-file]=\"!f.isDirectory\"></span>\n        <span class=\"glyphicon\" [class.glyphicon-folder-open]=\"f.isDirectory\"></span>\n\n      </td>\n      <td (click)=\"open(f)\" class=\"fileName\"><span >{{f.name}}</span></td>\n      <td class=\"actions\">\n        <span (click)=\"removeFile(f)\" class=\"glyphicon glyphicon-trash removeBtn\" ></span>\n      </td>\n    </tr>\n  </table>\n</div>\n<div *ngIf=\"!fileList || fileList.length ===0\" class=\"alert alert-warning\">\n  No file found in current folder.\n</div>\n<div *ngIf=\"loading\" class=\"alert alert-warning\">\n  Loading device filesystem. Please wait...\n</div>\n"

/***/ }),

/***/ 592:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__client_file_component__ = __webpack_require__(589);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__comm_comm_module__ = __webpack_require__(311);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientFileModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var ClientFileModule = (function () {
    function ClientFileModule() {
    }
    ClientFileModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_common__["a" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_3__comm_comm_module__["a" /* CommModule */]
            ],
            declarations: [
                __WEBPACK_IMPORTED_MODULE_2__client_file_component__["a" /* ClientFileComponent */]
            ],
            exports: [
                __WEBPACK_IMPORTED_MODULE_2__client_file_component__["a" /* ClientFileComponent */]
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], ClientFileModule);
    return ClientFileModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-file.module.js.map

/***/ }),

/***/ 593:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__ = __webpack_require__(129);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientVersionComponent; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var ClientVersionComponent = (function () {
    function ClientVersionComponent(comm) {
        this.comm = comm;
        this.cfg = {};
        this.loading = false;
    }
    ClientVersionComponent.prototype.ngOnInit = function () {
        this.refresh();
    };
    ClientVersionComponent.prototype.refresh = function () {
        var _this = this;
        this.loading = true;
        this.comm.request("clientVersion/config")
            .then(function (res) {
            _this.cfg = res.json();
        }, this.comm.errorHandler)
            .then(function () { _this.loading = false; });
    };
    ClientVersionComponent.prototype.setWebContentUrl = function () {
        var _this = this;
        this.loading = true;
        var body = {
            url: this.cfg.content_url,
            update: this.cfg.update
        };
        this.comm.request('clientVersion/setWebContentUrl', {
            method: "POST",
            body: body
        })
            .then(function (res) {
            _this.refresh();
        }, this.comm.errorHandler)
            .then(function () { _this.loading = false; });
    };
    ClientVersionComponent = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["c" /* Component */])({
            selector: 'app-client-version',
            template: __webpack_require__(595),
            styles: [__webpack_require__(594)]
        }), 
        __metadata('design:paramtypes', [(typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */] !== 'undefined' && __WEBPACK_IMPORTED_MODULE_1__comm_comm_service__["a" /* CommService */]) === 'function' && _a) || Object])
    ], ClientVersionComponent);
    return ClientVersionComponent;
    var _a;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-version.component.js.map

/***/ }),

/***/ 594:
/***/ (function(module, exports) {

module.exports = ""

/***/ }),

/***/ 595:
/***/ (function(module, exports) {

module.exports = "<div class=\"container\">\n  <div class=\"page-header\">\n    <h3>Client Live Update</h3>\n  </div>\n  <div class=\"jumbotron\">\n    <p>RHMAM can push newer version of app content to Cordova mobile apps.</p>\n    <p>For more details, please read this.</p>\n    <div class=\"form\">\n      <div class=\"form-group\">\n        <label>Web Content URL</label>\n        <input class=\"form-control\" placeholder=\"https://urltowebcontent\" [(ngModel)]=\"cfg.content_url\" />\n      </div>\n      <div class=\"form-group\">\n        <label>Update Method</label>\n        <div class=\"radio\">\n          <label>\n          <input type=\"radio\" name=\"update\" [(ngModel)]=\"cfg.update\" value=\"start\">\n          Update the app when user launch the app next time.\n        </label>\n        </div>\n        <div class=\"radio\">\n          <label>\n          <input type=\"radio\" name=\"update\" [(ngModel)]=\"cfg.update\" value=\"resume\">\n          Update the app when user launch or resume the app next time.\n        </label>\n        </div>\n        <div class=\"radio disabled\">\n          <label>\n          <input type=\"radio\" name=\"update\" [(ngModel)]=\"cfg.update\" value=\"now\">\n          Update the app as soon as possible.\n        </label>\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <label>Current Release:</label>\n        <div>{{ cfg.release?cfg.release:'N/A' }}</div>\n      </div>\n    </div>\n    <p class=\"clearfix\"><button class=\"btn btn-primary pull-right\" role=\"button\" (click)=\"setWebContentUrl()\">Submit</button></p>\n  </div>\n</div>"

/***/ }),

/***/ 596:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_forms__ = __webpack_require__(280);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_common__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__client_version_routes_module__ = __webpack_require__(597);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__client_version_component__ = __webpack_require__(593);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__comm_comm_module__ = __webpack_require__(311);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientVersionModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};






var ClientVersionModule = (function () {
    function ClientVersionModule() {
    }
    ClientVersionModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_2__angular_common__["a" /* CommonModule */],
                __WEBPACK_IMPORTED_MODULE_3__client_version_routes_module__["a" /* ClientVersionRouteModule */],
                __WEBPACK_IMPORTED_MODULE_5__comm_comm_module__["a" /* CommModule */],
                __WEBPACK_IMPORTED_MODULE_1__angular_forms__["a" /* FormsModule */]
            ],
            declarations: [
                __WEBPACK_IMPORTED_MODULE_4__client_version_component__["a" /* ClientVersionComponent */]
            ],
            exports: [
                __WEBPACK_IMPORTED_MODULE_4__client_version_component__["a" /* ClientVersionComponent */]
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], ClientVersionModule);
    return ClientVersionModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-version.module.js.map

/***/ }),

/***/ 597:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_router__ = __webpack_require__(83);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__client_version_component__ = __webpack_require__(593);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ClientVersionRouteModule; });
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};



var routes = [
    {
        path: 'clientVersion', component: __WEBPACK_IMPORTED_MODULE_2__client_version_component__["a" /* ClientVersionComponent */]
    }
];
var ClientVersionRouteModule = (function () {
    function ClientVersionRouteModule() {
    }
    ClientVersionRouteModule = __decorate([
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__angular_core__["b" /* NgModule */])({
            imports: [
                __WEBPACK_IMPORTED_MODULE_1__angular_router__["a" /* RouterModule */].forChild(routes)
            ]
        }), 
        __metadata('design:paramtypes', [])
    ], ClientVersionRouteModule);
    return ClientVersionRouteModule;
}());
//# sourceMappingURL=/Users/kxiang/work/feedhenry/rhmam/ng2-admin/src/client-version.routes.module.js.map

/***/ })

},[583]);
//# sourceMappingURL=main.bundle.map