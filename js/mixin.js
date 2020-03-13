/**
 * ****************
 * 全局混入
 * ****************
 */
Vue.mixin({

    data () {
        return {
            dom: {} ,
        };
    } ,

    mounted () {
        this.__initDom();
        if (this.$el == this.dom.__app.get(0)) {
            // 仅在给定的 dom 组件下生效
            this.__showApp();
            this.__hideLoadLayer();
            this.__upgrade();
        }
    } ,

    methods: {

        // 版本升级
        __upgrade () {
            const key = '_upgrade_log_2_';
            const upgradeLog = G.s.get(key);
            if (!G.isNull(upgradeLog)) {
                return ;
            }
            let str = '';
            str += '<h2 style="text-align: center;padding-bottom: 12px;font-weight:bold;">版本升级：1.0.2 -> 1.0.3</h2>';
            str += '<ul style="list-style-type: decimal;list-style-position: inside;font-size: 13px;">';
            str += '    <li>Bug 修复；修复重复点击语音播放出现多路播放的情况</li>';
            str += '</ul>';
            str += '<h4 style="font-weight: bold;padding-top: 12px;">请点击确定按钮关闭该提示</h4>';
            layer.alert(str , {
                btn: ['关闭'],
                closeBtn: false ,
                maxWidth: '800px' ,
                btn1 (index) {
                    G.s.set(key , 1);
                    layer.close(index);
                } ,
            });
            // console.log('版本升级提示');
        } ,

        __initDom () {
            this.dom.__loading = G('#loading');
            this.dom.__app = G('#app');
        } ,

        // 显示容器
        __showApp () {
            this.dom.__app.removeClass('hide');
        } ,

        // 显示容器
        __hideApp () {
            this.dom.__app.addClass('hide');
        } ,

        // 隐藏加载层
        __hideLoadLayer () {
            this.dom.__loading.addClass('hide');
        } ,

        // 隐藏加载层
        __showLoadLayer () {
            this.dom.__loading.removeClass('hide');
        } ,

        // 合并的一些全局方法
        isValid (val) {
            return G.isValid(val);
        } ,
    } ,
});