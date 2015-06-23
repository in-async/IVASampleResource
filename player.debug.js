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

        // ad_template_params を lookup で上書き
        if (lookup) {
            var original_params = _creative.ad_template_params;
            _creative.ad_template_params = {
                "video_url": original_params.video_url,
                "transfer_url": lookup.trackViewUrl,
                "icon_url": lookup.artworkUrl100.slice(0, -4) + '.100x100-75.png',
                "screenshot_urls": lookup.screenshotUrls,
                "app_name": lookup.trackName,
                "seller_name": lookup.sellerName,
                "average_rating": lookup.averageUserRating,
                "rating_count": lookup.userRatingCount,
            };
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
                    native_onPreparedVideo(5);
                    // プレイヤーを非表示
                    document.getElementById('video-page').style.display = 'none';

                    native_onFinishedAd(5, false);
                }, 0);
            } else {
                (function () {
                    video = document.createElement('video');
                    video.setAttribute('src', _creative.ad_template_params.video_url);
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
                        native_onPreparedVideo(video.duration);
                        native_onPreparedAd();
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
                        native_onFinishedAd(video.duration, false);
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
                            native_onFinishedAd(5, false);
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
                            native_onFinishedAd(5, false);
                        }, 300);
                    }
                    break;
                case 'skipAd':
                    var playtime = 5;
                    if (video) {
                        video.pause();
                        playtime = video.currentTime;
                    }
                    native_onFinishedAd(playtime, true);
                    break;
                case 'sendViewLog':
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
                    "log_click_url": "http://deliverlog.maio.jp/api/log_click",
                    "log_view_url": "http://deliverlog.maio.jp/api/log_view",
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
                                        "ad_template_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "ad_template_params": {
                                            "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "transfer_url": "https://itunes.apple.com/jp/app/pazuru-doragonzu/id493470467?mt=8&uo=2",
                                            "icon_url": "http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/c7/b4/52/c7b45204-99c2-d141-27d0-85b7c7d4f7a2/mzl.qhazfnih.100x100-75.png",
                                            "screenshot_urls": ["http://a4.mzstatic.com/jp/r30/Purple3/v4/67/23/19/672319a2-7b95-c9b3-fc1c-2847758876f0/screen322x572.jpeg", "http://a5.mzstatic.com/jp/r30/Purple1/v4/41/6d/11/416d11bb-1d0e-6171-861f-dd9558d7bbe1/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/9f/dd/fe/9fddfe19-39bf-6959-f8e9-ac9ef61d7195/screen322x572.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/2a/8b/8e/2a8b8ea6-65d9-f6d1-ce8d-36646422cba0/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a4/0e/c8/a40ec86d-721e-9dcf-f6cc-78c429f8674a/screen322x572.jpeg"],
                                            "app_name": "パズル＆ドラゴンズ",
                                            "seller_name": "GungHo Online Entertainment, INC.",
                                            "average_rating": 4.5,
                                            "rating_count": 476188,
                                        },
                                        "ad_template_creative_urls": [
                                            "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "http://is2.mzstatic.com/image/pf/us/r30/Purple5/v4/c7/b4/52/c7b45204-99c2-d141-27d0-85b7c7d4f7a2/mzl.qhazfnih.100x100-75.png",
                                            "http://a4.mzstatic.com/jp/r30/Purple3/v4/67/23/19/672319a2-7b95-c9b3-fc1c-2847758876f0/screen322x572.jpeg", "http://a5.mzstatic.com/jp/r30/Purple1/v4/41/6d/11/416d11bb-1d0e-6171-861f-dd9558d7bbe1/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/9f/dd/fe/9fddfe19-39bf-6959-f8e9-ac9ef61d7195/screen322x572.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/2a/8b/8e/2a8b8ea6-65d9-f6d1-ce8d-36646422cba0/screen322x572.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a4/0e/c8/a40ec86d-721e-9dcf-f6cc-78c429f8674a/screen322x572.jpeg",
                                        ],
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
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
                                        "ad_template_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "ad_template_params": {
                                            "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "transfer_url": "https://itunes.apple.com/jp/app/monsutasutoraiku/id658511662?mt=8&uo=2",
                                            "icon_url": "http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/dc/f7/32/dcf73253-6f1c-cdb0-5c02-19e4a67395af/mzl.sijlkump.100x100-75.png",
                                            "screenshot_urls": ["http://a2.mzstatic.com/jp/r30/Purple1/v4/1e/a4/54/1ea45485-e971-2ade-335f-84429e11e26e/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple5/v4/2d/b1/18/2db1189e-a068-eff2-7bb2-8050c5bae595/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a2/c3/24/a2c32443-8c94-df8b-bc23-c3aa8d9db0b4/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/33/02/01/3302016d-4df3-4e04-4ff6-d42f980ff1dc/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/1c/f5/bf/1cf5bfc8-ddb3-6354-3ced-c9578bd5877e/screen1136x1136.jpeg"],
                                            "app_name": "モンスターストライク",
                                            "seller_name": "mixi, Inc",
                                            "average_rating": 4.5,
                                            "rating_count": 2361529,
                                        },
                                        "ad_template_creative_urls": [
                                            "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "http://is1.mzstatic.com/image/pf/us/r30/Purple5/v4/dc/f7/32/dcf73253-6f1c-cdb0-5c02-19e4a67395af/mzl.sijlkump.100x100-75.png",
                                            "http://a2.mzstatic.com/jp/r30/Purple1/v4/1e/a4/54/1ea45485-e971-2ade-335f-84429e11e26e/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple5/v4/2d/b1/18/2db1189e-a068-eff2-7bb2-8050c5bae595/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple5/v4/a2/c3/24/a2c32443-8c94-df8b-bc23-c3aa8d9db0b4/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple1/v4/33/02/01/3302016d-4df3-4e04-4ff6-d42f980ff1dc/screen1136x1136.jpeg", "http://a2.mzstatic.com/jp/r30/Purple3/v4/1c/f5/bf/1cf5bfc8-ddb3-6354-3ced-c9578bd5877e/screen1136x1136.jpeg",
                                        ],
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
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
                                        "ad_template_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "ad_template_params": {
                                            "video_url": "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "transfer_url": "https://itunes.apple.com/jp/app/bai-maopurojekuto/id895687962?mt=8&uo=2",
                                            "icon_url": "http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/11/56/d2/1156d268-22eb-822e-0579-bfbb32cfaef6/mzl.vxcebezk.100x100-75.png",
                                            "screenshot_urls": ["http://a5.mzstatic.com/jp/r30/Purple5/v4/4d/31/8f/4d318f25-40b3-c790-4f38-3110ed762456/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/09/7b/a5/097ba521-e80a-ddb8-de90-f3d50a1cc635/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple1/v4/19/b7/d4/19b7d43a-0e71-6c7a-c889-f0bed37648c4/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple5/v4/27/26/8c/27268c61-fae0-e34c-5d36-c574aa53ea11/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/10/4d/f5/104df581-17a7-ab7b-ff24-8bf6eee5c980/screen1136x1136.jpeg"],
                                            "app_name": "白猫プロジェクト",
                                            "seller_name": "COLOPL, Inc.",
                                            "average_rating": 4.0,
                                            "rating_count": 97609,
                                        },
                                        "ad_template_creative_urls": [
                                            "https://github.com/in-async/IVASampleResource/raw/master/creatives/113/video.mp4",
                                            "http://is5.mzstatic.com/image/pf/us/r30/Purple1/v4/11/56/d2/1156d268-22eb-822e-0579-bfbb32cfaef6/mzl.vxcebezk.100x100-75.png",
                                            "http://a5.mzstatic.com/jp/r30/Purple5/v4/4d/31/8f/4d318f25-40b3-c790-4f38-3110ed762456/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/09/7b/a5/097ba521-e80a-ddb8-de90-f3d50a1cc635/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple1/v4/19/b7/d4/19b7d43a-0e71-6c7a-c889-f0bed37648c4/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple5/v4/27/26/8c/27268c61-fae0-e34c-5d36-c574aa53ea11/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/10/4d/f5/104df581-17a7-ab7b-ff24-8bf6eee5c980/screen1136x1136.jpeg",
                                        ],
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
                            },
                            {
                                "campaign_id": 4,
                                "creatives": [
                                    {
                                        "creative_id": 114,
                                        "ad_template_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html",
                                        "ad_template_params": {
                                            "video_url": "https://doc-0k-6o-docs.googleusercontent.com/docs/securesc/ha0ro937gcuc7l7deffksulhg5h7mbp1/nl1b12q197r1bfpdmhuch4c6b5stvskb/1434427200000/06328133427177890713/*/0B4ovHFce0xk-c19yQWVYOTU5Rnc?e=download",
                                            "transfer_url": "https://itunes.apple.com/jp/app/kukkijamu/id727296976?mt=8",
                                            "icon_url": "http://is1.mzstatic.com/image/pf/us/r30/Purple1/v4/ce/30/5c/ce305cd1-6560-f59b-eb8f-8f2f8feb8cf1/pr_source.100x100-75.png",
                                            "screenshot_urls": ["http://a2.mzstatic.com/jp/r30/Purple3/v4/af/ab/13/afab1353-121f-9208-3c38-e1397ccc2763/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple3/v4/4f/31/23/4f312368-0c47-f6b2-6e38-24e7915b9ad7/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/9e/0e/35/9e0e35a8-7f05-9454-2e2c-c1b327f441c2/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/e8/a9/0b/e8a90b38-a202-4eb0-49f9-b75bdce99583/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple5/v4/8d/3a/3d/8d3a3d3e-e06a-f8cc-9dec-fed5c9499fd9/screen1136x1136.jpeg"],
                                            "app_name": "クッキージャム",
                                            "seller_name": "SGN",
                                            "average_rating": 4.5,
                                            "rating_count": 3870,
                                        },
                                        "ad_template_creative_urls": [
                                            "https://doc-0k-6o-docs.googleusercontent.com/docs/securesc/ha0ro937gcuc7l7deffksulhg5h7mbp1/nl1b12q197r1bfpdmhuch4c6b5stvskb/1434427200000/06328133427177890713/*/0B4ovHFce0xk-c19yQWVYOTU5Rnc?e=download",
                                            "http://is1.mzstatic.com/image/pf/us/r30/Purple1/v4/ce/30/5c/ce305cd1-6560-f59b-eb8f-8f2f8feb8cf1/pr_source.100x100-75.png",
                                            "http://a2.mzstatic.com/jp/r30/Purple3/v4/af/ab/13/afab1353-121f-9208-3c38-e1397ccc2763/screen1136x1136.jpeg", "http://a1.mzstatic.com/jp/r30/Purple3/v4/4f/31/23/4f312368-0c47-f6b2-6e38-24e7915b9ad7/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple3/v4/9e/0e/35/9e0e35a8-7f05-9454-2e2c-c1b327f441c2/screen1136x1136.jpeg", "http://a3.mzstatic.com/jp/r30/Purple3/v4/e8/a9/0b/e8a90b38-a202-4eb0-49f9-b75bdce99583/screen1136x1136.jpeg", "http://a5.mzstatic.com/jp/r30/Purple5/v4/8d/3a/3d/8d3a3d3e-e06a-f8cc-9dec-fed5c9499fd9/screen1136x1136.jpeg",
                                        ],
                                    }
                                ],
                                "daily_budget_remaining": 300,
                                "deliver_end_time": "2015-06-30T15:00:00Z",
                                "frequency": 5,
                                "recency": 10,
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
(function () {
    // 指定された任意の App Store アプリの情報を取得
    var m = location.search.match('id=(\\d+)');
    if (m) {
        var id = m[1];
        document.write('<script src="https://itunes.apple.com/lookup?country=JP&callback=debug_jsonp_onLookup&id=' + id + '"></' + 'script>');
    }
})();
