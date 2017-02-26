jstween为简单好用的tween类，api参考tweenlite。可对一般对象或者Dom对象使用(只针对style下属性,包括rotationX等属性)。  

jstimeline为jstween的扩展库,类似于greensock的TimelineLite,不过功能比较简单,方便编写大量基于时间线的jstween.  

默认单位是px,支持rem。  

API文档请查看doc目录  



性能测试
============
测试1:repeat无限循环测试,全屏600个div白点  
jstween:http://shrek.imdevsh.com/demo/performance/test1/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test1/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test1/csstween.html 


测试2:无限创建测试,每帧生成10个div白点,运动1s后结束自删除,带旋转  
jstween:http://shrek.imdevsh.com/demo/performance/test2/jstween.html  
tweenmax:http://shrek.imdevsh.com/demo/performance/test2/tweenmax.html  
csstween:http://shrek.imdevsh.com/demo/performance/test2/csstween.html  


以上测试可以看出,在pc端jstween效率和tweenmax差不多,modile端jstween略优于tweenmax.  
css animation的动画效率在移动端的表现是很出色的,transition会有些莫名的状况.  
最终结论,推荐使用jstween.  



