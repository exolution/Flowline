/**
 * Flowline 流水线同步/异步执行模型
 * @author: exolution
 * Date: 13-4-11
 * Time: 下午4:29
 *
 */
//Flowline 流水线同步/异步执行模型
;var Flowline=function (window,undefined) {
    var _flowList = [],//执行队列（回调列表）
        ptr = 0,//执行队列指针
        listening=0,
        lastResult,
        _context={},
        //默认的统一错误处理函数 抛出异常让系统处理
        failHandler=function(e){
            if(e instanceof Error){
                throw e;
            }
            else {
                throw new Error(e);
            }
        },
        _flowline = {
            /**
             * 添加统一的错误处理函数
             * */
            fail: function (fn) {
                failHandler = fn;
                if(listening==2){
                    listening=0;
                    this.reject.apply(this,lastResult);
                }
            },
            /**
             * 执行后续流水线过程 并传递参数
             * */
            resolve: function () {
                if (ptr < _flowList.length) {
                    var flow = _flowList[ptr++],
                        ret;
                    if (flow && flow.done != undefined) {
                        if (typeof flow.done == "function") {
                            try{
                                ret = flow.done.apply(flow.bind || this,arguments);
                            }catch(e){
                                this.reject(e);
                            }
                            if(!flow.done._promise){
                                this.resolve.call(this,ret);
                            }
                        }
                        else {
                            this.resolve.call(this, flow.done);
                        }
                    }
                }
                else {
                    listening=1;
                    lastResult=Array.prototype.slice.call(arguments);
                }
            },
            /**
             * 不推荐使用 因为这个我用的少没测过。。。。
             * */
            resolveWith: function (withThis) {
                if (ptr < _flowList.length) {
                    var flow = _flowList[ptr++],
                        ret;
                    if (flow && flow.done != undefined) {

                        if (typeof flow.done == "function") {
                            var args = [this];
                            Array.prototype.push.apply(args, arguments);
                            try{
                                ret = flow.done.apply(withThis || flow.bind || this, args);
                            }catch(e){

                            }
                            if(!flow.done._promise){
                                this.resolveWith.call(this,withThis,ret);
                            }
                        }
                        else {
                            this.resolve.call(this, flow.done);
                        }
                    }
                }
                else{
                    listening=1;
                    lastResult=Array.prototype.slice.call(arguments);
                }
            },
            reject: function () {
                if (ptr < _flowList.length) {
                    var flow = _flowList[ptr++];
                    if (flow) {
                        if (typeof flow.fail == "function") {
                            flow.fail.apply(this,arguments);
                        }
                        else if (failHandler != undefined) {
                            failHandler.apply(this, arguments);
                        }
                    }
                }
                else if(failHandler!=undefined){
                    failHandler.apply(this, arguments);
                }
                else {
                    listening=2;
                    lastResult=Array.prototype.slice.call(arguments);
                }

            },
            /**
             * 恢复一个错误继续沿着流水线执行链走。待验证是否有应用场景
             * */
            resume: function () {
                ptr--;
                if (ptr < 0) {
                    ptr = 0;
                }
                this.resolve.apply(this, arguments);
            },
            /**
             * 添加后续的执行过程
             * @param done 前一步成功时执行函数
             * @param fail 前一步失败是执行函数
             * @param bind 执行函数时this的绑定对象
             * */
            then: function (done, fail, bind) {
                if (typeof done == "function") {
                    _flowList.push({done: done, fail: fail, bind: bind});
                }
                else {
                    _flowList.push({done: done});
                }
                if(listening==1){
                    listening=0;
                    this.resolve.apply(this,lastResult);
                }
                if(listening==2&&fail!=undefined){
                    listening=0;
                    this.reject.apply(this,lastResult);
                }
                return this;
            }


        };

    /**
     * 流水线主函数对象
     * 参数为任意个，将参数组装成流水线。另外如果流水线以一个普通同步函数开始 必须由该函数进行转换。
     * 如 function abc(){
     *     return 1+2;
     * }
     * Flowline(abc).then(...)...
     * */
    var Flowline = function () {
        var l=arguments.length;
        if(l>0){
            ptr=0;
            _flowline.length=0;
            for (var i = 0; i < arguments.length; i++) {
                _flowline.then(arguments[i]);
            }
            _flowline.resolve();
        }
        return _flowline;
    };
    /**
     * 此方法用来标示一个流水线函数并用来提供链式操作。
     * 标示形式是在函数结尾加入 return Flowline.promise();
     * */
    Flowline.promise = function () {
        arguments.callee.caller._promise=true;
        return _flowline;
    };
    /**
     * 用于执行流水线后续的过程函数
     * */
    Flowline.resolve = function () {
        _flowline.resolve.apply(_flowline, arguments);
    };
    /**
     * 用于上一步过程执行失败后调用后续定义的错误处理函数
     * */
    Flowline.reject = function () {
        _flowline.reject.apply(_flowline, arguments);
    };
    /**
     * 恢复错误，继续沿流水线执行后续过程
     * */
    Flowline.resume=function(){
        _flowline.resume.apply(_flowline,arguments);
    };

    /**
     * 在流水线函数中调用。表示本函数在after中设置的函数运行之后再运行。
     * @param fn 先决条件函数 即Flowline.after的调用者将会在fn运行后才运行。该函数会立即去
     * */
    Flowline.after=function(fn){
        var self=arguments.callee.caller;
        _flowList.splice(ptr,0,{done:fn},{done:self});
        _flowline.resolve.apply(_flowline, Array.prototype.slice.call(arguments,1));
    };
    Flowline.reset=function(){
        ptr=_flowList.length=0;
    }
    Flowline.set=function(name,value){
        _context[name]=value;
    }
    Flowline.get=function(name){
        return _context[name];
    }
    //暴露接口
    return Flowline;
}(window);
