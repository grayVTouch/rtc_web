/**
 * **********************
 * Aes 加密解密
 * **********************
 */
const Aes = {
    // 向量-这边使用 128bit-cbc 加密|解密，为了避免补位，请务必使用 16 位的值
    iv: CryptoJS.enc.Utf8.parse('ards423j32k4h423') ,

    /**
     * 加密
     * @param key 由于这边采用 128bit-cbc 加密|解密 为了避免补位，请直接用16位的秘钥
     * @param val
     * @returns {string}
     */
    enc (key , val) {
        key = CryptoJS.enc.Utf8.parse(key);
        const option = {
            iv: this.iv ,
            mode: CryptoJS.mode.CBC ,
            padding: CryptoJS.pad.Pkcs7
        };
        let enc = CryptoJS.AES.encrypt(val , key , option);
        enc = enc.toString();
        return enc;
    } ,

    /**
     * 解密
     *
     * @param key 由于这边采用 128bit-cbc 加密|解密 为了避免补位，请直接用16位的秘钥
     * @param val
     * @returns {string}
     */
    dec (key , val) {
        key =  CryptoJS.enc.Utf8.parse(key);
        const option = {
            iv: this.iv ,
            mode: CryptoJS.mode.CBC ,
            padding: CryptoJS.pad.Pkcs7
        };
        let dec = CryptoJS.AES.decrypt(val , key , option);
        dec = dec.toString(CryptoJS.enc.Utf8);
        return dec;
    } ,
};