/*!
 * VERSION: 0.1.0
 * DATE: 2015-07-09
 * GIT:https://github.com/shrekshrek/jstween
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function(){
    if ("performance" in window == false) {
        window.performance = {};
    }
    Date.now = (Date.now || function () {  // thanks IE8
        return new Date().getTime();
    });
    if ("now" in window.performance == false){
        var nowOffset = Date.now();
        window.performance.now = function now(){
            return Date.now() - nowOffset;
        }
    }
})();

(function(factory) {
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global);

    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            root.JT = factory(root, exports);
        });
    } else if (typeof exports !== 'undefined') {
        factory(root, exports);
    } else {
        root.JT = factory(root, {});
    }

}(function(root, JT) {
    var previousJsTween = root.JT;

    JT.VERSION = '0.1.0';

    JT.noConflict = function() {
        root.JT = previousJsTween;
        return this;
    };

    // --------------------------------------------------------------------辅助方法
    var extend = function(obj){
        var length = arguments.length;
        if (length < 2 || obj == null) return obj;
        for (var index = 1; index < length; index++) {
            var source = arguments[index],
                ks = keys(source),
                l = ks.length;
            for (var i = 0; i < l; i++) {
                var key = ks[i];
                obj[key] = source[key];
            }
        }
        return obj;
    };

    var keys = function(obj){
        var keys = [];
        for(var key in obj){
            keys.push(key);
        }
        return keys;
    };

    function each(obj, callback) {
        if(obj.length === undefined){
            callback.call(obj, 0, obj);
        }else{
            for (var i = 0; i < obj.length; i++){
                callback.call(obj[i], i, obj[i]);
            }
        }
    }

    //  WebkitTransform 转 -webkit-transform
    function hyphenize(str){
        return str.replace(/([A-Z])/g, "-$1").toLowerCase();
    }

    //  webkitTransform 转 WebkitTransform
    function firstUper(str){
        return str.replace(/\b(\w)|\s(\w)/g, function(m){
            return m.toUpperCase();
        });
    }

    // --------------------------------------------------------------------prefix
    var requestFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) { window.setTimeout(callback, 1000 / 60); };

    var prefix = '';
    (function (){
        var _prefixes = ['webkit', 'moz', 'ms', 'o'];
        var _d = document.createElement('div');
        for (var i in _prefixes) {
            if ((_prefixes[i] + 'Transform') in _d.style) {
                prefix = _prefixes[i];
                break;
            }
        }
    }());

    JT.requestAnimationFrame = requestFrame;

    function browserPrefix(str){
        if (str) {
            return prefix + firstUper(str);
        } else {
            return prefix;
        }
    }


    // --------------------------------------------------------------------dom style相关方法
    function getElement(target){
        if(!target) throw "target is undefined, can't tween!!!";

        if(typeof(target) == 'string'){
            return (typeof(document) === 'undefined') ? target : (document.querySelectorAll ? document.querySelectorAll(target) : document.getElementById((target.charAt(0) === '#') ? target.substr(1) : target));
        }else{
            return target;
        }
    }

    function checkDomProp(dom, name){
        if(dom.style[name] !== undefined){
            return name;
        }

        name = browserPrefix(name);
        if(dom.style[name] !== undefined){
            return name;
        }

        return null;
    }

    function checkValue(value, value2){
        if(typeof(value2) === "string"){
            return value + parseFloat(value2);
        }else if(typeof(value2) === "number"){
            return value2;
        }
    }

    function getStyleValue(dom, param){
        if(dom.style[param]){
            return dom.style[param];
        }else if(document.defaultView && document.defaultView.getComputedStyle){
            var _p = hyphenize(param);
            var _s = document.defaultView.getComputedStyle(dom,'');
            return _s && _s.getPropertyValue(_p);
        }else if(dom.currentStyle){
            return dom.currentStyle[param];
        }else{
            return null;
        }
    }

    function setStyleValue(dom, params){
        for(var i in params){
            dom.style[i] = checkNumberValue(i, params[i]);
        }
    }

    var numberNames = ['fontWeight','lineHeight','opacity','zoom'];
    function checkNumberValue(name, value){
        for(var i in numberNames){
            if(name === numberNames[i]){
                return value;
            }
        }
        return typeof(value) === 'number'?value + 'px':value;
    }

    //var isDOM = (typeof HTMLElement === 'object')?
    //    function(obj){
    //        return obj instanceof HTMLElement;
    //    }:
    //    function(obj){
    //        return obj && typeof obj === 'object' && obj.nodeType === 1 && typeof obj.nodeName === 'string';
    //    };

    function isDOM(obj){
        return obj.style !== undefined;
    }


    // --------------------------------------------------------------------主体
    var globalTweens = [];
    var isUpdating = false;

    function globalUpdate() {
        isUpdating = true;
        var _len = globalTweens.length;
        if ( _len === 0 ) {
            isUpdating = false;
            return;
        }

        var _time = window.performance.now();
        for(var i = _len-1; i >= 0; i--){
            if ( !globalTweens[i].update( _time ) ) {
                var _tween = globalTweens.splice(i, 1)[0];
                if(_tween.onEnd) _tween.onEnd.apply(_tween.target, _tween.onEndParams);
                _tween.target = null;
            }
        }

        requestFrame(globalUpdate);
    }

    //function checkUnique(tween){
    //    var _len = globalTweens.length;
    //    var i, j, k;
    //    for(i = _len-1; i >= 0; i--){
    //        if(tween.target == globalTweens[i].target){
    //            var k1 = keys(tween.fromVars);
    //            var k2 = keys(globalTweens[i].fromVars);
    //            var isSame = true;
    //            if(k1.length == k2.length){
    //                for(j in k1){
    //                    if(k1[j] != k2[j]){
    //                        isSame = false;
    //                        break;
    //                    }
    //                }
    //            }
    //            if(!isSame) continue;
    //
    //            var _tween = globalTweens.splice(i, 1)[0];
    //            _tween.update(window.performance.now());
    //            for(k in tween.fromVars){
    //                tween.fromVars[k] = parseFloat(_tween.isDom ? getStyleValue(_tween.target, k) : _tween.target[k]);
    //            }
    //            _tween.target = null;
    //            break;
    //        }
    //    }
    //}

    function tween(){
        this.init.apply(this, arguments);
    }

    extend(tween.prototype, {
        init: function(target, time, fromVars, toVars, isDom){
            this.fromVars = fromVars;
            this.toVars = toVars;
            this.target = target;
            this.duration = time * 1000;
            this.ease = toVars.ease || JT.Linear.None;
            this.repeat = toVars.repeat || 1;
            this.yoyo = toVars.yoyo || false;
            this.delay = (toVars.delay || 0) * 1000;
            this.onStart = toVars.onStart || null;
            this.onStartParams = toVars.onStartParams || [];
            this.onIteration = toVars.onIteration || null;
            this.onIterationParams = toVars.onIterationParams || [];
            this.onEnd = toVars.onEnd || null;
            this.onEndParams = toVars.onEndParams || [];
            this.onUpdate = toVars.onUpdate || null;
            this.onUpdateParams = toVars.onUpdateParams || [];
            this.isPlaying = toVars.isPlaying || true;

            this.isReverse = false;
            this.isDom = isDom;

            this.curTime = 0;
            this.lastTime = window.performance.now();
            this.isStart = false;
            this.startTime = this.delay;
            this.endTime = this.startTime + this.duration;

            this.restart();
            //checkUnique(this);
            globalTweens.unshift(this);

            if(!isUpdating)
                globalUpdate();
        },
        update: function(time){
            var _time = time - this.lastTime;
            this.lastTime = time;

            if(!this.isPlaying)
                return true;

            this.curTime += _time;

            if(this.curTime < this.startTime)
                return true;

            if(!this.isStart){
                this.isStart = true;
                if(this.onStart) this.onStart.apply(this.target, this.onStartParams);
            }

            var _elapsed = (this.curTime - this.startTime)/this.duration;
            _elapsed = _elapsed > 1 ? 1 : _elapsed;

            if(this.isReverse)
                _elapsed = 1 - _elapsed;

            var _radio = parseFloat(this.ease(_elapsed));

            for(var prop in this.fromVars){
                var _start = this.fromVars[prop];
                var _end = this.toVars[prop] || 0;

                var _n = _start + ( _end - _start ) * _radio;
                if(this.isDom){
                    this.target.style[prop] = checkNumberValue(prop, _n);
                }else{
                    this.target[prop] = _n;
                }
            }

            if(this.onUpdate) this.onUpdate.apply(this.target, this.onUpdateParams);

            if(this.curTime >= this.endTime){
                if(this.repeat == 1){
                    return false;
                }else if(this.repeat > 1){
                    if(this.onIteration) this.onIteration.apply(this.target, this.onIterationParams);
                    this.repeat--;
                }

                this.curTime = this.startTime;

                if(this.yoyo){
                    this.isReverse = !this.isReverse;
                }
            }

            return true;
        },
        play: function(){
            this.isPlaying = true;
        },
        pause: function(){
            this.isPlaying = false;
        },
        restart: function(){
            this.curTime = 0;
            for(var prop in this.fromVars){
                var _n = this.fromVars[prop];
                if(this.isDom){
                    this.target.style[prop] = checkNumberValue(prop, _n);
                }else{
                    this.target[prop] = _n;
                }
            }
        },
        reverse: function(){
            this.curTime = this.endTime - this.curTime + this.startTime;
            this.isReverse = !this.isReverse;
        },
        kill: function(toEnd){
            var i = globalTweens.indexOf(this);
            if (i !== -1) {
                if(toEnd){
                    var _tween = globalTweens.splice(i, 1)[0];
                    _tween.update(_tween.endTime - _tween.curTime + _tween.lastTime);
                    if(_tween.onEnd) _tween.onEnd.apply(_tween.target, _tween.onEndParams);
                    _tween.target = null;
                }else{
                    var _tween = globalTweens.splice(i, 1)[0];
                    _tween.update(window.performance.now());
                    _tween.target = null;
                }
            }
        }
    });

    // --------------------------------------------------------------------主要方法
    extend(JT, {
        get: function(target, param){
            var _target = getElement(target);
            if(_target.length !== undefined){
                _target = _target[0];
            }
            if(isDOM(_target)){
                var _name = checkDomProp(_target, param);
                if(_name)
                    return getStyleValue(_target, _name);
                else
                    return null;
            }else{
                return _target[param];
            }
        },

        set: function(target, params){
            var _target = getElement(target);
            each(_target, function(index, obj){
                if(isDOM(obj)){
                    var _params = {};
                    for(var j in params){
                        var _name = checkDomProp(obj, j);
                        if(_name) _params[_name] = params[j];
                    }
                    setStyleValue(obj, _params);
                }else{
                    for(var j in params){
                        obj[j] = params[j];
                    }
                }
            });
        },

        fromTo: function(target, time, fromVars, toVars){
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function(index, obj){
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);

                for(var j in toVars){
                    if(_isDom ? (obj.style[j] !== undefined) : (obj[j] !== undefined)){
                        var _n = parseFloat(_isDom ? getStyleValue(obj, j) : obj[j]);
                        _fromVars[j] = checkValue(_n, fromVars[j]);
                        _toVars[j] = checkValue(_n, toVars[j]);
                    }else{
                        _toVars[j] = toVars[j];
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        from: function(target, time, fromVars){
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function(index, obj){
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);

                for(var j in fromVars){
                    if(_isDom ? (obj.style[j] !== undefined) : (obj[j] !== undefined)){
                        var _n = parseFloat(_isDom ? getStyleValue(obj, j) : obj[j]);
                        _toVars[j] = _n;
                        _fromVars[j] = checkValue(_n, fromVars[j]);
                    }else{
                        _toVars[j] = fromVars[j];
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        to: function(target, time, toVars){
            var _target = getElement(target);
            var _tweens = [];
            each(_target, function(index, obj){
                var _fromVars = {};
                var _toVars = {};
                var _isDom = isDOM(obj);

                for(var j in toVars){
                    if(_isDom ? (obj.style[j] !== undefined) : (obj[j] !== undefined)){
                        var _n = parseFloat(_isDom ? getStyleValue(obj, j) : obj[j]);
                        _fromVars[j] = _n;
                        _toVars[j] = checkValue(_n, toVars[j]);
                    }else{
                        _toVars[j] = toVars[j];
                    }
                }

                var _tween = new tween(obj, time, _fromVars, _toVars, _isDom);
                _tweens.push(_tween);
            });

            if(_tweens.length == 1){
                return _tweens[0];
            }else{
                return _tweens;
            }
        },

        kill: function(target, toEnd){
            var _target = getElement(target);
            var _len = globalTweens.length;
            each(_target, function(index, obj){
                for(var i = _len-1; i >= 0; i--){
                    var _tween = globalTweens[i];
                    if(_tween.target === obj){
                        _tween.kill(toEnd);
                    }
                }
            });
        },

        killAll: function(toEnd){
            if(!toEnd){
                globalTweens = [];
                return;
            }

            var _len = globalTweens.length;
            for(var i = _len-1; i >= 0; i--){
                var _tween = globalTweens[i];
                _tween.kill(toEnd);
            }
        },

        play: function(target){
            actionProxy(target, 'play');
        },

        playAll: function(){
            actionProxyAll('play');
        },

        pause: function(target){
            actionProxy(target, 'pause');
        },

        pauseAll: function(){
            actionProxyAll('pause');
        },

        restart: function(target){
            actionProxy(target, 'restart');
        },

        restartAll: function(){
            actionProxyAll('restart');
        },

        reverse: function(target){
            actionProxy(target, 'reverse');
        },

        reverseAll: function(){
            actionProxyAll('reverse');
        }
    });

    function actionProxy(target, action){
        var _target = getElement(target);
        var _len = globalTweens.length;
        each(_target, function(index, obj){
            for(var i = _len-1; i >= 0; i--){
                var _tween = globalTweens[i];
                if(_tween.target === obj){
                    _tween[action]();
                }
            }
        });
    }

    function actionProxyAll(action){
        var _len = globalTweens.length;
        for(var i = _len-1; i >= 0; i--){
            var _tween = globalTweens[i];
            _tween[action]();
        }
    }

    // --------------------------------------------------------------------缓动选项
    extend(JT, {
        Linear: {
            None: function ( k ) {
                return k;
            }
        },
        Quad: {
            In: function ( k ) {
                return k * k;
            },
            Out: function ( k ) {
                return k * ( 2 - k );
            },
            InOut: function ( k ) {
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
                return - 0.5 * ( --k * ( k - 2 ) - 1 );
            }
        },
        Cubic: {
            In: function ( k ) {
                return k * k * k;
            },
            Out: function ( k ) {
                return --k * k * k + 1;
            },
            InOut: function ( k ) {
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k + 2 );
            }
        },
        Quart: {
            In: function ( k ) {
                return k * k * k * k;
            },
            Out: function ( k ) {
                return 1 - ( --k * k * k * k );
            },
            InOut: function ( k ) {
                if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
                return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );
            }
        },
        Quint: {
            In: function ( k ) {
                return k * k * k * k * k;
            },
            Out: function ( k ) {
                return --k * k * k * k * k + 1;
            },
            InOut: function ( k ) {
                if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
                return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
            }
        },
        Sine: {
            In: function ( k ) {
                return 1 - Math.cos( k * Math.PI / 2 );
            },
            Out: function ( k ) {
                return Math.sin( k * Math.PI / 2 );
            },
            InOut: function ( k ) {
                return 0.5 * ( 1 - Math.cos( Math.PI * k ) );
            }
        },
        Expo: {
            In: function ( k ) {
                return k === 0 ? 0 : Math.pow( 1024, k - 1 );
            },
            Out: function ( k ) {
                return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );
            },
            InOut: function ( k ) {
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
                return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
            }
        },
        Circ: {
            In: function ( k ) {
                return 1 - Math.sqrt( 1 - k * k );
            },
            Out: function ( k ) {
                return Math.sqrt( 1 - ( --k * k ) );
            },
            InOut: function ( k ) {
                if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
                return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
            }
        },
        Elastic: {
            In: function ( k ) {
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
            },
            Out: function ( k ) {
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
            },
            InOut: function ( k ) {
                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) return 0;
                if ( k === 1 ) return 1;
                if ( !a || a < 1 ) { a = 1; s = p / 4; }
                else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
                return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
            }
        },
        Back: {
            In: function ( k ) {
                var s = 1.70158;
                return k * k * ( ( s + 1 ) * k - s );
            },
            Out: function ( k ) {
                var s = 1.70158;
                return --k * k * ( ( s + 1 ) * k + s ) + 1;
            },
            InOut: function ( k ) {
                var s = 1.70158 * 1.525;
                if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
                return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
            }
        },
        Bounce: {
            In: function ( k ) {
                return 1 - TWEEN.Easing.Bounce.Out( 1 - k );
            },
            Out: function ( k ) {
                if ( k < ( 1 / 2.75 ) ) {
                    return 7.5625 * k * k;
                } else if ( k < ( 2 / 2.75 ) ) {
                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
                } else if ( k < ( 2.5 / 2.75 ) ) {
                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
                } else {
                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
                }
            },
            InOut: function ( k ) {
                if ( k < 0.5 ) return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
                return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;
            }
        }
    });

    return JT;
}));
