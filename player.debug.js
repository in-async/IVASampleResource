function debug_jsonp_onLookup(result) {
    //console.log('debug_jsonp_onLookup');
    //console.log(result);
    var lookup = result.results[0];

    (function () {
        var zoneEid = (function () {
            var m = location.search.match('zoneEid=(\\w+)');
            return m ? m[1] : 'zone3';
        })();
        var campaignId;
        var creativeId;
        var mediaJson = getMediaJson();
        var deviceJson = getDeviceJson();
        //    var duration = 3.0;
        var viewToken = '[viewToken]';
        var video;

        var _media = mediaJson;
        var _zone, _campaign, _creative;

        // Zone モデルを取得
        for (var zoneIdx in _media.zones) {
            var zone = _media.zones[zoneIdx];
            if (zone.zone_eid == zoneEid) {
                _zone = zone;
                break;
            }
        }

        // Campaign モデルを取得
        _campaign = _zone.campaigns[0];
        campaignId = _campaign.campaign_id;

        // Creative モデルを取得
        _creative = _campaign.creatives[0];
        creativeId = _creative.creative_id;

        // lookup 情報の上書き
        if (lookup) {
            _campaign.lookup = lookup;
            _creative.transfer_url = lookup.trackViewUrl;
        }

        //// 指定された任意の App Store アプリの情報を取得
        //var id = (function() {
        //    var m = location.search.match('id=(\\d+)');
        //    return m ? m[1]: null;
        //})();
        //if (id) {
        //    //var script = document.createElement('script');
        //    //script.setAttribute('src', 'https://itunes.apple.com/lookup?country=JP&callback=debug_jsonp_onLookup&id=' + id);
        //    //document.body.appendChild(script);
        //    document.write('<script src="https://itunes.apple.com/lookup?country=JP&callback=debug_jsonp_onLookup&id=' + id + '"></' + 'script>');
        //}

        // 疑似イベント励起
        window.addEventListener('load', function () {
            console.log('window.load');
            //        native_onLoadAd(zoneEid, campaignId, creativeId, mediaJson);

            // 疑似動画再生準備
            if (location.search.indexOf("endcard=1") >= 0) {
                // 直ぐ再生終了イベントをコール
                setTimeout(function () {
                    native_onPreparedVideo(zoneEid, campaignId, creativeId);

                    native_onFinishedAd(zoneEid, campaignId, creativeId, 5, false, viewToken);
                }, 0);
            } else {
                (function () {
                    video = document.createElement('video');
                    video.setAttribute('src', _creative.video_url);
                    //video.setAttribute('autoplay', 'autoplay');
                    video.setAttribute('style', 'position:absolute; width:100%; height:100%; top:0; left:0; background-color:#000');

                    // 動画のイベントハンドラ設定
                    //            video.addEventListener('play', function () {
                    //                console.log('video.play');
                    //                native_onStartedAd(zoneEid);
                    //            });
                    video.addEventListener('loadedmetadata', function () {
                        console.log('video.loadedmetadata');
                        if (location.search.indexOf("endcard=1") >= 0) {
                            video.currentTime = video.duration * .99;
                        }
                    });
                    video.addEventListener('loadeddata', function () {
                        console.log('video.loadeddata');
                        native_onPreparedVideo(zoneEid, campaignId, creativeId);
                        native_onPreparedAd(zoneEid, campaignId, creativeId);
                    });
                    video.addEventListener('play', function () {
                        console.log('video.play');
                        video.style.display = 'block';
                    });
                    video.addEventListener('pause', function () {
                        console.log('video.pause');
                    });
                    video.addEventListener('ended', function () {
                        console.log('video.ended');
                        video.style.display = 'none';
                        native_onFinishedAd(zoneEid, campaignId, creativeId, video.duration, false, viewToken);
                    })
                    video.addEventListener('timeupdate', function () {
                        native_onUpdateTime(video.currentTime, video.duration);
                    });

                    document.body.appendChild(video);

                    // フレームが video より前面になるよう配慮
                    //document.getElementById('video-frame').style.position = 'relative';
                    //document.getElementById('video-frame').style.zIndex = 100;
                    //document.getElementById('endcard-frame').style.position = 'relative';
                    //document.getElementById('endcard-frame').style.zIndex = 100;
                })();
            }
        });
        /**
        * debug 用スタブメソッド
        */
        var currentTime = 0;
        var elapsed = 0;
        var skipped = false;
        var intervalId;
        nativeApi = function (method, jsonArgs, callback) {
            if (method == 'log') return;
            switch (method) {
                case 'getAdInfo':
                    setTimeout(function () {
                        callback({
                            device: deviceJson,
                            media: mediaJson,
                            zoneEid: zoneEid,
                            campaignId: campaignId,
                            creativeId: creativeId,
                        });
                    }, 0);
                    break;
                case 'getDeviceInfo':
                    // TODO
                    break;
                case 'getCreativeAsBase64':
                    setTimeout(function () {
                        callback(jsonArgs.creativeUrl);
                    }, 0);
                    break;
                case 'getVideoThumbnailAsBase64':
                    setTimeout(function () {
                        // 動画サムネイルの作成
                        var base64 = 'poster.jpg';
                        if (video) {
                            var canvas = document.createElement('canvas');
                            canvas.width = video.clientWidth;
                            canvas.height = video.clientHeight;
                            var ctx = canvas.getContext("2d");
                            try {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                base64 = canvas.toDataURL('image/png');
                            } catch (e) { }
                        }
                        callback(base64);
                    }, 0);
                    break;
                    break;

                case 'startVideo':
                    if (video) {
                        video.play();
                    } else {
                        setTimeout(function () {
                            native_onFinishedAd(zoneEid, campaignId, creativeId, 5, false, viewToken);
                        }, 300);
                    }
                    break;
                case 'pauseVideo':
                    if (video) {
                        video.pause();
                    }
                    break;
                case 'replayVideo':
                    if (video) {
                        video.currentTime = 0;
                        video.play();
                    } else {
                        setTimeout(function () {
                            native_onFinishedAd(zoneEid, campaignId, creativeId, 5, false, viewToken);
                        }, 300);
                    }
                    break;
                case 'skipAd':
                    var playtime = 5;
                    if (video) {
                        video.pause();
                        playtime = video.currentTime;
                    }
                    native_onFinishedAd(zoneEid, campaignId, creativeId, playtime, true, viewToken);
                    break;
                case 'openClickUrl':
                    window.open(jsonArgs.url);
                    break;
                case 'closeAd':
                    if (parent && parent.closeAd) {
                        parent.closeAd();
                    } else {
                        alert('広告を閉じるボタンです。');
                    }
                    //var iframeElems = parent.document.getElementsByTagName('iframe');
                    //for (var i in iframeElems) {
                    //    if (iframeElems[i].getAttribute('src') == location.href) {

                    //    }
                    //}
                    break;
            }
        };
        console.log('player.debug.js');
        console.log('available query: endcard, zoneEid');

        //// native_onFailed イベントボタン
        //(function () {
        //    var btn = document.createElement('button');
        //    btn.innerHTML = 'native_onFailed';
        //    btn.addEventListener('click', function () {
        //        var reason = 1;
        //        native_onFailed(reason, zoneEid);
        //    });
        //    document.body.appendChild(btn);
        //})();

        function getDeviceJson() {
            return {
                "sdkv": "0.1",
                "plt": "ios",
                "appid": "com.example.SampleApp",
                "appv": "1.0",
                "lang": "ja",
                "osv": "6.1",
                "nwt": "wifi",
                "dvbrand": "Apple",
                "dvname": "iPhone2,1",
                "idfa": "[idfa sample]",
                "dpr": 2.0,
                "dpw": 480,
                "dph": 640,
            };
        }
        function getMediaJson() {
            return {
                "default_zone_eid": "zone2",
                "settings": {
                    "log_click_url": "http://192.168.1.10:8003/api/log_click",
                    "log_view_url": "http://192.168.1.10:8003/api/log_view",
                },
                "zones": [
                    {
                        "zone_eid": "zone1",
                        "zone_id": 1,
                        "allowed_portrait_play": false,
                        "allowed_skip": false,
                        "campaigns": [
                            {
                                "campaign_id": 1,
                                "creatives": [
                                    {
                                        "creative_id": 111,
                                        "player_html_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                        "transfer_url": "https://itunes.apple.com/jp/app/pazuru-doragonzu/id493470467?mt=8&uo=2",
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
                                "lookup": {
                                    "artworkUrl60": "http://is4.mzstatic.com/image/pf/us/r30/Purple1/v4/9b/5c/ae/9b5cae5f-cb1e-0c7b-923c-73834d4a8a74/AppIcon57x57.png", "artistViewUrl": "https://itunes.apple.com/jp/artist/gungho-online-entertainment/id403963903?uo=4",
                                    "screenshotUrls": ["http://a4.mzstatic.com/jp/r30/Purple3/v4/67/23/19/672319a2-7b95-c9b3-fc1c-2847758876f0/screen322x572.jpeg", "http://a5.mzstatic.com/jp/r30/Purple1/v4/41/6d/11/416d11bb-1d0e-6171-861f-dd9558d7bbe1/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/9f/dd/fe/9fddfe19-39bf-6959-f8e9-ac9ef61d7195/screen322x572.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/2a/8b/8e/2a8b8ea6-65d9-f6d1-ce8d-36646422cba0/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a4/0e/c8/a40ec86d-721e-9dcf-f6cc-78c429f8674a/screen322x572.jpeg"],
                                    "ipadScreenshotUrls": ["http://a1.mzstatic.com/jp/r30/Purple1/v4/10/c8/6d/10c86dd8-8009-d992-0040-a035c3025e4f/screen480x480.jpeg", "http://a5.mzstatic.com/jp/r30/Purple5/v4/f0/00/c7/f000c75f-fc04-f2c5-04a8-0fc92faa7bde/screen480x480.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/be/0b/80/be0b8062-dfb6-0fc7-0ed4-680a8932e8a9/screen480x480.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/6d/e1/66/6de16654-6718-426e-cb86-5a1b50e7c04e/screen480x480.jpeg", "http://a1.mzstatic.com/jp/r30/Purple3/v4/ec/f5/d8/ecf5d8f2-9e85-88e4-5ae5-d78f235630d1/screen480x480.jpeg"], "artworkUrl512": "http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/c7/b4/52/c7b45204-99c2-d141-27d0-85b7c7d4f7a2/mzl.qhazfnih.png", "kind": "software", "isGameCenterEnabled": true, "features": ["gameCenter", "iosUniversal"],
                                    "supportedDevices": ["iPadFourthGen", "iPodTouchFourthGen", "iPadMini4G", "iPhone5c", "iPhone5s", "iPadThirdGen4G", "iPodTouchFifthGen", "iPhone5", "iPad2Wifi", "iPhone6Plus", "iPad23G", "iPadFourthGen4G", "iPadThirdGen", "iPhone6", "iPhone4", "iPhone-3GS", "iPhone4S", "iPadMini"], "advisories": [], "trackCensoredName": "パズル＆ドラゴンズ", "trackViewUrl": "https://itunes.apple.com/jp/app/pazuru-doragonzu/id493470467?mt=8&uo=4", "contentAdvisoryRating": "4+", "artworkUrl100": "http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/c7/b4/52/c7b45204-99c2-d141-27d0-85b7c7d4f7a2/mzl.qhazfnih.png", "averageUserRatingForCurrentVersion": 4.0, "languageCodesISO2A": ["EN", "JA"], "fileSizeBytes": "41726366", "sellerUrl": "http://www.gungho.jp/pad/", "userRatingCountForCurrentVersion": 6156, "trackContentRating": "4+", "wrapperType": "software", "version": "7.9.2", "artistId": 403963903, "artistName": "GungHo Online Entertainment, Inc.", "genres": ["ゲーム", "パズル", "ロールプレイング"], "price": 0.00,
                                    "description": "◆◇おかげ様で3周年&累計3600万DLを突破!◇◆\n\n『パズル＆ドラゴンズ』内に、新たなゲーム『パズドラＷ』が登場！\nゲームタイトル画面で、『パズドラＷ』を選ぶとプレイできます！\n\n------------------------\n◆パズドラ　ゲーム紹介◆\n------------------------\nパズルで大冒険! \n「パズル＆ドラゴンズ」はモンスターと一緒にパズルの力で冒険するゲームです。 \n世界中のダンジョンを踏破して、伝説のドラゴンを見つけ出そう! \n\n「パズル＆ドラゴンズ」のダウンロードは無料! \n一部有料コンテンツもご利用いただけますが、 \n最後まで無料でお楽しみいただくことが可能です。 \n\n▼基本ルールは簡単パズル! \n同じ色のドロップを、縦か横に3つそろえて消すパズルゲームです。 \nドロップをうまく動かして、同時消しや爽快コンボを狙おう! \n\n▼モンスターとの戦い! \nドロップを消すと、味方のモンスターが敵を攻撃! \n敵にやられる前にコンボで大ダメージを狙ってやっつけよう! \n\n▼ゲットしたモンスターでチームを組もう! \nダンジョンで拾った卵を持ち帰ると、新たなモンスターが誕生! \n好きなモンスターを組み合わせて、あなただけのオリジナルチームを作ろう! \nモンスターはダンジョン以外にガチャでもゲットできるよ! \n\n▼モンスター育成 \nモンスター同士を合成することで、モンスターがパワーアップ! \n特定の条件で進化できるモンスターや、パワーアップで究極進化するモンスター \nも・・・! \n\n▼友達と一緒にあそぼう!! \nパズドラのゲーム内で知り合ったフレンド同士で、モンスターをレンタルできるよ! \n友達のモンスターと一緒に冒険するとさらに楽しいよ! \n\n-------------------------\n◆パズドラＷ ゲーム紹介◆\n-------------------------\n▼誰でも簡単に遊べる、かわいいパズドラが登場！\nVer.7.0から、パズドラ内に、新たなゲーム『パズドラＷ』を追加！\n\n▼かんたんパズルで「たまドラ」と冒険しよう！\nパズルのルールはかんたん！\n「たまドラ」と一緒に、様々なステージをクリアしながら\n「キングデビたま」一味に奪われてしまった大事なタマゴを取り戻そう！ \n\n▼「たまドラ」をかわいく着せ替えよう！\nステージをクリアして集めた着せ替えアイテム「アバたま」で\n「たまドラ」をかわいく着せ替えよう！\n\n『パズドラＷ』にはいろんなステージや珍しい「アバたま」がいっぱい！\n「たまドラ」と一緒にタマゴを取り戻す旅に出かけよう！\n\n----------------------------\n◆その他のガンホーのゲーム◆\n----------------------------\nピコッと遊んでメッチャ爽快！\nかんたんタッチゲー「ピコットキングダム」好評発売中!\n大人気ゲーム「ケリ姫スイーツ」もよろしく! \n\n■■【価格】■■ \nアプリ本体：無料 \n※一部有料アイテムがございます。 \n\nご利用前に「アプリケーション使用許諾契約」に表示されている利用規約を必ずご確認ください。お客様がダウンロードボタンをクリックされ、本アプ リケーションをダウンロードされた場合には、利用規約に同意したものとみなされます。 \nアプリケーション公式サイト→http://www.gungho.jp/pad/", "currency": "JPY", "bundleId": "jp.gungho.pad", "trackId": 493470467, "trackName": "パズル＆ドラゴンズ", "genreIds": ["6014", "7012", "7014"], "releaseDate": "2012-02-20T06:31:52Z", "sellerName": "GungHo Online Entertainment, INC.", "primaryGenreName": "Games", "primaryGenreId": 6014, "isVppDeviceBasedLicensingEnabled": false,
                                    "releaseNotes": "◇◆Ver7.9.2アップデート情報◆◇\n\n▽新規追加機能\n◆新しい「タイプ」を追加しました\n◆「ソートフィルター」に「覚醒スキル」を追加しました\n※詳細はパズドラ運営サイトを御覧ください\n\n▽不具合修正\n◆不具合の修正\n◆その他、細かいブラッシュアップ\n\n※詳細は、アプリ内「その他」より「イベント/アップデート情報」をご確認ください。", "formattedPrice": "無料", "minimumOsVersion": "6.0", "averageUserRating": 4.5, "userRatingCount": 476188
                                }
                            }
                        ],
                        "default_mute": false,
                        "skippable_after_sec": 0,
                    },
                    {
                        "zone_eid": "zone2",
                        "zone_id": 2,
                        "allowed_portrait_play": false,
                        "allowed_skip": false,
                        "campaigns": [
                            {
                                "campaign_id": 2,
                                "creatives": [
                                    {
                                        "creative_id": 112,
                                        "player_html_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                        "transfer_url": "https://itunes.apple.com/jp/app/monsutasutoraiku/id658511662?mt=8&uo=2",
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
                                "lookup": {
                                    "screenshotUrls": ["http://a2.mzstatic.com/jp/r30/Purple1/v4/1e/a4/54/1ea45485-e971-2ade-335f-84429e11e26e/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple5/v4/2d/b1/18/2db1189e-a068-eff2-7bb2-8050c5bae595/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a2/c3/24/a2c32443-8c94-df8b-bc23-c3aa8d9db0b4/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/33/02/01/3302016d-4df3-4e04-4ff6-d42f980ff1dc/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/1c/f5/bf/1cf5bfc8-ddb3-6354-3ced-c9578bd5877e/screen1136x1136.jpeg"],
                                    "ipadScreenshotUrls": ["http://a5.mzstatic.com/jp/r30/Purple3/v4/ac/eb/72/aceb7295-bb78-7590-1d5f-9a4b78ece68f/screen480x480.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/87/fd/81/87fd81ff-9297-284d-7c4e-1dd11f2f44c8/screen480x480.jpeg", "http://a4.mzstatic.com/jp/r30/Purple1/v4/5f/39/bc/5f39bc96-ccd8-b24f-c848-a71c1b7b36ed/screen480x480.jpeg", "http://a4.mzstatic.com/jp/r30/Purple3/v4/33/ec/d9/33ecd9fe-f22b-fc3d-c342-78b03f28925d/screen480x480.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/97/cc/3f/97cc3feb-e975-86f7-bb6a-e93aa4928f40/screen480x480.jpeg"], "artworkUrl60": "http://is4.mzstatic.com/image/pf/us/r30/Purple1/v4/48/09/af/4809affd-fe48-90b4-f5e5-27596024b729/AppIcon57x57.png", "artworkUrl512": "http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/dc/f7/32/dcf73253-6f1c-cdb0-5c02-19e4a67395af/mzl.sijlkump.png", "artistViewUrl": "https://itunes.apple.com/jp/artist/mikushi-i/id285951869?mt=8&uo=4", "features": ["iosUniversal"], "kind": "software",
                                    "supportedDevices": ["iPhone4", "iPadMini", "iPad23G", "iPhone5", "iPadThirdGen", "iPhone5s", "iPhone6Plus", "iPhone6", "iPhone5c", "iPadMini4G", "iPadFourthGen", "iPhone4S", "iPodTouchFifthGen", "iPhone-3GS", "iPadThirdGen4G", "iPad2Wifi", "iPadFourthGen4G", "iPodTouchFourthGen"], "advisories": [], "isGameCenterEnabled": false, "artworkUrl100": "http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/dc/f7/32/dcf73253-6f1c-cdb0-5c02-19e4a67395af/mzl.sijlkump.png", "trackViewUrl": "https://itunes.apple.com/jp/app/monsutasutoraiku/id658511662?mt=8&uo=4", "trackCensoredName": "モンスターストライク", "languageCodesISO2A": ["EN", "JA"], "fileSizeBytes": "64625459", "sellerUrl": "http://www.monster-strike.com", "contentAdvisoryRating": "4+", "averageUserRatingForCurrentVersion": 4.0, "userRatingCountForCurrentVersion": 282197, "trackContentRating": "4+", "currency": "JPY", "wrapperType": "software", "version": "4.3.0", "artistId": 285951869, "artistName": "mixi, Inc", "genres": ["ゲーム", "アクション", "ロールプレイング"], "price": 0.00,
                                    "description": "◆祝・利用者2500万人突破！／テレビCM絶賛放映中！◆\n\n最大4人同時に楽しめる「ひっぱりハンティングRPG!」\nモンスターマスターになって様々な能力を持つモンスターをたくさん集めよう！ \n1000種類を超える個性豊かなモンスターが君を待ってるぞ！ \n\n【ゲーム紹介】 \n\n▼ルールは簡単 \nモンスターを引っぱって敵に当てるだけ！ \n味方モンスターに当てると、友情コンボが発動！ \n一見攻撃力の弱いモンスターもコンボが発動すると、意外な力を発揮するかも?！ \n\n▼決めろストライクショット！ \nバトルのターンが経過すると必殺技「ストライクショット」が使えるぞ！ \nモンスターによって技は様々、君はすぐ使う派？ボスまで待つ派？ \n使うタイミングが生死を分ける!? \n\n▼集めて育てて強くなれ！ \nバトルやガチャでGetしたモンスターを合成して育てよう！ \n強く進化させるにはモンスター以外に進化素材が必要になるぞ。 \n強いモンスターを育てて君だけの最強チームを作ろう！ \n\n▼天空より舞い降りし、異界のモンスター！ \nボスがステージの最後に出るとは限らないぞ！ \nどんな時も万全の態勢で戦いに挑むべし！ \n\n▼友達と一緒に、強敵を倒そう！ \n近くにいる友達と、最大4人まで同時プレイが可能！\nなんと1人分のスタミナでクエストに挑めるぞ！ \n1人では倒せない強敵も、みんなで力を合わせれば倒せるかも!? \nマルチプレイ専用のレアなクエストも盛りだくさん！\nレアモンスターを倒してゲットしよう！ \n\n\n+++【価格】+++ \nアプリ本体：無料 \n※一部有料アイテムがございます。 \n\n+++【推奨端末】+++ \niPhone4S以降,iPod touch (第5世代以降),iPad2以降\n※推奨端末以外でのサポート、補償等は致しかねますので何卒ご了承くださいませ。\n\nご利用前に「アプリケーション使用許諾契約」に \n表示されている利用規約を必ずご確認の上ご利用ください。", "trackName": "モンスターストライク", "trackId": 658511662, "genreIds": ["6014", "7001", "7014"], "releaseDate": "2013-09-27T07:00:00Z", "sellerName": "mixi, Inc", "bundleId": "jp.co.mixi.monsterstrike", "primaryGenreName": "Games", "primaryGenreId": 6014, "isVppDeviceBasedLicensingEnabled": false,
                                    "releaseNotes": "【更新情報】 \n※新キャラ、新ストライクショット、友情コンボについては公式サイトのイベント情報にてご確認ください。 \n========================= \n・戦績ミッションを新たに追加！やりこみプレイでオーブをゲットだ！！\n・タイム計測機能を追加！\n・その他UIのブラッシュアップ \n・バグ修正 \n=========================", "formattedPrice": "無料", "minimumOsVersion": "6.0", "averageUserRating": 4.5, "userRatingCount": 2361529
                                }
                            }
                        ],
                        "default_mute": false,
                        "skippable_after_sec": 0,
                    },
                    {
                        "zone_eid": "zone3",
                        "zone_id": 3,
                        "allowed_portrait_play": false,
                        "allowed_skip": false,
                        "campaigns": [
                            {
                                "campaign_id": 3,
                                "creatives": [
                                    {
                                        "creative_id": 113,
                                        "player_html_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                        "transfer_url": "https://itunes.apple.com/jp/app/bai-maopurojekuto/id895687962?mt=8&uo=2",
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
                                "lookup": {
                                    "screenshotUrls": ["http://a5.mzstatic.com/jp/r30/Purple5/v4/4d/31/8f/4d318f25-40b3-c790-4f38-3110ed762456/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/09/7b/a5/097ba521-e80a-ddb8-de90-f3d50a1cc635/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple1/v4/19/b7/d4/19b7d43a-0e71-6c7a-c889-f0bed37648c4/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple5/v4/27/26/8c/27268c61-fae0-e34c-5d36-c574aa53ea11/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/10/4d/f5/104df581-17a7-ab7b-ff24-8bf6eee5c980/screen1136x1136.jpeg"],
                                    "ipadScreenshotUrls": ["http://a1.mzstatic.com/jp/r30/Purple5/v4/64/50/5d/64505dac-8f94-dbe6-c665-c991b7beb714/screen480x480.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/31/93/85/31938598-5367-c3b1-12f3-b792cb3746b4/screen480x480.jpeg", "http://a4.mzstatic.com/jp/r30/Purple5/v4/fd/99/21/fd992114-230f-b5a0-5da2-accb3692037e/screen480x480.jpeg", "http://a4.mzstatic.com/jp/r30/Purple5/v4/5a/b2/8e/5ab28e95-6f5d-e23d-ff1e-43331ff29e2f/screen480x480.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/6c/51/ec/6c51ec4e-23cc-2c06-1c67-a8e3819c67fa/screen480x480.jpeg"], "artworkUrl60": "http://is4.mzstatic.com/image/pf/us/r30/Purple5/v4/6a/f1/5e/6af15e00-1003-15f7-7d04-c42e30e73256/AppIcon57x57.png", "artworkUrl512": "http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/11/56/d2/1156d268-22eb-822e-0579-bfbb32cfaef6/mzl.vxcebezk.png", "artistViewUrl": "https://itunes.apple.com/jp/artist/colopl-inc./id376314072?uo=4", "kind": "software", "features": ["gameCenter", "iosUniversal"],
                                    "supportedDevices": ["iPhone4S", "iPhone-3GS", "iPadFourthGen", "iPhone6", "iPad23G", "iPadThirdGen", "iPadThirdGen4G", "iPadMini", "iPhone5s", "iPhone5c", "iPad2Wifi", "iPhone5", "iPhone4", "iPodTouchFourthGen", "iPadMini4G", "iPhone6Plus", "iPadFourthGen4G", "iPodTouchFifthGen"], "advisories": [], "isGameCenterEnabled": true, "trackCensoredName": "白猫プロジェクト", "languageCodesISO2A": ["JA"], "fileSizeBytes": "93094891", "sellerUrl": "http://colopl.co.jp/shironekoproject/", "contentAdvisoryRating": "4+", "averageUserRatingForCurrentVersion": 4.0, "userRatingCountForCurrentVersion": 2848, "artworkUrl100": "http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/11/56/d2/1156d268-22eb-822e-0579-bfbb32cfaef6/mzl.vxcebezk.png", "trackViewUrl": "https://itunes.apple.com/jp/app/bai-maopurojekuto/id895687962?mt=8&uo=4", "trackContentRating": "4+", "wrapperType": "software", "version": "1.0.30", "genreIds": ["6014", "7014", "6016", "7001"], "artistId": 376314072, "artistName": "COLOPL, Inc.", "genres": ["ゲーム", "ロールプレイング", "エンターテインメント", "アクション"], "price": 0.00,
                                    "description": "世界は、君の指先に託される――\n\nコロプラが総力を結集して贈る期待の「王道」RPG、ついに始動。\nその名もワンフィンガーRPG「白猫プロジェクト」！\n\nダウンロードは無料、面倒な登録や難しい操作も不要。\nスマートフォンでついに実現した正真正銘の「王道」RPGを、今すぐプレイしよう！\n\n■スマートフォンの操作に革命を起こす「ぷにコン」搭載■\n移動も攻撃もスキルも指一本でカンタン操作、壮大な世界を自由自在に行き来して、ド派手なバトルを楽しもう！\n\n■最大4人で一緒に遊べる「協力バトル」へ挑戦■\n友だち同士で誘い合い、育てたキャラクターで一緒にバトルを楽しめる！　ともに強大な敵に立ち向かおう！\n\n■飛行島に自分だけの「タウン」を作ろう■\nゲームを進めると登場する「飛行島」には、ゴールドを得られる「金鉱」やキャラクターを強化する「訓練所」などを建設可能！\n自分好みに建設＆コーディネートして、オリジナルの飛行島を作ろう！\n\n■７種類の「スタイル」を持つ個性的なキャラクター■\n剣士・ランサー・ウォリアー・アーチャー・武闘家・魔道士・クロスセイバー、７つのスタイルが登場！\n場面に応じたパーティーを編成して、冒険に挑もう！\n\n■キャラクター育成のカギを握る「ソウルボード」■\n仲間にしたキャラクターは「ソウルボード」で育成！\n攻撃力を優先してアップさせたり、気になるスキルを解放したりと、育て方は思いのまま！\n\n■仲間たちと友情を深めよう■\n仲間にしたキャラクターたちは飛行島に登場！\n友情を深めればキャラクターにまつわるストーリーが語られ、絆が最大まで深まると「友情覚醒」で仲間が大きくパワーアップ！\n\n■「白猫」と「黒猫」をめぐり紡がれる物語■\n物語のはじまりは、ずっとずっとむかしのこと。\n遥か彼方に浮かぶ天空の大陸で「白」と「黒」の猫が出会ったとき、遠く未来へと続く大いなるストーリーが幕を開く――\n\n-株式会社コロプラ提供-", "currency": "JPY", "trackId": 895687962, "trackName": "白猫プロジェクト", "bundleId": "jp.colopl.wcat", "releaseDate": "2014-07-25T09:34:43Z", "sellerName": "COLOPL, Inc.", "primaryGenreName": "Games", "primaryGenreId": 6014, "isVppDeviceBasedLicensingEnabled": false,
                                    "releaseNotes": "【ver 1.0.30】\n・一部スキルのダメージ計算において、ダメージアップリーダースキルの効果が二重に加算される不具合を修正しました\n・特定のケースにおいて、被ダメージ上限値(90%)を超えることがある不具合を修正しました\n・リリエルのアクションスキル「ブラッドイラプション」においてダメージ軽減の影響をうける不具合を修正しました\n・シズクのアクションスキル「鏡花吟風刃」発動中に、移動速度アップ効果をうけると移動してしまう不具合を修正しました\n・シズクのアクションスキル「鏡花吟風刃」において、ぷにコン入力をおこなうとターゲット方向以外にも攻撃をできるように変更いたしました\n・メモリ負荷軽減のため武器装備画面などの、装備中アイコンを変更しました\n・UIおよび演出、機能をブラッシュアップしました\n・その他、不具合を修正しました", "formattedPrice": "無料", "minimumOsVersion": "6.0", "averageUserRating": 4.0, "userRatingCount": 97609
                                }
                            },
                            {
                                "campaign_id": 4,
                                "creatives": [
                                    {
                                        "creative_id": 114,
                                        "player_html_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "video_url": "https://doc-0k-6o-docs.googleusercontent.com/docs/securesc/ha0ro937gcuc7l7deffksulhg5h7mbp1/nl1b12q197r1bfpdmhuch4c6b5stvskb/1434427200000/06328133427177890713/*/0B4ovHFce0xk-c19yQWVYOTU5Rnc?e=download",
                                        "transfer_url": "https://itunes.apple.com/jp/app/kukkijamu/id727296976?mt=8",
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
                                "lookup": {
                                    "artistViewUrl": "https://itunes.apple.com/jp/artist/sgn/id290671617?uo=4", "artworkUrl60": "http://is1.mzstatic.com/image/pf/us/r30/Purple7/v4/0c/3e/5c/0c3e5c11-8e6d-2388-5c9b-ec99f2d7a99b/Icon.png",
                                    "screenshotUrls": ["http://a2.mzstatic.com/jp/r30/Purple3/v4/af/ab/13/afab1353-121f-9208-3c38-e1397ccc2763/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple3/v4/4f/31/23/4f312368-0c47-f6b2-6e38-24e7915b9ad7/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/9e/0e/35/9e0e35a8-7f05-9454-2e2c-c1b327f441c2/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/e8/a9/0b/e8a90b38-a202-4eb0-49f9-b75bdce99583/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple5/v4/8d/3a/3d/8d3a3d3e-e06a-f8cc-9dec-fed5c9499fd9/screen1136x1136.jpeg"],
                                    "ipadScreenshotUrls": ["http://a3.mzstatic.com/jp/r30/Purple5/v4/fe/0a/37/fe0a37c3-14bc-860b-6d11-3642127f5e34/screen480x480.jpeg", "http://a4.mzstatic.com/jp/r30/Purple5/v4/c7/f1/39/c7f139a6-d47c-d64e-8a36-d42583a64083/screen480x480.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/32/d7/70/32d770a0-f987-db92-e08d-5879ad889e93/screen480x480.jpeg", "http://a3.mzstatic.com/jp/r30/Purple1/v4/3f/79/98/3f7998b1-652a-24ff-ba5c-f71021106eb6/screen480x480.jpeg", "http://a3.mzstatic.com/jp/r30/Purple1/v4/4d/16/4f/4d164fc8-97fe-4012-b2c5-d37b2d35923f/screen480x480.jpeg"], "artworkUrl512": "http://is1.mzstatic.com/image/pf/us/r30/Purple1/v4/ce/30/5c/ce305cd1-6560-f59b-eb8f-8f2f8feb8cf1/pr_source.png", "kind": "software", "features": ["iosUniversal"],
                                    "supportedDevices": ["iPadThirdGen4G", "iPadFourthGen4G", "iPadMini", "iPhone5c", "iPad2Wifi", "iPhone4S", "iPadThirdGen", "iPhone5", "iPhone6Plus", "iPhone-3GS", "iPad23G", "iPhone6", "iPhone5s", "iPhone4", "iPadMini4G", "iPadFourthGen", "iPodTouchFourthGen", "iPodTouchFifthGen"], "advisories": [], "isGameCenterEnabled": false, "trackCensoredName": "クッキージャム", "trackViewUrl": "https://itunes.apple.com/jp/app/kukkijamu/id727296976?mt=8&uo=4", "contentAdvisoryRating": "4+", "artworkUrl100": "http://is1.mzstatic.com/image/pf/us/r30/Purple1/v4/ce/30/5c/ce305cd1-6560-f59b-eb8f-8f2f8feb8cf1/pr_source.png", "languageCodesISO2A": ["CS", "NL", "EN", "FR", "DE", "IT", "JA", "KO", "PL", "PT", "RU", "ZH", "ES", "SV", "ZH", "TR"], "fileSizeBytes": "73588150", "sellerUrl": "http://playcookiejam.com/", "averageUserRatingForCurrentVersion": 4.5, "userRatingCountForCurrentVersion": 70, "trackContentRating": "4+", "currency": "JPY", "wrapperType": "software", "version": "3.82.100", "artistId": 290671617, "artistName": "SGN", "genres": ["ゲーム", "パズル", "ストラテジー", "エンターテインメント"], "price": 0.00,
                                    "description": "クッキーがくずれる前に食べちゃおう！3つの材料を集めてとってもおいしいレシピをつくるのは楽しくって難しい！あなたのベーカリーと共にパズルの冒険の旅に漕ぎ出して、パティシエとしてほっぺたが落ちちゃうようなレシピを作っちゃおう！\n\n一度始めたらやみつきになる、レシピ作りのためのパズルが満載！おいしいコンボを駆使してクリアしよう！早く作って食べないと、\nジンジャーブレッドマンにあなたのレシピがこわされちゃうかも…？イッツ・クランチタイム！ \n \nレシピ:\n- 数百もの歯ごたえ満点なステージ\n- おいしくてスウィートなパワーアップやコンボ\n- 不思議であまーい世界感\n- 楽しくてとっても簡単操作。でも一人前のパティシエになるのは大変！\n \nトッピング:\n- Facebookで繋がって友達と冒険を共有できる\n- 各種イベントが盛りだくさん\n- 複数のデバイスとプラットフォームでデータを共有できる\n \n\"このゲームが3つ揃えるパズルの中で一番の私のお気に入り。レシピを完成させたときの気分がとってもユニークで大好き。\"\n-レオニー, フロリダ州\n\n\"ボードの上でつくるスペシャルコンボが大好き。いろんなピースをくっつけて、一体どうなるのか見るのが楽しいの！\"\n-エリー, ニューメキシコ州\n\n\"このゲームには本当にクールなチャレンジがたくさん！特にブレッドジンジャーマンとの接近戦が大好き！\"\n-シャロン, ケンタッキー州\n\nいいね！: https://www.facebook.com/cookiejamgame\nフォロー: @SGNgames\n \n開発者情報: SGNはクロスプラットフォームでソーシャルゲームを提供するリーディングカンパニーの一つです。トップチャートにPanda Pop、Panda Jamなどのゲームがたくさん！いつでもどこでも遊べます。", "bundleId": "com.sgn.cookiejam", "trackId": 727296976, "trackName": "クッキージャム", "genreIds": ["6014", "7012", "7017", "6016"], "releaseDate": "2014-01-08T00:35:15Z", "sellerName": "SGN", "primaryGenreName": "Games", "primaryGenreId": 6014, "isVppDeviceBasedLicensingEnabled": false, "releaseNotes": "bug fixes", "minimumOsVersion": "6.1", "formattedPrice": "無料", "averageUserRating": 4.5, "userRatingCount": 3870
                                }
                            },
                        ],
                        "default_mute": false,
                        "skippable_after_sec": 0,
                    },
                ]
            };
        }
    })();
}
// 指定された任意の App Store アプリの情報を取得
(function () {
    var m = location.search.match('id=(\\d+)');
    if (m) {
        var id = m[1];
        document.write('<script src="https://itunes.apple.com/lookup?country=JP&callback=debug_jsonp_onLookup&id=' + id + '"></' + 'script>');
    }
})();

