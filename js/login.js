(function(){
    "use strict";

    new Vue({
        el: '#app' ,

        data: {
            val: {
                qrcode: '' ,
                avatar: '' ,
                /**
                 * 1. qrcode 二维码
                 * 2. user 切换账号界面
                 */
                mode: 'qrcode' ,
                // 二维码已失效
                effective: true ,
                // 继续动画
                animated: true ,
            } ,
            timer: {
                refresh: null
            } ,
            ins: {
                rtc: null ,
            } ,
            dom: {} ,
        } ,

        created () {

        } ,

        mounted () {
            this.run();
        } ,

        methods: {

            initDom () {
                this.dom.refresh = G(this.$refs.refresh);
            } ,

            initWebSocket () {
                const self = this;
                this.ins.rtc = new RTC({
                    url: topContext.websocket ,
                    identifier: topContext.identifier ,
                    platform: topContext.platform ,
                    open () {
                        // 连接打开的情况下才能够进行初始化
                        self.initialize();
                    } ,
                    close () {
                        self.val.mode = 'qrcode';
                        self.val.effective = false;
                    } ,
                });
            } ,

            initialize () {
                const self = this;

                this.getQRCode(false);

                this.ins.rtc.on('avatar' , function(res){
                    self.val.avatar = res;
                    self.val.mode = 'user';
                });

                // 监听 ws 推送
                this.ins.rtc.on('logined' , function(res){
                    // 将用户的 token 信息存储到 SessionStorage 中
                    G.session.set('user_id' , res.user_id);
                    G.session.set('token' , res.token);
                    window.location.href = 'index.html';

                });

            } ,

            // 获取二维码
            getQRCode (isAddQueue) {
                isAddQueue = G.isBoolean(isAddQueue) ? isAddQueue : true;
                this.ins.rtc.loginQRCode(null , (res) => {
                    if (res.code != topContext.successCode) {
                        console.log('ws 接口获取到了错误信息：' . res.data);
                        // layer.alert(res.data);
                        return ;
                    }
                    this.val.effective = true;
                    this.val.qrcode = res.data;
                } , isAddQueue);
            } ,

            // 切换账号
            showQRCode () {
                this.val.mode = 'qrcode';
                this.getQRCode();
            } ,

            refreshQRCode () {
                if (!this.val.animated) {
                    return ;
                }
                this.val.animated = false;
                this.dom.refresh.addClass('round');
                this.timer.refresh = window.setTimeout(() => {
                    // 动画仅仅是增加交互体验用的
                    this.getQRCode();
                    this.dom.refresh.removeClass('round');
                    this.val.animated = true;
                } , 300);
            } ,

            run () {
                this.initDom();
                if (G.session.exists('token')) {
                    window.location.href = 'index.html';
                    return ;
                }
                this.initWebSocket();
            } ,
        } ,
    });
})();