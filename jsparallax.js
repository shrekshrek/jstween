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
            // this.duration = 0;
            this.el = vars.el;
            this.startPos = vars.hook || 0;
            this.key = vars.key || 'y';
            this.curPos = this.prevPos = null;

            this.tweens = [];
            // this.calls = [];

        },

        _addTween: function (tween, position, duration) {
            tween.stop();
            var _pos = JT.get(tween.target, this.key);
            var _start = _pos - position;
            this.tweens.push({startPos: _start, duration: duration, tween: tween});
        },

        fromTo: function (target, time, fromVars, toVars, position, duration) {
            var _tween = JT.fromTo(target, time, fromVars, toVars);
            this._addTween(_tween, position, duration);
            return this;
        },

        from: function (target, time, fromVars, position, duration) {
            var _tween = JT.from(target, time, fromVars);
            this._addTween(_tween, position, duration);
            return this;
        },

        to: function (target, time, toVars, position, duration) {
            var _tween = JT.to(target, time, toVars);
            this._addTween(_tween, position, duration);
            return this;
        },

        add: function (obj, position, duration) {
            this._addTween(obj, position, duration);
            return this;
        },

        seek: function (position) {
            if (this.curPos === position) return;

            this.curPos = position;
            if(this.el) this.el[this.key] = -this.curPos;
            var _curPos = this.curPos + this.startPos;

            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var _duration = _tween.duration;
                var _startPos = _tween.startPos;
                var _endPos = _tween.startPos + _duration;
                if (_curPos < _startPos) {
                    _tween.tween.seek(0);
                } else if (_curPos > _endPos) {
                    _tween.tween.seek(_tween.tween.endTime);
                } else {
                    _tween.tween.seek((_curPos - _startPos) / _tween.duration * _tween.tween.endTime / 1000);
                }
            }
        },

        kill: function () {
            this.tweens = [];
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
