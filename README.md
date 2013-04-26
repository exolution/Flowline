#Flowline流水线
###基于Promise模式的异步编程工具
<hr/>
众所周知一般一个程序或者一段逻辑皆有一个流程组成，这在同步程序中也没什么大惊小怪的。
但在异步和回调的世界 你发现代码并不是一字排开的顺序了。多了回调的嵌套，回调里面可能又有异步代码又需要嵌套回调。
当回调嵌套了很多层时，其对于代码可读性的影响几乎是毁灭性的。
而本工具所谓流水线即以同步代码顺序执行的形式 来执行存在先后顺序的同步和异步的过程，此形式更适和人类这种存在先后、因果的顺序逻辑思维。
一个流水线即代表一个代码逻辑的执行流程，它定义了过程的执行顺序，而你却无需考虑这些过程是同步的还是异步的。

###使用方法

####1 、一个流水线（代码执行流程）必须由一个流水线函数开始。流水线函数定义如下 

    在普通函数末尾加入 return Flowline.promise()使普通函数变为流水线函数。 （此处是必须的） 
    在需要的地方（一般为异步回调执行的地方）执行Flowline.resolve(参数)来执行流水线的后续过程。
    使用Flowline.reject(参数)执行后续的错误处理过程。
    另外，若需要由一个非流水线函数开始 则可以用Flowline()函数将其转换成流水线函数。
    注意，只能转换同步函数 ，对异步函数无效或者无意义
一个典型的流水线函数例子如下
```javascript 
function async1(){
    setTimeout(function(){
        try{
            var a=1+2;
            Flowline.resolve(a);
        }catch(e){
            Flowline.reject('出错了');
        }
    },1000);
    return Flowline.promise();
}
```
 
####2、一个流水线由若干个过程组装而成
    一个流水线由存在先后顺序的流水线函数组成。
    以一个流水线函数开始，并以.then(后续流水线过程函数，错误处理函数，this绑定)方式添加后续过程，
    使用.fail(fn)添加统一的错误处理函数
    添加的函数可以使同步的也可以是异步的。可以是流水线函数 也可以是普通函数。
    流水线系统会自动以该普通函数的返回值作为参数执行流水线中的后续过程。若该函数抛出异常则自动执行其后续错误处理函数
    但是如果是异步普通函数则无意义，也就是说如果想把异步函数加入到流水线中必须将其实现成流水线函数。
    注意。请尽量保证同一时段只有一个流水线存在。
  两个典型的例子如下
```javascript
  async1().then(sub1,errorProc1)
          .then(sub2)
          .then(sub3)
          .fail(统一的错误处理函数);
  Flowline.reset();
  Flowline(普通同步函数,其他函数...).then(async1)
                                    .then(sub2);
```
##相关功能点与API
主要API Flowline.resolve、Flowline.reject、then、Flowline.promise等API前面已有介绍
####1、Flowline.after 前置条件 
    此方法用来使当前函数在运行中等待另外一个函数执行完之后再执行。
    一般来说该函数应严格定义执行前置条件的分支使其只执行一次以免造成死循环
一个典型的例子如下 syncFn发现数据未定义就去执行asyncFn等其完成后重新执行自己。
```javascript
    function asyncFn(a,b){
        setTimeout(function(){
            Flowline.resolve(a+b);
        },1000);
        return Flowline.promise();
    }
    function syncFn(data){
        if(data==undefined){
            Flowline.after(asyncFn,1,2);
        }
        else {
                Flowline.resolve(data*2)
        }
        return Flowline.promise();
    }
```
<hr>
####2、Flowline.resume 恢复流水线执行
    在错误处理函数中调用可以继续执行异常函数(即执行Flowline.reject或抛异常的函数)的后续过程
####3.Flowline.set Flowline.get
    存取流水线上下文环境的值 相当于一个全局变量空间。用于所有流水线过程共享值。
