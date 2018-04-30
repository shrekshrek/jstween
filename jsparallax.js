/*!
 * GIT: https://github.com/shrekshrek/jstween
 **/

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jstween', 'exports'], function (JT, exports) {
            window.JP = factory(exports, JT);
        });
    } else if (typeof exports !== 'undefined') {
        var JT = require('jstween');
        factory(exports, JT);
    } else {
        window.JP = factory({}, window.JT);
    }

}(function (JP, JT) {
    // --------------------------------------------------------------------parallax
    function parallax() {
        this.initialize.apply(this, arguments);
    }

    Object.assign(parallax.prototype, {
        initialize: function (vars) {
            vars = vars || {};
            this.el = vars.el;
            this.hook = vars.hook || 0;
            this.key = vars.key || 'y';
            this.pinLength = 0;

            this.isSeek = false;
            this.curPos = this.prevPos = null;

            this.tweens = [];
            this.calls = [];
            this.pins = [];
        },

        _update: function (step) {
            this.prevPos = this.curPos;
            this.curPos = this.prevPos + step;

            this._checkTween();
            this._checkCall();
            this._checkPin();

            if (this.el) this.el[this.key] = -(this.curPos - this.pinLength);
        },

        addCall: function (call, position) {
            this.calls.push({start: position, call: call});
            this._updateEndTime();
        },

        _checkCall: function () {
            for (var i = 0, _len = this.calls.length; i < _len; i++) {
                var _call = this.calls[i];
                var _prevPos = this.prevPos + this.hook - _call.start;
                var _curPos = this.curPos + this.hook - _call.start;
                if (!this.isSeek && ((_call.start === 0 && _prevPos === 0 && _curPos > 0) || (_prevPos < _call.start && _curPos >= _call.start) || (_prevPos > _call.start && _curPos <= _call.start) || (_call.start === this.endTime && _prevPos === this.endTime && _curPos < this.endTime))) _call.call();
            }
        },

        addTween: function (tween, position, duration) {
            tween.stop();
            var _pos = JT.get(tween.el, this.key);
            var _start = _pos - position;
            this.tweens.push({start: _start, tween: tween, duration: duration});
        },

        _checkTween: function () {
            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var _prevPos = this.prevPos + this.hook - _tween.start;
                var _curPos = this.curPos + this.hook - _tween.start;
                if (_tween.duration === 0) {
                    if (!this.isSeek && ((_tween.start === 0 && _prevPos === 0 && _curPos > 0) || (_prevPos < _tween.start && _curPos >= _tween.start) || (_prevPos > _tween.start && _curPos <= _tween.start) || (_tween.start === this.endTime && _prevPos === this.endTime && _curPos < this.endTime))) _tween.play(0);
                } else {
                    _tween.tween.seek(_curPos / _tween.duration * _tween.tween.endTime / 1000, this.isSeek);
                }
            }
        },

        addPin: function (position, duration) {
            this.pins.push({start: position, duration: duration});
        },

        _checkPin: function () {
            this.pinLength = 0;
            for (var i = 0, _len = this.pins.length; i < _len; i++) {
                var _pin = this.pins[i];
                if (this.curPos > _pin.start + _pin.duration) {
                    this.pinLength += _pin.duration;
                } else if (this.curPos > _pin.start) {
                    this.pinLength += this.curPos - _pin.start;
                }
            }
        },

        fromTo: function (el, time, fromVars, toVars, position, duration) {
            var _tween = JT.fromTo(el, time, fromVars, toVars);
            this.addTween(_tween, position, duration);
            return this;
        },

        from: function (el, time, fromVars, position, duration) {
            var _tween = JT.from(el, time, fromVars);
            this.addTween(_tween, position, duration);
            return this;
        },

        to: function (el, time, toVars, position, duration) {
            var _tween = JT.to(el, time, toVars);
            this.addTween(_tween, position, duration);
            return this;
        },

        add: function (obj, position, duration) {
            switch (typeof(obj)) {
                case 'object':
                    this.addTween(obj, position, duration);
                    break;
                case 'function':
                    this.addCall(obj, position);
                    break;
                case 'number':
                    this.addPin(obj, position);
                    break;
                default:
                    throw 'add action is wrong!!!';
                    break;
            }
            return this;
        },

        seek: function (position, isSeek) {
            if (this.curPos === position) return;

            if (isSeek !== undefined) this.isSeek = isSeek;
            this._update(position - this.curPos);
            this.isSeek = false;
        },

        kill: function () {
            this.tweens = [];
            this.calls = [];
            this.pins = [];
            this.curPos = this.prevPos = null;
        }

    });


    //---------------------------------------------------------------全局方法
    Object.assign(JP, {
        create: function (vars) {
            return new parallax(vars);
        },
        kill: function (pl) {
            pl.kill();
        }
    });

    return JP;
}));
