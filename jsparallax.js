/*!
 * VERSION: 0.1.0
 * DATE: 2016-8-17
 * GIT:https://github.com/shrekshrek/jstween
 * @author: Shrek.wang
 **/

(function (factory) {

    if (typeof define === 'function' && define.amd) {
        define(['jstween', 'exports'], function(JT, exports) {
            window.JP = factory(exports, JT);
        });
    } else if (typeof exports !== 'undefined') {
        var JT = require('jstween');
        factory(exports, JT);
    } else {
        window.JP = factory({}, window.JT);
    }

}(function (JP, JT) {


    return JP;
}));
