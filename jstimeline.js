/*!
 * VERSION: 0.9.0
 * DATE: 2017-9-3
 * GIT: https://github.com/shrekshrek/jstween
 * @author: Shrek.wang
 **/

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jstween', 'exports'], function (JT, exports) {
            window.JTL = factory(exports, JT);
        });
    } else if (typeof exports !== 'undefined') {
        var JT = require('jstween');
        factory(exports, JT);
    } else {
        window.JTL = factory({}, window.JT);
    }

}(function (JTL, JT) {
    // --------------------------------------------------------------------辅助方法
    function extend(obj, obj2) {
        for (var prop in obj2) {
            obj[prop] = obj2[prop];
        }
    }

    function regValue(value) {
        var _r = /(^[a-zA-Z]\w*|)(\+=|-=|)(\d*\.\d*|\d*)/;
        var _a = _r.exec(value);
        return {label: _a[1], ext: _a[2], num: parseFloat(_a[3])};
    }

    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    // --------------------------------------------------------------------全局update
    var timelines = [];
    var tempTimelines = [];
    var isUpdating = false;
    var lastTime = 0;

    function globalUpdate() {
        var _len = timelines.length;
        if (_len === 0) {
            isUpdating = false;
            return;
        }

        var _now = JT.now();
        var _step = _now - lastTime;
        lastTime = _now;

        tempTimelines = timelines.slice(0);
        for (var i = 0; i < _len; i++) {
            var _timeline = tempTimelines[i];
            if (_timeline && _timeline.isPlaying && !_timeline._update(_step)) _timeline.pause();
        }

        requestFrame(globalUpdate);
    }


    // --------------------------------------------------------------------timeline
    function timeline() {
        this.initialize.apply(this, arguments);
    }

    extend(timeline.prototype, {
        initialize: function (vars) {
            this.endTime = 0;

            this.labels = [];
            this.tweens = [];
            this.calls = [];

            this.isPlaying = false;
            this.isReverse = vars && vars.isReverse || false;
            this.timeScale = vars && vars.timeScale || 1;

            this.isKeep = false;
            this.curTime = this.prevTime = 0;

        },

        _update: function (time) {
            this.isKeep = false;

            time = this.isReverse ? -time * this.timeScale : time * this.timeScale;
            this.prevTime = this.curTime;
            this.curTime = this.prevTime + time;

            if (this.isReverse && this.prevTime >= 0 && this.curTime < 0) {
                this.curTime = 0;
                this._checkCall();
                this._checkTween();
                return this.isKeep;
            } else if (!this.isReverse && this.prevTime < this.endTime && this.curTime >= this.endTime) {
                this.curTime = this.endTime;
                this._checkCall();
                this._checkTween();
                return this.isKeep;
            } else {
                this._checkCall();
                this._checkTween();
                return true;
            }
        },

        _addSelf: function () {
            timelines.push(this);

            if (!isUpdating) {
                lastTime = JT.now();
                isUpdating = true;
                requestFrame(globalUpdate);
            }
        },

        _removeSelf: function () {
            var i = timelines.indexOf(this);
            if (i !== -1) timelines.splice(i, 1);
        },

        _parsePosition: function (position) {
            if (position == undefined) return this.endTime;

            var _o = regValue(position);
            var _time = 0;
            if (_o.label) {
                _time = this.getLabelTime(_o.label);
            } else if (_o.ext) {
                switch (_o.ext) {
                    case '+=':
                        _time = this.endTime + _o.num * 1000;
                        break;
                    case '-=':
                        _time = this.endTime - _o.num * 1000;
                        break;
                }
            } else if (_o.num) {
                _time = _o.num * 1000;
            }

            return _time;
        },

        _addCall: function (call, position) {
            var _time = this._parsePosition(position);
            this.endTime = Math.max(this.endTime, _time);
            this.calls.push({time: _time, call: call});
        },

        _checkCall: function () {
            for (var i = 0, _len = this.calls.length; i < _len; i++) {
                var _call = this.calls[i];
                var startTime = _call.time;
                if (this.isReverse ? (this.prevTime >= startTime && this.curTime < startTime) : (this.prevTime < startTime && this.curTime >= startTime)) _call.call();
            }
        },

        _addTween: function (tween, position) {
            var _time = this._parsePosition(position);
            this.endTime = Math.max(this.endTime, _time + tween.endTime);
            this.tweens.push({time: _time, tween: tween});
        },

        _checkTween: function () {
            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var startTime = _tween.time;
                var endTime = _tween.time + _tween.tween.endTime;
                if (this.curTime >= startTime && this.curTime <= endTime || (this.prevTime > startTime && this.prevTime < endTime)) {
                    if (this.prevTime >= startTime && this.curTime < startTime) {
                        _tween.tween._update(this.prevTime - startTime);
                    } else if (this.prevTime > endTime && this.curTime <= endTime) {
                        _tween.tween.curTime = _tween.tween.prevTime = _tween.tween.endTime;
                        _tween.tween._update(endTime - this.curTime);
                    } else if (this.prevTime < startTime && this.curTime >= startTime) {
                        _tween.tween.curTime = _tween.tween.prevTime = 0;
                        _tween.tween._update(this.curTime - startTime);
                    } else if (this.prevTime <= endTime && this.curTime > endTime) {
                        _tween.tween._update(endTime - this.prevTime);
                    } else {
                        _tween.tween._update(Math.abs(this.curTime - this.prevTime));
                    }
                }
            }
        },

        fromTo: function (target, time, fromVars, toVars, position) {
            toVars.isPlaying = false;
            var _tween = JT.fromTo(target, time, fromVars, toVars);
            this._addTween(_tween, position);
            return this;
        },

        from: function (target, time, fromVars, position) {
            fromVars.isPlaying = false;
            var _tween = JT.from(target, time, fromVars);
            this._addTween(_tween, position);
            return this;
        },

        to: function (target, time, toVars, position) {
            toVars.isPlaying = false;
            var _tween = JT.to(target, time, toVars);
            this._addTween(_tween, position);
            return this;
        },

        add: function (obj, position) {
            switch (typeof(obj)) {
                case 'object':
                    this._addTween(obj, position);
                    break;
                case 'function':
                    this._addCall(obj, position);
                    break;
                case 'string':
                    this.addLabel(obj, position);
                    break;
                default:
                    throw 'add action is wrong!!!';
                    break;
            }
            return this;
        },

        addLabel: function (name, position) {
            this.removeLabel(name);
            var _time = this._parsePosition(position);
            this.labels.push({name: name, time: _time});
        },

        removeLabel: function (name) {
            for (var i = 0, _len = this.labels.length; i < _len; i++) {
                var _label = this.labels[i];
                if (name == _label.name) {
                    this.labels.splice(i, 1);
                    return;
                }
            }
        },

        getLabelTime: function (name) {
            for (var i = 0, _len = this.labels.length; i < _len; i++) {
                var _label = this.labels[i];
                if (name == _label.name) return _label.time;
            }
            return this.endTime;
        },

        totalTime: function () {
            return this.endTime;
        },

        play: function (position) {
            this.isKeep = true;
            this.isReverse = false;
            for (var i in this.tweens) this.tweens[i].tween.isReverse = this.isReverse;

            if (position !== undefined) this.seek(position);

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addSelf();
        },

        pause: function () {
            this.isKeep = false;

            if (!this.isPlaying) return;
            this.isPlaying = false;
            this._removeSelf();
        },

        stop: function () {
            this.pause();
            this.curTime = this.prevTime = 0;
        },

        reverse: function (position) {
            this.isKeep = true;
            this.isReverse = true;
            for (var i in this.tweens) this.tweens[i].tween.isReverse = this.isReverse;

            if (position !== undefined) this.seek(position);

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addSelf();
        },

        seek: function (position) {
            var _time = Math.max(0, Math.min(this.endTime, this._parsePosition(position)));
            if (this.curTime == _time) return;

            this.curTime = _time;

            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var startTime = _tween.time;
                var endTime = _tween.time + _tween.tween.endTime;
                if (this.curTime < startTime) {
                    _tween.tween.seek(0);
                } else if (this.curTime > endTime) {
                    _tween.tween.seek(_tween.tween.endTime);
                } else {
                    _tween.tween.seek((this.curTime - startTime) / 1000);
                }
            }
        },

        kill: function () {
            this.pause();
            this.tweens = [];
            this.calls = [];
            this.labels = [];
            this.endTime = 0;
            this.curTime = this.prevTime = 0;
        }

    });


    //---------------------------------------------------------------全局方法
    extend(JTL, {
        create: function () {
            return new timeline();
        },
        kill: function (tl) {
            tl.kill();
        }
    });

    return JTL;
}));
