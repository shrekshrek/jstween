/*!
 * GIT: https://github.com/shrekshrek/jstween
 **/

(function (global, factory) {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
        var JT = require('jstween');
        module.exports = factory(JT);
    } else if (typeof define === 'function' && define.amd) {
        define(['jstween'], factory);
    } else {
        global.JP = factory(global.JT);
    }
}(this, (function (JT) {
    'use strict';

    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    // --------------------------------------------------------------------全局update
    var parallaxs = [];
    var tempParallaxs = [];
    var isUpdating = false;
    var lastTime = 0;

    function globalUpdate() {
        var _len = parallaxs.length;
        if (_len === 0) {
            isUpdating = false;
            return;
        }

        var _now = JT.now();
        var _step = _now - lastTime;
        lastTime = _now;
        if (_step > 500) _step = 33;

        tempParallaxs = parallaxs.slice(0);
        for (var i = 0; i < _len; i++) {
            tempParallaxs[i]._update(_step);
        }

        requestFrame(globalUpdate);
    }

    // --------------------------------------------------------------------坐标计算
    function fixed(n) {
        return Math.round(n * 1000) / 1000;
    }

    const reg = /(t|m|b|)(t|m|b|)(\+|-|)(\d+\.\d+|\d+|)(rem|px|%|vw|vh|)/i;

    // const reg = /(tt|tm|tb|mt|mm|mb|bt|bm|bb|)(\+|-|)(\d+\.\d+|\d+|)(rem|px|%|vw|vh|)/i;

    function regValue(value, el) {
        const scrollTop = document.scrollingElement.scrollTop;
        const viewportHeight = window.innerHeight;
        const elemSize = el.getBoundingClientRect();

        var _y = 0;
        var _a = reg.exec(value);

        if (_a[1] == 't') _y += (elemSize.top + scrollTop)
        if (_a[1] == 'm') _y += (elemSize.top + scrollTop) + elemSize.height / 2
        if (_a[1] == 'b') _y += (elemSize.top + scrollTop) + elemSize.height

        if (_a[2] == 't') _y -= 0
        if (_a[2] == 'm') _y -= viewportHeight / 2
        if (_a[2] == 'b') _y -= viewportHeight

        var _n = fixed(_a[3] + _a[4]);
        switch (_a[5]) {
            case 'rem':
                _n *= JT.getRem();
                break;
            case 'vw':
                _n *= JT.getVw();
                break;
            case 'vh':
                _n *= JT.getVh();
                break;
        }

        if (_a[1] && _a[2]) _y -= _n;
        else if (!_a[1] && !_a[2]) _y += _n;
        else throw "from or to value error!!!";

        return {
            origin: value,
            value: _y,
        };
    }


    // --------------------------------------------------------------------parallax
    function parallax() {
        this.initialize.apply(this, arguments);
    }

    Object.assign(parallax.prototype, {
        initialize: function (el, fromVars, toVars) {
            this.el = this.anchor = typeof (el) === 'string' ? document.querySelector(el) : el;

            if (toVars.anchor) {
                this.anchor = document.querySelector(toVars.anchor);
                delete toVars.anchor;
            }
            if (toVars.onInside) {
                this.onInside = toVars.onInside;
                delete toVars.onInside;
            }
            if (toVars.onOutside) {
                this.onOutside = toVars.onOutside;
                delete toVars.onOutside;
            }

            this.from = regValue(fromVars.from, this.anchor);
            this.to = regValue(toVars.to, this.anchor);
            delete fromVars.from;
            delete toVars.to;

            this.origin = {};
            for (var i in fromVars) {
                this.origin[i] = JT.get(this.el, i);
            }

            toVars.isPlaying = false;

            this.tween = JT.fromTo(el, 1, fromVars, toVars);

            this._update();

            parallaxs.push(this);

            if (!isUpdating) {
                lastTime = JT.now();
                isUpdating = true;
                requestFrame(globalUpdate);
            }
        },

        _reset() {
            for (var i in this.origin) {
                JT.set(this.el, this.origin[i]);
            }

            this.from = regValue(this.from.origin, this.anchor);
            this.to = regValue(this.to.origin, this.anchor);
        },

        _update: function () {
            const scrollTop = document.scrollingElement.scrollTop;
            this.elapsed = (scrollTop - this.from.value) / (this.to.value - this.from.value);
            this.isInside = this.elapsed >= 0 && this.elapsed <= 1;
            this.isOutside = this.elapsed < 0 || this.elapsed > 1;

            this.tween.seek(this.elapsed);

            if (this.isInside && this.onInside) this.onInside.apply(this, this.elapsed);
            if (this.isOutside && this.onOutside) this.onOutside.apply(this, this.elapsed);
            if (this.onUpdate) this.onUpdate.apply(this, this.elapsed);
        },

        kill: function () {
            var i = parallaxs.indexOf(this);
            if (i !== -1) parallaxs.splice(i, 1);
            this.tween.kill();
            this.el = this.anchor = this.origin = null;
        }

    });


    //---------------------------------------------------------------全局方法
    var JP = {
        create: function (el, fromVars, toVars) {
            return new parallax(el, fromVars, toVars);
        },

        reset: function () {
            var _len = parallaxs.length;
            for (var i = 0; i < _len; i++) {
                parallaxs[i]._reset();
            }
        },

        kill: function () {
            var _len = parallaxs.length;
            for (var i = _len - 1; i >= 0; i--) {
                parallaxs[i].kill();
            }
        }
    };

    return JP;

})));
