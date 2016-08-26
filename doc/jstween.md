js tween
============

简单好用的tween类，api参考tweenmax。可对一般对象或者Dom对象使用。


API
============

全局tween方法:  

JT.get(target, param);  
JT.set(target, params);  

JT.fromTo(target, duration, fromParams, toParams);  
JT.from(target, duration, fromParams);  
JT.to(target, duration, toParams);  

JT.play(target);  
JT.playAll();  

JT.pause(target);  
JT.pauseAll();  

JT.restart(target);  
JT.restartAll();  

JT.kill(target, [toEnd]);  
JT.killAll([toEnd]);  

JT.isTweening(target);  

param为字符串，  
params为数组，  

其中几个属性比较特殊:  
linear:[]折线数组  
bezier:[]贝塞尔数组  
through:[]同样是贝塞尔数组,不过是穿越数组中各点  

ease设置缓动，  
delay设置延时时间，  
repeat设置重复次数，  
repeatDelay设置每次重复的间隔延时时间，  
yoyo设置重复时反向，  
isPlaying设置是否立即播放，  
onStart设置运动开始的返回函数，  
onStartParams设置开始返回函数的参数，  
onRepeat设置运动循环中每个运动完成的返回函数，  
onRepeatParams设置运动完成返回函数的参数，  
onEnd设置运动完成的返回函数，  
onEndParams设置返回函数的参数  
onUpdate设置每帧渲染时的返回函数，  
onUpdateParams设置每帧渲染时返回函数的参数，  


tween实例方法：

tween.play(); 播放  
tween.pause(); 暂停  
tween.kill([toEnd]); 删除，参数设置是否直接去到终点并出发onEnd




全局call方法  

JT.call(delay, callback, callbackParams);

JT.playCall(callback);  
JT.playAllCalls();  

JT.pauseCall(callback);  
JT.pauseAllCalls();  

JT.killCall(callback, [toEnd]);  
JT.killAllCalls();  


call实例方法：

call.play(); 播放  
call.pause(); 暂停  
call.kill(); 删除



全局path方法:  

JT.path(obj);

包含以下属性:  
linear:[]折线数组  
bezier:[]贝塞尔数组  
through:[]同样是贝塞尔数组,不过是穿越数组中各点  

ease设置缓动，  
step设置分步的步数,  



缓动类

JT.Linear  
JT.Quad  
JT.Cubic  
JT.Quart  
JT.Quint  
JT.Sine  
JT.Expo  
JT.Circ  
JT.Elastic  
JT.Back  
JT.Bounce  

除了JT.Linear只有None一项，其他均有In,InOut,Out三项选择。  


以上方法和参数均是参考TweenLite的方式，有使用经验者会很容易上手。  


