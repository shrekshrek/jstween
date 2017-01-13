/*!
 * VERSION: 0.1.0
 * DATE: 2016-8-17
 * GIT: https://github.com/shrekshrek/jstween
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


    // --------------------------------------------------------------------timeline
    function walkline() {
        this.initialize.apply(this, arguments);
    }

    extend(walkline.prototype, {
        initialize: function () {
            this.labels = [];
            this.labelTime = 0;

            this.anchors = [];
            this.anchorId = 0;

            this.tweens = [];

            this.isPlaying = false;

            this.curTime = 0;

        },


    });


    //---------------------------------------------------------------全局方法
    extend(JP, {
        create: function () {
            return new walkline();
        },
        kill: function (wl) {
            wl.clear();
        }
    });

    return JP;
}));
