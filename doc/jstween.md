js tween
============

简单好用的tween类，api参考tweenmax。可对一般对象或者Dom对象使用。


API
============

全局tween方法  

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

param为字符串，  
Params为数组，

其中几个属性比较特殊:
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


性能测试
============
测试1:repeat无限循环测试,全屏1200个div白点  
18-19fps:http://shrek.imdevsh.com/demo/performance/test1/jstween.html  
19-21fps:http://shrek.imdevsh.com/demo/performance/test1/tweenmax.html  
17-18fps:http://shrek.imdevsh.com/demo/performance/test1/csstween.html  

测试2:无限创建测试,每秒60帧,每帧生成10个div白点,运动2s后结束自删除,峰值全屏1200个白点  
28-30fps:http://shrek.imdevsh.com/demo/performance/test2/jstween.html  
26-28fps:http://shrek.imdevsh.com/demo/performance/test2/tweenmax.html  
0-11fps:http://shrek.imdevsh.com/demo/performance/test2/csstween.html  

以上测试可以看出,jstween效率和tweenmax差不多,css animation的实现效率从test1中也能看出效率比js略低一筹(这里csstween初始帧频很低,因为创建时会先写入css规则,然后赋值给div,写入占用了很高的cpu资源,稳定之后的17-18帧就是css动画的实际效率),
最终结论,推荐使用jstween.  


如果有大量基于时间线的tween动画需求,可以使用扩展库jstimeline
https://github.com/shrekshrek/jstimeline


