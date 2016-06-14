jstween为简单好用的tween类，api参考tweenlite。可对一般对象或者Dom对象使用(只针对style下属性,包括rotationX等属性)。  

jstimeline为jstween的扩展库,类似于greensock的TimelineLite,不过功能比较简单,方便编写大量基于时间线的jstween.  

默认单位是px,支持rem。  

API文档请查看doc目录  



性能测试
============
测试1:repeat无限循环测试,全屏1200个div白点  
jstween:http://shrek.imdevsh.com/demo/performance/test1/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test1/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test1/csstween.html  
pc端chrome:  
jstween:20-21fps  
tweenmax:20-21fps  
csstween:8-13fps  

iphone5s wechat:  
jstween:6-6fps  
tweenmax:6-6fps  
csstween:49-50fps(css animation循环动画在移动端有不可比拟的渲染优势,不过创建阶段效率很低)  


测试2:无限创建测试,每帧生成10个div白点,运动2s后结束自删除,带旋转  
jstween:http://shrek.imdevsh.com/demo/performance/test2/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test2/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test2/csstween.html  
pc端chrome:  
jstween:23-25fps  
tweenmax:22-24fps  
csstween:17-19fps  

iphone5s wechat:  
jstween:16-16fps  
tweenmax:9-12fps  
csstween:8-9fps  


以上测试可以看出,在pc端jstween效率和tweenmax差不多,modile端js优于tweenmax.  
css animation的动画效率在移动端的表现是很出色的,transition会有些莫名的状况.  
最终结论,推荐使用jstween或者csstween.  



