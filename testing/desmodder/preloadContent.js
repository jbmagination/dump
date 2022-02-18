/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/utils/injectScript.ts
// https://stackoverflow.com/a/9517879
// injects script.ts into the correct window context
function injectScript(url) {
    let s = document.createElement("script");
    s.src = url;
    s.onload = function () {
        // remove the script so it doesn't appear in the DOM tree
        s.remove();
    };
    const head = document.head || document.documentElement;
    if (head !== null) {
        head.appendChild(s);
    }
}

;// CONCATENATED MODULE: ./src/utils/messages.ts
/*
Post message conventions:
  Always have a type
  Start type with an underscore (e.g. "_plugins-enabled") for DesModder
    (leaves non-underscore namespace free for plugins)
  apply-* = message from content script to page, applying some data
  set-* = message from page to content script, asking to store data in chrome.storage
  get-* = message from page to content script, asking to get data in chrome.storage
*/
function postMessage(message) {
    window.postMessage(message, "*");
}
function postMessageUp(message) {
    postMessage(message);
}
function postMessageDown(message) {
    postMessage(message);
}
// https://stackoverflow.com/a/11431812/7481517
function listenToMessage(callback) {
    const wrappedCallback = (event) => {
        if (event.source !== window) {
            return;
        }
        const cancel = callback(event.data);
        if (cancel) {
            window.removeEventListener("message", wrappedCallback, false);
        }
    };
    window.addEventListener("message", wrappedCallback, false);
    return wrappedCallback;
}
function listenToMessageUp(callback) {
    listenToMessage(callback);
}
function listenToMessageDown(callback) {
    listenToMessage(callback);
}

;// CONCATENATED MODULE: ./src/preload/content.ts


const StorageKeys = {
    pluginsEnabled: "_plugins-enabled",
    pluginSettings: "_plugin-settings",
};
function getInitialData() {
    chrome.storage.sync.get({
        [StorageKeys.pluginsEnabled]: {},
        [StorageKeys.pluginSettings]: {}, // default: no settings known
    }, (items) => {
        postMessageDown({
            type: "apply-plugin-settings",
            value: items[StorageKeys.pluginSettings],
        });
        postMessageDown({
            type: "apply-plugins-enabled",
            value: items[StorageKeys.pluginsEnabled],
        });
    });
}
listenToMessageUp((message) => {
    switch (message.type) {
        case "enable-script":
            if (message.scriptName === "wolfram2desmos") {
                injectScript("./wolfram2desmos.js");
            }
            break;
        case "get-initial-data":
            getInitialData();
            break;
        case "set-plugins-enabled":
            chrome.storage.sync.set({
                [StorageKeys.pluginsEnabled]: message.value,
            });
            break;
        case "set-plugin-settings":
            chrome.storage.sync.set({
                [StorageKeys.pluginSettings]: message.value,
            });
            break;
        case "get-script-url":
            postMessageDown({
                type: "set-script-url",
                value: "./script.js",
            });
            break;
        case "get-worker-append-url":
            postMessageDown({
                type: "set-worker-append-url",
                value: "./workerAppend.js",
            });
            break;
    }
});
injectScript("./preloadScript.js");

/******/ })()
;