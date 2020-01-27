(function(){
    "use strict";

    new Vue({
        el: '#app' ,
        data: {
            isBottom: {
                /**
                 * session_id: {isBottom: true , time: Date.now() , prevTime: null}
                 */
            } ,
            // 单位: ms
            isBottomDuration: 500 ,
            // 音频播放对象（语音消息）
            audioForVoice: {} ,
            val: {
                faceLayer: false ,
                // 系统功能展示
                showFunction: false ,
                // 搜索展示
                showSearch: false ,
                // 选项切换 session|relation
                tab: 'session' ,
                // 当前展示的聊天窗口
                // 是否显示成员（无论是私聊 | 还是群聊）
                member: 'hide' ,
                // 默认头像
                avatar: topContext.avatar ,
                groupAvatar: topContext.groupAvatar ,
                // 会话类型
                chat: ['private' , 'group'] ,
                // 群头像显示人数
                groupAvatarLimit: 4 ,
                // 当前显示的会话
                sessionId: '' ,
                // 新消息定时器
                timerForNew: null ,
                // 标题
                title: '' ,
                // 当前页面是否获取了焦点
                windowFocus: true ,
                // 不需要及逆行消息分组处理的消息类型
                denyGroupMessageType: ['notification' , 'withdraw'] ,

                // 系统公告的文本说明
                system: '系统公告' ,

                // 详情页的类型
                detailForType: '' ,

                // 是否展示用户信息
                showUserInfo: false ,

                timerForUserInfo: null ,

                // 添加会话弹层是否展示
                layerForGroup: false ,

                // 会话成员数量
                layerForGroupMember: false ,

                // 添加会话成员还是删除会话成员
                // add-添加 | del-删除
                operationModeForGroup: 'add' ,

                // 鼠标右键弹层
                layerForRightKeyInSession: false ,

                // 鼠标右键弹层
                layerForRightKeyInMessage: false ,

                // 转发弹层
                layerForForward: false ,
            } ,

            maxWidthForImageInMessage: 100 ,

            imageLoadedKey: {} ,

            // 文件事件注册
            imageUploadEventListen: {} ,
            fileUploadEventListen: {} ,

            ins: {
                rtc: null
            } ,

            // 请求状态
            pending: {} ,

            // 用户
            user: {} ,

            // 会话列表
            session: [] ,

            // 当前会话
            sessionForCur: {} ,

            // 私聊-聊天记录
            historyForPrivate: {
                // 1: {
                //     // 完整聊天记录
                //     history: [] ,
                //     // 按照时间进行分组后的数组
                //     historyForGroup: [] ,
                //     // 是否首次初始化数据
                //     once: true ,
                //     // 是否加载聊天记录中
                //     loading: false ,
                //     // 没有更多记录了
                //     noMoreForEarlier: false ,
                //     // 会话类型: private-私聊 group-群聊 system-系统公告
                //     type: 'private' ,
                //
                // } ,
            } ,

            // 群聊-聊天记录
            historyForGroup: {} ,

            // 系统-聊天记录
            historyForSystem: {} ,

            // 当前查看的用户详情
            detailForFriend: {
                alias: '' ,
                friend: {
                    nickname: '' ,
                } ,
            } ,

            // 当前查看的群详情
            detailForGroup: {
                group: {
                    member_avatar: [] ,
                }
            } ,

            // 相关会话
            relation: {
                // 群组
                group: [] ,
                // 好友（分组）
                friend: [] ,
                // 好友列表（分组）
                friendNoGroup: [] ,
            } ,

            dom: {} ,

            // 搜索结果
            search: {
                group: [] ,
                friend: [] ,
            } ,

            // 点击用户头像查看用户简略信息
            userInfo: {
                nickname: '' ,
            } ,

            // 用户成员
            memberForUser: {} ,
            // 群成员
            memberForGroup: {} ,

            // 创建群聊需要的表单数据
            formForGroup: {
                name: '' ,
                // 1-永久群 2-时效群
                type: 1 ,
                expire: "",
                // 匿名群？0-否 1-是
                anonymous: 0 ,
                // json 数组（选添）
                user_ids: ""
            } ,

            // 选中的用户
            selectedUserForLayer: [] ,

            // 搜索的层
            searchForLayer: [] ,
            // 复制的搜索层
            // 搜索的层
            copySearchForLayer: [] ,

            // 群组 by layer
            sessionForLayer: {
                group: {} ,
            } ,

            copySession: [],

            // 当前会话（会话列表项目右键功能）
            sessionForRightKeyLayer: {} ,

            // 当前选中的消息
            messageForRightKeyLayer: {} ,

            // 转发选中的列表(可以是 群 和 用户)
            selectedForForwardLayer: [] ,

            // 转发的列表（展示的列表）
            searchForForwardLayer: {
                // 最近聊天
                recent: [] ,
                // 群组
                group: [] ,
                // 好友
                friend: [] ,
            } ,
            // 转发的列表（展示的列表）
            copySearchForForwardLayer: {
                // 最近聊天
                recent: [] ,
                // 群组
                group: [] ,
                // 好友
                friend: [] ,
            } ,
        } ,

        mixins: [
            {
                data () {
                    return {
                        face: Face ,
                    };
                } ,
            } ,
        ] ,

        created () {

        } ,

        mounted () {
            this.run();
        },

        methods: {

            // 从群组中删除好友
            delFriendInLayer (friendId) {
                for (let i = 0 ; i < this.selectedUserForLayer.length; ++i)
                {
                    let cur = this.selectedUserForLayer[i];
                    if (cur.friend_id == friendId) {
                        cur.selected = false;
                        this.selectedUserForLayer.splice(i , 1);
                        return true;
                    }
                }
                return false;
            } ,

            // 初始化 ws
            initWebSocket () {
                const self = this;
                const token = G.session.get('token');
                // console.log("用户的登陆凭证: " , token);
                this.ins.rtc = new RTC({
                    url: topContext.websocket ,
                    identifier: topContext.identifier ,
                    platform: topContext.platform ,
                    // 获取用户的登录凭证
                    token ,
                    open () {
                        // ws 打开后进行初始化
                        self.initialize();
                        // console.log('websocket 连接成功');
                    } ,
                    // reconnect () {
                    //     console.log('断线重连成功');
                    //     // 重连后，重新初始化
                    //     // self.initialize();
                    // } ,
                });
            } ,

            // ws 方法调用的全局方法
            send (method , data , callback , isAddQueue) {
                // console.log('调用发送方法' + method);
                try {
                    return this.ins.rtc[method](data , (res) => {
                        if (res.code == 1000) {
                            // 用户认证失败，退出登录
                            this.logoutWithNoPermission();
                            return ;
                        }
                        if (G.isFunction(callback)) {
                            callback.call(this.ins.rtc , res);
                        }
                    } , isAddQueue);
                } catch (e) {
                    console.log(e);
                    callback.call(this.ins.rtc , {
                        code: 2000 ,
                        data: '方法执行错误'
                    });
                    return false;
                }
            } ,

            showFunction () {
                this.val.showFunction = true;
            } ,

            hideFunction () {
                this.val.showFunction = false;
            } ,

            // 项目初始化
            initialize () {
                const self = this;
                // 获取登录用户的信息
                this.send('self' , null , (res) => {
                    if (res.code != 200) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    self.user = res;
                } , false);

                this.val.title = document.title;

                // 获取会话列表
                this.getSession(null , false);
                this.myGroup(false);
                this.myFriend(false);

                this.ins.rtc.on('refresh_session' , this.getSession.bind(this));
                this.ins.rtc.on('private_message' , this.receiveMessageForPrivate.bind(this));
                this.ins.rtc.on('group_message' , this.receiveMessageForGroup.bind(this));
                this.ins.rtc.on('new' , this.newForListen.bind(this));
                this.ins.rtc.on('refresh_friend' , this.myFriend.bind(this));
                this.ins.rtc.on('refresh_group' , this.myGroup.bind(this));
                this.ins.rtc.on('refresh_group_member' , this.refreshGroupMember.bind(this));
                this.ins.rtc.on('refresh_private_message' , this.refreshPrivateMessage.bind(this));
                this.ins.rtc.on('refresh_group_message' , this.refreshGroupMessage.bind(this));
                this.ins.rtc.on('sync_private_session' , this.syncPrivateSession.bind(this));
                this.ins.rtc.on('sync_group_session' , this.syncGroupSession.bind(this));
                this.ins.rtc.on('delete_private_message_from_cache' , this.delMessageByTypeAndMessageIds.bind(this , 'private'));

                // 检查是否切换了某个会话
                // 如果已经切换了某个会话，那么加载最新的聊天记录
                switch (this.sessionForCur.type)
                {
                    case 'private':
                        this.syncHistoryBySessionId(this.sessionForCur.id , false , false);
                        this.newHistoryForPrivateBySessionId(this.sessionForCur.id , false);
                        break;
                    case 'group':
                        this.syncHistoryBySessionId(this.sessionForCur.id , false , false);
                        this.newHistoryForGroupBySessionId(this.sessionForCur.id , false);
                        break;
                    case 'system':
                        this.newHistoryForSystemBySessionId(this.sessionForCur.id , false);
                        break;
                    default:
                        // 待新增
                        break;
                }
            } ,

            syncPrivateSession (res) {
                console.log(res);
                const session = this.findSessionByTypeAndTargetId('private' , res);
                if (session === false) {
                    return ;
                }
                this.syncHistoryBySessionId(session.id , true);
            } ,

            syncGroupSession (res) {
                const session = this.findSessionByTypeAndTargetId('group' , res);
                if (session === false) {
                    return ;
                }
                this.syncHistoryBySessionId(session.id , true);
            } ,

            // 阅后即焚消息的同步删除
            delMessageByTypeAndMessageIds (type , messageIds) {
                const range = ['private' , 'group'];
                if (range.indexOf(type) < 0) {
                    console.warn('deleteMessageListener 提供的类型错误！');
                    return ;
                }
                let historyKey;
                switch (type)
                {
                    case 'private':
                        historyKey = 'historyForPrivate';
                        break;
                    case 'group':
                        historyKey = 'historyForGroup';
                        break;
                    default:
                        throw new Error('不支持的类型');
                }
                for (let k in this[historyKey])
                {
                    const item = this[historyKey][k];
                    // 删除原始消息记录
                    for (let n = 0; n < item.history.length; ++n)
                    {
                        const message = item.history[n];
                        if (messageIds.indexOf(message.id) >= 0) {
                            item.history.splice(n , 1);
                            n--;
                        }
                    }
                    // 删除消息分组 or 分组消息记录
                    for (let n = 0; n < item.historyForGroup.length; ++n)
                    {
                        const group = item.historyForGroup[n];
                        for (let m = 0; m < group.list.length; ++m)
                        {
                            const message = group.list[m];
                            if (messageIds.indexOf(message.id) >= 0) {
                                group.list.splice(m , 1);
                                m--;
                            }
                        }
                        if (group.list.length < 1) {
                            item.historyForGroup.splice(n , 1);
                            n--;
                        }
                    }
                }
            } ,

            imageLoadedEvent (e) {
                // const tar = G(e.currentTarget);
                // const sessionId = tar.data('sessionId');
                // const messageId = tar.data('messageId');
                // const session = this.findSessionById(sessionId);
                // const key = this.genImageLoadKey(session.type , messageId);
                // const scrollContainer = this.findHistoryScrollContainerBySessionId(session.id);
                // scrollContainer.bottom();
            } ,

            imageLoadStartEvent (e) {
                // const tar = G(e.currentTarget);
                // const sessionId = tar.data('sessionId');
                // const messageId = tar.data('messageId');
                // const session = this.findSessionById(sessionId);
                // const key = this.genImageLoadKey(session.type , messageId);
                // const scrollContainer = this.findHistoryScrollContainerBySessionId(session.id);
                // this.imageLoadedKey[key] = scrollContainer.isBottom();
            } ,

            genImageLoadKey (type , messageId) {
                return type + '_' + messageId;
            } ,


            refreshPrivateMessage (msg) {
                this.handleMessageForPrivate(msg);
                console.log("更新私聊消息" , msg.message , msg.id);
                const session = this.findSessionByTypeAndTargetId('private' , msg.chat_id);
                const history = this.findHistoryBySessionId(session.id);
                // 更新消息列表中的消息
                for (let i = 0; i < history.history.length; ++i)
                {
                    const message = history.history[i];
                    if (message.id == msg.id) {
                        history.history.splice(i , 1 , msg);
                        console.log('原消息列表更新了数据 index: ' + i , 'msgID: ' + msg.id , msg.message);
                        break;
                    }
                }
                // 历史记录分组
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    const group = history.historyForGroup[i];
                    // if (group.type == 'notification' && group.data.id == msg.id) {
                    //     const data = group[i].data;
                    //     group[i].data = Object.assign({} , data , msg);
                    //     break;
                    // }
                    if (group.type == 'message') {
                        for (let n = 0; n < group.list.length; ++n)
                        {
                            let message = group.list[n];
                            if (message.id == msg.id) {
                                // 删除旧数据
                                group.list.splice(n , 1 , msg);
                                break;
                            }
                        }
                    }
                }
            } ,

            refreshGroupMessage (msg) {
                this.handleMessageForGroup(msg);

                // console.log(msg.message , msg.);

                const session = this.findSessionByTypeAndTargetId('group' , msg.group_id);
                const history = this.findHistoryBySessionId(session.id);
                // 更新消息列表中的消息
                for (let i = 0; i < history.history.length; ++i)
                {
                    const message = history.history[i];
                    if (message.id == msg.id) {
                        history.history.splice(i , 1 , msg);
                        break;
                    }
                }
                // 历史记录分组
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    const group = history.historyForGroup[i];
                    // if (group.type == 'notification' && group.data.id == msg.id) {
                    //     group[i].data = Object.assign({} , msg);
                    //     break;
                    // }
                    if (group.type == 'message') {
                        for (let n = 0; n < group.list.length; ++n)
                        {
                            let message = group.list[n];
                            if (message.id == msg.id) {
                                // 删除旧数据
                                group.list.splice(n , 1 , msg);
                            }
                        }
                    }
                }
            } ,

            // 新消息
            newForListen () {
                window.setTimeout(this.val.timerForNew);
                let count = 1;
                const alert = () => {
                    if (this.val.windowFocus) {
                        document.title = this.val.title;
                        return ;
                    }
                    if (count++ % 2 > 0) {
                        document.title = this.val.title + ' 【新消息】';
                    } else {
                        document.title = this.val.title;
                    }
                    window.setTimeout(alert , 500);
                };
                alert();
                const audio = new Audio();
                audio.src = 'file/new.mp3';
                audio.play();
            } ,

            // 刷新群成员
            refreshGroupMember (res) {
                console.log(res);
            } ,

            getDescForPrivateBySenderAndMessageTypeAndMessage (sender , type , message) {
                switch (type)
                {
                    case 'text':
                        return message;
                    case 'image':
                        if (sender == this.user.id) {
                            return '[您发送了一张图片]';
                        }
                        return ['您收到了一张图片'];
                    case 'voice':
                        if (sender == this.user.id) {
                            return '[您发送了一条语音]';
                        }
                        return '[您收到了一条语音]';
                    case 'card':
                        if (sender == this.user.id) {
                            return '[您发送了一张个人名片]';
                        }
                        return '您收到了一张个人名片';
                    case 'file':
                        if (sender == this.user.id) {
                            return '[您发送了一个文件]';
                        }
                        return '您收到了一个文件';
                    case 'voice_call':
                        return '[语音通话]';
                    case 'video':
                        if (sender == this.user.id) {
                            return '[您发送了一个视频]';
                        }
                        return '您收到了一个视频';
                }
                return message;
            } ,

            getDescForGroupBySenderAndMessageTypeAndMessage (sender , type , message) {
                switch (type)
                {
                    case 'text':
                        return message;
                    case 'image':
                        if (sender == this.user.id) {
                            return '[您发送了一张图片]';
                        }
                        return ['群里收到了一张图片'];
                    case 'voice':
                        if (sender == this.user.id) {
                            return '[您发送了一条语音]';
                        }
                        return '[群里收到了一条语音]';
                    case 'card':
                        if (sender == this.user.id) {
                            return '[您发送了一张个人名片]';
                        }
                        return '群里收到了一张个人名片';
                    case 'file':
                        if (sender == this.user.id) {
                            return '[您发送了一个文件]';
                        }
                        return '群里收到了一个文件';
                    case 'voice_call':
                        return '[语音通话]';
                    case 'video':
                        if (sender == this.user.id) {
                            return '[您发送了一个视频]';
                        }
                        return '您收到了一个视频';
                }
                return message;
            } ,

            // 获取会话列表
            getSession (callback , isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                // 获取会话列表
                this.send('session' , null , (res) => {
                    if (res.code != 200) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    let existForCur = false;
                    // 数据处理
                    res.forEach((cur) => {
                        let history;
                        let member;
                        switch (cur.type)
                        {
                            case 'private':
                                cur.other = cur.other ? cur.other : {};
                                // 构成和好友一样的数据结构
                                cur.friend = cur.other;
                                cur.friend.alias = Pub.getFromNicknameAndUsername(cur.friend.nickname , cur.username);
                                this.handleFriend(cur.friend);
                                // 配套界面
                                history = 'historyForPrivate';
                                member = 'memberForUser';
                                if (cur.recent_message) {
                                    this.handleMessageForPrivate(cur.recent_message);
                                    // 消息处理
                                    if (cur.recent_message.flag == 'burn' && cur.recent_message.user_id != this.user.id && cur.recent_message.self_is_read == 0) {
                                        cur.recent_message.message = '[阅后即焚消息]';
                                    } else {
                                        cur.recent_message.message = this.getDescForPrivateBySenderAndMessageTypeAndMessage(cur.recent_message.user_id , cur.recent_message.type , cur.recent_message.message);
                                    }

                                }
                                break;
                            case 'group':
                                cur.group = cur.group ? cur.group : {};
                                this.handleGroup(cur.group);
                                history = 'historyForGroup';
                                member = 'memberForGroup';
                                if (cur.recent_message) {
                                    this.handleMessageForGroup(cur.recent_message);
                                    cur.recent_message.message = this.getDescForGroupBySenderAndMessageTypeAndMessage(cur.recent_message.user_id , cur.recent_message.type , cur.recent_message.message);
                                }
                                break;
                            case 'system':
                                history = 'historyForSystem';
                                if (cur.recent) {
                                    // 系统公告处理
                                    this.handleMessageForSystem(cur.recent);
                                }
                                break;
                        }
                        // console.log('数据测试' , history , cur.id , G.isUndefined(this[history][cur.id]));
                        if (G.isUndefined(this[history][cur.id])) {
                            // 如果不清楚为什么要这么做
                            // 请查看 vue 深入响应式原理一章节
                            // 这边做一点简要解释：
                            // 给data中已有属性新增属性的时候，vue 是无法检测到更新的
                            // 所以必须要通过 Object.assign 的方式来触发响应式
                            const mergeObj = {};
                            mergeObj[cur.id] = {
                                // 聊天记录
                                history: [] ,
                                // 聊天记录-按照时间间隔进行分组
                                historyForGroup: [] ,
                                // 是否首次初始化数据
                                once: true ,
                                // 是否加载聊天记录中
                                loading: false ,
                                // 没有更多记录了
                                noMoreForEarlier: false ,
                                // 会话类型
                                type: cur.type ,
                                // 会话 id
                                sessionId: cur.id ,
                            };
                            this[history] = Object.assign({} , this[history] , mergeObj);
                        }

                        if (['private' , 'group'].indexOf(cur.type) >= 0 && G.isUndefined(this[member][cur.id])) {
                            // 如果不清楚为什么要这么做
                            // 请查看 vue 深入响应式原理一章节
                            // 这边做一点简要解释：
                            // 给data中已有属性新增属性的时候，vue 是无法检测到更新的
                            // 所以必须要通过 Object.assign 的方式来触发响应式
                            const mergeObj = {};
                            mergeObj[cur.id] = {
                                // 聊天记录
                                once: cur.type == 'private' ? false : true ,
                                // 是否加载聊天记录中
                                noMore: cur.type == 'private' ? true : false ,
                                // 数据列表
                                list: [] ,
                            };
                            this[member] = Object.assign({} , this[member] , mergeObj);
                        }

                        // 复制会话
                        if (!this.existInCopySessionBySessionId(cur.id)) {
                            this.copySession.push(cur);
                        } else {
                            this.updateInCopySessionBySessionIdAndSession(cur.id , cur);
                        }

                        if (cur.id == this.sessionForCur.id) {
                            existForCur = true;
                        }
                    });
                    if (!existForCur) {
                        this.sessionForCur = {};
                    }
                    this.session = res;
                    // this.searchForForwardLayer.recent = res;
                    // this.selectedForForwardLayer = res;
                    this.$nextTick(() => {
                        if (G.isFunction(callback)) {
                            callback();
                        }
                    });
                } , isAddQueue);
            } ,

            // 检查是否存在
            existInCopySessionBySessionId (sessionId) {
                for (let i = 0; i < this.copySession.length; ++i)
                {
                    let cur = this.copySession[i];
                    if (cur.id == sessionId) {
                        return true;
                    }
                }
                return false;
            } ,

            handleGroup (group) {
                group.group = group.group ? group.group : {};
                group.user = group.user ? group.user : {};
                group.selected = false;
            } ,

            updateInCopySessionBySessionIdAndSession (sessionId , session) {
                for (let i = 0; i < this.copySession.length; ++i)
                {
                    let cur = this.copySession[i];
                    if (cur.id == sessionId) {
                        this.copySession.splice(i , 1 , session);
                        return true;
                    }
                }
                return false;
            } ,


            myGroup (isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                this.send('myGroup' , null , (res) => {
                    if (res.code != 200) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    res.forEach((v) => {
                        this.handleGroup(v);
                    });
                    this.relation.group = res;
                    // todo 测试阶段增加的
                    // this.searchForForwardLayer.group = res;
                } , isAddQueue);
            } ,

            handleFriend (user) {
                user.friend = user.friend ? user.friend : {};
                user.user = user.user ? user.user : {};
                user.selected = false;
                if (!G.isValid(user.alias)) {
                    user.alias = Pub.getFromNicknameAndUsername(user.friend.nickname , user.friend.username);
                }
                user.letter = PinYin.isChinese(user.alias[0]) ?
                    PinYin.getPinYin(user.alias[0] , '' , true)[0] :
                    user.alias[0].toUpperCase();

            } ,

            myFriend (isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                this.send('myFriend' , null , (res) => {
                    if (res.code != 200) {
                        return ;
                    }
                    res = res.data;
                    const friends = [];
                    const unknow = [];
                    let findListByLetter = (letter) => {
                        for (let i = 0; i < friends.length; ++i)
                        {
                            let cur = friends[i];
                            if (cur.group == letter) {
                                return cur.list;
                            }
                        }
                        return false;
                    };
                    for (let i = 0; i < res.length; ++i)
                    {
                        const cur = res[i];
                        this.handleFriend(cur);
                        if (!G.isValid(cur.alias)) {
                            unknow.push(cur);
                            continue ;
                        }
                        this.handleFriend(cur);
                        let list = findListByLetter(cur.letter);
                        if (list === false) {
                            list = [];
                            friends.push({
                                group: cur.letter ,
                                list ,
                            });
                        }
                        list.push(cur);
                    }
                    if (unknow.length > 0) {
                        friends.push({
                            group: '未知' ,
                            list: unknow
                        });
                    }
                    friends.sort((a , b) => {
                        if (a.group == b.group) {
                            return 0;
                        }
                        return a.group > b.group ? 1 : -1;
                    });
                    this.relation.friend = friends;
                    this.relation.friendNoGroup = res;

                    // todo 测试阶段增加
                    // this.searchForForwardLayer.friend = friends;
                } , isAddQueue);
            } ,


            defineEvent () {
                const win = G(window);
                // 定义窗口事件
                win.on('click' , this.hideFunction.bind(this));
                win.on('click' , this.hideMember.bind(this));
                win.on('focus' , () => {
                    this.val.windowFocus = true;
                });
                win.on('blur' , () => {
                    this.val.windowFocus = false;
                });
                win.on('click' , this.hideSearch.bind(this));
                win.on('click' , this.hideUserInfo.bind(this));
                // win.on('click' , this.hideLayerForGroup.bind(this));
                win.on('click' , this.hideFaceLayer.bind(this));
                win.on('mousedown' , this.hideLayerForRightKeyInSession.bind(this));
                win.on('mousedown' , this.hideLayerForRightKeyInMessage.bind(this));

                document.oncontextmenu = () => { return false; };

            } ,

            addFaceEvent (e) {
                const tar = G(e.currentTarget);
                const name = tar.data('name');
                const text = tar.data('text');
                const inputDom = G(this.$refs['input_' + this.sessionForCur.id]);
                const image = G(new Image());
                image.attr('src' , 'file/face/' + name + '.png');
                image.data('text' , text);
                image.addClass(['image' , 'face']);
                // 让光标获取焦点
                // inputDom.origin('focus');
                inputDom.append(image.get(0));
                // const cursorPoint = G.getCursorPointForContentEditableElement(inputDom.get(0));
                // if (cursorPoint.node.parentNode != inputDom.get(0)) {
                //     // 不支持的元素
                //     console.log('父级容器元素并非输入框' , cursorPoint.node.parentNode , cursorPoint.node);
                //
                //     G.setCursorPointForContentEditableElement(inputDom.get(0) , 'last');
                //     return ;
                // }
                // // 获取光标所在容器的子节点
                // const nodes = inputDom.native('childNodes');
                // const range = G.getSelectionForContentEditableElement(inputDom.get(0));
                // console.log('range' , range);
                // console.log(nodes);
                //     // console.log('nodes: ' , nodes , 'nodes.length: ' + nodes.length , 'endOffset: ' + range.endOffset , 'nodes[endOffset]: ' , nodes[range.endOffset] , 'cursorPoint.node' ,  cursorPoint.node);
                // // nodes[Math.max(range.endOffset] =
                // // 获取光标所在位置
                // inputDom.origin('insertBefore' , image.get(0) , cursorPoint.node);
            } ,

            faceLayerEvent (e) {
                const tar = G(e.currentTarget);
                const faceLayer = G(this.$refs['face-layer']);
                const topVal = tar.getWindowOffsetVal('top');
                const leftVal = tar.getWindowOffsetVal('left');

                const tarW = tar.width();
                const width = 470;
                const height = 230 + 8 + 2;
                // console.log('leftVal' + leftVal , 'topVal' + topVal);
                faceLayer.css({
                    // 具体计算方式，待会请仔细重新考虑
                    left: leftVal - 20 - 8 + tarW / 2  + 'px' ,
                    top: topVal - height + 'px' ,
                });
                // 定位
                if (this.val.faceLayer) {
                    this.hideFaceLayer();
                } else {
                    this.showFaceLayer();
                }
            } ,

            showFaceLayer () {
                this.val.faceLayer = true;
            } ,

            hideFaceLayer () {
                this.val.faceLayer = false;
            } ,

            switchMemberEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                switch (session.type)
                {
                    case 'private':
                        const memberForUser = {};
                        memberForUser[session.id] = {
                            once: false ,
                            noMore: true ,
                            list: [session.other]
                        };
                        this.memberForUser = Object.assign({} , this.memberForUser , memberForUser);
                        break;
                    case 'group':
                        this.getGroupMemberBySessionIdAndGroupId(session.id , session.target_id);
                        break;
                }
                if (this.val.member == 'show') {
                    this.hideMember();
                } else {
                    this.showMember();
                }
                // 获取成员数据
            } ,

            getGroupMemberBySessionIdAndGroupId (sessionId , groupId) {
                if (this.pending.getGroupMember) {
                    console.log('请求中...请耐心等待');
                    return ;
                }
                let member = this.memberForGroup[sessionId];
                if (!G.isValid(member)) {
                    member = {
                        once: true ,
                        noMore: false ,
                        list: [] ,
                    };
                    const memberForGroup = {};
                    memberForGroup[sessionId] = member;
                    this.memberForGroup = Object.assign({} , this.memberForGroup , memberForGroup);
                }
                if (member.noMore) {
                    // 没有更多成员数据
                    return ;
                }
                this.pending.getGroupMember = true;
                this.send('groupMember' , {
                    group_id: groupId ,
                    once: member.once ? 1 : 0 ,
                    limit_id: member.list.length > 0 ? member.list[member.list.length - 1].id : 0 ,
                    limit: topContext.groupMemberLimit ,
                } , (res) => {
                    member.once = false;
                    this.pending.getGroupMember = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    res = res.data;
                    res.forEach((v) => {
                        this.handleGroupMember(v);
                    });
                    if (res.length < 1) {
                        member.noMore = true;
                        return ;
                    }
                    member.list = member.list.concat(res);
                    // console.log('拼接数据' , member.list);
                });
            } ,

            handleGroupMember (member) {
                member.user = member.user ? member.user : {};
                member.group = member.group ? member.group : {};
                member.letter = PinYin.isChinese(member.alias[0]) ?
                    PinYin.getPinYin(member.alias[0] , '' , true)[0] :
                    member.alias[0].toUpperCase();
            } ,

            // 滚动事件
            scrollEventForUser (e) {
                console.log('滚动到底部！');
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                let member;
                switch (session.type)
                {
                    case 'group':
                        member = this.memberForGroup[sessionId];
                        break;
                    default:
                        // 暂不支持的类型
                        return ;
                }
                if (member.noMore) {
                    // 已经没有更多数据了！
                    return ;
                }
                const scrollHeight = tar.scrollHeight();
                const clientH = tar.height('content-box');
                if (clientH >= scrollHeight) {
                    // 没有滚动条
                    return ;
                }
                // 检查是否已经到底部了
                if (!tar.isBottom()) {
                    // 还未到底部
                    return ;
                }
                this.getGroupMemberBySessionIdAndGroupId(session.id , session.target_id);
            } ,

            // 显示成员
            showMember () {
                this.val.member = 'show';
            } ,

            hideMember () {
                this.val.member = 'hide';
            } ,

            logout () {
                if (this.pending.logout) {
                    layer.msg('请求中...请耐心等待');
                    return ;
                }
                this.pending.logout = true;
                const layerIndex = Pub.loading();
                this.send('logout' , null , (res) => {
                    layer.close(layerIndex);
                    this.pending.logout = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    this.logoutWithNoPermission();
                    console.log('logout success');
                });
            } ,

            logoutWithNoPermission () {
                G.session.del('user_id');
                G.session.del('token');
                window.location.href = 'login.html';
            } ,

            showSearch () {
                this.val.showSearch = true;
            } ,

            hideSearch () {
                this.val.showSearch = false;
            } ,

            findSessionById (sessionId) {
                for (let i = 0; i < this.session.length; ++i)
                {
                    let cur = this.session[i];
                    if (cur.id == sessionId) {
                        return cur;
                    }
                }
                throw new Error("未找到 id = " + sessionId + "对应的 session");
            } ,

            // 切换会话
            switchSessionEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('id');
                this.switchSessionById(sessionId)
            } ,

            // 设置私聊未读消息数量
            resetUnreadForPrivateBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                this.send('resetUnreadForPrivate' , {
                    friend_id: session.other.id ,
                });
            } ,

            resetUnreadForGroupBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                this.send('resetUnreadForGroup' , {
                    group_id: session.target_id ,
                });
            } ,

            resetUnreadForSystem () {
                this.send('resetUnreadForPush' , {
                    type: 'system' ,
                });
            } ,

            // 加入会话
            sessionProcessByTypeAndTargetIdAndAction (type , targetId , status) {
                const range = ['join' , 'leave'];
                if (range.indexOf(status) < 0) {
                    throw new Error("不支持的动作类型");
                }
                this.send('sessionProcess' , {
                    type ,
                    target_id: targetId ,
                    status ,
                });
            } ,

            // 重置未读消息数量
            resetUnreadBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                switch (session.type)
                {
                    case 'private':
                        this.resetUnreadForPrivateBySessionId(sessionId);
                        break;
                    case 'group':
                        this.resetUnreadForGroupBySessionId(sessionId);
                        break;
                    case 'system':
                        this.resetUnreadForSystem();
                        break;
                    default:
                        // 待补充
                        break;
                }
            } ,

            // 数据同步
            syncHistoryBySessionId (sessionId , clearAll , isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                const session = this.findSessionById(sessionId);
                const history = this.findHistoryBySessionId(sessionId);
                const idList = history.history.map((v) => {
                    return v.id;
                });
                let scrollContainer = this.findHistoryScrollContainerBySessionId(session.id);
                    scrollContainer = G(scrollContainer);
                const isBottom = scrollContainer.isBottom();
                // console.log(idList);
                const callback = (res) => {
                    if (res.code != topContext.successCode) {
                        console.warn('会话数据同步失败' , res.data);
                        return ;
                    }
                    res = res.data;
                    res.forEach((msg) => {
                        switch (session.type)
                        {
                            case 'private':
                                this.handleMessageForPrivate(msg);
                                break;
                            case 'group':
                                this.handleMessageForGroup(msg);
                                break;
                            case 'system':
                                this.handleMessageForSystem(msg);
                                break;
                        }
                    });
                    const find = (messageId) => {
                        for (let i = 0; i < res.length; ++i)
                        {
                            let cur = res[i];
                            if (cur.id == messageId) {
                                return cur;
                            }
                        }
                        return false;
                    };
                    // 同步 history
                    for (let i = 0; i < history.history.length; ++i)
                    {
                        const message = history.history[i];
                        const findRes = find(message.id);
                        if (findRes === false) {
                            history.history.splice(i , 1);
                            i--;
                            continue ;
                        }
                        history.history.splice(i , 1 , findRes);
                    }
                    for (let i = 0; i < history.historyForGroup.length; ++i)
                    {
                        const group = history.historyForGroup[i];
                        for (let n = 0; n < group.list.length; ++n)
                        {
                            let message = group.list[n];
                            if (!clearAll && message.isTemp) {
                                // 不是清除所有数据的时候
                                // 跳过临时数据
                                continue ;
                            }
                            const findRes = find(message.id);
                            if (findRes === false) {
                                // 服务端消息已经删除，同步删除本地展示的消息
                                group.list.splice(n , 1);
                                n--;
                                continue ;
                            }
                            // 更新现有消息
                            group.list.splice(n , 1 , findRes);
                        }
                        if (group.list.length > 0) {
                            continue ;
                        }
                        history.historyForGroup.splice(i , 1);
                        i--;
                    }
                    this.$nextTick(() => {
                        if (isBottom) {
                            scrollContainer.bottom();
                        }
                    });

                };
                switch (session.type)
                {
                    case 'private':
                        this.send('syncForPrivate' , {
                            id_list: G.jsonEncode(idList)
                        } , callback , isAddQueue);
                        break;
                    case 'group':
                        this.send('syncForGroup' , {
                            id_list: G.jsonEncode(idList)
                        } ,  callback , isAddQueue);
                        break;
                }
            } ,

            switchSessionById (sessionId , scrollIntoView) {
                scrollIntoView = G.isBoolean(scrollIntoView) ? scrollIntoView : false;
                const session = this.findSessionById(sessionId);
                this.session.forEach((v) => {
                    v.focus = v.id == sessionId;
                });
                this.val.tab = 'session';
                /**
                 * ******************
                 * 加入|离开 会话
                 * ******************
                 */
                if (!G.isUndefined(this.sessionForCur.type) && !G.isUndefined(this.sessionForCur.target_id)) {
                    // 离开上一个会话
                    if (['private' , 'group'].indexOf(this.sessionForCur.type) >= 0) {
                        this.sessionProcessByTypeAndTargetIdAndAction(this.sessionForCur.type , this.sessionForCur.target_id , 'leave');
                    }
                }
                if (['private' , 'group'].indexOf(session.type) >= 0 && this.sessionForCur.id != session.id) {
                    // 加入新会话
                    this.sessionProcessByTypeAndTargetIdAndAction(session.type , session.target_id , 'join')
                }

                /**
                 * *********************
                 * 数据同步
                 * *********************
                 */
                this.syncHistoryBySessionId(session.id);
                this.sessionForCur = session;
                if (scrollIntoView) {
                    // 是否滚动到可视区域
                    this.$nextTick(() => {
                        const sessionDom = G(this.$refs['session']);
                        let conScrollH = sessionDom.scrollHeight();
                        let conH = sessionDom.height();
                        if (conScrollH <= conH) {
                            // 先判断是否产生了滚动条
                            return ;
                        }
                        const curSessionDom = G(this.$refs['session_' + session.id]);
                        const prevSiblings = curSessionDom.prevSiblings();
                        const sessionH = curSessionDom.getTH();
                        let sumH = sessionH * prevSiblings.length;
                        sessionDom.vScroll(300 , sumH);
                    });
                }
                // todo 加入会话 | 离开会话 ，这样才能避免受到推送
                this.resetUnreadBySessionId(sessionId);
                const history = this.findHistoryBySessionId(sessionId);
                if (history.once) {
                    // 初始化数据
                    switch (session.type)
                    {
                        case 'private':
                            // 同步新消息
                            this.oldHistoryForPrivate(sessionId);
                            break;
                        case 'group':
                            this.oldHistoryForGroup(sessionId);
                            break;
                        case 'system':
                            this.oldHistoryForSystem(sessionId);
                            break;
                        default:
                            break;
                    }
                } else {
                    // 同步新数据
                    switch (session.type)
                    {
                        case 'private':
                            // 同步新消息
                            this.newHistoryForPrivateBySessionId(sessionId);
                            break;
                        case 'group':
                            this.newHistoryForGroupBySessionId(sessionId);
                            break;
                        case 'system':
                            this.newHistoryForSystemBySessionId(sessionId);
                        default:
                            break;
                    }
                }
            } ,

            // 新增通知类型的消息分组到私聊消息分组
            addNotificationMessageBySessionIdAndMsgAndPos (sessionId , msg , pos) {
                const history = this.findHistoryBySessionId(sessionId);
                const posRange = ['unshift' , 'push'];
                pos = posRange.indexOf(pos) >= 0 ? pos : 'push';
                history.history[pos](msg);
                history.historyForGroup[pos]({
                    id: this.genId() ,
                    type: 'notification' ,
                    data: msg ,
                });
                return history;
            } ,

            addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage (sessionId , msg , isAddHistory , posForGroup , posForMessage) {
                const history = this.findHistoryBySessionId(sessionId);
                const posForGroupRange = ['unshift' , 'push'];
                const posForMessageRange = ['unshift' , 'push'];
                posForGroup = posForGroupRange.indexOf(posForGroup) >= 0 ? posForGroup : 'push';
                posForMessage = posForMessageRange.indexOf(posForMessage) >= 0 ? posForMessage : 'push';
                isAddHistory = G.isBoolean(isAddHistory) ? isAddHistory : true;
                if (isAddHistory) {
                    // 更具消息追加的方向，就可以确定在完整的消息里面是如何追加的
                    history.history[posForMessage](msg);
                }
                let historyForGroup = this.findHistoryForGroupBySessionIdAndTypeAndAttr(sessionId , 'message' , msg.format_time);
                if (historyForGroup === false) {
                    historyForGroup = {
                        id: this.genId() ,
                        type: 'message' ,
                        attr: msg.format_time ,
                        list: [] ,
                    };
                    history.historyForGroup[posForGroup](historyForGroup);
                }
                historyForGroup.list[posForMessage](msg);
                return history;
            } ,

            addTempMessageBySessionIdAndMsg (sessionId , msg) {
                const history = this.findHistoryBySessionId(sessionId);
                let historyForGroup;
                if (history.historyForGroup.length < 1) {
                    historyForGroup = {
                        id: this.genId() ,
                        temp: true ,
                        type: 'message' ,
                        attr: msg.format_time ,
                        list: [] ,
                    };
                    history.historyForGroup.push(historyForGroup);
                } else {
                    historyForGroup = history.historyForGroup[history.historyForGroup.length - 1];
                }
                historyForGroup.list.push(msg);
                return history;
            } ,

            // 加载更多历史聊天记录
            oldHistoryForPrivate (sessionId) {
                const session = this.findSessionById(sessionId);
                const history = this.historyForPrivate[sessionId];
                if (history.noMoreForEarlier) {
                    // 没有更多数据了
                    return ;
                }
                // 获取当时的滚动高度
                if (this.pending.oldHistoryForPrivate) {
                    console.log('oldHistoryForPrivate 请求中...请耐心等待');
                    return ;
                }
                if (this.pending.renderForOldHistoryForPrivate) {
                    console.log('oldHistoryForPrivate dom 渲染中...请耐心等待');
                    return ;
                }
                // 等待 dom 更新渲染完成后
                const message = G(this.$refs['message_in_for_history_' + sessionId]);
                let messageScrollHeight = message.scrollHeight();
                const messageHeight = message.height();
                let scrollLeftYAmount = 0;
                if (messageScrollHeight > messageHeight) {
                    const scrollYMaxAmount = messageScrollHeight - messageHeight;
                    // 存在滚动条
                    scrollLeftYAmount = scrollYMaxAmount - message.scrollTop();
                }
                this.pending.oldHistoryForPrivate = true;
                this.pending.renderForOldHistoryForPrivate = true;
                history.loading = true;
                this.send('historyForPrivate' , {
                    friend_id: session.other.id ,
                    limit_id: history.once ?
                        0 :
                        (history.history.length > 0 ?
                            history.history[0].id :
                            0
                        ) ,
                    limit: topContext.limit ,
                } , (res) => {
                    this.pending.oldHistoryForPrivate = false;
                    history.loading = false;
                    // 私聊-历史记录
                    if (res.code != 200) {
                        console.log(res.data);
                        this.pending.renderForOldHistoryForPrivate = false;
                        return ;
                    }
                    history.once = false;
                    res = res.data;
                    // res.reverse();
                    if (res.length == 0) {
                        // 没有更多数据了
                        history.noMoreForEarlier = true;
                        console.log(sessionId + '; 没有更多数据了');
                        this.pending.renderForOldHistoryForPrivate = false;
                        return ;
                    }
                    res.forEach((msg) => {
                        if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                            // 检查消息是否已经存在，如果存在则不要添加
                            return ;
                        }
                        // 消息处理
                        this.handleMessageForPrivate(msg);
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'unshift' , 'unshift');
                    });
                    this.$nextTick(() => {
                        this.pending.renderForOldHistoryForPrivate = false;
                        // 滚动到底部
                        messageScrollHeight = message.scrollHeight();
                        const messageYMaxAmount = messageScrollHeight - messageHeight;
                        const amount = messageYMaxAmount - scrollLeftYAmount;
                        message.vScroll(0 , amount);
                    });
                });
            } ,

            oldHistoryForGroup (sessionId) {
                const session = this.findSessionById(sessionId);
                const history = this.historyForGroup[sessionId];
                if (history.noMoreForEarlier) {
                    // 没有更多数据了
                    return ;
                }
                // 获取当时的滚动高度
                if (this.pending.oldHistoryForGroup) {
                    console.log('oldHistoryForGroup 请求中...请耐心等待');
                    return ;
                }
                if (this.pending.renderForOldHistoryForGroup) {
                    console.log('oldHistoryForGroup dom 渲染中...请耐心等待');
                }
                // 等待 dom 更新渲染完成后
                const message = G(this.$refs['message_in_for_history_' + sessionId]);
                let messageScrollHeight = message.scrollHeight();
                const messageHeight = message.height();
                let scrollYAmount = 0;
                if (messageScrollHeight > messageHeight) {
                    // 存在滚动条
                    scrollYAmount = messageScrollHeight - message.scrollTop();
                }
                this.pending.oldHistoryForGroup = true;
                this.pending.renderForOldHistoryForGroup = true;
                history.loading = true;
                this.send('historyForGroup' , {
                    group_id: session.target_id ,
                    limit_id: history.once ? 0 : history.history[0].id ,
                    limit: topContext.limit ,
                } , (res) => {
                    this.pending.oldHistoryForGroup = false;
                    history.loading = false;
                    // 私聊-历史记录
                    if (res.code != 200) {
                        console.log(res.data);
                        this.pending.renderForOldHistoryForGroup = false;
                        return ;
                    }
                    history.once = false;
                    res = res.data;
                    console.log("数据长度" , res.length);
                    // res.reverse();
                    if (res.length == 0) {
                        // 没有更多数据了
                        history.noMoreForEarlier = true;
                        this.pending.renderForOldHistoryForGroup = false;
                        console.log(sessionId + '; 没有更多数据了');
                        return ;
                    }
                    res.forEach((msg) => {
                        if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                            // 消息已经存在，跳过
                            return ;
                        }
                        // 消息处理
                        this.handleMessageForGroup(msg);
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'unshift' , 'unshift');
                    });
                    this.$nextTick(() => {
                        this.pending.renderForOldHistoryForGroup = false;
                        // 滚动到底部
                        messageScrollHeight = message.scrollHeight();
                        const amount = messageScrollHeight - scrollYAmount;
                        // let height
                        message.vScroll(0 , amount);
                    });
                });
            } ,

            oldHistoryForSystem (sessionId) {
                const session = this.findSessionById(sessionId);
                const history = this.findHistoryBySessionId(sessionId);
                if (history.noMoreForEarlier) {
                    // 没有更多数据了
                    return ;
                }
                // 获取当时的滚动高度
                if (this.pending.oldHistoryForSystem) {
                    console.log('oldHistoryForSystem 请求中...请耐心等待');
                    return ;
                }
                if (this.pending.renderForOldHistoryForSystem) {
                    console.log('oldHistoryForGroup dom 渲染中...请耐心等待');
                }
                // 等待 dom 更新渲染完成后
                const message = G(this.$refs['message_in_for_history_' + sessionId]);
                let messageScrollHeight = message.scrollHeight();
                const messageHeight = message.height();
                let scrollYAmount = 0;
                if (messageScrollHeight > messageHeight) {
                    // 存在滚动条
                    scrollYAmount = messageScrollHeight - message.scrollTop();
                }
                this.pending.renderForOldHistoryForSystem = true;
                this.pending.oldHistoryForSystem = true;
                history.loading = true;
                this.send('myPush' , {
                    type: 'system' ,
                    limit_id: history.once ? 0 : history.history[0].id ,
                    limit: topContext.limit ,
                } , (res) => {
                    this.pending.oldHistoryForSystem = false;
                    history.loading = false;
                    // 私聊-历史记录
                    if (res.code != 200) {
                        console.log(res.data);
                        this.pending.renderForOldHistoryForSystem = false;
                        return ;
                    }
                    history.once = false;
                    res = res.data;
                    console.log("数据长度" , res.length);
                    if (res.length == 0) {
                        // 没有更多数据了
                        history.noMoreForEarlier = true;
                        this.pending.renderForOldHistoryForSystem = false;
                        console.log(sessionId + '; 没有更多数据了');
                        return ;
                    }
                    res.forEach((msg) => {
                        this.handleMessageForSystem(msg);
                        // 这个地方会做两个操作：
                        // 第一：检查分组是否存在，如果分组不存在，那么会创建分组
                        // 第二：将消息插入到分组的首部
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'unshift' , 'unshift');
                    });
                    this.$nextTick(() => {
                        this.pending.renderForOldHistoryForSystem = false;
                        // 滚动到底部
                        messageScrollHeight = message.scrollHeight();
                        const amount = messageScrollHeight - scrollYAmount;
                        // let height
                        message.vScroll(0 , amount);
                    });
                });
            } ,

            // 在现有的消息分组里面查找是否存在给定type 和  attr 的分组
            findHistoryForGroupBySessionIdAndTypeAndAttr (sessionId , type , attr) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    let cur = history.historyForGroup[i];
                    if (cur.type == type && cur.attr == attr) {
                        return cur;
                    }
                }
                return false;
            } ,

            // 私聊消息处理
            handleMessageForPrivate (msg) {
                msg.message = Pub.dec(msg.old < 1 , msg.message , msg.aes_key);
                msg.user = msg.user ? msg.user : {};
                msg.user.avatar = G.isValid(msg.user.avatar) ? msg.user.avatar + '?time=' + (new Date().getTime()) : '';
                msg.user_for_card = msg.user_for_card ? msg.user_for_card : {};
                msg.format_time = Pub.timestampDiffWithNow(msg.create_time);
                switch (msg.type)
                {
                    case 'text':
                        // 解析表情 和 连接
                        msg.message = Pub.textToHtmlForMessage(msg.message);
                        break;
                    case 'image':
                        msg.extra = msg.extra ? msg.extra : window.encodeURI(G.jsonEncode({width: 0 , height: 0}));
                        msg.extra = window.decodeURI(msg.extra);
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.clientW = msg.extra.width > this.maxWidthForImageInMessage ? this.maxWidthForImageInMessage : msg.extra.width;
                        msg.extra.clientH = msg.extra.clientW / msg.extra.width * msg.extra.height;

                        break;
                    case 'voice_call':
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.format_time = Pub.formatTimeForVoiceCall(msg.extra.duration);
                        break;
                    case 'file':
                        msg.extra = msg.extra ? msg.extra : window.encodeURI(G.jsonEncode({name: '' , size: ''}));
                        msg.extra = window.decodeURI(msg.extra);
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.size = Pub.sizeConvert(msg.extra.size);
                        break;
                    case 'video':
                        msg.message = '[暂不支持视频消息，请在手机上查看]';
                        break;
                }
            } ,

            handleMessageForGroup (msg) {
                msg.message = Pub.dec(msg.old < 1 , msg.message , msg.aes_key);
                msg.user = msg.user ? msg.user : {};
                msg.group = msg.group ? msg.group : {};
                msg.user_for_card = msg.user_for_card ? msg.user_for_card : {};
                msg.format_time = Pub.timestampDiffWithNow(msg.create_time);
                switch (msg.type)
                {
                    case 'text':
                        msg.message = Pub.textToHtmlForMessage(msg.message);
                        break;
                    case 'image':
                        msg.extra = window.decodeURI(msg.extra);
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.clientW = msg.extra.width > this.maxWidthForImageInMessage ? this.maxWidthForImageInMessage : msg.extra.width;
                        msg.extra.clientH = msg.extra.clientW / msg.extra.width * msg.extra.height;
                        break;
                    case 'voice_call':
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.format_time = Pub.formatTimeForVoiceCall(msg.extra.duration);
                        break;
                    case 'file':
                        msg.extra = window.decodeURI(msg.extra);
                        msg.extra = G.jsonDecode(msg.extra);
                        msg.extra.size = Pub.sizeConvert(msg.extra.size);
                        break;
                    case 'video':
                        msg.message = '[暂不支持视频消息，请在手机上查看]';
                        break;
                }
            } ,

            handleMessageForSystem (msg) {
                // 推送内容
                msg.origin_content = msg.content;
                msg.content = Pub.textToHtmlForMessage(msg.content);
                msg.format_time = Pub.timestampDiffWithNow(msg.create_time);
            } ,

            // 消息双向撤回
            withdrawBoth (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                switch (session.type)
                {
                    case 'private':
                        this.withdrawBothForPrivateBySessionId(sessionId);
                        break;
                    case 'group':
                        this.withdrawBothForGroupBySessionId(sessionId);
                        break;
                }

            } ,

            withdrawBothForPrivateBySessionId (sessionId) {
                const withdrawBoth = () => {
                    if (this.pending.withdrawBothForPrivateBySessionId) {
                        layer.alert('请求中...请耐心等待');
                        return ;
                    }
                    this.pending.withdrawBothForPrivateBySessionId = true;
                    const layerIndex = Pub.loading();
                    const session = this.findSessionById(sessionId);
                    this.send('emptyPrivateHistory' , {
                        chat_id: session.target_id
                    } ,  (res) => {
                        this.pending.withdrawBothForPrivateBySessionId = false;
                        layer.close(layerIndex);
                        if (res.code != 200) {
                            layer.alert(res.data);
                            return ;
                        }
                        layer.alert('双向撤回成功');
                    });
                };
                // 先咨询下用户是否支持
                layer.alert('您确定要双向撤回所有的消息吗' , {
                    btn: ['确定' , '取消'] ,
                    btn1 () {
                        withdrawBoth();
                    } ,
                });
            } ,

            withdrawBothForGroupBySessionId (sessionId) {
                const withdrawBoth = () => {
                    if (this.pending.withdrawBothForGroupBySessionId) {
                        layer.alert('请求中...请耐心等待');
                        return ;
                    }
                    this.pending.withdrawBothForGroupBySessionId = true;
                    const layerIndex = Pub.loading();
                    const session = this.findSessionById(sessionId);
                    this.send('emptyGroupHistory' , {
                        group_id: session.target_id
                    } ,  (res) => {
                        this.pending.withdrawBothForGroupBySessionId = false;
                        layer.close(layerIndex);
                        if (res.code != 200) {
                            // console.log('不支持的消息' , res.data);
                            layer.alert(res.data);
                            return ;
                        }
                        layer.alert('双向撤回成功');
                    });
                };
                // 先咨询下用户是否支持
                layer.alert('您确定要双向撤回自己的消息吗' , {
                    btn: ['确定' , '取消'] ,
                    btn1 () {
                        withdrawBoth();
                    } ,
                });
            } ,

            // 设置初始化转发的相关列表
            initDataForForward () {
                this.selectedForForwardLayer = [];
                this.searchForForwardLayer.recent = this.session.filter((v) => {
                    if (['private' , 'group'].indexOf(v.type) < 0) {
                        return false;
                    }
                    switch (v.type)
                    {
                        case 'private':
                            v.friend.selected = false;
                            break;
                        case 'group':
                            v.group.selected = false;
                            break;
                    }
                    return true;
                });
                this.searchForForwardLayer.group = this.relation.group.map((v) => {
                    v.selected = false;
                    return v;
                });
                this.searchForForwardLayer.friend = this.relation.friend.map((v) => {
                    v.selected = false;
                    return v;
                });

                this.copySearchForForwardLayer.recent = this.session.map((v) => {
                    return v;
                });
                this.copySearchForForwardLayer.group = this.relation.group.map((v) => {
                    return v;
                });
                this.copySearchForForwardLayer.friend = this.relation.friend.map((v) => {
                    return v;
                });
            } ,

            // 转发消息
            forwardMessage (e) {
                if (this.messageForRightKeyLayer.isTemp) {
                    layer.alert('临时消息不支持转发');
                    return ;
                }
                const tar = G(e.currentTarget);
                this.initDataForForward();
                // 显示转发弹层
                this.showLayerForForward();
            } ,
            
            // 获取记录滚动元素容器
            findHistoryScrollContainerBySessionId (sessionId) {
                return this.$refs['message_in_for_history_' + sessionId];
            } ,

            findSessionByTypeAndTargetId (type , targetId) {
                for (let i = 0; i < this.session.length; ++i)
                {
                    const cur = this.session[i];
                    if (cur.type == type && cur.target_id == targetId) {
                        return cur;
                    }
                }
                return false;
            } ,

            // 私聊同步新消息
            newHistoryForPrivateBySessionId (sessionId , isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                if (this.pending.newHistoryForPrivateBySessionId) {
                    return ;
                }
                const session = this.findSessionById(sessionId);
                const history = this.historyForPrivate[sessionId];
                this.pending.newHistoryForPrivateBySessionId = true;
                const scrollContainer = G(this.findHistoryScrollContainerBySessionId(sessionId));
                const isBottom = scrollContainer.isBottom();
                this.send('latestForPrivate' , {
                    friend_id: session.other.id ,
                    limit_id:  history.history.length == 0 ? 0 : history.history[history.history.length - 1].id
                } , (res) => {
                    this.pending.newHistoryForPrivateBySessionId = false;
                    if (res.code != topContext.successCode) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    if (res.length == 0) {
                        return ;
                    }
                    res.reverse();
                    res.forEach((msg) => {
                        if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                            // 消息已经存在，跳过
                            return ;
                        }
                        this.handleMessageForPrivate(msg);
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'push' , 'push');
                    });
                    this.$nextTick(() => {
                        if (!isBottom) {
                            return ;
                        }
                        scrollContainer.bottom();
                    });
                } , isAddQueue);
            } ,

            // 私聊同步新消息
            newHistoryForGroupBySessionId (sessionId , isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                if (this.pending.newHistoryForGroupBySessionId) {
                    return ;
                }
                const session = this.findSessionById(sessionId);
                const history = this.findGroupHistoryBySessionId(sessionId);
                this.pending.newHistoryForGroupBySessionId = true;
                const scrollContainer = G(this.findHistoryScrollContainerBySessionId(sessionId));
                const isBottom = scrollContainer.isBottom();
                this.send('latestForGroup' , {
                    group_id: session.target_id ,
                    limit_id:  history.history.length == 0 ? 0 : history.history[history.history.length - 1].id
                } , (res) => {
                    this.pending.newHistoryForGroupBySessionId = false;
                    if (res.code != topContext.successCode) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    if (res.length == 0) {
                        return ;
                    }
                    res.reverse();
                    res.forEach((msg) => {
                        if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                            // 消息已经存在，跳过
                            return ;
                        }
                        this.handleMessageForGroup(msg);
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'push' , 'push');
                    });
                    this.$nextTick(() => {
                        if (!isBottom) {
                            return ;
                        }
                        scrollContainer.bottom();
                    });
                } , isAddQueue);
            } ,

            // 系统公告同步新消息
            newHistoryForSystemBySessionId (sessionId , isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                if (this.pending.newHistoryForSystemBySessionId) {
                    return ;
                }
                const session = this.findSessionById(sessionId);
                const history = this.findHistoryBySessionId(sessionId);
                this.pending.newHistoryForSystemBySessionId = true;
                const scrollContainer = G(this.findHistoryScrollContainerBySessionId(sessionId));
                const isBottom = scrollContainer.isBottom();
                this.send('latestForPush' , {
                    type: 'system' ,
                    limit_id:  history.history.length == 0 ? 0 : history.history[history.history.length - 1].id
                } , (res) => {
                    this.pending.newHistoryForSystemBySessionId = false;
                    if (res.code != topContext.successCode) {
                        console.log(res.data);
                        return ;
                    }
                    res = res.data;
                    if (res.length == 0) {
                        return ;
                    }
                    res.reverse();
                    res.forEach((msg) => {
                        if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                            // 消息已经存在，跳过
                            return ;
                        }
                        this.handleMessageForGroup(msg);
                        this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'push' , 'push');
                    });
                    this.$nextTick(() => {
                        if (!isBottom) {
                            return ;
                        }
                        scrollContainer.bottom();
                    });
                } , isAddQueue);
            } ,

            // 检查私聊消息是否存在
            messageExistBySessionIdAndMsgId (sessionId , msgId) {
                const session = this.findHistoryBySessionId(sessionId);
                if (session === false) {
                    return false;
                }
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0; i < history.history.length; ++i)
                {
                    const cur = history.history[i];
                    if (cur.id == msgId) {
                        return true;
                    }
                }
                return false;
            } ,

            receiveMessageForPrivate (msg) {
                const receive = () => {
                    const session = this.findSessionByTypeAndTargetId('private' , msg.chat_id);
                    if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                        // 消息已经存在
                        return ;
                    }
                    const history = this.findHistoryBySessionId(session.id);
                    const scrollContainer = G(this.findHistoryScrollContainerBySessionId(session.id));
                    if (session.id == this.sessionForCur.id) {
                        // 重置未读消息数量
                        this.resetUnreadForPrivateBySessionId(session.id);
                    }
                    this.handleMessageForPrivate(msg);
                    if (G.isUndefined(this.isBottom[session.id])) {
                        this.isBottom[session.id] = {
                            isBottom: scrollContainer.isBottom() ,
                            time: Date.now() ,
                            prevTime: null
                        };
                    }
                    const bottom = this.isBottom[session.id];
                    const time   = Date.now();
                    const duration = time - bottom.time;
                    if (duration > this.isBottomDuration) {
                        bottom.isBottom = scrollContainer.isBottom();
                        bottom.prevTime = bottom.time;
                    }
                    bottom.time = time;
                    // console.log('prevTime' , bottom.prevTime , 'time' , bottom.time , 'isBottom' , bottom.isBottom , 'duration: ' + duration);
                    // console.log('receive message isBottom' , isBottom);
                    this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'push' , 'push');
                    this.$nextTick(() => {
                        if (bottom.isBottom) {
                            scrollContainer.bottom();
                        }
                    });
                };
                const session = this.findSessionByTypeAndTargetId('private' , msg.chat_id);
                if (session === false) {
                    // 会话不存在,创建
                    return this.createOrUpdateSession('private' , msg.chat_id , () => {
                        this.getSession(() => {
                            receive();
                        });
                    });
                }
                receive();
            } ,

            receiveMessageForGroup (msg) {
                const receive = () => {
                    let session = this.findSessionByTypeAndTargetId('group' , msg.group_id);
                    // 判断消息是否已经存在
                    console.log('消息是否已经存在; type: ' + session.type + '; msg_id: ' + msg.id , this.messageExistBySessionIdAndMsgId(session.id , msg.id));

                    if (this.messageExistBySessionIdAndMsgId(session.id , msg.id)) {
                        // 消息已经存在
                        return ;
                    }
                    const history = this.findHistoryBySessionId(session.id);
                    const scrollContainer = G(this.findHistoryScrollContainerBySessionId(session.id));
                    if (session.id == this.sessionForCur.id) {
                        // 重置未读消息数量
                        this.resetUnreadForGroupBySessionId(session.id);
                    }
                    this.handleMessageForGroup(msg);
                    if (G.isUndefined(this.isBottom[session.id])) {
                        this.isBottom[session.id] = {
                            isBottom: scrollContainer.isBottom() ,
                            time: Date.now()
                        };
                    }
                    const bottom = this.isBottom[session.id];
                    const time   = Date.now();
                    const duration = time - bottom.time;
                    if (duration > this.isBottomDuration) {
                        bottom.isBottom = scrollContainer.isBottom();
                        bottom.prevTime = bottom.time;
                    }
                    bottom.time = time;
                    this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , msg , true , 'push' , 'push');
                    this.$nextTick(() => {
                        if (bottom.isBottom) {
                            scrollContainer.bottom();
                        }
                    });
                };
                let session = this.findSessionByTypeAndTargetId('group' , msg.group_id);
                if (session === false) {
                    // 会话不存在,创建
                    return this.createOrUpdateSession('group' ,  msg.group_id , () => {
                        // 手动刷新
                        this.getSession(() => {
                            receive();
                        });
                    });
                }
                receive();
            } ,

            // 找到聊天记录对话框
            findPrivateHistoryBySessionId (sessionId) {
                return this.historyForPrivate[sessionId];
            } ,

            findGroupHistoryBySessionId (sessionId) {
                return this.historyForGroup[sessionId];
            } ,

            findSystemHistoryBySessionId (sessionId) {
                return this.historyForSystem[sessionId];
            } ,

            openImageEvent (e) {
                const tar = G(e.currentTarget);
                window.open(tar.attr('src') , '_blank');
            } ,

            findHistoryBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                switch (session.type)
                {
                    case 'private':
                        return this.findPrivateHistoryBySessionId(sessionId);
                    case 'group':
                        return this.findGroupHistoryBySessionId(sessionId);
                    case 'system':
                        return this.findSystemHistoryBySessionId(sessionId);
                    default:
                        // 带扩展
                }
            } ,

            // 历史聊天记录-滚动事件
            scrollEventForHistory (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const history = this.findHistoryBySessionId(sessionId);
                if (history.noMoreForEarlier) {
                    return ;
                }
                if (!tar.isTop(80)) {
                    return ;
                }
                this.loadHistoryBySessionId(sessionId);
            } ,

            // 加载历史聊天记录
            loadHistoryBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                switch (session.type)
                {
                    case 'private':
                        this.oldHistoryForPrivate(sessionId);
                        break;
                    case 'group':
                        this.oldHistoryForGroup(sessionId);
                        break;
                    case 'system':
                        break;
                }
            } ,

            // 搜索
            searchEvent (e) {
                const tar = G(e.currentTarget);
                const val = tar.val();
                if (val.length > 0) {
                    this.showSearch();
                    this.searchInLocal(val);
                } else {
                    this.hideSearch();
                }
            } ,

            searchInLocal (val) {
                this.search.friend = [];
                this.search.group = [];
                this.relation.friend.forEach((v) => {
                    v.list.forEach((v1) => {
                        if (
                            v1.alias.indexOf(val) >= 0 ||
                            v1.friend.nickname.indexOf(val) >= 0 ||
                            v1.friend.username.indexOf(val) >= 0
                        ) {
                            this.search.friend.push(v1);
                        }
                    })
                });
                this.relation.group.forEach((v) => {
                    if (v.group.name.indexOf(val) >= 0) {
                        this.search.group.push(v);
                    }
                });
            } ,

            // 生成唯一id
            genId () {
                return G.randomArr(64 , 'mixed' , true);
            } ,

            isBottomForHistoryBySessionId (sessionId) {
                const scrollContainer = G(this.findHistoryScrollContainerBySessionId(sessionId));
                return scrollContainer.isBottom();
            } ,

            bottomForHistoryBySessionId (sessionId) {
                const scrollContainer = G(this.findHistoryScrollContainerBySessionId(sessionId));
                scrollContainer.bottom();
            } ,

            // 删除消息记录分组
            delGroupBySessionIdAndHistoryForGroupId (sessionId , historyForGroupId) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    let cur = history.historyForGroup[i];
                    if (cur.id == historyForGroupId) {
                        history.historyForGroup.splice(i , 1);
                        return true;
                    }
                }
                return false;
            } ,

            updateMessageBySessionIdAndMessageIdAndMsg (sessionId , messageId , msg) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0 ; i < history.historyForGroup.length; ++i)
                {
                    let cur = history.historyForGroup[i];
                    if (cur.type != 'message') {
                        continue ;
                    }
                    for (let n = 0; n < cur.list.length; ++n)
                    {
                        let _msg = cur.list[n];
                        if (_msg.id == messageId) {
                            if (cur.attr != _msg.format_time) {
                                // 不同分组，删掉
                                // 重建分组
                                cur.list.splice(n , 1);
                                this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(sessionId , msg , true , 'push' , 'push');
                            } else {
                                // 相同分组，更新
                                cur.list.splice(n , 1 , msg);
                            }
                            this.$nextTick(() => {
                                this.bottomForHistoryBySessionId(sessionId);
                            });
                            return true;
                        }
                    }
                }
                // 更新失败
                return false;
            } ,

            updateTempMessageBySessionIdAndMessageIdAndMsg (sessionId , messageId , msg) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0 ; i < history.historyForGroup.length; ++i)
                {
                    let cur = history.historyForGroup[i];
                    if (cur.type != 'message') {
                        continue ;
                    }
                    for (let n = 0; n < cur.list.length; ++n)
                    {
                        let _msg = cur.list[n];
                        if (_msg.id == messageId) {
                            cur.list.splice(n , 1 , msg);
                            this.$nextTick(() => {
                                this.bottomForHistoryBySessionId(sessionId);
                            });
                            return true;
                        }
                    }
                }
                // 更新失败
                return false;
            } ,

            inputKeyUpEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                this.sendBySessionId(sessionId);
            } ,

            sendBySessionId (sessionId) {
                const inputDom = G(this.$refs['input_' + sessionId]);
                const session = this.findSessionById(sessionId);
                const text = inputDom.html();
                if (text.length < 1) {
                    layer.tips("请输入内容" , inputDom.get(0) , {
                        tips: [1, '#3595CC'] ,
                    });
                    return ;
                }
                // 过滤掉 html 中的换行字符

                switch (session.type)
                {
                    case 'private':
                        this.sendTextForPrivateBySessionId(sessionId);
                        break;
                    case 'group':
                        this.sendTextForGroupBySessionId(sessionId);
                        break;
                    case 'system':
                        break;
                }
            },

            // 私聊发送文本消息
            sendTextForPrivateBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                const inputDom = G(this.$refs['input_' + sessionId]);
                const html = inputDom.html();
                let text = Pub.htmlToTextForMessage(html);
                    text = Pub.stripTags(text);
                const encText = Pub.enc(true , text , this.user.aes_key);
                // const isBottom = this.isBottomForHistoryBySessionId(sessionId);
                const messageId = this.genId();
                // console.log(messageId);
                const tmpMsg = {
                    id: messageId ,
                    user_id: this.user.id ,
                    user: {
                        avatar: this.user.avatar ,
                    } ,
                    message: text ,
                    type: 'text' ,
                    loading: true ,
                    isTemp: true ,
                    request: '' ,
                    create_time: G.getCurTimeData(true) ,
                };
                this.handleMessageForPrivate(tmpMsg);
                // session.recent_message = Object.assign({} , Object.assign({} , tmpMsg));
                // session.recent_message.message = this.getDescForPrivateBySenderAndMessageTypeAndMessage(this.user.id , tmpMsg.type , tmpMsg.message);
                // const history = this.addTempMessageBySessionIdAndMsg(session.id , tmpMsg);
                const history = this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , tmpMsg , false , 'push' , 'push');
                this.$nextTick(() => {
                    this.bottomForHistoryBySessionId(sessionId);
                });
                tmpMsg.request = this.send('sendTextForPrivate' , {
                    friend_id: session.other.id ,
                    message: encText ,
                    old: 0 ,
                    create_time: tmpMsg.create_time ,
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        // console.log(res.data);
                        tmpMsg.loading = false;
                        tmpMsg.error = res.data;
                        msg = tmpMsg;
                    } else {
                        msg = res.data;
                        this.handleMessageForPrivate(msg);
                    }
                    console.log(res.code);
                    let update;
                    // 消息更新
                    if (res.code != 2000) {
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        // 网络掉线
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }
                    console.log('更新结果：' , update);
                });

                inputDom.html('');
            } ,

            fileUploadEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                const fileType = tar.data('fileType');
                const listenKey = fileType + 'UploadEventListen';
                const fileDom = G(this.$refs[fileType + '_for_upload_' + session.id]);

                //  调用原始的点击事件
                fileDom.origin('click');

                // 事件注册
                if (!this[listenKey][sessionId]) {
                    // 已经注册事件，更新事件注册
                    this[listenKey][sessionId] = true;
                    // 如果未注册事件，那么注册事件
                    fileDom.on('change' , (res) => {
                        const file = fileDom.get(0);
                        const files = file.files;
                        if (files.length < 1) {
                            // 没有选择文件，不要理会
                            return ;
                        }
                        for (let i = 0; i < files.length; ++i)
                        {
                            const curFile = files[i];
                            const formData = new FormData();
                            formData.append('file' , curFile);

                            switch (fileType)
                            {
                                case 'image':
                                    // 图片文件
                                    G.getBlobUrl(curFile , (res) => {
                                        G.getImage(res , (info) => {
                                            const messageId = this.sendTempImageBySessionIdAndImageAndInfo(sessionId , info.url , {
                                                width: info.width ,
                                                height: info.height ,
                                            });
                                            // 文件上传到亚马逊云存储
                                            Pub.fileUpload(formData , (res) => {
                                                if (res.code != 0) {
                                                    this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                        error: res.data ,
                                                    });
                                                    return ;
                                                }
                                                res = res.data;
                                                this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                    file: res
                                                });
                                                switch (session.type)
                                                {
                                                    case 'private':
                                                        this.sendImageForPrivateBySessionIdAndMessageId(sessionId , messageId);
                                                        break;
                                                    case 'group':
                                                        this.sendImageForGroupBySessionIdAndMessageId(sessionId , messageId);
                                                        break;
                                                    default:
                                                        throw new Error('不支持的文件类型');
                                                }
                                            } , null , (e) => {
                                                if (!e.lengthComputable) {
                                                    return ;
                                                }
                                                let percent = e.loaded / e.total;
                                                percent *= 100;
                                                percent = percent.toFixed(0);

                                                this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                    progress: percent + '%' ,
                                                });
                                            } , (res) => {
                                                // console.log('文件上传完成' , res);
                                            });
                                        });
                                    });
                                    break;
                                case 'file':
                                    G.getBlobUrl(curFile , (res) => {
                                        // 普通文件
                                        const messageId = this.sendTempFileBySessionIdAndFileAndInfo(sessionId , res , {
                                            name: curFile.name ,
                                            size: curFile.size
                                        });
                                        // 文件上传到亚马逊云存储
                                        Pub.fileUpload(formData , (res) => {
                                            if (res.code != 0) {
                                                this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                    error: res.data ,
                                                });
                                                return ;
                                            }
                                            res = res.data;
                                            this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                file: res
                                            });
                                            switch (session.type)
                                            {
                                                case 'private':
                                                    this.sendFileForPrivateBySessionIdAndMessageId(sessionId , messageId);
                                                    break;
                                                case 'group':
                                                    this.sendFileForGroupBySessionIdAndMessageId(sessionId , messageId);
                                                    break;
                                                default:
                                                    throw new Error('不支持的文件类型');
                                            }
                                        } , null , (e) => {
                                            let percent = e.loaded / e.total;
                                            percent *= 100;
                                            percent = percent.toFixed(2);
                                            this.updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge(sessionId , messageId , {
                                                progress: percent + '%' ,
                                            });
                                        } , (res) => {
                                            // console.log('文件上传完成' , res);
                                        });
                                    });
                                    break;
                                default:
                                    break;
                            }
                        }
                    });
                }
            } ,

            // 更新分组消息
            updateMessageInMessageGroupBySessionIdAndMessageIdAndMesasge (sessionId , messageId , newMessage) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    const groups = history.historyForGroup[i];
                    for (let n = 0; n < groups.list.length; ++n)
                    {
                        const message = groups.list[n];
                        if (message.id == messageId) {
                            groups.list.splice(n , 1 , Object.assign({} , message , newMessage));
                            return false;
                        }
                    }
                }
                return false;
            } ,

            // 私聊|群聊 -- 发送临时图片
            sendTempImageBySessionIdAndImageAndInfo (sessionId , image , info) {
                const session = this.findSessionById(sessionId);
                const messageId = this.genId();
                // console.log(messageId);
                const tmpMsg = {
                    id: messageId ,
                    user_id: this.user.id ,
                    user: {
                        avatar: this.user.avatar ,
                    } ,
                    message: image ,
                    file: '' ,
                    type: 'image' ,
                    loading: false ,
                    isTemp: true ,
                    extra: window.encodeURI(G.jsonEncode(info)) ,
                    // 上传进度
                    progress: '0%' ,
                    showUploadMask: true ,
                    request: '' ,
                    create_time: G.getCurTimeData(true) ,
                };
                switch (session.type)
                {
                    case 'private':
                        this.handleMessageForPrivate(tmpMsg);
                        break;
                    case 'group':
                        this.handleMessageForGroup(tmpMsg);
                        break;
                }
                this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , tmpMsg , false , 'push' , 'push');
                this.$nextTick(() => {
                    // this.bottomForHistoryBySessionId(sessionId);
                    // 注册图片加载完成后事
                    const image = G(this.$refs['image_' + sessionId + '_' + messageId]);
                    image.on('load' , () => {
                        // 滚动到最底部
                        this.bottomForHistoryBySessionId(sessionId);
                    });
                });
                return messageId;
            } ,

            // 私聊|群聊 -- 发送临时文件
            sendTempFileBySessionIdAndFileAndInfo (sessionId , file , info) {
                const session = this.findSessionById(sessionId);
                const messageId = this.genId();
                const tmpMsg = {
                    id: messageId ,
                    user_id: this.user.id ,
                    user: {
                        avatar: this.user.avatar ,
                    } ,
                    message: file ,
                    file: '' ,
                    type: 'file' ,
                    loading: false ,
                    isTemp: true ,
                    extra: window.encodeURI(G.jsonEncode(info)) ,
                    // 上传进度
                    progress: '0%' ,
                    showUploadMask: true ,
                    request: '' ,
                    create_time: G.getCurTimeData(true) ,
                };
                switch (session.type)
                {
                    case 'private':
                        this.handleMessageForPrivate(tmpMsg);
                        break;
                    case 'group':
                        this.handleMessageForGroup(tmpMsg);
                        break;
                }
                this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , tmpMsg , false , 'push' , 'push');
                this.$nextTick(() => {
                    this.bottomForHistoryBySessionId(sessionId);
                });
                return messageId;
            } ,

            // 私聊-发送图片
            sendImageForPrivateBySessionIdAndMessageId (sessionId , messageId) {
                const session = this.findSessionById(sessionId);
                const message = this.findMessageInMessageGroupBySessionIdAndMessageId(sessionId , messageId);
                // console.log(G.jsonDecode(G.jsonEncode(message)));
                console.log('亚马逊云存储的 地址: ' , message.file);
                const encMessage = Pub.enc(true , message.file , this.user.aes_key);
                const extra = window.encodeURI(G.jsonEncode({
                    width: message.extra.width ,
                    height: message.extra.height
                }));
                message.request = this.send('sendImageForPrivate' , {
                    friend_id: session.other.id ,
                    message: encMessage ,
                    old: 0 ,
                    extra: extra ,
                    create_time: message.create_time ,
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        message.error = res.data;
                        msg = message;
                    } else {
                        msg = res.data;
                        this.handleMessageForPrivate(msg);
                        msg.message = message.message;
                        // console.log('文件替换' , message.message);
                    }
                    let update;
                    // 消息更新
                    if (res.code != 2000) {
                        // 网络掉线
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }

                    console.log('更新结果：' , update);
                });
            } ,

            // 群聊-发送图片
            sendImageForGroupBySessionIdAndMessageId (sessionId , messageId) {
                const session = this.findSessionById(sessionId);
                const message = this.findMessageInMessageGroupBySessionIdAndMessageId(sessionId , messageId);
                const encMessage = Pub.enc(true , message.file , this.user.aes_key);
                const extra = window.encodeURI(G.jsonEncode({
                    width: message.extra.width ,
                    height: message.extra.height
                }));
                message.request = this.send('sendImageForGroup' , {
                    group_id: session.target_id ,
                    message: encMessage ,
                    old: 0 ,
                    extra: extra ,
                    create_time: message.create_time ,
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        message.error = res.data;
                        msg = message;
                    } else {
                        msg = res.data;
                        this.handleMessageForGroup(msg);
                        msg.message = message.message;
                    }
                    let update;
                    // 消息更新
                    if (res.code != 2000) {
                        // 网络掉线
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }
                    console.log('更新结果：' , update);
                });
            } ,

            // 私聊-发送文件
            sendFileForPrivateBySessionIdAndMessageId (sessionId , messageId) {
                const session = this.findSessionById(sessionId);
                const message = this.findMessageInMessageGroupBySessionIdAndMessageId(sessionId , messageId);
                const encMessage = Pub.enc(true , message.file , this.user.aes_key);
                const extra = window.encodeURI(G.jsonEncode(message.extra));
                message.request = this.send('sendFileForPrivate' , {
                    friend_id: session.other.id ,
                    message: encMessage ,
                    old: 0 ,
                    extra: extra ,
                    create_time: message.create_time
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        message.error = res.data;
                        msg = message;
                    } else {
                        msg = res.data;
                        this.handleMessageForPrivate(msg);
                    }
                    let update;
                    // 消息更新
                    if (res.code != 2000) {
                        // 网络掉线
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }

                    console.log('更新结果：' , update);
                });
            } ,

            // 群聊-发送文件
            sendFileForGroupBySessionIdAndMessageId (sessionId , messageId) {
                const session = this.findSessionById(sessionId);
                const message = this.findMessageInMessageGroupBySessionIdAndMessageId(sessionId , messageId);
                const encMessage = Pub.enc(true , message.file , this.user.aes_key);
                const extra = window.encodeURI(G.jsonEncode(message.extra));
                message.request = this.send('sendFileForGroup' , {
                    group_id: session.target_id ,
                    message: encMessage ,
                    old: 0 ,
                    extra: extra ,
                    create_time: message.create_time ,
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        message.error = res.data;
                        msg = message;
                    } else {
                        msg = res.data;
                        this.handleMessageForGroup(msg);
                    }
                    let update;
                    // 消息更新
                    if (res.code != 2000) {
                        // 网络掉线
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }

                    console.log('更新结果：' , update);
                });
            } ,


            // 群聊-发送文本消息
            sendTextForGroupBySessionId (sessionId) {
                const session = this.findSessionById(sessionId);
                const inputDom = G(this.$refs['input_' + sessionId]);
                const html = inputDom.html();
                let text = Pub.htmlToTextForMessage(html);
                text = Pub.stripTags(text);
                const encText = Pub.enc(true , text , this.user.aes_key);
                const messageId = this.genId();
                const tmpMsg = {
                    id: messageId ,
                    user_id: this.user.id ,
                    user: {
                        avatar: this.user.avatar ,
                    } ,
                    message: text ,
                    type: 'text' ,
                    loading: true ,
                    isTemp: true ,
                    request: '' ,
                    create_time: G.getCurTimeData(true) ,
                };
                this.handleMessageForGroup(tmpMsg);
                const history = this.addMessageBySessionIdAndMsgAndIsAddHistoryAndPosForGroupAndPosForMessage(session.id , tmpMsg , false , 'push' , 'push');
                this.$nextTick(() => {
                    this.bottomForHistoryBySessionId(sessionId);
                });
                tmpMsg.request = this.send('sendTextForGroup' , {
                    group_id: session.target_id ,
                    message: encText ,
                    old: 0 ,
                    create_time: tmpMsg.create_time ,
                } , (res) => {
                    let msg;
                    if (res.code != topContext.successCode) {
                        // console.log(res.data);
                        tmpMsg.loading = false;
                        tmpMsg.error = res.data;
                        msg = tmpMsg;
                    } else {
                        msg = res.data;
                        this.handleMessageForGroup(msg);
                    }
                    // 消息更新
                    let update;
                    if (res.code != 2000) {
                        // 网络掉线
                        update = this.updateMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    } else {
                        update = this.updateTempMessageBySessionIdAndMessageIdAndMsg(session.id , messageId , msg);
                    }
                    console.log('更新结果：' , update);
                });
                inputDom.html('');
            } ,

            // 切换群组
            switchGroupEvent (e) {
                const tar = G(e.currentTarget);
                const groupId = tar.data('groupId');
                this.switchGroupByGroupId(groupId);

            } ,

            // 切换群组
            switchFriendEvent (e) {
                const tar = G(e.currentTarget);
                const friendId = tar.data('friendId');
                this.switchFriendByFriendId(friendId);

            } ,

            findGroupByGroupId (groupId) {
                for (let i = 0; i < this.relation.group.length; ++i)
                {
                    let group = this.relation.group[i];
                    if (group.group_id == groupId) {
                        return group;
                    }
                }
                return false;
            } ,

            findFriendByFriendId (friendId) {
                for (let i = 0; i < this.relation.friend.length; ++i)
                {
                    let group = this.relation.friend[i];
                    for (let n = 0; n < group.list.length; ++n)
                    {
                        let friend = group.list[n];
                        if (friend.friend_id == friendId) {
                            return friend;
                        }
                    }
                }
                return false;
            } ,

            switchGroupByGroupId (groupId) {
                this.val.detailForType = 'group';
                const group = this.findGroupByGroupId(groupId);
                this.detailForGroup = group;
            } ,

            switchFriendByFriendId (friendId) {
                this.val.detailForType = 'friend';
                const friend = this.findFriendByFriendId(friendId);
                this.detailForFriend = friend;
            } ,

            // 创建 session
            createOrUpdateSession (type , targetId , callback) {
                if (this.pending.createOrUpdateSession) {
                    console.log('createOrUpdateSession 请求中...请耐心等待');
                    return ;
                }
                this.pending.createOrUpdateSession = true;
                const layerIndex = Pub.loading();
                this.send('createOrUpdateSession' , {
                    type: type ,
                    target_id: targetId
                } , (res) => {
                    this.pending.createOrUpdateSession = false;
                    layer.close(layerIndex);
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    if (G.isFunction(callback)) {
                        callback(res.data);
                    }
                });
            },

            // 关联 好友-群组 切换会话
            switchSessionByTypeAndTargetId (type , targetId) {
                switch (type)
                {
                    case 'private':
                        targetId = Pub.chatId(this.user.id , targetId);
                        break;
                    default:
                        break;
                }
                let session = this.findSessionByTypeAndTargetId(type , targetId);
                if (session === false) {
                    return this.createOrUpdateSession(type , targetId , () => {
                        this.getSession(() => {
                            session = this.findSessionByTypeAndTargetId(type , targetId);
                            this.switchSessionById(session.id , true);
                        });
                    });
                }
                this.switchSessionById(session.id , true);
            } ,

            // 搜索切换会话
            switchSessionForSearchByTypeAndTargetId (type , targetId) {
                const searchDom = G(this.$refs['search']);
                searchDom.val('');
                this.switchSessionByTypeAndTargetId(type , targetId);
            } ,

            // userInfo 进入之前
            beforeEnterForUserInfo () {
                console.log('before enter');
                const userInfo = G(this.$refs['user-info']);

                // 我很好
                userInfo.addClass('user-info-before-enter');
            } ,

            enterForUserInfo () {
                console.log('enter');
                const userInfo = G(this.$refs['user-info']);
                window.clearTimeout(this.val.timerForUserInfo);
                this.val.timerForUserInfo = window.setTimeout(() => {
                    userInfo.addClass('user-info-enter');
                } , 200);
                // 我很好
                // this.$nextTick(() => {
                //     userInfo.addClass('user-info-enter');
                // });
            } ,

            afterEnterForUserInfo () {
                console.log('after enter');
                const userInfo = G(this.$refs['user-info']);
                userInfo.removeClass('user-info-before-enter');
                userInfo.removeClass('user-info-enter');
            } ,

            beforeLeaveForUserInfo () {
                console.log('before leave');
                const userInfo = G(this.$refs['user-info']);
                // 我很好
                userInfo.addClass('user-info-before-leave');
            } ,

            leaveForUserInfo () {
                console.log('leave');
                const userInfo = G(this.$refs['user-info']);
                // 我很好
                userInfo.addClass('user-info-leave');
            } ,

            afterLeaveForUserInfo () {
                console.log('after leave');
                const userInfo = G(this.$refs['user-info']);
                // 我很好
                userInfo.removeClass('user-info-before-leave');
                userInfo.removeClass('user-info-leave');
            } ,

            // 将 avatar 定位到鼠标未知之前
            fixedUserInfoPos () {
                // const x = window.pageXOffset;
            } ,

            hideUserInfo () {
                // const userInfoDom = G(this.$refs['user-info']);
                // userInfoDom.
                this.val.showUserInfo = false;
            } ,

            showUserInfo () {
                this.val.showUserInfo = true;
            } ,

            // 切换头像
            switchAvatarEvent (e) {
                const dom       = G(e.currentTarget);
                const userId = dom.data('userId');
                const clientX = e.clientX;
                const clientY = e.clientY;
                const userInfo = G(this.$refs['user-info']);
                // 位置重置到鼠标指针所在位置
                userInfo.css({
                    left: clientX + 'px' ,
                    top: clientY + 'px' ,
                });
                this.showUserInfo();
                this.switchAvatar(userId);
            } ,

            // 从给定的会话中找到对应的消息
            findMessageBySessionIdAndMessageId (sessionId , messageId) {
                // const history = this.findHistoryBySessionId(sessionId);
                // for (let i = 0; i < history.history.length; ++i)
                // {
                //     const cur = history.history[i];
                //     if (cur.id == messageId) {
                //         return cur;
                //     }
                // }
                // return false;
                return this.findMessageInMessageGroupBySessionIdAndMessageId(sessionId , messageId);
            } ,

            findMessageInMessageGroupBySessionIdAndMessageId (sessionId , messageId) {
                const history = this.findHistoryBySessionId(sessionId);
                for (let i = 0; i < history.historyForGroup.length; ++i)
                {
                    const groups = history.historyForGroup[i];
                    for (let n = 0; n < groups.list.length; ++n)
                    {
                        const message = groups.list[n];
                        if (message.id == messageId) {
                            return message;
                        }
                    }
                }
                return false;
            } ,

            getUserInfo (userId , callback) {
                if (this.pending.getUserInfo) {
                    console.log('请求中...请耐心等待');
                    return ;
                }
                if (this.user.id == userId) {
                    if (G.isFunction(callback)) {
                        callback(this.user);
                    }
                    return ;
                }
                this.pending.getUserInfo = true;
                this.send('other' , {
                    other_id: userId
                } , (res) => {
                    this.pending.getUserInfo = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    res = res.data;
                    if (G.isFunction(callback)) {
                        callback(res);
                    }
                });
            } ,

            switchAvatar (userId) {
                this.getUserInfo(userId , (user) => {
                    this.userInfo = user;
                });
            } ,

            switchSessionInAvatar () {
                if (this.userInfo.id == this.user.id) {
                    // 自身不允许给自身发消息
                    return ;
                }
                this.switchSessionByTypeAndTargetId('private' , this.userInfo.id);
                this.hideUserInfo();
            } ,

            subEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);

                this.sessionForLayer = session;
                this.setUserForGroupInSearchWithDelModeBySessionId(sessionId);
                this.val.operationModeForGroup = 'del';
                this.showLayerForGroupMember();
            } ,

            findGroupInLayerByGroupAndList (group , list) {
                for (let i = 0; i < list.length; ++i)
                {
                    let cur = list[i];
                    if (cur.group == group) {
                        return cur;
                    }
                }
                return false;
            } ,

            // 设置渲染的好友列表
            setUserForPrivateInSearchBySessionId (sessionId) {
                const friend = this.relation.friend;
                const res = [];
                const session = this.findSessionById(sessionId);
                const userIds = Pub.userIds(session.target_id);
                friend.forEach((g) => {
                    g.list.forEach((f) => {
                        if (userIds.indexOf(f.friend_id) >= 0) {
                            // 好友列表中
                            return ;
                        }
                        this.handleFriend(f);
                        let group = this.findGroupInLayerByGroupAndList(g.group , res);
                        if (group === false) {
                           group = {
                               group: g.group ,
                               list: [] ,
                           };
                           res.push(group);
                        }
                        group.list.push(f);
                    });
                });
                this.searchForLayer = res;
                this.copySearchForLayer = this.searchForLayer.map((v) => {
                    return v;
                });
            } ,

            getUserIdsForGroupInSearchBySessionId (sessionId) {
                const memberForGroup = this.memberForGroup[sessionId];
                const memberIds = [];
                memberForGroup.list.forEach((v) => {
                    memberIds.push(v.user_id);
                });
                return memberIds;
            } ,

            // 设置渲染的好友列表
            setUserForGroupInSearchWithAddModeBySessionId (sessionId) {
                const friend = this.relation.friend;
                const res = [];
                const session = this.findSessionById(sessionId);
                const userIds = this.getUserIdsForGroupInSearchBySessionId(sessionId);
                friend.forEach((g) => {
                    g.list.forEach((f) => {
                        if (userIds.indexOf(f.friend_id) >= 0) {
                            // 好友列表中
                            return ;
                        }
                        this.handleFriend(f);
                        let group = this.findGroupInLayerByGroupAndList(g.group , res);
                        if (group === false) {
                            group = {
                                group: g.group ,
                                list: [] ,
                            };
                            res.push(group);
                        }
                        group.list.push(f);
                    });
                });
                this.searchForLayer = res;
                this.copySearchForLayer = this.searchForLayer.map((v) => {
                    return v;
                });
            } ,

            // 好友分组排序
            sortGroupForUser (groups) {
                groups.sort((a , b) => {
                    if (a.group == b.group) {
                        return 0;
                    }
                    return a.group > b.group ? 1 : -1;
                });
            } ,

            // 设置渲染的好友列表
            setUserForGroupInSearchWithDelModeBySessionId (sessionId) {
                const res = [];
                const memberForGroup = this.memberForGroup[sessionId];
                memberForGroup.list.forEach((member) => {
                    if (member.user_id == this.user.id) {
                        // T 人的时候不要出现当前登录用户（实际就是群主）
                        return ;
                    }
                    // 数据处理
                    const friend = {
                        friend_id: member.user_id ,
                        alias: member.alias ,
                        friend: member.user ,
                    };
                    this.handleFriend(friend);
                    let group = this.findGroupInLayerByGroupAndList(member.letter , res);
                    if (group === false) {
                        group = {
                            group: member.letter ,
                            list: [] ,
                        };
                        res.push(group);
                    }
                    group.list.push(friend);
                });
                this.sortGroupForUser(res);
                this.searchForLayer = res;
                this.copySearchForLayer = this.searchForLayer.map((v) => {
                    return v;
                });
            } ,

            addEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                this.val.operationModeForGroup = 'add';
                switch (session.type)
                {
                    case 'private':
                        // 设置私聊的好友列表
                        this.setUserForPrivateInSearchBySessionId(session.id);
                        // 设置当前处理的会话
                        this.sessionForLayer = session;
                        // 显示弹层
                        this.showLayerForGroup(sessionId);
                        break;
                    case 'group':
                        // 群组
                        // 设置群组的好友列表
                        this.setUserForGroupInSearchWithAddModeBySessionId(session.id);
                        // 设置当前处理的会话
                        this.sessionForLayer = session;
                        // 显示弹层
                        this.showLayerForGroupMember();
                        break;
                }
            } ,

            // 选择用户-创建群组
            selectedEventForLayer (f) {
                // 选择事件
                f.selected = !f.selected;
                if (f.selected) {
                    this.selectedUserForLayer.push(f);
                } else {
                    this.delFriendInLayer(f.friend_id);
                }
            } ,

            // 删除
            delSelectedForForwardLayer (type , id) {
                // console.log(type , id);
                for (let i = 0; i < this.selectedForForwardLayer.length; ++i)
                {
                    let val = this.selectedForForwardLayer[i];
                    if (val.type != type) {
                        continue ;
                    }
                    let exist = false;
                    switch (val.type)
                    {
                        case 'session':
                            if (val.type == 'private') {
                                if (val.friend.id == id) {
                                    exist = true;
                                }
                            } else {
                                if (val.group.id == id) {
                                    exist = true;
                                }
                            }
                            break;
                        case 'private':
                            if (val.friend.id == id) {
                                exist = true;
                            }
                            break;
                        case 'group':
                            if (val.group.id == id) {
                                exist = true;
                            }
                            break;
                    }
                    if (!exist) {
                        continue ;
                    }
                    this.selectedForForwardLayer.splice(i , 1);
                    // 从相关列表中踢出所有相关的项
                    this.searchForForwardLayer.recent.forEach((v) => {
                        if (val.type != v.type) {
                            // 当类型不一致的时候直接跳过
                            return ;
                        }
                        switch (val.type)
                        {
                            case 'private':
                                if (val.friend.id != v.friend.id) {
                                    return ;
                                }
                                v.friend.selected = false;
                                break;
                            case 'group':
                                if (val.group.id != v.group.id) {
                                    return ;
                                }
                                v.group.selected = false;
                                break;
                        }
                    });
                    if (val.type == 'group') {
                        this.searchForForwardLayer.group.forEach((v) => {
                            if (val.group.id != v.group.id) {
                                return ;
                            }
                            v.selected = false;
                        });
                    }
                    if (val.type == 'private') {
                        this.searchForForwardLayer.friend.forEach((group) => {
                            group.list.forEach((v) => {
                                if (val.friend.id != v.friend.id) {
                                    return ;
                                }
                                v.selected = false;
                            });
                        });
                    }
                }
                return false;
            } ,

            addSelectedForForwardLayer (val) {
                // 添加一个项
                this.selectedForForwardLayer.push(val);
                // console.log('val' , val);

                // 选中相关项目
                this.searchForForwardLayer.recent.forEach((v) => {
                    if (val.type != v.type) {
                        // 当类型不一致的时候直接跳过
                        return ;
                    }
                    switch (val.type)
                    {
                        case 'private':
                            if (val.friend.id != v.friend.id) {
                                return ;
                            }
                            v.friend.selected = true;
                            break;
                        case 'group':
                            if (val.group.id != v.group.id) {
                                return ;
                            }
                            v.group.selected = true;
                            break;
                    }
                });
                if (val.type == 'group') {
                    this.searchForForwardLayer.group.forEach((v) => {
                        if (val.group.id != v.group.id) {
                            return ;
                        }
                        v.selected = true;
                    });
                }
                if (val.type == 'private') {
                    this.searchForForwardLayer.friend.forEach((group) => {
                        group.list.forEach((v) => {
                            if (val.friend.id != v.friend.id) {
                                return ;
                            }
                            v.selected = true;
                        });
                    });
                }
            } ,

            searchEventForForwardLayer (e) {
                const tar = G(e.currentTarget);
                const val = tar.val();
                if (val.length < 1) {
                    // 重置会初始列表状态
                    this.searchForForwardLayer = Object.assign({} , this.searchForForwardLayer , this.copySearchForForwardLayer);
                    return ;
                }
                this.searchForForwardLayer.recent = this.copySearchForForwardLayer.recent.filter((v) => {
                    switch (v.type)
                    {
                        case 'private':
                            if (
                                v.friend.nickname.indexOf(val) >= 0 ||
                                v.friend.username.indexOf(val) >= 0
                            ) {
                                return true;
                            }
                            return false;
                        case 'group':
                            if (v.group.name.indexOf(val) >= 0) {
                                return true;
                            }
                            return false;
                    }
                });

                this.searchForForwardLayer.group = this.copySearchForForwardLayer.group.filter((v) => {
                    if (v.group.name.indexOf(val) >= 0) {
                        return true;
                    }
                    return false;
                });

                this.searchForForwardLayer.friend = [];
                this.copySearchForForwardLayer.friend.forEach((group) => {
                    let res = this.findGroupInLayerByGroupAndList(group.group , this.searchForForwardLayer.friend);
                    if (res === false) {
                        res = {
                            group: group.group ,
                            list: []
                        };
                    }
                    group.list.forEach((f) => {
                        if (
                            f.friend.nickname.indexOf(val) >= 0 ||
                            f.friend.username.indexOf(val) >= 0
                        ) {
                            res.list.push(f);
                        }
                    });
                    if (res.list.length > 0) {
                        this.searchForForwardLayer.friend.push(res);
                    }
                });
            } ,

            selectedEventForForwardLayer (type , val) {
                let selected;
                let pushVal;
                let id;
                switch (type)
                {
                    case 'session':
                        if (val.type == 'private') {
                            selected = val.friend.selected = !val.friend.selected;
                            id = val.friend.id;
                        } else {
                            selected = val.group.selected = !val.group.selected;
                            id = val.group.id;
                        }
                        pushVal = val;
                        type = val.type;
                        break;
                    case 'private':
                        // console.log('提供的数据' , val);
                        selected = val.selected = !val.selected;
                        id = val.friend.id;
                        pushVal = {
                            id: 'private_' + Pub.chatId(val.user_id , val.friend_id) ,
                            type: 'private' ,
                            friend: val.friend ,
                        };
                        break;
                    case 'group':
                        selected = val.selected = !val.selected;
                        id = val.group.id;
                        pushVal = {
                            id: 'group_' + val.group.id ,
                            type: 'group' ,
                            group: val.group ,
                        };
                        break;
                }
                if (selected) {
                    // 添加
                    this.addSelectedForForwardLayer(pushVal);
                    // console.log(G.jsonDecode(G.jsonEncode(this.sessionForRightKeyLayer)));
                    const forwardType = type;
                    const forwardTargetId = type == 'private' ? pushVal.friend.id : pushVal.group.id;
                    switch (this.sessionForRightKeyLayer.type)
                    {
                        case 'private':
                            this.messageForwardForPrivateByTypeAndTargetIdAndMessageId(forwardType , forwardTargetId , this.messageForRightKeyLayer.id);
                            break;
                        case 'group':
                            this.messageForwardForGroupByTypeAndTargetIdAndMessageId(forwardType , forwardTargetId , this.messageForRightKeyLayer.id);
                            break;
                    }
                } else {
                    // 删除
                    this.delSelectedForForwardLayer(type , id);
                }

            } ,

            messageForwardForPrivateByTypeAndTargetIdAndMessageId (type , targetId , messageId) {
                if (this.pending.messageForwardForPrivateByTypeAndTargetIdAndMessageId) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                const layerIndex = Pub.loading();
                this.pending.messageForwardForPrivateByTypeAndTargetIdAndMessageId = true;
                this.send('forwardForPrivate' , {
                    type: type ,
                    target_id: targetId ,
                    message_id: G.jsonEncode([messageId])
                } , (res) => {
                    layer.close(layerIndex);
                    this.pending.messageForwardForPrivateByTypeAndTargetIdAndMessageId = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    this.hideLayerForForward();
                    layer.msg('操作成功');
                });
            } ,

            messageForwardForGroupByTypeAndTargetIdAndMessageId (type , targetId , messageId) {
                if (this.pending.messageForwardForGroupByTypeAndTargetIdAndMessageId) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                const layerIndex = Pub.loading();
                this.pending.messageForwardForGroupByTypeAndTargetIdAndMessageId = true;
                this.send('forwardForGroup' , {
                    type: type ,
                    target_id: targetId ,
                    message_id: G.jsonEncode([messageId])
                } , (res) => {
                    layer.close(layerIndex);
                    this.pending.messageForwardForGroupByTypeAndTargetIdAndMessageId = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    this.hideLayerForForward();
                    layer.msg('操作成功');
                });
            } ,

            showLayerForGroup (sessionId) {
                this.val.layerForGroup = true;
                this.$nextTick(() => {
                    // 居中显示
                    const layerForGroup = G(this.$refs['layer-for-group']);
                    layerForGroup.center(this.$el , 'all');
                });
            } ,

            resetFormForGroup () {
                this.formForGroup = {
                    name: '' ,
                    // 1-永久群 2-时效群
                    type: 1 ,
                    expire: "",
                    // 匿名群？0-否 1-是
                    anonymous: 0 ,
                    // json 数组（选添）
                    user_ids: ""
                };
            } ,

            hideLayerForGroup () {
                this.val.layerForGroup = false;
                this.selectedUserForLayer = [];
                this.resetFormForGroup();
                this.relation.friend.forEach((g) => {
                    g.list.forEach((f) => {
                        // 初始化成未选中
                        f.selected = false;
                    });
                });
            } ,

            showLayerForGroupMember () {
                this.val.layerForGroupMember = true;
                this.$nextTick(() => {
                    // 居中显示
                    const layerForGroupMember = G(this.$refs['layer-for-group-member']);
                    layerForGroupMember.center(this.$el , 'all');
                });
            } ,

            hideLayerForGroupMember () {
                this.selectedUserForLayer = [];
                this.val.layerForGroupMember = false;
                this.sessionForLayer = {};
            } ,

            // 创建群聊事件
            createGroupEvent () {
                this.createGroup();
            } ,

            createGroup () {
                if (this.pending.createGroup) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                const userIds = [];
                this.selectedUserForLayer.forEach((u) => {
                    userIds.push(u.friend_id);
                });
                if (this.formForGroup.name == '') {
                    layer.alert('请填写群名称');
                    return ;
                }
                if (userIds.length < 1) {
                    layer.alert('请选择群成员');
                    return ;
                }
                const session = this.sessionForLayer;
                const otherId = Pub.otherId(session.target_id , this.user.id);
                userIds.push(otherId);
                const layerIndex = Pub.loading();
                this.pending.createGroup = true;
                this.formForGroup.user_ids = G.jsonEncode(userIds);
                this.send('createGroup' , this.formForGroup , (res) => {
                    this.pending.createGroup = false;
                    layer.close(layerIndex);
                    if (res.code != 200) {
                        layer.alert(res.data);
                        return ;
                    }
                    res = res.data;
                    this.hideLayerForGroup();
                    this.switchSessionByTypeAndTargetId('group' , res);
                });
            } ,

            // 群组搜索
            searchForLayerEvent (e) {
                const tar = G(e.currentTarget);
                let val = tar.val();
                this.searchForLayerByVal(val);
            } ,

            searchForLayerByVal (val) {
                if (val.length < 1) {
                    this.searchForLayer = this.copySearchForLayer;
                    return ;
                }
                const res = [];
                this.copySearchForLayer.forEach((g) => {
                    g.list.forEach((f) => {
                        if (
                            f.alias.indexOf(val) >= 0 ||
                            f.friend.nickname.indexOf(val) >= 0 ||
                            f.friend.username.indexOf(val) >= 0
                        ) {
                            let group = this.findGroupInLayerByGroupAndList(g.group , res);
                            if (group === false) {
                                group  = {
                                    group: g.group ,
                                    list: [] ,
                                };
                                res.push(group);
                            }
                            group.list.push(f);
                        }
                    });
                });
                this.sortGroupForUser(res);
                this.searchForLayer = res;
            } ,

            // 群操作
            groupMemberOperationEvent () {
                switch (this.val.operationModeForGroup)
                {
                    case 'add':
                        // 添加群成员
                        this.addGroupMember();
                        break;
                    case 'del':
                        // 删除群成员
                        this.delGroupMember();
                        break;
                }
            } ,

            // 获取选中的用户 id
            getUserIdsForSelectedInLayer () {
                const userIds = [];
                this.selectedUserForLayer.forEach((friend) => {
                    userIds.push(friend.friend_id);
                });
                return userIds;
            } ,

            addGroupMember () {
                if (this.pending.addGroupMember) {
                    return ;
                }
                const userIds = this.getUserIdsForSelectedInLayer();
                if (userIds.length <= 0) {
                    layer.alert("请选择用户");
                    return ;
                }
                this.pending.addGroupMember = true;
                const layerIndex = Pub.loading();
                this.send('inviteJoinGroup' , {
                    group_id: this.sessionForLayer.target_id ,
                    relation_user_id: G.jsonEncode(userIds)
                } , (res) => {
                    layer.close(layerIndex);
                    this.pending.addGroupMember = false;
                    if (res.code != 200) {
                        layer.alert(res.data);
                        return ;
                    }
                    // 重置群成员
                    this.memberForGroup[this.sessionForLayer.id] = {
                        once: true ,
                        noMore: false ,
                        list: [] ,
                    };
                    // 重新获取群成员
                    this.getGroupMemberBySessionIdAndGroupId(this.sessionForLayer.id , this.sessionForLayer.target_id);
                    // 这个后面再看是否手动刷新成员
                    this.hideLayerForGroupMember();
                });
            } ,

            delGroupMember () {
                if (this.pending.delGroupMember) {
                    return ;
                }
                const userIds = this.getUserIdsForSelectedInLayer();
                if (userIds.length <= 0) {
                    layer.alert("请选择用户");
                    return ;
                }
                this.pending.delGroupMember = true;
                const layerIndex = Pub.loading();
                this.send('kickMember' , {
                    group_id: this.sessionForLayer.target_id ,
                    user_id: G.jsonEncode(userIds)
                } , (res) => {
                    layer.close(layerIndex);
                    this.pending.delGroupMember = false;
                    if (res.code != 200) {
                        layer.alert(res.data);
                        return ;
                    }
                    // 重新获取群成员
                    this.memberForGroup[this.sessionForLayer.id] = {
                        once: true ,
                        noMore: false ,
                        list: [] ,
                    };
                    // 重新获取群成员
                    this.getGroupMemberBySessionIdAndGroupId(this.sessionForLayer.id , this.sessionForLayer.target_id);
                    // 关闭弹层
                    this.hideLayerForGroupMember();
                });
            } ,

            initStatic () {
                // const layerForGroup = G(this.$refs['layer-for-group-member']);
                // const layerForGroupMember = G(this.$refs['layer-for-group-member']);

                // layerForGroup.move(this.$el , true);
                // layerForGroupMember.move(this.$el , true);
            } ,

            // 从消息列表重找到给定id对应的消息

            messageClickForPrivateEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const messageId = tar.data('messageId');
                const message = this.findMessageBySessionIdAndMessageId(sessionId , messageId);
                // 如果是阅后即焚消息，需要点击后更新读取状态
                if (
                    message.user_id != this.user.id &&
                    message.flag == 'burn' &&
                    message.self_is_read == 0
                ) {
                    // 设置阅后即焚消息未已读
                    this.readedForBurnBySessionIdAndMessageId(sessionId , messageId);
                }
            } ,

            // 设置阅后即焚消息为已读
            readedForBurnBySessionIdAndMessageId (sessionId , messageId) {
                const message = this.findMessageBySessionIdAndMessageId(sessionId , messageId);
                if (message.isTemp) {
                    layer.msg('临时消息不支持更新阅后即焚状态');
                    return ;
                }
                if (this.pending.readedForBurn) {
                    return ;
                }
                this.pending.readedForBurn = true;
                this.send('readedForBurn' , {
                    message_id: messageId
                } , (res) => {
                    this.pending.readedForBurn = false;
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    message.self_is_read = 1;
                });
            } ,

            playAudioEvent (e) {
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const messageId = tar.data('messageId');

                // audio.addClass(['playing']);
                const icoDom = G(this.$refs['voice_ico_' + sessionId + '_' + messageId]);
                icoDom.addClass('playing');
                const imageInIco = G('.image' , icoDom.get(0));
                imageInIco.addClass('hide');

                // todo 使音频文件播放出来
                // console.log(audio.get(0));
                // // 音频播放
                // audio.origin('play');
                // audio.get(0).play();
                const audio = G(this.$refs['audio_' + sessionId + '_' + messageId]);
                const audioSrc = audio.native('src');
                const audioKey = 'audio_' + sessionId + '_' + messageId;
                const amr = new BenzAMRRecorder();
                amr.initWithUrl(audioSrc).then(function() {
                    // 播放
                    amr.play()
                });
                amr.onEnded(function() {
                    icoDom.removeClass('playing');
                    imageInIco.removeClass('hide');
                });

                const message = this.findMessageBySessionIdAndMessageId(sessionId, messageId);
                if (message === false) {
                    return;
                }
                const session = this.findSessionById(sessionId);
                // 设置语音消息为已读
                const callback = (res) => {
                    if (res.code != 200) {
                        console.log(res.data);
                        return ;
                    }
                    // 更新数据
                    message.self_is_read = 1;
                };
                switch (session.type)
                {
                    case 'private':
                        if (message.self_is_read == 1) {
                            return;
                        }
                        this.send('readedForPrivate' , {
                            message_id: message.id
                        } , callback);
                        break;
                    case 'group':
                        if (message.is_read == 1) {
                            return;
                        }
                        this.send('readedForGroup' , {
                            group_message_id: message.id
                        } , callback);
                        break;
                }
            } ,

            // 会话：右键功能
            sessionRightKeyEvent (e) {
                console.log(e.which);
                if (e.which != 3) {
                    this.hideLayerForRightKeyInSession();
                    // 过期时间
                    return ;
                }
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                if (['private' , 'group'].indexOf(session.type) < 0) {
                    return ;
                }
                console.log('点击的鼠标按键' , e.which);
                e.preventDefault();
                // 鼠标右键被点击
                this.showLayerForRightKeyInSession();
                this.sessionForRightKeyLayer = session;
                const clientX = e.clientX;
                const clientY = e.clientY;
                this.$nextTick(() => {
                    const layerForRightKeyInSession = G(this.$refs['layer-for-right-key-in-session']);
                    layerForRightKeyInSession.css({
                        left: clientX + 'px' ,
                        top: clientY + 'px'
                    });
                });
            } ,

            // 消息：右键功能
            messageRightKeyEvent (e) {
                // console.log(e.which);
                if (e.which != 3) {
                    this.hideLayerForRightKeyInMessage();
                    // 过期时间
                    return ;
                }
                const tar = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const messageId = tar.data('messageId');
                const session = this.findSessionById(sessionId);
                if (['private' , 'group'].indexOf(session.type) < 0) {
                    return ;
                }
                const message = this.findMessageBySessionIdAndMessageId(sessionId , messageId);
                // console.log(message);
                // this.sessionForRightKeyLayer = Object.assign({} , this.sessionForRightKeyLayer , session);
                this.sessionForRightKeyLayer = Object.assign({} , session);
                // this.messageForRightKeyLayer = Object.assign({} , this.messageForRightKeyLayer , message);
                this.messageForRightKeyLayer = Object.assign({} , message);
                e.preventDefault();
                // 鼠标右键被点击
                this.showLayerForRightKeyInMessage();
                const clientX = e.clientX;
                const clientY = e.clientY;
                this.$nextTick(() => {
                    const layerForRightKeyInMessage = G(this.$refs['layer-for-right-key-in-message']);
                    layerForRightKeyInMessage.css({
                        left: clientX + 'px' ,
                        top: clientY + 'px'
                    });
                });
            } ,


            // 隐藏右键菜单（session）
            hideLayerForRightKeyInSession () {
                this.val.layerForRightKeyInSession = false;
            } ,

            // 显示右键菜单（session）
            showLayerForRightKeyInSession () {
                this.val.layerForRightKeyInSession = true;
            } ,

            // 显示右键菜单（message）
            hideLayerForRightKeyInMessage () {
                this.val.layerForRightKeyInMessage = false;
            } ,
            // 隐藏右键菜单（message）
            showLayerForRightKeyInMessage () {
                this.val.layerForRightKeyInMessage = true;
            } ,

            setTop () {
                if (this.pending.setTop) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                this.pending.setTop = true;
                const layerIndex = Pub.loading();
                this.send('top' , {
                    type: this.sessionForRightKeyLayer.type ,
                    target_id: this.sessionForRightKeyLayer.target_id ,
                    top: this.sessionForRightKeyLayer.top >= 1 ? 0 : 1 ,
                } ,  (res) => {
                    this.pending.setTop = false;
                    layer.close(layerIndex);
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    this.hideLayerForRightKeyInSession();
                });
            } ,

            setNotice () {
                const range = ['private' , 'group'];
                if (range.indexOf(this.sessionForRightKeyLayer.type) < 0) {
                    return ;
                }
                if (this.pending.setNotice) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                this.pending.setNotice = true;
                const layerIndex = Pub.loading();
                const canNotice = this.sessionForRightKeyLayer.can_notice >= 1 ? 0 : 1;
                switch (this.sessionForRightKeyLayer.type)
                {
                    case 'private':
                        const otherId = Pub.otherId(this.sessionForRightKeyLayer.target_id , this.user.id);
                        this.send('noticeForPrivate' , {
                            friend_id: otherId ,
                            can_notice: canNotice ,
                        } ,  (res) => {
                            this.pending.setNotice = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInSession();
                        });
                        break;
                    case 'group':
                        this.send('noticeForGroup' , {
                            group_id: this.sessionForRightKeyLayer.target_id ,
                            can_notice: canNotice ,
                        } ,  (res) => {
                            this.pending.setNotice = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInSession();
                            // this.
                        });
                        break;
                }
            } ,

            setNoticeForHistory (e) {
                const range = ['private' , 'group'];
                const tar   = G(e.currentTarget);
                const sessionId = tar.data('sessionId');
                const session = this.findSessionById(sessionId);
                if (range.indexOf(session.type) < 0) {
                    return ;
                }
                if (this.pending.setNotice) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                this.pending.setNotice = true;
                const layerIndex = Pub.loading();
                const canNotice = session.can_notice >= 1 ? 0 : 1;
                switch (session.type)
                {
                    case 'private':
                        const otherId = Pub.otherId(session.target_id , this.user.id);
                        this.send('noticeForPrivate' , {
                            friend_id: otherId ,
                            can_notice: canNotice ,
                        } ,  (res) => {
                            this.pending.setNotice = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInSession();
                        });
                        break;
                    case 'group':
                        this.send('noticeForGroup' , {
                            group_id: session.target_id ,
                            can_notice: canNotice ,
                        } ,  (res) => {
                            this.pending.setNotice = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInSession();
                            // this.
                        });
                        break;
                }
            } ,

            delSession () {
                if (this.pending.delSession) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                this.pending.delSession = true;
                const layerIndex = Pub.loading();
                this.send('delSession' , {
                    id_list: G.jsonEncode([this.sessionForRightKeyLayer.id])
                } ,  (res) => {
                    this.pending.delSession = false;
                    layer.close(layerIndex);
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    this.hideLayerForRightKeyInSession();
                });
            } ,

            copyMessage () {
                const input = document.createElement('input');
                input.value = this.messageForRightKeyLayer.message;
                document.body.appendChild(input);
                input.focus();
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
                this.hideLayerForRightKeyInMessage();
            } ,

            withdrawMessage (e) {
                if (this.messageForRightKeyLayer.isTemp) {
                    layer.alert('临时消息不支持撤回');
                    return ;
                }
                if (this.pending.withdrawMessage) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                this.pending.withdrawMessage = true;
                const layerIndex = Pub.loading();
                const messageId = this.messageForRightKeyLayer.id;
                switch (this.sessionForCur.type)
                {
                    case 'private':
                        this.send('withdrawMessageForPrivate' , {
                            message_id: messageId
                        } ,  (res) => {
                            this.pending.withdrawMessage = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInMessage();
                            res = res.data;
                            this.refreshPrivateMessage(res);
                        });
                        break;
                    case 'group':
                        this.send('withdrawMessageForGroup' , {
                            group_message_id: messageId
                        } ,  (res) => {
                            this.pending.withdrawMessage = false;
                            layer.close(layerIndex);
                            if (res.code != topContext.successCode) {
                                layer.alert(res.data);
                                return ;
                            }
                            this.hideLayerForRightKeyInMessage();
                            res = res.data;
                            this.refreshGroupMessage(res);
                        });
                        break;
                }
            } ,

            delMessage () {
                let messageIds = [this.messageForRightKeyLayer.id];
                let messageIdsForJson = G.jsonEncode(messageIds);
                let data = {};
                let router;
                const delAfter = () => {
                    // 删除临时消息
                    this.delMessageByTypeAndMessageIds(this.sessionForRightKeyLayer.type , messageIds);
                    this.hideLayerForRightKeyInMessage();
                    // 删除失败队列中的请求（如果存在的话）
                    console.log('删除的消息 request' , this.messageForRightKeyLayer.request);
                    this.ins.rtc.delFailQueueByRequest(this.messageForRightKeyLayer.request);
                };
                if (this.messageForRightKeyLayer.isTemp) {
                    delAfter();
                    return ;
                }
                if (this.pending.delMessage) {
                    layer.alert('请求中...请耐心等待');
                    return ;
                }
                switch (this.sessionForCur.type)
                {
                    case 'private':
                        router = 'delMessageForPrivate';
                        data = {
                            message_id: messageIdsForJson
                        };
                        break;
                    case 'group':
                        router = 'delMessageForGroup';
                        data = {
                            group_message_id: messageIdsForJson
                        };
                        break;
                }
                this.pending.delMessage = true;
                const layerIndex = Pub.loading();
                this.send(router , data ,  (res) => {
                    this.pending.delMessage = false;
                    layer.close(layerIndex);
                    if (res.code != topContext.successCode) {
                        layer.alert(res.data);
                        return ;
                    }
                    delAfter();
                    layer.msg('操作成功');
                });
            } ,

            showLayerForForward () {
                this.val.layerForForward = true;
                this.$nextTick(() => {
                    // 居中显示
                    const layerForForward = G(this.$refs['layer-for-forward']);
                    layerForForward.center(this.$el , 'all');
                });
            } ,

            hideLayerForForward () {
                this.val.layerForForward = false;
            } ,

            run () {
                this.initStatic();
                this.initWebSocket();
                this.defineEvent();
            } ,
        } ,

        watch: {

        } ,
    });
})();