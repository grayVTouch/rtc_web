(function(){
    "use strict";

    function RTC(option)
    {
        this._default = {
            url: 'ws://127.0.0.1:80' ,
            // ws 打开回调
            open: null ,
            // ws 收到消息回调
            message: null ,
            // ws 关闭回调
            close: null ,
            // ws 发生错误回调
            error: null ,
            // ws 重连成功回调
            reconnect: null ,
            // 项目标识符
            identifier: '' ,
            // 平台标识符
            // 支持的平台标识符有： app|web
            platform: '' ,
            // 调试模式
            debug: false ,
            // 用户身份认证问题
            token: null ,
            // 首次重连将会立即链接，接下去的每次链接都会等待给定的时间后进行重连
            // 单位：s
            interval: 1 ,
            // 重连状态
            // 维持心跳的时间: s
            intervalForPing: 1 ,

        };
        if (G.isUndefined(option)) {
            option = this._default;
        }
        this.connections = [];
        this.websocket = null;
        this.url = G.isValid(option.url) ? option.url : this._default.url;

        this.timer = {
            consumeFailQueue: null ,
            ping: null ,
        };
        this.intervalForPing = 5;
        this.pingRouterReg = /\/Heart\/ping/;
        // 失败的队列
        this.failQueue = [];
        // 当前消费的队列项目
        this.itemForQueue = {};
        // 回调函数列表
        this.callback = {};
        // 监听回调函数列表
        this.listen = {};
        // 是否第一次连接
        this.once = true;
        // 项目标识符
        this.identifier = G.isValid(option.identifier) ? option.identifier : this._default.identifier;
        this.platform = G.isValid(option.platform) ? option.platform : this._default.platform;
        this.debug = G.isValid(option.debug) ? option.debug : this._default.debug;
        this.token = G.isValid(option.token) ? option.token : this._default.token;
        // 首次连接时长
        this.onceReconnect = true;
        this.interval = G.isValid(option.interval) ? option.interval * 1000 : this._default.interval * 1000;
        // 模拟数据
        this.simulation = {
            // 调试模式
            debug: this.debug ? 'running' : '' ,
            // 模拟的用户
            user_id: 0
        };
        this.open = G.isFunction(option.open) ? option.open : this._default.open;
        this.message = G.isFunction(option.message) ? option.message : this._default.message;
        this.close = G.isFunction(option.close) ? option.close : this._default.close;
        this.error = G.isFunction(option.error) ? option.error : this._default.error;
        this.reconnect = G.isFunction(option.reconnect) ? option.reconnect : this._default.reconnect;
        // this.consumeTimer = null;

        // 运行程序
        this.run();
    }

    RTC.prototype = {

        // 建立连接
        connect () {
            this.websocket = new WebSocket(this.url);

            // 事件定义
            this.websocket.onopen = this.openEvent.bind(this);
            this.websocket.onmessage = this.messageEvent.bind(this);
            this.websocket.onclose = this.closeEvent.bind(this);
            this.websocket.onerror = this.errorEvent.bind(this);

            this.connections.push({
                websocket: this.websocket ,
                closed: false
            });
        } ,

        // 生成随机数
        genRequestId () {
            return G.randomArr(255 , 'mixed' , true);
        } ,

        findConnectionByWebSocket (websocket) {
            for (let i = 0; i < this.connections.length; ++i)
            {
                const cur = this.connections[i];
                if (cur.websocket == websocket) {
                    return cur;
                }
            }
            return false;
        } ,

        openEvent () {
            if (G.isFunction(this.open)) {
                this.open.call(this);
            }
            if (!this.once) {
                if (!window.navigator.onLine) {
                    return ;
                }
                // console.log('openEvent do it');
                this.consumeFailQueue();
                // 并非第一次打开
                // 将重连状态重置
                this.onceReconnect = true;
                if (G.isFunction(this.reconnect)) {
                    this.reconnect.call(this);
                }
            }
            this.once = false;
        } ,

        consumeFailQueue () {
            if (this.failQueue.length < 1) {
                return ;
            }
            const json = this.failQueue.shift();
            const data = G.jsonDecode(json);
            this.itemForQueue = data;
            this.reSend(json);
        } ,

        messageEvent (e) {
            let data = e.data;
            if (G.isFunction(this.message)) {
                this.message.call(this , data);
            }
            if (!G.isValid(data)) {
                console.log('messageEvent 接收到无效的服务端数据: ' . data);
                return ;
            }
            data = G.jsonDecode(data);
            let callback;
            switch(data.type)
            {
                case 'response':
                    callback = this.callback[data.request];
                    break;
                default:
                    callback = this.listen[data.type];
            }
            if (G.isFunction(callback)) {
                callback.call(this , data.data);
                if (data.type == 'response' && data.request == this.itemForQueue.request) {
                    // 如果是响应，检查是否是队列消费的响应
                    // 如果是队列消费的响应，则继续触发队列消费
                    // console.log('messageEvent ，执行的动作: response' , 'request: ' , data.request.substr(0 , 10));
                    // 等响应完成后再触发新的 ws 推送（这样才不会由于并发导致数据被破坏）
                    this.consumeFailQueue();
                }
            }
        } ,

        on (type , callback) {
            this.listen[type] = callback;
        } ,

        closeEvent (e) {
            // console.log('closeEvent' , e);
            console.log('websocket 已经断开，当前检测到的网络状态(onLine)：' , window.navigator.onLine , 'websocket ready state: ' + this.websocket.readyState);
            const websocket = e.currentTarget;
            const connection = this.findConnectionByWebSocket(websocket);
            if (connection != false) {
                if (connection.closed) {
                    console.log('该链接应该被关闭！');
                    return ;
                }
            }
            // 重置链接打开状态
            if (this.onceReconnect) {
                this.onceReconnect = false;
                // 重连
                // this.connect();
            }
            // } else {
            //     window.setTimeout(this.connect.bind(this) , this.interval);
            // }
            this.connect();
            if (G.isFunction(this.close)) {
                this.close.call(this);
            }
        } ,

        errorEvent (e) {
            // console.log('ws 发生错误' , e);
        } ,

        // ws 发送消息
        send (router , data , callback , isAddQueue) {
            isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
            const request = this.genRequestId();
            this.callback[request] = callback;
            data = G.isValid(data) ? data : {};
            data = {
                // 路由地址
                router ,
                // 项目标识符
                identifier: this.identifier ,
                // 平台标识符
                platform: this.platform ,
                // 请求
                request ,
                // 模拟的用户，如果开启了 debug 模式
                user_id: this.simulation.user_id ,
                // 调试模式
                debug: this.simulation.debug ,
                // 登录身份
                token: this.token ,
                // 发送的数据
                data ,
            };
            const json = G.jsonEncode(data);
            const dataForQueue = {
                callback ,
            };
            // console.log('websocket 连接状态' , this.websocket.readyState);
            // console.log('send 执行 websocket 消息发送，当前的 websocket 连接状态' , this.websocket.readyState , 'router' , router , 'onLine' , window.navigator.onLine);
            /**
             * websocket 相关状态
             * 0 connecting
             * 1 opened 已经建立连接并且可以通迅
             * 2 closing
             * 3 closed
             */
            console.log('失败的队列长度' , this.failQueue.length , '是否入列：' , isAddQueue , '当前执行的路由' , router);
            if (!this.pingRouterReg.test(router)) {
                if (!window.navigator.onLine || this.websocket.readyState != 1) {
                    if (isAddQueue) {
                        // 入队操作
                        this.failQueue.push(json);
                    }
                    if (!window.navigator.onLine) {
                        // 断线重连触发的前提条件
                        // 1. 断网
                        // 2. websocket 状态为已打开且允许通信
                        if (this.websocket.readyState == 1) {
                            this.websocket.close();
                        }
                    }
                    return request;
                }
            } else {
                if (!window.navigator.onLine) {
                    if (this.websocket.readyState == 1) {
                        console.log('有没有可能出现死循环 websocket ready state: ' + this.websocket.readyState);
                        this.websocket.close();
                    }
                    return request;
                }
                if (this.websocket.readyState != 1) {
                    return request;
                }
            }
            this.websocket.send(json);
            return request;
        } ,

        reSend (json) {
            if (!window.navigator.onLine || this.websocket.readyState != 1) {
                this.failQueue.push(json);
                return ;
            }
            // console.log('reSend ，当前的 websocket 连接状态' , this.websocket.readyState , '执行的动作' , G.jsonDecode(json).router);
            const data = G.jsonDecode(json);
            // console.log('reSend ，执行的动作' , data.router , 'request: ' , data.request.substr(0 , 10));
            this.websocket.send(json);
        } ,

        pingCheck () {
            try {
                if (this.stop) {
                    return ;
                }
                window.clearTimeout(this.timer.ping);
                this.ping(null , null , false);
                this.timer.ping = window.setTimeout(this.pingCheck.bind(this) , this.intervalForPing * 1000);
            } catch (e) {
                // console.log('ping 维持心跳发生错误' , e);
            }
        } ,

        stopPingCheck () {
            this.stop = true;
        } ,

        startPingCheck () {
            this.stop = false;
            this.pingCheck();
        } ,

        // 删除失败队列中的项
        delFailQueueByRequest (request) {
            for (let i = 0; i < this.failQueue.length; ++i)
            {
                let cur = this.failQueue[i];
                    cur = G.jsonDecode(cur);
                if (cur.request == request) {
                    this.failQueue.splice(i , 1);
                    console.log('删除的消息 request' , cur);
                    return true;
                }
            }
            return false;
        } ,

        defineEvent () {

        } ,

        // 登录二维码
        loginQRCode (data , callback , isAddQueue) {
            return this.send('/V1/Login/loginQRCode' , data , callback , isAddQueue);
        } ,

        // 登录二维码
        loginQRCodeForTest (data , callback , isAddQueue) {
            return this.send('/V1/Login/loginQRCodeForTest', data , callback , isAddQueue);
        } ,

        // 获取会话列表
        session (data , callback , isAddQueue) {
            return this.send('/V1/Session/session', data , callback , isAddQueue);
        } ,

        // 获取我的群组
        myGroup (data , callback , isAddQueue) {
            return this.send('/V1/Group/myGroup', data , callback , isAddQueue);
        } ,

        // 获取我的相关会话
        myFriend (data , callback , isAddQueue) {
            return this.send('/V1/Friend/myFriend', data , callback , isAddQueue);
        } ,

        // 查看自身用户信息
        self (data , callback , isAddQueue) {
            return this.send('/V1/User/self', data , callback , isAddQueue);
        } ,

        other (data , callback , isAddQueue) {
            return this.send('/V1/User/other', data , callback , isAddQueue);
        } ,

        historyForPrivate (data , callback , isAddQueue) {
            this.send('/V1/Message/history', data , callback , isAddQueue);
        } ,

        latestForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/lastest', data , callback , isAddQueue);
        } ,

        // 重置未读消息数量
        resetUnreadForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/resetUnread', data , callback , isAddQueue);
        } ,

        sendTextForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendTextForPrivate', data , callback , isAddQueue);
        } ,

        sendImageForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendImageForPrivate', data , callback , isAddQueue);
        } ,

        sendFileForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendFileForPrivate', data , callback , isAddQueue);
        } ,

        sendTextForGroup (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendTextForGroup', data , callback , isAddQueue);
        } ,

        sendImageForGroup (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendImageForGroup', data , callback , isAddQueue);
        } ,

        sendFileForGroup (data , callback , isAddQueue) {
            return this.send('/V1/Chat/sendFileForGroup', data , callback , isAddQueue);
        } ,

        resetUnreadForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/resetUnread', data , callback , isAddQueue);
        } ,

        historyForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/history', data , callback , isAddQueue);
        } ,

        latestForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/lastest', data , callback , isAddQueue);
        } ,

        myPush (data , callback , isAddQueue) {
            return this.send('/V1/Push/myPush', data , callback , isAddQueue);
        } ,


        latestForPush (data , callback , isAddQueue) {
            return this.send('/V1/Push/latest', data , callback , isAddQueue);
        } ,

        resetUnreadForPush (data , callback , isAddQueue) {
            return this.send('/V1/Push/resetUnread', data , callback , isAddQueue);
        } ,

        // 创建会话
        createOrUpdateSession (data , callback , isAddQueue) {
            return this.send('/V1/Session/createOrUpdate', data , callback , isAddQueue);
        } ,

        logout (data , callback , isAddQueue) {
            return this.send('/V1/User/logout', data , callback , isAddQueue);
        } ,

        groupMember (data , callback , isAddQueue) {
            return this.send('/V1/Group/groupMember', data , callback , isAddQueue);
        } ,

        createGroup (data , callback , isAddQueue) {
            return this.send('/V1/Group/create', data , callback , isAddQueue);
        } ,

        kickMember (data , callback , isAddQueue) {
            return this.send('/V1/Group/kickMember', data , callback , isAddQueue);
        } ,

        inviteJoinGroup (data , callback , isAddQueue) {
            return this.send('/V1/Group/inviteJoinGroup', data , callback , isAddQueue);
        } ,

        readedForBurn (data , callback , isAddQueue) {
            return this.send('/V1/Message/readedForBurn', data , callback , isAddQueue);
        } ,

        sessionProcess (data , callback , isAddQueue) {
            return this.send('/V1/Session/sessionProcess', data , callback , isAddQueue);
        } ,

        syncForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/sync', data , callback , isAddQueue);
        } ,

        syncForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/sync', data , callback , isAddQueue);
        } ,

        readedForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/readed', data , callback , isAddQueue);
        } ,

        readedForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/readed', data , callback , isAddQueue);
        } ,

        emptyPrivateHistory (data , callback , isAddQueue) {
            return this.send('/V1/Session/emptyPrivateHistory', data , callback , isAddQueue);
        } ,

        emptyGroupHistory (data , callback , isAddQueue) {
            return this.send('/V1/Session/emptyGroupHistory', data , callback , isAddQueue);
        } ,

        top (data , callback , isAddQueue) {
            return this.send('/V1/Session/top', data , callback , isAddQueue);
        } ,

        noticeForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Friend/canNotice', data , callback , isAddQueue);
        } ,

        noticeForGroup (data , callback , isAddQueue) {
            return this.send('/V1/Group/setCanNotice', data , callback , isAddQueue);
        } ,

        delSession (data , callback , isAddQueue) {
            return this.send('/V1/Session/delete', data , callback , isAddQueue);
        } ,

        delMessageForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/delete', data , callback , isAddQueue);
        } ,

        delMessageForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/delete', data , callback , isAddQueue);
        } ,

        withdrawMessageForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/withdraw', data , callback , isAddQueue);
        } ,

        withdrawMessageForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/withdraw', data , callback , isAddQueue);
        } ,

        forwardForPrivate (data , callback , isAddQueue) {
            return this.send('/V1/Message/serialForward', data , callback , isAddQueue);
        } ,

        forwardForGroup (data , callback , isAddQueue) {
            return this.send('/V1/GroupMessage/serialForward', data , callback , isAddQueue);
        } ,

        ping (data , callback , isAddQueue) {
            return this.send('/V1/Heart/ping', data , callback , isAddQueue);
        } ,

        run () {
            this.connect();
            this.pingCheck();
        } ,
    };

    window.RTC = RTC;
})();