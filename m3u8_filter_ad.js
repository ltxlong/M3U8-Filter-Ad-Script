// ==UserScript==
// @name         M3U8 Filter Ad Script
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  自用，拦截和过滤 m3u8（解析/采集资源） 的广告切片，同时打印被过滤的行信息。
// @author       ltxlong
// @match        *://*/*
// @grant        unsafeWindow
// @run-at       document-start
// @license      MIT
// @downloadURL https://update.greasyfork.org/scripts/512300/M3U8%20Filter%20Ad%20Script.user.js
// @updateURL https://update.greasyfork.org/scripts/512300/M3U8%20Filter%20Ad%20Script.meta.js
// ==/UserScript==

(function() {
    'use strict';

    initHook();

    function initHook() {
        hookXHR();
    }

    let ts_name_len = 0; // ts前缀长度

    let ts_name_len_extend = 1; // 容错

    let prev_ts_name_index = -1; // ts序列号

    let ts_type = 0; // 0-xxxx000数字递增.ts模式 ；1-xxxxxxxxxx.ts模式

    function isM3U8File(url) {
        return /\.m3u8($|\?)/.test(url);
    }

    async function safelyProcessM3U8(url, content) {
        try {
            const lines = content.split('\n');
            const newLines = filterLines(lines);

            return newLines.join('\n');
        } catch (e) {
            console.error(`处理 m3u8 文件时出错: ${url}`, e);
            return content;
        }
    }

    function extractNumberBeforeTS(str) {
        // 匹配 .ts 前面的数字
        const match = str.match(/(\d+)\.ts/);

        if (match) {
            // 使用 parseInt 去掉前导 0
            return parseInt(match[1], 10);
        }

        return null; // 如果不匹配，返回 null
    }

    function filterLines(lines) {
        let result = [];

        // 先根据第一个ts名称来初始化参数
        for (let i = 0; i < lines.length; i++) {

            const line = lines[i];

            let the_ts_name_len = line.indexOf('.ts'); // ts前缀长度

            if (the_ts_name_len > 0) {

                ts_name_len = the_ts_name_len;

                let ts_name_index = extractNumberBeforeTS(line);
                if (ts_name_index === null) {
                    ts_type = 1; // ts命名模式

                    console.log('----------------------------识别ts模式1---------------------------');

                } else {
                    prev_ts_name_index = ts_name_index; // ts序列号
                    prev_ts_name_index--;
                }

                break;
            }

            if (i === lines.length - 1) {
                console.log('----------------------------识别ts模式0---------------------------');
            }

        }

        // 开始遍历过滤
        for (let i = 0; i < lines.length; i++) {

            let ts_index_check = false;

            const line = lines[i];

            if (ts_type === 0) {

                if (line.startsWith('#EXT-X-DISCONTINUITY') && lines[i + 1] && lines[i + 2]) {

                    // 检查当前行是否跟 #EXT-X-PLAYLIST-TYPE相关
                    if (i > 0 && lines[i - 1].startsWith('#EXT-X-PLAYLIST-TYPE')) {
                        result.push(line);

                        continue;
                    } else {
                        let the_ts_name_len = lines[i + 2].indexOf('.ts'); // ts前缀长度

                        if (the_ts_name_len > 0) {

                            // 根据ts名字长度过滤
                            if (the_ts_name_len - ts_name_len > ts_name_len_extend) {
                                // 广告过滤
                                if (lines[i + 3] && lines[i + 3].startsWith('#EXT-X-DISCONTINUITY')) {
                                    // 打印即将过滤的行
                                    console.log('------------------------------------------------------------------');
                                    console.log('过滤规则: #EXT-X-DISCONTINUITY-ts文件名长度-');
                                    console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2], "\n", lines[i + 3]);
                                    console.log('------------------------------------------------------------------');

                                    i += 3;
                                } else {
                                    // 打印即将过滤的行
                                    console.log('------------------------------------------------------------------');
                                    console.log('过滤规则: #EXT-X-DISCONTINUITY-ts文件名长度');
                                    console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2]);
                                    console.log('------------------------------------------------------------------');

                                    i += 2;
                                }

                                continue;
                            } else {
                                ts_name_len = the_ts_name_len;
                            }

                            // 根据ts序列号过滤
                            let the_ts_name_index = extractNumberBeforeTS(lines[i + 2]);

                            if (the_ts_name_index !== prev_ts_name_index + 1) {

                                // 广告过滤
                                if (lines[i + 3] && lines[i + 3].startsWith('#EXT-X-DISCONTINUITY')) {
                                    // 打印即将过滤的行
                                    console.log('------------------------------------------------------------------');
                                    console.log('过滤规则: #EXT-X-DISCONTINUITY-ts序列号-');
                                    console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2], "\n", lines[i + 3]);
                                    console.log('------------------------------------------------------------------');

                                    i += 3;
                                } else {
                                    // 打印即将过滤的行
                                    console.log('------------------------------------------------------------------');
                                    console.log('过滤规则: #EXT-X-DISCONTINUITY-ts序列号');
                                    console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2]);
                                    console.log('------------------------------------------------------------------');

                                    i += 2;
                                }

                                continue;
                            }
                        }
                    }
                }

                if (line.startsWith('#EXTINF') && lines[i + 1]) {

                    let the_ts_name_len = lines[i + 1].indexOf('.ts'); // ts前缀长度

                    if (the_ts_name_len > 0) {

                        // 根据ts名字长度过滤
                        if (the_ts_name_len - ts_name_len > ts_name_len_extend) {
                            // 广告过滤
                            if (lines[i + 2] && lines[i + 2].startsWith('#EXT-X-DISCONTINUITY')) {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXTINF-ts文件名长度-');
                                console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2]);
                                console.log('------------------------------------------------------------------');

                                i += 2;
                            } else {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXTINF-ts文件名长度');
                                console.log('过滤的行:', "\n", line, "\n", lines[i + 1]);
                                console.log('------------------------------------------------------------------');

                                i += 1;
                            }

                            continue;
                        } else {
                            ts_name_len = the_ts_name_len;
                        }

                        // 根据ts序列号过滤
                        let the_ts_name_index = extractNumberBeforeTS(lines[i + 1]);

                        if (the_ts_name_index === prev_ts_name_index + 1) {

                            prev_ts_name_index++;

                        } else {
                            // 广告过滤
                            if (lines[i + 2].startsWith('#EXT-X-DISCONTINUITY')) {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXTINF-ts序列号-');
                                console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2]);
                                console.log('------------------------------------------------------------------');

                                i += 2;
                            } else {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXTINF-ts序列号');
                                console.log('过滤的行:', "\n", line, "\n", lines[i + 1]);
                                console.log('------------------------------------------------------------------');

                                i += 1;
                            }

                            continue;
                        }
                    }
                }
            } else {

                if (line.startsWith('#EXT-X-DISCONTINUITY')) {
                    // 检查当前行是否跟 #EXT-X-PLAYLIST-TYPE相关
                    if (i > 0 && lines[i - 1].startsWith('#EXT-X-PLAYLIST-TYPE')) {
                        result.push(line);

                        continue;
                    } else {

                        // 如果第 i+2 行是 .ts 文件，跳过当前行和接下来的两行
                        if (lines[i + 2] && lines[i + 2].indexOf('.ts') > 0) {
                            // 进一步检测第 i+3 行是否也是 #EXT-X-DISCONTINUITY
                            if (lines[i + 3] && lines[i + 3].startsWith('#EXT-X-DISCONTINUITY')) {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXT-X-DISCONTINUITY-广告-#EXT-X-DISCONTINUITY过滤');
                                console.log('过滤的行:', "\n", line, "\n", lines[i + 1], "\n", lines[i + 2], "\n", lines[i + 3]);
                                console.log('------------------------------------------------------------------');

                                i += 3; // 跳过当前行和接下来的三行
                            } else {
                                // 打印即将过滤的行
                                console.log('------------------------------------------------------------------');
                                console.log('过滤规则: #EXT-X-DISCONTINUITY-单个标识过滤');
                                console.log('过滤的行:', "\n", line);
                                console.log('------------------------------------------------------------------');
                            }

                            continue;
                        }
                    }
                }
            }

            // 保留不需要过滤的行
            result.push(line);
        }

        return result;
    }

    function hookXHR() {
        const OriginalXHR = unsafeWindow.XMLHttpRequest;
        unsafeWindow.XMLHttpRequest = class extends OriginalXHR {
            constructor() {
                super();

                this.addEventListener('readystatechange', async function () {
                    if (this.readyState === 4 && this.status === 200 && isM3U8File(this.responseURL)) {
                        const modifiedResponse = await safelyProcessM3U8(this.responseURL, this.responseText);
                        Object.defineProperty(this, 'responseText', { value: modifiedResponse });
                        Object.defineProperty(this, 'response', { value: modifiedResponse });
                    }
                }, false);
            }
        };
    }

})();
