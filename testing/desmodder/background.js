/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

chrome.action.onClicked.addListener(() => {
    chrome.tabs.create({
        url: "https://www.desmos.com/calculator",
    });
});

/******/ })()
;