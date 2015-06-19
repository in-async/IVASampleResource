//var swiper = new ImageSwiper(container);
//swiper.setPosition(0);
//swiper.addImageUrl(imgUrl);

/**
 * 複数画像をスワイプする為のクラス
 */
var ImageSwiper = (function (imageContainer, options) {
    var thisObj = this;

    // 引数の検証
    imageContainer.className += ' image-swiper';
    if (!options) {
        options = {};
    }
    if (!options.imageTagName) {
        options.imageTagName = 'div';
    }
    if (typeof(options.colStripeVisible) === 'undefined') {
        options.colStripeVisible = true;
    }

    // 現在表示されている画像インデックス
    var _currentIndex = -1;
    // スワイプ対象となる画像要素配列
    var _imageElements = [];
    // 縦帯要素
    var _leftStripeElement;
    var _rightStripeElement;
    if (options.colStripeVisible) {
        // 縦帯要素の追加
        var _leftStripeElement = document.createElement('span');
        _leftStripeElement.setAttribute('class', 'left-stripe');
        imageContainer.appendChild(_leftStripeElement);

        var _rightStripeElement = document.createElement('span');
        _rightStripeElement.setAttribute('class', 'right-stripe');
        imageContainer.appendChild(_rightStripeElement);
    }


    /**
     * 画像 URL を追加します。
     */
    this.addImageUrl = function (imageUrl) {
        // 画像要素の作成
        var imageElem = document.createElement(options.imageTagName);
        imageElem.style.backgroundImage = 'url("' + imageUrl + '")';
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

        // 縦帯のリフレッシュ
        refreshColStripe();
    };

    /**
     * 表示対象のスワイプ画像のインデックスを変更します。
     */
    this.setIndex = function (index) {
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
            // 全ての画像要素のクラスを初期化
            for (var i = 0, len = _imageElements.length; i < len; i++) {
                if (i === index) {
                    _imageElements[index].className = 'fadeIn';
                } else {
                    _imageElements[i].className = '';
                }
            }

            // 縦帯のリフレッシュ
            refreshColStripe();
        }
    };

    /**
     * 縦帯の表示リフレッシュ
     */
    function refreshColStripe() {
        //if (_leftStripeElement) {
        //    _leftStripeElement.style.display = (_currentIndex == 0) ? 'none' : 'block';
        //}
        //if (_rightStripeElement) {
        //    _rightStripeElement.style.display = (_currentIndex == _imageElements.length - 1) ? 'none' : 'block';
        //}
    }

    (function () {
        /**
         * スワイプ中に使用する内部フィールド
         */
        var touchStartX = null;
        var touchMoveX = null;
        var touchMoveTime = null;
        var containerWidth = null;
        var curElem = null;
        var prevElem = null;
        var nextElem = null;

        /**
         * スワイプ開始イベントの登録
         */
        imageContainer.addEventListener('touchstart', onTouchStart);
        imageContainer.addEventListener('mousedown', onTouchStart);

        /**
         * スワイプ開始イベント
         */
        function onTouchStart() {
            // フィールド初期化
            touchStartX = touchMoveX = null;
            curElem = prevElem = nextElem = null;

            // コンテナ幅を保持
            containerWidth = imageContainer.offsetWidth;
            // タッチ位置を保持
            touchStartX = event.touches ? event.touches[0].pageX : event.pageX;
            touchMoveTime = Date.now();

            var prevIndex = (_currentIndex === 0) ? _imageElements.length - 1 : _currentIndex - 1;
            var nextIndex = (_currentIndex + 1 >= _imageElements.length) ? 0 : _currentIndex + 1;

            // 対象となる画像要素とその前後要素を保持
            if (_imageElements.length > 2) {
                prevElem = _imageElements[prevIndex];
                prevElem.className = 'swipe';
                prevElem.style.left = -containerWidth + 'px';
            }
            curElem = _imageElements[_currentIndex];
            curElem.style.left = 0;
            curElem.className = 'swipe';
            if (true) {
                nextElem = _imageElements[nextIndex];
                nextElem.className = 'swipe';
                nextElem.style.left = containerWidth + 'px';
            }
            console.log({ prevElem: prevElem, curElem: curElem, nextElem: nextElem });

            // タッチ・マウスイベントを登録
            // register touchmove / mousemove
            imageContainer.addEventListener('touchmove', onTouchMove);
            imageContainer.addEventListener('mousemove', onTouchMove);
            // register touchend / mouseup / mouseout
            imageContainer.addEventListener('touchend', onTouchEnd);
            imageContainer.addEventListener('mouseup', onTouchEnd);
            imageContainer.addEventListener('mouseout', onTouchEnd);
        }
        /**
         * スワイプ中イベント
         */
        function onTouchMove() {
            event.preventDefault();

            var now = Date.now();
            if (now - touchMoveTime < 15) return;

            // 現在のタッチ位置を保持
            touchMoveX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
            touchMoveTime = now;

            // スワイプ移動量の算出
            var dx = (touchMoveX - touchStartX);
            console.log({ dx: dx });
            if (dx > 0 && prevElem || dx < 0 && nextElem) {
            } else {
                // 範囲外へのスワイプはバウンド挙動に
                dx *= .3;
            }

            // スワイプ移動量分、画像要素を移動
            if (prevElem) {
                prevElem.style.left = -containerWidth + dx + 'px';
            }
            curElem.style.left = dx + 'px';
            if (nextElem) {
                nextElem.style.left = containerWidth + dx + 'px';
            }
        }
        /**
         * スワイプ終了イベント
         */
        function onTouchEnd() {
            //event.preventDefault();
            // 移動なしにタッチが終了した場合、当たり前だが移動なしとする
            if (touchMoveX === null) {
                touchMoveX = touchStartX;
            }

            // 移動量の判定
            var indexChanged = false;
            if (touchStartX > touchMoveX) {
                if (touchStartX > (touchMoveX + 50)) {
                    //右から左に指が移動した場合
                    console.log({ msg: 'swipe ←', touchStartX: touchStartX, touchMoveX: touchMoveX });
                    if (nextElem) {
                        ++_currentIndex;
                        if (_currentIndex >= _imageElements.length) {
                            _currentIndex = 0;
                        }
                        nextElem.className = 'fadeIn';
                        //curElem.className = 'fadeOut';
                        indexChanged = true;
                    }
                }
            } else if (touchStartX < touchMoveX) {
                if ((touchStartX + 50) < touchMoveX) {
                    //左から右に指が移動した場合
                    console.log({ msg: 'swipe →', touchStartX: touchStartX, touchMoveX: touchMoveX });
                    if (prevElem) {
                        --_currentIndex;
                        if (_currentIndex < 0) {
                            _currentIndex = _imageElements.length - 1;
                        }
                        prevElem.className = 'fadeIn';
                        //curElem.className = 'fadeOut';
                        indexChanged = true;
                    }
                }
            }
            console.log({ _currentIndex: _currentIndex });

            // インデックスに変更が無ければ、スライドを元に戻す
            if (!indexChanged) {
                curElem.className = 'fadeIn';
            } else {
                // 縦帯のリフレッシュ
                refreshColStripe();
            }

            // タッチ・マウスイベントを解除
            // unregister touchmove / mousemove
            imageContainer.removeEventListener('touchmove', onTouchMove);
            imageContainer.removeEventListener('mousemove', onTouchMove);
            // unregister touchend / mouseup / mouseout
            imageContainer.removeEventListener('touchend', onTouchEnd);
            imageContainer.removeEventListener('mouseup', onTouchEnd);
            imageContainer.removeEventListener('mouseout', onTouchEnd);
        }
    })();
});
