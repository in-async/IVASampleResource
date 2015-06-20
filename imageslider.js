//var slider = new imageSlider(container);
//slider.setPosition(0);
//slider.addImageUrl(imgUrl);

/**
 * 複数画像をスワイプする為のクラス
 */
var ImageSlider = (function (imageSlider, options) {
    var thisObj = this;
    
    // 引数の検証
    imageSlider.className += ' image-slider';
    if (!options) {
        options = {};
    }
    if (!options.imageTagName) {
        options.imageTagName = 'div';
    }

    // 現在表示されている画像インデックス
    var _currentIndex = -1;
    // スワイプ対象となる画像要素配列
    var _imageElements = [];

    //var imageContainer = document.createElement('div');
    //imageContainer.setAttribute('class', 'container');
    //imageSlider.appendChild(imageContainer);
    var imageContainer = imageSlider;

    var _sliderScrollLeftTimerId;


    /**
     * 画像 URL を追加します。
     */
    this.addImageUrl = function (imageUrl) {
        // 画像要素の作成
        var imageElem = document.createElement('img');
        imageElem.src = imageUrl;
        imageContainer.appendChild(imageElem);

        // 画像要素の追加
        thisObj.addImageElement(imageElem);
    };

    /**
     * 画像要素を追加します。
     */
    this.addImageElement = function (imageElem) {
        console.log(imageElem);
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
        console.log('setIndex');
        // 指定したスライド画像インデックスが画像配列数を上回っていたら、代わりに最後尾を指定
        if (index >= _imageElements.length) {
            index = _imageElements.length - 1;
        }

        // インデックスを更新
        var indexChanged = (_currentIndex != index);
        _currentIndex = index;

        // スライド対象画像が１件もなければ何もしない
        if (_currentIndex < 0) return;

        //if (indexChanged) {
        //    //// 全ての画像要素のクラスを初期化
        //    //for (var i = 0, len = _imageElements.length; i < len; i++) {
        //    //    if (i === index) {
        //    //        _imageElements[index].className = 'fadeIn';
        //    //    } else {
        //    //        _imageElements[i].className = '';
        //    //    }
        //    //}
        //    //imageContainer.style.left = -imgElem.offsetLeft + 'px';
        //}

        // 対象画像がスライダーのビューポート中央に表示されるようスクロール（アクティブ化）
        var imgElem = _imageElements[_currentIndex];
        var toLeft = imgElem.offsetLeft - imageSlider.clientWidth / 2 + imgElem.offsetWidth / 2;
        clearInterval(_sliderScrollLeftTimerId);
        _sliderScrollLeftTimerId = scrollLeft(imageSlider, toLeft, animation? 200: 0);

        // アクティブマークを付与
        setActiveClass(imgElem);
    };

    /**
     *  スライド対象画像のうち、指定した要素をアクティブとしてマークします。
     */
    function setActiveClass(target) {
        for (var i in _imageElements) {
            var imgElem = _imageElements[i];
            imgElem.className = (imgElem == target) ? 'active' : '';
        }
    }

    //var _isTapped = false;
    //var _scrollTimerId;
    //var _reservedSetIndexTimerId;
    //imageContainer.addEventListener('scroll', function () {
    //    if (_isTapped) return;

    //    console.log('scroll');
    //    clearTimeout(_scrollTimerId);
    //    clearTimeout(_reservedSetIndexTimerId);
    //    _scrollTimerId = setTimeout(function () {
    //        if (_autoScrollTimerId) {
    //            clearInterval(_autoScrollTimerId);
    //            _autoScrollTimerId = null;
    //        }

    //        var curElem = getCenterViewElement();
    //        var index = _imageElements.indexOf(curElem);
    //        thisObj.setIndex(index, true);
    //    }, 50);
    //});

    function getCenterViewElement() {
        var centerX = imageContainer.scrollLeft + imageContainer.clientWidth / 2;
        for (var i = 0, len = _imageElements.length; i < len; i++) {
            var imgElem = _imageElements[i];
            var offsetLeft = imgElem.offsetLeft;
            var offsetRight = offsetLeft + imgElem.offsetWidth;
            if (centerX > offsetLeft && centerX < offsetRight) {
                return imgElem;
            }
        }
        return null;
    }

    //window.addEventListener("orientationchange", function () {
    //    console.log('orientationchange');
    //    thisObj.setIndex(_currentIndex);
    //});
    window.addEventListener("resize", function () {
        console.log('resize');
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
         * スワイプ中に使用する内部フィールド
         */
        var touchStartScrollLeft = null;
        var touchStartX = null;
        var touchMoveX = null;
        var touchMoveX2 = null;
        var touchMoveX3 = null;
        var touchMoveTime = null;
        var touchMoveTime2 = null;
        var touchMoveTime3 = null;
        //var containerWidth = null;
        //var curElem = null;
        //var prevElem = null;
        //var nextElem = null;


        /**
         * スワイプ開始イベントの登録
         */
        imageContainer.addEventListener('touchstart', onTouchStart);
        //imageContainer.addEventListener('mousedown', onTouchStart);

        /**
         * スワイプ開始イベント
         */
        function onTouchStart() {
            console.log('onTouchStart');
            // フィールド初期化
            touchStartX = touchMoveX = touchMoveX2 = touchMoveX3 = null;
            //curElem = prevElem = nextElem = null;

            // スライダーに係るタイマーのクリア
            clearInterval(_sliderScrollLeftTimerId);
            _sliderScrollLeftTimerId = null;

            //// コンテナ幅を保持
            //containerWidth = imageContainer.offsetWidth;
            // タッチ位置を保持
            touchStartX = touchMoveX = touchMoveX2 = touchMoveX3 = event.touches ? event.touches[0].pageX : event.pageX;
            touchMoveTime = touchMoveTime2 = touchMoveTime3 = Date.now();
            touchStartScrollLeft = imageContainer.scrollLeft;

            //var prevIndex = (_currentIndex === 0) ? _imageElements.length - 1 : _currentIndex - 1;
            //var nextIndex = (_currentIndex + 1 >= _imageElements.length) ? 0 : _currentIndex + 1;

            //// 対象となる画像要素とその前後要素を保持
            //if (_imageElements.length > 2) {
            //    prevElem = _imageElements[prevIndex];
            //    prevElem.className = 'swipe';
            //    prevElem.style.left = -containerWidth + 'px';
            //}
            //curElem = _imageElements[_currentIndex];
            //curElem.style.left = 0;
            //curElem.className = 'swipe';
            //if (true) {
            //    nextElem = _imageElements[nextIndex];
            //    nextElem.className = 'swipe';
            //    nextElem.style.left = containerWidth + 'px';
            //}
            //console.log({ prevElem: prevElem, curElem: curElem, nextElem: nextElem });

            // タッチ・マウスイベントを登録
            // register touchmove / mousemove
            imageContainer.addEventListener('touchmove', onTouchMove);
            //imageContainer.addEventListener('mousemove', onTouchMove);
            // register touchend / mouseup / mouseout
            imageContainer.addEventListener('touchend', onTouchEnd);
            //imageContainer.addEventListener('mouseup', onTouchEnd);
            //imageContainer.addEventListener('mouseout', onTouchEnd);
        }
        /**
         * スワイプ中イベント
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

            // スワイプ移動量の算出
            var dx = (touchMoveX - touchStartX);
            //console.log('dx: ' + dx);
            //if (dx > 0 && _currentIndex > 0 || dx < 0 && _currentIndex < _imageElements.length - 1) {
            //} else {
            //    // 範囲外へのスワイプはバウンド挙動に
            //    dx *= .3;
            //}

            //// スワイプ移動量分、画像要素を移動
            //if (prevElem) {
            //    prevElem.style.left = -containerWidth + dx + 'px';
            //}
            //curElem.style.left = dx + 'px';
            //if (nextElem) {
            //    nextElem.style.left = containerWidth + dx + 'px';
            //}
            imageContainer.scrollLeft = touchStartScrollLeft - dx;
        }
        /**
         * スワイプ終了イベント
         */
        function onTouchEnd() {
            console.log('onTouchEnd');
            ////event.preventDefault();

            //// 移動量の判定
            //var indexChanged = false;
            //if (touchStartX > touchMoveX) {
            //    if (touchStartX > (touchMoveX + 50)) {
            //        //右から左に指が移動した場合
            //        console.log({ msg: 'swipe ←', touchStartX: touchStartX, touchMoveX: touchMoveX });
            //        if (nextElem) {
            //            ++_currentIndex;
            //            if (_currentIndex >= _imageElements.length) {
            //                _currentIndex = 0;
            //            }
            //            nextElem.className = 'fadeIn';
            //            //curElem.className = 'fadeOut';
            //            indexChanged = true;
            //        }
            //    }
            //} else if (touchStartX < touchMoveX) {
            //    if ((touchStartX + 50) < touchMoveX) {
            //        //左から右に指が移動した場合
            //        console.log({ msg: 'swipe →', touchStartX: touchStartX, touchMoveX: touchMoveX });
            //        if (prevElem) {
            //            --_currentIndex;
            //            if (_currentIndex < 0) {
            //                _currentIndex = _imageElements.length - 1;
            //            }
            //            prevElem.className = 'fadeIn';
            //            //curElem.className = 'fadeOut';
            //            indexChanged = true;
            //        }
            //    }
            //}
            //console.log({ _currentIndex: _currentIndex });

            //// インデックスに変更が無ければ、スライドを元に戻す
            //if (!indexChanged) {
            //    curElem.className = 'fadeIn';
            //} else {
            //    // 縦帯のリフレッシュ
            //    refreshColStripe();
            //}

            // フリックの速度を算出
            var touchEndX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
            var dx = (touchEndX - touchMoveX3);
            var vx = dx / (Date.now() - touchMoveTime3);

            // スライダを慣性スクロールさせる
            clearInterval(_sliderScrollLeftTimerId);
            _sliderScrollLeftTimerId = scrollLeftMomentum(imageSlider, vx, 1000, function () {
                var curElem = getCenterViewElement();
                var index = _imageElements.indexOf(curElem);
                thisObj.setIndex(index, true);
            });

            // タッチ・マウスイベントを解除
            // unregister touchmove / mousemove
            imageContainer.removeEventListener('touchmove', onTouchMove);
            //imageContainer.removeEventListener('mousemove', onTouchMove);
            // unregister touchend / mouseup / mouseout
            imageContainer.removeEventListener('touchend', onTouchEnd);
            //imageContainer.removeEventListener('mouseup', onTouchEnd);
            //imageContainer.removeEventListener('mouseout', onTouchEnd);
        }
    })();
});

function scrollLeft(target, toLeft, duration) {
    if (duration) {
        var fromLeft = target.scrollLeft;
        var interval = 8;
        var count = duration / interval;
        var step = (toLeft - fromLeft) / count;
        var ti = 0;
        var timerId = setInterval(function () {
            if (++ti < count) {
                target.scrollLeft += step;
            } else {
                clearInterval(timerId);
                //_autoScrollTimerId = null;
                //_isAutoScrolling = false;
                target.scrollLeft = toLeft;
            }
        }, interval);
        return timerId;
    } else {
        target.scrollLeft = toLeft;
    }
}

function scrollLeftMomentum(target, vx, duration, completionCallback) {
    var MAX_VELOCITY = 10;
    var ANIMATION_INTERVAL = 10;

    // 慣性スクロール初速算出
    vx = (vx < -MAX_VELOCITY) ? -MAX_VELOCITY :
         (vx > MAX_VELOCITY) ? MAX_VELOCITY :
         vx;
    console.log('vx: ' + vx);

    var count = duration / ANIMATION_INTERVAL;
    var ti = 0;
    var prevScrollLeft;
    var timerId = setInterval(function () {
        var scrollLeft = target.scrollLeft;
        if (++ti >= count || Math.abs(vx) < 0.03 || prevScrollLeft === scrollLeft) {
            clearInterval(timerId);
            if (completionCallback) {
                completionCallback.apply(window);
            }
        } else {
            prevScrollLeft = scrollLeft;
            target.scrollLeft = scrollLeft - vx * ANIMATION_INTERVAL;

            // 慣性スクロール速度を減衰
            vx *= .95;
        }
    }, ANIMATION_INTERVAL);
    return timerId;
}
