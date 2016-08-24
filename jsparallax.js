/*!
 * VERSION: 0.1.0
 * DATE: 2016-8-17
 * GIT:https://github.com/shrekshrek/jstween
 *
 * @author: Shrek.wang, shrekshrek@gmail.com
 **/

(function (factory) {
    var root = (typeof self == 'object' && self.self == self && self) ||
        (typeof global == 'object' && global.global == global && global);

    if (typeof define === 'function' && define.amd) {
        define(['jstween', 'exports'], function (JT, exports) {
            root.JP = factory(root, exports, JT);
        });
    } else if (typeof exports !== 'undefined') {
        var JT = require('jstween');
        factory(root, exports, JT);
    } else {
        root.JP = factory(root, {}, root.JT);
    }

}(function (root, JP, JT) {


    return JP;
}));
