js timeline
============

jstween的扩展库,类似于greensock的TimelineLite,不过功能比较简单,方便编写大量基于时间线的jstween
注:本库强依赖jstween
https://github.com/shrekshrek/jstween


API
============

全局方法:  
JTL.create();  
JTL.kill();  

实例方法:  
fromTo();  
from();  
to();  
kill();  
add();  
addLabel();  
removeLabel();  
getLabelTime();  
totalTime();  
play();  
pause();  
seek();  
clear();  


时间戳范例说明
============

关于时间戳的写法，以下面案例说明  
var tl = JTL.create();//建立一个时间线实例  

tl.add('l1',2);//在2秒处建立一个时间戳  

tl.add(function(){  
  console.log('this is l1');  
},'l1');//在之前建立过的时间戳上绑定触发事件  

tl.to(obj, 1, {x:100}, 'l1+=2');//也可以这样使用，意思就是'l1'这个时间戳之后2秒执行  

tl.from(obj2, 1, {x:200}, '+=1');//当时间标签里没有写前缀时默认就是使用当前时间戳，也就是当前运动到的最后一个时间节点，这里就是指前面obj运动完成之后，再过1秒执行本行tween  

