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

    Object.assign(timeline.prototype, {
        initialize: function (vars) {
            vars = vars || {};
            this.duration = 0;
            this.delay = Math.max(vars.delay || 0, 0) * 1000;
            this.yoyo = vars.yoyo || false;
            this.repeat = vars.repeat ? (vars.repeat < 0 ? -100 : vars.repeat) : 0;
            this.repeatDelay = Math.max(vars.repeatDelay || 0, 0) * 1000;
            this.onStart = vars.onStart || null;
            this.onStartScope = vars.onStartScope || this;
            this.onStartParams = vars.onStartParams || [];
            this.onRepeat = vars.onRepeat || null;
            this.onRepeatScope = vars.onRepeatScope || this;
            this.onRepeatParams = vars.onRepeatParams || [];
            this.onEnd = vars.onEnd || null;
            this.onEndScope = vars.onEndScope || this;
            this.onEndParams = vars.onEndParams || [];
            this.onUpdate = vars.onUpdate || null;
            this.onUpdateScope = vars.onUpdateScope || this;
            this.onUpdateParams = vars.onUpdateParams || [];
            this.isPlaying = false;
            this.isReverse = vars.isReverse || false;
            this.timeScale = vars.timeScale || 1;

            this.isKeep = false;
            this.isYoReverse = false;

            this.startTime = this.delay;
            this._updateEndTime();
            // this.endTime = this.repeat < 0 ? 999999999999 : (this.startTime + this.repeatDelay * this.repeat + this.duration * (this.repeat + 1));
            this.curTime = this.prevTime = 0;

            this.labels = [];
            this.tweens = [];
            this.calls = [];

        },

        _updateEndTime: function(){
            this.endTime = this.repeat < 0 ? 999999999999 : (this.startTime + this.repeatDelay * this.repeat + this.duration * (this.repeat + 1));
        },

        _update: function (time) {
            this.isKeep = false;

            time = this.isReverse ? -time * this.timeScale : time * this.timeScale;
            this.prevTime = this.curTime;
            this.curTime = this.prevTime + time;

            if (this.onUpdate) this.onUpdate.apply(this.onUpdateScope, this.onUpdateParams);

            if (this.isReverse && this.prevTime >= 0 && this.curTime < 0) {
                this.curTime = 0;
                this._updateProp();
                if (this.onStart && this.prevTime >= this.startTime) this.onStart.apply(this.onStartScope, this.onStartParams);
                return this.isKeep;
            } else if (!this.isReverse && this.prevTime < this.endTime && this.curTime >= this.endTime) {
                this.curTime = this.endTime;
                this._updateProp();
                if (this.onEnd) this.onEnd.apply(this.onEndScope, this.onEndParams);
                return this.isKeep;
            } else {
                var _repeat = this.repeat < 0 ? 999999999999 : this.repeat;
                var _prevRepeat = Math.min(_repeat, Math.max(0, Math.floor((this.prevTime - this.startTime) / (this.duration + this.repeatDelay))));
                var _curRepeat = Math.min(_repeat, Math.max(0, Math.floor((this.curTime - this.startTime) / (this.duration + this.repeatDelay))));
                if (_prevRepeat != _curRepeat) {
                    if (this.yoyo) this.isYoReverse = !this.isYoReverse;
                    if (this.onRepeat) this.onRepeat.apply(this.onRepeatScope, this.onRepeatParams);
                }

                this._updateProp();

                if (this.onEnd && this.isReverse && this.prevTime == this.endTime && this.curTime < this.endTime) this.onEnd.apply(this.onEndScope, this.onEndParams);

                if (this.onStart && (this.isReverse ? (this.prevTime >= this.startTime && this.curTime < this.startTime) : ((this.startTime == 0 && this.prevTime == 0 && this.curTime >= this.startTime) || (this.prevTime < this.startTime && this.curTime >= this.startTime)))) this.onStart.apply(this.onStartScope, this.onStartParams);

                return true;
            }

        },

        _updateProp: function(){
            var _prevTime = this.prevTime == this.endTime ? this.duration : ((this.prevTime - this.startTime) % (this.duration + this.repeatDelay));
            var _curTime = this.curTime == this.endTime ? this.duration : ((this.curTime - this.startTime) % (this.duration + this.repeatDelay));
            this._checkCall(_prevTime, _curTime);
            this._checkTween(_prevTime, _curTime);
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
            if (position == undefined) return this.duration;

            var _o = regValue(position);
            var _time = 0;
            if (_o.label) {
                _time = this.getLabelTime(_o.label);
            } else if (_o.ext) {
                switch (_o.ext) {
                    case '+=':
                        _time = this.duration + _o.num * 1000;
                        break;
                    case '-=':
                        _time = this.duration - _o.num * 1000;
                        break;
                }
                this._updateEndTime();
            } else if (_o.num) {
                _time = _o.num * 1000;
            }

            return _time;
        },

        _addCall: function (call, position) {
            var _time = this._parsePosition(position);
            this.duration = Math.max(this.duration, _time);
            this.calls.push({time: _time, call: call});
            this._updateEndTime();
        },

        _checkCall: function (prevTime, curTime) {
            for (var i = 0, _len = this.calls.length; i < _len; i++) {
                var _call = this.calls[i];
                var startTime = _call.time;
                if (this.isReverse ? (prevTime >= startTime && curTime < startTime) : ((startTime == 0 && prevTime == 0 && curTime >= startTime) || (prevTime < startTime && curTime >= startTime))) _call.call();
            }
        },

        _addTween: function (tween, position) {
            var _time = this._parsePosition(position);
            this.duration = Math.max(this.duration, _time + tween.endTime);
            this.tweens.push({time: _time, tween: tween});
            this._updateEndTime();
        },

        _checkTween: function (prevTime, curTime) {
            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var startTime = _tween.time;
                var endTime = _tween.time + _tween.tween.endTime;
                if ((curTime >= startTime && curTime <= endTime) || (prevTime > startTime && prevTime < endTime)) {
                    if (prevTime >= startTime && curTime < startTime) {
                        _tween.tween._update(prevTime - startTime);
                    } else if (prevTime > endTime && curTime <= endTime) {
                        _tween.tween.curTime = _tween.tween.prevTime = _tween.tween.endTime;
                        _tween.tween._update(endTime - curTime);
                    } else if (prevTime < startTime && curTime >= startTime) {
                        _tween.tween.curTime = _tween.tween.prevTime = 0;
                        _tween.tween._update(curTime - startTime);
                    } else if (prevTime <= endTime && curTime > endTime) {
                        _tween.tween._update(endTime - prevTime);
                    } else {
                        _tween.tween._update(Math.abs(curTime - prevTime));
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

        remove: function (position) {
            var _time = this._parsePosition(position);

            for (var _len = this.calls.length, i = _len - 1; i >= 0; i--) {
                var _call = this.calls[i];
                if (_call.time == _time) this.calls.splice(i, 1);
            }

            for (var _len = this.tweens.length, i = _len - 1; i >= 0; i--) {
                var _tween = this.tweens[i];
                if (_tween.time == _time) this.tweens.splice(i, 1);
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
            return null;
        },

        totalTime: function () {
            return this.duration;
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
            var _time = Math.max(0, Math.min(this.duration, this._parsePosition(position)));
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
            this.duration = 0;
            this.curTime = this.prevTime = this.startTime = this.endTime = 0;
            this.onStart = this.onRepeat = this.onEnd = this.onUpdate = null;
        }

    });


    //---------------------------------------------------------------全局方法
    Object.assign(JTL, {
        create: function (vars) {
            return new timeline(vars);
        },
        kill: function (tl) {
            tl.kill();
        }
    });

    return JTL;
}));
