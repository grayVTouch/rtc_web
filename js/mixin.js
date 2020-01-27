/**
 * ****************
 * 全局混入
 * ****************
 */
Vue.mixin({

    mounted () {
        const app = G('#app');
        app.removeClass('hide');
        const loading = G('#loading');
        loading.addClass('hide');
    } ,

    methods: {
        // 合并的一些全局方法
        isValid (val) {
            return G.isValid(val);
        } ,
    } ,
});