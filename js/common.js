/**
 * 通用函数
 */
const Pub = {
    enc (enc , val , key){
        return enc ?
            Aes.enc(key , val) :
            val;
    } ,

    dec(enc , val , key){
        return enc ?
            Aes.dec(key , val) :
            val;
    } ,

    getFromNicknameAndUsername (nickname , username) {
        return nickname ? nickname : username;
    } ,

    timestampDiffWithNow (timestamp){
        if (G.isUndefined(timestamp)) {
            return false;
        }
        if (!G.isValid(timestamp)) {
            return '无';
        }
        let timeInfo = null;
        if (G.isNumeric(timestamp)) {
            timestamp = G.fromUnixtime(timestamp , 'datetime');
            timeInfo = G.parseTime(timestamp , 'datetime');
        } else {
            timeInfo = G.parseTime(timestamp , 'datetime');
        }
        const curTimeInfo = G.getCurTimeData(false);
        const hour      = timeInfo['hour'] < 10 ? '0' + timeInfo['hour'] : timeInfo['hour'];
        const minute    = timeInfo['minute'] < 10 ? '0' + timeInfo['minute'] : timeInfo['minute'];
        if (
            curTimeInfo['year'] == timeInfo['year'] &&
            curTimeInfo['month'] == timeInfo['month'] &&
            curTimeInfo['date'] == timeInfo['date']
        ) {
            // 同一天
            return hour + ":" + minute;
        }
        let month = timeInfo['month'] < 10 ? '0' + timeInfo['month'] : timeInfo['month'];
        let date = timeInfo['date'] < 10 ? '0' + timeInfo['date'] : timeInfo['date'];
        // 同一年
        if (curTimeInfo['year'] == timeInfo['year']) {
            return month + '-' + date + ' ' + hour + ':' + minute;
        }
        // 不同年
        return timeInfo['year'] + '-' + month + '-' + date + ' ' + hour + ':' + minute;
    } ,

    // 生成私聊会话id
    chatId (userId , otherId) {
        const minId = userId > otherId ? otherId : userId;
        const maxId = minId == userId ? otherId : userId;
        return minId + '_' + maxId;
    } ,

    userIds (chatId) {
        return chatId.split('_').map((v) => {
            return parseInt(v);
        });
    } ,

    otherId (chatId , userId) {
        const userIds = this.userIds(chatId);
        for (let i = 0; i < userIds.length; ++i)
        {
            const cur = userIds[i];
            if (cur == userId) {
                continue ;
            }
            return parseInt(cur);
        }
        return 0;
    } ,

    loading () {
        return layer.load(1, {
            shade: [0.8] //0.1透明度的白色背景
        });
    } ,

    // 时间格式化
    formatTimeForVoiceCall: function(duration) {
        let timeTxt = '';
        let min = Math.floor((duration / 1000 / 60) << 0);
        let sec = Math.floor((duration / 1000) % 60);

        if (parseInt(min) < 10) {
            min = '0' + min;
        }
        if (parseInt(sec) < 10) {
            sec = '0' + sec;
        }
        timeTxt = min + ':' + sec;
        return timeTxt;
    },

    // 文本 转 html
    textToHtmlForMessage (text) {
        const imageReg = /(\[.+?\])/g;
        const linkReg =  /(https?:\/\/[A-z0-9\.\?\&\/\-=]+)/g;
        const imageReplace = '<img src="file/face/__replace_face__.png" data-text="$1" class="image face">';
        const linkReplace = '<a onclick="window.open(\'$1\');" class="link">$1</a>';
        const matches = text.match(imageReg);
        const faceSrcReg = /(__replace_face__)/g;
        let res = text.replace(imageReg , imageReplace);
            res = res.replace(linkReg , linkReplace);
        let replaceCount = 0;
            res = res.replace(faceSrcReg , (matchText) => {
                const faceText = matches[replaceCount++];
                const face = this.getFaceByText(faceText);
                // 返回表情的图片名称
                return face.name;

            });
        return res;
    } ,

    htmlToTextForMessage (html) {
        // 图片替换
        const imageReg = /<img\s*src=([\'\"])([A-z\_0-9\/\\\.]+)\1\s*data\-text=(['"])([A-z0-9\-_\u4e00-\u9fa5]+)\3\s*class=(['"])image\s*face\5\s*>/g;
        // 连接替换
        const linkReg = /<a\s*onclick=(\'|\")window\.open\((\'|\")(https?:\/\/[A-z0-9\.\?\&\/\-=]+)\2\);\1\s*class=(\'|\")link\4>(https?:\/\/[A-z0-9\.\?\&\/\-=]+)<\/a>/g;
        let res = html.replace(imageReg , '$4');
            res = res.replace(linkReg , '$3');
        return res;
    } ,

    // 获取表情数据
    getFaceByText (text) {
        for (let i = 0; i < Face.length; ++i)
        {
            const cur = Face[i];
            if (text == cur.text) {
                return cur;
            }
        }
        return false;
    } ,

    getImageByText (text) {
        const face = this.getFaceByText(text);
        const html = '<img src="file/face/__replace_face__.png" data-text="__replace_text__" class="image face">';
        const faceReg = /(__replace_face__)/g;
        const textReg = /__replace_text__/g;
        let res = html.replace(faceReg , face.name);
        res = res.replace(textReg , face.text);
        return html;
    } ,

    // 文件上传
    fileUpload (formData , successEvent , errorEvent , progressEvent , loadEvent) {
        return G.ajax({
            url: topContext.urlForUpload ,
            method: 'post' ,
            data: formData ,
            success (res) {
                res = G.jsonDecode(res);
                successEvent(res);
            } ,
            error: errorEvent ,
            // 上传事件
            uProgress: progressEvent ,
            // 上传完成后
            uLoad: loadEvent ,
        });
    } ,

    sizeConvert (byte) {
        let limit = byte;
        let size = "";
        if(limit < 0.1 * 1024){                            //小于0.1KB，则转化成B
            size = limit.toFixed(2) + "B"
        }else if(limit < 0.1 * 1024 * 1024){            //小于0.1MB，则转化成KB
            size = (limit/1024).toFixed(2) + "KB"
        }else if(limit < 0.1 * 1024 * 1024 * 1024){        //小于0.1GB，则转化成MB
            size = (limit/(1024 * 1024)).toFixed(2) + "MB"
        }else{                                            //其他转化成GB
            size = (limit/(1024 * 1024 * 1024)).toFixed(2) + "GB"
        }
        let sizeStr = size + "";                        //转成字符串
        let index = sizeStr.indexOf(".");                    //获取小数点处的索引
        let dou = sizeStr.substr(index + 1 ,2);           //获取小数点后两位的值
        if (dou == "00") {                                //判断后两位是否为00，如果是则删除00
            return sizeStr.substring(0, index) + sizeStr.substr(index + 3, 2);
        }
        return size;
    } ,

    // 过滤掉 html 中的 div 和 br 换行符
    stripTags (html) {
        // console.log('原始 html' , html);
        // 过滤掉成对的标签
        const regForDouble = /<(?!a)(.+?)\s*.*?>(.*?)<\/\1>/g;
        // const regForSingle = /<(.+?)>/g;
        const regForSingleExcludeImg = /<(?!img).*?>/g;
        const regForStyle = /style=(").*?\1/g;
        const regForSpace = /&nbsp;/g;
        const regForWrap = /\n|\r|\n\r/g;
        const regForBr = /<br.*?>/g;
        const regForLastWhiteSpaceLetter = /(\n|\r|\r\n)*$/;
        let res = html.replace(regForDouble , "$2\n");
            res = res.replace(regForWrap , '\n');
            res = res.replace(regForBr , '\n');
            res = res.replace(regForSingleExcludeImg , '');
            res = res.replace(regForStyle , ' ');
            res = res.replace(regForLastWhiteSpaceLetter , '');
            // res = res.replace(regForSpace , ' ');
        // window.lastStr = res;
        return res;
    } ,

    // 过滤掉图片 和 截图
    stripImageAndFile (html) {
        const regForImage = '';
    } ,

    stripFromClipboard (html) {
        const reg = /<\!--StartFragment-->(.*?)<\!--EndFragment-->/;
        const matches = html.match(reg);
        if (G.isNull(matches)) {
            return html;
        }
        if (matches.length != 2) {
            return html;
        }
        const regForDouble = /<(.+?)>(.*)<\/\1>/g;
        const regForExcludeImg = /<(?!img).*?>/g;
        const regForStyle = /style=(").*?\1/g;
        const regForSpace = /&nbsp;/g;
        html = matches[1];
        let res = html.replace(regForDouble , '$2');
            res = res.replace(regForExcludeImg , '');
            res = res.replace(regForSpace , '');
            res = res.replace(regForStyle , '');
        return res;
    } ,

};
