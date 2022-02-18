/******/ (function() { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 50:
/***/ (function(module) {

"use strict";
module.exports = JSON.parse('{"name":"@ffmpeg/ffmpeg","version":"0.10.1","description":"FFmpeg WebAssembly version","main":"src/index.js","types":"src/index.d.ts","directories":{"example":"examples"},"scripts":{"start":"node scripts/server.js","build":"rimraf dist && webpack --config scripts/webpack.config.prod.js","prepublishOnly":"npm run build","lint":"eslint src","wait":"rimraf dist && wait-on http://localhost:3000/dist/ffmpeg.dev.js","test":"npm-run-all -p -r start test:all","test:all":"npm-run-all wait test:browser:ffmpeg test:node:all","test:node":"node --experimental-wasm-threads --experimental-wasm-bulk-memory node_modules/.bin/_mocha --exit --bail --require ./scripts/test-helper.js","test:node:all":"npm run test:node -- ./tests/*.test.js","test:browser":"mocha-headless-chrome -a allow-file-access-from-files -a incognito -a no-sandbox -a disable-setuid-sandbox -a disable-logging -t 300000","test:browser:ffmpeg":"npm run test:browser -- -f ./tests/ffmpeg.test.html"},"browser":{"./src/node/index.js":"./src/browser/index.js"},"repository":{"type":"git","url":"git+https://github.com/ffmpegwasm/ffmpeg.wasm.git"},"keywords":["ffmpeg","WebAssembly","video"],"author":"Jerome Wu <jeromewus@gmail.com>","license":"MIT","bugs":{"url":"https://github.com/ffmpegwasm/ffmpeg.wasm/issues"},"engines":{"node":">=12.16.1"},"homepage":"https://github.com/ffmpegwasm/ffmpeg.wasm#readme","dependencies":{"is-url":"^1.2.4","node-fetch":"^2.6.1","regenerator-runtime":"^0.13.7","resolve-url":"^0.2.1"},"devDependencies":{"@babel/core":"^7.12.3","@babel/preset-env":"^7.12.1","@ffmpeg/core":"^0.10.0","@types/emscripten":"^1.39.4","babel-loader":"^8.1.0","chai":"^4.2.0","cors":"^2.8.5","eslint":"^7.12.1","eslint-config-airbnb-base":"^14.1.0","eslint-plugin-import":"^2.22.1","express":"^4.17.1","mocha":"^8.2.1","mocha-headless-chrome":"^2.0.3","npm-run-all":"^4.1.5","wait-on":"^5.3.0","webpack":"^5.3.2","webpack-cli":"^4.1.0","webpack-dev-middleware":"^4.0.0"}}');

/***/ }),

/***/ 4076:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const resolveURL = __webpack_require__(5072);
const { devDependencies } = __webpack_require__(50);

/*
 * Default options for browser environment
 */
module.exports = {
  corePath:  false
    ? 0
    : `https://unpkg.com/@ffmpeg/core@${devDependencies['@ffmpeg/core'].substring(1)}/dist/ffmpeg-core.js`,
};


/***/ }),

/***/ 2339:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const resolveURL = __webpack_require__(5072);

const readFromBlobOrFile = (blob) => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

module.exports = async (_data) => {
  let data = _data;
  if (typeof _data === 'undefined') {
    return new Uint8Array();
  }

  if (typeof _data === 'string') {
    /* From base64 format */
    if (/data:_data\/([a-zA-Z]*);base64,([^"]*)/.test(_data)) {
      data = atob(_data.split(',')[1])
        .split('')
        .map((c) => c.charCodeAt(0));
    /* From remote server/URL */
    } else {
      const res = await fetch(resolveURL(_data));
      data = await res.arrayBuffer();
    }
  /* From Blob or File */
  } else if (_data instanceof File || _data instanceof Blob) {
    data = await readFromBlobOrFile(_data);
  }

  return new Uint8Array(data);
};


/***/ }),

/***/ 1440:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

/* eslint-disable no-undef */
const resolveURL = __webpack_require__(5072);
const { log } = __webpack_require__(888);

/*
 * Fetch data from remote URL and convert to blob URL
 * to avoid CORS issue
 */
const toBlobURL = async (url, mimeType) => {
  log('info', `fetch ${url}`);
  const buf = await (await fetch(url)).arrayBuffer();
  log('info', `${url} file size = ${buf.byteLength} bytes`);
  const blob = new Blob([buf], { type: mimeType });
  const blobURL = URL.createObjectURL(blob);
  log('info', `${url} blob URL = ${blobURL}`);
  return blobURL;
};

module.exports = async ({ corePath: _corePath }) => {
  if (typeof _corePath !== 'string') {
    throw Error('corePath should be a string!');
  }
  const coreRemotePath = resolveURL(_corePath);
  const corePath = await toBlobURL(
    coreRemotePath,
    'application/javascript',
  );
  const wasmPath = await toBlobURL(
    coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.wasm'),
    'application/wasm',
  );
  const workerPath = await toBlobURL(
    coreRemotePath.replace('ffmpeg-core.js', 'ffmpeg-core.worker.js'),
    'application/javascript',
  );
  if (typeof createFFmpegCore === 'undefined') {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      const eventHandler = () => {
        script.removeEventListener('load', eventHandler);
        log('info', 'ffmpeg-core.js script loaded');
        resolve({
          createFFmpegCore,
          corePath,
          wasmPath,
          workerPath,
        });
      };
      script.src = corePath;
      script.type = 'text/javascript';
      script.addEventListener('load', eventHandler);
      document.getElementsByTagName('head')[0].appendChild(script);
    });
  }
  log('info', 'ffmpeg-core.js script is loaded already');
  return Promise.resolve({
    createFFmpegCore,
    corePath,
    wasmPath,
    workerPath,
  });
};


/***/ }),

/***/ 3451:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const defaultOptions = __webpack_require__(4076);
const getCreateFFmpegCore = __webpack_require__(1440);
const fetchFile = __webpack_require__(2339);

module.exports = {
  defaultOptions,
  getCreateFFmpegCore,
  fetchFile,
};


/***/ }),

/***/ 1617:
/***/ (function(module) {

module.exports = {
  defaultArgs: [
    /* args[0] is always the binary path */
    './ffmpeg',
    /* Disable interaction mode */
    '-nostdin',
    /* Force to override output file */
    '-y',
  ],
  baseOptions: {
    /* Flag to turn on/off log messages in console */
    log: false,
    /*
     * Custom logger to get ffmpeg.wasm output messages.
     * a sample logger looks like this:
     *
     * ```
     * logger = ({ type, message }) => {
     *   console.log(type, message);
     * }
     * ```
     *
     * type can be one of following:
     *
     * info: internal workflow debug messages
     * fferr: ffmpeg native stderr output
     * ffout: ffmpeg native stdout output
     */
    logger: () => {},
    /*
     * Progress handler to get current progress of ffmpeg command.
     * a sample progress handler looks like this:
     *
     * ```
     * progress = ({ ratio }) => {
     *   console.log(ratio);
     * }
     * ```
     *
     * ratio is a float number between 0 to 1.
     */
    progress: () => {},
    /*
     * Path to find/download ffmpeg.wasm-core,
     * this value should be overwriten by `defaultOptions` in
     * each environment.
     */
    corePath: '',
  },
};


/***/ }),

/***/ 2648:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

const { defaultArgs, baseOptions } = __webpack_require__(1617);
const { setLogging, setCustomLogger, log } = __webpack_require__(888);
const parseProgress = __webpack_require__(6405);
const parseArgs = __webpack_require__(7010);
const { defaultOptions, getCreateFFmpegCore } = __webpack_require__(3451);
const { version } = __webpack_require__(50);

const NO_LOAD = Error('ffmpeg.wasm is not ready, make sure you have completed load().');

module.exports = (_options = {}) => {
  const {
    log: logging,
    logger,
    progress: optProgress,
    ...options
  } = {
    ...baseOptions,
    ...defaultOptions,
    ..._options,
  };
  let Core = null;
  let ffmpeg = null;
  let runResolve = null;
  let running = false;
  let progress = optProgress;
  const detectCompletion = (message) => {
    if (message === 'FFMPEG_END' && runResolve !== null) {
      runResolve();
      runResolve = null;
      running = false;
    }
  };
  const parseMessage = ({ type, message }) => {
    log(type, message);
    parseProgress(message, progress);
    detectCompletion(message);
  };

  /*
   * Load ffmpeg.wasm-core script.
   * In browser environment, the ffmpeg.wasm-core script is fetch from
   * CDN and can be assign to a local path by assigning `corePath`.
   * In node environment, we use dynamic require and the default `corePath`
   * is `$ffmpeg/core`.
   *
   * Typically the load() func might take few seconds to minutes to complete,
   * better to do it as early as possible.
   *
   */
  const load = async () => {
    log('info', 'load ffmpeg-core');
    if (Core === null) {
      log('info', 'loading ffmpeg-core');
      /*
       * In node environment, all paths are undefined as there
       * is no need to set them.
       */
      const {
        createFFmpegCore,
        corePath,
        workerPath,
        wasmPath,
      } = await getCreateFFmpegCore(options);
      Core = await createFFmpegCore({
        /*
         * Assign mainScriptUrlOrBlob fixes chrome extension web worker issue
         * as there is no document.currentScript in the context of content_scripts
         */
        mainScriptUrlOrBlob: corePath,
        printErr: (message) => parseMessage({ type: 'fferr', message }),
        print: (message) => parseMessage({ type: 'ffout', message }),
        /*
         * locateFile overrides paths of files that is loaded by main script (ffmpeg-core.js).
         * It is critical for browser environment and we override both wasm and worker paths
         * as we are using blob URL instead of original URL to avoid cross origin issues.
         */
        locateFile: (path, prefix) => {
          if (typeof window !== 'undefined') {
            if (typeof wasmPath !== 'undefined'
              && path.endsWith('ffmpeg-core.wasm')) {
              return wasmPath;
            }
            if (typeof workerPath !== 'undefined'
              && path.endsWith('ffmpeg-core.worker.js')) {
              return workerPath;
            }
          }
          return prefix + path;
        },
      });
      ffmpeg = Core.cwrap('proxy_main', 'number', ['number', 'number']);
      log('info', 'ffmpeg-core loaded');
    } else {
      throw Error('ffmpeg.wasm was loaded, you should not load it again, use ffmpeg.isLoaded() to check next time.');
    }
  };

  /*
   * Determine whether the Core is loaded.
   */
  const isLoaded = () => Core !== null;

  /*
   * Run ffmpeg command.
   * This is the major function in ffmpeg.wasm, you can just imagine it
   * as ffmpeg native cli and what you need to pass is the same.
   *
   * For example, you can convert native command below:
   *
   * ```
   * $ ffmpeg -i video.avi -c:v libx264 video.mp4
   * ```
   *
   * To
   *
   * ```
   * await ffmpeg.run('-i', 'video.avi', '-c:v', 'libx264', 'video.mp4');
   * ```
   *
   */
  const run = (..._args) => {
    log('info', `run ffmpeg command: ${_args.join(' ')}`);
    if (Core === null) {
      throw NO_LOAD;
    } else if (running) {
      throw Error('ffmpeg.wasm can only run one command at a time');
    } else {
      running = true;
      return new Promise((resolve) => {
        const args = [...defaultArgs, ..._args].filter((s) => s.length !== 0);
        runResolve = resolve;
        ffmpeg(...parseArgs(Core, args));
      });
    }
  };

  /*
   * Run FS operations.
   * For input/output file of ffmpeg.wasm, it is required to save them to MEMFS
   * first so that ffmpeg.wasm is able to consume them. Here we rely on the FS
   * methods provided by Emscripten.
   *
   * Common methods to use are:
   * ffmpeg.FS('writeFile', 'video.avi', new Uint8Array(...)): writeFile writes
   * data to MEMFS. You need to use Uint8Array for binary data.
   * ffmpeg.FS('readFile', 'video.mp4'): readFile from MEMFS.
   * ffmpeg.FS('unlink', 'video.map'): delete file from MEMFS.
   *
   * For more info, check https://emscripten.org/docs/api_reference/Filesystem-API.html
   *
   */
  const FS = (method, ...args) => {
    log('info', `run FS.${method} ${args.map((arg) => (typeof arg === 'string' ? arg : `<${arg.length} bytes binary file>`)).join(' ')}`);
    if (Core === null) {
      throw NO_LOAD;
    } else {
      let ret = null;
      try {
        ret = Core.FS[method](...args);
      } catch (e) {
        if (method === 'readdir') {
          throw Error(`ffmpeg.FS('readdir', '${args[0]}') error. Check if the path exists, ex: ffmpeg.FS('readdir', '/')`);
        } else if (method === 'readFile') {
          throw Error(`ffmpeg.FS('readFile', '${args[0]}') error. Check if the path exists`);
        } else {
          throw Error('Oops, something went wrong in FS operation.');
        }
      }
      return ret;
    }
  };

  /**
   * forcibly terminate the ffmpeg program.
   */
  const exit = () => {
    if (Core === null) {
      throw NO_LOAD;
    } else {
      running = false;
      Core.exit(1);
      Core = null;
      ffmpeg = null;
      runResolve = null;
    }
  };

  const setProgress = (_progress) => {
    progress = _progress;
  };

  const setLogger = (_logger) => {
    setCustomLogger(_logger);
  };

  setLogging(logging);
  setCustomLogger(logger);

  log('info', `use ffmpeg.wasm v${version}`);

  return {
    setProgress,
    setLogger,
    setLogging,
    load,
    isLoaded,
    run,
    exit,
    FS,
  };
};


/***/ }),

/***/ 5045:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

__webpack_require__(5666);
const createFFmpeg = __webpack_require__(2648);
const { fetchFile } = __webpack_require__(3451);

module.exports = {
  /*
   * Create ffmpeg instance.
   * Each ffmpeg instance owns an isolated MEMFS and works
   * independently.
   *
   * For example:
   *
   * ```
   * const ffmpeg = createFFmpeg({
   *  log: true,
   *  logger: () => {},
   *  progress: () => {},
   *  corePath: '',
   * })
   * ```
   *
   * For the usage of these four arguments, check config.js
   *
   */
  createFFmpeg,
  /*
   * Helper function for fetching files from various resource.
   * Sometimes the video/audio file you want to process may located
   * in a remote URL and somewhere in your local file system.
   *
   * This helper function helps you to fetch to file and return an
   * Uint8Array variable for ffmpeg.wasm to consume.
   *
   */
  fetchFile,
};


/***/ }),

/***/ 888:
/***/ (function(module) {

let logging = false;
let customLogger = () => {};

const setLogging = (_logging) => {
  logging = _logging;
};

const setCustomLogger = (logger) => {
  customLogger = logger;
};

const log = (type, message) => {
  customLogger({ type, message });
  if (logging) {
    console.log(`[${type}] ${message}`);
  }
};

module.exports = {
  logging,
  setLogging,
  setCustomLogger,
  log,
};


/***/ }),

/***/ 7010:
/***/ (function(module) {

module.exports = (Core, args) => {
  const argsPtr = Core._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
  args.forEach((s, idx) => {
    const buf = Core._malloc(s.length + 1);
    Core.writeAsciiToMemory(s, buf);
    Core.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
  });
  return [args.length, argsPtr];
};


/***/ }),

/***/ 6405:
/***/ (function(module) {

let duration = 0;
let ratio = 0;

const ts2sec = (ts) => {
  const [h, m, s] = ts.split(':');
  return (parseFloat(h) * 60 * 60) + (parseFloat(m) * 60) + parseFloat(s);
};

module.exports = (message, progress) => {
  if (typeof message === 'string') {
    if (message.startsWith('  Duration')) {
      const ts = message.split(', ')[0].split(': ')[1];
      const d = ts2sec(ts);
      progress({ duration: d, ratio });
      if (duration === 0 || duration > d) {
        duration = d;
      }
    } else if (message.startsWith('frame') || message.startsWith('size')) {
      const ts = message.split('time=')[1].split(' ')[0];
      const t = ts2sec(ts);
      ratio = t / duration;
      progress({ ratio, time: t });
    } else if (message.startsWith('video:')) {
      progress({ ratio: 1 });
      duration = 0;
    }
  }
};


/***/ }),

/***/ 3920:
/***/ (function(module) {

module.exports = "data:font/woff;charset=utf-8;base64,d09GRgABAAAAAAugAAsAAAAAC1QAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABPUy8yAAABCAAAAGAAAABgDxIF2WNtYXAAAAFoAAAAVAAAAFQXVtKLZ2FzcAAAAbwAAAAIAAAACAAAABBnbHlmAAABxAAAB2gAAAdo3EZL02hlYWQAAAksAAAANgAAADYePJMJaGhlYQAACWQAAAAkAAAAJAfCA8pobXR4AAAJiAAAACQAAAAkGgABImxvY2EAAAmsAAAAFAAAABQCAAT8bWF4cAAACcAAAAAgAAAAIAAVAYxuYW1lAAAJ4AAAAZ4AAAGeq0dfK3Bvc3QAAAuAAAAAIAAAACAAAwAAAAMDqwGQAAUAAAKZAswAAACPApkCzAAAAesAMwEJAAAAAAAAAAAAAAAAAAAAARAAAAAAAAAAAAAAAAAAAAAAQAAA6QQDwP/AAEADwABAAAAAAQAAAAAAAAAAAAAAIAAAAAAAAwAAAAMAAAAcAAEAAwAAABwAAwABAAAAHAAEADgAAAAKAAgAAgACAAEAIOkE//3//wAAAAAAIOkA//3//wAB/+MXBAADAAEAAAAAAAAAAAAAAAEAAf//AA8AAQAAAAAAAAAAAAIAADc5AQAAAAABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAAAwBm/6sDmgOrAAwAEgAfAAATNDYzITIWFTERJQURMxElBREhATUzFTMVIxUjNSM1M2Y9KgJmKzz+Zv5mZwEzATP9mgEAZmdnZmdnA0QrPDwr/GfMzAOZ/QCamgMA/wBnZ2ZnZ2YAAAABAGb/qwOaA6sADAAAEzQ2MyEyFhUxESUFEWY9KgJmKzz+Zv5mA0QrPDwr/GfMzAOZAAAAAwArAAAD1QNVACEAQgBQAAAlETQmJy4BIyEnLgErASIGBw4BFREUFhceATMhMjY3PgE1IxQGBw4BIyEiJicuATURNDY3PgE7ARceATMhMhYXHgEVASEyNjU0JiMhIgYVFBYD1RQREi4b/pdJBRML1RsvEREUFBESLhsCqhsvEREUVQcGBRAJ/VYJEAUGBwcGBRAJvkkGEwoBgAkQBQYH/gABABIZGRL/ABIZGYAB1RsvEREUbQkKFBESLhv9qxovERIUFBIRLxoJDwYGBwcGBg8JAlUJEAUGB20JCgcGBRAJ/tYZERIZGRIRGQADACsAAAPVA1UAIQBCAGIAACURNCYnLgEjIScuASsBIgYHDgEVERQWFx4BMyEyNjc+ATUjFAYHDgEjISImJy4BNRE0Njc+ATsBFx4BMyEyFhceARUBMxUUFjMyNj0BMzI2NTQmKwE1NCYjIgYdASMiBhUUFgPVFBESLhv+l0kFEwvVGy8RERQUERIuGwKqGy8RERRVBwYFEAn9VgkQBQYHBwYFEAm+SQYTCgGACRAFBgf+AFUZEhIZVRIZGRJVGRISGVUSGRmAAdUbLxERFG0JChQREi4b/asaLxESFBQSES8aCQ8GBgcHBgYPCQJVCRAFBgdtCQoHBgUQCf7WVhEZGRFWGRESGVUSGRkSVRkSERkAAAALAAD/qwQAA6sAOwBfAIEAogDGANYA8gEaAT8BZQGJAAAXLgEnLgEnLgEnLgEnLgE1Ezc+ATc+ATc+ATcyNjMFFx4BFx4BFx4BFRwBBw4BBw4BBw4BIyIjKgEjIic3PgE3PgE/AScuAScmBgcOASciJicuAScuASMUFhceARceATclPgE3PgEnLgEnLgEHDgEHDgEXHgEXFhQHDgEHDgExFDY3Jz4BNz4BIzQGBwYmJy4BJy4BJyYGDwEXHgEXHgEXHgE3JTAmJyY2Nz4BNz4BNzYmLwEHDgEHDgEHDgEVFBYXHgEXHgExJT4BNTQmIyIGBw4BFx4BNycuAScuAScmNjc+ATc+ARceARceAQcOAQcOASc3PgE3PgE3PgE1NCYnLgEnLgExMBYVFgYHDgEHDgEHDgEXFBYxMDY3JT4BJy4BJy4BNzwBNz4BNz4BMSYGBw4BBwYWFx4BFx4BNz4BNyU+ATM3Jy4BJy4BJy4BIyIGBw4BBw4BFzA2MzYWFx4BFx4BFx4BNz4BNz4BFzIWFx4BFx4BMTImJy4BBw4BBw4BDwEXHgEXFjY38xMvEQwfCwsgCRAYBwYBAQMFEgsQLRkYORwHg5QBEhAeKxknOgsHAgEDJyMgSC8JVLc2MTFLFxcDNx1CHwkoCQMIAwkDChgnMT0jExkPChoIAwUBAwIQMCIQHhECFBAaCgsKAgMaHRIEAgEFAgsBCRQLBAICBA8KAwMQBm4MGQcECAEHBAodDBYyICQiEQkTCAYKChgVIi4ZEiUP/fUBAQMGCgUUDhQOAgECAgIDBhEYGhsKCgkDBQURCgYFAVo+TmRIMlMWDgULFHA/MRIiDg8SAwMKDAgaDRc2GRIgCQcHAgMSDxU0HP4GERgZHAkLCQMFBRIKBAYBBAcJBRQODg8DAwMCBAMB/egLAQkQCwIGAwECBRIJAgEBFgcHFAUiBCcEGgcCAQIBBQIBNwMJAgYLCRgVHiUVFBwRDQ8LCA4GAwgBBgUKHQsXMh8bHQoNFGMKHAojNx4TGQ8KGggDBQEMBRpeOBY2FwkoCQMHBQwGBRIUVAEMBwYRCAkgCxYxGRlD4wEUEBcuERkvDw8UBAEBAwcSERpRLxo804CKCjNXIiAlCAEBAXkDFhIGFwYCBwMGAgYFDhIMAQQFBA0GAgQBBgUeJwgEAgEWChoSEzUaJUUwHgUCAQUDDxMbOCUYDjkNEyYMBAYBCAQEAxAKBQ8BAQECAQIFFhMXEAIBAgICBQUUFB8gCgcEA2QHBBMtGQ0lFiEgEQgWBwUICxYaGyURFSARDBELChIFAwJfC2A+SGQ0LR5EHz5BDDIDEA4OJBYUKxEMGAYMAQsIHhMOJBAVJQ8UEQRfDBUaGyUSFCARDRALChIGAgIGBRMtGQ0kFxcdCgoVCQcOBAM/DhMZLyALGRcZFA8JFSgKAQMBDAQFEwcufUYIKgwCAQIBBgO9AQICBQUUFBscCgoIAwUEDAcFDgEBAgECBRYTEQ8DBQJGBAkEDAkBBAUDDgYCAxgGJx8LBRUNBRgGAgYFCAICAwcAAAAAAQAAAAEAAF4bo6lfDzz1AAsEAAAAAADdjqdbAAAAAN2Op1sAAP+rBAADqwAAAAgAAgAAAAAAAAABAAADwP/AAAAEAAAAAAAEAAABAAAAAAAAAAAAAAAAAAAACQQAAAAAAAAAAAAAAAIAAAAEAABmBAAAZgQAACsEAAArBAAAAAAAAAAACgAUAB4AUgBsAOIBbAO0AAEAAAAJAYoACwAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAJAAAAAQAAAAAAAgAHAHIAAQAAAAAAAwAJADwAAQAAAAAABAAJAIcAAQAAAAAABQALABsAAQAAAAAABgAJAFcAAQAAAAAACgAaAKIAAwABBAkAAQASAAkAAwABBAkAAgAOAHkAAwABBAkAAwASAEUAAwABBAkABAASAJAAAwABBAkABQAWACYAAwABBAkABgASAGAAAwABBAkACgA0ALxkc20taWNvbnMAZABzAG0ALQBpAGMAbwBuAHNWZXJzaW9uIDEuMABWAGUAcgBzAGkAbwBuACAAMQAuADBkc20taWNvbnMAZABzAG0ALQBpAGMAbwBuAHNkc20taWNvbnMAZABzAG0ALQBpAGMAbwBuAHNSZWd1bGFyAFIAZQBnAHUAbABhAHJkc20taWNvbnMAZABzAG0ALQBpAGMAbwBuAHNGb250IGdlbmVyYXRlZCBieSBJY29Nb29uLgBGAG8AbgB0ACAAZwBlAG4AZQByAGEAdABlAGQAIABiAHkAIABJAGMAbwBNAG8AbwBuAC4AAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"

/***/ }),

/***/ 9945:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-calculator-api-container .dsm-btn {\n  display: inline-block;\n  line-height: 28px;\n  height: 28px;\n  padding: 0 15px;\n  margin: 0 5px;\n  font-size: 80%;\n}\n.dcg-calculator-api-container .dsm-btn.dsm-btn-disabled {\n  pointer-events: none;\n  color: #454545;\n  background: none;\n  border: 1px solid #454545;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 9712:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-plugin-section {\n  border-top: 1px solid #e2e2e2;\n  margin-top: 5px;\n  padding-top: 5px;\n}\n.dsm-plugin-title-bar {\n  color: #222;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.dsm-plugin-title-bar .dcg-toggle-view {\n  margin-top: 0;\n}\n.dsm-plugin-header {\n  cursor: pointer;\n  display: flex;\n  padding: 5px 0;\n  margin-right: 10px;\n  align-items: center;\n  flex-grow: 1;\n}\n.dsm-plugin-header .dsm-caret-container {\n  transform: rotate(-90deg);\n  transition: transform 200ms;\n  color: #888;\n  margin-right: 10px;\n}\n.dsm-plugin-header .dsm-caret-container.dsm-caret-expanded {\n  transform: rotate(0deg);\n}\n.dsm-plugin-info-body {\n  padding: 5px 0;\n  color: #444;\n}\n.dsm-settings-item {\n  padding-top: 10px;\n}\n.dsm-settings-item .dcg-tooltip-hit-area-container {\n  cursor: pointer !important;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 5918:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-pillbox-buttons {\n  display: flex;\n  flex-direction: column;\n}\n.dcg-no-graphpaper .dcg-overgraph-pillbox-elements,\n.dcg-no-graphpaper .dsm-pillbox-buttons {\n  display: flex;\n  flex-direction: row-reverse;\n}\n.dcg-no-graphpaper .dsm-pillbox-buttons > * {\n  margin-right: 6px;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 5626:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-segmented-control-container [ontap].dsm-disallow-change {\n  cursor: not-allowed;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 3978:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-toggle-view.dcg-toggled.dsm-disabled-toggle {\n  opacity: 0.3;\n  cursor: not-allowed;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 8754:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-expressions-scrolled ~ .find-replace-expression-replace-bar {\n  z-index: 4;\n  box-shadow: -2px 2px 4px rgba(0, 0, 0, 0.15);\n}\n.find-replace-replace-all {\n  color: #2b74d9;\n  padding: 0 4px 0 8px;\n}\n.find-replace-replace-all.dcg-depressed {\n  color: #184686;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 8769:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-pinned-expressions {\n  position: sticky;\n  top: 0;\n  z-index: 99;\n}\n.dsm-has-pinned-expressions .dsm-pinned-expressions {\n  box-shadow: -2px 2px 4px rgba(0 0 0 / 15%);\n  border-bottom: 1px solid rgba(0 0 0 / 20%);\n}\nbody .dcg-calculator-api-container .dsm-has-pinned-expressions .dcg-expression-top-bar.dcg-expressions-scrolled {\n  box-shadow: none;\n}\nbody .dcg-calculator-api-container .dcg-exppanel-outer .dcg-exppanel-container {\n  display: grid;\n  grid-template-rows: auto auto auto auto 1fr;\n  grid-template-columns: 100%;\n}\nbody .dcg-calculator-api-container .dcg-exppanel-outer .dcg-exppanel-container .dcg-exppanel {\n  grid-row: 5 / 6;\n}\nbody .dcg-calculator-api-container .dcg-exppanel-outer .dcg-exppanel-container .dcg-exppanel.dsm-pinned-expressions {\n  grid-row: 3 / 4;\n  overflow-y: hidden;\n}\nbody .dcg-calculator-api-container .dcg-exppanel-outer .dcg-exppanel-container .dcg-exppanel.dsm-pinned-expressions .dcg-expressionitem .dcg-tab {\n  cursor: default;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 6611:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-calculator-api-container .dcg-expressions-branding {\n  overflow: visible;\n}\n.dcg-calculator-api-container .dcg-expressionlist {\n  overflow: hidden;\n}\n.dcg-calculator-api-container .dsm-usage-tip {\n  position: relative;\n  transition: bottom 0.4s, height 0.4s;\n  bottom: 0px;\n  color: #666;\n  font-size: 12.8;\n  opacity: 0.3;\n  line-height: 1.25;\n  overflow: hidden;\n  height: 46px;\n}\n.dcg-calculator-api-container .dsm-usage-tip:hover {\n  opacity: 1;\n  bottom: 55px;\n  height: 101px;\n}\n.dcg-calculator-api-container .dsm-usage-tip a {\n  color: #666;\n  text-decoration: underline;\n  height: unset;\n}\n.dcg-calculator-api-container .dsm-usage-tip a:hover {\n  color: #000;\n  text-decoration: underline;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 6392:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-vc-pie-container {\n  margin: 45px;\n  display: flex;\n  justify-content: center;\n}\n.dsm-vc-pie-container .dsm-vc-centered-pie {\n  width: 120px;\n  height: 120px;\n  position: relative;\n}\n.dsm-vc-pie-container .dsm-vc-pending {\n  animation: dcg-loading-pulse 2.2s infinite;\n}\n.dsm-vc-pie-container .dsm-vc-pending .dsm-vc-base-circle,\n.dsm-vc-pie-container .dsm-vc-pending .dsm-vc-pie-overlay {\n  transform: scale(1);\n}\n.dsm-vc-pie-container .dsm-vc-pending .dsm-vc-pie-overlay {\n  filter: brightness(70%);\n}\n.dsm-vc-pie-container .dsm-vc-base-circle,\n.dsm-vc-pie-container .dsm-vc-pie-overlay {\n  position: absolute;\n  left: 0;\n  top: 0;\n  transform: scale(1.5);\n  width: 100%;\n  height: 100%;\n}\n.dsm-vc-pie-container .dsm-vc-base-circle {\n  transition: transform 200ms;\n  background: #e6e6e6;\n  border-radius: 50%;\n}\n.dsm-vc-pie-container .dsm-vc-pie-overlay path {\n  fill: #999999;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 735:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dcg-calculator-api-container .dcg-pillbox-container {\n  z-index: 100;\n}\n.dsm-vc-select-export-type {\n  margin-top: 5px;\n  margin-bottom: 5px;\n}\n.dsm-vc-preview-menu,\n.dsm-vc-export-menu {\n  padding-top: 10px;\n  border-top: 1px solid #ddd;\n  margin-top: 10px;\n}\n.dsm-vc-delete-all-row {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-end;\n  margin: -5px 0 5px;\n}\n.dsm-vc-delete-all-row .dsm-vc-delete-all-button {\n  height: 26px;\n}\n.dsm-vc-preview-outer:not(.dsm-vc-preview-expanded) {\n  transform: translateX(calc((100% - 235px) / 2));\n}\n.dsm-vc-preview-outer:not(.dsm-vc-preview-expanded) .dsm-vc-preview-inner {\n  max-width: 235px;\n}\ninput.dsm-vc-outfile-name {\n  outline: none;\n  border-width: 0 0 1px 0;\n  border-color: #bbb;\n  padding: 5px;\n  width: 100%;\n  margin-bottom: 10px;\n}\ninput.dsm-vc-outfile-name.dcg-hovered {\n  border-color: #ccc;\n  box-shadow: 0 1px #ccc;\n}\ninput.dsm-vc-outfile-name:focus {\n  border-color: #6399cb;\n  box-shadow: 0 1px #6399cb;\n}\ninput.dsm-vc-outfile-name.dsm-invalid {\n  border-color: #e15855;\n  box-shadow: 0 1px #e15855;\n}\n.dsm-vc-export {\n  display: flex;\n  flex-direction: row-reverse;\n  justify-content: space-between;\n}\n.dsm-vc-export .dsm-vc-fps-settings span.dcg-mq-editable-field.dcg-math-input {\n  margin-left: 8px;\n}\n.dsm-vc-cancel-export-button {\n  text-align: center;\n}\n.dsm-vc-preview-play {\n  display: flex;\n  flex-direction: row-reverse;\n}\n@keyframes delayed-reveal {\n  0% {\n    opacity: 0;\n  }\n  95% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n.dsm-delayed-reveal {\n  animation-duration: 10s;\n  animation-name: delayed-reveal;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 2505:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-vc-preview-expanded {\n  position: fixed;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  z-index: 999;\n  width: 100vw;\n  height: 100vh;\n  background: rgba(0, 0, 0, 0.8);\n  font-size: 160%;\n}\n.dsm-vc-preview-inner {\n  margin-top: 5px;\n  display: flex;\n}\n.dsm-vc-preview-expanded .dsm-vc-preview-inner {\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  width: 80%;\n  height: 80%;\n  padding: 20px;\n  background: white;\n  border-radius: 5px;\n}\n.dsm-vc-preview-carousel {\n  display: grid;\n  gap: 10px;\n  grid-template-columns: 1fr 1fr;\n  grid-template-rows: auto auto;\n}\n.dsm-vc-preview-expanded .dsm-vc-preview-carousel {\n  display: flex;\n  align-items: center;\n}\n.dsm-vc-preview-carousel > div {\n  position: relative;\n}\n.dsm-vc-preview-carousel > div > img {\n  width: 100%;\n  height: 100%;\n  border-radius: 5px;\n  box-shadow: 0px 1px 5px 0 rgba(0, 0, 0, 0.2);\n}\n.dsm-vc-preview-prev-frame {\n  grid-column: 1;\n  grid-row: 2;\n}\n.dsm-vc-preview-expanded .dsm-vc-preview-prev-frame {\n  order: 1;\n  flex: 1;\n}\n.dsm-vc-preview-next-frame {\n  grid-column: 2;\n  grid-row: 2;\n}\n.dsm-vc-preview-expanded .dsm-vc-preview-next-frame {\n  order: 3;\n  flex: 1;\n}\n.dsm-vc-preview-current-frame {\n  grid-column: 1 / span 2;\n  grid-row: 1;\n}\n.dsm-vc-preview-expanded .dsm-vc-preview-current-frame {\n  order: 2;\n  flex: 3;\n}\n.dsm-vc-preview-wrapped-frame {\n  filter: brightness(75%);\n}\n.dsm-vc-preview-index {\n  position: absolute;\n  bottom: 0;\n  left: 0;\n  padding: 4px;\n  color: black;\n  text-shadow: -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white;\n}\n.dsm-vc-preview-expand {\n  position: absolute;\n  padding: 5%;\n  color: white;\n  text-shadow: 0.5px 1px 3px rgba(0, 0, 0, 0.8);\n  font-size: 160%;\n  top: 0;\n  left: 0;\n}\n.dsm-vc-preview-play-pause {\n  position: absolute;\n  padding: 5%;\n  color: white;\n  text-shadow: 0.5px 1px 3px rgba(0, 0, 0, 0.8);\n  font-size: 160%;\n  bottom: 0;\n  right: 0;\n}\n.dsm-vc-remove-frame {\n  position: absolute;\n  padding: 5%;\n  color: white;\n  text-shadow: 0.5px 1px 3px rgba(0, 0, 0, 0.8);\n  font-size: 160%;\n  top: 0;\n  right: 0;\n}\n.dsm-vc-exit-expanded {\n  position: absolute;\n  color: rgba(0, 0, 0, 0.2);\n  font-size: 160%;\n  padding: 20px;\n  top: 0;\n  right: 0;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 799:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(1667);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _dsm_icons_woff_mqvmaq__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3920);
/* harmony import */ var _dsm_icons_woff_mqvmaq__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_dsm_icons_woff_mqvmaq__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_1___default()((_dsm_icons_woff_mqvmaq__WEBPACK_IMPORTED_MODULE_2___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, "@font-face {\n  font-family: \"dsm-icons\";\n  src: url(" + ___CSS_LOADER_URL_REPLACEMENT_0___ + ") format(\"woff\");\n  font-weight: normal;\n  font-style: normal;\n  font-display: block;\n}\n\n[class^=\"dsm-icon-\"],\n[class*=\" dsm-icon-\"] {\n  /* use !important to prevent issues with browser extensions that change fonts */\n  font-family: \"dsm-icons\" !important;\n  speak: never;\n  font-style: normal;\n  font-weight: normal;\n  font-variant: normal;\n  text-transform: none;\n  line-height: 1;\n\n  /* Better Font Rendering =========== */\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\n.dsm-icon-folder-minus:before {\n  content: \"\\e902\";\n}\n.dsm-icon-folder-plus:before {\n  content: \"\\e903\";\n}\n.dsm-icon-desmodder:before {\n  content: \"\\e904\";\n}\n.dsm-icon-bookmark-outline-add:before {\n  content: \"\\e900\";\n}\n.dsm-icon-bookmark:before {\n  content: \"\\e901\";\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 1223:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(3645);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0__);
// Imports

var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_0___default()(function(i){return i[1]});
// Module
___CSS_LOADER_EXPORT___.push([module.id, ".dsm-vc-current-action {\n  overflow-x: auto;\n  margin-bottom: 5px;\n}\n\n.dsm-vc-action-navigate-container {\n  display: flex;\n  justify-content: space-between;\n  margin-bottom: 5px;\n}\n\n.dsm-vc-select-capture-method {\n  margin-top: 5px;\n  margin-bottom: 10px;\n}\n\n.dsm-vc-slider-settings {\n  margin-bottom: 10px;\n}\n\n.dsm-vc-end-condition-settings {\n  margin: 0 5px 10px;\n}\n\n.dsm-vc-reset-bounds-wrapper {\n  display: flex;\n  justify-content: flex-end;\n  margin-bottom: 10px;\n}\n\n.dsm-vc-capture {\n  display: flex;\n  flex-direction: row-reverse;\n  justify-content: space-between;\n}\n\n.dsm-vc-capture\n  .dsm-vc-end-condition-settings\n  span.dcg-mq-editable-field.dcg-math-input {\n  max-width: 100px;\n  margin-left: 8px;\n}\n\n.dsm-vc-capture-size,\n.dsm-vc-pixel-ratio {\n  margin-bottom: 10px;\n  margin-left: 5px;\n}\n\n.dsm-vc-pixel-ratio-inner {\n  cursor: pointer;\n}\n", ""]);
// Exports
/* harmony default export */ __webpack_exports__["Z"] = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ 3645:
/***/ (function(module) {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
// eslint-disable-next-line func-names
module.exports = function (cssWithMappingToString) {
  var list = []; // return the list of modules as css string

  list.toString = function toString() {
    return this.map(function (item) {
      var content = cssWithMappingToString(item);

      if (item[2]) {
        return "@media ".concat(item[2], " {").concat(content, "}");
      }

      return content;
    }).join("");
  }; // import a list of modules into the list
  // eslint-disable-next-line func-names


  list.i = function (modules, mediaQuery, dedupe) {
    if (typeof modules === "string") {
      // eslint-disable-next-line no-param-reassign
      modules = [[null, modules, ""]];
    }

    var alreadyImportedModules = {};

    if (dedupe) {
      for (var i = 0; i < this.length; i++) {
        // eslint-disable-next-line prefer-destructuring
        var id = this[i][0];

        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }

    for (var _i = 0; _i < modules.length; _i++) {
      var item = [].concat(modules[_i]);

      if (dedupe && alreadyImportedModules[item[0]]) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (mediaQuery) {
        if (!item[2]) {
          item[2] = mediaQuery;
        } else {
          item[2] = "".concat(mediaQuery, " and ").concat(item[2]);
        }
      }

      list.push(item);
    }
  };

  return list;
};

/***/ }),

/***/ 1667:
/***/ (function(module) {

"use strict";


module.exports = function (url, options) {
  if (!options) {
    // eslint-disable-next-line no-param-reassign
    options = {};
  } // eslint-disable-next-line no-underscore-dangle, no-param-reassign


  url = url && url.__esModule ? url.default : url;

  if (typeof url !== "string") {
    return url;
  } // If url is already wrapped in quotes, remove them


  if (/^['"].*['"]$/.test(url)) {
    // eslint-disable-next-line no-param-reassign
    url = url.slice(1, -1);
  }

  if (options.hash) {
    // eslint-disable-next-line no-param-reassign
    url += options.hash;
  } // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls


  if (/["'() \t\n]/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }

  return url;
};

/***/ }),

/***/ 5666:
/***/ (function(module) {

/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
   true ? module.exports : 0
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}


/***/ }),

/***/ 5072:
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

void (function(root, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
		__WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
}(this, function() {

  function resolveUrl(/* ...urls */) {
    var numUrls = arguments.length

    if (numUrls === 0) {
      throw new Error("resolveUrl requires at least one argument; got none.")
    }

    var base = document.createElement("base")
    base.href = arguments[0]

    if (numUrls === 1) {
      return base.href
    }

    var head = document.getElementsByTagName("head")[0]
    head.insertBefore(base, head.firstChild)

    var a = document.createElement("a")
    var resolved

    for (var index = 1; index < numUrls; index++) {
      a.href = arguments[index]
      resolved = a.href
      base.href = resolved
    }

    head.removeChild(base)

    return resolved
  }

  return resolveUrl

}));


/***/ }),

/***/ 3379:
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

"use strict";


var isOldIE = function isOldIE() {
  var memo;
  return function memorize() {
    if (typeof memo === 'undefined') {
      // Test for IE <= 9 as proposed by Browserhacks
      // @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
      // Tests for existence of standard globals is to allow style-loader
      // to operate correctly into non-standard environments
      // @see https://github.com/webpack-contrib/style-loader/issues/177
      memo = Boolean(window && document && document.all && !window.atob);
    }

    return memo;
  };
}();

var getTarget = function getTarget() {
  var memo = {};
  return function memorize(target) {
    if (typeof memo[target] === 'undefined') {
      var styleTarget = document.querySelector(target); // Special case to return head of iframe instead of iframe itself

      if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
        try {
          // This will throw an exception if access to iframe is blocked
          // due to cross-origin restrictions
          styleTarget = styleTarget.contentDocument.head;
        } catch (e) {
          // istanbul ignore next
          styleTarget = null;
        }
      }

      memo[target] = styleTarget;
    }

    return memo[target];
  };
}();

var stylesInDom = [];

function getIndexByIdentifier(identifier) {
  var result = -1;

  for (var i = 0; i < stylesInDom.length; i++) {
    if (stylesInDom[i].identifier === identifier) {
      result = i;
      break;
    }
  }

  return result;
}

function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];

  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var index = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3]
    };

    if (index !== -1) {
      stylesInDom[index].references++;
      stylesInDom[index].updater(obj);
    } else {
      stylesInDom.push({
        identifier: identifier,
        updater: addStyle(obj, options),
        references: 1
      });
    }

    identifiers.push(identifier);
  }

  return identifiers;
}

function insertStyleElement(options) {
  var style = document.createElement('style');
  var attributes = options.attributes || {};

  if (typeof attributes.nonce === 'undefined') {
    var nonce =  true ? __webpack_require__.nc : 0;

    if (nonce) {
      attributes.nonce = nonce;
    }
  }

  Object.keys(attributes).forEach(function (key) {
    style.setAttribute(key, attributes[key]);
  });

  if (typeof options.insert === 'function') {
    options.insert(style);
  } else {
    var target = getTarget(options.insert || 'head');

    if (!target) {
      throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
    }

    target.appendChild(style);
  }

  return style;
}

function removeStyleElement(style) {
  // istanbul ignore if
  if (style.parentNode === null) {
    return false;
  }

  style.parentNode.removeChild(style);
}
/* istanbul ignore next  */


var replaceText = function replaceText() {
  var textStore = [];
  return function replace(index, replacement) {
    textStore[index] = replacement;
    return textStore.filter(Boolean).join('\n');
  };
}();

function applyToSingletonTag(style, index, remove, obj) {
  var css = remove ? '' : obj.media ? "@media ".concat(obj.media, " {").concat(obj.css, "}") : obj.css; // For old IE

  /* istanbul ignore if  */

  if (style.styleSheet) {
    style.styleSheet.cssText = replaceText(index, css);
  } else {
    var cssNode = document.createTextNode(css);
    var childNodes = style.childNodes;

    if (childNodes[index]) {
      style.removeChild(childNodes[index]);
    }

    if (childNodes.length) {
      style.insertBefore(cssNode, childNodes[index]);
    } else {
      style.appendChild(cssNode);
    }
  }
}

function applyToTag(style, options, obj) {
  var css = obj.css;
  var media = obj.media;
  var sourceMap = obj.sourceMap;

  if (media) {
    style.setAttribute('media', media);
  } else {
    style.removeAttribute('media');
  }

  if (sourceMap && typeof btoa !== 'undefined') {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  } // For old IE

  /* istanbul ignore if  */


  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    while (style.firstChild) {
      style.removeChild(style.firstChild);
    }

    style.appendChild(document.createTextNode(css));
  }
}

var singleton = null;
var singletonCounter = 0;

function addStyle(obj, options) {
  var style;
  var update;
  var remove;

  if (options.singleton) {
    var styleIndex = singletonCounter++;
    style = singleton || (singleton = insertStyleElement(options));
    update = applyToSingletonTag.bind(null, style, styleIndex, false);
    remove = applyToSingletonTag.bind(null, style, styleIndex, true);
  } else {
    style = insertStyleElement(options);
    update = applyToTag.bind(null, style, options);

    remove = function remove() {
      removeStyleElement(style);
    };
  }

  update(obj);
  return function updateStyle(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap) {
        return;
      }

      update(obj = newObj);
    } else {
      remove();
    }
  };
}

module.exports = function (list, options) {
  options = options || {}; // Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
  // tags it will allow on a page

  if (!options.singleton && typeof options.singleton !== 'boolean') {
    options.singleton = isOldIE();
  }

  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];

    if (Object.prototype.toString.call(newList) !== '[object Array]') {
      return;
    }

    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDom[index].references--;
    }

    var newLastIdentifiers = modulesToDom(newList, options);

    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];

      var _index = getIndexByIdentifier(_identifier);

      if (stylesInDom[_index].references === 0) {
        stylesInDom[_index].updater();

        stylesInDom.splice(_index, 1);
      }
    }

    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	!function() {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = function(module) {
/******/ 			var getter = module && module.__esModule ?
/******/ 				function() { return module['default']; } :
/******/ 				function() { return module; };
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
!function() {
"use strict";

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "I": function() { return /* binding */ script_controller; }
});

;// CONCATENATED MODULE: ./src/globals/window.ts
/* harmony default export */ var globals_window = (window);
// defer access of Calc.controller, Calc.observe, etc. to when they are called
// avoid Calc === undefined but window.Calc !== undefined
const Calc = new Proxy({}, {
    get(_target, prop) {
        if (window.Calc === undefined)
            return undefined;
        if (prop in window.Calc) {
            return window.Calc[prop];
        }
    },
});
// defer access of window.require to when it is used
const desmosRequire = new Proxy(() => { }, {
    apply: function (_target, _that, args) {
        if (window.require === undefined)
            return undefined;
        return window.require(...args);
    },
});

;// CONCATENATED MODULE: ./src/DCGView.ts

const DCGView = desmosRequire("dcgview");
class DCGView_ClassComponent {
    constructor(_props) { }
    init() { }
}
/* harmony default export */ var src_DCGView = ({
    ...DCGView,
    jsx: jsx,
});
/**
 * If you know React, then you know DCGView.
 * Some exceptions:
 *  - DCGView was forked sometime in 2016, before React Fragments and some other features
 *  - use class instead of className
 *  - there's some function name changes, like React.Component → DCGView.Class,
 *    rerender → template.
 *    However, there are functional differences:
 *    template is only called once with the prop values, see the next point.
 *  - You don't want to write (<div color={this.props.color()}>...) because the prop value is
 *    executed only once and gives a fixed value. If that is what you want,
 *    it is more semantic to do (<div color={DCGView.const(this.props.color())}>...),
 *    but if you want the prop to change on component update, use
 *    (<div color={() => this.props.color()}>...</div>)
 *  - This wrapper automatically calls DCGView.const over bare non-function values,
 *    so be careful. Anything that needs to change should be wrapped in a function
 *  - DCGView or its components impose some requirements, like aria-label being required
 * I have not yet figured out how to set state, but most components should be
 * stateless anyway (state control in Model.js)
 */
function jsx(el, props, ...children) {
    /* Handle differences between typescript's expectation and DCGView */
    if (!Array.isArray(children)) {
        children = [children];
    }
    // "Text should be a const or a getter:"
    children = children.map((e) => typeof e === "string" ? DCGView.const(e) : e);
    for (const k in props) {
        // DCGView.createElement also expects 0-argument functions
        if (typeof props[k] !== "function") {
            props[k] = DCGView.const(props[k]);
        }
    }
    return DCGView.createElement(el, props, ...children);
}

;// CONCATENATED MODULE: ./src/components/desmosComponents.ts


class CheckboxComponent extends (/* unused pure expression or super */ null && (ClassComponent)) {
}
const Checkbox = desmosRequire("dcgview-helpers/checkbox").Checkbox;
class MathQuillViewComponent extends (/* unused pure expression or super */ null && (ClassComponent)) {
}
const MathQuillView = desmosRequire("dcgview-helpers/mathquill-view").default;
class ForComponent extends (/* unused pure expression or super */ null && (ClassComponent)) {
}
const { If, For, IfDefined, IfElse, Input, Switch, SwitchUnion, Textarea, } = desmosRequire("dcgview").Components;
class DStaticMathquillViewComponent extends (/* unused pure expression or super */ null && (ClassComponent)) {
}
const DStaticMathquillView = desmosRequire("dcgview-helpers/static-mathquill-view").default;
class TooltipComponent extends (/* unused pure expression or super */ null && (ClassComponent)) {
}
const Tooltip = desmosRequire("shared-components/tooltip").Tooltip;

// EXTERNAL MODULE: ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js
var injectStylesIntoStyleTag = __webpack_require__(3379);
var injectStylesIntoStyleTag_default = /*#__PURE__*/__webpack_require__.n(injectStylesIntoStyleTag);
// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/components/Toggle.less
var Toggle = __webpack_require__(3978);
;// CONCATENATED MODULE: ./src/components/Toggle.less

            

var options = {};

options.insert = "head";
options.singleton = false;

var update = injectStylesIntoStyleTag_default()(Toggle/* default */.Z, options);



/* harmony default export */ var components_Toggle = (Toggle/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/components/Toggle.tsx


class Toggle_Toggle extends src_DCGView.Class {
    template() {
        return (src_DCGView.jsx("div", { class: () => ({
                "dcg-toggle-view": true,
                "dcg-toggled": this.props.toggled(),
                "dsm-disabled-toggle": this.props.disabled(),
            }), onTap: () => this.props.onChange() },
            src_DCGView.jsx("div", { class: "dcg-toggle-switch" })));
    }
}

;// CONCATENATED MODULE: ./src/components/SmallMathQuillInput.tsx


class SmallMathQuillInput extends src_DCGView.Class {
    template() {
        return (src_DCGView.jsx(MathQuillView, { isFocused: () => this.props.isFocused(), latex: () => this.props.latex(), capExpressionSize: 80, config: {
                autoOperatorNames: this.getAutoOperatorNames(),
            }, getAriaLabel: () => this.props.ariaLabel(), getAriaPostLabel: "", onUserChangedLatex: (s) => this.props.onUserChangedLatex(s), onFocusedChanged: (isFocused) => this.props.onFocusedChanged(isFocused), hasError: this.hasError(), selectOnFocus: true, needsSystemKeypad: false },
            src_DCGView.jsx("span", { class: () => ({
                    "dcg-math-field": true,
                    "dcg-math-input": true,
                    "dcg-invalid": this.hasError(),
                    "dcg-focus": this.props.isFocused(),
                    "dcg-mq-focused": this.props.isFocused(),
                }), dcgDataLimit: 40 })));
    }
    hasError() {
        return this.props.hasError ? this.props.hasError() : false;
    }
    getAutoOperatorNames() {
        const autoOperatorNames = this.props.autoOperatorNames && this.props.autoOperatorNames();
        return autoOperatorNames ? autoOperatorNames : "--";
    }
}

;// CONCATENATED MODULE: ./src/utils/utils.ts
function _pollForValue(func) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const val = func();
            if (val !== null && val !== undefined) {
                clearInterval(interval);
                resolve(val);
            }
        }, 50);
    });
}
async function pollForValue(func) {
    return await _pollForValue(func);
}
function updateClass(out, c) {
    // mutates `out`, returns nothing
    if (c == null) {
        // no change
    }
    else if (typeof c === "string") {
        for (const cls of c.split(" ")) {
            out[cls] = true;
        }
    }
    else {
        Object.assign(out, c);
    }
}
function mergeClass(c1, c2) {
    const out = {};
    updateClass(out, c1);
    updateClass(out, c2);
    return out;
}
// https://dev.to/_gdelgado/implement-a-type-safe-version-of-node-s-promisify-in-7-lines-of-code-in-typescript-2j34
const promisify = (fn) => (args) => new Promise((resolve) => {
    fn(args, (callbackArgs) => {
        resolve(callbackArgs);
    });
});
function arraysEqual(arr1, arr2) {
    return (arr1.length === arr2.length &&
        arr1.every((value, index) => arr2[index] === value));
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/components/SegmentedControl.less
var SegmentedControl = __webpack_require__(5626);
;// CONCATENATED MODULE: ./src/components/SegmentedControl.less

            

var SegmentedControl_options = {};

SegmentedControl_options.insert = "head";
SegmentedControl_options.singleton = false;

var SegmentedControl_update = injectStylesIntoStyleTag_default()(SegmentedControl/* default */.Z, SegmentedControl_options);



/* harmony default export */ var components_SegmentedControl = (SegmentedControl/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/components/SegmentedControl.tsx



class SegmentedControl_SegmentedControl extends src_DCGView.Class {
    template() {
        return (src_DCGView.jsx("div", { class: () => mergeClass("dcg-segmented-control-container", this.props.class && this.props.class()), role: "group" }, this.props.names().map((name, i) => (src_DCGView.jsx("div", { key: i, class: () => ({
                "dcg-segmented-control-btn": true,
                "dcg-dark-gray-segmented-control-btn": true,
                "dcg-selected dcg-active": i === this.props.selectedIndex(),
                "dsm-disallow-change": !this.getChangeAllowed(i),
            }), role: "button", ariaLabel: name, onTap: () => this.getChangeAllowed(i) && this.props.setSelectedIndex(i) }, name)))));
    }
    getChangeAllowed(i) {
        const allowChange = this.props.allowChange;
        return (allowChange === undefined ||
            allowChange() ||
            i === this.props.selectedIndex());
    }
}

;// CONCATENATED MODULE: ./src/components/StaticMathQuillView.tsx


class StaticMathquillView extends src_DCGView.Class {
    template() {
        return src_DCGView.jsx(DStaticMathquillView, { latex: this.props.latex(), config: {} });
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/components/Button.less
var Button = __webpack_require__(9945);
;// CONCATENATED MODULE: ./src/components/Button.less

            

var Button_options = {};

Button_options.insert = "head";
Button_options.singleton = false;

var Button_update = injectStylesIntoStyleTag_default()(Button/* default */.Z, Button_options);



/* harmony default export */ var components_Button = (Button/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/components/Button.tsx



class Button_Button extends src_DCGView.Class {
    template() {
        return (src_DCGView.jsx("span", { role: "button", class: () => mergeClass({
                ["dcg-btn-" + this.props.color()]: true,
                "dsm-btn-disabled": (this.props.disabled && this.props.disabled()) || false,
                "dsm-btn": true,
            }, this.props.class && this.props.class()), onTap: (e) => !(this.props.disabled && this.props.disabled()) && this.props.onTap(e) }, this.children));
    }
}

;// CONCATENATED MODULE: ./src/utils/depUtils.ts

const _EvaluateSingleExpression = desmosRequire("core/math/evaluate-single-expression").default;
const jquery = desmosRequire("jquery");
const keys = desmosRequire("keys");
const parseDesmosLatex = desmosRequire("parser").parse;
function EvaluateSingleExpression(s) {
    // may also return NaN (which is a number)
    return _EvaluateSingleExpression(s, Calc.controller.isDegreeMode());
}
const getQueryParams = desmosRequire("lib/parse-query-params").getQueryParams;

;// CONCATENATED MODULE: ./src/desmodder.ts












;// CONCATENATED MODULE: ./src/plugins/duplicate-hotkey/index.ts

function onEnable() {
    jquery(".dcg-exppanel-outer").on("keydown.duplicateHotkey", (e) => {
        if (e.ctrlKey && keys.lookupChar(e) === "Q") {
            Calc.controller.dispatch({
                type: "duplicate-expression",
                id: Calc.selectedExpressionId,
            });
        }
    });
}
function onDisable() {
    jquery(".dcg-exppanel-outer").off(".duplicateHotkey");
}
/* harmony default export */ var duplicate_hotkey = ({
    id: "duplicate-expression-hotkey",
    name: "Duplicate Expression Hotkey",
    description: "Type Ctrl+Q or Cmd+Q to duplicate the currently-selected expression.",
    onEnable: onEnable,
    onDisable: onDisable,
    enabledByDefault: true,
});

;// CONCATENATED MODULE: ./src/parsing/traverse.ts
class Path {
    constructor(node, parent, index) {
        this.node = node;
        this.parent = parent;
        this.index = index;
    }
    getChildren() {
        switch (this.node.type) {
            case "Assignment":
            case "FunctionDefinition":
                return [this.node._expression];
            case "Regression":
            case "Equation":
                return [this.node._lhs, this.node._rhs];
            case "Error":
                return [];
            case "DoubleInequality":
                if ("args" in this.node) {
                    return [this.node.args[0], this.node.args[2], this.node.args[4]];
                }
            default:
                if ("args" in this.node) {
                    return this.node.args;
                }
                const type = this.node.type;
                throw `Unexpected node type: ${type}. How did you obtain it?`;
        }
    }
}
function traverse(node, callbacks) {
    traversePath(new Path(node, null, 0), callbacks);
}
function traversePath(path, callbacks) {
    callbacks.enter?.(path);
    const children = path.getChildren();
    for (let i = 0; i < children.length; i++) {
        traversePath(new Path(children[i], path, i), callbacks);
    }
    callbacks.exit?.(path);
}

;// CONCATENATED MODULE: ./src/parsing/nodeTypes.ts
function satisfiesType(node, type) {
    // navigate up prototype tree
    // we need this because we can't instanceof very easily
    if (node.type === type) {
        return true;
    }
    else {
        const proto = Object.getPrototypeOf(node);
        return proto && satisfiesType(proto, type);
    }
}

;// CONCATENATED MODULE: ./src/plugins/find-replace/backend.ts



function replace(replaceLatex) {
    // replaceString is applied to stuff like labels
    // middle group in regex accounts for 1 layer of braces, sufficient for `Print ${a+2}`
    function replaceString(s) {
        // `from` should have "global" flag enabled in order to replace all
        return s.replace(/(?<=\$\{)((?:[^{}]|\{[^}]*\})+)(?=\})/g, replaceLatex);
    }
    const simpleKeys = [
        "latex",
        "colorLatex",
        "pointOpacity",
        "lineOpacity",
        "pointSize",
        "lineWidth",
    ];
    const rootKeys = simpleKeys.concat([
        "labelSize",
        "labelAngle",
        "center",
        "opacity",
        "width",
        "height",
        "angle",
        "fillOpacity",
        "residualVariable",
        "fps",
    ]);
    const state = Calc.getState();
    const ticker = state.expressions.ticker;
    if (ticker?.handlerLatex !== undefined) {
        ticker.handlerLatex = replaceLatex(ticker.handlerLatex);
    }
    if (ticker?.minStepLatex !== undefined) {
        ticker.minStepLatex = replaceLatex(ticker.minStepLatex);
    }
    state.expressions.list.forEach((expr) => {
        rootKeys.forEach((k) => {
            if (k in expr) {
                expr[k] = replaceLatex(expr[k]);
            }
        });
        for (const sub of ["slider", "parametricDomain", "polarDomain"]) {
            if (expr[sub]) {
                ["max", "min", "step"].forEach((k) => {
                    if (k in expr[sub]) {
                        expr[sub][k] = replaceLatex(expr[sub][k]);
                    }
                });
            }
        }
        if (expr.label) {
            expr.label = replaceString(expr.label);
        }
        if (expr.columns) {
            expr.columns.forEach((col) => {
                simpleKeys.forEach((k) => {
                    if (k in col) {
                        col[k] = replaceLatex(col[k]);
                    }
                });
                col.values = col.values.map(replaceLatex);
            });
        }
        if (expr.clickableInfo?.latex) {
            expr.clickableInfo.latex = replaceLatex(expr.clickableInfo.latex);
        }
    });
    Calc.setState(state, {
        allowUndo: true,
    });
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}
function getReplacements(path, fromParsed, from, to) {
    let span, line;
    switch (path.node.type) {
        case "Identifier":
            if (path.node._symbol === fromParsed._symbol) {
                // A normal identifier
                return [
                    {
                        ...path.node.getInputSpan(),
                        // If True → it's actually a differential like dx
                        // path.parent?.node.type === "Integral" && path.index === 0
                        replacement: path.node._errorSymbol === "d" + path.node._symbol
                            ? "d" + to
                            : to,
                    },
                ];
            }
            break;
        case "FunctionCall":
            if (path.node._symbol === fromParsed._symbol) {
                span = path.node.getInputSpan();
                return [
                    {
                        start: span.start,
                        end: span.start + from.length,
                        replacement: to,
                    },
                ];
            }
            break;
        case "Assignment":
        case "FunctionDefinition":
            span = path.node.getInputSpan();
            line = path.node.getInputString();
            const eqIndex = line.indexOf("=");
            return [
                {
                    // Need this code (imperfect) to handle funky input like
                    // replacing "a_{0}" in "  a_{0}    =    72 "
                    start: span.start,
                    end: span.start + eqIndex,
                    replacement: line
                        .slice(0, eqIndex)
                        .replace(RegExp(String.raw `(?<=([,(]|^)(\s|\\ )*)` +
                        escapeRegExp(from) +
                        String.raw `(?=(\s|\\ )*((\\left)?\(|(\\right)?\)|,|$))`, "g"), to),
                },
            ];
            break;
        case "Derivative":
            span = path.node.getInputSpan();
            line = path.node.getInputString();
            const diffBottomStr = `{d${from}}`;
            const diffBottomStart = line.indexOf(diffBottomStr);
            return [
                {
                    start: span.start + diffBottomStart,
                    end: span.start + diffBottomStart + diffBottomStr.length,
                    replacement: `{d${to}}`,
                },
            ];
            break;
    }
    return [];
}
function refactor(from, to) {
    const fromParsed = parseDesmosLatex(from.trim());
    if (satisfiesType(fromParsed, "Identifier")) {
        // trim `from` to prevent inputs such as "  a" messing up matches that depend on `from` itself.
        from = from.trim();
        replace((s) => {
            const node = parseDesmosLatex(s);
            if (satisfiesType(node, "Error")) {
                return s;
            }
            const idPositions = [];
            traverse(node, {
                exit(path) {
                    idPositions.push(...getReplacements(path, fromParsed, from, to));
                },
            });
            // args don't necessarily go in latex order
            const sorted = idPositions.sort((a, b) => a.start - b.start);
            let acc = "";
            let endIndex = 0;
            for (let { start, end, replacement } of sorted) {
                // Conditional start >= endIndex to avoid double-replacement of the middle value
                // in And(Inequality, Inequality) which were not transformed to DoubleInequality.
                if (start >= endIndex) {
                    acc += s.slice(endIndex, start);
                    acc += replacement;
                }
                endIndex = end;
            }
            acc += s.slice(endIndex);
            return acc;
        });
    }
    else {
        const regex = RegExp(escapeRegExp(from), "g");
        replace((s) => s.replace(regex, to));
    }
}

;// CONCATENATED MODULE: ./src/plugins/find-replace/Controller.ts


class Controller {
    constructor() {
        this.replaceLatex = "";
    }
    init(view) {
        this.view = view;
    }
    getReplaceLatex() {
        return this.replaceLatex;
    }
    setReplaceLatex(latex) {
        this.replaceLatex = latex;
    }
    refactorAll() {
        refactor(Calc.controller.getExpressionSearchStr(), this.replaceLatex);
    }
    focusSearch() {
        Calc.controller.dispatch({
            type: "set-focus-location",
            location: { type: "search-expressions" },
        });
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/find-replace/ReplaceBar.less
var ReplaceBar = __webpack_require__(8754);
;// CONCATENATED MODULE: ./src/plugins/find-replace/ReplaceBar.less

            

var ReplaceBar_options = {};

ReplaceBar_options.insert = "head";
ReplaceBar_options.singleton = false;

var ReplaceBar_update = injectStylesIntoStyleTag_default()(ReplaceBar/* default */.Z, ReplaceBar_options);



/* harmony default export */ var find_replace_ReplaceBar = (ReplaceBar/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/find-replace/ReplaceBar.tsx


const autoOperatorNames = desmosRequire("main/mathquill-operators").getAutoOperators();
class ReplaceBar_ReplaceBar extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
    }
    template() {
        return (src_DCGView.jsx("div", { class: "dcg-expression-search-bar" },
            src_DCGView.jsx("div", { class: "dcg-search-mathquill-container" },
                src_DCGView.jsx(MathQuillView, { latex: () => this.controller.getReplaceLatex(), capExpressionSize: false, config: {
                        autoOperatorNames,
                    }, isFocused: false, getAriaLabel: "expression replace", getAriaPostLabel: "", onUserChangedLatex: (e) => this.controller.setReplaceLatex(e), onUserPressedKey: (key, e) => {
                        if (key === "Enter") {
                            this.controller.refactorAll();
                        }
                        else if (key === "Esc") {
                            this.closeReplace();
                        }
                        else if (key === "Ctrl-F") {
                            this.controller.focusSearch();
                        }
                        else {
                            const focusedMQ = MathQuillView.getFocusedMathquill();
                            focusedMQ.keystroke(key, e);
                            this.controller.setReplaceLatex(focusedMQ.latex());
                        }
                    }, onFocusedChanged: () => { }, hasError: false, selectOnFocus: true, noFadeout: true }),
                src_DCGView.jsx("i", { class: "dcg-icon-search dcg-icon-caret-right" })),
            src_DCGView.jsx("div", { class: "find-replace-replace-all", role: "button", onTap: () => this.controller.refactorAll() }, "replace all")));
    }
    closeReplace() {
        Calc.controller.dispatch({
            type: "close-expression-search",
        });
    }
    didMount() {
        this.controller.focusSearch();
    }
}

;// CONCATENATED MODULE: ./src/plugins/find-replace/View.ts


class View {
    constructor() {
        this.mountNode = null;
        this.replaceView = null;
    }
    init(controller) {
        this.controller = controller;
    }
    initView() {
        if (this.mountNode !== null) {
            // already open
            return;
        }
        const searchBar = document.querySelector(".dcg-expression-search-bar");
        if (searchBar === null) {
            throw new Error("Search bar not found");
        }
        const searchContainer = document.createElement("div");
        searchContainer.style.display = "flex";
        searchContainer.style.flexDirection = "column";
        if (searchBar.parentNode === null) {
            throw new Error("Search bar parent node not found");
        }
        searchBar.parentNode.insertBefore(searchContainer, searchBar);
        searchContainer.appendChild(searchBar);
        this.mountNode = document.createElement("div");
        this.mountNode.className = "find-replace-expression-replace-bar";
        searchContainer.appendChild(this.mountNode);
        this.replaceView = src_DCGView.mountToNode(ReplaceBar_ReplaceBar, this.mountNode, {
            controller: src_DCGView.const(this.controller),
        });
    }
    destroyView() {
        if (this.mountNode === null) {
            // the view is already destroyed, so no need to throw an error
            return;
        }
        src_DCGView.unmountFromNode(this.mountNode);
        this.mountNode = null;
        this.replaceView = null;
    }
    updateReplaceView() {
        this.replaceView && this.replaceView.update();
    }
}

;// CONCATENATED MODULE: ./src/plugins/find-replace/index.ts



const controller = new Controller();
const view = new View();
controller.init(view);
view.init(controller);
let dispatchListenerID;
function tryInitView() {
    try {
        view.initView();
    }
    catch {
        console.warn("Failed to initialize find-replace view");
    }
}
function find_replace_onEnable() {
    if (Calc.controller.getExpressionSearchOpen()) {
        tryInitView();
    }
    dispatchListenerID = Calc.controller.dispatcher.register(({ type }) => {
        if (type === "open-expression-search") {
            tryInitView();
        }
        else if (type === "close-expression-search") {
            view.destroyView();
        }
        // may want to listen to update-expression-search-str
    });
    return controller;
}
function find_replace_onDisable() {
    Calc.controller.dispatcher.unregister(dispatchListenerID);
    view.destroyView();
}
/* harmony default export */ var find_replace = ({
    id: "find-and-replace",
    name: "Find and Replace",
    description: 'Adds a "replace all" button in the Ctrl+F Menu to let you easily refactor variable/function names.',
    onEnable: find_replace_onEnable,
    onDisable: find_replace_onDisable,
    enabledByDefault: true,
});

;// CONCATENATED MODULE: ./src/plugins/wolfram2desmos/Controller.ts
/*
 This controller manages the focus events of Expression panel
*/
class Controller_Controller {
    constructor(filterTag, callback) {
        this.enabled = false;
        this.configFlags = {
            reciprocalExponents2Surds: false,
            derivativeLoopLimit: true, // converts (d^#/dx^#) to (d/dx)... # times, limited to 10 iterations
        };
        this.panel = document.querySelector(".dcg-exppanel-outer");
        this.onFocus = callback;
        this.filterTag = filterTag;
        let focusHandler = (e) => {
            // used arrow function to allow "this" to point to the class instance
            let elem = e.target;
            let isTarget = this.filterTag.includes(elem.tagName.toLowerCase());
            if (isTarget && this.enabled) {
                callback(e);
            }
        };
        this.panel?.addEventListener("focusin", focusHandler, false);
        this.panel?.addEventListener("focusout", focusHandler, false);
    }
    enable() {
        this.enabled = true;
    }
    disable() {
        this.enabled = false;
    }
    applyConfigFlags(changes) {
        this.configFlags = {
            ...this.configFlags,
            ...changes,
        };
    }
}

;// CONCATENATED MODULE: ./src/plugins/wolfram2desmos/config.ts
const configList = [
    {
        key: "reciprocalExponents2Surds",
        name: "Radical Notation",
        description: "Converts fractional powers less than one to a radical equivalent (surd)",
        type: "boolean",
        default: false,
    },
    {
        key: "derivativeLoopLimit",
        name: "Expand Derivatives",
        description: "Expands the nth derivative of Leibniz notation into repeated derivatives (limited to 10).",
        type: "boolean",
        default: true,
    },
    // `as const` ensures that the key values can be used as types
    // instead of the type 'string'
];

;// CONCATENATED MODULE: ./src/plugins/wolfram2desmos/wolfram2desmos.ts

// IMPORTANT
// isIllegalASCIIMath() is REQUIRED BEFORE executing wolfram2desmos()
// If isIllegalASCIIMath() = false, THEN DON'T RUN wolfram2desmos()
// Ensure that JS DOESN'T override the clipboard
// Besides that, this should work flawlessly! Enjoy!
function isIllegalASCIIMath(input) {
    function count(expr) {
        if (input.match(expr) != null) {
            return input.match(expr)?.length ?? 0;
        }
        else {
            return 0;
        }
    }
    // checks for illegal characters
    if (input.search(/\\/) != -1) {
        return false;
    }
    if (input.search(/\n/) != -1) {
        //console.warn("Newline detected");
        return false;
    }
    if (input.search(/(?<=_|\^|\\\w+|\S]|}){/) != -1) {
        //console.warn("Function curly bracket detected");
        return false;
    }
    if (input.search(/\/\//) != -1) {
        //console.warn("URL detected");
        return false;
    }
    // determines if the brackets are correct
    if (count(/\(/g) > count(/\)/g)) {
        //console.warn("Input has " + (count(/\(/g) - count(/\)/g)) + " more '(' characters than ')' characters");
        return false;
    }
    if (count(/\(/g) < count(/\)/g)) {
        //console.warn("Input has " + (count(/\)/g) - count(/\(/g)) + " more ')' characters than '(' characters");
        return false;
    }
    if (count(/\{/g) > count(/\}/g)) {
        //console.warn("Input has " + (count(/\{/g) - count(/\}/g)) + " more '{' characters than '}' characters");
        return false;
    }
    if (count(/\{/g) < count(/\}/g)) {
        //console.warn("Input has " + (count(/\}/g) - count(/\{/g)) + " more '}' characters than '{' characters");
        return false;
    }
    if (count(/\|/g) % 2 == 1) {
        //console.warn("Input has uneven '|' brackets");
        return false;
    }
    return true;
}
function wolfram2desmos(input) {
    // FUNCTIONS
    // returns the first match's index
    function find(expr) {
        return input.search(expr);
    }
    // returns the last match's index (requires global expr)
    function findFinal(expr) {
        let recent = [...input.matchAll(expr)];
        return recent[recent.length - 1]?.index ?? -1;
    }
    // replaces all matches with replacement
    function replace(expr, replacement) {
        input = input.replace(expr, replacement);
    }
    // inserts replacement at given index
    function insert(index, replacement) {
        if (index >= 0) {
            input =
                input.slice(0, index) + replacement + input.slice(index, input.length);
        }
    }
    // overwrites current index with replacement
    function overwrite(index, replacement) {
        input =
            input.slice(0, index) +
                replacement +
                input.slice(index + 1, input.length);
    }
    // iterates the bracket parser
    function bracketEval() {
        if (input[i] == ")") {
            bracket += 1;
        }
        else if (input[i] == "(") {
            bracket -= 1;
        }
    }
    // iterates the bracket parser with {} in mind
    function bracketEvalFinal() {
        if (input[i] == ")" || input[i] == "}" || input[i] == "〕") {
            bracket += 1;
        }
        else if (input[i] == "(" || input[i] == "{" || input[i] == "〔") {
            bracket -= 1;
        }
    }
    // checks if its an operator
    function isOperator0(x) {
        return ["+", "-", "±", "*", "=", ">", "<", "≥", "≤", "≠", "→", " ", "〔", "〕", ":"].includes(input[x]);
    }
    function isOperator1(x) {
        return ["+", "-", "±", "*", "=", ">", "<", "≥", "≤", "≠", "→", "/", "%", "〔", "〕", ":"].includes(input[x]);
    }
    function isOperator2(x) {
        return ["^", "_"].includes(input[x]);
    }
    // PREPARATIONS
    // predefine some variables.
    let i;
    let bracket;
    let startingIndex;
    let selection;
    let temp;
    let functionSymbols = /^[a-wΑ-ωⒶ-ⓏＡ-Ｚ⒜-⒵√%][\(\_\^]/gi;
    input = " " + input + " "; // this gives some breathing space
    // symbol replacements
    replace(/ϕ/g, "φ");
    replace(/\*\*/g, "^");
    replace(/(?<![A-Z|a-z|Α-ω])sqrt/g, "√");
    replace(/(?<![A-Z|a-z|Α-ω])cbrt/g, "∛");
    replace(/(?<![A-Z|a-z|Α-ω])infinity|infty/g, "∞");
    replace(/(?<![A-Z|a-z|Α-ω])mod(ulus|ulo)/g, "mod");
    replace(/(?<![A-Z|a-z|Α-ω])mod(?!\s*\()/g, "%");
    replace(/(?<![A-Z|a-z|Α-ω])pm/g, "±");
    replace(/×|∙/g, "*");
    replace(/==/g, "=");
    replace(/\>\=/g, "≥");
    replace(/\<\=/g, "≤");
    replace(/\!\=/g, "≠");
    replace(/\-\>/g, "→");
    // replace piecewise {} brackets with special character
    while (find(/(?<!_|\^|\\\w+|\S]|}){/) != -1) {
        startingIndex = find(/(?<!_|\^|\\\w+|\S]|}){/);
        i = startingIndex;
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (bracket == 0) {
                overwrite(startingIndex, "〔");
                overwrite(i, "〕");
                break;
            }
        }
    }
    // function replacements
    // ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ
    replace(/(?<![A-Z|a-z|Α-ω])arcsinh/g, "Ⓐ"); // 	https://qaz.wtf/u/convert.cgi?
    replace(/(?<![A-Z|a-z|Α-ω])arccosh/g, "Ⓑ");
    replace(/(?<![A-Z|a-z|Α-ω])arctanh/g, "Ⓒ");
    replace(/(?<![A-Z|a-z|Α-ω])arccsch/g, "Ⓓ");
    replace(/(?<![A-Z|a-z|Α-ω])arcsech/g, "Ⓔ");
    replace(/(?<![A-Z|a-z|Α-ω])arccoth/g, "Ⓕ");
    replace(/(?<![A-Z|a-z|Α-ω])sinh/g, "Ⓖ");
    replace(/(?<![A-Z|a-z|Α-ω])cosh/g, "Ⓗ");
    replace(/(?<![A-Z|a-z|Α-ω])tanh/g, "Ⓘ");
    replace(/(?<![A-Z|a-z|Α-ω])csch/g, "Ⓙ");
    replace(/(?<![A-Z|a-z|Α-ω])sech/g, "Ⓚ");
    replace(/(?<![A-Z|a-z|Α-ω])coth/g, "Ⓛ");
    replace(/(?<![A-Z|a-z|Α-ω])arcsin/g, "Ⓜ");
    replace(/(?<![A-Z|a-z|Α-ω])arccos/g, "Ⓝ");
    replace(/(?<![A-Z|a-z|Α-ω])arctan/g, "Ⓞ");
    replace(/(?<![A-Z|a-z|Α-ω])arccsc/g, "Ⓟ");
    replace(/(?<![A-Z|a-z|Α-ω])arcsec/g, "Ⓠ");
    replace(/(?<![A-Z|a-z|Α-ω])arccot/g, "Ⓡ");
    replace(/(?<![A-Z|a-z|Α-ω])sin/g, "Ⓢ");
    replace(/(?<![A-Z|a-z|Α-ω])cos/g, "Ⓣ");
    replace(/(?<![A-Z|a-z|Α-ω])tan/g, "Ⓤ");
    replace(/(?<![A-Z|a-z|Α-ω])csc/g, "Ⓥ");
    replace(/(?<![A-Z|a-z|Α-ω])sec/g, "Ⓦ");
    replace(/(?<![A-Z|a-z|Α-ω])cot/g, "Ⓧ");
    replace(/(?<![A-Z|a-z|Α-ω])log|ln/g, "Ⓩ");
    // ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ
    replace(/int(egral|)(?!\S)/g, "Ａ");
    replace(/int(egral|)(?=_)/g, "Ｂ");
    replace(/sum(?=_)/g, "Ｃ");
    replace(/prod(uct|)(?=_)/g, "Ｄ");
    while (find(/(?<![A-Z|a-z|Α-ω])mod(?![A-Z|a-z|Α-ω])/) != -1) {
        i = find(/(?<![A-Z|a-z|Α-ω])mod(?![A-Z|a-z|Α-ω])/) + 3;
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEval();
            if (input[i] == "," && bracket == -1) {
                replace(/(?<![A-Z|a-z|Α-ω])mod(?![A-Z|a-z|Α-ω])/, "Ｅ");
                break;
            }
            if (bracket == 0) {
                replace(/(?<![A-Z|a-z|Α-ω])mod(?![A-Z|a-z|Α-ω])/, "%");
                break;
            }
        }
        continue;
    }
    replace(/(?<![A-Z|a-z|Α-ω])abs(olute|)/g, "Ｆ");
    while (find(/\|/) != -1) {
        i = find(/\|/) + 1;
        overwrite(i - 1, "Ｆ(");
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (bracket == -1 && input[i] == "|") {
                overwrite(i, ")");
                break;
            }
        }
    }
    replace(/(?<![A-Z|a-z|Α-ω])binomial(?![A-Z|a-z|Α-ω])/g, "Ｇ");
    replace(/(?<![A-Z|a-z|Α-ω])floor(?![A-Z|a-z|Α-ω])/g, "Ｈ");
    replace(/(?<![A-Z|a-z|Α-ω])ceiling(?![A-Z|a-z|Α-ω])/g, "Ｉ");
    replace(/(?<![A-Z|a-z|Α-ω])round(?![A-Z|a-z|Α-ω])/g, "Ｊ");
    replace(/(?<![A-Z|a-z|Α-ω])(gcd|gcf)(?![A-Z|a-z|Α-ω])/g, "Ｋ");
    replace(/(?<![A-Z|a-z|Α-ω])lcm(?![A-Z|a-z|Α-ω])/g, "Ｌ");
    while (find(/d(\^\d*)*\/dx(\^\d*)*/) != -1) {
        i = find(/d(\^\d*)*\/dx(\^\d*)*/);
        selection = input.match(/(?<=\^)(\d*)/)?.[0] ?? "";
        replace(/d(\^\d*)*\/dx(\^\d*)*/, "");
        insert(i, "Ｍ");
        insert(i + 1, "^(" + selection + ")");
        break;
    }
    // unused: ⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵
    // dead space removal
    replace(/(?<=[\/\^\_\√∛%])\s*/g, "");
    replace(/\s*(?=[\/\^\_%])/g, "");
    // trail removal
    replace(/\sfor(?!.*\sfor).*/g, "");
    replace(/\(Taylor series\)/g, "");
    // latin replacements
    replace(/(?<![A-Z|a-z|Α-ω])alpha/g, "α");
    replace(/(?<![A-Z|a-z|Α-ω])beta/g, "β");
    replace(/(?<![A-Z|a-z|Α-ω])Gamma/g, "Γ");
    replace(/(?<![A-Z|a-z|Α-ω])gamma/g, "γ");
    replace(/(?<![A-Z|a-z|Α-ω])Delta/g, "Δ");
    replace(/(?<![A-Z|a-z|Α-ω])delta/g, "δ");
    replace(/(?<![A-Z|a-z|Α-ω])epsilon/g, "ε");
    replace(/(?<![A-Z|a-z|Α-ω])zeta/g, "ζ");
    replace(/(?<![A-Z|a-z|Α-ω])eta/g, "η");
    replace(/(?<![A-Z|a-z|Α-ω])Theta/g, "Θ");
    replace(/(?<![A-Z|a-z|Α-ω])theta/g, "θ");
    replace(/(?<![A-Z|a-z|Α-ω])iota/g, "ι");
    replace(/(?<![A-Z|a-z|Α-ω])kappa/g, "κ");
    replace(/(?<![A-Z|a-z|Α-ω])Lambda/g, "Λ");
    replace(/(?<![A-Z|a-z|Α-ω])lambda/g, "λ");
    replace(/(?<![A-Z|a-z|Α-ω])mu/g, "μ");
    replace(/(?<![A-Z|a-z|Α-ω])nu/g, "ν");
    replace(/(?<![A-Z|a-z|Α-ω])Xi/g, "Ξ");
    replace(/(?<![A-Z|a-z|Α-ω])xi/g, "ξ");
    replace(/(?<![A-Z|a-z|Α-ω])Pi/g, "Π");
    replace(/(?<![A-Z|a-z|Α-ω])pi/g, "π");
    replace(/(?<![A-Z|a-z|Α-ω])rho/g, "ρ");
    replace(/(?<![A-Z|a-z|Α-ω])Sigma/g, "Σ");
    replace(/(?<![A-Z|a-z|Α-ω])sigma/g, "σ");
    replace(/(?<![A-Z|a-z|Α-ω])tau/g, "τ");
    replace(/(?<![A-Z|a-z|Α-ω])Upsilon/g, "Τ");
    replace(/(?<![A-Z|a-z|Α-ω])upsilon/g, "υ");
    replace(/(?<![A-Z|a-z|Α-ω])Phi/g, "Φ");
    replace(/(?<![A-Z|a-z|Α-ω])phi/g, "φ");
    replace(/(?<![A-Z|a-z|Α-ω])chi/g, "χ");
    replace(/(?<![A-Z|a-z|Α-ω])Psi/g, "Ψ");
    replace(/(?<![A-Z|a-z|Α-ω])psi/g, "ψ");
    replace(/(?<![A-Z|a-z|Α-ω])Omega/g, "Ω");
    replace(/(?<![A-Z|a-z|Α-ω])omega/g, "ω");
    replace(/(?<![A-Z|a-z|Α-ω])constant/g, "C");
    // MISSING BRACKETS
    // this will ensure brackets AFTER each operator
    while (findFinal(/[\/\^\_\√∛%](?!\()/g) != -1) {
        i = findFinal(/[\/\^\_\√∛%](?!\()/g) + 1;
        insert(i, "(");
        temp = input.slice(i - 2, i);
        temp = temp.search(functionSymbols) != -1;
        bracket = -1;
        selection = input.slice(i + 1, input.length);
        if (selection[0] == "+" || selection[0] == "-" || selection[0] == "±") {
            i += 1;
        }
        if (selection.search(functionSymbols) == 0 && selection[1] == "(") {
            i += 1;
        }
        else if (selection.search(/([0-9]*[.])?[0-9]+/) == 0) {
            i += selection.match(/([0-9]*[.])?[0-9]+/)?.[0]?.length ?? 0;
            if (input[i + 1] == "(") {
                insert(i + 1, ")");
                continue;
            }
        }
        while (true) {
            i++;
            bracketEval();
            if (bracket == 0) {
                insert(i, ")");
                break;
            }
            if (temp) {
                if ((isOperator1(i) || isOperator2(i)) && bracket == -1) {
                    insert(i, ")");
                    break;
                }
                if (input[i] == "(" && bracket == -2) {
                    insert(i, ")");
                    break;
                }
            }
            if (bracket == -1) {
                if (isOperator1(i)) {
                    insert(i, ")");
                    break;
                }
                if (isOperator2(i)) {
                    i++;
                    bracket -= 1;
                    continue;
                }
                if (input[i] == " " || input[i] == "," || input[i] == ":") {
                    // eg: "a/(a 2" → "a/(a) (2)"
                    insert(i, ")");
                    break;
                }
                if (i == input.length) {
                    insert(i, ")");
                    break;
                }
            }
        }
    }
    // this will ensure brackets BEFORE each DIVISION | MODULO
    while (find(/\/|%/) != -1) {
        startingIndex = find(/\/|%/);
        i = startingIndex - 1;
        temp = false;
        if (input[startingIndex] == "/") {
            replace(/\//, "╱");
        }
        else {
            replace(/%/, "⁒");
        }
        // preceded by a ")" scenario
        if (input[i] == ")") {
            bracket = 1;
            while (i > 1) {
                i -= 1;
                bracketEval();
                if (bracket == 0) {
                    temp = input[i - 1] + "(";
                    if (temp.search(functionSymbols) == 0 ||
                        temp == "^(" ||
                        temp == "_	(") {
                        temp = true;
                        break;
                    }
                }
            }
        }
        // preceded WITHOUT a ")" scenario
        if (input[i] != ")" || temp) {
            insert(startingIndex, ")");
            i = startingIndex;
            bracket = 1;
            while (i > 0) {
                i -= 1;
                bracketEval();
                if ((isOperator0(i) && bracket == 1) || bracket == 0) {
                    insert(i + 1, "(");
                    break;
                }
            }
        }
    }
    replace(/╱/g, "/");
    replace(/⁒/g, "%");
    // OFFICIAL BRACKET CHECKPOINT REACHED
    // BEGIN LATEX FORMATTING
    // implement function exponents
    while (find(/(?<=[Ⓐ-Ⓩ]\^)\(/) != -1) {
        startingIndex = find(/(?<=[Ⓐ-Ⓩ]\^)\(/);
        i = startingIndex;
        overwrite(i, "‹");
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, "›");
                break;
            }
        }
        selection = input.slice(startingIndex, i + 1);
        if (selection == "‹2›" ||
            (selection == "‹-1›" && input[startingIndex - 2] != "Ⓩ")) {
            continue;
        }
        else {
            input =
                input.slice(0, startingIndex - 1) + input.slice(i + 1, input.length);
            i = startingIndex;
            insert(i, "(");
            bracket = -2;
            while (i < input.length) {
                i++;
                bracketEval();
                if (bracket == -1) {
                    insert(i, ")");
                    insert(i + 1, "^" + selection);
                    break;
                }
            }
        }
    }
    replace(/‹/g, "(");
    replace(/›/g, ")");
    // implement fractions
    while (find(/\//) != -1) {
        startingIndex = find(/\//);
        i = startingIndex + 1;
        bracket = -1;
        overwrite(i, "{");
        while (i < input.length) {
            i++;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, "}");
                break;
            }
        }
        i = startingIndex;
        bracket = 1;
        overwrite(i, "");
        i -= 1;
        overwrite(i, "}");
        while (i > 0) {
            i -= 1;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, "\\frac{");
                break;
            }
        }
    }
    // implement modulo (BASED ON FRACTION IMPLEMENTATION)
    while (find(/%/) != -1) {
        startingIndex = find(/%/);
        i = startingIndex + 1;
        bracket = -1;
        overwrite(i, ",");
        while (i < input.length) {
            i++;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, ")");
                break;
            }
        }
        i = startingIndex;
        bracket = 1;
        overwrite(i, "");
        i -= 1;
        overwrite(i, "");
        while (i > 0) {
            i -= 1;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, "Ｅ(");
                break;
            }
        }
    }
    // implement subscripts and superscripts
    while (find(/[_\^√∛]\(/) != -1) {
        i = find(/[_\^√∛]\(/) + 1;
        overwrite(i, "{");
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEval();
            if (bracket == 0) {
                overwrite(i, "}");
                break;
            }
        }
    }
    // remove excess brackets
    while (find(/\\frac{\(/) != -1) {
        startingIndex = find(/\\frac\{\(/) + 6;
        i = startingIndex; // "("
        bracket = -1;
        temp = false;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (temp) {
                if (input[i] == " ") {
                    continue;
                }
                if (input[i] == "}") {
                    overwrite(startingIndex, "❌");
                    overwrite(i - 1, "❌");
                    break;
                }
                else {
                    overwrite(startingIndex, "✅");
                    break;
                }
            }
            if (!temp && bracket == 0) {
                temp = true;
            }
        }
        replace(/❌/g, "");
    }
    replace(/✅/g, "(");
    // implement absolutes
    replace(/(?<=Ｆ)\s*/g, "");
    while (find(/Ｆ\(/) != -1) {
        i = find(/Ｆ\(/);
        replace(/Ｆ\(/, "«");
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (bracket == 0) {
                overwrite(i, "»");
                break;
            }
        }
    }
    // convert reciprocal exponents to surd
    while (wolfram2desmos_controller.configFlags.reciprocalExponents2Surds &&
        findFinal(/\^\{\\frac\{1\}\{[A-z\d\s\.\	+\-\*]*\}\}/g) != -1) {
        startingIndex = findFinal(/\^\{\\frac\{1\}\{[A-z\d\s\.\+\-\*]*\}\}/g);
        i = startingIndex;
        bracket = 0;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (bracket == 0) {
                selection = input.slice(startingIndex, i + 1);
                input =
                    input.slice(0, startingIndex) + input.slice(i + 1, input.length);
                break;
            }
        }
        i = startingIndex - 1;
        // proceeding with a ")" scenario
        if (input[i] == ")") {
            bracket = 1;
            while (i > 0) {
                i -= 1;
                bracketEvalFinal();
                if (bracket == 0) {
                    overwrite(startingIndex - 1, "}");
                    overwrite(i, "{");
                    insert(i, "√[" +
                        selection.match(/(?<=\^\{\\frac\{1\}\{)[A-z\d\s\.\	+\-\*]*(?=\}\})/)?.[0] +
                        "]");
                    break;
                }
            }
        }
        // preceded WITHOUT a ")" scenario
        else {
            insert(startingIndex, "}");
            bracket = 1;
            while (i > 0) {
                i -= 1;
                bracketEvalFinal();
                if ((isOperator0(i) && bracket == 1) || bracket == 0) {
                    insert(i + 1, "{");
                    insert(i, "√[" +
                        selection?.match(/(?<=\^\{\\frac\{1\}\{)[A-z\d\s\.\	+\-\*]*(?=\}\})/)?.[0] +
                        "]");
                    break;
                }
            }
        }
    }
    // implement double-argument logarithm
    replace(/(?<=Ⓩ)\s*/g, "");
    while (find(/(?<=Ⓩ)\(/) != -1) {
        startingIndex = find(/(?<=Ⓩ)\(/);
        i = startingIndex;
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (input[i] == "," && bracket == -1) {
                overwrite(i, "");
                selection = input.slice(startingIndex + 1, i);
                input =
                    input.slice(0, startingIndex + 1) + input.slice(i, input.length);
                insert(startingIndex, "_{" + selection + "}");
                break;
            }
            if (bracket == 0) {
                overwrite(startingIndex, "✅");
                break;
            }
        }
    }
    replace(/✅/g, "(");
    // FINAL REPLACEMENTS
    // implment proper brackets when all the operator brackets are gone
    replace(/\(/g, "\\left(");
    replace(/\)/g, "\\right)");
    replace(/\«/g, "\\left|");
    replace(/\»/g, "\\right|");
    replace(/〔/g, "\\left\\{");
    replace(/〕/g, "\\right\\}");
    // symbol replacements
    replace(/√/g, "\\sqrt");
    replace(/∛/g, "\\sqrt[3]");
    replace(/\*/g, "\\cdot ");
    replace(/(?<=\d) (?=\d)/g, " \\cdot ");
    // function replacements
    // ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ
    replace(/Ⓐ/g, "arcsinh");
    replace(/Ⓑ/g, "arccosh");
    replace(/Ⓒ/g, "arctanh");
    replace(/Ⓓ/g, "arccsch");
    replace(/Ⓔ/g, "arcsech");
    replace(/Ⓕ/g, "arccoth");
    replace(/Ⓖ/g, "sinh");
    replace(/Ⓗ/g, "cosh");
    replace(/Ⓘ/g, "tanh");
    replace(/Ⓙ/g, "csch");
    replace(/Ⓚ/g, "sech");
    replace(/Ⓛ/g, "coth");
    replace(/Ⓜ/g, "arcsin");
    replace(/Ⓝ/g, "arccos");
    replace(/Ⓞ/g, "arctan");
    replace(/Ⓟ/g, "arccsc");
    replace(/Ⓠ/g, "arcsec");
    replace(/Ⓡ/g, "arccot");
    replace(/Ⓢ/g, "sin");
    replace(/Ⓣ/g, "cos");
    replace(/Ⓤ/g, "tan");
    replace(/Ⓥ/g, "csc");
    replace(/Ⓦ/g, "sec");
    replace(/Ⓧ/g, "cot");
    replace(/Ⓩ(?!_)/g, "ln");
    replace(/Ⓩ/g, "log");
    // ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ
    replace(/Ａ/g, "\\int_{0}^{t}");
    replace(/Ｂ/g, "\\int");
    replace(/Ｃ/g, "\\sum");
    replace(/Ｄ/g, "\\prod");
    replace(/Ｅ/g, "\\operatorname{mod}");
    replace(/Ｇ/g, "\\operatorname{nCr}");
    replace(/Ｈ/g, "\\operatorname{floor}");
    replace(/Ｉ/g, "\\operatorname{ceil}");
    replace(/Ｊ/g, "\\operatorname{round}");
    replace(/Ｋ/g, "\\operatorname{gcf}");
    replace(/Ｌ/g, "\\operatorname{lcm}");
    replace(/Ｍ(?!\^\{)/g, "\\frac{d}{dx}");
    while (find(/Ｍ/) != -1) {
        startingIndex = find(/Ｍ/);
        i = startingIndex + 2;
        bracket = -1;
        while (i < input.length) {
            i++;
            bracketEvalFinal();
            if (bracket == 0) {
                selection = input.slice(startingIndex + 3, i);
                input =
                    input.slice(0, startingIndex + 1) + input.slice(i + 1, input.length);
                break;
            }
        }
        if (selection.search(/[^\d]*/g) != -1) {
            const selectionNum = parseInt(selection);
            if (selectionNum <= 10 && wolfram2desmos_controller.configFlags.derivativeLoopLimit) {
                replace(/Ｍ/, "");
                for (i = 0; i < selectionNum; i++) {
                    insert(startingIndex, "\\frac{d}{dx}");
                }
                break;
            }
        }
        replace(/Ｍ/, "\\frac{d^{" + selection + "}}{dx^{" + selection + "}}");
    }
    // unused: ⒜⒝⒞⒟⒠⒡⒢⒣⒤⒥⒦⒧⒨⒩⒪⒫⒬⒭⒮⒯⒰⒱⒲⒳⒴⒵
    // latin replacements
    replace(/α/g, "\\alpha");
    replace(/β/g, "\\beta");
    replace(/Γ/g, "\\Gamma");
    replace(/γ/g, "\\gamma");
    replace(/Δ/g, "\\Delta");
    replace(/δ/g, "\\delta");
    replace(/ε/g, "\\epsilon");
    replace(/ζ/g, "\\zeta");
    replace(/η/g, "\\eta");
    replace(/Θ/g, "\\Theta");
    replace(/θ/g, "\\theta");
    replace(/ι/g, "\\iota");
    replace(/κ/g, "\\kappa");
    replace(/Λ/g, "\\Lambda");
    replace(/λ/g, "\\lambda");
    replace(/μ/g, "\\mu");
    replace(/ν/g, "\\nu");
    replace(/Ξ/g, "\\Xi");
    replace(/ξ/g, "\\xi");
    replace(/Π/g, "\\Pi");
    replace(/π/g, "\\pi");
    replace(/ρ/g, "\\rho");
    replace(/Σ/g, "\\Sigma");
    replace(/σ/g, "\\sigma");
    replace(/τ/g, "\\tau");
    replace(/Τ/g, "\\Upsilon");
    replace(/υ/g, "\\upsilon");
    replace(/Φ/g, "\\Phi");
    replace(/φ/g, "\\phi");
    replace(/χ/g, "\\chi");
    replace(/Ψ/g, "\\Psi");
    replace(/ψ/g, "\\psi");
    replace(/Ω/g, "\\Omega");
    replace(/ω/g, "\\omega");
    replace(/polygamma/g, "\\psi_{poly}");
    replace(/(^(\s*))|(\s*$)/g, "");
    return input;
}

;// CONCATENATED MODULE: ./src/plugins/wolfram2desmos/index.ts




// initialize controller and observe textarea and input tags
let wolfram2desmos_controller = new Controller_Controller(["textarea", "input"], function (e) {
    let elem = e.target
        ?.parentElement?.parentElement;
    switch (e.type) {
        case "focusin":
            elem?.addEventListener("paste", pasteHandler, false);
            break;
        case "focusout":
            elem?.removeEventListener("paste", pasteHandler, false);
            break;
        default:
            break;
    }
});
// https://stackoverflow.com/a/34278578
function typeInTextArea(newText, elm = document.activeElement) {
    const el = elm;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    el.value = before + newText + after;
    el.selectionStart = el.selectionEnd = start + (newText?.length ?? 0);
    el.focus();
}
function pasteHandler(e) {
    let elem = e.target;
    let pasteData = e.clipboardData?.getData("Text");
    if (!(elem?.classList.contains("dcg-label-input") ?? true) &&
        pasteData !== undefined &&
        pasteData !== "" &&
        Calc.controller.getItemModel(Calc.selectedExpressionId)?.type ===
            "expression" &&
        isIllegalASCIIMath(pasteData)) {
        e.stopPropagation();
        e.preventDefault();
        typeInTextArea(wolfram2desmos(pasteData));
    }
}
function wolfram2desmos_onEnable(config) {
    wolfram2desmos_controller.applyConfigFlags(config);
    wolfram2desmos_controller.enable();
    return wolfram2desmos_controller;
}
function wolfram2desmos_onDisable() {
    wolfram2desmos_controller.disable();
}
/* harmony default export */ var plugins_wolfram2desmos = ({
    id: "wolfram2desmos",
    name: "Wolfram To Desmos",
    description: "Lets you paste ASCIIMath (such as the results of Wolfram Alpha queries) into Desmos.",
    onEnable: wolfram2desmos_onEnable,
    onDisable: wolfram2desmos_onDisable,
    enabledByDefault: true,
    config: configList,
    onConfigChange(changes) {
        wolfram2desmos_controller.applyConfigFlags(changes);
    },
});

;// CONCATENATED MODULE: ./src/plugins/video-creator/backend/utils.ts

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function isValidNumber(s) {
    return !isNaN(EvaluateSingleExpression(s));
}
function isValidLength(s) {
    const evaluated = EvaluateSingleExpression(s);
    return !isNaN(evaluated) && evaluated > 0;
}
function boundsEqual(a, b) {
    return (a.left === b.left &&
        a.right === b.right &&
        a.top === b.top &&
        a.bottom === b.bottom);
}
function scaleBoundsAboutCenter(b, r) {
    const cx = (b.left + b.right) / 2;
    const cy = (b.top + b.bottom) / 2;
    return {
        left: cx + (b.left - cx) * r,
        right: cx + (b.right - cx) * r,
        top: cy + (b.top - cy) * r,
        bottom: cy + (b.bottom - cy) * r,
    };
}

;// CONCATENATED MODULE: ./src/plugins/video-creator/backend/capture.ts


function cancelCapture(controller) {
    controller.captureCancelled = true;
    if (controller.actionCaptureState !== "none") {
        cancelActionCapture(controller);
    }
}
async function captureAndApplyFrame(controller) {
    const frame = await captureFrame(controller);
    controller.frames.push(frame);
    controller.updateView();
}
async function captureFrame(controller) {
    const width = controller.getCaptureWidthNumber();
    const height = controller.getCaptureHeightNumber();
    const targetPixelRatio = controller.getTargetPixelRatio();
    // resolves the screenshot as a data URI
    return new Promise((resolve, reject) => {
        const tryCancel = () => {
            if (controller.captureCancelled) {
                controller.captureCancelled = false;
                reject("cancelled");
            }
        };
        tryCancel();
        // poll for mid-screenshot cancellation (only affects UI)
        const interval = window.setInterval(tryCancel, 50);
        const pixelBounds = Calc.graphpaperBounds.pixelCoordinates;
        const ratio = height / width / (pixelBounds.height / pixelBounds.width);
        const mathBounds = Calc.graphpaperBounds.mathCoordinates;
        // make the captured region entirely visible
        const clampedMathBounds = scaleBoundsAboutCenter(mathBounds, Math.min(ratio, 1 / ratio));
        Calc.asyncScreenshot({
            width: width / targetPixelRatio,
            targetPixelRatio: targetPixelRatio,
            height: height / targetPixelRatio,
            showLabels: true,
            preserveAxisLabels: true,
            mathBounds: clampedMathBounds,
        }, (data) => {
            clearInterval(interval);
            resolve(data);
        });
    });
}
async function captureSlider(controller) {
    const sliderSettings = controller.sliderSettings;
    const variable = sliderSettings.variable;
    const min = EvaluateSingleExpression(sliderSettings.minLatex);
    const max = EvaluateSingleExpression(sliderSettings.maxLatex);
    const step = EvaluateSingleExpression(sliderSettings.stepLatex);
    const slider = controller.getMatchingSlider();
    if (slider === undefined) {
        return;
    }
    const maybeNegativeNumSteps = (max - min) / step;
    const m = maybeNegativeNumSteps > 0 ? 1 : -1;
    const numSteps = m * maybeNegativeNumSteps;
    const correctDirectionStep = m * step;
    // `<= numSteps` to include the endpoints for stuff like 0 to 10, step 1
    // rarely hurts to have an extra frame
    for (let i = 0; i <= numSteps; i++) {
        const value = min + correctDirectionStep * i;
        Calc.setExpression({
            id: slider.id,
            latex: `${variable}=${value}`,
        });
        try {
            await captureAndApplyFrame(controller);
        }
        catch {
            // should be paused due to cancellation
            break;
        }
    }
}
function cancelActionCapture(controller) {
    controller.isCapturing = false;
    controller.actionCaptureState = "none";
    controller.updateView();
    Calc.unobserveEvent("change.dsm-action-change");
}
async function captureActionFrame(controller, callbackIfCancel) {
    let stepped = false;
    try {
        const tickCountRemaining = EvaluateSingleExpression(controller.tickCountLatex);
        if (tickCountRemaining > 0) {
            controller.actionCaptureState = "waiting-for-screenshot";
            await captureAndApplyFrame(controller);
            controller.setTickCountLatex(String(tickCountRemaining - 1));
            controller.actionCaptureState = "waiting-for-update";
            if (tickCountRemaining - 1 > 0) {
                Calc.controller.dispatch({
                    type: "action-single-step",
                    id: controller.currentActionID,
                });
                stepped = true;
            }
        }
    }
    catch {
    }
    finally {
        if (!stepped) {
            // should be paused due to cancellation or tickCountRemaining ≤ 0
            // this is effectively a break
            cancelActionCapture(controller);
            callbackIfCancel();
        }
    }
}
async function captureAction(controller) {
    return new Promise((resolve) => {
        Calc.observeEvent("change.dsm-action-change", () => {
            // check in case there is more than one update before the screenshot finishes
            if (controller.actionCaptureState === "waiting-for-update") {
                captureActionFrame(controller, resolve);
            }
        });
        captureActionFrame(controller, resolve);
    });
}
async function capture(controller) {
    controller.isCapturing = true;
    controller.updateView();
    if (controller.captureMethod !== "once") {
        if (Calc.controller.getTickerPlaying?.()) {
            Calc.controller.dispatch({ type: "toggle-ticker" });
        }
        Calc.controller.stopAllSliders();
    }
    if (controller.captureMethod === "action") {
        await captureAction(controller);
    }
    else {
        if (controller.captureMethod === "once") {
            try {
                await captureAndApplyFrame(controller);
            }
            catch {
                // math bounds mismatch, irrelevant
            }
        }
        else if (controller.captureMethod === "slider") {
            await captureSlider(controller);
        }
    }
    controller.isCapturing = false;
    controller.updateView();
    // no need to retain a pending cancellation, if any; capture is already finished
    controller.captureCancelled = false;
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/plugins/video-creator/components/CaptureMethod.css
var CaptureMethod = __webpack_require__(1223);
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/CaptureMethod.css

            

var CaptureMethod_options = {};

CaptureMethod_options.insert = "head";
CaptureMethod_options.singleton = false;

var CaptureMethod_update = injectStylesIntoStyleTag_default()(CaptureMethod/* default */.Z, CaptureMethod_options);



/* harmony default export */ var components_CaptureMethod = (CaptureMethod/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/CaptureMethod.tsx




const captureMethodNames = ["once", "slider", "action"];
class SelectCapture extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
    }
    template() {
        return (src_DCGView.jsx("div", null,
            src_DCGView.jsx(SegmentedControl_SegmentedControl, { class: "dsm-vc-select-capture-method", names: () => this.controller.hasAction()
                    ? captureMethodNames
                    : captureMethodNames.slice(0, -1), selectedIndex: () => this.getSelectedCaptureMethodIndex(), setSelectedIndex: (i) => this.setSelectedCaptureMethodIndex(i), allowChange: () => !this.controller.isCapturing }),
            src_DCGView.jsx(Switch, { key: () => this.getSelectedCaptureMethod() }, () => ({
                slider: () => (src_DCGView.jsx("div", null,
                    src_DCGView.jsx("div", { class: "dsm-vc-slider-settings" },
                        src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "slider variable", onUserChangedLatex: (v) => this.controller.setSliderSetting("variable", v), hasError: () => !this.controller.isSliderSettingValid("variable"), latex: () => this.controller.sliderSettings.variable, isFocused: () => this.controller.isFocused("capture-slider-var"), onFocusedChanged: (b) => this.controller.updateFocus("capture-slider-var", b) }),
                        src_DCGView.jsx(StaticMathquillView, { latex: "=" }),
                        src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "slider min", onUserChangedLatex: (v) => this.controller.setSliderSetting("minLatex", v), hasError: () => !this.controller.isSliderSettingValid("minLatex"), latex: () => this.controller.sliderSettings.minLatex, isFocused: () => this.controller.isFocused("capture-slider-min"), onFocusedChanged: (b) => this.controller.updateFocus("capture-slider-min", b) }),
                        "to",
                        src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "slider max", onUserChangedLatex: (v) => this.controller.setSliderSetting("maxLatex", v), hasError: () => !this.controller.isSliderSettingValid("maxLatex"), latex: () => this.controller.sliderSettings.maxLatex, isFocused: () => this.controller.isFocused("capture-slider-max"), onFocusedChanged: (b) => this.controller.updateFocus("capture-slider-max", b) }),
                        ", step",
                        src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "slider step", onUserChangedLatex: (v) => this.controller.setSliderSetting("stepLatex", v), hasError: () => !this.controller.isSliderSettingValid("stepLatex"), latex: () => this.controller.sliderSettings.stepLatex, isFocused: () => this.controller.isFocused("capture-slider-step"), onFocusedChanged: (b) => this.controller.updateFocus("capture-slider-step", b) })))),
                action: () => (src_DCGView.jsx("div", null,
                    src_DCGView.jsx(If, { predicate: () => this.controller.getActions().length > 1 }, () => (src_DCGView.jsx("div", { class: "dsm-vc-action-navigate-container" },
                        src_DCGView.jsx(Button_Button, { color: "green", onTap: () => this.controller.addToActionIndex(-1), disabled: () => this.controller.isCapturing }, "Prev"),
                        src_DCGView.jsx(Button_Button, { color: "green", onTap: () => this.controller.addToActionIndex(+1), disabled: () => this.controller.isCapturing }, "Next")))),
                    src_DCGView.jsx(For, { each: 
                        // using an <If> here doesn't work becaus it doesn't update the StaticMathQuillView
                        () => this.controller.getCurrentAction()?.latex !== undefined
                            ? [this.controller.getCurrentAction()]
                            : [], key: (action) => action.id },
                        src_DCGView.jsx("div", { class: "dsm-vc-current-action" }, () => (src_DCGView.jsx(StaticMathquillView, { latex: () => this.controller.getCurrentAction()?.latex })))))),
                once: () => null,
            }[this.getSelectedCaptureMethod()]())),
            src_DCGView.jsx("div", { class: "dsm-vc-capture-size" },
                "Size:",
                src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "capture width", onUserChangedLatex: (latex) => this.controller.setCaptureWidthLatex(latex), latex: () => this.controller.captureWidthLatex, hasError: () => !this.controller.isCaptureWidthValid(), onFocusedChanged: (b) => this.controller.updateFocus("capture-width", b), isFocused: () => this.controller.isFocused("capture-width") }),
                "\u00D7",
                src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "capture height", onUserChangedLatex: (latex) => this.controller.setCaptureHeightLatex(latex), latex: () => this.controller.captureHeightLatex, hasError: () => !this.controller.isCaptureHeightValid(), onFocusedChanged: (b) => this.controller.updateFocus("capture-height", b), isFocused: () => this.controller.isFocused("capture-height") }),
                src_DCGView.jsx(If, { predicate: () => this.controller.isDefaultCaptureSizeDifferent() }, () => (src_DCGView.jsx(Button_Button, { color: "light-gray", onTap: () => this.controller.applyDefaultCaptureSize() },
                    src_DCGView.jsx("i", { class: "dcg-icon-magic" }))))),
            src_DCGView.jsx(If, { predicate: () => Math.abs(this.controller._getTargetPixelRatio() - 1) > 0.001 }, () => (src_DCGView.jsx("div", { class: "dsm-vc-pixel-ratio" },
                src_DCGView.jsx(Checkbox, { checked: () => this.controller.samePixelRatio, onChange: (checked) => this.controller.setSamePixelRatio(checked), ariaLabel: "Target same pixel ratio", green: true },
                    src_DCGView.jsx(Tooltip, { tooltip: "Adjusts scaling of line width, point size, label size, etc.", gravity: "n" },
                        src_DCGView.jsx("div", { class: "dsm-vc-pixel-ratio-inner" }, "Target same pixel ratio")))))),
            src_DCGView.jsx("div", { class: "dsm-vc-capture" },
                IfElse(() => !this.controller.isCapturing ||
                    this.controller.captureMethod === "once", {
                    true: () => (src_DCGView.jsx(Button_Button, { color: "green", class: "dsm-vc-capture-frame-button", disabled: () => this.controller.isCapturing ||
                            this.controller.isExporting ||
                            !this.controller.areCaptureSettingsValid(), onTap: () => this.controller.capture() }, "Capture")),
                    false: () => (src_DCGView.jsx(Button_Button, { color: "blue", class: "dsm-vc-cancel-capture-button", onTap: () => cancelCapture(this.controller) }, "Cancel")),
                }),
                src_DCGView.jsx(If, { predicate: () => this.getSelectedCaptureMethod() === "action" }, () => (src_DCGView.jsx("div", { class: "dsm-vc-end-condition-settings" },
                    "Step count:",
                    src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "ticker while", onUserChangedLatex: (v) => this.controller.setTickCountLatex(v), hasError: () => !this.controller.isTickCountValid(), latex: () => this.controller.tickCountLatex, isFocused: () => this.controller.isFocused("capture-tick-count"), onFocusedChanged: (b) => this.controller.updateFocus("capture-tick-count", b) })))))));
    }
    getSelectedCaptureMethod() {
        return this.controller.captureMethod === "action" &&
            !this.controller.hasAction()
            ? "once"
            : this.controller.captureMethod;
    }
    getSelectedCaptureMethodIndex() {
        return captureMethodNames.indexOf(this.getSelectedCaptureMethod());
    }
    setSelectedCaptureMethodIndex(i) {
        const name = captureMethodNames[i];
        if (name !== undefined) {
            this.controller.setCaptureMethod(name);
        }
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/video-creator/components/PreviewCarousel.less
var PreviewCarousel = __webpack_require__(2505);
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/PreviewCarousel.less

            

var PreviewCarousel_options = {};

PreviewCarousel_options.insert = "head";
PreviewCarousel_options.singleton = false;

var PreviewCarousel_update = injectStylesIntoStyleTag_default()(PreviewCarousel/* default */.Z, PreviewCarousel_options);



/* harmony default export */ var components_PreviewCarousel = (PreviewCarousel/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/PreviewCarousel.tsx


class PreviewCarousel_PreviewCarousel extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
    }
    template() {
        return (src_DCGView.jsx("div", { class: "dsm-vc-preview-carousel" },
            src_DCGView.jsx("div", { class: () => ({
                    "dsm-vc-preview-prev-frame": true,
                    "dsm-vc-preview-wrapped-frame": this.getFrameIndex(-1) > this.getFrameIndex(0),
                }), onTap: () => this.controller.addToPreviewIndex(-1) },
                src_DCGView.jsx("img", { src: () => this.getFrame(-1), draggable: false }),
                src_DCGView.jsx("div", { class: "dsm-vc-preview-index" }, () => this.getFrameIndex(-1) + 1)),
            src_DCGView.jsx("div", { class: () => ({
                    "dsm-vc-preview-next-frame": true,
                    "dsm-vc-preview-wrapped-frame": this.getFrameIndex(1) < this.getFrameIndex(0),
                }), onTap: () => this.controller.addToPreviewIndex(1) },
                src_DCGView.jsx("img", { src: () => this.getFrame(1), draggable: false }),
                src_DCGView.jsx("div", { class: "dsm-vc-preview-index" }, () => this.getFrameIndex(1) + 1)),
            src_DCGView.jsx("div", { class: "dsm-vc-preview-current-frame", onTap: () => this.controller.isPlayPreviewExpanded
                    ? this.controller.togglePlayingPreview()
                    : this.controller.togglePreviewExpanded() },
                src_DCGView.jsx("img", { src: () => this.getFrame(0), draggable: false }),
                src_DCGView.jsx(If, { predicate: () => !this.controller.isPlayPreviewExpanded }, () => (src_DCGView.jsx("div", { class: "dsm-vc-preview-expand", onTap: (e) => {
                        if (e.target &&
                            e.target.classList.contains("dsm-vc-preview-expand")) {
                            this.controller.togglePreviewExpanded();
                            e.stopPropagation();
                        }
                    } },
                    src_DCGView.jsx("i", { class: "dcg-icon-zoom-fit" })))),
                src_DCGView.jsx("div", { class: "dsm-vc-remove-frame", onTap: (e) => {
                        this.controller.removeSelectedFrame();
                        e.stopPropagation();
                    } },
                    src_DCGView.jsx("i", { class: "dcg-icon-delete" })),
                src_DCGView.jsx("div", { class: "dsm-vc-preview-index" }, () => `${this.getFrameIndex(0) + 1} / ${this.controller.frames.length}`),
                src_DCGView.jsx(If, { predicate: () => this.controller.frames.length > 1 }, () => (src_DCGView.jsx("div", { class: "dsm-vc-preview-play-pause", onTap: (e) => {
                        this.controller.togglePlayingPreview();
                        e.stopPropagation();
                    } },
                    src_DCGView.jsx("i", { class: () => ({
                            "dcg-icon-play": !this.controller.isPlayingPreview,
                            "dcg-icon-pause": this.controller.isPlayingPreview,
                        }) })))))));
    }
    getFrameIndex(dx) {
        const L = this.controller.frames.length;
        return (((this.controller.previewIndex + dx) % L) + L) % L;
    }
    getFrame(dx) {
        return this.controller.frames[this.getFrameIndex(dx)];
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/video-creator/components/LoadingPie.less
var LoadingPie = __webpack_require__(6392);
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/LoadingPie.less

            

var LoadingPie_options = {};

LoadingPie_options.insert = "head";
LoadingPie_options.singleton = false;

var LoadingPie_update = injectStylesIntoStyleTag_default()(LoadingPie/* default */.Z, LoadingPie_options);



/* harmony default export */ var components_LoadingPie = (LoadingPie/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/LoadingPie.tsx


class LoadingPie_LoadingPie extends src_DCGView.Class {
    template() {
        return (src_DCGView.jsx("div", { class: "dsm-vc-pie-container" },
            src_DCGView.jsx("div", { class: () => ({
                    "dsm-vc-centered-pie": true,
                    "dsm-vc-pending": this.props.isPending(),
                }) },
                src_DCGView.jsx("div", { class: "dsm-vc-base-circle" }),
                src_DCGView.jsx("div", { onMount: this.setSVG.bind(this), didUpdate: this.setSVG.bind(this) }))));
    }
    setSVG(e) {
        const progress = this.props.progress();
        // similar to React's dangerouslySetInnerHTML
        e.innerHTML =
            0 <= progress && progress <= 1
                ? `<svg class='dsm-vc-pie-overlay' viewBox='-1 -1 2 2'>
          <path d='${this.getPiePath()}' />
        </svg>`
                : "";
    }
    getPiePath() {
        const progress = this.props.progress();
        const largeArcFlag = progress >= 0.5 ? "1" : "0";
        // multiply by (1-ε) to make it look like a circle at progress=1
        const angle = 0.9999999 * progress * 2 * Math.PI;
        return [
            "M",
            0,
            0,
            "L",
            0,
            -1,
            "A",
            1,
            1,
            0,
            largeArcFlag,
            1,
            Math.sin(angle),
            -Math.cos(angle),
            "Z",
        ].join(" ");
    }
}

// EXTERNAL MODULE: ./node_modules/@ffmpeg/ffmpeg/src/index.js
var src = __webpack_require__(5045);
;// CONCATENATED MODULE: ./src/plugins/video-creator/backend/export.ts

let ffmpeg = null;
async function exportAll(ffmpeg, fileType, fps) {
    const outFilename = "out." + fileType;
    const moreFlags = {
        mp4: ["-vcodec", "libx264"],
        webm: ["-vcodec", "libvpx-vp9", "-quality", "realtime", "-speed", "8"],
        // generate fresh palette on every frame (higher quality)
        // https://superuser.com/a/1239082
        gif: ["-lavfi", "palettegen=stats_mode=diff[pal],[0:v][pal]paletteuse"],
        apng: ["-plays", "0", "-f", "apng"],
    }[fileType];
    await ffmpeg.run("-r", fps.toString(), "-pattern_type", "glob", "-i", "*.png", ...moreFlags, outFilename);
    return outFilename;
}
async function cancelExport(controller) {
    try {
        // ffmpeg.exit() always throws an error `exit(1)`,
        // which is reasonable behavior because ffmpeg would throw an error when sigkilled
        ffmpeg?.exit();
    }
    catch {
        ffmpeg = null;
        await initFFmpeg(controller);
        controller.isExporting = false;
        controller.updateView();
    }
}
async function initFFmpeg(controller) {
    if (ffmpeg === null) {
        ffmpeg = (0,src.createFFmpeg)({
            log: false,
            corePath: "https://unpkg.com/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js",
        });
        ffmpeg.setLogger(({ type, message }) => {
            if (type === "fferr") {
                const match = message.match(/frame=\s*(?<frame>\d+)/);
                if (match === null) {
                    return;
                }
                else {
                    const frame = match.groups.frame;
                    let denom = controller.frames.length - 1;
                    if (denom === 0)
                        denom = 1;
                    const ratio = parseInt(frame) / denom;
                    controller.setExportProgress(ratio);
                }
            }
        });
        await ffmpeg.load();
    }
    return ffmpeg;
}
async function exportFrames(controller) {
    controller.isExporting = true;
    controller.setExportProgress(-1);
    controller.updateView();
    const ffmpeg = await initFFmpeg(controller);
    const filenames = [];
    const len = (controller.frames.length - 1).toString().length;
    controller.frames.forEach(async (frame, i) => {
        const raw = i.toString();
        // glob orders lexicographically, but we want numerically
        const padded = "0".repeat(len - raw.length) + raw;
        const filename = `desmos.${padded}.png`;
        // filenames may be pushed out of order because async, but doesn't matter
        filenames.push(filename);
        if (ffmpeg !== null) {
            ffmpeg.FS("writeFile", filename, await (0,src.fetchFile)(frame));
        }
    });
    const outFilename = await exportAll(ffmpeg, controller.fileType, controller.getFPSNumber());
    const data = ffmpeg.FS("readFile", outFilename);
    for (const filename of filenames) {
        ffmpeg.FS("unlink", filename);
    }
    ffmpeg.FS("unlink", outFilename);
    const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/mp4" }));
    let humanOutFilename = controller.outfileName;
    const ext = controller.fileType === "apng" ? "png" : controller.fileType;
    if (!humanOutFilename.endsWith("." + ext)) {
        humanOutFilename += "." + ext;
    }
    download(url, humanOutFilename);
    controller.isExporting = false;
    controller.updateView();
}
function download(url, filename) {
    // https://gist.github.com/SlimRunner/3b0a7571f04d3a03bff6dbd9de6ad729#file-desmovie-user-js-L325
    // no point supporting anything besides Chrome (no SharedArrayBuffer support)
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/video-creator/components/MainPopup.less
var MainPopup = __webpack_require__(735);
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/MainPopup.less

            

var MainPopup_options = {};

MainPopup_options.insert = "head";
MainPopup_options.singleton = false;

var MainPopup_update = injectStylesIntoStyleTag_default()(MainPopup/* default */.Z, MainPopup_options);



/* harmony default export */ var components_MainPopup = (MainPopup/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/video-creator/components/MainPopup.tsx






const fileTypeNames = ["gif", "mp4", "webm", "apng"];
function MainPopupFunc(videoCreatorController) {
    return src_DCGView.jsx(MainPopup_MainPopup, { controller: videoCreatorController });
}
class MainPopup_MainPopup extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
        this.controller.tryInitFFmpeg();
    }
    template() {
        return IfElse(() => this.controller.ffmpegLoaded, {
            true: () => this.templateFFmpegLoaded(),
            false: () => (src_DCGView.jsx("div", { class: "dcg-popover-interior" },
                src_DCGView.jsx("p", null, "FFmpeg loading..."),
                src_DCGView.jsx("p", { class: "dsm-delayed-reveal" }, "If this doesn't work in the next few seconds, try reloading the page or reporting this bug to DesModder devs."))),
        });
    }
    templateFFmpegLoaded() {
        return IfElse(() => this.controller.isExporting, {
            false: () => this.templateNormal(),
            true: () => (src_DCGView.jsx("div", { class: "dcg-popover-interior" },
                src_DCGView.jsx("div", { class: "dsm-vc-export-in-progress" },
                    "Exporting ...",
                    src_DCGView.jsx(LoadingPie_LoadingPie, { progress: () => this.controller.exportProgress, isPending: () => this.controller.exportProgress < 0 ||
                            this.controller.exportProgress > 0.99 })),
                src_DCGView.jsx("div", { class: "dsm-vc-cancel-export-button" },
                    src_DCGView.jsx(Button_Button, { color: "blue", onTap: () => cancelExport(this.controller) }, "Cancel")))),
        });
    }
    templateNormal() {
        return (src_DCGView.jsx("div", { class: "dcg-popover-interior" },
            src_DCGView.jsx("div", { class: "dsm-vc-capture-menu" },
                src_DCGView.jsx("div", { class: "dcg-group-title" }, "Capture"),
                src_DCGView.jsx(SelectCapture, { controller: this.controller })),
            src_DCGView.jsx(If, { predicate: () => this.controller.frames.length > 0 }, () => (src_DCGView.jsx("div", { class: "dsm-vc-preview-menu" },
                src_DCGView.jsx("div", { class: "dcg-group-title dsm-vc-delete-all-row" },
                    "Preview",
                    src_DCGView.jsx(Tooltip, { tooltip: "Delete all", gravity: "n" },
                        src_DCGView.jsx(Button_Button, { color: "red", onTap: () => this.controller.deleteAll(), class: "dsm-vc-delete-all-button" },
                            src_DCGView.jsx("i", { class: "dcg-icon-remove" })))),
                src_DCGView.jsx("div", { class: () => ({
                        "dsm-vc-preview-outer": true,
                        "dsm-vc-preview-expanded": this.controller.isPlayPreviewExpanded,
                    }), onTapEnd: (e) => this.controller.isPlayPreviewExpanded &&
                        this.eventShouldCloseExpanded(e) &&
                        this.controller.togglePreviewExpanded() },
                    src_DCGView.jsx("div", { class: "dsm-vc-preview-inner" },
                        src_DCGView.jsx(PreviewCarousel_PreviewCarousel, { controller: this.controller }),
                        src_DCGView.jsx(If, { predicate: () => this.controller.isPlayPreviewExpanded }, () => (src_DCGView.jsx("div", { class: "dsm-vc-exit-expanded", onTap: () => this.controller.togglePreviewExpanded() },
                            src_DCGView.jsx("i", { class: "dcg-icon-remove" }))))))))),
            src_DCGView.jsx(If, { predicate: () => this.controller.frames.length > 0 }, () => (src_DCGView.jsx("div", { class: "dsm-vc-export-menu" },
                src_DCGView.jsx("div", { class: "dcg-group-title" }, "Export"),
                src_DCGView.jsx("div", { class: "dsm-vc-select-export-type" },
                    src_DCGView.jsx(SegmentedControl_SegmentedControl, { names: fileTypeNames, selectedIndex: () => this.getSelectedFileTypeIndex(), setSelectedIndex: (i) => this.setSelectedFileTypeIndex(i) })),
                src_DCGView.jsx(Input, { class: "dsm-vc-outfile-name", value: () => this.controller.getOutfileName(), onInput: (s) => this.controller.setOutfileName(s), required: () => true, placeholder: () => "set a filename", 
                    // Avoid red squiggles throughout filename
                    spellcheck: () => false }),
                src_DCGView.jsx("div", { class: "dsm-vc-export" },
                    src_DCGView.jsx(Button_Button, { color: "green", class: "dsm-vc-export-frames-button", onTap: () => this.controller.exportFrames(), disabled: () => this.controller.frames.length === 0 ||
                            this.controller.isCapturing ||
                            this.controller.isExporting ||
                            !this.controller.isFPSValid() },
                        "Export as ",
                        () => this.controller.fileType),
                    src_DCGView.jsx("div", { class: "dsm-vc-fps-settings" },
                        "FPS:",
                        src_DCGView.jsx(SmallMathQuillInput, { ariaLabel: "fps", onUserChangedLatex: (s) => this.controller.setFPSLatex(s), hasError: () => !this.controller.isFPSValid(), latex: () => this.controller.fpsLatex, isFocused: () => this.controller.isFocused("export-fps"), onFocusedChanged: (b) => this.controller.updateFocus("export-fps", b) }))))))));
    }
    getSelectedFileTypeIndex() {
        return fileTypeNames.indexOf(this.controller.fileType);
    }
    setSelectedFileTypeIndex(i) {
        const name = fileTypeNames[i];
        if (name !== undefined) {
            this.controller.setOutputFiletype(name);
        }
    }
    eventShouldCloseExpanded(e) {
        const el = jquery(e.target);
        return !el.closest(".dsm-vc-preview-inner").length;
    }
}

;// CONCATENATED MODULE: ./src/plugins/video-creator/View.ts



function initView() {
    script_controller.addPillboxButton({
        id: "dsm-vc-menu",
        tooltip: "Video Creator Menu",
        iconClass: "dcg-icon-film",
        popup: () => MainPopupFunc(video_creator_controller),
    });
    jquery(document).on("keydown.expanded-menu-view", (e) => {
        if (keys.lookup(e) === "Esc" && video_creator_controller.isPlayPreviewExpanded) {
            e.stopImmediatePropagation();
            video_creator_controller.togglePreviewExpanded();
        }
    });
}
function destroyView() {
    script_controller.removePillboxButton("dsm-vc-menu");
    jquery(document).off(".expanded-menu-view");
}
const captureFrameID = "dsm-vc-capture-frame";
function percentage(x) {
    return 100 * x + "%";
}
function applyCaptureFrame() {
    let frame = document.getElementById(captureFrameID);
    if (video_creator_controller.focusedMQ === "capture-height" ||
        video_creator_controller.focusedMQ === "capture-width") {
        if (frame === null) {
            frame = document.createElement("div");
            frame.id = captureFrameID;
            frame.style.outline = "9999px solid rgba(0, 0, 0, 0.6)";
            frame.style.position = "absolute";
            frame.style.boxShadow = "inset 0 0 5px 0px rgba(255,255,255,0.8)";
            const canvas = document.querySelector("canvas.dcg-graph-inner");
            canvas?.parentNode?.appendChild(frame);
        }
        const pixelBounds = Calc.graphpaperBounds.pixelCoordinates;
        const ratio = video_creator_controller.getCaptureHeightNumber() /
            video_creator_controller.getCaptureWidthNumber() /
            (pixelBounds.height / pixelBounds.width);
        let width = 1;
        let height = 1;
        if (ratio > 1) {
            width = 1 / ratio;
        }
        else {
            height = ratio;
        }
        frame.style.width = percentage(width);
        frame.style.left = percentage((1 - width) / 2);
        frame.style.height = percentage(height);
        frame.style.top = percentage((1 - height) / 2);
    }
    else {
        if (frame !== null) {
            frame.parentNode?.removeChild(frame);
        }
    }
}
function updateView() {
    applyCaptureFrame();
    script_controller.updateMenuView();
}

;// CONCATENATED MODULE: ./src/plugins/video-creator/Controller.ts





class video_creator_Controller_Controller {
    constructor() {
        this.ffmpegLoaded = false;
        this.frames = [];
        this.isCapturing = false;
        this.captureCancelled = false;
        this.fpsLatex = "30";
        this.fileType = "mp4";
        this.outfileName = "DesModder_Video_Creator";
        this.focusedMQ = "none";
        // ** export status
        this.isExporting = false;
        // -1 while pending/waiting
        // 0 to 1 during encoding
        this.exportProgress = -1;
        // ** capture methods
        this.captureMethod = "once";
        this.sliderSettings = {
            variable: "a",
            minLatex: "0",
            maxLatex: "10",
            stepLatex: "1",
        };
        this.actionCaptureState = "none";
        this.currentActionID = null;
        this.tickCountLatex = "10";
        // ** capture sizing
        this.captureHeightLatex = "";
        this.captureWidthLatex = "";
        this.samePixelRatio = false;
        // ** play preview
        this.previewIndex = 0;
        this.isPlayingPreview = false;
        this.playPreviewTimeout = null;
        this.isPlayPreviewExpanded = false;
        Calc.observe("graphpaperBounds", () => this.graphpaperBoundsChanged());
        this._applyDefaultCaptureSize();
    }
    graphpaperBoundsChanged() {
        this.updateView();
    }
    updateView() {
        updateView();
    }
    tryInitFFmpeg() {
        initFFmpeg(this).then(() => {
            this.ffmpegLoaded = true;
            this.updateView();
        });
    }
    deleteAll() {
        this.frames = [];
        this.updateView();
    }
    async exportFrames() {
        if (!this.isExporting) {
            await exportFrames(this);
        }
    }
    setExportProgress(ratio) {
        this.exportProgress = ratio;
        this.updateView();
    }
    isFPSValid() {
        return isValidNumber(this.fpsLatex);
    }
    setFPSLatex(latex) {
        this.fpsLatex = latex;
        // advancing here resets the timeout
        // in case someone uses a low fps like 0.0001
        this.advancePlayPreviewFrame(false);
        this.updateView();
    }
    getFPSNumber() {
        return EvaluateSingleExpression(this.fpsLatex);
    }
    setOutputFiletype(type) {
        this.fileType = type;
        this.updateView();
    }
    setOutfileName(name) {
        this.outfileName = name;
    }
    getOutfileName() {
        return this.outfileName;
    }
    setCaptureMethod(method) {
        this.captureMethod = method;
        this.updateView();
    }
    isCaptureWidthValid() {
        return isValidLength(this.captureWidthLatex);
    }
    setCaptureWidthLatex(latex) {
        this.captureWidthLatex = latex;
        this.updateView();
    }
    isCaptureHeightValid() {
        return isValidLength(this.captureHeightLatex);
    }
    _applyDefaultCaptureSize() {
        const size = Calc.graphpaperBounds.pixelCoordinates;
        this.captureWidthLatex = size.width.toFixed(0);
        this.captureHeightLatex = size.height.toFixed(0);
    }
    applyDefaultCaptureSize() {
        this._applyDefaultCaptureSize();
        this.updateView();
    }
    isDefaultCaptureSizeDifferent() {
        const size = Calc.graphpaperBounds.pixelCoordinates;
        return (this.captureWidthLatex !== size.width.toFixed(0) ||
            this.captureHeightLatex !== size.height.toFixed(0));
    }
    setCaptureHeightLatex(latex) {
        this.captureHeightLatex = latex;
        this.updateView();
    }
    getCaptureWidthNumber() {
        return EvaluateSingleExpression(this.captureWidthLatex);
    }
    getCaptureHeightNumber() {
        return EvaluateSingleExpression(this.captureHeightLatex);
    }
    setSamePixelRatio(samePixelRatio) {
        this.samePixelRatio = samePixelRatio;
        this.updateView();
    }
    _getTargetPixelRatio() {
        return (this.getCaptureWidthNumber() /
            Calc.graphpaperBounds.pixelCoordinates.width);
    }
    getTargetPixelRatio() {
        return this.samePixelRatio ? 1 : this._getTargetPixelRatio();
    }
    setSliderSetting(key, value) {
        this.sliderSettings[key] = value;
        this.updateView();
    }
    setTickCountLatex(value) {
        this.tickCountLatex = value;
        this.updateView();
    }
    getMatchingSlider() {
        const regex = new RegExp(`^(\\?\s)*${escapeRegex(this.sliderSettings.variable)}(\\?\s)*=`);
        return Calc.getState().expressions.list.find((e) => e.type === "expression" &&
            typeof e.latex === "string" &&
            regex.test(e.latex));
    }
    isSliderSettingValid(key) {
        if (key === "variable") {
            return this.getMatchingSlider() !== undefined;
        }
        else {
            return isValidNumber(this.sliderSettings[key]);
        }
    }
    isTickCountValid() {
        return (isValidNumber(this.tickCountLatex) &&
            EvaluateSingleExpression(this.tickCountLatex) > 0);
    }
    async capture() {
        await capture(this);
    }
    areCaptureSettingsValid() {
        if (!this.isCaptureWidthValid() || !this.isCaptureHeightValid()) {
            return false;
        }
        if (this.captureMethod === "once") {
            return true;
        }
        else if (this.captureMethod === "slider") {
            return (this.isSliderSettingValid("variable") &&
                this.isSliderSettingValid("minLatex") &&
                this.isSliderSettingValid("maxLatex") &&
                this.isSliderSettingValid("stepLatex"));
        }
        else if (this.captureMethod === "action") {
            return this.isTickCountValid();
        }
    }
    getActions() {
        return Calc.controller.getAllItemModels()
            .filter((e) => e.type === "expression" && e.formula?.action_value !== undefined);
    }
    hasAction() {
        return this.getActions().length > 0;
    }
    getCurrentAction() {
        const model = Calc.controller.getItemModel(this.currentActionID);
        if (model === undefined) {
            const action = this.getActions()[0];
            if (action !== undefined) {
                this.currentActionID = action.id;
            }
            return action;
        }
        else {
            return model;
        }
    }
    addToActionIndex(dx) {
        const actions = this.getActions();
        const currentActionIndex = actions.findIndex((e) => e.id === this.currentActionID);
        // add actions.length to handle (-1) % n = -1
        const action = actions[(currentActionIndex + actions.length + dx) % actions.length];
        if (action !== undefined) {
            this.currentActionID = action.id;
        }
        this.updateView();
    }
    addToPreviewIndex(dx) {
        if (this.frames.length > 0) {
            this.previewIndex += dx;
            this.previewIndex %= this.frames.length;
        }
        else {
            this.previewIndex = 0;
        }
        this.updateView();
    }
    advancePlayPreviewFrame(advance = true) {
        this.addToPreviewIndex(advance ? 1 : 0);
        const fps = this.getFPSNumber();
        if (this.isPlayingPreview) {
            if (this.playPreviewTimeout !== null) {
                window.clearTimeout(this.playPreviewTimeout);
            }
            this.playPreviewTimeout = window.setTimeout(() => {
                this.advancePlayPreviewFrame();
            }, 1000 / fps);
        }
    }
    togglePlayingPreview() {
        this.isPlayingPreview = !this.isPlayingPreview;
        if (this.frames.length <= 1) {
            this.isPlayingPreview = false;
        }
        this.updateView();
        if (this.isPlayingPreview) {
            this.advancePlayPreviewFrame();
        }
        else {
            if (this.playPreviewTimeout !== null) {
                clearInterval(this.playPreviewTimeout);
            }
        }
    }
    togglePreviewExpanded() {
        this.isPlayPreviewExpanded = !this.isPlayPreviewExpanded;
        if (this.isPlayPreviewExpanded) {
            jquery(document).on("keydown.dsm-vc-preview-expanded", (e) => {
                if (keys.lookup(e) === "Esc") {
                    this.togglePreviewExpanded();
                }
            });
        }
        else {
            jquery(document).off("keydown.dsm-vc-preview-expanded");
        }
        this.updateView();
    }
    removeSelectedFrame() {
        this.frames.splice(this.previewIndex, 1);
        if (this.previewIndex >= this.frames.length) {
            this.previewIndex = this.frames.length - 1;
        }
        if (this.frames.length === 0) {
            if (this.isPlayPreviewExpanded) {
                this.togglePreviewExpanded();
            }
        }
        if (this.frames.length <= 1 && this.isPlayingPreview) {
            this.togglePlayingPreview();
        }
        this.updateView();
    }
    updateFocus(location, isFocused) {
        if (isFocused) {
            this.focusedMQ = location;
        }
        else if (location === this.focusedMQ) {
            this.focusedMQ = "none";
        }
        this.updateView();
    }
    isFocused(location) {
        return this.focusedMQ === location;
    }
}

;// CONCATENATED MODULE: ./src/plugins/video-creator/index.ts


let video_creator_controller;
function video_creator_onEnable() {
    video_creator_controller = new video_creator_Controller_Controller();
    initView(); // async
    return video_creator_controller;
}
function video_creator_onDisable() {
    destroyView();
}
/* harmony default export */ var video_creator = ({
    id: "video-creator",
    name: "Video Creator",
    description: "Lets you export videos and GIFs of your graphs based on actions or sliders.",
    onEnable: video_creator_onEnable,
    onDisable: video_creator_onDisable,
    enabledByDefault: true,
});

;// CONCATENATED MODULE: ./src/plugins/builtin-settings/config.ts
const config_configList = [
    {
        key: "advancedStyling",
        name: "Advanced styling",
        description: "Enable label editing, show-on-hover, text outline, and one-quadrant grid",
        type: "boolean",
        default: true,
    },
    {
        key: "graphpaper",
        name: "Graphpaper",
        type: "boolean",
        default: true,
    },
    {
        key: "administerSecretFolders",
        name: "Create hidden folders",
        type: "boolean",
        default: false,
    },
    {
        key: "pointsOfInterest",
        name: "Show points of interest",
        description: "Intercepts, holes, intersections, etc.",
        type: "boolean",
        default: true,
    },
    {
        key: "trace",
        name: "Trace along curves",
        type: "boolean",
        default: true,
    },
    {
        key: "lockViewport",
        name: "Lock Viewport",
        type: "boolean",
        default: false,
    },
    {
        key: "expressions",
        name: "Show Expressions",
        type: "boolean",
        default: true,
    },
    {
        key: "zoomButtons",
        name: "Show Zoom Buttons",
        type: "boolean",
        default: true,
    },
    {
        key: "expressionsTopbar",
        name: "Show Expressions Top Bar",
        type: "boolean",
        default: true,
    },
    {
        key: "border",
        name: "Border",
        description: "Subtle border around the calculator",
        type: "boolean",
        default: false,
    },
    {
        key: "keypad",
        name: "Show keypad",
        type: "boolean",
        default: true,
    },
    {
        key: "qwertyKeyboard",
        name: "QWERTY Keyboard",
        type: "boolean",
        default: true,
    },
    // `as const` ensures that the key values can be used as types
    // instead of the type 'string'
];

;// CONCATENATED MODULE: ./src/plugins/builtin-settings/index.ts


const managedKeys = config_configList.map((e) => e.key);
let initialSettings = null;
function manageConfigChange(current, changes) {
    const proposedConfig = {
        ...current,
        ...changes,
    };
    const newChanges = {
        ...changes,
    };
    if (changes.zoomButtons) {
        if (false === proposedConfig.graphpaper) {
            newChanges.graphpaper = true;
        }
        if (proposedConfig.lockViewport) {
            newChanges.lockViewport = false;
        }
    }
    if (changes.lockViewport && proposedConfig.zoomButtons) {
        newChanges.zoomButtons = false;
    }
    if (false === changes.graphpaper && proposedConfig.zoomButtons) {
        newChanges.zoomButtons = false;
    }
    return newChanges;
}
function builtin_settings_onEnable(config) {
    initialSettings = { ...config };
    const queryParams = getQueryParams();
    for (const key of managedKeys) {
        initialSettings[key] = Calc.settings[key];
    }
    const queryConfig = {};
    for (const key of managedKeys) {
        if (queryParams[key]) {
            queryConfig[key] = true;
        }
        if (queryParams["no" + key]) {
            queryConfig[key] = false;
        }
    }
    const newChanges = manageConfigChange(config, queryConfig);
    Calc.updateSettings({
        ...config,
        ...newChanges,
    });
}
function builtin_settings_onDisable() {
    if (initialSettings !== null) {
        Calc.updateSettings(initialSettings);
    }
}
/* harmony default export */ var builtin_settings = ({
    id: "builtin-settings",
    name: "Calculator Settings",
    description: "Lets you toggle features built-in to Desmos including locking viewport, hiding keypad, and more." +
        " Most options apply only to your own browser and are ignored when you share graphs with others.",
    onEnable: builtin_settings_onEnable,
    onDisable: builtin_settings_onDisable,
    enabledByDefault: true,
    config: config_configList,
    onConfigChange(changes) {
        // called only when plugin is active
        Calc.updateSettings(changes);
    },
    manageConfigChange,
});

;// CONCATENATED MODULE: ./src/plugins/right-click-tray/backend.ts

// these are effectively private because they are not exported;
let showContextMenu = true;
let enabled = false;
// onEnable is automatically called when enabled by default
function backend_onEnable() {
    // prevent enabling it twice
    if (!enabled) {
        enabled = true;
        document.addEventListener("contextmenu", onContextMenu);
        window.addEventListener("mousedown", onMouseDown);
    }
}
function backend_onDisable() {
    // prevent disabling it twice
    if (enabled) {
        enabled = false;
        document.removeEventListener("contextmenu", onContextMenu);
        window.removeEventListener("mousedown", onMouseDown);
    }
}
function onContextMenu(e) {
    if (!showContextMenu) {
        showContextMenu = true;
        e.preventDefault();
    }
}
function onMouseDown(e) {
    if (e.button === 2) {
        if (e.target === null) {
            return;
        }
        // assume the target is an HTMLElement
        const target = e.target;
        let tag = target.tagName.toLowerCase();
        // determines if clicked target is an icon container
        let isIconContainer = (tagName, lvl, type) => {
            let container = seekParent(target, lvl);
            if (container === null)
                return false;
            return (tag === tagName &&
                "classList" in container &&
                container.classList.contains(`dcg-${type}-icon-container`));
        };
        // determines if container is part of an expression or image
        let hasLongHoldButton = (lvl) => {
            let wrapper = seekParent(target, lvl + 1);
            if (wrapper === null)
                return false;
            if (typeof wrapper.classList === "undefined")
                return false;
            return wrapper.classList.contains("dcg-expression-icon-container");
        };
        if (
        // hidden color bubble of expressions or images
        isIconContainer("span", 2, "expression") &&
            hasLongHoldButton(1)) {
            showContextMenu = false;
            jquery(seekParent(target, 1)).trigger("dcg-longhold");
        }
        else if (
        // shown color bubble of expressions
        isIconContainer("i", 3, "expression") &&
            hasLongHoldButton(2)) {
            showContextMenu = false;
            jquery(seekParent(target, 2)).trigger("dcg-longhold");
        }
        else if (
        // hidden color bubble of table columns
        isIconContainer("span", 2, "table")) {
            showContextMenu = false;
            jquery(seekParent(target, 1)).trigger("dcg-longhold");
        }
        else if (
        // shown color bubble of table columns
        isIconContainer("i", 3, "table")) {
            showContextMenu = false;
            jquery(seekParent(target, 2)).trigger("dcg-longhold");
        }
    }
}
function seekParent(src, level) {
    if (level <= 0)
        return src;
    for (var i = 0; i < level; ++i) {
        if (src != null) {
            src = src.parentElement;
        }
        else {
            return null;
        }
    }
    return src;
}

;// CONCATENATED MODULE: ./src/plugins/right-click-tray/index.ts

/* harmony default export */ var right_click_tray = ({
    id: "right-click-tray",
    name: "Right Click Tray",
    description: "Allows you to right click the settings bubble (style circle) to open the settings tray instead of having to hold left click.",
    onEnable: backend_onEnable,
    onDisable: backend_onDisable,
    enabledByDefault: true,
});

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/pin-expressions/pinExpressions.less
var pinExpressions = __webpack_require__(8769);
;// CONCATENATED MODULE: ./src/plugins/pin-expressions/pinExpressions.less

            

var pinExpressions_options = {};

pinExpressions_options.insert = "head";
pinExpressions_options.singleton = false;

var pinExpressions_update = injectStylesIntoStyleTag_default()(pinExpressions/* default */.Z, pinExpressions_options);



/* harmony default export */ var pin_expressions_pinExpressions = (pinExpressions/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/pin-expressions/index.ts


/* harmony default export */ var pin_expressions = ({
    id: "pin-expressions",
    name: "Pin Expressions",
    description: "Pin expressions from Edit List mode",
    // Controller handles enable/disable by changing the results of isPinned
    // (used in modified module definitions), but we need to update views
    onEnable: () => {
        Calc.controller.updateViews();
    },
    onDisable: () => {
        Calc.controller.updateViews();
    },
    enabledByDefault: true,
    /* Has module overrides */
});

;// CONCATENATED MODULE: ./src/plugins/shift-enter-newline/index.ts
/* harmony default export */ var shift_enter_newline = ({
    id: "shift-enter-newline",
    name: "Shift+Enter Newline",
    description: "Use Shift+Enter to type newlines in notes and image/folder titles.",
    // Still need to declare empty onEnable and onDisable to get the right UI
    onEnable: () => { },
    onDisable: () => { },
    alwaysEnabled: true,
    enabledByDefault: true,
    /* Has module overrides */
});

;// CONCATENATED MODULE: ./src/plugins/GLesmos/glesmosCanvas.ts
function glesmosError(msg) {
    throw `[GLesmos Error] ${msg}`;
}
function compileShader(gl, shaderCode, type) {
    let shader = gl.createShader(type);
    if (shader === null) {
        throw glesmosError("Invalid shader type");
    }
    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        let shaderInfoLog = gl.getShaderInfoLog(shader);
        throw glesmosError(`While compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:
      ${shaderInfoLog ?? ""}`);
    }
    return shader;
}
function buildShaderProgram(gl, vert, frag, id) {
    let shaderProgram = gl.createProgram();
    if (shaderProgram === null) {
        throw glesmosError("Unable to create shader program!");
        return;
    }
    let vertexShader = compileShader(gl, vert, gl.VERTEX_SHADER);
    let fragmentShader = compileShader(gl, frag, gl.FRAGMENT_SHADER);
    if (vertexShader && fragmentShader) {
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);
        return shaderProgram;
    }
    else {
        throw glesmosError("One or more shaders did not compile.");
    }
}
function setUniform(gl, program, uniformName, uniformType, uniformValue) {
    let uniformSetterKey = ("uniform" +
        uniformType);
    gl[uniformSetterKey](gl.getUniformLocation(program, uniformName), uniformValue);
}
const FULLSCREEN_QUAD = new Float32Array([
    -1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1,
]);
const VERTEX_SHADER = `

    attribute highp vec2 vertexPosition;

    varying vec2 texCoord;

    void main() {
        texCoord = vertexPosition * 0.5 + 0.5;
        gl_Position = vec4(vertexPosition, 0.0, 1.0);
    }
`;
const GLESMOS_FRAGMENT_SHADER = `
varying mediump vec2 texCoord;
precision highp float;

uniform vec2 corner;
uniform vec2 size;
uniform float NaN;
uniform float Infinity;

#define M_PI 3.1415926535897932384626433832795
#define M_E 2.71828182845904523536028747135266

//REPLACE_WITH_GLESMOS
vec4 outColor = vec4(0.0);
void glesmosMain(vec2 coords) {}
//REPLACE_WITH_GLESMOS_END

void main() {
    glesmosMain(texCoord * size + corner);
    gl_FragColor = outColor;
}

`;
function initGLesmosCanvas() {
    //================= INIT ELEMENTS =======================
    let c = document.createElement("canvas");
    let gl = c.getContext("webgl", {
        // Disable premultiplied alpha
        // Thanks to <https://stackoverflow.com/a/12290551/7481517>
        premultipliedAlpha: false,
    });
    //================= GRAPH BOUNDS ======================
    let cornerOfGraph = [-10, -6];
    let sizeOfGraph = [20, 12];
    //======================= RESIZING STUFF =======================
    let updateTransforms = (transforms) => {
        const w = transforms.pixelCoordinates.right;
        const h = transforms.pixelCoordinates.bottom;
        const p2m = transforms.pixelsToMath;
        c.width = w;
        c.height = h;
        gl.viewport(0, 0, c.width, c.height);
        cornerOfGraph = [p2m.tx, p2m.sy * h + p2m.ty];
        sizeOfGraph = [p2m.sx * w, -p2m.sy * h];
    };
    //============================ WEBGL STUFF ==========================
    let fullscreenQuadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);
    let glesmosShaderProgram;
    let setGLesmosShader = (shaderCode, id) => {
        const shaderResult = GLESMOS_FRAGMENT_SHADER.replace(/\/\/REPLACE_WITH_GLESMOS[\s\S]*\/\/REPLACE_WITH_GLESMOS_END/g, shaderCode);
        glesmosShaderProgram = buildShaderProgram(gl, VERTEX_SHADER, shaderResult, id);
    };
    setGLesmosShader(`vec4 outColor = vec4(0.0);
    void glesmosMain(vec2 coords) {}`, "Empty");
    let render = (id) => {
        if (glesmosShaderProgram) {
            gl.useProgram(glesmosShaderProgram);
            let vertexPositionAttribLocation = gl.getAttribLocation(glesmosShaderProgram, "vertexPosition");
            setUniform(gl, glesmosShaderProgram, "corner", "2fv", cornerOfGraph);
            setUniform(gl, glesmosShaderProgram, "size", "2fv", sizeOfGraph);
            setUniform(gl, glesmosShaderProgram, "NaN", "1f", NaN);
            setUniform(gl, glesmosShaderProgram, "Infinity", "1f", Infinity);
            gl.enableVertexAttribArray(vertexPositionAttribLocation);
            gl.vertexAttribPointer(vertexPositionAttribLocation, 2, gl.FLOAT, false, 8, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        else {
            throw glesmosError("Shader failed");
        }
    };
    render("Base");
    //================= CLEANUP =============
    let deleteCanvas = () => {
        c.parentElement?.removeChild(c);
    };
    //===================== CONSTRUCTED OBJECT ============
    return {
        element: c,
        glContext: gl,
        deleteCanvas,
        updateTransforms: updateTransforms,
        setGLesmosShader: setGLesmosShader,
        render: render,
    };
}

;// CONCATENATED MODULE: ./src/plugins/GLesmos/Controller.ts


class GLesmos_Controller_Controller {
    constructor() {
        this.canvas = null;
        this.canvas = initGLesmosCanvas();
    }
    deleteCanvas() {
        this.canvas?.deleteCanvas();
        this.canvas = null;
    }
    drawGlesmosSketchToCtx(compiledGL, ctx, transforms, id) {
        const compiledGLString = [
            compiledGL.deps.join("\n"),
            compiledGL.defs.join("\n"),
            // Non-premultiplied alpha:
            `vec4 mixColor(vec4 from, vec4 top) {
        float a = 1.0 - (1.0 - from.a) * (1.0 - top.a);
        return vec4((from.rgb * from.a * (1.0 - top.a) + top.rgb * top.a) / a, a);
      }`,
            "vec4 outColor = vec4(0.0);",
            "void glesmosMain(vec2 coords) {",
            "  float x = coords.x; float y = coords.y;",
            compiledGL.bodies.join("\n"),
            "}",
        ].join("\n");
        try {
            if (this.canvas?.element) {
                this.canvas.updateTransforms(transforms);
                this.canvas?.setGLesmosShader(compiledGLString, id);
                this.canvas?.render(id);
                ctx.drawImage(this.canvas?.element, 0, 0);
            }
        }
        catch (e) {
            const model = Calc.controller.getItemModel(id);
            if (model) {
                model.error = e;
            }
        }
    }
}

;// CONCATENATED MODULE: ./src/plugins/GLesmos/index.ts

let GLesmos_controller;
function GLesmos_onEnable() {
    GLesmos_controller = new GLesmos_Controller_Controller();
    return GLesmos_controller;
}
function GLesmos_onDisable() {
    GLesmos_controller.deleteCanvas();
}
/* harmony default export */ var GLesmos = ({
    id: "GLesmos",
    name: "GLesmos",
    description: "Render implicits on the GPU. Can cause the UI slow down or freeze in rare cases; reload the page if you have issues.",
    onEnable: GLesmos_onEnable,
    onDisable: GLesmos_onDisable,
    enabledByDefault: false,
});

;// CONCATENATED MODULE: ./src/plugins/hide-errors/index.ts
/* harmony default export */ var hide_errors = ({
    id: "hide-errors",
    name: "Hide Errors",
    description: "Click error triangles to fade them and hide suggested sliders.",
    // Still need to declare empty onEnable and onDisable to get the right UI
    onEnable: () => { },
    onDisable: () => { },
    alwaysEnabled: true,
    enabledByDefault: true,
    /* Has module overrides */
});

;// CONCATENATED MODULE: ./src/plugins/debug-mode/index.ts

/* harmony default export */ var debug_mode = ({
    id: "debug-mode",
    name: "Debug Mode",
    description: "Show expression IDs instead of indices",
    onEnable: () => {
        Calc.controller.updateViews();
    },
    onDisable: () => { },
    afterDisable: () => {
        Calc.controller.updateViews();
    },
    alwaysEnabled: false,
    enabledByDefault: false,
});

;// CONCATENATED MODULE: ./src/plugins/show-tips/index.ts

/* harmony default export */ var show_tips = ({
    id: "show-tips",
    name: "Show Tips",
    description: "Show tips at the bottom of the expressions list.",
    onEnable: () => {
        Calc.controller.updateViews();
    },
    onDisable: () => { },
    afterDisable: () => {
        Calc.controller.updateViews();
    },
    enabledByDefault: true,
    /* Has moduleOverride */
});

;// CONCATENATED MODULE: ./src/plugins/folder-tools/index.ts
/* harmony default export */ var folder_tools = ({
    id: "folder-tools",
    name: "Folder Tools",
    description: "Adds buttons in edit-list-mode to help manage folders.",
    // Still need to declare empty onEnable and onDisable to get the right UI
    onEnable: () => { },
    onDisable: () => { },
    alwaysEnabled: false,
    enabledByDefault: true,
    /* Has module overrides */
});

;// CONCATENATED MODULE: ./src/plugins/index.ts













// these plugins will be listed in list order in the menu
// place closer to the top: plugins that people are more likely to adjust
const _plugins = {
    [builtin_settings.id]: builtin_settings,
    [plugins_wolfram2desmos.id]: plugins_wolfram2desmos,
    [pin_expressions.id]: pin_expressions,
    [video_creator.id]: video_creator,
    [find_replace.id]: find_replace,
    [debug_mode.id]: debug_mode,
    [show_tips.id]: show_tips,
    [right_click_tray.id]: right_click_tray,
    [duplicate_hotkey.id]: duplicate_hotkey,
    [GLesmos.id]: GLesmos,
    [shift_enter_newline.id]: shift_enter_newline,
    [hide_errors.id]: hide_errors,
    [folder_tools.id]: folder_tools,
};
const pluginList = Object.values(_plugins);
const plugins = _plugins;

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/components/Menu.less
var Menu = __webpack_require__(9712);
;// CONCATENATED MODULE: ./src/components/Menu.less

            

var Menu_options = {};

Menu_options.insert = "head";
Menu_options.singleton = false;

var Menu_update = injectStylesIntoStyleTag_default()(Menu/* default */.Z, Menu_options);



/* harmony default export */ var components_Menu = (Menu/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/components/Menu.tsx




function MenuFunc(controller) {
    return src_DCGView.jsx(Menu_Menu, { controller: controller });
}
class Menu_Menu extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
    }
    template() {
        return (src_DCGView.jsx("div", { class: "dcg-popover-interior" },
            src_DCGView.jsx("div", { class: "dcg-group-title" }, "DesModder plugins"),
            this.controller.getPluginsList().map((plugin) => (src_DCGView.jsx("div", { class: "dcg-options-menu-section dsm-plugin-section", key: plugin.id },
                src_DCGView.jsx("div", { class: "dcg-options-menu-section-title dsm-plugin-title-bar" },
                    src_DCGView.jsx("div", { class: "dsm-plugin-header", onClick: () => this.controller.togglePluginExpanded(plugin.id) },
                        src_DCGView.jsx("div", { class: () => ({
                                "dsm-caret-container": true,
                                "dsm-caret-expanded": plugin.id === this.controller.expandedPlugin,
                            }) },
                            src_DCGView.jsx("i", { class: "dcg-icon-chevron-down" })),
                        src_DCGView.jsx("div", { class: "dsm-plugin-name" },
                            " ",
                            plugin.name,
                            " ")),
                    src_DCGView.jsx(Toggle_Toggle, { toggled: () => this.controller.isPluginEnabled(plugin.id), disabled: () => !this.controller.isPluginToggleable(plugin.id), onChange: () => this.controller.togglePlugin(plugin.id) })),
                src_DCGView.jsx(If, { predicate: () => plugin.id === this.controller.expandedPlugin }, () => (src_DCGView.jsx("div", { class: "dsm-plugin-info-body" },
                    src_DCGView.jsx("div", { class: "dsm-plugin-description" }, plugin.description),
                    this.getExpandedSettings()))))))));
    }
    getExpandedSettings() {
        if (this.controller.expandedPlugin === null)
            return null;
        const plugin = this.controller.getPlugin(this.controller.expandedPlugin);
        if (plugin === undefined)
            return null;
        const config = plugin.config;
        if (config !== undefined) {
            const pluginSettings = this.controller.pluginSettings[this.controller.expandedPlugin];
            if (pluginSettings === undefined)
                return null;
            return (src_DCGView.jsx("div", null, config.map((item) => (src_DCGView.jsx(Switch, { key: () => item.type }, () => ({
                boolean: () => (src_DCGView.jsx("div", { class: "dsm-settings-item dsm-settings-boolean" },
                    src_DCGView.jsx(Checkbox, { onChange: (checked) => this.controller.expandedPlugin &&
                            this.controller.setPluginSetting(this.controller.expandedPlugin, item.key, checked), checked: () => pluginSettings[item.key] ?? false, ariaLabel: () => item.key, green: true },
                        src_DCGView.jsx(Tooltip, { tooltip: item.description ?? "", gravity: "n" },
                            src_DCGView.jsx("div", { class: "dsm-settings-label" }, item.name))))),
            }[item.type]()))))));
        }
        else {
            // should never happen
            return null;
        }
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

;// CONCATENATED MODULE: ./src/main/metadata/migrations/migrate1to2.ts
function migrate1to2(state) {
    const stateOut = {
        version: 2,
        expressions: {},
    };
    for (let pinnedID of state.pinnedExpressions ?? []) {
        stateOut.expressions[pinnedID] = {
            pinned: true,
        };
    }
    return stateOut;
}

;// CONCATENATED MODULE: ./src/main/metadata/migrate.ts

function migrateToLatest(metadata) {
    if ("pinnedExpressions" in metadata) {
        /* Discriminate version 1 by using the presence of the pinnedExpressions
        property (it was the only property) */
        metadata = migrate1to2(metadata);
    }
    return metadata;
}

;// CONCATENATED MODULE: ./src/main/metadata/manage.ts


const List = desmosRequire("graphing-calc/models/list");
/*
This file manages the metadata expressions. These are stored on the graph state as expressions and consist of:

{
  type: "folder",
  id: "dsm-metadata-folder",
  secret: true,
  title: "DesModder Metadata"
}

{
  type: "text",
  id: "dsm-metadata",
  folderId: "dsm-metadata-folder",
  text: "{\n  \"key\": value\n}"
}

The text content of dsm-metadata is in JSON format
*/
const ID_METADATA = "dsm-metadata";
const ID_METADATA_FOLDER = "dsm-metadata-folder";
function getMetadataExpr() {
    return Calc.controller.getItemModel(ID_METADATA);
}
function getMetadata() {
    const expr = getMetadataExpr();
    if (expr === undefined)
        return getBlankMetadata();
    if (expr.type === "text" && expr.text !== undefined) {
        const parsed = JSON.parse(expr.text);
        return migrateToLatest(parsed);
    }
    console.warn("Invalid dsm-metadata. Ignoring");
    return getBlankMetadata();
}
function addItemToEnd(state) {
    Calc.controller._addItemToEndFromAPI(Calc.controller.createItemModel(state));
}
function setMetadata(metadata) {
    cleanMetadata(metadata);
    List.removeItemById(Calc.controller.listModel, ID_METADATA);
    List.removeItemById(Calc.controller.listModel, ID_METADATA_FOLDER);
    if (!isBlankMetadata(metadata)) {
        addItemToEnd({
            type: "folder",
            id: ID_METADATA_FOLDER,
            secret: true,
            title: "DesModder Metadata",
        });
        addItemToEnd({
            type: "text",
            id: ID_METADATA,
            folderId: ID_METADATA_FOLDER,
            text: JSON.stringify(metadata),
        });
    }
}
function getBlankMetadata() {
    return {
        version: 2,
        expressions: {},
    };
}
function isBlankMetadata(metadata) {
    return (Object.keys(metadata.expressions).length === 0 &&
        Object.keys(metadata).length === 2);
}
function cleanMetadata(metadata) {
    /* Mutates metadata by removing expressions that no longer exist */
    for (let id in metadata.expressions) {
        if (Calc.controller.getItemModel(id) === undefined) {
            delete metadata.expressions[id];
        }
    }
}
function changeExprInMetadata(metadata, id, obj) {
    /* Mutates metadata by spreading obj into metadata.expressions[id],
    with default values deleted */
    const changed = metadata.expressions[id] ?? {};
    for (let key in obj) {
        const value = obj[key];
        switch (key) {
            case "pinned":
            case "errorHidden":
            case "glesmos":
                if (value) {
                    changed[key] = true;
                }
                else {
                    delete changed[key];
                }
        }
    }
    if (Object.keys(changed).length === 0) {
        delete metadata.expressions[id];
    }
    else {
        metadata.expressions[id] = changed;
    }
}

;// CONCATENATED MODULE: ./src/main/Controller.ts





const AbstractItem = desmosRequire("graphing-calc/models/abstract-item");
class main_Controller_Controller {
    constructor() {
        this.view = null;
        this.expandedPlugin = null;
        this.exposedPlugins = {};
        this.graphMetadata = getBlankMetadata();
        // array of IDs
        this.pillboxButtonsOrder = ["main-menu"];
        // map button ID to setup
        this.pillboxButtons = {
            "main-menu": {
                id: "main-menu",
                tooltip: "DesModder Menu",
                iconClass: "dsm-icon-desmodder",
                popup: MenuFunc,
            },
        };
        // string if open, null if none are open
        this.pillboxMenuOpen = null;
        // default values
        this.pluginSettings = Object.fromEntries(pluginList.map((plugin) => [plugin.id, this.getDefaultConfig(plugin.id)]));
        this.pluginsEnabled = Object.fromEntries(pluginList.map((plugin) => [plugin.id, plugin.enabledByDefault]));
    }
    getDefaultConfig(id) {
        const out = {};
        const config = plugins[id].config;
        if (config !== undefined) {
            for (const configItem of config) {
                out[configItem.key] = configItem.default;
            }
        }
        return out;
    }
    applyStoredEnabled(storedEnabled) {
        for (const { id } of pluginList) {
            const stored = storedEnabled[id];
            if (stored !== undefined) {
                this.pluginsEnabled[id] = stored;
            }
        }
    }
    applyStoredSettings(storedSettings) {
        for (const { id } of pluginList) {
            const stored = storedSettings[id];
            if (stored !== undefined) {
                for (const key in this.pluginSettings[id]) {
                    const storedValue = stored[key];
                    if (storedValue !== undefined) {
                        this.pluginSettings[id][key] = storedValue;
                    }
                }
            }
        }
    }
    init(view) {
        // async
        let numFulfilled = 0;
        listenToMessageDown((message) => {
            if (message.type === "apply-plugin-settings") {
                this.applyStoredSettings(message.value);
            }
            else if (message.type === "apply-plugins-enabled") {
                this.applyStoredEnabled(message.value);
            }
            else {
                return;
            }
            // I'm not sure if the messages are guaranteed to be in the expected
            // order. Doesn't matter except for making sure we only
            // enable once
            numFulfilled += 1;
            if (numFulfilled === 2) {
                this.view = view;
                for (const { id } of pluginList) {
                    if (this.pluginsEnabled[id]) {
                        this._enablePlugin(id, true);
                    }
                }
                this.view.updateMenuView();
                // cancel listener
                return true;
            }
        });
        // fire GET after starting listener in case it gets resolved before the listener begins
        postMessageUp({
            type: "get-initial-data",
        });
        // metadata stuff
        Calc.observeEvent("change.dsm-main-controller", () => {
            this.checkForMetadataChange();
        });
        this.checkForMetadataChange();
        if (this.pluginsEnabled["GLesmos"]) {
            // The graph loaded before DesModder loaded, so DesModder was not available to
            // return true when asked isGlesmosMode. Refresh those expressions now
            this.checkGLesmos();
        }
    }
    updateMenuView() {
        this.view?.updateMenuView();
    }
    addPillboxButton(info) {
        this.pillboxButtons[info.id] = info;
        this.pillboxButtonsOrder.push(info.id);
        this.updateMenuView();
    }
    removePillboxButton(id) {
        this.pillboxButtonsOrder.splice(this.pillboxButtonsOrder.indexOf(id), 1);
        delete this.pillboxButtons[id];
        if (this.pillboxMenuOpen === id) {
            this.pillboxMenuOpen = null;
        }
        this.updateMenuView();
    }
    toggleMenu(id) {
        this.pillboxMenuOpen = this.pillboxMenuOpen === id ? null : id;
        this.updateMenuView();
    }
    closeMenu() {
        this.pillboxMenuOpen = null;
        this.updateMenuView();
    }
    getPlugin(id) {
        return plugins[id];
    }
    getPluginsList() {
        return pluginList;
    }
    setPluginEnabled(i, isEnabled) {
        this.pluginsEnabled[i] = isEnabled;
        if (i === "GLesmos") {
            // Need to refresh glesmos expressions
            this.checkGLesmos();
        }
        postMessageUp({
            type: "set-plugins-enabled",
            value: this.pluginsEnabled,
        });
    }
    warnReload() {
        // TODO: proper UI, maybe similar to the "Opened graph '...'. Press Ctrl+Z to undo. <a>Undo</a>"
        // or equivalently (but within the calculator-api): "New graph created. Press Ctrl+Z to undo. <a>Undo</a>"
        // `location.reload()` allows reload directly from page JS
        alert("You must reload the page (Ctrl+R) for that change to take effect.");
    }
    disablePlugin(i) {
        const plugin = plugins[i];
        if (this.isPluginToggleable(i)) {
            if (this.pluginsEnabled[i]) {
                if (plugin.onDisable) {
                    plugin.onDisable();
                    delete this.pluginsEnabled[i];
                }
                else {
                    this.warnReload();
                }
                this.setPluginEnabled(i, false);
                this.updateMenuView();
                plugin.afterDisable?.();
            }
        }
    }
    _enablePlugin(id, isReload) {
        const plugin = plugins[id];
        if (plugin !== undefined) {
            if (plugin.enableRequiresReload && !isReload) {
                this.warnReload();
            }
            else {
                const res = plugin.onEnable(this.pluginSettings[id]);
                if (res !== undefined) {
                    this.exposedPlugins[id] = res;
                }
            }
            this.setPluginEnabled(id, true);
            this.updateMenuView();
        }
    }
    enablePlugin(id) {
        if (this.isPluginToggleable(id) && !this.pluginsEnabled[id]) {
            this.setPluginEnabled(id, true);
            this._enablePlugin(id, false);
        }
    }
    togglePlugin(i) {
        if (this.pluginsEnabled[i]) {
            this.disablePlugin(i);
        }
        else {
            this.enablePlugin(i);
        }
    }
    isPluginEnabled(i) {
        return this.pluginsEnabled[i] ?? false;
    }
    isPluginToggleable(i) {
        return !plugins[i].alwaysEnabled;
    }
    togglePluginExpanded(i) {
        if (this.expandedPlugin === i) {
            this.expandedPlugin = null;
        }
        else {
            this.expandedPlugin = i;
        }
        this.updateMenuView();
    }
    setPluginSetting(pluginID, key, value, doCallback = true) {
        const pluginSettings = this.pluginSettings[pluginID];
        if (pluginSettings === undefined)
            return;
        const proposedChanges = {
            [key]: value,
        };
        const manageConfigChange = plugins[pluginID]?.manageConfigChange;
        const changes = manageConfigChange !== undefined
            ? manageConfigChange(pluginSettings, proposedChanges)
            : proposedChanges;
        Object.assign(pluginSettings, changes);
        postMessageUp({
            type: "set-plugin-settings",
            value: this.pluginSettings,
        });
        if (doCallback && this.pluginsEnabled[pluginID]) {
            const onConfigChange = plugins[pluginID]?.onConfigChange;
            if (onConfigChange !== undefined) {
                onConfigChange(changes);
            }
        }
        this.updateMenuView();
    }
    checkForMetadataChange() {
        const newMetadata = getMetadata();
        if (!this.pluginsEnabled["GLesmos"]) {
            if (Object.entries(newMetadata.expressions).some(([id, e]) => e.glesmos && !this.graphMetadata.expressions[id]?.glesmos)) {
                // list of glesmos expressions changed
                Calc.controller._showToast({
                    message: "Enable the GLesmos plugin to improve the performance of some implicits in this graph",
                });
            }
        }
        this.graphMetadata = newMetadata;
        this.applyPinnedStyle();
    }
    _updateExprMetadata(id, obj) {
        changeExprInMetadata(this.graphMetadata, id, obj);
        setMetadata(this.graphMetadata);
    }
    duplicateMetadata(toID, fromID) {
        this._updateExprMetadata(toID, this.getDsmItemModel(fromID));
    }
    updateExprMetadata(id, obj) {
        this._updateExprMetadata(id, obj);
        this.finishUpdateMetadata();
    }
    commitStateChange(allowUndo) {
        Calc.controller.updateTheComputedWorld();
        if (allowUndo) {
            Calc.controller.commitUndoRedoSynchronously({ type: "dsm-blank" });
        }
        Calc.controller.updateViews();
    }
    finishUpdateMetadata() {
        this.applyPinnedStyle();
        this.commitStateChange(false);
    }
    getDsmItemModel(id) {
        return this.graphMetadata.expressions[id];
    }
    pinExpression(id) {
        this.updateExprMetadata(id, {
            pinned: true,
        });
    }
    unpinExpression(id) {
        this.updateExprMetadata(id, {
            pinned: false,
        });
    }
    isPinned(id) {
        return (this.pluginsEnabled["pin-expressions"] &&
            !Calc.controller.getExpressionSearchOpen() &&
            this.graphMetadata.expressions[id]?.pinned);
    }
    hideError(id) {
        this.updateExprMetadata(id, {
            errorHidden: true,
        });
    }
    toggleErrorHidden(id) {
        this.updateExprMetadata(id, {
            errorHidden: !this.isErrorHidden(id),
        });
    }
    isErrorHidden(id) {
        return this.graphMetadata.expressions[id]?.errorHidden;
    }
    applyPinnedStyle() {
        const el = document.querySelector(".dcg-exppanel-container");
        const hasPinnedExpressions = Object.keys(this.graphMetadata.expressions).some((id) => this.graphMetadata.expressions[id].pinned);
        el?.classList.toggle("dsm-has-pinned-expressions", hasPinnedExpressions);
    }
    folderDump(folderIndex) {
        const folderModel = Calc.controller.getItemModelByIndex(folderIndex);
        if (!folderModel || folderModel.type !== "folder")
            return;
        const folderId = folderModel?.id;
        // Remove folderId on all of the contents of the folder
        for (let currIndex = folderIndex + 1, currExpr = Calc.controller.getItemModelByIndex(currIndex); currExpr && currExpr.type !== "folder" && currExpr?.folderId === folderId; currIndex++, currExpr = Calc.controller.getItemModelByIndex(currIndex)) {
            AbstractItem.setFolderId(currExpr, undefined);
        }
        // Replace the folder with text that has the same title
        const T = Calc.controller.createItemModel({
            id: Calc.controller.generateId(),
            type: "text",
            text: folderModel.title,
        });
        Calc.controller._toplevelReplaceItemAt(folderIndex, T, true);
        this.commitStateChange(true);
    }
    folderMerge(folderIndex) {
        const folderModel = Calc.controller.getItemModelByIndex(folderIndex);
        const folderId = folderModel?.id;
        // Place all expressions until the next folder into this folder
        for (let currIndex = folderIndex + 1, currExpr = Calc.controller.getItemModelByIndex(currIndex); currExpr && currExpr.type !== "folder"; currIndex++, currExpr = Calc.controller.getItemModelByIndex(currIndex)) {
            AbstractItem.setFolderId(currExpr, folderId);
        }
        this.commitStateChange(true);
    }
    noteEnclose(noteIndex) {
        // Replace this note with a folder, then folderMerge
        const noteModel = Calc.controller.getItemModelByIndex(noteIndex);
        if (!noteModel || noteModel.type !== "text")
            return;
        const T = Calc.controller.createItemModel({
            id: Calc.controller.generateId(),
            type: "folder",
            title: noteModel.text,
        });
        Calc.controller._toplevelReplaceItemAt(noteIndex, T, true);
        this.folderMerge(noteIndex);
        this.commitStateChange(true);
    }
    checkGLesmos() {
        const glesmosIDs = Object.keys(this.graphMetadata.expressions).filter((id) => this.graphMetadata.expressions[id].glesmos);
        if (glesmosIDs.length > 0) {
            glesmosIDs.map((id) => this.toggleExpr(id));
            this.killWorker();
        }
    }
    canBeGLesmos(id) {
        let model;
        return (this.pluginsEnabled["GLesmos"] &&
            (model = Calc.controller.getItemModel(id)) &&
            model.type === "expression" &&
            model.formula &&
            model.formula.expression_type === "IMPLICIT" &&
            model.formula.is_inequality);
    }
    isGlesmosMode(id) {
        if (!this.pluginsEnabled["GLesmos"])
            return false;
        this.checkForMetadataChange();
        return this.graphMetadata.expressions[id]?.glesmos;
    }
    toggleGlesmos(id) {
        this.updateExprMetadata(id, {
            glesmos: !this.isGlesmosMode(id),
        });
        // force the worker to revisit the expression
        this.toggleExpr(id);
        this.killWorker();
    }
    toggleExpr(id) {
        Calc.controller.dispatch({
            type: "toggle-item-hidden",
            id,
        });
        Calc.controller.dispatch({
            type: "toggle-item-hidden",
            id,
        });
    }
    killWorker() {
        Calc.controller.evaluator.workerPoolConnection.killWorker();
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/components/PillboxContainer.less
var PillboxContainer = __webpack_require__(5918);
;// CONCATENATED MODULE: ./src/components/PillboxContainer.less

            

var PillboxContainer_options = {};

PillboxContainer_options.insert = "head";
PillboxContainer_options.singleton = false;

var PillboxContainer_update = injectStylesIntoStyleTag_default()(PillboxContainer/* default */.Z, PillboxContainer_options);



/* harmony default export */ var components_PillboxContainer = (PillboxContainer/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/components/PillboxContainer.tsx





class PillboxContainer_PillboxContainer extends src_DCGView.Class {
    init() {
        this.controller = this.props.controller();
    }
    template() {
        return (src_DCGView.jsx("div", null,
            src_DCGView.jsx(For, { each: () => this.controller.pillboxButtonsOrder, key: (id) => id },
                src_DCGView.jsx("div", { class: "dsm-pillbox-buttons" }, (id) => (src_DCGView.jsx(Tooltip, { tooltip: () => this.controller.pillboxButtons[id]?.tooltip ?? "", gravity: "w" },
                    src_DCGView.jsx("div", { class: "dcg-btn-flat-gray dcg-settings-pillbox dcg-action-settings dsm-action-menu", role: "button", onTap: () => this.onTapMenuButton(id), 
                        // TODO: manageFocus?
                        style: {
                            background: Calc.controller.getPillboxBackgroundColor(),
                        } },
                        src_DCGView.jsx("i", { class: () => this.controller.pillboxButtons[id]?.iconClass ?? "" })))))),
            src_DCGView.jsx(If, { predicate: () => this.controller.pillboxMenuOpen !== null }, () => (src_DCGView.jsx("div", { class: "dcg-settings-container dsm-menu-container dcg-left dcg-popover dcg-constrained-height-popover", didMount: () => this.didMountContainer(), didUnmount: () => this.didUnmountContainer(), style: () => ({
                    position: "absolute",
                    ...this.getPopoverPosition(),
                    "line-height": "1em",
                }) },
                src_DCGView.jsx(Switch, { key: () => this.controller.pillboxMenuOpen }, () => this.controller.pillboxButtons[this.controller.pillboxMenuOpen]?.popup?.(this.controller)),
                src_DCGView.jsx("div", { class: "dcg-arrow" }))))));
    }
    getPopoverPosition() {
        let index = this.controller.pillboxButtonsOrder.indexOf(this.controller.pillboxMenuOpen);
        if (Calc.settings.settingsMenu) {
            index += 1;
        }
        // for index=0, this would correspond to the wrench menu,
        // which is positioned at top=2, right=38.
        let top = 2;
        let right = 38;
        // scale linearly past index=0
        if (Calc.settings.graphpaper) {
            top += 43 * index;
        }
        else {
            right += 43 * index;
        }
        return {
            top: top + "px",
            right: right + "px",
        };
    }
    onTapMenuButton(id) {
        this.controller.toggleMenu(id);
    }
    didMountContainer() {
        if (Calc.controller.isGraphSettingsOpen()) {
            Calc.controller.dispatch({
                type: "close-graph-settings",
            });
        }
        jquery(document).on("dcg-tapstart.menu-view wheel.menu-view", (e) => {
            if (this.eventShouldCloseMenu(e)) {
                this.controller.closeMenu();
            }
        });
        jquery(document).on("keydown.menu-view", (e) => {
            if (keys.lookup(e) === "Esc") {
                this.controller.closeMenu();
            }
        });
    }
    didUnmountContainer() {
        jquery(document).off(".menu-view");
    }
    eventShouldCloseMenu(e) {
        // this.node refers to the generated node from DCGView
        const el = jquery(e.target);
        return (!el.closest("_domNode" in this._element
            ? this._element._domNode
            : this._element._element._domNode).length && !el.closest(".dsm-action-menu").length);
    }
}

;// CONCATENATED MODULE: ./src/plugins/show-tips/tips.ts
const tips = [
    /* DesModder features */
    {
        desc: "When exporting videos, prefer MP4 or APNG over GIF",
    },
    {
        desc: "Disabling graphpaper in Calculator Settings is useful for writing a sequence of equations",
    },
    {
        desc: "Paste ASCII Math directly into Desmos",
    },
    {
        desc: "Pin (bookmark) commonly-used expressions for easy access",
    },
    {
        desc: "Before starting a long video capture, it's safest to test the beginning of an export",
    },
    {
        desc: "Find and Replace is great for renaming variables",
    },
    {
        desc: "Press Ctrl+Q to duplicate the current expression",
    },
    {
        desc: "Type Shift+Enter inside notes and folder titles for a newline",
    },
    {
        desc: "Click the yellow triangle (or type shift+enter) to fade a warning and hide sliders",
    },
    /* Desmos tips */
    {
        desc: 'Type " to quickly make a note or "folder" for a folder',
    },
    {
        desc: "Use arctan(y,x) instead of arctan(y/x) to get the angle of a point",
        learnMore: "https://www.desmos.com/calculator/beqk9rnxbl",
    },
    {
        desc: "Integrals can have infinite bounds",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4406810279693-Integrals",
    },
    {
        desc: "The random function can sample from a distribution",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405633253389-Statistics",
    },
    {
        desc: "Two-argument round is great for rounding labels",
        learnMore: "https://www.desmos.com/calculator/wnm3fwctnf",
    },
    {
        desc: "Sort one list using keys of another list with sort(A,B)",
        learnMore: "https://www.desmos.com/calculator/ul4isx0qiz",
    },
    {
        desc: "Create custom colors and re-use them using variables",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4406795899533-Custom-Colors",
    },
    {
        desc: "Press Ctrl+F to search through expressions",
    },
    {
        desc: "Take derivatives using prime notation or Leibniz notation",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4406809433613-Derivatives",
    },
    {
        desc: "List slices do not have to be bounded",
        learnMore: "https://www.desmos.com/calculator/4z0wllsipm",
    },
    {
        desc: "To visualize data, you can use a histogram, boxplot, and more",
        learnMore: "https://help.desmos.com/hc/en-us/articles/360022405991-Data-Visualizations",
    },
    {
        desc: "Desmos has many built-in statistics functions",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405633253389-Statistics",
    },
    {
        desc: "Use a table for a list of draggable points",
    },
    {
        desc: "Use the polygon function for easy polygons",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405488514573-Polygons",
    },
    {
        desc: "Point (vector) arithmetic works as expected",
    },
    {
        desc: "Shift + mouse drag over an axis to scale only that axis",
    },
    {
        desc: "Use actions and tickers to run simulations",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4407725009165",
    },
    {
        desc: "The math from Desmos can be directly copy-pasted into LaTeX editors",
    },
    {
        desc: "To test how fast your graph runs, use ?timeInWorker",
        learnMore: "https://www.desmos.com/calculator/n37jppmozc?timeInWorker",
    },
    {
        desc: "Use backticks to math-format point labels",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405487300877-Labels",
    },
    {
        desc: "Use ${ } for dynamic point labels based on a variable",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405487300877-Labels",
    },
    {
        desc: "Disabling text outline can sometimes make labels more readable",
        learnMore: "https://www.desmos.com/calculator/l8wm22nwkr",
    },
    {
        // From SlimRunner
        desc: "Regressions are more powerful than you can imagine",
        learnMore: "https://www.desmos.com/calculator/vof10zrr5i",
    },
    {
        desc: "Paste spreadsheet data to make a table",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405489674381-Tables",
    },
    {
        desc: "Type Ctrl+/ or Cmd+/ to open the list of keyboard shortcuts",
    },
    {
        desc: "List comprehensions are great for grids of points or lists of polygons",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4407889068557-Lists",
    },
    {
        desc: "List filters can be used to filter for positive elements, even elements, and more",
        learnMore: "https://www.desmos.com/calculator/acmvprhzba",
    },
    {
        desc: "Bernard",
        learnMore: "https://www.desmos.com/calculator/pbj6pw1kde",
    },
    {
        desc: "What's new at Desmos",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405017454477-What-s-New-at-Desmos",
    },
    {
        desc: "Action assignments are simultaneous, not sequential",
        learnMore: "https://www.desmos.com/calculator/v4feh9jgc8",
    },
    {
        desc: "You can share graphs via permalink without signing in",
        learnMore: "https://help.desmos.com/hc/en-us/articles/4405901719309-Saving-and-Managing-Graphs",
    },
    /* Motivation */
    {
        desc: "You're doing great :)",
    },
    {
        desc: "You're superb <3",
    },
];
function hashString(str) {
    // We just want a simple constant ordering that's not the same as the source
    // Details don't matter. https://stackoverflow.com/a/8831937/7481517
    return Array.from(str).reduce((hash, char) => 0 | (31 * hash + char.charCodeAt(0)), 0);
}
tips.sort((a, b) => hashString(a.desc) - hashString(b.desc));
/* harmony default export */ var show_tips_tips = (tips);

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./node_modules/less-loader/dist/cjs.js!./src/plugins/show-tips/Tip.less
var Tip = __webpack_require__(6611);
;// CONCATENATED MODULE: ./src/plugins/show-tips/Tip.less

            

var Tip_options = {};

Tip_options.insert = "head";
Tip_options.singleton = false;

var Tip_update = injectStylesIntoStyleTag_default()(Tip/* default */.Z, Tip_options);



/* harmony default export */ var show_tips_Tip = (Tip/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/plugins/show-tips/Tip.tsx



class Tip_Tip extends src_DCGView.Class {
    init() {
        this.currentTipIndex = Math.floor(Math.random() * show_tips_tips.length);
    }
    template() {
        return (src_DCGView.jsx("div", { class: "dsm-usage-tip", onTap: () => this.nextTip() },
            src_DCGView.jsx("div", null, () => this.getCurrentTip().desc),
            src_DCGView.jsx(If, { predicate: () => this.getCurrentTip().learnMore !== undefined }, () => (src_DCGView.jsx("a", { href: () => this.getCurrentTip().learnMore, target: "_blank", onTap: (e) => e.stopPropagation() }, "Learn more")))));
    }
    getCurrentTip() {
        return show_tips_tips[this.currentTipIndex];
    }
    nextTip() {
        this.currentTipIndex += 1;
        this.currentTipIndex %= show_tips_tips.length;
        Calc.controller.updateViews();
    }
}
function createTipElement() {
    return src_DCGView.jsx(Tip_Tip, null);
}

;// CONCATENATED MODULE: ./src/main/View.ts




// Not good to have a specific workaround for this single plugin

class View_View {
    constructor() {
        this.pillboxMountNode = null;
        this.menuView = null;
        this.controller = null;
    }
    async init(controller) {
        this.controller = controller;
        await this.mountPillbox(controller);
        Calc.controller.dispatcher.register((e) => {
            if (e.type === "keypad/set-minimized" ||
                e.type === "close-graph-settings") {
                this.updatePillboxHeight();
            }
        });
    }
    async mountPillbox(controller) {
        const pillbox = (await pollForValue(() => document.querySelector(".dcg-overgraph-pillbox-elements")));
        /*
         * pillbox is shaped like:
         * <div class="dcg-overgraph-pillbox-elements">
         *   <div /> <!-- may be empty (stand-in for the wrench settings) -->
         *   <div /> <!-- may be empty (stand-in for the reset button) -->
         *   <div /> <!-- may be empty (stand-in for the zoom & home buttons) -->
         * </div>
         *
         * If Calc.settings.settingsMenu === false and Calc.settings.zoomButtons === false,
         * and there is no saved state to warrant a reset button,
         * then the ENTIRE pillbox is hidden, so pillbox would be null,
         * and pollForValue would not resolve until the element is inserted.
         *
         * So, pillbox should not be null.
         */
        this.pillboxMountNode = document.createElement("div");
        // we want to insert pillboxMountNode after the wrench settings and
        // before the reset/zoom button
        pillbox.insertBefore(this.pillboxMountNode, pillbox.firstElementChild.nextElementSibling);
        this.menuView = src_DCGView.mountToNode(PillboxContainer_PillboxContainer, this.pillboxMountNode, {
            controller: () => controller,
        });
    }
    updatePillboxHeight() {
        if (Calc.controller.isGraphSettingsOpen()) {
            return;
        }
        const pillboxContainer = document.querySelector(".dcg-overgraph-pillbox-elements");
        if (pillboxContainer !== null) {
            // accounting for future contingency where keypad is actually allowed
            // to be open (maybe when popover integreated into main Desmodder components)
            const t = Calc.controller.isKeypadOpen()
                ? Calc.controller.getKeypadHeight()
                : 0;
            const bottom = this.controller && this.controller.pillboxMenuOpen !== null
                ? t + "px"
                : "auto";
            pillboxContainer.style.bottom = bottom;
        }
    }
    updateMenuView() {
        this.menuView && this.menuView.update();
        this.updatePillboxHeight();
    }
    createTipElement() {
        return createTipElement();
    }
}

// EXTERNAL MODULE: ./node_modules/css-loader/dist/cjs.js!./src/fonts/style.css
var style = __webpack_require__(799);
;// CONCATENATED MODULE: ./src/fonts/style.css

            

var style_options = {};

style_options.insert = "head";
style_options.singleton = false;

var style_update = injectStylesIntoStyleTag_default()(style/* default */.Z, style_options);



/* harmony default export */ var fonts_style = (style/* default.locals */.Z.locals || {});
;// CONCATENATED MODULE: ./src/script.ts




const script_controller = new main_Controller_Controller();
const script_view = new View_View();
globals_window.DesModder = {
    view: script_view,
    controller: script_controller,
    exposedPlugins: script_controller.exposedPlugins,
};
script_controller.init(script_view);
script_view.init(script_controller);

}();
/******/ })()
;