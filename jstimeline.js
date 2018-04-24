/*!
 * GIT: https://github.com/shrekshrek/jstween
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
            this.repeat = vars.repeat || 0;
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

            this.isSeek = false;
            this.isKeep = false;
            this.isYoReverse = false;

            this.repeat = this.repeat < 0 ? 999999999999 : Math.floor(this.repeat);
            this.curRepeat = 0;

            this.startTime = this.delay;
            this._updateEndTime();
            this.curTime = 0;
            this.prevTime = 0;

            this.labels = [];
            this.tweens = [];
            this.calls = [];

        },

        _updateEndTime: function () {
            this.endTime = this.startTime + this.repeatDelay * this.repeat + this.duration * (this.repeat + 1);
        },

        _update: function (time) {
            this.isKeep = false;

            time = (this.isReverse ? -1 : 1) * time * this.timeScale;
            this.prevTime = this.curTime;
            this.curTime = this.prevTime + time;

            if (this.prevTime > 0 && this.curTime <= 0) {
                this.curTime = 0;
                this._updateProp();
                if (!this.isSeek && this.onStart && this.prevTime > this.startTime) this.onStart.apply(this.onStartScope, this.onStartParams);
                return this.isKeep;
            } else if (this.prevTime < this.endTime && this.curTime >= this.endTime) {
                this.curTime = this.endTime;
                this._updateProp();
                if (!this.isSeek && this.onEnd) this.onEnd.apply(this.onEndScope, this.onEndParams);
                return this.isKeep;
            } else {
                var _repeat = Math.min(this.repeat, Math.max(0, Math.floor((this.curTime - this.startTime) / (this.duration + this.repeatDelay))));
                if (_repeat !== this.curRepeat) {
                    this.curRepeat = _repeat;
                    if (this.yoyo) this.isYoReverse = !this.isYoReverse;
                    if (!this.isSeek && this.onRepeat) this.onRepeat.apply(this.onRepeatScope, this.onRepeatParams);
                }
                this._updateProp();

                if (!this.isSeek && this.onEnd && this.prevTime >= this.endTime && this.curTime < this.endTime) this.onEnd.apply(this.onEndScope, this.onEndParams);

                if (!this.isSeek && this.onStart && ((this.startTime === 0 && this.prevTime === 0 && this.curTime > this.startTime) || (this.prevTime < this.startTime && this.curTime >= this.startTime) || (this.prevTime > this.startTime && this.curTime <= this.startTime))) this.onStart.apply(this.onStartScope, this.onStartParams);

                return true;
            }
        },

        _updateProp: function () {
            this._checkTween();

            if (this.onUpdate) this.onUpdate.apply(this.onUpdateScope, this.onUpdateParams);
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
            if (position === undefined) return this.duration;

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

        _addTween: function (tween, position) {
            tween.stop();
            var _time = this._parsePosition(position);
            this.duration = Math.max(this.duration, _time + tween.endTime);
            this.tweens.push({time: _time, tween: tween});
            this._updateEndTime();
        },

        _checkTween: function () {
            for (var i = 0, _len = this.tweens.length; i < _len; i++) {
                var _tween = this.tweens[i];
                var _prevTime = (this.prevTime - this.startTime) % (this.duration + this.repeatDelay);
                var _curTime = this.curTime === this.endTime ? this.duration : ((this.curTime - this.startTime) % (this.duration + this.repeatDelay));
                if (_tween.tween.endTime === 0) {
                    if (!this.isSeek && ((_tween.time === 0 && _prevTime === 0 && _curTime > 0) || (!this.isReverse && _prevTime < _tween.time && _curTime >= _tween.time) || (this.isReverse && _prevTime > _tween.time && _curTime <= _tween.time))) {
                        if (_tween.tween.onEnd) _tween.tween.onEnd.apply(_tween.tween.onEndScope, _tween.tween.onEndParams);
                    }
                } else {
                    _tween.tween.seek((_curTime - _tween.time) / 1000, this.isSeek);
                }
            }
        },

        fromTo: function (target, time, fromVars, toVars, position) {
            toVars.isPlaying = false;
            this._addTween(JT.fromTo(target, time, fromVars, toVars), position);
            return this;
        },

        from: function (target, time, fromVars, position) {
            fromVars.isPlaying = false;
            this._addTween(JT.from(target, time, fromVars), position);
            return this;
        },

        to: function (target, time, toVars, position) {
            toVars.isPlaying = false;
            this._addTween(JT.to(target, time, toVars), position);
            return this;
        },

        add: function (obj, position) {
            switch (typeof(obj)) {
                case 'object':
                    this._addTween(obj, position);
                    break;
                case 'function':
                    this._addTween(JT.call(0, obj, [], false), position);
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
            this.isReverse = false;

            if (position !== undefined) this.seek(position, true);

            if (this.curTime === this.endTime) return this.isKeep = false;
            else this.isKeep = true;

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
            if (this.curTime !== 0) {
                this.curTime = this.curRepeat = 0;
                this.isYoReverse = false;
                this._updateProp();
            }
        },

        reverse: function (position) {
            this.isReverse = true;

            if (position !== undefined) this.seek(position, true);

            if (this.curTime === 0) return this.isKeep = false;
            else this.isKeep = true;

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addSelf();
        },

        seek: function (position, isSeek) {
            var _time = Math.max(0, Math.min(this.endTime, this._parsePosition(position)));
            if (this.curTime === _time) return;

            if (isSeek !== undefined) this.isSeek = isSeek;
            this._update(_time - this.curTime);
            this.isSeek = false;
        },

        kill: function () {
            this.pause();
            this.tweens = [];
            this.calls = [];
            this.labels = [];
            this.duration = null;
            this.curTime = this.prevTime = this.startTime = this.endTime = null;
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
