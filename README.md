jstween为简单好用的tween类，api参考tweenlite。可对一般对象或者Dom对象使用(只针对style下属性,特殊属性如rotationX等直接使用无效,需要使用其他方法变通)。

jstimeline为jstween的扩展库,类似于greensock的TimelineLite,不过功能比较简单,方便编写大量基于时间线的jstween

API文档请查看doc目录  



性能测试
============
测试1:repeat无限循环测试,全屏1200个div白点  
jstween:http://shrek.imdevsh.com/demo/performance/test1/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test1/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test1/csstween.html  
pc端chrome:  
jstween:12-13fps  
tweenmax:15-16fps  
csstween:12-13fps  

iphone5s wechat:  
jstween:6-6fps  
tweenmax:6-6fps  
csstween:50-52fps(css animation循环动画在移动端有不可比拟的渲染优势)  


测试2:无限创建测试,每秒60帧,每帧生成10个div白点,运动2s后结束自删除,峰值全屏1200个白点,带旋转  
jstween:http://shrek.imdevsh.com/demo/performance/test2/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test2/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test2/csstween.html  
pc端chrome:  
jstween:19-20fps  
tweenmax:18-19fps  
csstween:10-14fps  

iphone5s wechat:  
jstween:16-16fps  
tweenmax:9-12fps  
csstween:15-15fps(移动端transition出现闪断现象,有待检查)  


以上测试可以看出,在pc端jstween效率和tweenmax差不多,modile端js优于tweenmax.  
css animation的动画效率在移动端的表现是很出色的,transition会有些莫名的状况.  
最终结论,推荐使用jstween或者csstween.  


如果有大量基于时间线的tween动画需求,可以使用扩展库jstimeline
https://github.com/shrekshrek/jstimeline



