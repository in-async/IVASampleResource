(function () {
    var zoneEid = 'zone3';
    var campaignId = 3;
    var creativeId = 113;
    var creativePath = '';
    var mediaJson = {
        "default_zone_eid": "zone2",
        "settings": {
            "log_click_url": "http://192.168.1.10:8003/api/log_click",
            "log_view_url": "http://192.168.1.10:8003/api/log_view",
            "player_html_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/player.html"
        },
        "zones": [
            {
                "allowed_portrait_play": false,
                "allowed_skip": false,
                "campaigns": [
                    {
                        "campaign_id": 1,
                        "app_title": "ねこの気持ち",
                        "creatives": [
                            {
                                "creative_id": 111,
                                "video_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/111/video.mp4",
                                "endcard_portrait_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/111/endcard_portrait.jpg",
                                "endcard_landscape_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/111/endcard_landscape.jpg",
                                "app_icon_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/111/icon.png",
                                "transfer_url": "http://www.yahoo.co.jp/"
                            }
                        ],
                        "daily_budget_remaining": 300,
                        "deliver_end_time": "2015-06-30T15:00:00Z",
                        "frequency": 5,
                        "recency": 10
                    }
                ],
                "default_mute": false,
                "skippable_after_sec": 0,
                "zone_eid": "zone1",
                "zone_id": 1
            },
            {
                "allowed_portrait_play": false,
                "allowed_skip": false,
                "campaigns": [
                    {
                        "campaign_id": 2,
                        "app_title": "サンプルタイトル",
                        "creatives": [
                            {
                                "creative_id": 112,
                                "video_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/112/video.mp4",
                                "endcard_portrait_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/112/endcard_portrait.png",
                                "endcard_landscape_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/112/endcard_landscape.png",
                                "app_icon_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/112/icon.png",
                                "transfer_url": "http://www.yahoo.co.jp/"
                            }
                        ],
                        "daily_budget_remaining": 300,
                        "deliver_end_time": "2015-06-30T15:00:00Z",
                        "frequency": 5,
                        "recency": 10
                    }
                ],
                "default_mute": false,
                "skippable_after_sec": 0,
                "zone_eid": "zone2",
                "zone_id": 2
            },
            {
                "allowed_portrait_play": false,
                "allowed_skip": false,
                "campaigns": [
                    {
                        "campaign_id": 3,
                        "app_title": "サンプルタイトル",
                        "creatives": [
                            {
                                "creative_id": 113,
                                "video_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/113/video.mp4",
                                "endcard_portrait_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/113/endcard.jpg",
                                "app_icon_url": "https://raw.githubusercontent.com/in-async/IVASampleResource/master/creatives/113/icon.png",
                                "transfer_url": "http://www.yahoo.co.jp/"
                            }
                        ],
                        "daily_budget_remaining": 300,
                        "deliver_end_time": "2015-06-30T15:00:00Z",
                        "frequency": 5,
                        "recency": 10
                    }
                ],
                "default_mute": false,
                "skippable_after_sec": 0,
                "zone_eid": "zone3",
                "zone_id": 3
            }
        ]
    };
    var duration = 3.0;
    var video;

    // 疑似イベント励起
    window.addEventListener('load', function () {
        native_onLoadAd(zoneEid, campaignId, creativeId, creativePath, mediaJson);

        // 疑似動画再生準備
        (function () {
            video = document.createElement('video');
            video.setAttribute('src', _creative.video_url);
            //video.setAttribute('autoplay', 'autoplay');
            video.setAttribute('style', 'position:absolute; width:100%; height:100%; top:0; left:0; background-color:#000');

            // 動画のイベントハンドラ設定
            video.addEventListener('play', function () {
                console.log('video.play');
                native_onStartedAd(zoneEid);
            });
            video.addEventListener('pause', function () {
                console.log('video.pause');
            });
            video.addEventListener('ended', function () {
                console.log('video.ended');
                native_onFinishedAd(zoneEid, video.duration, false);
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
    });
    /**
     * debug 用スタブメソッド
     */
    var currentTime = 0;
    var elapsed = 0;
    var skipped = false;
    var intervalId;
    nativeApi = function (method, jsonArgs, callback) {
        switch (method) {
            case 'startVideo':
                video.play();
                break;
            case 'pauseVideo':
                video.pause();
                break;
            case 'skipAd':
                video.pause();
                native_onFinishedAd(zoneEid, video.currentTime, true);
                break;
            case 'openClickUrl':
                window.open(jsonArgs.url);
                break;
            case 'closeAd':
                break;
            case 'getCreativeAsBase64':
                setTimeout(function () {
                    callback(jsonArgs.creativeUrl);
                }, 0);
                break;
        }
    };

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
})();

