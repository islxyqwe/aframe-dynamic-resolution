"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var aframe_1 = require("aframe");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var Component = aframe_1.registerComponent('dynamic-resolution', {
    schema: {
        targetFPS: {
            default: 60
        },
        debug: {
            default: false
        }
    },
    timer: 0,
    scale: 1,
    handler: new rxjs_1.Subscriber(),
    resolution_controller: function (source) {
        var _this = this;
        return source
            .pipe(operators_1.bufferCount(4), operators_1.map(function (a) { return (a.reduce(add) * _this.data.targetFPS) / 4000 - 1; }), operators_1.filter(function (x) { return x < 1; }), operators_1.map(function (a) { return (a > 0 ? a * 5 : Math.log(-a) * 0.2); }), seesaw(60), operators_1.map(function (x) { return x < 0; }))
            .subscribe(function (x) {
            if (x && _this.scale < 1) {
                _this.scale = _this.scale + 0.05;
            }
            else if (!x && _this.scale > 0.75) {
                _this.scale = _this.scale - 0.05;
            }
            else {
                return;
            }
            if (_this.data.debug) {
                console.log('change scale to', _this.scale);
            }
        });
    },
    init: function () {
        var _this = this;
        this.timer = performance.now();
        this.resolution_controller(new rxjs_1.Observable(function (ob) {
            _this.handler = ob;
        }));
    },
    play: function () {
        this.timer = performance.now();
    },
    remove: function () {
        this.handler.complete();
    },
    tick: function () {
        var frametime = performance.now() - this.timer;
        this.handler.next(frametime);
        this.resize();
        this.timer = performance.now();
    },
    resize: function () {
        var scene = this.el;
        var canvas = scene.canvas;
        var embedded = scene.getAttribute('embedded') && !scene.is('vr-mode');
        var size = getCanvasSize(canvas, embedded, scene.maxCanvasSize, scene.is('vr-mode'));
        scene.renderer.setSize(size.width * this.scale, size.height * this.scale, false);
    }
});
exports.Component = Component;
var seesaw = function (size) { return function (source) {
    return new rxjs_1.Observable(function (ob) {
        var balance = 0;
        return source.subscribe({
            next: function (x) {
                if (balance === 0 || (balance > 0 && x > 0) || (balance < 0 && x < 0)) {
                    balance = balance + x;
                }
                else {
                    balance = balance / 10 + x;
                }
                if (Math.abs(balance) > size) {
                    ob.next(balance);
                    balance = 0;
                }
            },
            error: function (err) {
                ob.error(err);
            },
            complete: function () {
                ob.complete();
            }
        });
    });
}; };
function add(x, y) {
    return x + y;
}
function getCanvasSize(canvasEl, embedded, maxSize, isVR) {
    if (embedded) {
        if (canvasEl.parentElement) {
            return {
                height: canvasEl.parentElement.offsetHeight,
                width: canvasEl.parentElement.offsetWidth
            };
        }
    }
    return getMaxSize(maxSize, isVR);
}
function getMaxSize(maxSize, isVR) {
    var aspectRatio;
    var size;
    var pixelRatio = window.devicePixelRatio;
    size = { height: document.body.offsetHeight, width: document.body.offsetWidth };
    if (!maxSize || isVR || (maxSize.width === -1 && maxSize.height === -1)) {
        return size;
    }
    if (size.width * pixelRatio < maxSize.width && size.height * pixelRatio < maxSize.height) {
        return size;
    }
    aspectRatio = size.width / size.height;
    if (size.width * pixelRatio > maxSize.width && maxSize.width !== -1) {
        size.width = Math.round(maxSize.width / pixelRatio);
        size.height = Math.round(maxSize.width / aspectRatio / pixelRatio);
    }
    if (size.height * pixelRatio > maxSize.height && maxSize.height !== -1) {
        size.height = Math.round(maxSize.height / pixelRatio);
        size.width = Math.round((maxSize.height * aspectRatio) / pixelRatio);
    }
    return size;
}
