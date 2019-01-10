/*!
 * GIT: https://github.com/shrekshrek/jstween
 **/

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
        typeof define === 'function' && define.amd ? define(factory) :
            (global.JT = factory());
}(this, (function () {
    'use strict';

    var JT = {};

    // --------------------------------------------------------------------辅助方法
    function each(obj, callback) {
        if (obj.length && obj.length > 0) {
            for (var i = 0; i < obj.length; i++) {
                callback.call(obj[i], i, obj[i]);
            }
        } else {
            callback.call(obj, 0, obj);
        }
    }

    //  WebkitTransform 转 -webkit-transform
    function hyphenize(str) {
        return str.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    //  webkitTransform 转 WebkitTransform
    function firstUper(str) {
        return str.replace(/\b(\w)|\s(\w)/g, function (m) {
            return m.toUpperCase();
        });
    }

    function fixed(n) {
        return Math.round(n * 1000) / 1000;
    }


    // --------------------------------------------------------------------time fix
    Date.now = (Date.now || function () {
        return new Date().getTime();
    });

    var nowOffset = Date.now();

    JT.now = function () {
        return Date.now() - nowOffset;
    };


    // --------------------------------------------------------------------prefix
    var prefix = function () {
        var _d = document.createElement('div');
        var _prefixes = ['Webkit', 'Moz', 'Ms', 'O'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Transform') in _d.style) return _prefixes[i];
        }
    }();

    function browserPrefix(str) {
        return prefix + (str ? firstUper(str) : '');
    }

    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };

    // --------------------------------------------------------------------dom style相关方法
    function getElement(el) {
        if (!el) throw "el is undefined, can't tween!!!";

        if (typeof(el) === 'string') {
            return document.querySelectorAll(el);
        } else {
            return el;
        }
    }

    var keywords = [
        'ease', 'delay', 'yoyo', 'repeat', 'repeatDelay',
        'onStart', 'onStartScope', 'onStartParams',
        'onRepeat', 'onRepeatScope', 'onRepeatParams',
        'onEnd', 'onEndScope', 'onEndParams',
        'onUpdate', 'onUpdateScope', 'onUpdateParams',
        'interpolation', 'isReverse', 'timeScale', 'isFrom', 'isPlaying'
    ];

    var specialProps = ['rotation', 'scale', 'autoAlpha'];

    function checkPropName(el, name, isDom) {
        for (var i = 0, l = keywords.length; i < l; i++) {
            if (name === keywords[i]) return undefined;
        }

        if (isDom) {
            for (var i = 0, l = specialProps.length; i < l; i++) {
                if (name === specialProps[i]) return name;
            }

            if (el._jt_obj[name] !== undefined) return name;

            if (el.style[name] !== undefined) return name;

            name = browserPrefix(name);
            if (el.style[name] !== undefined) return name;
        } else {
            if (typeof(el[name]) === 'string' || typeof(el[name]) === 'number') return name;
        }

        return undefined;
    }

    function checkValue(o1, o2) {
        var o = {};
        if (Array.isArray(o2)) {
            o.num = [o1.num];
            for (var i = 0, l = o2.length; i < l; i++) {
                var _o = calcValue(o1, o2[i]);
                o.num.push(_o.num);
                o.unit = _o.unit;
            }
        } else {
            o = calcValue(o1, o2);
        }
        return o;
    }

    function calcValue(o1, o2) {
        var _o2 = regValue(o2);

        if (o1.unit === 'rem' && _o2.unit !== 'rem') {
            checkRem();
            o1.num = fixed(o1.num * remUnit);
            o1.unit = 'px';
        } else if (o1.unit !== 'rem' && _o2.unit === 'rem') {
            checkRem();
            o1.num = fixed(o1.num / remUnit);
            o1.unit = 'rem';
        }

        var _value;
        switch (_o2.ext) {
            case '+=':
                _value = o1.num + _o2.num;
                break;
            case '-=':
                _value = o1.num - _o2.num;
                break;
            default:
                _value = _o2.num;
                break;
        }
        return {num: _value, unit: _o2.unit};
    }

    function checkJtobj(el) {
        if (el._jt_obj === undefined)
            el._jt_obj = {
                perspective: 0,
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1,
                skewX: 0,
                skewY: 0,
            };
    }

    function regValue(value) {
        var _r = /(\+=|-=|)(-|)(\d+\.\d+|\d+)(e[+-]?[0-9]{0,2}|)(rem|px|%|)/i;
        var _a = _r.exec(value);
        if (_a) return {num: fixed(_a[2] + _a[3] + _a[4]), unit: _a[5], ext: _a[1]};
        else return {num: 0, unit: 'px', ext: ''};
    }

    function checkString(value) {
        return /(,| |jpeg|jpg|png|gif|-3d)/g.test(value) || !/\d/g.test(value);
    }

    function getProp(el, name) {
        switch (name) {
            case 'perspective':
            case 'x':
            case 'y':
            case 'z':
            case 'rotationX':
            case 'rotationY':
            case 'rotationZ':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
            case 'skewX':
            case 'skewY':
                return el._jt_obj[name];
            case 'rotation':
                return el._jt_obj['rotationZ'];
            case 'scale':
                return el._jt_obj['scaleX'];
            case 'autoAlpha':
                return getStyle(el, 'opacity');
            default:
                return getStyle(el, name);
        }
    }

    function getStyle(el, name) {
        if (el.style[name]) {
            return el.style[name];
        } else {
            var _p = hyphenize(name);
            var _s = window.getComputedStyle(el, null);
            return _s[_p] || _s.getPropertyValue(_p);
        }
    }

    var cssNumber = {
        'column-count': 1,
        'columns': 1,
        'font-weight': 1,
        'line-height': 1,
        'opacity': 1,
        'z-index': 1,
        'zoom': 1,
    };

    function setProp(el, name, value, unit) {
        switch (name) {
            case 'x':
            case 'y':
            case 'z':
                el._jt_obj[name] = value + (unit || 'px');
                return true;
            case 'rotationX':
            case 'rotationY':
            case 'rotationZ':
            case 'skewX':
            case 'skewY':
                el._jt_obj[name] = value % 360 + 'deg';
                return true;
            case 'perspective':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
                el._jt_obj[name] = value;
                return true;
            case 'rotation':
                el._jt_obj['rotationZ'] = value % 360 + 'deg';
                return true;
            case 'scale':
                el._jt_obj['scaleX'] = value;
                el._jt_obj['scaleY'] = value;
                return true;
            case 'autoAlpha':
                setStyle(el, 'opacity', value);
                setStyle(el, 'display', value > 0 ? 'block' : 'none');
                return false;
            default:
                if (unit !== undefined) value = !cssNumber[hyphenize(name)] ? value + (unit || "px") : value + unit;
                setStyle(el, name, value);
                return false;
        }
    }

    function setStyle(el, name, value) {
        el.style[name] = value;
    }

    function checkDom(obj) {
        return typeof(obj) === 'object' && obj.nodeType === 1;
    }

    function updateTransform(obj) {
        var _t = '';
        if (obj._jt_obj.perspective) _t += 'perspective(' + obj._jt_obj.perspective + ') ';
        if (obj._jt_obj.x || obj._jt_obj.y || obj._jt_obj.z) _t += 'translate3d(' + obj._jt_obj.x + ',' + obj._jt_obj.y + ',' + obj._jt_obj.z + ') ';
        if (obj._jt_obj.rotationX) _t += 'rotateX(' + obj._jt_obj.rotationX + ') ';
        if (obj._jt_obj.rotationY) _t += 'rotateY(' + obj._jt_obj.rotationY + ') ';
        if (obj._jt_obj.rotationZ) _t += 'rotateZ(' + obj._jt_obj.rotationZ + ') ';
        if (obj._jt_obj.scaleX !== 1 || obj._jt_obj.scaleY !== 1 || obj._jt_obj.scaleZ !== 1) _t += 'scale3d(' + obj._jt_obj.scaleX + ', ' + obj._jt_obj.scaleY + ', ' + obj._jt_obj.scaleZ + ') ';
        if (obj._jt_obj.skewX || obj._jt_obj.skewY) _t += 'skew(' + obj._jt_obj.skewX + ',' + obj._jt_obj.skewY + ') ';
        obj.style[browserPrefix('transform')] = _t;
    }

    // --------------------------------------------------------------------计算1rem单位值
    var body, tempDiv, remUnit;

    function checkRem() {
        if (!tempDiv) {
            tempDiv = document.createElement('div');
            tempDiv.style.cssText = 'border:0 solid; position:absolute; line-height:0px;';
        }
        if (!body) {
            body = document.getElementsByTagName('body')[0];
        }

        body.appendChild(tempDiv);
        tempDiv.style.borderLeftWidth = '1rem';
        remUnit = parseFloat(tempDiv.offsetWidth);
        body.removeChild(tempDiv);
    }


    // --------------------------------------------------------------------全局update
    var tweens = [];
    var tempTweens = [];
    var isUpdating = false;
    var lastTime = 0;

    function globalUpdate() {
        var _len = tweens.length;
        if (_len === 0) {
            isUpdating = false;
            return;
        }

        var _now = JT.now();
        var _step = _now - lastTime;
        lastTime = _now;
        if (_step > 500) _step = 33;

        tempTweens = tweens.slice(0);
        for (var i = 0; i < _len; i++) {
            var _tween = tempTweens[i];
            if (_tween && _tween.isPlaying && !_tween._update(_step)) _tween.pause();
        }

        requestFrame(globalUpdate);
    }

    // --------------------------------------------------------------------tween
    function tween() {
        this.initialize.apply(this, arguments);
    }

    Object.assign(tween.prototype, {
        initialize: function (el, time, fromVars, toVars, isDom) {
            this.fromVars = fromVars;
            this.curVars = {};
            this.toVars = toVars;
            this.el = el;
            this.duration = Math.max(time, 0) * 1000;
            this.ease = toVars.ease || JT.Linear.None;
            this.delay = Math.max(toVars.delay || 0, 0) * 1000;
            this.yoyo = toVars.yoyo || false;
            this.repeat = toVars.repeat || 0;
            this.repeatDelay = Math.max(toVars.repeatDelay || 0, 0) * 1000;
            this.onStart = toVars.onStart || null;
            this.onStartScope = toVars.onStartScope || this;
            this.onStartParams = toVars.onStartParams || [];
            this.onRepeat = toVars.onRepeat || null;
            this.onRepeatScope = toVars.onRepeatScope || this;
            this.onRepeatParams = toVars.onRepeatParams || [];
            this.onEnd = toVars.onEnd || null;
            this.onEndScope = toVars.onEndScope || this;
            this.onEndParams = toVars.onEndParams || [];
            this.onUpdate = toVars.onUpdate || null;
            this.onUpdateScope = toVars.onUpdateScope || this;
            this.onUpdateParams = toVars.onUpdateParams || [];
            this.isPlaying = false;
            this.interpolation = toVars.interpolation || null;
            this.isReverse = toVars.isReverse || false;
            this.timeScale = toVars.timeScale || 1;

            this.isFrom = toVars.isFrom || false;
            this.isInited = false;
            this.isSeek = false;
            this.isKeep = false;
            this.isYoReverse = false;
            this.isDom = isDom;

            this.repeat = this.repeat < 0 ? 999999999999 : Math.floor(this.repeat);
            this.curRepeat = 0;

            this.elapsed = null;

            this.startTime = this.delay;
            this.endTime = this.startTime + this.repeatDelay * this.repeat + this.duration * (this.repeat + 1);
            this.curTime = null;
            this.lastTime = null;

            if (toVars.isPlaying !== false) this.play();
        },

        _update: function (time) {
            this.isKeep = false;

            time = (this.isReverse ? -1 : 1) * time * this.timeScale;
            var _lastTime = this.curTime;
            var _curTime = Math.min(this.endTime, Math.max(0, _lastTime + time));

            if (_curTime === this.curTime) return true;

            this.lastTime = _lastTime;
            this.curTime = _curTime;

            var _repeat = Math.min(this.repeat, Math.max(0, Math.floor((this.curTime - this.startTime) / (this.duration + this.repeatDelay))));
            var _isRepeat = false;
            if (_repeat !== this.curRepeat) {
                this.curRepeat = _repeat;
                if (this.yoyo) this.isYoReverse = this.curRepeat % 2 !== 0;
                _isRepeat = true;
            }

            if (this.isFrom) {
                initData(this);
                this._updateProp();
            }

            if (this.lastTime < this.startTime && this.curTime < this.startTime) return true;

            if (!this.isFrom) {
                initData(this);
                this._updateProp();
            }

            if (this.lastTime < this.curTime) {
                if (this.lastTime <= this.startTime && this.curTime > this.startTime) {
                    if (!this.isSeek && this.onStart) this.onStart.apply(this.onStartScope, this.onStartParams);
                }

                if (_isRepeat && !this.isSeek && this.onRepeat) this.onRepeat.apply(this.onRepeatScope, this.onRepeatParams);

                if (this.lastTime < this.endTime && this.curTime >= this.endTime) {
                    if (!this.isSeek && this.onEnd) this.onEnd.apply(this.onEndScope, this.onEndParams);
                    return this.isKeep;
                }
            } else {
                if (this.lastTime >= this.endTime && this.curTime < this.endTime) {
                    if (!this.isSeek && this.onEnd) this.onEnd.apply(this.onEndScope, this.onEndParams);
                }

                if (_isRepeat && !this.isSeek && this.onRepeat) this.onRepeat.apply(this.onRepeatScope, this.onRepeatParams);

                if (this.lastTime > this.startTime && this.curTime <= this.startTime) {
                    if (!this.isSeek && this.onStart) this.onStart.apply(this.onStartScope, this.onStartParams);
                    return this.isKeep;
                }
            }

            return true;
        },

        _updateProp: function () {
            var _elapsed = Math.min(1, Math.max(0, (this.curTime === this.endTime ? this.duration : (this.curTime - this.startTime) % (this.duration + this.repeatDelay)) / this.duration));

            if (this.isYoReverse) _elapsed = 1 - _elapsed;

            if (_elapsed === this.elapsed) return;
            this.elapsed = _elapsed;

            var _radio = this.ease(_elapsed);

            var _trans = false;

            for (var prop in this.fromVars) {
                var _start = this.fromVars[prop];
                var _end = this.toVars[prop];

                var _n;
                if (Array.isArray(_end.num)) {
                    _n = this.interpolation(_end.num, _radio);
                } else {
                    _n = _start.num + (_end.num - _start.num) * _radio;
                }

                _n = fixed(_n);
                this.curVars[prop] = {num: _n, unit: _end.unit};

                if (this.isDom) {
                    if (setProp(this.el, prop, _n, _end.unit)) _trans = true;
                } else {
                    this.el[prop] = _n + (_end.unit || 0);
                }
            }

            if (_trans) updateTransform(this.el);

            if (!this.isSeek && this.onUpdate) this.onUpdate.apply(this.onUpdateScope, this.onUpdateParams);
        },

        _addSelf: function () {
            tweens.push(this);

            if (!isUpdating) {
                lastTime = JT.now();
                isUpdating = true;
                requestFrame(globalUpdate);
            }
        },

        _removeSelf: function () {
            var i = tweens.indexOf(this);
            if (i !== -1) tweens.splice(i, 1);
        },

        play: function (time) {
            this.isReverse = false;

            if (time !== undefined) this.seek(time, true);

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
            this.seek(0, true);
        },

        reverse: function (time) {
            this.isReverse = true;

            if (time !== undefined) this.seek(time, true);

            if (this.curTime === 0) return this.isKeep = false;
            else this.isKeep = true;

            if (this.isPlaying) return;
            this.isPlaying = true;
            this._addSelf();
        },

        seek: function (time, isSeek) {
            var _time = Math.max(0, Math.min(this.endTime, time * 1000));
            if (this.curTime === _time) return;

            this.isSeek = isSeek || false;
            this._update((this.isReverse ? -1 : 1) * (_time - this.curTime));
            this.isSeek = false;
        },

        setTimeScale: function (scale) {
            this.timeScale = scale;
        },

        kill: function (toEnd) {
            this.pause();
            if (toEnd) this.seek(this.endTime);
            this.duration = null;
            this.curTime = this.lastTime = this.startTime = this.endTime = null;
            this.el = this.onStart = this.onRepeat = this.onEnd = this.onUpdate = null;
        }
    });


    // --------------------------------------------------------------------tween 全局方法
    function initData(obj) {
        if (obj.isInited) return;
        obj.isInited = true;

        for (var i in obj.fromVars) {
            var _o = regValue(obj.isDom ? getProp(obj.el, i) : obj.el[i]);
            obj.fromVars[i] = obj.fromVars[i] === null ? _o : checkValue(_o, obj.fromVars[i]);
            obj.toVars[i] = obj.toVars[i] === null ? _o : checkValue(obj.fromVars[i], obj.toVars[i]);
        }
    }

    function createTween(type, el, time, fromVars, toVars) {
        if (typeof time !== "number") throw "The second parameter must be a number!";

        checkBezier(toVars);

        var _el = getElement(el);
        var _tweens = [];

        each(_el, function (index, obj) {
            var _fromVars = {};
            var _toVars = {};
            var _isDom = checkDom(obj);
            var _vars;
            switch (type) {
                case 'fromTo':
                    _vars = toVars;
                    _vars.isFrom = true;
                    break;
                case 'from':
                    _vars = fromVars;
                    _vars.isFrom = true;
                    break;
                case 'to':
                    _vars = toVars;
                    _vars.isFrom = false;
                    break;
            }

            if (_isDom) checkJtobj(obj);

            for (var i in _vars) {
                var _name = checkPropName(obj, i, _isDom);
                if (_name) {
                    switch (type) {
                        case 'fromTo':
                            _fromVars[_name] = fromVars[i];
                            _toVars[_name] = toVars[i];
                            break;
                        case 'from':
                            _fromVars[_name] = fromVars[i];
                            _toVars[_name] = null;
                            break;
                        case 'to':
                            _fromVars[_name] = null;
                            _toVars[_name] = toVars[i];
                            break;
                    }
                } else {
                    _toVars[i] = _vars[i];
                }
            }

            _tweens.push(new tween(obj, time, _fromVars, _toVars, _isDom));
        });

        if (_tweens.length === 0) return null;
        else if (_tweens.length === 1) return _tweens[0];
        else return _tweens;
    }

    Object.assign(JT, {
        get: function (el, param) {
            var _el = getElement(el);
            if (_el.length !== undefined) {
                _el = _el[0];
            }
            var _isDom = checkDom(_el);
            if (_isDom) {
                checkJtobj(_el);
                var _name = checkPropName(_el, param, _isDom);
                if (_name) return getProp(_el, _name);
                else return null;
            } else {
                return _el[param];
            }
        },

        set: function (el, params) {
            var _el = getElement(el);
            each(_el, function (index, obj) {
                var _isDom = checkDom(obj);
                if (_isDom) {
                    checkJtobj(obj);
                    var _trans = false;
                    for (var i in params) {
                        var _name = checkPropName(obj, i, _isDom);
                        if (_name) {
                            if (checkString(params[i])) {
                                if (setProp(obj, _name, params[i])) _trans = true;
                            } else {
                                var _o = checkValue(regValue(getProp(obj, _name)), params[i]);
                                if (setProp(obj, _name, _o.num, _o.unit)) _trans = true;
                            }
                        }
                    }
                    if (_trans) updateTransform(obj);
                } else {
                    for (var i in params) {
                        var _o = checkValue(regValue(obj[i]), params[i]);
                        obj[i] = _o.num + (_o.unit || 0);
                    }
                }
            });
        },

        fromTo: function (el, time, fromVars, toVars) {
            return (time || toVars.delay) ? createTween('fromTo', el, time, fromVars, toVars) : this.set(el, toVars);
        },

        from: function (el, time, fromVars) {
            return (time || fromVars.delay) ? createTween('from', el, time, fromVars, {}) : this.set(el, fromVars);
        },

        to: function (el, time, toVars) {
            return (time || toVars.delay) ? createTween('to', el, time, {}, toVars) : this.set(el, toVars);
        },

        kill: function (el, toEnd) {
            var _el = getElement(el);
            each(_el, function (index, obj) {
                var _len = tweens.length;
                for (var i = _len - 1; i >= 0; i--) {
                    var _tween = tweens[i];
                    if (_tween.el === obj) {
                        _tween.kill(toEnd);
                    }
                }
            });
        },

        killAll: function (toEnd) {
            var _len = tweens.length;
            for (var i = _len - 1; i >= 0; i--) {
                var _tween = tweens[i];
                _tween.kill(toEnd);
            }
        },

        play: function (el, time) {
            actionProxy(el, 'play', time);
        },

        playAll: function (time) {
            actionProxyAll('play', time);
        },

        pause: function (el) {
            actionProxy(el, 'pause');
        },

        pauseAll: function () {
            actionProxyAll('pause');
        },

        stop: function (el) {
            actionProxy(el, 'stop');
        },

        stopAll: function () {
            actionProxyAll('stop');
        },

        reverse: function (el, time) {
            actionProxy(el, 'reverse', time);
        },

        reverseAll: function (time) {
            actionProxyAll('reverse', time);
        },

        seek: function (el, time) {
            actionProxy(el, 'seek', time);
        },

        seekAll: function (time) {
            actionProxyAll('seek', time);
        },

        setTimeScale: function (el, scale) {
            actionProxy(el, 'setTimeScale', scale);
        },

        setTimeScaleAll: function (scale) {
            actionProxyAll('setTimeScale', scale);
        },

        isTweening: function (el) {
            var _el = getElement(el);
            _el = _el[0] || _el;
            var _len = tweens.length;
            for (var i = _len - 1; i >= 0; i--) {
                var _tween = tweens[i];
                if (_tween.el === _el) return true;
            }
            return false;
        },

        call: function (time, callback, params, isPlaying) {
            return time ? new tween({}, Math.max(0, time), {}, {
                onEnd: callback,
                onEndParams: params,
                isPlaying: isPlaying
            }, false) : callback.apply(callback, params);
        },

    });

    function actionProxy(el, action, params) {
        var _el = getElement(el);
        var _len = tweens.length;
        each(_el, function (index, obj) {
            for (var i = _len - 1; i >= 0; i--) {
                var _tween = tweens[i];
                if (_tween.el === obj) {
                    _tween[action](params);
                }
            }
        });
    }

    function actionProxyAll(action, params) {
        var _len = tweens.length;
        for (var i = _len - 1; i >= 0; i--) {
            var _tween = tweens[i];
            _tween[action](params);
        }
    }


    // --------------------------------------------------------------------bezier
    Object.assign(JT, {
        path: function (obj) {
            checkBezier(obj);
            var _ease = obj.ease || JT.Linear.None;
            var _step = obj.step || 1;

            var _radio, _arr = [];
            for (var i = 0; i <= _step; i++) {
                _radio = _ease(i / _step);
                var _o = {};
                for (var j in obj) {
                    if (Array.isArray(obj[j])) {
                        _o[j] = obj.interpolation(obj[j], _radio);
                    }
                }
                _arr.push(_o);
            }
            return _arr;
        }
    });

    function checkBezier(obj) {
        if (obj.bezier) {
            sortBezier(obj, obj.bezier);
            obj.interpolation = Bezier;
            delete obj.bezier;
        }
        if (obj.through) {
            sortBezier(obj, obj.through);
            obj.interpolation = Through;
            delete obj.through;
        }
        if (obj.linear) {
            sortBezier(obj, obj.linear);
            obj.interpolation = Linear;
            delete obj.linear;
        }
    }

    function sortBezier(el, arr) {
        for (var i = 0, l = arr.length; i < l; i++) {
            for (var j in arr[i]) {
                if (i === 0) {
                    el[j] = [arr[i][j]];
                } else {
                    el[j].push(arr[i][j]);
                }
            }
        }
    }

    function Linear(v, k) {
        var m = v.length - 1, f = m * k, i = Math.floor(f), fn = Utils.Linear;
        if (k < 0) return fn(v[0], v[1], f);
        if (k > 1) return fn(v[m], v[m - 1], m - f);
        return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);
    }

    function Bezier(v, k) {
        var b = 0, n = v.length - 1, pw = Math.pow, bn = Utils.Bernstein, i;
        for (i = 0; i <= n; i++) {
            b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
        }
        return b;
    }

    function Through(v, k) {
        var m = v.length - 1, f = m * k, i = Math.floor(f), fn = Utils.Through;
        if (v[0] === v[m]) {
            if (k < 0) i = Math.floor(f = m * (1 + k));
            return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);
        } else {
            if (k < 0) return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
            if (k > 1) return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    }

    var Utils = {
        Linear: function (p0, p1, t) {
            return (p1 - p0) * t + p0;
        },

        Bernstein: function (n, i) {
            var fc = Utils.Factorial;
            return fc(n) / fc(i) / fc(n - i);
        },

        Factorial: (function () {
            var a = [1];
            return function (n) {
                var s = 1, i;
                if (a[n]) return a[n];
                for (i = n; i > 1; i--) s *= i;
                return a[n] = s;
            };
        })(),

        Through: function (p0, p1, p2, p3, t) {
            var v0 = (p2 - p0) * 0.5, v1 = (p3 - p1) * 0.5, t2 = t * t, t3 = t * t2;
            return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (-3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;
        }
    };


    // --------------------------------------------------------------------缓动选项
    Object.assign(JT, {
        Linear: {
            None: function (k) {
                return k;
            }
        },
        Quad: {
            In: function (k) {
                return k * k;
            },
            Out: function (k) {
                return k * (2 - k);
            },
            InOut: function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k;
                return -0.5 * (--k * (k - 2) - 1);
            }
        },
        Cubic: {
            In: function (k) {
                return k * k * k;
            },
            Out: function (k) {
                return --k * k * k + 1;
            },
            InOut: function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k;
                return 0.5 * ((k -= 2) * k * k + 2);
            }
        },
        Quart: {
            In: function (k) {
                return k * k * k * k;
            },
            Out: function (k) {
                return 1 - (--k * k * k * k);
            },
            InOut: function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k;
                return -0.5 * ((k -= 2) * k * k * k - 2);
            }
        },
        Quint: {
            In: function (k) {
                return k * k * k * k * k;
            },
            Out: function (k) {
                return --k * k * k * k * k + 1;
            },
            InOut: function (k) {
                if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
                return 0.5 * ((k -= 2) * k * k * k * k + 2);
            }
        },
        Sine: {
            In: function (k) {
                return 1 - Math.cos(k * Math.PI / 2);
            },
            Out: function (k) {
                return Math.sin(k * Math.PI / 2);
            },
            InOut: function (k) {
                return 0.5 * (1 - Math.cos(Math.PI * k));
            }
        },
        Expo: {
            In: function (k) {
                return k === 0 ? 0 : Math.pow(1024, k - 1);
            },
            Out: function (k) {
                return k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
            },
            InOut: function (k) {
                if (k === 0) return 0;
                if (k === 1) return 1;
                if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
                return 0.5 * (-Math.pow(2, -10 * (k - 1)) + 2);
            }
        },
        Circ: {
            In: function (k) {
                return 1 - Math.sqrt(1 - k * k);
            },
            Out: function (k) {
                return Math.sqrt(1 - (--k * k));
            },
            InOut: function (k) {
                if ((k *= 2) < 1) return -0.5 * (Math.sqrt(1 - k * k) - 1);
                return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
            }
        },
        Elastic: {
            In: function (k) {
                var s, a = 0.1, p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return -(a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
            },
            Out: function (k) {
                var s, a = 0.1, p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                return (a * Math.pow(2, -10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);
            },
            InOut: function (k) {
                var s, a = 0.1, p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / (2 * Math.PI);
                if ((k *= 2) < 1) return -0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
                return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;
            }
        },
        Back: {
            In: function (k) {
                var s = 1.70158;
                return k * k * ((s + 1) * k - s);
            },
            Out: function (k) {
                var s = 1.70158;
                return --k * k * ((s + 1) * k + s) + 1;
            },
            InOut: function (k) {
                var s = 1.70158 * 1.525;
                if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
                return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
            }
        },
        Bounce: {
            In: function (k) {
                return 1 - JT.Bounce.Out(1 - k);
            },
            Out: function (k) {
                if (k < (1 / 2.75)) {
                    return 7.5625 * k * k;
                } else if (k < (2 / 2.75)) {
                    return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                } else if (k < (2.5 / 2.75)) {
                    return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                } else {
                    return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                }
            },
            InOut: function (k) {
                if (k < 0.5) return JT.Bounce.In(k * 2) * 0.5;
                return JT.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
            }
        }
    });

    return JT;

})));
