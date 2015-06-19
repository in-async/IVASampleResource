//var swiper = new ImageSwiper(container);
//swiper.setPosition(0);
//swiper.addImageUrl(imgUrl);

/**
 * 複数画像をスワイプする為のクラス
 */
var ImageSwiper = (function (imageSwiper, options) {
    var thisObj = this;

    // 引数の検証
    imageSwiper.className += ' image-swiper';
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
    //imageSwiper.appendChild(imageContainer);
    var imageContainer = imageSwiper;

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

    var _containerWidth = 0;
    /**
     * 画像要素を追加します。
     */
    this.addImageElement = function (imageElem) {
        console.log(imageElem);
        //var offsetWidth = imageElem.offsetWidth;
        //imageElem.style.left = _containerWidth + 'px';
        //_containerWidth += offsetWidth;
        _imageElements.push(imageElem);

        // 現在のスワイプ画像インデックスが負値だった場合、最初のスワイプ画像を表示状態にする
        if (_currentIndex < 0) {
            thisObj.setIndex(0);
        }
    };

    var _activeElementObseveTimerId;
    var _autoScrollTimerId;
    /**
     * 表示対象のスワイプ画像のインデックスを変更します。
     */
    this.setIndex = function (index, animation) {
        console.log('setIndex');
        // 指定したスワイプ画像インデックスが画像配列数を上回っていたら、代わりに最後尾を指定
        if (index >= _imageElements.length) {
            index = _imageElements.length - 1;
        }

        // インデックスを更新
        var indexChanged = (_currentIndex != index);
        _currentIndex = index;

        // スワイプ対象画像が１件もなければ何もしない
        if (_currentIndex < 0) return;

        if (indexChanged) {
            //// 全ての画像要素のクラスを初期化
            //for (var i = 0, len = _imageElements.length; i < len; i++) {
            //    if (i === index) {
            //        _imageElements[index].className = 'fadeIn';
            //    } else {
            //        _imageElements[i].className = '';
            //    }
            //}
            //imageContainer.style.left = -imgElem.offsetLeft + 'px';
        }
        var imgElem = _imageElements[_currentIndex];

        if (animation) {
            (function () {
                var fromLeft = imageSwiper.scrollLeft;
                var toLeft = imgElem.offsetLeft - imageSwiper.clientWidth / 2 + imgElem.offsetWidth / 2;
                var duration = 200;
                var interval = 10;
                var count = duration / interval;
                var step = (toLeft - fromLeft) / count;
                var ti = 0;
                clearInterval(_autoScrollTimerId);
                _autoScrollTimerId = setInterval(function () {
                    if (++ti < count) {
                        imageSwiper.scrollLeft += step;
                    } else {
                        clearInterval(_autoScrollTimerId);
                        _autoScrollTimerId = null;
                        _isAutoScrolling = false;
                        imageSwiper.scrollLeft = toLeft;
                    }
                }, interval);
            })();
        } else {
            imageSwiper.scrollLeft = imgElem.offsetLeft - imageSwiper.clientWidth / 2 + imgElem.offsetWidth / 2;
        }

        clearInterval(_activeElementObseveTimerId);
        setActiveElement(_currentIndex);
    };

    function setActiveElement(index) {
        for (var i in _imageElements) {
            _imageElements[i].removeAttribute('class');
        }
        _imageElements[index].setAttribute('class', 'active');
    }

    var _isTapped = false;
    var _scrollTimerId;
    var _reservedSetIndexTimerId;
    imageContainer.addEventListener('scroll', function () {
        if (_isTapped) return;

        console.log('scroll');
        clearTimeout(_scrollTimerId);
        clearTimeout(_reservedSetIndexTimerId);
        _scrollTimerId = setTimeout(function () {
            if (_autoScrollTimerId) {
                clearInterval(_autoScrollTimerId);
                _autoScrollTimerId = null;
            }

            var curElem = getCenterViewElement();
            var index = _imageElements.indexOf(curElem);
            thisObj.setIndex(index, true);
        }, 50);
    });

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

    imageContainer.addEventListener('touchstart', onTouchStart);
    function onTouchStart() {
        console.log('onTouchStart');
        _isTapped = true;
        clearInterval(_activeElementObseveTimerId);
        imageContainer.addEventListener('touchmove', onTouchMove);
        imageContainer.addEventListener('touchend', onTouchEnd);
    }
    function onTouchMove() {
        console.log('onTouchMove');
        var curElem = getCenterViewElement();
        var index = _imageElements.indexOf(curElem);
        setActiveElement(index);
    }
    function onTouchEnd() {
        console.log('onTouchEnd');
        _isTapped = false;
        _activeElementObseveTimerId = setInterval(function () {
            var curElem = getCenterViewElement();
            var index = _imageElements.indexOf(curElem);
//            thisObj.setIndex(index, true);
            //setActiveElement(index);
            _reservedSetIndexTimerId = setTimeout(function () {
                thisObj.setIndex(index, true);
            }, 100);
        }, 100);
        imageContainer.removeEventListener('touchmove', onTouchMove);
        imageContainer.removeEventListener('touchend', onTouchEnd);
    }

    //(function () {
    //    /**
    //     * スワイプ中に使用する内部フィールド
    //     */
    //    var touchStartScrollLeft = null;
    //    var touchStartX = null;
    //    var touchMoveX = null;
    //    var containerWidth = null;
    //    var curElem = null;
    //    var prevElem = null;
    //    var nextElem = null;

    //    var touchMoveTime = null;
    //    var momentumScrollTimerId;

    //    /**
    //     * スワイプ開始イベントの登録
    //     */
    //    imageContainer.addEventListener('touchstart', onTouchStart);
    //    imageContainer.addEventListener('mousedown', onTouchStart);

    //    /**
    //     * スワイプ開始イベント
    //     */
    //    function onTouchStart() {
    //        console.log('onTouchStart');
    //        // フィールド初期化
    //        touchStartX = touchMoveX = null;
    //        curElem = prevElem = nextElem = null;
    //        clearInterval(momentumScrollTimerId);
    //        momentumScrollTimerId = null;

    //        // コンテナ幅を保持
    //        containerWidth = imageContainer.offsetWidth;
    //        // タッチ位置を保持
    //        touchStartX = touchMoveX = event.touches ? event.touches[0].pageX : event.pageX;
    //        touchMoveTime = Date.now();
    //        touchStartScrollLeft = imageContainer.scrollLeft;

    //        //var prevIndex = (_currentIndex === 0) ? _imageElements.length - 1 : _currentIndex - 1;
    //        //var nextIndex = (_currentIndex + 1 >= _imageElements.length) ? 0 : _currentIndex + 1;

    //        //// 対象となる画像要素とその前後要素を保持
    //        //if (_imageElements.length > 2) {
    //        //    prevElem = _imageElements[prevIndex];
    //        //    prevElem.className = 'swipe';
    //        //    prevElem.style.left = -containerWidth + 'px';
    //        //}
    //        //curElem = _imageElements[_currentIndex];
    //        //curElem.style.left = 0;
    //        //curElem.className = 'swipe';
    //        //if (true) {
    //        //    nextElem = _imageElements[nextIndex];
    //        //    nextElem.className = 'swipe';
    //        //    nextElem.style.left = containerWidth + 'px';
    //        //}
    //        //console.log({ prevElem: prevElem, curElem: curElem, nextElem: nextElem });

    //        // タッチ・マウスイベントを登録
    //        // register touchmove / mousemove
    //        imageContainer.addEventListener('touchmove', onTouchMove);
    //        imageContainer.addEventListener('mousemove', onTouchMove);
    //        // register touchend / mouseup / mouseout
    //        imageContainer.addEventListener('touchend', onTouchEnd);
    //        imageContainer.addEventListener('mouseup', onTouchEnd);
    //        imageContainer.addEventListener('mouseout', onTouchEnd);
    //    }
    //    /**
    //     * スワイプ中イベント
    //     */
    //    function onTouchMove() {
    //        event.preventDefault();

    //        var now = Date.now();
    //        if (now - touchMoveTime < 30) return;

    //        // 現在のタッチ位置を保持
    //        touchMoveX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
    //        touchMoveTime = now;

    //        // スワイプ移動量の算出
    //        var dx = (touchMoveX - touchStartX);
    //        console.log({ dx: dx });
    //        //if (dx > 0 && _currentIndex > 0 || dx < 0 && _currentIndex < _imageElements.length - 1) {
    //        //} else {
    //        //    // 範囲外へのスワイプはバウンド挙動に
    //        //    dx *= .3;
    //        //}

    //        //// スワイプ移動量分、画像要素を移動
    //        //if (prevElem) {
    //        //    prevElem.style.left = -containerWidth + dx + 'px';
    //        //}
    //        //curElem.style.left = dx + 'px';
    //        //if (nextElem) {
    //        //    nextElem.style.left = containerWidth + dx + 'px';
    //        //}
    //        imageContainer.scrollLeft = touchStartScrollLeft - dx;
    //    }
    //    /**
    //     * スワイプ終了イベント
    //     */
    //    function onTouchEnd() {
    //        console.log('onTouchEnd');
    //        ////event.preventDefault();

    //        //// 移動量の判定
    //        //var indexChanged = false;
    //        //if (touchStartX > touchMoveX) {
    //        //    if (touchStartX > (touchMoveX + 50)) {
    //        //        //右から左に指が移動した場合
    //        //        console.log({ msg: 'swipe ←', touchStartX: touchStartX, touchMoveX: touchMoveX });
    //        //        if (nextElem) {
    //        //            ++_currentIndex;
    //        //            if (_currentIndex >= _imageElements.length) {
    //        //                _currentIndex = 0;
    //        //            }
    //        //            nextElem.className = 'fadeIn';
    //        //            //curElem.className = 'fadeOut';
    //        //            indexChanged = true;
    //        //        }
    //        //    }
    //        //} else if (touchStartX < touchMoveX) {
    //        //    if ((touchStartX + 50) < touchMoveX) {
    //        //        //左から右に指が移動した場合
    //        //        console.log({ msg: 'swipe →', touchStartX: touchStartX, touchMoveX: touchMoveX });
    //        //        if (prevElem) {
    //        //            --_currentIndex;
    //        //            if (_currentIndex < 0) {
    //        //                _currentIndex = _imageElements.length - 1;
    //        //            }
    //        //            prevElem.className = 'fadeIn';
    //        //            //curElem.className = 'fadeOut';
    //        //            indexChanged = true;
    //        //        }
    //        //    }
    //        //}
    //        //console.log({ _currentIndex: _currentIndex });

    //        //// インデックスに変更が無ければ、スライドを元に戻す
    //        //if (!indexChanged) {
    //        //    curElem.className = 'fadeIn';
    //        //} else {
    //        //    // 縦帯のリフレッシュ
    //        //    refreshColStripe();
    //        //}


    //        var touchEndX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
    //        var dx = (touchEndX - touchMoveX);
    //        var vx = Math.min(Math.max(dx / (Date.now() - touchMoveTime), -5), 5);
    //        console.log({ dx: dx, vx: vx });
    //        var interval = 10;
    //        var duration = 1000;
    //        var count = duration / interval;
    //        var ti = 0;
    //        var prevScrollLeft;
    //        momentumScrollTimerId = setInterval(function () {
    //            //console.log('interval: vx=' + vx);
    //            if (++ti >= count || Math.abs(vx) < 0.03 || prevScrollLeft === imageContainer.scrollLeft) {
    //                clearInterval(momentumScrollTimerId);

    //                var curElem = getCenterViewElement();
    //                var index = _imageElements.indexOf(curElem);
    //                thisObj.setIndex(index, true);
    //            }
    //            prevScrollLeft = imageContainer.scrollLeft;
    //            imageContainer.scrollLeft -= vx * interval;
    //            vx *= .95;
    //        }, interval);


    //        // タッチ・マウスイベントを解除
    //        // unregister touchmove / mousemove
    //        imageContainer.removeEventListener('touchmove', onTouchMove);
    //        imageContainer.removeEventListener('mousemove', onTouchMove);
    //        // unregister touchend / mouseup / mouseout
    //        imageContainer.removeEventListener('touchend', onTouchEnd);
    //        imageContainer.removeEventListener('mouseup', onTouchEnd);
    //        imageContainer.removeEventListener('mouseout', onTouchEnd);
    //    }
    //})();
});
