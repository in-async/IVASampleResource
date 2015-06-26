//var slider = new imageContainer(container);
//slider.setPosition(0);
//slider.addImageUrl(imgUrl);

// ref: http://stackoverflow.com/questions/12606245/detect-if-browser-is-running-on-an-android-or-ios-device
var isMobile = {
    Android: function () {
        return /Android/i.test(navigator.userAgent);
    },
    BlackBerry: function () {
        return /BlackBerry/i.test(navigator.userAgent);
    },
    iOS: function () {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent);
    },
    Windows: function () {
        return /IEMobile/i.test(navigator.userAgent);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
    }
};

/**
 * Easing クラス
 */
var Easing = {
    linear: function (t, b, c, d) {
        return c * t / d + b;
    },

    easeOutCubic: function (t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t + 1) + b;
    },

    easeOutQuint: function (t, b, c, d) {
        t /= d;
        t--;
        return c * (t * t * t * t * t + 1) + b;
    },
};

/**
 * requestAnimationFrame メソッドの使用準備
 */
var RAFTimer = (function (_callback) {
    var _requestAnimationFrame = window.requestAnimationFrame
                              || window.mozRequestAnimationFrame
                              || window.webkitRequestAnimationFrame
                              || window.msRequestAnimationFrame
                              || setTimeout;
    var _interval = 1000 / 60;
    var _enabled = false;
    var _startTime = null;
    var _this = this;

    this.start = function () {
        if (_enabled) return;

        _enabled = true;
        _startTime = Date.now();
        function step() {
            if (_enabled) {
                _requestAnimationFrame(step, _interval);
            }
            var elapsed = Date.now() - _startTime;
            _callback(_this, elapsed);
        }
        _requestAnimationFrame(step, _interval);

        return _this;
    };

    this.stop = function () {
        _enabled = false;
    };
});

/**
 * 複数画像をスワイプする為のクラス
 */
var ImageSlider = (function (imageContainer, options) {
    var thisObj = this;
    imageContainer.className += ' image-slider';

    // 引数の検証
    if (!options) {
        options = {};
    }
    if (!options.imageTagName) {
        options.imageTagName = 'div';
    }

    // 現在表示されている画像インデックス
    var _currentIndex = -1;
    // スライド対象となる画像要素配列
    var _imageElements = [];
    // スライダースクロール位置に係るタイマー
    var _sliderScrollLeftTimer;


    /**
     * 画像 URL を追加します。
     */
    this.addImageUrl = function (imageUrl) {
        // 画像要素を作成
        var imageElem = document.createElement('img');
        function img_onLoad() {
            this.removeEventListener('load', img_onLoad);
            this.dataset.isLoaded = 1;

            var iw = this.width;
            var ih = this.height;
            if (iw > ih) {
                // 270°回転させた画像を生成
                var cw = ih;
                var ch = iw;
                var canvas = document.createElement('canvas');
                canvas.setAttribute('width', cw);
                canvas.setAttribute('height', ch);
                var context = canvas.getContext('2d');
                context.fillStyle = "#fff";
                context.fillRect(0, 0, cw, ch);
                var rad = 270 * Math.PI / 180;
                context.translate(cw / 2, ch / 2);
                context.rotate(rad);
                context.translate(-ch / 2, -cw / 2);
                context.drawImage(this, 0, 0, iw, ih);

                // 生成した画像（キャンバス）を img に代わり追加
                replaceImageElement(canvas, this);
            }
        }
        imageElem.addEventListener('load', img_onLoad);
        if (imageUrl) {
            // 画像リソースをロード
            imageElem.src = imageUrl;
        }

        // 画像要素を追加
        thisObj.addImageElement(imageElem);

        return imageElem;
    };

    /**
     * 画像要素を追加します。
     */
    this.addImageElement = function (imageElem) {
        imageElem.className += ' image-slider-item';
        if (imageContainer.contains(imageElem)) {
            imageContainer.appendChild(imageElem);

            // アイテム順序が変わったので、再描画
            thisObj.setIndex(_currentIndex);
        } else {
            imageContainer.appendChild(imageElem);
        }
        _imageElements.push(imageElem);

        // 現在のスワイプ画像インデックスが負値だった場合、最初のスワイプ画像を表示状態にする
        if (_currentIndex < 0) {
            thisObj.setIndex(0);
        }
    };

    /**
     * 画像要素を別の要素に置換します。
     */
    function replaceImageElement(newElem, oldElem) {
        newElem.className = oldElem.className;
        oldElem.parentElement.replaceChild(newElem, oldElem);
        _imageElements[_imageElements.indexOf(oldElem)] = newElem;
    }

    /**
     * 表示対象のスライド画像のインデックスを変更します。
     */
    this.setIndex = function (index, duration) {
        console.log('setIndex: ' + index + ', duration:' + duration);
        duration = !duration ? 0 :
                   (duration === true) ? 600 :
                   duration;
                   
        // 指定したスライド画像インデックスが画像配列数を上回っていたら、代わりに最後尾を指定
        if (index >= _imageElements.length) {
            index = _imageElements.length - 1;
        }

        // インデックスを更新
        var indexChanged = (_currentIndex != index);
        _currentIndex = index;

        // スライド対象画像が１件もなければ何もしない
        if (_currentIndex < 0) return;

        // アクティブマークを付与
        var imgElem = _imageElements[_currentIndex];
        setActiveClass(imgElem);

        // 対象画像がスライダーのビューポート中央に表示されるようスクロール（アクティブ化）
        var scrollFunc = function () {
            var toLeft = imgElem.offsetLeft - imageContainer.clientWidth / 2 + imgElem.offsetWidth / 2;
            console.log({ toLeft: toLeft, "imgElem.offsetWidth": imgElem.offsetWidth });
            //clearInterval(_sliderScrollLeftTimer);
            if (_sliderScrollLeftTimer) _sliderScrollLeftTimer.stop();
            _sliderScrollLeftTimer = scrollLeft(imageContainer, toLeft, duration, Easing.easeOutQuint);

            // イベント解除
            this.removeEventListener('load', scrollFunc);
        }
        console.log({ "imgElem.dataset.isLoaded": imgElem.dataset.isLoaded });
        if (imgElem.tagName.toLowerCase() !== 'img' || imgElem.dataset.isLoaded) {
            scrollFunc();
        } else {
            imgElem.addEventListener('load', scrollFunc);
        }
    };

    this.refresh = function () {
        console.log('refresh');
        for (var i in _imageElements) {
            var imgElem = _imageElements[i];
            var imgs = imgElem.getElementsByTagName('img');
            if (imgs && imgs.length > 0) {
                var w = imgs[0].style.width;
                imgs[0].style.width = '1px';
                imgs[0].style.width = w;
            }
        }
        //_imageElements[_currentIndex].className += ' active';
    };

    /**
     *  スライド対象画像のうち、指定した要素をアクティブとしてマークします。
     */
    function setActiveClass(target) {
        for (var i in _imageElements) {
            var imgElem = _imageElements[i];
            if (imgElem === target) {
                if (imgElem.className.indexOf('active') < 0) {
                    imgElem.className += ' active';
                }
            } else {
                imgElem.className = imgElem.className.replace(' active', '');
            }
        }
    }

    /**
     * 指定した座標に位置する画像インデックスを返します。
     */
    function getIndexAt(targetX) {
        if (_imageElements.length === 0) return -1;

        if (targetX < _imageElements[0].offsetLeft) {
            return 0;
        }
        for (var i = 0, len = _imageElements.length; i < len; i++) {
            var imgElem = _imageElements[i];
            var offsetLeft = imgElem.offsetLeft;
            var offsetRight = offsetLeft + imgElem.offsetWidth;
            //console.log('index: ' + i + ', offsetLeft: ' + offsetLeft + ', offsetRight: ' + offsetRight);
            if (targetX > offsetLeft && targetX < offsetRight) {
                return i;
            }
        }
        return _imageElements.length - 1;
    }

    //function getCenterViewElement() {
    //    var centerX = imageContainer.scrollLeft + imageContainer.clientWidth / 2;
    //    var index = getIndexAt(centerX);
    //    return (index >= 0) ? _imageElements[index] : null;
    //}

    window.addEventListener("orientationchange", function () {
        console.log('orientationchange');
    });
    window.addEventListener("resize", function () {
        console.log('resize');
        //thisObj.setIndex(_currentIndex);
        setTimeout(function () {
            thisObj.setIndex(_currentIndex);
        }, 0);
        //if (window.innerHeight > window.innerWidth) {
        //    // ポートレイト（ランドスケープ）
        //} else {
        //    // ランドスケープ（ポートレイト）
        //};
    });

    (function () {
        /**
         * スライド中に使用する内部フィールド
         */
        var imageCount;
        var touchStartScrollLeft = null;
        var touchStartX = null;
        var touchMoveX = null;
        var touchMoveX2 = null;
        var touchMoveX3 = null;
        var touchMoveTime = null;
        var touchMoveTime2 = null;
        var touchMoveTime3 = null;


        /**
         * スライド開始イベントの登録
         */
        var TOUCH_START_EVENT, TOUCH_MOVE_EVENT, TOUCH_END_EVENT;
        if (isMobile.any()) {
            TOUCH_START_EVENT = 'touchstart';
            TOUCH_MOVE_EVENT = 'touchmove';
            TOUCH_END_EVENT = 'touchend';
        } else {
            TOUCH_START_EVENT = 'mousedown';
            TOUCH_MOVE_EVENT = 'mousemove';
            TOUCH_END_EVENT = 'mouseup';
        }
        imageContainer.addEventListener(TOUCH_START_EVENT, onTouchStart);

        /**
         * スライド開始イベント
         */
        function onTouchStart() {
            console.log('onTouchStart');
            // フィールド初期化
            touchStartX = touchMoveX = touchMoveX2 = touchMoveX3 = null;
            imageCount = _imageElements.length;

            // スライダーに係るタイマーのクリア
            //clearInterval(_sliderScrollLeftTimerId);
            if (_sliderScrollLeftTimer) _sliderScrollLeftTimer.stop();
            _sliderScrollLeftTimer = null;

            // タッチ位置を保持
            touchStartX = touchMoveX = touchMoveX2 = touchMoveX3 = event.touches ? event.touches[0].pageX : event.pageX;
            touchMoveTime = touchMoveTime2 = touchMoveTime3 = Date.now();
            touchStartScrollLeft = imageContainer.scrollLeft;

            // タッチイベントを登録
            imageContainer.addEventListener(TOUCH_MOVE_EVENT, onTouchMove);
            imageContainer.addEventListener(TOUCH_END_EVENT, onTouchEnd);
        }
        /**
         * スライド中イベント
         */
        function onTouchMove() {
            console.log('onTouchMove');
            //event.preventDefault();

            // 現在のタッチ位置を保持
            touchMoveX3 = touchMoveX2;
            touchMoveX2 = touchMoveX;
            touchMoveX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
            touchMoveTime3 = touchMoveTime2;
            touchMoveTime2 = touchMoveTime;
            touchMoveTime = Date.now();

            //if (now - touchMoveTime < 30) return;

            // スライド移動量の算出
            var dx = (touchMoveX - touchStartX);
            //console.log('dx: ' + dx);
            if (dx > 0 && _currentIndex === 0 || dx < 0 && _currentIndex === imageCount - 1) {
                // 範囲外へのスライドはバウンド挙動に
                dx *= .3;
            }

            // スクロール
            imageContainer.scrollLeft = touchStartScrollLeft - dx;
        }
        /**
         * スライド終了イベント
         */
        function onTouchEnd() {
            console.log('onTouchEnd');
            ////event.preventDefault();

            // フリックの速度を算出
            var touchEndX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
            var dx = (touchEndX - touchMoveX3);
            var vx = dx / (Date.now() - touchMoveTime3);

            // スライダを慣性スクロールさせる
            //clearInterval(_sliderScrollLeftTimerId);
            if (_sliderScrollLeftTimer) _sliderScrollLeftTimer.stop();
            //_sliderScrollLeftTimer = scrollLeftMomentum(imageContainer, vx, 600, {
            //    minVelocity: .5,
            //    onCompleted: function () {
            //        var targetCenterX = imageContainer.scrollLeft + imageContainer.clientWidth / 2;
            //        var interval = imageContainer.clientWidth * .25;

            //        var targetX = targetCenterX + ((vx > 0) ? -interval : interval);
            //        var index = getIndexAt(targetX);
            //        if (index < 0) {
            //            index = (vx > 0) ? 0 : _imageElements.length - 1;
            //        }
            //        thisObj.setIndex(index, true);
            //    },
            //});
            var duration = 600;
            var targetLeft = imageContainer.scrollLeft - vx * duration / 5;
            var index = getIndexAt(targetLeft + imageContainer.clientWidth / 2);
            if (_currentIndex === index) {
                if (index > 0 && vx > 0) {
                    index--;
                } else if (index < imageCount - 1 && vx < 0) {
                    index++;
                }
            }
            thisObj.setIndex(index, duration);

            // タッチイベントを解除
            imageContainer.removeEventListener(TOUCH_MOVE_EVENT, onTouchMove);
            imageContainer.removeEventListener(TOUCH_END_EVENT, onTouchEnd);
        }
    })();

//    /**
//     * 指定した初速で慣性スクロールを行います。
//     */
//    function scrollLeftMomentum(target, vx, duration, options) {
//        console.log('scrollLeftMomentum');

//        if (typeof (options.minVelocity) === 'undefined') {
//            options.minVelocity = .03;
//        }
//        if (typeof (options.maxVelocity) === 'undefined') {
//            options.maxVelocity = 10;
//        }
//        if (typeof (options.fps) === 'undefined') {
//            options.fps = 60;
//        }

//        // 慣性スクロール初速算出
//        //vx = (vx < -options.maxVelocity) ? -options.maxVelocity :
//        //     (vx > options.maxVelocity) ? options.maxVelocity :
//        //     vx;
//        console.log('vx: ' + vx + ', duration: ' + duration);

//        var animationInterval = 1000 / options.fps;
//        var count = duration / animationInterval;
//        var ti = 0;
//        var prevScrollLeft;
//        //var timerId = setInterval(function () {
//        //    var scrollLeft = target.scrollLeft;
//        //    if (++ti >= count || prevScrollLeft === scrollLeft || Math.abs(vx) < options.minVelocity) {
//        //        clearInterval(timerId);
//        //        if (options.onCompleted) {
//        //            options.onCompleted.apply(window);
//        //        }
//        //    } else {
//        //        prevScrollLeft = scrollLeft;
//        //        target.scrollLeft = scrollLeft - vx * animationInterval;

//        //        // 慣性スクロール速度を減衰
//        //        vx *= .95;
//        //    }
//        //}, animationInterval);
//        //return timerId;

//        //var imageCount = _imageElements.length;
//        //var prevElapsed = 0;
//        //var timer = new RAFTimer(function (timer, elapsed) {
//        //    console.log('elapsed: ' + elapsed);
//        //    var scrollLeft = target.scrollLeft;
//        //    if (elapsed >= duration || prevScrollLeft === scrollLeft || Math.abs(vx) < options.minVelocity) {
//        //        timer.stop();
//        //        if (options.onCompleted) {
//        //            options.onCompleted.apply(window);
//        //        }
//        //    } else {
//        //        if (vx > 0 && _currentIndex === 0 || vx < 0 && _currentIndex === imageCount - 1) {
//        //            // 範囲外へのスライドはバウンド挙動に
//        //            vx *= .3;
//        //        } else {
//        //            // 慣性スクロール速度を減衰
//        //            vx *= .95;
//        //        }
//        //        prevScrollLeft = scrollLeft;
//        //        target.scrollLeft = scrollLeft - vx * (elapsed - prevElapsed);
//        //        prevElapsed = elapsed;
//        //    }
//        //}).start();
//        //return timer;

//        var fromLeft = target.scrollLeft;
//        var targetLeft = fromLeft - vx * duration / 10;
//        var index = getIndexAt(targetLeft + imageContainer.clientWidth / 2);
//        if (index < 0) {
//            //index = (vx > 0) ? 0 : _imageElements.length - 1;
//            index = (targetLeft < 0) ? 0 : _imageElements.length - 1;
//        }
//        var imgElem = _imageElements[index];
//        console.log('fromLeft: ' + fromLeft + ', targetLeft: ' + targetLeft + ', targetIndex: ' + index);
//        var toLeft = imgElem.offsetLeft - imageContainer.clientWidth / 2 + imgElem.offsetWidth / 2;
//        var changeInValue = toLeft - fromLeft;

//        var imageCount = _imageElements.length;
//        var prevElapsed = 0;
//        var timer = new RAFTimer(function (timer, elapsed) {
//            //            console.log('elapsed: ' + elapsed);
//            var left = easeOutCubic(elapsed, fromLeft, changeInValue, duration);
//            target.scrollLeft = left;
////            console.log('easeOutCubix(' + elapsed + ', ' + fromLeft + ', ' + changeInValue + ', ' + duration + '): ' + left);

//            if (elapsed >= duration || prevScrollLeft === scrollLeft || Math.abs(vx) < options.minVelocity) {
//                timer.stop();
//                if (options.onCompleted) {
//                    options.onCompleted.apply(window);
//                }
//            } else {
//            }
//        }).start();
//        return timer;
//    }
});

/**
 * 指定したポジションまでアニメーションスクロールします。
 */
function scrollLeft(target, toLeft, duration, easing) {
    console.log('scrollLeft');
    console.log('scrollLeft: ' + toLeft + ', duration:' + duration + ', easing: ' + easing);

    //if (duration) {
    //    var FPS = 60;

    //    var fromLeft = target.scrollLeft;
    //    //var animationInterval = 1000 / FPS;
    //    //var count = duration / animationInterval;
    //    //var step = (toLeft - fromLeft) / count;
    //    //var ti = 0;
    //    //var timerId = setInterval(function () {
    //    //    if (++ti < count) {
    //    //        target.scrollLeft += step;
    //    //    } else {
    //    //        clearInterval(timerId);
    //    //        target.scrollLeft = toLeft;
    //    //    }
    //    //}, animationInterval);
    //    //return timerId;
    //    var timer = new RAFTimer(function (timer, elapsed) {
    //        console.log('elapsed: ' + elapsed);
    //        if (elapsed < duration) {
    //            target.scrollLeft = fromLeft + (toLeft - fromLeft) * (elapsed / duration);
    //        } else {
    //            timer.stop();
    //            target.scrollLeft = toLeft;
    //        }
    //    }).start();
    //    return timer;
    //} else {
    //    target.scrollLeft = toLeft;
    //}

    if (duration) {
        if (!easing) {
            easing = Easing.linear;
        }

        var fromLeft = target.scrollLeft;
        var changeInValue = toLeft - fromLeft;
        var timer = new RAFTimer(function (timer, elapsed) {
            if (elapsed < duration) {
                target.scrollLeft = easing(elapsed, fromLeft, changeInValue, duration);
            } else {
                timer.stop();
                target.scrollLeft = toLeft;
            }
        }).start();
        return timer;
    } else {
        target.scrollLeft = toLeft;
    }
}
