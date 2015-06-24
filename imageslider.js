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
 * requestAnimationFrame メソッドの使用準備
 */
(function () {
    var requestAnimationFrame = window.requestAnimationFrame
                             || window.mozRequestAnimationFrame
                             || window.webkitRequestAnimationFrame
                             || window.msRequestAnimationFrame;
    window.requestAnimationFrame = requestAnimationFrame;
})();

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
    // スライダースクロール位置に係るタイマー ID
    var _sliderScrollLeftTimerId;


    /**
     * 画像 URL を追加します。
     */
    this.addImageUrl = function (imageUrl) {
        // 画像要素の作成
        var imageElem = document.createElement('img');
        function img_onLoad() {
            this.dataset.isLoaded = 1;
            imageElem.removeEventListener('load', img_onLoad);
        }
        imageElem.addEventListener('load', img_onLoad);
        if (imageUrl) {
            imageElem.src = imageUrl;
        }
        //var divElem = document.createElement('div');
        //divElem.appendChild(imageElem);

        // 画像要素の追加
        //thisObj.addImageElement(divElem);
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
     * 表示対象のスライド画像のインデックスを変更します。
     */
    this.setIndex = function (index, animation) {
        console.log('setIndex: ' + index + ', animation:' + animation);
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
            clearInterval(_sliderScrollLeftTimerId);
            _sliderScrollLeftTimerId = scrollLeft(imageContainer, toLeft, animation ? 200 : 0);

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
        for (var i = 0, len = _imageElements.length; i < len; i++) {
            var imgElem = _imageElements[i];
            var offsetLeft = imgElem.offsetLeft;
            var offsetRight = offsetLeft + imgElem.offsetWidth;
            if (targetX > offsetLeft && targetX < offsetRight) {
                return i;
            }
        }
        return -1;
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
            clearInterval(_sliderScrollLeftTimerId);
            _sliderScrollLeftTimerId = null;

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
            clearInterval(_sliderScrollLeftTimerId);
            _sliderScrollLeftTimerId = scrollLeftMomentum(imageContainer, vx, 1000, {
                minVelocity: .5,
                onCompleted: function () {
                    var targetCenterX = imageContainer.scrollLeft + imageContainer.clientWidth / 2;
                    var interval = imageContainer.clientWidth * .25;

                    var targetX = targetCenterX + ((vx > 0) ? -interval : interval);
                    var index = getIndexAt(targetX);
                    if (index < 0) {
                        index = (vx > 0) ? 0 : _imageElements.length - 1;
                    }
                    thisObj.setIndex(index, true);
                },
            });

            // タッチイベントを解除
            imageContainer.removeEventListener(TOUCH_MOVE_EVENT, onTouchMove);
            imageContainer.removeEventListener(TOUCH_END_EVENT, onTouchEnd);
        }
    })();
});

/**
 * 指定した初速で慣性スクロールを行います。
 */
function scrollLeftMomentum(target, vx, duration, options) {
    if (typeof (options.minVelocity) === 'undefined') {
        options.minVelocity = .03;
    }
    if (typeof (options.maxVelocity) === 'undefined') {
        options.maxVelocity = 10;
    }
    if (typeof (options.fps) === 'undefined') {
        options.fps = 60;
    }

    // 慣性スクロール初速算出
    vx = (vx < -options.maxVelocity) ? -options.maxVelocity :
         (vx > options.maxVelocity) ? options.maxVelocity :
         vx;
    console.log('vx: ' + vx);

    var animationInterval = 1000 / options.fps;
    var count = duration / animationInterval;
    var ti = 0;
    var prevScrollLeft;
    var timerId = setInterval(function () {
        var scrollLeft = target.scrollLeft;
        if (++ti >= count || prevScrollLeft === scrollLeft || Math.abs(vx) < options.minVelocity) {
            clearInterval(timerId);
            if (options.onCompleted) {
                options.onCompleted.apply(window);
            }
        } else {
            prevScrollLeft = scrollLeft;
            target.scrollLeft = scrollLeft - vx * animationInterval;

            // 慣性スクロール速度を減衰
            vx *= .95;
        }
    }, animationInterval);
    return timerId;
}

/**
 * 指定したポジションまでアニメーションスクロールします。
 */
function scrollLeft(target, toLeft, duration) {
    console.log('scrollLeft: ' + toLeft + ', duration:' + duration);
    if (duration) {
        var FPS = 60;

        var fromLeft = target.scrollLeft;
        var animationInterval = 1000 / FPS;
        var count = duration / animationInterval;
        var step = (toLeft - fromLeft) / count;
        var ti = 0;
        var timerId = setInterval(function () {
            if (++ti < count) {
                target.scrollLeft += step;
            } else {
                clearInterval(timerId);
                target.scrollLeft = toLeft;
            }
        }, animationInterval);
        return timerId;
    } else {
        target.scrollLeft = toLeft;
    }
}
