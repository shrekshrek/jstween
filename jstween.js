/*!
 * VERSION: 0.5.0
 * DATE: 2016-2-21
 * GIT:https://github.com/shrekshrek/jstween
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function (factory) {
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global);

    if (typeof define === 'function' && define.amd) {
        define(['exports'], function (exports) {
            root.JT = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.JT = factory(root, {});
    }

}(function (root, JT) {
    // --------------------------------------------------------------------辅助方法
    function extend(obj, obj2) {
        for (var prop in obj2) {
            obj[prop] = obj2[prop];
        }
    }

    function each(obj, callback) {
        if (typeof(obj) === 'function') {
            callback.call(obj, 0, obj);
        } else if (obj.length === undefined) {
            callback.call(obj, 0, obj);
        } else {
            for (var i = 0; i < obj.length; i++) {
                callback.call(obj[i], i, obj[i]);
            }
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


    // --------------------------------------------------------------------time fix
    Date.now = (Date.now || function () {
        return new Date().getTime();
    });

    var nowOffset = Date.now();

    var now = function () {
        return Date.now() - nowOffset;
    };


    // --------------------------------------------------------------------prefix
    var prefix = '';

    (function () {
        var _d = document.createElement('div');
        var _prefixes = ['Webkit', 'Moz', 'Ms', 'O'];

        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Transform') in _d.style) {
                prefix = _prefixes[i];
                break;
            }
        }
    }());

    function browserPrefix(str) {
        if (str) {
            return prefix + firstUper(str);
        } else {
            return prefix;
        }
    }

    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };


    // --------------------------------------------------------------------dom style相关方法
    function getElement(target) {
        if (!target) throw "target is undefined, can't tween!!!";

        if (typeof(target) == 'string') {
            return (typeof(document) === 'undefined') ? target : (document.querySelectorAll ? document.querySelectorAll(target) : document.getElementById((target.charAt(0) === '#') ? target.substr(1) : target));
        } else {
            return target;
        }
    }

    function checkPropName(target, name) {
        if (target._jt_obj[name] !== undefined) return name;

        if (target.style[name] !== undefined) return name;

        name = browserPrefix(name);
        if (target.style[name] !== undefined) return name;

        return undefined;
    }

    function checkValue(value, value2, value3, push) {
        if (value2 instanceof Array) {
            for (var i in value2) {
                value2[i] = calcValue(value, value2[i]);
            }
            if (value3 != undefined) {
                if (push) {
                    value2.push(value3);
                } else {
                    value2.unshift(value3);
                }
            }
        } else {
            value2 = calcValue(value, value2);
        }
        return value2;
    }

    function calcValue(value, value2) {
        switch (typeof(value2)) {
            case 'string':
                var _s = value2.substr(0, 2);
                var _n = parseFloat(value2.substr(2));
                switch (_s) {
                    case '+=':
                        value2 = value + _n;
                        break;
                    case '-=':
                        value2 = value - _n;
                        break;
                }
                break;
        }
        return value2;
    }

    function checkCssValue(name, value) {
        switch (name) {
            case 'opacity':
            case 'fontWeight':
            case 'lineHeight':
            case 'zoom':
                return value;
            default:
                //return Math.round(value) + 'px';
                return typeof(value) === 'number' ? Math.round(value) + 'px' : value;
                break;
        }
    }

    function checkJtobj(target) {
        if (target._jt_obj == undefined)
            target._jt_obj = {
                x: 0,
                y: 0,
                z: 0,
                rotationX: 0,
                rotationY: 0,
                rotationZ: 0,
                scaleX: 1,
                scaleY: 1,
                scaleZ: 1
            };
    }

    function getProp(target, name) {
        switch (name) {
            case 'x':
            case 'y':
            case 'z':
            case 'rotationX':
            case 'rotationY':
            case 'rotationZ':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
                return target._jt_obj[name];
            default:
                return getStyle(target, name);
        }
    }

    function getStyle(target, name) {
        if (document.defaultView && document.defaultView.getComputedStyle) {
            var _p = hyphenize(name);
            var _s = document.defaultView.getComputedStyle(target, '');
            return _s && _s.getPropertyValue(_p);
        } else if (target.currentStyle) {
            return target.currentStyle[name];
        } else {
            return null;
        }
    }

    function setProp(target, name, value) {
        switch (name) {
            case 'x':
            case 'y':
            case 'z':
            case 'rotationX':
            case 'rotationY':
            case 'rotationZ':
            case 'scaleX':
            case 'scaleY':
            case 'scaleZ':
                target._jt_obj[name] = value;
                return true;
            default:
                setStyle(target, name, value);
                return false;
        }
    }

    function setStyle(target, name, value) {
        target.style[name] = checkCssValue(name, value);
    }

    function isDOM(obj) {
        return typeof(obj) === 'object' && obj.nodeType === 1;
    }


    // --------------------------------------------------------------------全局update
    var tweens = [];
    var isUpdating = false;

    function globalUpdate() {
        isUpdating = true;
        var _len = tweens.length, i;
        var _len2 = calls.length, j;
        if (_len === 0 && _len2 === 0) {
            isUpdating = false;
            return;
        }

        var _time = now();
        for (i = _len - 1; i >= 0; i--) {
            if (tweens[i] && !tweens[i]._update(_time)) {
                var _tween = tweens.splice(i, 1)[0];
                if (_tween.onUpdate) _tween.onUpdate.apply(_tween, _tween.onUpdateParams);
                if (_tween.onEnd) _tween.onEnd.apply(_tween, _tween.onEndParams);
                _tween.target = null;
            }
        }
        for (j = _len2 - 1; j >= 0; j--) {
            if (calls[j] && !calls[j]._update(_time)) {
                var _call = calls.splice(j, 1)[0];
                if (_call.onEnd) _call.onEnd.apply(_call, _call.onEndParams);
            }
        }

        requestFrame(globalUpdate);
    }

    // --------------------------------------------------------------------tween
    function tween() {
        this.initialize.apply(this, arguments);
    }

    extend(tween.prototype, {
        initialize: function (target, time, fromVars, toVars, isDom) {
            this.fromVars = fromVars;
            this.curVars = {};
            this.toVars = toVars;
            this.target = target;
            this.duration = Math.max(time, 0) * 1000;
            this.ease = toVars.ease || JT.Linear.None;
            this.delay = Math.max(toVars.delay || 0, 0) * 1000;
            this.yoyo = toVars.yoyo || false;
            this.repeat = this.curRepeat = Math.floor(toVars.repeat || 0);
            this.repeatDelay = Math.max(toVars.repeatDelay || 0, 0) * 1000;
            this.onStart = toVars.onStart || null;
            this.onStartParams = toVars.onStartParams || [];
            this.onRepeat = toVars.onRepeat || null;
            this.onRepeatParams = toVars.onRepeatParams || [];
            this.onEnd = toVars.onEnd || null;
            this.onEndParams = toVars.onEndParams || [];
            this.onUpdate = toVars.onUpdate || null;
            this.onUpdateParams = toVars.onUpdateParams || [];
            this.isPlaying = toVars.isPlaying || true;
            this.interpolation = toVars.interpolation || null;

            this.isReverse = false;
            this.isDom = isDom;

            this.curTime = 0;
            this.lastTime = now();
            this.isStart = false;
            this.startTime = this.delay;
            this.endTime = this.startTime + this.repeatDelay + this.duration;

            if (this.delay != 0) {
                this._updateProp();
                if (this.onUpdate) this.onUpdate.apply(this, this.onUpdateParams);
            }

            tweens.unshift(this);
            if (!isUpdating) globalUpdate();
            else this._update(this.lastTime);
        },

        _update: function (time) {
            var _time = time - this.lastTime;
            this.lastTime = time;

            if (!this.isPlaying) return true;

            _time %= this.duration;
            this.curTime += _time;

            if (this.curTime < this.startTime) return true;

            if (!this.isStart) {
                this.isStart = true;
                if (this.onStart) this.onStart.apply(this, this.onStartParams);
            }

            if (this.curTime < this.startTime + this.repeatDelay) return true;

            if (this.curTime < this.endTime) {
                this._updateProp();
                if (this.onUpdate) this.onUpdate.apply(this, this.onUpdateParams);
            } else {
                if (this.curRepeat == 0) {
                    this._updateProp();
                    return false;
                }

                if (this.yoyo) this.isReverse = !this.isReverse;

                if (this.repeatDelay == 0) {
                    this.curTime = this.curTime - this.duration - this.repeatDelay;
                    this._updateProp();
                } else {
                    this._updateProp();
                    this.curTime = this.curTime - this.duration - this.repeatDelay;
                }

                if (this.onUpdate) this.onUpdate.apply(this, this.onUpdateParams);
                if (this.onRepeat) this.onRepeat.apply(this, this.onRepeatParams);
                if (this.curRepeat > 0) this.curRepeat--;
            }

            return true;
        },

        _updateProp: function () {
            var _elapsed = this.duration == 0 ? 1 : ((this.curTime - this.startTime - this.repeatDelay) / this.duration);
            _elapsed = Math.max(0, Math.min(1, _elapsed));

            if (this.isReverse) _elapsed = 1 - _elapsed;

            var _radio = this.ease(_elapsed);

            var _trans = false;

            for (var prop in this.fromVars) {
                var _start = this.fromVars[prop];
                var _end = this.toVars[prop] || 0;

                var _n;
                if (_end instanceof Array) {
                    _n = this.interpolation(_end, _radio);
                } else if (_start instanceof Array) {
                    _n = this.interpolation(_start, _radio);
                } else {
                    _n = _start + ( _end - _start ) * _radio;
                }
                _n = Math.round(_n * 100) / 100;
                this.curVars[prop] = _n;

                if (this.isDom) {
                    if (setProp(this.target, prop, _n)) _trans = true;
                } else {
                    this.target[prop] = _n;
                }
            }

            if (_trans)
                this.target.style[browserPrefix('transform')] = 'translate3d(' + this.target._jt_obj.x + 'px,' + this.target._jt_obj.y + 'px,' + this.target._jt_obj.z + 'px) ' + 'rotateX(' + this.target._jt_obj.rotationX % 360 + 'deg) ' + 'rotateY(' + this.target._jt_obj.rotationY % 360 + 'deg) ' + 'rotateZ(' + this.target._jt_obj.rotationZ % 360 + 'deg) ' + 'scale3d(' + this.target._jt_obj.scaleX + ', ' + this.target._jt_obj.scaleY + ', ' + this.target._jt_obj.scaleZ + ') ';

        },

        play: function () {
            if (!this.target) return;

            this.isPlaying = true;
        },

        pause: function () {
            if (!this.target) return;

            this.isPlaying = false;
        },

        destroy: function (toEnd) {
            if (!this.target) return;

            var i = tweens.indexOf(this);
            if (i !== -1) {
                var _tween = tweens.splice(i, 1)[0];
                if (toEnd && _tween.onEnd) _tween.onEnd.apply(_tween, _tween.onEndParams);
                this.target = null;
            }
        }
    });


    // --------------------------------------------------------------------tween 全局方法
    extend(JT, {
        get: function (target, param) {
            var _target = getElement(target);
            if (_target.length !== undefined) {
                _target = _target[0];
            }
            if (isDOM(_target)) {
                checkJtobj(_target);
                var _name = checkPropName(_target, param);
                if (_name) return getProp(_target, _name);
                else return null;
            } else {
                return _target[param];
            }
        },

        set: function (target, params) {
            var _target = getElement(target);
            each(_target, function (index, obj) {
                if (isDOM(obj)) {
                    checkJtobj(obj);
                    var _trans = false;
                    for (var i in params) {
                        var _name = checkPropName(obj, i);
                        if (_name) {
                            var _value = checkValue(parseFloat(getProp(obj, _name)), params[i]);
                            if (setProp(obj, _name, _value)) _trans = true;
                        }
                    }

                    if (_trans)
                        obj.style[browserPrefix('transform')] = 'translate3d(' + obj._jt_obj.x + 'px,' + obj._jt_obj.y + 'px,' + obj._jt_obj.z + 'px) ' + 'rotateX(' + obj._jt_obj.rotationX % 360 + 'deg) ' + 'rotateY(' + obj._jt_obj.rotationY % 360 + 'deg) ' + 'rotateZ(' + obj._jt_obj.rotationZ % 360 + 'deg) ' + 'scale3d(' + obj._jt_obj.scaleX + ', ' + obj._jt_obj.scaleY + ', ' + obj._jt_obj.scaleZ + ') ';

                } else {
                    for (var j in params) {
                        obj[j] = checkValue(obj[j], params[j]);
                    }
                }
            });
        },

        fromTo: function (target, time, fromVars, toVars) {
            checkBezier(toVars);
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);
                if (_isDom) {
                    checkJtobj(obj);
                    for (var i in toVars) {
                        var _name = checkPropName(obj, i);
                        if (_name) {
                            var _n = parseFloat(getProp(obj, _name));
                            _fromVars[_name] = checkValue(_n, fromVars[i]);
                            _toVars[_name] = checkValue(_n, toVars[i], _fromVars[_name], false);
                        } else {
                            _toVars[i] = toVars[i];
                        }
                    }
                } else {
                    for (var i in toVars) {
                        if ((obj[i] !== undefined)) {
                            var _n = parseFloat(obj[i]);
                            _fromVars[i] = checkValue(_n, fromVars[i]);
                            _toVars[i] = checkValue(_n, toVars[i], _fromVars[i], false);
                        } else {
                            _toVars[i] = toVars[i];
                        }
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        from: function (target, time, fromVars) {
            checkBezier(fromVars);
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);
                if (_isDom) {
                    checkJtobj(obj);
                    for (var i in fromVars) {
                        var _name = checkPropName(obj, i);
                        if (_name) {
                            var _n = parseFloat(getProp(obj, _name));
                            _fromVars[_name] = checkValue(_n, fromVars[i], _n, true);
                            _toVars[_name] = _n;
                        } else {
                            _toVars[i] = fromVars[i];
                        }
                    }
                } else {
                    for (var i in fromVars) {
                        if ((obj[i] !== undefined)) {
                            var _n = parseFloat(obj[i]);
                            _fromVars[i] = checkValue(_n, fromVars[i], _n, true);
                            _toVars[i] = _n;
                        } else {
                            _toVars[i] = fromVars[i];
                        }
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        to: function (target, time, toVars) {
            checkBezier(toVars);
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function (index, obj) {
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);
                if (_isDom) {
                    checkJtobj(obj);
                    for (var i in toVars) {
                        var _name = checkPropName(obj, i);
                        if (_name) {
                            var _n = parseFloat(getProp(obj, _name));
                            _fromVars[_name] = _n;
                            _toVars[_name] = checkValue(_n, toVars[i], _n, false);
                        } else {
                            _toVars[i] = toVars[i];
                        }
                    }
                } else {
                    for (var i in toVars) {
                        if ((obj[i] !== undefined)) {
                            var _n = parseFloat(obj[i]);
                            _fromVars[i] = _n;
                            _toVars[i] = checkValue(_n, toVars[i], _n, false);
                        } else {
                            _toVars[i] = toVars[i];
                        }
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if (_tweens.length == 1) {
                return _tweens[0];
            } else {
                return _tweens;
            }
        },

        kill: function (target, toEnd) {
            var _target = getElement(target);
            each(_target, function (index, obj) {
                var _len = tweens.length;
                for (var i = _len - 1; i >= 0; i--) {
                    var _tween = tweens[i];
                    if (_tween.target === obj) {
                        //_tween.kill(toEnd);
                        tweens.splice(i, 1);
                        if (toEnd && _tween.onEnd) _tween.onEnd.apply(_tween, _tween.onEndParams);
                        _tween.target = null;
                    }
                }
            });
        },

        killAll: function (toEnd) {
            if (!toEnd) {
                tweens = [];
                return;
            }

            var _len = tweens.length;
            for (var i = _len - 1; i >= 0; i--) {
                var _tween = tweens.splice(i, 1);
                if (toEnd && _tween.onEnd) _tween.onEnd.apply(_tween, _tween.onEndParams);
                _tween.target = null;
            }
        },

        play: function (target) {
            actionProxyTween(target, 'play');
        },

        playAll: function () {
            actionProxyAllTweens('play');
        },

        pause: function (target) {
            actionProxyTween(target, 'pause');
        },

        pauseAll: function () {
            actionProxyAllTweens('pause');
        }

    });

    function actionProxyTween(target, action) {
        var _target = getElement(target);
        var _len = tweens.length;
        each(_target, function (index, obj) {
            for (var i = _len - 1; i >= 0; i--) {
                var _tween = tweens[i];
                if (_tween.target === obj) {
                    _tween[action]();
                }
            }
        });
    }

    function actionProxyAllTweens(action) {
        var _len = tweens.length;
        for (var i = _len - 1; i >= 0; i--) {
            var _tween = tweens[i];
            _tween[action]();
        }
    }


    // --------------------------------------------------------------------call
    var calls = [];

    function call() {
        this.initialize.apply(this, arguments);
    }

    extend(call.prototype, {
        initialize: function (time, callback, params, isPlaying) {
            this.delay = time * 1000;
            this.onEnd = callback || null;
            this.onEndParams = params || [];

            this.curTime = 0;
            this.lastTime = now();
            this.endTime = this.delay;
            this.isPlaying = isPlaying || true;

            calls.unshift(this);
            if (!isUpdating) globalUpdate();
            else this._update(this.lastTime);
        },
        _update: function (time) {
            var _time = time - this.lastTime;
            this.lastTime = time;

            if (!this.isPlaying) return true;

            this.curTime += _time;

            if (this.curTime < this.endTime) return true;

            return false;
        },
        play: function () {
            this.isPlaying = true;
        },
        pause: function () {
            this.isPlaying = false;
        },
        destroy: function (toEnd) {
            var i = calls.indexOf(this);
            if (i !== -1) {
                var _call = calls.splice(i, 1)[0];
                if (toEnd && _call.onEnd) _call.onEnd.apply(_call, _call.onEndParams);
            }
        }
    });


    //---------------------------------------------------------------call 全局方法
    extend(JT, {
        call: function (time, callback, params) {
            return new call(time, callback, params);
        },

        killCall: function (callback, toEnd) {
            var _target = callback;
            var _len = calls.length;
            each(_target, function (index, obj) {
                for (var i = _len - 1; i >= 0; i--) {
                    var _call = calls[i];
                    if (_call.onEnd === obj) {
                        //_call.kill(toEnd);
                        calls.splice(i, 1);
                        if (toEnd && _call.onEnd) _call.onEnd.apply(_call, _call.onEndParams);
                    }
                }
            });
        },

        killAllCalls: function (toEnd) {
            if (!toEnd) {
                calls = [];
                return;
            }

            var _len = calls.length;
            for (var i = _len - 1; i >= 0; i--) {
                var _call = calls.splice(i, 1);
                if (toEnd && _call.onEnd) _call.onEnd.apply(_call, _call.onEndParams);
            }
        },

        playCall: function (callback) {
            actionProxyCall(callback, 'play');
        },

        playAllCalls: function () {
            actionProxyAllCalls('play');
        },

        pauseCall: function (callback) {
            actionProxyCall(callback, 'pause');
        },

        pauseAllCalls: function () {
            actionProxyAllCalls('pause');
        }

    });

    function actionProxyCall(callback, action) {
        var _target = callback;
        var _len = calls.length;
        each(_target, function (index, obj) {
            for (var i = _len - 1; i >= 0; i--) {
                var _call = calls[i];
                if (_call.onEnd === obj) {
                    _call[action]();
                }
            }
        });
    }

    function actionProxyAllCalls(action) {
        var _len = calls.length;
        for (var i = _len - 1; i >= 0; i--) {
            var _call = calls[i];
            _call[action]();
        }
    }


    // --------------------------------------------------------------------bezier
    extend(JT, {
        path: function (obj) {
            checkBezier(obj);
            var _ease = obj.ease || JT.Linear.None;
            var _step = obj.step || 1;

            var _radio, _arr = [];
            for (var i = 0; i <= _step; i++) {
                _radio = _ease(i / _step);
                var _o = {};
                for (var j in obj) {
                    if (obj[j] instanceof Array) {
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

    function sortBezier(target, arr) {
        for (var i in arr) {
            for (var j in arr[i]) {
                if (i == 0) {
                    target[j] = [arr[i][j]];
                } else {
                    target[j].push(arr[i][j]);
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
            if (k < 0) i = Math.floor(f = m * ( 1 + k ));
            return fn(v[( i - 1 + m ) % m], v[i], v[( i + 1 ) % m], v[( i + 2 ) % m], f - i);
        } else {
            if (k < 0) return v[0] - ( fn(v[0], v[0], v[1], v[1], -f) - v[0] );
            if (k > 1) return v[m] - ( fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m] );
            return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);
        }
    }

    var Utils = {
        Linear: function (p0, p1, t) {
            return ( p1 - p0 ) * t + p0;
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
            var v0 = ( p2 - p0 ) * 0.5, v1 = ( p3 - p1 ) * 0.5, t2 = t * t, t3 = t * t2;
            return ( 2 * p1 - 2 * p2 + v0 + v1 ) * t3 + ( -3 * p1 + 3 * p2 - 2 * v0 - v1 ) * t2 + v0 * t + p1;
        }
    };


    // --------------------------------------------------------------------缓动选项
    extend(JT, {
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
                return k * ( 2 - k );
            },
            InOut: function (k) {
                if (( k *= 2 ) < 1) return 0.5 * k * k;
                return -0.5 * ( --k * ( k - 2 ) - 1 );
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
                if (( k *= 2 ) < 1) return 0.5 * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k + 2 );
            }
        },
        Quart: {
            In: function (k) {
                return k * k * k * k;
            },
            Out: function (k) {
                return 1 - ( --k * k * k * k );
            },
            InOut: function (k) {
                if (( k *= 2 ) < 1) return 0.5 * k * k * k * k;
                return -0.5 * ( ( k -= 2 ) * k * k * k - 2 );
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
                if (( k *= 2 ) < 1) return 0.5 * k * k * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
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
                return 0.5 * ( 1 - Math.cos(Math.PI * k) );
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
                if (( k *= 2 ) < 1) return 0.5 * Math.pow(1024, k - 1);
                return 0.5 * ( -Math.pow(2, -10 * ( k - 1 )) + 2 );
            }
        },
        Circ: {
            In: function (k) {
                return 1 - Math.sqrt(1 - k * k);
            },
            Out: function (k) {
                return Math.sqrt(1 - ( --k * k ));
            },
            InOut: function (k) {
                if (( k *= 2 ) < 1) return -0.5 * ( Math.sqrt(1 - k * k) - 1);
                return 0.5 * ( Math.sqrt(1 - ( k -= 2) * k) + 1);
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
                else s = p * Math.asin(1 / a) / ( 2 * Math.PI );
                return -( a * Math.pow(2, 10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) );
            },
            Out: function (k) {
                var s, a = 0.1, p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / ( 2 * Math.PI );
                return ( a * Math.pow(2, -10 * k) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) + 1 );
            },
            InOut: function (k) {
                var s, a = 0.1, p = 0.4;
                if (k === 0) return 0;
                if (k === 1) return 1;
                if (!a || a < 1) {
                    a = 1;
                    s = p / 4;
                }
                else s = p * Math.asin(1 / a) / ( 2 * Math.PI );
                if (( k *= 2 ) < 1) return -0.5 * ( a * Math.pow(2, 10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) );
                return a * Math.pow(2, -10 * ( k -= 1 )) * Math.sin(( k - s ) * ( 2 * Math.PI ) / p) * 0.5 + 1;
            }
        },
        Back: {
            In: function (k) {
                var s = 1.70158;
                return k * k * ( ( s + 1 ) * k - s );
            },
            Out: function (k) {
                var s = 1.70158;
                return --k * k * ( ( s + 1 ) * k + s ) + 1;
            },
            InOut: function (k) {
                var s = 1.70158 * 1.525;
                if (( k *= 2 ) < 1) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
                return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
            }
        },
        Bounce: {
            In: function (k) {
                return 1 - JT.Bounce.Out(1 - k);
            },
            Out: function (k) {
                if (k < ( 1 / 2.75 )) {
                    return 7.5625 * k * k;
                } else if (k < ( 2 / 2.75 )) {
                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                } else if (k < ( 2.5 / 2.75 )) {
                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                } else {
                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                }
            },
            InOut: function (k) {
                if (k < 0.5) return JT.Bounce.In(k * 2) * 0.5;
                return JT.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;
            }
        }
    });

    JT.now = now;

    return JT;
}));
