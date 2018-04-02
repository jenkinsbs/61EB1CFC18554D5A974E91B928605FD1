(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("path"), require("fs"), require("util"), require("stream"), require("zlib"), require("assert"), require("child_process"), require("crypto"), require("os"), require("buffer"), require("constants"), require("events"), require("net"), require("tty"));
	else if(typeof define === 'function' && define.amd)
		define(["path", "fs", "util", "stream", "zlib", "assert", "child_process", "crypto", "os", "buffer", "constants", "events", "net", "tty"], factory);
	else if(typeof exports === 'object')
		exports["fsMetadata"] = factory(require("path"), require("fs"), require("util"), require("stream"), require("zlib"), require("assert"), require("child_process"), require("crypto"), require("os"), require("buffer"), require("constants"), require("events"), require("net"), require("tty"));
	else
		root["fsMetadata"] = factory(root["path"], root["fs"], root["util"], root["stream"], root["zlib"], root["assert"], root["child_process"], root["crypto"], root["os"], root["buffer"], root["constants"], root["events"], root["net"], root["tty"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_0__, __WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_7__, __WEBPACK_EXTERNAL_MODULE_19__, __WEBPACK_EXTERNAL_MODULE_22__, __WEBPACK_EXTERNAL_MODULE_32__, __WEBPACK_EXTERNAL_MODULE_47__, __WEBPACK_EXTERNAL_MODULE_114__, __WEBPACK_EXTERNAL_MODULE_115__, __WEBPACK_EXTERNAL_MODULE_223__, __WEBPACK_EXTERNAL_MODULE_224__, __WEBPACK_EXTERNAL_MODULE_225__, __WEBPACK_EXTERNAL_MODULE_226__, __WEBPACK_EXTERNAL_MODULE_227__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 119);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(2)
var polyfills = __webpack_require__(195)
var legacy = __webpack_require__(194)
var queue = []

var util = __webpack_require__(7)

function noop () {}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs4')
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
    console.error(m)
  }

if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function() {
    debug(queue)
    __webpack_require__(32).equal(queue.length, 0)
  })
}

module.exports = patch(__webpack_require__(86))
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
  module.exports = patch(fs)
}

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple graceful-fs instances are
// in play at the same time.
module.exports.close =
fs.close = (function (fs$close) { return function (fd, cb) {
  return fs$close.call(fs, fd, function (err) {
    if (!err)
      retry()

    if (typeof cb === 'function')
      cb.apply(this, arguments)
  })
}})(fs.close)

module.exports.closeSync =
fs.closeSync = (function (fs$closeSync) { return function (fd) {
  // Note that graceful-fs also retries when fs.closeSync() fails.
  // Looks like a bug to me, although it's probably a harmless one.
  var rval = fs$closeSync.apply(fs, arguments)
  retry()
  return rval
}})(fs.closeSync)

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs)
  fs.gracefulify = patch
  fs.FileReadStream = ReadStream;  // Legacy name.
  fs.FileWriteStream = WriteStream;  // Legacy name.
  fs.createReadStream = createReadStream
  fs.createWriteStream = createWriteStream
  var fs$readFile = fs.readFile
  fs.readFile = readFile
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile
  fs.writeFile = writeFile
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile
  if (fs$appendFile)
    fs.appendFile = appendFile
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$readdir = fs.readdir
  fs.readdir = readdir
  function readdir (path, options, cb) {
    var args = [path]
    if (typeof options !== 'function') {
      args.push(options)
    } else {
      cb = options
    }
    args.push(go$readdir$cb)

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort()

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]])
      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments)
        retry()
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs)
    ReadStream = legStreams.ReadStream
    WriteStream = legStreams.WriteStream
  }

  var fs$ReadStream = fs.ReadStream
  ReadStream.prototype = Object.create(fs$ReadStream.prototype)
  ReadStream.prototype.open = ReadStream$open

  var fs$WriteStream = fs.WriteStream
  WriteStream.prototype = Object.create(fs$WriteStream.prototype)
  WriteStream.prototype.open = WriteStream$open

  fs.ReadStream = ReadStream
  fs.WriteStream = WriteStream

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy()

        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
        that.read()
      }
    })
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy()
        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
      }
    })
  }

  function createReadStream (path, options) {
    return new ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new WriteStream(path, options)
  }

  var fs$open = fs.open
  fs.open = open
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1])
  queue.push(elem)
}

function retry () {
  var elem = queue.shift()
  if (elem) {
    debug('RETRY', elem[0].name, elem[1])
    elem[0].apply(null, elem[1])
  }
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var store = __webpack_require__(65)('wks');
var uid = __webpack_require__(30);
var Symbol = __webpack_require__(5).Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


exports.fromCallback = function (fn) {
  return Object.defineProperty(function () {
    if (typeof arguments[arguments.length - 1] === 'function') fn.apply(this, arguments)
    else {
      return new Promise((resolve, reject) => {
        arguments[arguments.length] = (err, res) => {
          if (err) return reject(err)
          resolve(res)
        }
        arguments.length++
        fn.apply(this, arguments)
      })
    }
  }, 'name', { value: fn.name })
}

exports.fromPromise = function (fn) {
  return Object.defineProperty(function () {
    const cb = arguments[arguments.length - 1]
    if (typeof cb !== 'function') return fn.apply(this, arguments)
    else fn.apply(this, arguments).then(r => cb(null, r), cb)
  }, 'name', { value: fn.name })
}


/***/ }),
/* 5 */
/***/ (function(module, exports) {

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const u = __webpack_require__(4).fromCallback
const mkdirs = u(__webpack_require__(185))
const mkdirsSync = __webpack_require__(184)

module.exports = {
  mkdirs: mkdirs,
  mkdirsSync: mkdirsSync,
  // alias
  mkdirp: mkdirs,
  mkdirpSync: mkdirsSync,
  ensureDir: mkdirs,
  ensureDirSync: mkdirsSync
}


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var exec = __webpack_require__(47).exec;
var isWindows = __webpack_require__(115).platform().match(/win(32|64)/);
var which = __webpack_require__(221);

var nlRegexp = /\r\n|\r|\n/g;
var streamRegexp = /^\[?(.*?)\]?$/;
var filterEscapeRegexp = /[,]/;
var whichCache = {};

/**
 * Parse progress line from ffmpeg stderr
 *
 * @param {String} line progress line
 * @return progress object
 * @private
 */
function parseProgressLine(line) {
  var progress = {};

  // Remove all spaces after = and trim
  line  = line.replace(/=\s+/g, '=').trim();
  var progressParts = line.split(' ');

  // Split every progress part by "=" to get key and value
  for(var i = 0; i < progressParts.length; i++) {
    var progressSplit = progressParts[i].split('=', 2);
    var key = progressSplit[0];
    var value = progressSplit[1];

    // This is not a progress line
    if(typeof value === 'undefined')
      return null;

    progress[key] = value;
  }

  return progress;
}


var utils = module.exports = {
  isWindows: isWindows,
  streamRegexp: streamRegexp,


  /**
   * Copy an object keys into another one
   *
   * @param {Object} source source object
   * @param {Object} dest destination object
   * @private
   */
  copy: function(source, dest) {
    Object.keys(source).forEach(function(key) {
      dest[key] = source[key];
    });
  },


  /**
   * Create an argument list
   *
   * Returns a function that adds new arguments to the list.
   * It also has the following methods:
   * - clear() empties the argument list
   * - get() returns the argument list
   * - find(arg, count) finds 'arg' in the list and return the following 'count' items, or undefined if not found
   * - remove(arg, count) remove 'arg' in the list as well as the following 'count' items
   *
   * @private
   */
  args: function() {
    var list = [];

    // Append argument(s) to the list
    var argfunc = function() {
      if (arguments.length === 1 && Array.isArray(arguments[0])) {
        list = list.concat(arguments[0]);
      } else {
        list = list.concat([].slice.call(arguments));
      }
    };

    // Clear argument list
    argfunc.clear = function() {
      list = [];
    };

    // Return argument list
    argfunc.get = function() {
      return list;
    };

    // Find argument 'arg' in list, and if found, return an array of the 'count' items that follow it
    argfunc.find = function(arg, count) {
      var index = list.indexOf(arg);
      if (index !== -1) {
        return list.slice(index + 1, index + 1 + (count || 0));
      }
    };

    // Find argument 'arg' in list, and if found, remove it as well as the 'count' items that follow it
    argfunc.remove = function(arg, count) {
      var index = list.indexOf(arg);
      if (index !== -1) {
        list.splice(index, (count || 0) + 1);
      }
    };

    // Clone argument list
    argfunc.clone = function() {
      var cloned = utils.args();
      cloned(list);
      return cloned;
    };

    return argfunc;
  },


  /**
   * Generate filter strings
   *
   * @param {String[]|Object[]} filters filter specifications. When using objects,
   *   each must have the following properties:
   * @param {String} filters.filter filter name
   * @param {String|Array} [filters.inputs] (array of) input stream specifier(s) for the filter,
   *   defaults to ffmpeg automatically choosing the first unused matching streams
   * @param {String|Array} [filters.outputs] (array of) output stream specifier(s) for the filter,
   *   defaults to ffmpeg automatically assigning the output to the output file
   * @param {Object|String|Array} [filters.options] filter options, can be omitted to not set any options
   * @return String[]
   * @private
   */
  makeFilterStrings: function(filters) {
    return filters.map(function(filterSpec) {
      if (typeof filterSpec === 'string') {
        return filterSpec;
      }

      var filterString = '';

      // Filter string format is:
      // [input1][input2]...filter[output1][output2]...
      // The 'filter' part can optionaly have arguments:
      //   filter=arg1:arg2:arg3
      //   filter=arg1=v1:arg2=v2:arg3=v3

      // Add inputs
      if (Array.isArray(filterSpec.inputs)) {
        filterString += filterSpec.inputs.map(function(streamSpec) {
          return streamSpec.replace(streamRegexp, '[$1]');
        }).join('');
      } else if (typeof filterSpec.inputs === 'string') {
        filterString += filterSpec.inputs.replace(streamRegexp, '[$1]');
      }

      // Add filter
      filterString += filterSpec.filter;

      // Add options
      if (filterSpec.options) {
        if (typeof filterSpec.options === 'string' || typeof filterSpec.options === 'number') {
          // Option string
          filterString += '=' + filterSpec.options;
        } else if (Array.isArray(filterSpec.options)) {
          // Option array (unnamed options)
          filterString += '=' + filterSpec.options.map(function(option) {
            if (typeof option === 'string' && option.match(filterEscapeRegexp)) {
              return '\'' + option + '\'';
            } else {
              return option;
            }
          }).join(':');
        } else if (Object.keys(filterSpec.options).length) {
          // Option object (named options)
          filterString += '=' + Object.keys(filterSpec.options).map(function(option) {
            var value = filterSpec.options[option];

            if (typeof value === 'string' && value.match(filterEscapeRegexp)) {
              value = '\'' + value + '\'';
            }

            return option + '=' + value;
          }).join(':');
        }
      }

      // Add outputs
      if (Array.isArray(filterSpec.outputs)) {
        filterString += filterSpec.outputs.map(function(streamSpec) {
          return streamSpec.replace(streamRegexp, '[$1]');
        }).join('');
      } else if (typeof filterSpec.outputs === 'string') {
        filterString += filterSpec.outputs.replace(streamRegexp, '[$1]');
      }

      return filterString;
    });
  },


  /**
   * Search for an executable
   *
   * Uses 'which' or 'where' depending on platform
   *
   * @param {String} name executable name
   * @param {Function} callback callback with signature (err, path)
   * @private
   */
  which: function(name, callback) {
    if (name in whichCache) {
      return callback(null, whichCache[name]);
    }

    which(name, function(err, result){
      if (err) {
        // Treat errors as not found
        return callback(null, whichCache[name] = '');
      }
      callback(null, whichCache[name] = result);
    });
  },


  /**
   * Convert a [[hh:]mm:]ss[.xxx] timemark into seconds
   *
   * @param {String} timemark timemark string
   * @return Number
   * @private
   */
  timemarkToSeconds: function(timemark) {
    if (typeof timemark === 'number') {
      return timemark;
    }

    if (timemark.indexOf(':') === -1 && timemark.indexOf('.') >= 0) {
      return Number(timemark);
    }

    var parts = timemark.split(':');

    // add seconds
    var secs = Number(parts.pop());

    if (parts.length) {
      // add minutes
      secs += Number(parts.pop()) * 60;
    }

    if (parts.length) {
      // add hours
      secs += Number(parts.pop()) * 3600;
    }

    return secs;
  },


  /**
   * Extract codec data from ffmpeg stderr and emit 'codecData' event if appropriate
   * Call it with an initially empty codec object once with each line of stderr output until it returns true
   *
   * @param {FfmpegCommand} command event emitter
   * @param {String} stderrLine ffmpeg stderr output line
   * @param {Object} codecObject object used to accumulate codec data between calls
   * @return {Boolean} true if codec data is complete (and event was emitted), false otherwise
   * @private
   */
  extractCodecData: function(command, stderrLine, codecsObject) {
    var inputPattern = /Input #[0-9]+, ([^ ]+),/;
    var durPattern = /Duration\: ([^,]+)/;
    var audioPattern = /Audio\: (.*)/;
    var videoPattern = /Video\: (.*)/;

    if (!('inputStack' in codecsObject)) {
      codecsObject.inputStack = [];
      codecsObject.inputIndex = -1;
      codecsObject.inInput = false;
    }

    var inputStack = codecsObject.inputStack;
    var inputIndex = codecsObject.inputIndex;
    var inInput = codecsObject.inInput;

    var format, dur, audio, video;

    if (format = stderrLine.match(inputPattern)) {
      inInput = codecsObject.inInput = true;
      inputIndex = codecsObject.inputIndex = codecsObject.inputIndex + 1;

      inputStack[inputIndex] = { format: format[1], audio: '', video: '', duration: '' };
    } else if (inInput && (dur = stderrLine.match(durPattern))) {
      inputStack[inputIndex].duration = dur[1];
    } else if (inInput && (audio = stderrLine.match(audioPattern))) {
      audio = audio[1].split(', ');
      inputStack[inputIndex].audio = audio[0];
      inputStack[inputIndex].audio_details = audio;
    } else if (inInput && (video = stderrLine.match(videoPattern))) {
      video = video[1].split(', ');
      inputStack[inputIndex].video = video[0];
      inputStack[inputIndex].video_details = video;
    } else if (/Output #\d+/.test(stderrLine)) {
      inInput = codecsObject.inInput = false;
    } else if (/Stream mapping:|Press (\[q\]|ctrl-c) to stop/.test(stderrLine)) {
      command.emit.apply(command, ['codecData'].concat(inputStack));
      return true;
    }

    return false;
  },


  /**
   * Extract progress data from ffmpeg stderr and emit 'progress' event if appropriate
   *
   * @param {FfmpegCommand} command event emitter
   * @param {String} stderrLine ffmpeg stderr data
   * @private
   */
  extractProgress: function(command, stderrLine) {
    var progress = parseProgressLine(stderrLine);

    if (progress) {
      // build progress report object
      var ret = {
        frames: parseInt(progress.frame, 10),
        currentFps: parseInt(progress.fps, 10),
        currentKbps: progress.bitrate ? parseFloat(progress.bitrate.replace('kbits/s', '')) : 0,
        targetSize: parseInt(progress.size || progress.Lsize, 10),
        timemark: progress.time
      };

      // calculate percent progress using duration
      if (command._ffprobeData && command._ffprobeData.format && command._ffprobeData.format.duration) {
        var duration = Number(command._ffprobeData.format.duration);
        if (!isNaN(duration))
          ret.percent = (utils.timemarkToSeconds(ret.timemark) / duration) * 100;
      }
      command.emit('progress', ret);
    }
  },


  /**
   * Extract error message(s) from ffmpeg stderr
   *
   * @param {String} stderr ffmpeg stderr data
   * @return {String}
   * @private
   */
  extractError: function(stderr) {
    // Only return the last stderr lines that don't start with a space or a square bracket
    return stderr.split(nlRegexp).reduce(function(messages, message) {
      if (message.charAt(0) === ' ' || message.charAt(0) === '[') {
        return [];
      } else {
        messages.push(message);
        return messages;
      }
    }, []).join('\n');
  },


  /**
   * Creates a line ring buffer object with the following methods:
   * - append(str) : appends a string or buffer
   * - get() : returns the whole string
   * - close() : prevents further append() calls and does a last call to callbacks
   * - callback(cb) : calls cb for each line (incl. those already in the ring)
   *
   * @param {Numebr} maxLines maximum number of lines to store (<= 0 for unlimited)
   */
  linesRing: function(maxLines) {
    var cbs = [];
    var lines = [];
    var current = null;
    var closed = false
    var max = maxLines - 1;

    function emit(line) {
      cbs.forEach(function(cb) { cb(line); });
    }

    return {
      callback: function(cb) {
        lines.forEach(function(l) { cb(l); });
        cbs.push(cb);
      },

      append: function(str) {
        if (closed) return;
        if (str instanceof Buffer) str = '' + str;
        if (!str || str.length === 0) return;

        var newLines = str.split(nlRegexp);

        if (newLines.length === 1) {
          if (current !== null) {
            current = current + newLines.shift();
          } else {
            current = newLines.shift();
          }
        } else {
          if (current !== null) {
            current = current + newLines.shift();
            emit(current);
            lines.push(current);
          }

          current = newLines.pop();

          newLines.forEach(function(l) {
            emit(l);
            lines.push(l);
          });

          if (max > -1 && lines.length > max) {
            lines.splice(0, lines.length - max);
          }
        }
      },

      get: function() {
        if (current !== null) {
          return lines.concat([current]).join('\n');
        } else {
          return lines.join('\n');
        }
      },

      close: function() {
        if (closed) return;

        if (current !== null) {
          emit(current);
          lines.push(current);

          if (max > -1 && lines.length > max) {
            lines.shift();
          }

          current = null;
        }

        closed = true;
      }
    };
  }
};


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(8);
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const u = __webpack_require__(4).fromPromise
const fs = __webpack_require__(82)

function pathExists (path) {
  return fs.access(path).then(() => true).catch(() => false)
}

module.exports = {
  pathExists: u(pathExists),
  pathExistsSync: fs.existsSync
}


/***/ }),
/* 12 */
/***/ (function(module, exports) {

var core = module.exports = { version: '2.5.1' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

// optional / simple context binding
var aFunction = __webpack_require__(23);
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// Thank's IE8 for his funny defineProperty
module.exports = !__webpack_require__(26)(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 15 */
/***/ (function(module, exports) {

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(10);
var IE8_DOM_DEFINE = __webpack_require__(55);
var toPrimitive = __webpack_require__(68);
var dP = Object.defineProperty;

exports.f = __webpack_require__(14) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(16);
var createDesc = __webpack_require__(27);
module.exports = __webpack_require__(14) ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(5);
var hide = __webpack_require__(17);
var has = __webpack_require__(15);
var SRC = __webpack_require__(30)('src');
var TO_STRING = 'toString';
var $toString = Function[TO_STRING];
var TPL = ('' + $toString).split(TO_STRING);

__webpack_require__(12).inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else if (!safe) {
    delete O[key];
    hide(O, key, val);
  } else if (O[key]) {
    O[key] = val;
  } else {
    hide(O, key, val);
  }
// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});


/***/ }),
/* 19 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 20 */
/***/ (function(module, exports) {

module.exports = {};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



module.exports = {

  PNG_SIGNATURE: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],

  TYPE_IHDR: 0x49484452,
  TYPE_IEND: 0x49454e44,
  TYPE_IDAT: 0x49444154,
  TYPE_PLTE: 0x504c5445,
  TYPE_tRNS: 0x74524e53, // eslint-disable-line camelcase
  TYPE_gAMA: 0x67414d41, // eslint-disable-line camelcase

  // color-type bits
  COLORTYPE_GRAYSCALE: 0,
  COLORTYPE_PALETTE: 1,
  COLORTYPE_COLOR: 2,
  COLORTYPE_ALPHA: 4, // e.g. grayscale and alpha

  // color-type combinations
  COLORTYPE_PALETTE_COLOR: 3,
  COLORTYPE_COLOR_ALPHA: 6,

  COLORTYPE_TO_BPP_MAP: {
    0: 1,
    2: 3,
    3: 1,
    4: 2,
    6: 4
  },

  GAMMA_DIVISION: 100000
};


/***/ }),
/* 22 */
/***/ (function(module, exports) {

module.exports = require("zlib");

/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};


/***/ }),
/* 24 */
/***/ (function(module, exports) {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(5);
var core = __webpack_require__(12);
var hide = __webpack_require__(17);
var redefine = __webpack_require__(18);
var ctx = __webpack_require__(13);
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE];
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {});
  var key, own, out, exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;


/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};


/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

var def = __webpack_require__(16).f;
var has = __webpack_require__(15);
var TAG = __webpack_require__(3)('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = __webpack_require__(130);
var defined = __webpack_require__(36);
module.exports = function (it) {
  return IObject(defined(it));
};


/***/ }),
/* 30 */
/***/ (function(module, exports) {

var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const rimraf = __webpack_require__(189)

module.exports = {
  remove: u(rimraf),
  removeSync: rimraf.sync
}


/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(module) {(function (global, factory) {
   true ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.async = global.async || {})));
}(this, (function (exports) { 'use strict';

function slice(arrayLike, start) {
    start = start|0;
    var newLen = Math.max(arrayLike.length - start, 0);
    var newArr = Array(newLen);
    for(var idx = 0; idx < newLen; idx++)  {
        newArr[idx] = arrayLike[start + idx];
    }
    return newArr;
}

var initialParams = function (fn) {
    return function (/*...args, callback*/) {
        var args = slice(arguments);
        var callback = args.pop();
        fn.call(this, args, callback);
    };
};

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var hasSetImmediate = typeof setImmediate === 'function' && setImmediate;
var hasNextTick = typeof process === 'object' && typeof process.nextTick === 'function';

function fallback(fn) {
    setTimeout(fn, 0);
}

function wrap(defer) {
    return function (fn/*, ...args*/) {
        var args = slice(arguments, 1);
        defer(function () {
            fn.apply(null, args);
        });
    };
}

var _defer;

if (hasSetImmediate) {
    _defer = setImmediate;
} else if (hasNextTick) {
    _defer = process.nextTick;
} else {
    _defer = fallback;
}

var setImmediate$1 = wrap(_defer);

/**
 * Take a sync function and make it async, passing its return value to a
 * callback. This is useful for plugging sync functions into a waterfall,
 * series, or other async functions. Any arguments passed to the generated
 * function will be passed to the wrapped function (except for the final
 * callback argument). Errors thrown will be passed to the callback.
 *
 * If the function passed to `asyncify` returns a Promise, that promises's
 * resolved/rejected state will be used to call the callback, rather than simply
 * the synchronous return value.
 *
 * This also means you can asyncify ES2017 `async` functions.
 *
 * @name asyncify
 * @static
 * @memberOf module:Utils
 * @method
 * @alias wrapSync
 * @category Util
 * @param {Function} func - The synchronous function, or Promise-returning
 * function to convert to an {@link AsyncFunction}.
 * @returns {AsyncFunction} An asynchronous wrapper of the `func`. To be
 * invoked with `(args..., callback)`.
 * @example
 *
 * // passing a regular synchronous function
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(JSON.parse),
 *     function (data, next) {
 *         // data is the result of parsing the text.
 *         // If there was a parsing error, it would have been caught.
 *     }
 * ], callback);
 *
 * // passing a function returning a promise
 * async.waterfall([
 *     async.apply(fs.readFile, filename, "utf8"),
 *     async.asyncify(function (contents) {
 *         return db.model.create(contents);
 *     }),
 *     function (model, next) {
 *         // `model` is the instantiated model object.
 *         // If there was an error, this function would be skipped.
 *     }
 * ], callback);
 *
 * // es2017 example, though `asyncify` is not needed if your JS environment
 * // supports async functions out of the box
 * var q = async.queue(async.asyncify(async function(file) {
 *     var intermediateStep = await processFile(file);
 *     return await somePromise(intermediateStep)
 * }));
 *
 * q.push(files);
 */
function asyncify(func) {
    return initialParams(function (args, callback) {
        var result;
        try {
            result = func.apply(this, args);
        } catch (e) {
            return callback(e);
        }
        // if result is Promise object
        if (isObject(result) && typeof result.then === 'function') {
            result.then(function(value) {
                invokeCallback(callback, null, value);
            }, function(err) {
                invokeCallback(callback, err.message ? err : new Error(err));
            });
        } else {
            callback(null, result);
        }
    });
}

function invokeCallback(callback, error, value) {
    try {
        callback(error, value);
    } catch (e) {
        setImmediate$1(rethrow, e);
    }
}

function rethrow(error) {
    throw error;
}

var supportsSymbol = typeof Symbol === 'function';

function isAsync(fn) {
    return supportsSymbol && fn[Symbol.toStringTag] === 'AsyncFunction';
}

function wrapAsync(asyncFn) {
    return isAsync(asyncFn) ? asyncify(asyncFn) : asyncFn;
}

function applyEach$1(eachfn) {
    return function(fns/*, ...args*/) {
        var args = slice(arguments, 1);
        var go = initialParams(function(args, callback) {
            var that = this;
            return eachfn(fns, function (fn, cb) {
                wrapAsync(fn).apply(that, args.concat(cb));
            }, callback);
        });
        if (args.length) {
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
}

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/** Built-in value references. */
var Symbol$1 = root.Symbol;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag$1 = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = Symbol$1 ? Symbol$1.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  value = Object(value);
  return (symToStringTag && symToStringTag in value)
    ? getRawTag(value)
    : objectToString(value);
}

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
var proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

// A temporary value used to identify if the loop should be broken.
// See #1064, #1293
var breakLoop = {};

/**
 * This method returns `undefined`.
 *
 * @static
 * @memberOf _
 * @since 2.3.0
 * @category Util
 * @example
 *
 * _.times(2, _.noop);
 * // => [undefined, undefined]
 */
function noop() {
  // No operation performed.
}

function once(fn) {
    return function () {
        if (fn === null) return;
        var callFn = fn;
        fn = null;
        callFn.apply(this, arguments);
    };
}

var iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator;

var getIterator = function (coll) {
    return iteratorSymbol && coll[iteratorSymbol] && coll[iteratorSymbol]();
};

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = baseIsArguments(function() { return arguments; }()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty$2.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

/** Detect free variable `exports`. */
var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';
var arrayTag = '[object Array]';
var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var funcTag$1 = '[object Function]';
var mapTag = '[object Map]';
var numberTag = '[object Number]';
var objectTag = '[object Object]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike(value) &&
    isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

/** Detect free variable `exports`. */
var freeExports$1 = typeof exports == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule$1 = freeExports$1 && typeof module == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports$1 && freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding('util');
  } catch (e) {}
}());

/* Node.js helper references. */
var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$1.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

  return value === proto;
}

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = overArg(Object.keys, Object);

/** Used for built-in method references. */
var objectProto$4 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$3.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

function createArrayIterator(coll) {
    var i = -1;
    var len = coll.length;
    return function next() {
        return ++i < len ? {value: coll[i], key: i} : null;
    }
}

function createES2015Iterator(iterator) {
    var i = -1;
    return function next() {
        var item = iterator.next();
        if (item.done)
            return null;
        i++;
        return {value: item.value, key: i};
    }
}

function createObjectIterator(obj) {
    var okeys = keys(obj);
    var i = -1;
    var len = okeys.length;
    return function next() {
        var key = okeys[++i];
        return i < len ? {value: obj[key], key: key} : null;
    };
}

function iterator(coll) {
    if (isArrayLike(coll)) {
        return createArrayIterator(coll);
    }

    var iterator = getIterator(coll);
    return iterator ? createES2015Iterator(iterator) : createObjectIterator(coll);
}

function onlyOnce(fn) {
    return function() {
        if (fn === null) throw new Error("Callback was already called.");
        var callFn = fn;
        fn = null;
        callFn.apply(this, arguments);
    };
}

function _eachOfLimit(limit) {
    return function (obj, iteratee, callback) {
        callback = once(callback || noop);
        if (limit <= 0 || !obj) {
            return callback(null);
        }
        var nextElem = iterator(obj);
        var done = false;
        var running = 0;

        function iterateeCallback(err, value) {
            running -= 1;
            if (err) {
                done = true;
                callback(err);
            }
            else if (value === breakLoop || (done && running <= 0)) {
                done = true;
                return callback(null);
            }
            else {
                replenish();
            }
        }

        function replenish () {
            while (running < limit && !done) {
                var elem = nextElem();
                if (elem === null) {
                    done = true;
                    if (running <= 0) {
                        callback(null);
                    }
                    return;
                }
                running += 1;
                iteratee(elem.value, elem.key, onlyOnce(iterateeCallback));
            }
        }

        replenish();
    };
}

/**
 * The same as [`eachOf`]{@link module:Collections.eachOf} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name eachOfLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.eachOf]{@link module:Collections.eachOf}
 * @alias forEachOfLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each
 * item in `coll`. The `key` is the item's key, or index in the case of an
 * array.
 * Invoked with (item, key, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 */
function eachOfLimit(coll, limit, iteratee, callback) {
    _eachOfLimit(limit)(coll, wrapAsync(iteratee), callback);
}

function doLimit(fn, limit) {
    return function (iterable, iteratee, callback) {
        return fn(iterable, limit, iteratee, callback);
    };
}

// eachOf implementation optimized for array-likes
function eachOfArrayLike(coll, iteratee, callback) {
    callback = once(callback || noop);
    var index = 0,
        completed = 0,
        length = coll.length;
    if (length === 0) {
        callback(null);
    }

    function iteratorCallback(err, value) {
        if (err) {
            callback(err);
        } else if ((++completed === length) || value === breakLoop) {
            callback(null);
        }
    }

    for (; index < length; index++) {
        iteratee(coll[index], index, onlyOnce(iteratorCallback));
    }
}

// a generic version of eachOf which can handle array, object, and iterator cases.
var eachOfGeneric = doLimit(eachOfLimit, Infinity);

/**
 * Like [`each`]{@link module:Collections.each}, except that it passes the key (or index) as the second argument
 * to the iteratee.
 *
 * @name eachOf
 * @static
 * @memberOf module:Collections
 * @method
 * @alias forEachOf
 * @category Collection
 * @see [async.each]{@link module:Collections.each}
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A function to apply to each
 * item in `coll`.
 * The `key` is the item's key, or index in the case of an array.
 * Invoked with (item, key, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 * @example
 *
 * var obj = {dev: "/dev.json", test: "/test.json", prod: "/prod.json"};
 * var configs = {};
 *
 * async.forEachOf(obj, function (value, key, callback) {
 *     fs.readFile(__dirname + value, "utf8", function (err, data) {
 *         if (err) return callback(err);
 *         try {
 *             configs[key] = JSON.parse(data);
 *         } catch (e) {
 *             return callback(e);
 *         }
 *         callback();
 *     });
 * }, function (err) {
 *     if (err) console.error(err.message);
 *     // configs is now a map of JSON data
 *     doSomethingWith(configs);
 * });
 */
var eachOf = function(coll, iteratee, callback) {
    var eachOfImplementation = isArrayLike(coll) ? eachOfArrayLike : eachOfGeneric;
    eachOfImplementation(coll, wrapAsync(iteratee), callback);
};

function doParallel(fn) {
    return function (obj, iteratee, callback) {
        return fn(eachOf, obj, wrapAsync(iteratee), callback);
    };
}

function _asyncMap(eachfn, arr, iteratee, callback) {
    callback = callback || noop;
    arr = arr || [];
    var results = [];
    var counter = 0;
    var _iteratee = wrapAsync(iteratee);

    eachfn(arr, function (value, _, callback) {
        var index = counter++;
        _iteratee(value, function (err, v) {
            results[index] = v;
            callback(err);
        });
    }, function (err) {
        callback(err, results);
    });
}

/**
 * Produces a new collection of values by mapping each value in `coll` through
 * the `iteratee` function. The `iteratee` is called with an item from `coll`
 * and a callback for when it has finished processing. Each of these callback
 * takes 2 arguments: an `error`, and the transformed item from `coll`. If
 * `iteratee` passes an error to its callback, the main `callback` (for the
 * `map` function) is immediately called with the error.
 *
 * Note, that since this function applies the `iteratee` to each item in
 * parallel, there is no guarantee that the `iteratee` functions will complete
 * in order. However, the results array will be in the same order as the
 * original `coll`.
 *
 * If `map` is passed an Object, the results will be an Array.  The results
 * will roughly be in the order of the original Objects' keys (but this can
 * vary across JavaScript engines).
 *
 * @name map
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with the transformed item.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Results is an Array of the
 * transformed items from the `coll`. Invoked with (err, results).
 * @example
 *
 * async.map(['file1','file2','file3'], fs.stat, function(err, results) {
 *     // results is now an array of stats for each file
 * });
 */
var map = doParallel(_asyncMap);

/**
 * Applies the provided arguments to each function in the array, calling
 * `callback` after all functions have completed. If you only provide the first
 * argument, `fns`, then it will return a function which lets you pass in the
 * arguments as if it were a single function call. If more arguments are
 * provided, `callback` is required while `args` is still optional.
 *
 * @name applyEach
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array|Iterable|Object} fns - A collection of {@link AsyncFunction}s
 * to all call with the same arguments
 * @param {...*} [args] - any number of separate arguments to pass to the
 * function.
 * @param {Function} [callback] - the final argument should be the callback,
 * called when all functions have completed processing.
 * @returns {Function} - If only the first argument, `fns`, is provided, it will
 * return a function which lets you pass in the arguments as if it were a single
 * function call. The signature is `(..args, callback)`. If invoked with any
 * arguments, `callback` is required.
 * @example
 *
 * async.applyEach([enableSearch, updateSchema], 'bucket', callback);
 *
 * // partial application example:
 * async.each(
 *     buckets,
 *     async.applyEach([enableSearch, updateSchema]),
 *     callback
 * );
 */
var applyEach = applyEach$1(map);

function doParallelLimit(fn) {
    return function (obj, limit, iteratee, callback) {
        return fn(_eachOfLimit(limit), obj, wrapAsync(iteratee), callback);
    };
}

/**
 * The same as [`map`]{@link module:Collections.map} but runs a maximum of `limit` async operations at a time.
 *
 * @name mapLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.map]{@link module:Collections.map}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with the transformed item.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Results is an array of the
 * transformed items from the `coll`. Invoked with (err, results).
 */
var mapLimit = doParallelLimit(_asyncMap);

/**
 * The same as [`map`]{@link module:Collections.map} but runs only a single async operation at a time.
 *
 * @name mapSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.map]{@link module:Collections.map}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with the transformed item.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Results is an array of the
 * transformed items from the `coll`. Invoked with (err, results).
 */
var mapSeries = doLimit(mapLimit, 1);

/**
 * The same as [`applyEach`]{@link module:ControlFlow.applyEach} but runs only a single async operation at a time.
 *
 * @name applyEachSeries
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.applyEach]{@link module:ControlFlow.applyEach}
 * @category Control Flow
 * @param {Array|Iterable|Object} fns - A collection of {@link AsyncFunction}s to all
 * call with the same arguments
 * @param {...*} [args] - any number of separate arguments to pass to the
 * function.
 * @param {Function} [callback] - the final argument should be the callback,
 * called when all functions have completed processing.
 * @returns {Function} - If only the first argument is provided, it will return
 * a function which lets you pass in the arguments as if it were a single
 * function call.
 */
var applyEachSeries = applyEach$1(mapSeries);

/**
 * Creates a continuation function with some arguments already applied.
 *
 * Useful as a shorthand when combined with other control flow functions. Any
 * arguments passed to the returned function are added to the arguments
 * originally passed to apply.
 *
 * @name apply
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {Function} fn - The function you want to eventually apply all
 * arguments to. Invokes with (arguments...).
 * @param {...*} arguments... - Any number of arguments to automatically apply
 * when the continuation is called.
 * @returns {Function} the partially-applied function
 * @example
 *
 * // using apply
 * async.parallel([
 *     async.apply(fs.writeFile, 'testfile1', 'test1'),
 *     async.apply(fs.writeFile, 'testfile2', 'test2')
 * ]);
 *
 *
 * // the same process without using apply
 * async.parallel([
 *     function(callback) {
 *         fs.writeFile('testfile1', 'test1', callback);
 *     },
 *     function(callback) {
 *         fs.writeFile('testfile2', 'test2', callback);
 *     }
 * ]);
 *
 * // It's possible to pass any number of additional arguments when calling the
 * // continuation:
 *
 * node> var fn = async.apply(sys.puts, 'one');
 * node> fn('two', 'three');
 * one
 * two
 * three
 */
var apply = function(fn/*, ...args*/) {
    var args = slice(arguments, 1);
    return function(/*callArgs*/) {
        var callArgs = slice(arguments);
        return fn.apply(null, args.concat(callArgs));
    };
};

/**
 * A specialized version of `_.forEach` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns `array`.
 */
function arrayEach(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (iteratee(array[index], index, array) === false) {
      break;
    }
  }
  return array;
}

/**
 * Creates a base function for methods like `_.forIn` and `_.forOwn`.
 *
 * @private
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Function} Returns the new base function.
 */
function createBaseFor(fromRight) {
  return function(object, iteratee, keysFunc) {
    var index = -1,
        iterable = Object(object),
        props = keysFunc(object),
        length = props.length;

    while (length--) {
      var key = props[fromRight ? length : ++index];
      if (iteratee(iterable[key], key, iterable) === false) {
        break;
      }
    }
    return object;
  };
}

/**
 * The base implementation of `baseForOwn` which iterates over `object`
 * properties returned by `keysFunc` and invokes `iteratee` for each property.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @returns {Object} Returns `object`.
 */
var baseFor = createBaseFor();

/**
 * The base implementation of `_.forOwn` without support for iteratee shorthands.
 *
 * @private
 * @param {Object} object The object to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Object} Returns `object`.
 */
function baseForOwn(object, iteratee) {
  return object && baseFor(object, iteratee, keys);
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while ((fromRight ? index-- : ++index < length)) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/**
 * A specialized version of `_.indexOf` which performs strict equality
 * comparisons of values, i.e. `===`.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function strictIndexOf(array, value, fromIndex) {
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  return value === value
    ? strictIndexOf(array, value, fromIndex)
    : baseFindIndex(array, baseIsNaN, fromIndex);
}

/**
 * Determines the best order for running the {@link AsyncFunction}s in `tasks`, based on
 * their requirements. Each function can optionally depend on other functions
 * being completed first, and each function is run as soon as its requirements
 * are satisfied.
 *
 * If any of the {@link AsyncFunction}s pass an error to their callback, the `auto` sequence
 * will stop. Further tasks will not execute (so any other functions depending
 * on it will not run), and the main `callback` is immediately called with the
 * error.
 *
 * {@link AsyncFunction}s also receive an object containing the results of functions which
 * have completed so far as the first argument, if they have dependencies. If a
 * task function has no dependencies, it will only be passed a callback.
 *
 * @name auto
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Object} tasks - An object. Each of its properties is either a
 * function or an array of requirements, with the {@link AsyncFunction} itself the last item
 * in the array. The object's key of a property serves as the name of the task
 * defined by that property, i.e. can be used when specifying requirements for
 * other tasks. The function receives one or two arguments:
 * * a `results` object, containing the results of the previously executed
 *   functions, only passed if the task has any dependencies,
 * * a `callback(err, result)` function, which must be called when finished,
 *   passing an `error` (which can be `null`) and the result of the function's
 *   execution.
 * @param {number} [concurrency=Infinity] - An optional `integer` for
 * determining the maximum number of tasks that can be run in parallel. By
 * default, as many as possible.
 * @param {Function} [callback] - An optional callback which is called when all
 * the tasks have been completed. It receives the `err` argument if any `tasks`
 * pass an error to their callback. Results are always returned; however, if an
 * error occurs, no further `tasks` will be performed, and the results object
 * will only contain partial results. Invoked with (err, results).
 * @returns undefined
 * @example
 *
 * async.auto({
 *     // this function will just be passed a callback
 *     readData: async.apply(fs.readFile, 'data.txt', 'utf-8'),
 *     showData: ['readData', function(results, cb) {
 *         // results.readData is the file's contents
 *         // ...
 *     }]
 * }, callback);
 *
 * async.auto({
 *     get_data: function(callback) {
 *         console.log('in get_data');
 *         // async code to get some data
 *         callback(null, 'data', 'converted to array');
 *     },
 *     make_folder: function(callback) {
 *         console.log('in make_folder');
 *         // async code to create a directory to store a file in
 *         // this is run at the same time as getting the data
 *         callback(null, 'folder');
 *     },
 *     write_file: ['get_data', 'make_folder', function(results, callback) {
 *         console.log('in write_file', JSON.stringify(results));
 *         // once there is some data and the directory exists,
 *         // write the data to a file in the directory
 *         callback(null, 'filename');
 *     }],
 *     email_link: ['write_file', function(results, callback) {
 *         console.log('in email_link', JSON.stringify(results));
 *         // once the file is written let's email a link to it...
 *         // results.write_file contains the filename returned by write_file.
 *         callback(null, {'file':results.write_file, 'email':'user@example.com'});
 *     }]
 * }, function(err, results) {
 *     console.log('err = ', err);
 *     console.log('results = ', results);
 * });
 */
var auto = function (tasks, concurrency, callback) {
    if (typeof concurrency === 'function') {
        // concurrency is optional, shift the args.
        callback = concurrency;
        concurrency = null;
    }
    callback = once(callback || noop);
    var keys$$1 = keys(tasks);
    var numTasks = keys$$1.length;
    if (!numTasks) {
        return callback(null);
    }
    if (!concurrency) {
        concurrency = numTasks;
    }

    var results = {};
    var runningTasks = 0;
    var hasError = false;

    var listeners = Object.create(null);

    var readyTasks = [];

    // for cycle detection:
    var readyToCheck = []; // tasks that have been identified as reachable
    // without the possibility of returning to an ancestor task
    var uncheckedDependencies = {};

    baseForOwn(tasks, function (task, key) {
        if (!isArray(task)) {
            // no dependencies
            enqueueTask(key, [task]);
            readyToCheck.push(key);
            return;
        }

        var dependencies = task.slice(0, task.length - 1);
        var remainingDependencies = dependencies.length;
        if (remainingDependencies === 0) {
            enqueueTask(key, task);
            readyToCheck.push(key);
            return;
        }
        uncheckedDependencies[key] = remainingDependencies;

        arrayEach(dependencies, function (dependencyName) {
            if (!tasks[dependencyName]) {
                throw new Error('async.auto task `' + key +
                    '` has a non-existent dependency `' +
                    dependencyName + '` in ' +
                    dependencies.join(', '));
            }
            addListener(dependencyName, function () {
                remainingDependencies--;
                if (remainingDependencies === 0) {
                    enqueueTask(key, task);
                }
            });
        });
    });

    checkForDeadlocks();
    processQueue();

    function enqueueTask(key, task) {
        readyTasks.push(function () {
            runTask(key, task);
        });
    }

    function processQueue() {
        if (readyTasks.length === 0 && runningTasks === 0) {
            return callback(null, results);
        }
        while(readyTasks.length && runningTasks < concurrency) {
            var run = readyTasks.shift();
            run();
        }

    }

    function addListener(taskName, fn) {
        var taskListeners = listeners[taskName];
        if (!taskListeners) {
            taskListeners = listeners[taskName] = [];
        }

        taskListeners.push(fn);
    }

    function taskComplete(taskName) {
        var taskListeners = listeners[taskName] || [];
        arrayEach(taskListeners, function (fn) {
            fn();
        });
        processQueue();
    }


    function runTask(key, task) {
        if (hasError) return;

        var taskCallback = onlyOnce(function(err, result) {
            runningTasks--;
            if (arguments.length > 2) {
                result = slice(arguments, 1);
            }
            if (err) {
                var safeResults = {};
                baseForOwn(results, function(val, rkey) {
                    safeResults[rkey] = val;
                });
                safeResults[key] = result;
                hasError = true;
                listeners = Object.create(null);

                callback(err, safeResults);
            } else {
                results[key] = result;
                taskComplete(key);
            }
        });

        runningTasks++;
        var taskFn = wrapAsync(task[task.length - 1]);
        if (task.length > 1) {
            taskFn(results, taskCallback);
        } else {
            taskFn(taskCallback);
        }
    }

    function checkForDeadlocks() {
        // Kahn's algorithm
        // https://en.wikipedia.org/wiki/Topological_sorting#Kahn.27s_algorithm
        // http://connalle.blogspot.com/2013/10/topological-sortingkahn-algorithm.html
        var currentTask;
        var counter = 0;
        while (readyToCheck.length) {
            currentTask = readyToCheck.pop();
            counter++;
            arrayEach(getDependents(currentTask), function (dependent) {
                if (--uncheckedDependencies[dependent] === 0) {
                    readyToCheck.push(dependent);
                }
            });
        }

        if (counter !== numTasks) {
            throw new Error(
                'async.auto cannot execute tasks due to a recursive dependency'
            );
        }
    }

    function getDependents(taskName) {
        var result = [];
        baseForOwn(tasks, function (task, key) {
            if (isArray(task) && baseIndexOf(task, taskName, 0) >= 0) {
                result.push(key);
            }
        });
        return result;
    }
};

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike(value) && baseGetTag(value) == symbolTag);
}

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = Symbol$1 ? Symbol$1.prototype : undefined;
var symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = (value + '');
  return (result == '0' && (1 / value) == -INFINITY) ? '-0' : result;
}

/**
 * The base implementation of `_.slice` without an iteratee call guard.
 *
 * @private
 * @param {Array} array The array to slice.
 * @param {number} [start=0] The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the slice of `array`.
 */
function baseSlice(array, start, end) {
  var index = -1,
      length = array.length;

  if (start < 0) {
    start = -start > length ? 0 : (length + start);
  }
  end = end > length ? length : end;
  if (end < 0) {
    end += length;
  }
  length = start > end ? 0 : ((end - start) >>> 0);
  start >>>= 0;

  var result = Array(length);
  while (++index < length) {
    result[index] = array[index + start];
  }
  return result;
}

/**
 * Casts `array` to a slice if it's needed.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {number} start The start position.
 * @param {number} [end=array.length] The end position.
 * @returns {Array} Returns the cast slice.
 */
function castSlice(array, start, end) {
  var length = array.length;
  end = end === undefined ? length : end;
  return (!start && end >= length) ? array : baseSlice(array, start, end);
}

/**
 * Used by `_.trim` and `_.trimEnd` to get the index of the last string symbol
 * that is not found in the character symbols.
 *
 * @private
 * @param {Array} strSymbols The string symbols to inspect.
 * @param {Array} chrSymbols The character symbols to find.
 * @returns {number} Returns the index of the last unmatched string symbol.
 */
function charsEndIndex(strSymbols, chrSymbols) {
  var index = strSymbols.length;

  while (index-- && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
  return index;
}

/**
 * Used by `_.trim` and `_.trimStart` to get the index of the first string symbol
 * that is not found in the character symbols.
 *
 * @private
 * @param {Array} strSymbols The string symbols to inspect.
 * @param {Array} chrSymbols The character symbols to find.
 * @returns {number} Returns the index of the first unmatched string symbol.
 */
function charsStartIndex(strSymbols, chrSymbols) {
  var index = -1,
      length = strSymbols.length;

  while (++index < length && baseIndexOf(chrSymbols, strSymbols[index], 0) > -1) {}
  return index;
}

/**
 * Converts an ASCII `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function asciiToArray(string) {
  return string.split('');
}

/** Used to compose unicode character classes. */
var rsAstralRange = '\\ud800-\\udfff';
var rsComboMarksRange = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange = '\\u20d0-\\u20f0';
var rsVarRange = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsZWJ = '\\u200d';

/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp('[' + rsZWJ + rsAstralRange  + rsComboMarksRange + rsComboSymbolsRange + rsVarRange + ']');

/**
 * Checks if `string` contains Unicode symbols.
 *
 * @private
 * @param {string} string The string to inspect.
 * @returns {boolean} Returns `true` if a symbol is found, else `false`.
 */
function hasUnicode(string) {
  return reHasUnicode.test(string);
}

/** Used to compose unicode character classes. */
var rsAstralRange$1 = '\\ud800-\\udfff';
var rsComboMarksRange$1 = '\\u0300-\\u036f\\ufe20-\\ufe23';
var rsComboSymbolsRange$1 = '\\u20d0-\\u20f0';
var rsVarRange$1 = '\\ufe0e\\ufe0f';

/** Used to compose unicode capture groups. */
var rsAstral = '[' + rsAstralRange$1 + ']';
var rsCombo = '[' + rsComboMarksRange$1 + rsComboSymbolsRange$1 + ']';
var rsFitz = '\\ud83c[\\udffb-\\udfff]';
var rsModifier = '(?:' + rsCombo + '|' + rsFitz + ')';
var rsNonAstral = '[^' + rsAstralRange$1 + ']';
var rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
var rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
var rsZWJ$1 = '\\u200d';

/** Used to compose unicode regexes. */
var reOptMod = rsModifier + '?';
var rsOptVar = '[' + rsVarRange$1 + ']?';
var rsOptJoin = '(?:' + rsZWJ$1 + '(?:' + [rsNonAstral, rsRegional, rsSurrPair].join('|') + ')' + rsOptVar + reOptMod + ')*';
var rsSeq = rsOptVar + reOptMod + rsOptJoin;
var rsSymbol = '(?:' + [rsNonAstral + rsCombo + '?', rsCombo, rsRegional, rsSurrPair, rsAstral].join('|') + ')';

/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + '(?=' + rsFitz + ')|' + rsSymbol + rsSeq, 'g');

/**
 * Converts a Unicode `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function unicodeToArray(string) {
  return string.match(reUnicode) || [];
}

/**
 * Converts `string` to an array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the converted array.
 */
function stringToArray(string) {
  return hasUnicode(string)
    ? unicodeToArray(string)
    : asciiToArray(string);
}

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/**
 * Removes leading and trailing whitespace or specified characters from `string`.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category String
 * @param {string} [string=''] The string to trim.
 * @param {string} [chars=whitespace] The characters to trim.
 * @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
 * @returns {string} Returns the trimmed string.
 * @example
 *
 * _.trim('  abc  ');
 * // => 'abc'
 *
 * _.trim('-_-abc-_-', '_-');
 * // => 'abc'
 *
 * _.map(['  foo  ', '  bar  '], _.trim);
 * // => ['foo', 'bar']
 */
function trim(string, chars, guard) {
  string = toString(string);
  if (string && (guard || chars === undefined)) {
    return string.replace(reTrim, '');
  }
  if (!string || !(chars = baseToString(chars))) {
    return string;
  }
  var strSymbols = stringToArray(string),
      chrSymbols = stringToArray(chars),
      start = charsStartIndex(strSymbols, chrSymbols),
      end = charsEndIndex(strSymbols, chrSymbols) + 1;

  return castSlice(strSymbols, start, end).join('');
}

var FN_ARGS = /^(?:async\s+)?(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /(=.+)?(\s*)$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function parseParams(func) {
    func = func.toString().replace(STRIP_COMMENTS, '');
    func = func.match(FN_ARGS)[2].replace(' ', '');
    func = func ? func.split(FN_ARG_SPLIT) : [];
    func = func.map(function (arg){
        return trim(arg.replace(FN_ARG, ''));
    });
    return func;
}

/**
 * A dependency-injected version of the [async.auto]{@link module:ControlFlow.auto} function. Dependent
 * tasks are specified as parameters to the function, after the usual callback
 * parameter, with the parameter names matching the names of the tasks it
 * depends on. This can provide even more readable task graphs which can be
 * easier to maintain.
 *
 * If a final callback is specified, the task results are similarly injected,
 * specified as named parameters after the initial error parameter.
 *
 * The autoInject function is purely syntactic sugar and its semantics are
 * otherwise equivalent to [async.auto]{@link module:ControlFlow.auto}.
 *
 * @name autoInject
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.auto]{@link module:ControlFlow.auto}
 * @category Control Flow
 * @param {Object} tasks - An object, each of whose properties is an {@link AsyncFunction} of
 * the form 'func([dependencies...], callback). The object's key of a property
 * serves as the name of the task defined by that property, i.e. can be used
 * when specifying requirements for other tasks.
 * * The `callback` parameter is a `callback(err, result)` which must be called
 *   when finished, passing an `error` (which can be `null`) and the result of
 *   the function's execution. The remaining parameters name other tasks on
 *   which the task is dependent, and the results from those tasks are the
 *   arguments of those parameters.
 * @param {Function} [callback] - An optional callback which is called when all
 * the tasks have been completed. It receives the `err` argument if any `tasks`
 * pass an error to their callback, and a `results` object with any completed
 * task results, similar to `auto`.
 * @example
 *
 * //  The example from `auto` can be rewritten as follows:
 * async.autoInject({
 *     get_data: function(callback) {
 *         // async code to get some data
 *         callback(null, 'data', 'converted to array');
 *     },
 *     make_folder: function(callback) {
 *         // async code to create a directory to store a file in
 *         // this is run at the same time as getting the data
 *         callback(null, 'folder');
 *     },
 *     write_file: function(get_data, make_folder, callback) {
 *         // once there is some data and the directory exists,
 *         // write the data to a file in the directory
 *         callback(null, 'filename');
 *     },
 *     email_link: function(write_file, callback) {
 *         // once the file is written let's email a link to it...
 *         // write_file contains the filename returned by write_file.
 *         callback(null, {'file':write_file, 'email':'user@example.com'});
 *     }
 * }, function(err, results) {
 *     console.log('err = ', err);
 *     console.log('email_link = ', results.email_link);
 * });
 *
 * // If you are using a JS minifier that mangles parameter names, `autoInject`
 * // will not work with plain functions, since the parameter names will be
 * // collapsed to a single letter identifier.  To work around this, you can
 * // explicitly specify the names of the parameters your task function needs
 * // in an array, similar to Angular.js dependency injection.
 *
 * // This still has an advantage over plain `auto`, since the results a task
 * // depends on are still spread into arguments.
 * async.autoInject({
 *     //...
 *     write_file: ['get_data', 'make_folder', function(get_data, make_folder, callback) {
 *         callback(null, 'filename');
 *     }],
 *     email_link: ['write_file', function(write_file, callback) {
 *         callback(null, {'file':write_file, 'email':'user@example.com'});
 *     }]
 *     //...
 * }, function(err, results) {
 *     console.log('err = ', err);
 *     console.log('email_link = ', results.email_link);
 * });
 */
function autoInject(tasks, callback) {
    var newTasks = {};

    baseForOwn(tasks, function (taskFn, key) {
        var params;
        var fnIsAsync = isAsync(taskFn);
        var hasNoDeps =
            (!fnIsAsync && taskFn.length === 1) ||
            (fnIsAsync && taskFn.length === 0);

        if (isArray(taskFn)) {
            params = taskFn.slice(0, -1);
            taskFn = taskFn[taskFn.length - 1];

            newTasks[key] = params.concat(params.length > 0 ? newTask : taskFn);
        } else if (hasNoDeps) {
            // no dependencies, use the function as-is
            newTasks[key] = taskFn;
        } else {
            params = parseParams(taskFn);
            if (taskFn.length === 0 && !fnIsAsync && params.length === 0) {
                throw new Error("autoInject task functions require explicit parameters.");
            }

            // remove callback param
            if (!fnIsAsync) params.pop();

            newTasks[key] = params.concat(newTask);
        }

        function newTask(results, taskCb) {
            var newArgs = arrayMap(params, function (name) {
                return results[name];
            });
            newArgs.push(taskCb);
            wrapAsync(taskFn).apply(null, newArgs);
        }
    });

    auto(newTasks, callback);
}

// Simple doubly linked list (https://en.wikipedia.org/wiki/Doubly_linked_list) implementation
// used for queues. This implementation assumes that the node provided by the user can be modified
// to adjust the next and last properties. We implement only the minimal functionality
// for queue support.
function DLL() {
    this.head = this.tail = null;
    this.length = 0;
}

function setInitial(dll, node) {
    dll.length = 1;
    dll.head = dll.tail = node;
}

DLL.prototype.removeLink = function(node) {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;

    node.prev = node.next = null;
    this.length -= 1;
    return node;
};

DLL.prototype.empty = function () {
    while(this.head) this.shift();
    return this;
};

DLL.prototype.insertAfter = function(node, newNode) {
    newNode.prev = node;
    newNode.next = node.next;
    if (node.next) node.next.prev = newNode;
    else this.tail = newNode;
    node.next = newNode;
    this.length += 1;
};

DLL.prototype.insertBefore = function(node, newNode) {
    newNode.prev = node.prev;
    newNode.next = node;
    if (node.prev) node.prev.next = newNode;
    else this.head = newNode;
    node.prev = newNode;
    this.length += 1;
};

DLL.prototype.unshift = function(node) {
    if (this.head) this.insertBefore(this.head, node);
    else setInitial(this, node);
};

DLL.prototype.push = function(node) {
    if (this.tail) this.insertAfter(this.tail, node);
    else setInitial(this, node);
};

DLL.prototype.shift = function() {
    return this.head && this.removeLink(this.head);
};

DLL.prototype.pop = function() {
    return this.tail && this.removeLink(this.tail);
};

DLL.prototype.toArray = function () {
    var arr = Array(this.length);
    var curr = this.head;
    for(var idx = 0; idx < this.length; idx++) {
        arr[idx] = curr.data;
        curr = curr.next;
    }
    return arr;
};

DLL.prototype.remove = function (testFn) {
    var curr = this.head;
    while(!!curr) {
        var next = curr.next;
        if (testFn(curr)) {
            this.removeLink(curr);
        }
        curr = next;
    }
    return this;
};

function queue(worker, concurrency, payload) {
    if (concurrency == null) {
        concurrency = 1;
    }
    else if(concurrency === 0) {
        throw new Error('Concurrency must not be zero');
    }

    var _worker = wrapAsync(worker);
    var numRunning = 0;
    var workersList = [];

    function _insert(data, insertAtFront, callback) {
        if (callback != null && typeof callback !== 'function') {
            throw new Error('task callback must be a function');
        }
        q.started = true;
        if (!isArray(data)) {
            data = [data];
        }
        if (data.length === 0 && q.idle()) {
            // call drain immediately if there are no tasks
            return setImmediate$1(function() {
                q.drain();
            });
        }

        for (var i = 0, l = data.length; i < l; i++) {
            var item = {
                data: data[i],
                callback: callback || noop
            };

            if (insertAtFront) {
                q._tasks.unshift(item);
            } else {
                q._tasks.push(item);
            }
        }
        setImmediate$1(q.process);
    }

    function _next(tasks) {
        return function(err){
            numRunning -= 1;

            for (var i = 0, l = tasks.length; i < l; i++) {
                var task = tasks[i];

                var index = baseIndexOf(workersList, task, 0);
                if (index >= 0) {
                    workersList.splice(index, 1);
                }

                task.callback.apply(task, arguments);

                if (err != null) {
                    q.error(err, task.data);
                }
            }

            if (numRunning <= (q.concurrency - q.buffer) ) {
                q.unsaturated();
            }

            if (q.idle()) {
                q.drain();
            }
            q.process();
        };
    }

    var isProcessing = false;
    var q = {
        _tasks: new DLL(),
        concurrency: concurrency,
        payload: payload,
        saturated: noop,
        unsaturated:noop,
        buffer: concurrency / 4,
        empty: noop,
        drain: noop,
        error: noop,
        started: false,
        paused: false,
        push: function (data, callback) {
            _insert(data, false, callback);
        },
        kill: function () {
            q.drain = noop;
            q._tasks.empty();
        },
        unshift: function (data, callback) {
            _insert(data, true, callback);
        },
        remove: function (testFn) {
            q._tasks.remove(testFn);
        },
        process: function () {
            // Avoid trying to start too many processing operations. This can occur
            // when callbacks resolve synchronously (#1267).
            if (isProcessing) {
                return;
            }
            isProcessing = true;
            while(!q.paused && numRunning < q.concurrency && q._tasks.length){
                var tasks = [], data = [];
                var l = q._tasks.length;
                if (q.payload) l = Math.min(l, q.payload);
                for (var i = 0; i < l; i++) {
                    var node = q._tasks.shift();
                    tasks.push(node);
                    workersList.push(node);
                    data.push(node.data);
                }

                numRunning += 1;

                if (q._tasks.length === 0) {
                    q.empty();
                }

                if (numRunning === q.concurrency) {
                    q.saturated();
                }

                var cb = onlyOnce(_next(tasks));
                _worker(data, cb);
            }
            isProcessing = false;
        },
        length: function () {
            return q._tasks.length;
        },
        running: function () {
            return numRunning;
        },
        workersList: function () {
            return workersList;
        },
        idle: function() {
            return q._tasks.length + numRunning === 0;
        },
        pause: function () {
            q.paused = true;
        },
        resume: function () {
            if (q.paused === false) { return; }
            q.paused = false;
            setImmediate$1(q.process);
        }
    };
    return q;
}

/**
 * A cargo of tasks for the worker function to complete. Cargo inherits all of
 * the same methods and event callbacks as [`queue`]{@link module:ControlFlow.queue}.
 * @typedef {Object} CargoObject
 * @memberOf module:ControlFlow
 * @property {Function} length - A function returning the number of items
 * waiting to be processed. Invoke like `cargo.length()`.
 * @property {number} payload - An `integer` for determining how many tasks
 * should be process per round. This property can be changed after a `cargo` is
 * created to alter the payload on-the-fly.
 * @property {Function} push - Adds `task` to the `queue`. The callback is
 * called once the `worker` has finished processing the task. Instead of a
 * single task, an array of `tasks` can be submitted. The respective callback is
 * used for every task in the list. Invoke like `cargo.push(task, [callback])`.
 * @property {Function} saturated - A callback that is called when the
 * `queue.length()` hits the concurrency and further tasks will be queued.
 * @property {Function} empty - A callback that is called when the last item
 * from the `queue` is given to a `worker`.
 * @property {Function} drain - A callback that is called when the last item
 * from the `queue` has returned from the `worker`.
 * @property {Function} idle - a function returning false if there are items
 * waiting or being processed, or true if not. Invoke like `cargo.idle()`.
 * @property {Function} pause - a function that pauses the processing of tasks
 * until `resume()` is called. Invoke like `cargo.pause()`.
 * @property {Function} resume - a function that resumes the processing of
 * queued tasks when the queue is paused. Invoke like `cargo.resume()`.
 * @property {Function} kill - a function that removes the `drain` callback and
 * empties remaining tasks from the queue forcing it to go idle. Invoke like `cargo.kill()`.
 */

/**
 * Creates a `cargo` object with the specified payload. Tasks added to the
 * cargo will be processed altogether (up to the `payload` limit). If the
 * `worker` is in progress, the task is queued until it becomes available. Once
 * the `worker` has completed some tasks, each callback of those tasks is
 * called. Check out [these](https://camo.githubusercontent.com/6bbd36f4cf5b35a0f11a96dcd2e97711ffc2fb37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130382f62626330636662302d356632392d313165322d393734662d3333393763363464633835382e676966) [animations](https://camo.githubusercontent.com/f4810e00e1c5f5f8addbe3e9f49064fd5d102699/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f313637363837312f36383130312f38346339323036362d356632392d313165322d383134662d3964336430323431336266642e676966)
 * for how `cargo` and `queue` work.
 *
 * While [`queue`]{@link module:ControlFlow.queue} passes only one task to one of a group of workers
 * at a time, cargo passes an array of tasks to a single worker, repeating
 * when the worker is finished.
 *
 * @name cargo
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.queue]{@link module:ControlFlow.queue}
 * @category Control Flow
 * @param {AsyncFunction} worker - An asynchronous function for processing an array
 * of queued tasks. Invoked with `(tasks, callback)`.
 * @param {number} [payload=Infinity] - An optional `integer` for determining
 * how many tasks should be processed per round; if omitted, the default is
 * unlimited.
 * @returns {module:ControlFlow.CargoObject} A cargo object to manage the tasks. Callbacks can
 * attached as certain properties to listen for specific events during the
 * lifecycle of the cargo and inner queue.
 * @example
 *
 * // create a cargo object with payload 2
 * var cargo = async.cargo(function(tasks, callback) {
 *     for (var i=0; i<tasks.length; i++) {
 *         console.log('hello ' + tasks[i].name);
 *     }
 *     callback();
 * }, 2);
 *
 * // add some items
 * cargo.push({name: 'foo'}, function(err) {
 *     console.log('finished processing foo');
 * });
 * cargo.push({name: 'bar'}, function(err) {
 *     console.log('finished processing bar');
 * });
 * cargo.push({name: 'baz'}, function(err) {
 *     console.log('finished processing baz');
 * });
 */
function cargo(worker, payload) {
    return queue(worker, 1, payload);
}

/**
 * The same as [`eachOf`]{@link module:Collections.eachOf} but runs only a single async operation at a time.
 *
 * @name eachOfSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.eachOf]{@link module:Collections.eachOf}
 * @alias forEachOfSeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * Invoked with (item, key, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Invoked with (err).
 */
var eachOfSeries = doLimit(eachOfLimit, 1);

/**
 * Reduces `coll` into a single value using an async `iteratee` to return each
 * successive step. `memo` is the initial state of the reduction. This function
 * only operates in series.
 *
 * For performance reasons, it may make sense to split a call to this function
 * into a parallel map, and then use the normal `Array.prototype.reduce` on the
 * results. This function is for situations where each step in the reduction
 * needs to be async; if you can get the data before reducing it, then it's
 * probably a good idea to do so.
 *
 * @name reduce
 * @static
 * @memberOf module:Collections
 * @method
 * @alias inject
 * @alias foldl
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {*} memo - The initial state of the reduction.
 * @param {AsyncFunction} iteratee - A function applied to each item in the
 * array to produce the next step in the reduction.
 * The `iteratee` should complete with the next state of the reduction.
 * If the iteratee complete with an error, the reduction is stopped and the
 * main `callback` is immediately called with the error.
 * Invoked with (memo, item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result is the reduced value. Invoked with
 * (err, result).
 * @example
 *
 * async.reduce([1,2,3], 0, function(memo, item, callback) {
 *     // pointless async:
 *     process.nextTick(function() {
 *         callback(null, memo + item)
 *     });
 * }, function(err, result) {
 *     // result is now equal to the last value of memo, which is 6
 * });
 */
function reduce(coll, memo, iteratee, callback) {
    callback = once(callback || noop);
    var _iteratee = wrapAsync(iteratee);
    eachOfSeries(coll, function(x, i, callback) {
        _iteratee(memo, x, function(err, v) {
            memo = v;
            callback(err);
        });
    }, function(err) {
        callback(err, memo);
    });
}

/**
 * Version of the compose function that is more natural to read. Each function
 * consumes the return value of the previous function. It is the equivalent of
 * [compose]{@link module:ControlFlow.compose} with the arguments reversed.
 *
 * Each function is executed with the `this` binding of the composed function.
 *
 * @name seq
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.compose]{@link module:ControlFlow.compose}
 * @category Control Flow
 * @param {...AsyncFunction} functions - the asynchronous functions to compose
 * @returns {Function} a function that composes the `functions` in order
 * @example
 *
 * // Requires lodash (or underscore), express3 and dresende's orm2.
 * // Part of an app, that fetches cats of the logged user.
 * // This example uses `seq` function to avoid overnesting and error
 * // handling clutter.
 * app.get('/cats', function(request, response) {
 *     var User = request.models.User;
 *     async.seq(
 *         _.bind(User.get, User),  // 'User.get' has signature (id, callback(err, data))
 *         function(user, fn) {
 *             user.getCats(fn);      // 'getCats' has signature (callback(err, data))
 *         }
 *     )(req.session.user_id, function (err, cats) {
 *         if (err) {
 *             console.error(err);
 *             response.json({ status: 'error', message: err.message });
 *         } else {
 *             response.json({ status: 'ok', message: 'Cats found', data: cats });
 *         }
 *     });
 * });
 */
function seq(/*...functions*/) {
    var _functions = arrayMap(arguments, wrapAsync);
    return function(/*...args*/) {
        var args = slice(arguments);
        var that = this;

        var cb = args[args.length - 1];
        if (typeof cb == 'function') {
            args.pop();
        } else {
            cb = noop;
        }

        reduce(_functions, args, function(newargs, fn, cb) {
            fn.apply(that, newargs.concat(function(err/*, ...nextargs*/) {
                var nextargs = slice(arguments, 1);
                cb(err, nextargs);
            }));
        },
        function(err, results) {
            cb.apply(that, [err].concat(results));
        });
    };
}

/**
 * Creates a function which is a composition of the passed asynchronous
 * functions. Each function consumes the return value of the function that
 * follows. Composing functions `f()`, `g()`, and `h()` would produce the result
 * of `f(g(h()))`, only this version uses callbacks to obtain the return values.
 *
 * Each function is executed with the `this` binding of the composed function.
 *
 * @name compose
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {...AsyncFunction} functions - the asynchronous functions to compose
 * @returns {Function} an asynchronous function that is the composed
 * asynchronous `functions`
 * @example
 *
 * function add1(n, callback) {
 *     setTimeout(function () {
 *         callback(null, n + 1);
 *     }, 10);
 * }
 *
 * function mul3(n, callback) {
 *     setTimeout(function () {
 *         callback(null, n * 3);
 *     }, 10);
 * }
 *
 * var add1mul3 = async.compose(mul3, add1);
 * add1mul3(4, function (err, result) {
 *     // result now equals 15
 * });
 */
var compose = function(/*...args*/) {
    return seq.apply(null, slice(arguments).reverse());
};

var _concat = Array.prototype.concat;

/**
 * The same as [`concat`]{@link module:Collections.concat} but runs a maximum of `limit` async operations at a time.
 *
 * @name concatLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.concat]{@link module:Collections.concat}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`,
 * which should use an array as its result. Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished, or an error occurs. Results is an array
 * containing the concatenated results of the `iteratee` function. Invoked with
 * (err, results).
 */
var concatLimit = function(coll, limit, iteratee, callback) {
    callback = callback || noop;
    var _iteratee = wrapAsync(iteratee);
    mapLimit(coll, limit, function(val, callback) {
        _iteratee(val, function(err /*, ...args*/) {
            if (err) return callback(err);
            return callback(null, slice(arguments, 1));
        });
    }, function(err, mapResults) {
        var result = [];
        for (var i = 0; i < mapResults.length; i++) {
            if (mapResults[i]) {
                result = _concat.apply(result, mapResults[i]);
            }
        }

        return callback(err, result);
    });
};

/**
 * Applies `iteratee` to each item in `coll`, concatenating the results. Returns
 * the concatenated list. The `iteratee`s are called in parallel, and the
 * results are concatenated as they return. There is no guarantee that the
 * results array will be returned in the original order of `coll` passed to the
 * `iteratee` function.
 *
 * @name concat
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`,
 * which should use an array as its result. Invoked with (item, callback).
 * @param {Function} [callback(err)] - A callback which is called after all the
 * `iteratee` functions have finished, or an error occurs. Results is an array
 * containing the concatenated results of the `iteratee` function. Invoked with
 * (err, results).
 * @example
 *
 * async.concat(['dir1','dir2','dir3'], fs.readdir, function(err, files) {
 *     // files is now a list of filenames that exist in the 3 directories
 * });
 */
var concat = doLimit(concatLimit, Infinity);

/**
 * The same as [`concat`]{@link module:Collections.concat} but runs only a single async operation at a time.
 *
 * @name concatSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.concat]{@link module:Collections.concat}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A function to apply to each item in `coll`.
 * The iteratee should complete with an array an array of results.
 * Invoked with (item, callback).
 * @param {Function} [callback(err)] - A callback which is called after all the
 * `iteratee` functions have finished, or an error occurs. Results is an array
 * containing the concatenated results of the `iteratee` function. Invoked with
 * (err, results).
 */
var concatSeries = doLimit(concatLimit, 1);

/**
 * Returns a function that when called, calls-back with the values provided.
 * Useful as the first function in a [`waterfall`]{@link module:ControlFlow.waterfall}, or for plugging values in to
 * [`auto`]{@link module:ControlFlow.auto}.
 *
 * @name constant
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {...*} arguments... - Any number of arguments to automatically invoke
 * callback with.
 * @returns {AsyncFunction} Returns a function that when invoked, automatically
 * invokes the callback with the previous given arguments.
 * @example
 *
 * async.waterfall([
 *     async.constant(42),
 *     function (value, next) {
 *         // value === 42
 *     },
 *     //...
 * ], callback);
 *
 * async.waterfall([
 *     async.constant(filename, "utf8"),
 *     fs.readFile,
 *     function (fileData, next) {
 *         //...
 *     }
 *     //...
 * ], callback);
 *
 * async.auto({
 *     hostname: async.constant("https://server.net/"),
 *     port: findFreePort,
 *     launchServer: ["hostname", "port", function (options, cb) {
 *         startServer(options, cb);
 *     }],
 *     //...
 * }, callback);
 */
var constant = function(/*...values*/) {
    var values = slice(arguments);
    var args = [null].concat(values);
    return function (/*...ignoredArgs, callback*/) {
        var callback = arguments[arguments.length - 1];
        return callback.apply(this, args);
    };
};

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

function _createTester(check, getResult) {
    return function(eachfn, arr, iteratee, cb) {
        cb = cb || noop;
        var testPassed = false;
        var testResult;
        eachfn(arr, function(value, _, callback) {
            iteratee(value, function(err, result) {
                if (err) {
                    callback(err);
                } else if (check(result) && !testResult) {
                    testPassed = true;
                    testResult = getResult(true, value);
                    callback(null, breakLoop);
                } else {
                    callback();
                }
            });
        }, function(err) {
            if (err) {
                cb(err);
            } else {
                cb(null, testPassed ? testResult : getResult(false));
            }
        });
    };
}

function _findGetResult(v, x) {
    return x;
}

/**
 * Returns the first value in `coll` that passes an async truth test. The
 * `iteratee` is applied in parallel, meaning the first iteratee to return
 * `true` will fire the detect `callback` with that result. That means the
 * result might not be the first item in the original `coll` (in terms of order)
 * that passes the test.

 * If order within the original `coll` is important, then look at
 * [`detectSeries`]{@link module:Collections.detectSeries}.
 *
 * @name detect
 * @static
 * @memberOf module:Collections
 * @method
 * @alias find
 * @category Collections
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.
 * The iteratee must complete with a boolean value as its result.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the `iteratee` functions have finished.
 * Result will be the first item in the array that passes the truth test
 * (iteratee) or the value `undefined` if none passed. Invoked with
 * (err, result).
 * @example
 *
 * async.detect(['file1','file2','file3'], function(filePath, callback) {
 *     fs.access(filePath, function(err) {
 *         callback(null, !err)
 *     });
 * }, function(err, result) {
 *     // result now equals the first file in the list that exists
 * });
 */
var detect = doParallel(_createTester(identity, _findGetResult));

/**
 * The same as [`detect`]{@link module:Collections.detect} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name detectLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.detect]{@link module:Collections.detect}
 * @alias findLimit
 * @category Collections
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.
 * The iteratee must complete with a boolean value as its result.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the `iteratee` functions have finished.
 * Result will be the first item in the array that passes the truth test
 * (iteratee) or the value `undefined` if none passed. Invoked with
 * (err, result).
 */
var detectLimit = doParallelLimit(_createTester(identity, _findGetResult));

/**
 * The same as [`detect`]{@link module:Collections.detect} but runs only a single async operation at a time.
 *
 * @name detectSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.detect]{@link module:Collections.detect}
 * @alias findSeries
 * @category Collections
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A truth test to apply to each item in `coll`.
 * The iteratee must complete with a boolean value as its result.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the `iteratee` functions have finished.
 * Result will be the first item in the array that passes the truth test
 * (iteratee) or the value `undefined` if none passed. Invoked with
 * (err, result).
 */
var detectSeries = doLimit(detectLimit, 1);

function consoleFunc(name) {
    return function (fn/*, ...args*/) {
        var args = slice(arguments, 1);
        args.push(function (err/*, ...args*/) {
            var args = slice(arguments, 1);
            if (typeof console === 'object') {
                if (err) {
                    if (console.error) {
                        console.error(err);
                    }
                } else if (console[name]) {
                    arrayEach(args, function (x) {
                        console[name](x);
                    });
                }
            }
        });
        wrapAsync(fn).apply(null, args);
    };
}

/**
 * Logs the result of an [`async` function]{@link AsyncFunction} to the
 * `console` using `console.dir` to display the properties of the resulting object.
 * Only works in Node.js or in browsers that support `console.dir` and
 * `console.error` (such as FF and Chrome).
 * If multiple arguments are returned from the async function,
 * `console.dir` is called on each argument in order.
 *
 * @name dir
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} function - The function you want to eventually apply
 * all arguments to.
 * @param {...*} arguments... - Any number of arguments to apply to the function.
 * @example
 *
 * // in a module
 * var hello = function(name, callback) {
 *     setTimeout(function() {
 *         callback(null, {hello: name});
 *     }, 1000);
 * };
 *
 * // in the node repl
 * node> async.dir(hello, 'world');
 * {hello: 'world'}
 */
var dir = consoleFunc('dir');

/**
 * The post-check version of [`during`]{@link module:ControlFlow.during}. To reflect the difference in
 * the order of operations, the arguments `test` and `fn` are switched.
 *
 * Also a version of [`doWhilst`]{@link module:ControlFlow.doWhilst} with asynchronous `test` function.
 * @name doDuring
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.during]{@link module:ControlFlow.during}
 * @category Control Flow
 * @param {AsyncFunction} fn - An async function which is called each time
 * `test` passes. Invoked with (callback).
 * @param {AsyncFunction} test - asynchronous truth test to perform before each
 * execution of `fn`. Invoked with (...args, callback), where `...args` are the
 * non-error args from the previous callback of `fn`.
 * @param {Function} [callback] - A callback which is called after the test
 * function has failed and repeated execution of `fn` has stopped. `callback`
 * will be passed an error if one occurred, otherwise `null`.
 */
function doDuring(fn, test, callback) {
    callback = onlyOnce(callback || noop);
    var _fn = wrapAsync(fn);
    var _test = wrapAsync(test);

    function next(err/*, ...args*/) {
        if (err) return callback(err);
        var args = slice(arguments, 1);
        args.push(check);
        _test.apply(this, args);
    }

    function check(err, truth) {
        if (err) return callback(err);
        if (!truth) return callback(null);
        _fn(next);
    }

    check(null, true);

}

/**
 * The post-check version of [`whilst`]{@link module:ControlFlow.whilst}. To reflect the difference in
 * the order of operations, the arguments `test` and `iteratee` are switched.
 *
 * `doWhilst` is to `whilst` as `do while` is to `while` in plain JavaScript.
 *
 * @name doWhilst
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.whilst]{@link module:ControlFlow.whilst}
 * @category Control Flow
 * @param {AsyncFunction} iteratee - A function which is called each time `test`
 * passes. Invoked with (callback).
 * @param {Function} test - synchronous truth test to perform after each
 * execution of `iteratee`. Invoked with any non-error callback results of
 * `iteratee`.
 * @param {Function} [callback] - A callback which is called after the test
 * function has failed and repeated execution of `iteratee` has stopped.
 * `callback` will be passed an error and any arguments passed to the final
 * `iteratee`'s callback. Invoked with (err, [results]);
 */
function doWhilst(iteratee, test, callback) {
    callback = onlyOnce(callback || noop);
    var _iteratee = wrapAsync(iteratee);
    var next = function(err/*, ...args*/) {
        if (err) return callback(err);
        var args = slice(arguments, 1);
        if (test.apply(this, args)) return _iteratee(next);
        callback.apply(null, [null].concat(args));
    };
    _iteratee(next);
}

/**
 * Like ['doWhilst']{@link module:ControlFlow.doWhilst}, except the `test` is inverted. Note the
 * argument ordering differs from `until`.
 *
 * @name doUntil
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.doWhilst]{@link module:ControlFlow.doWhilst}
 * @category Control Flow
 * @param {AsyncFunction} iteratee - An async function which is called each time
 * `test` fails. Invoked with (callback).
 * @param {Function} test - synchronous truth test to perform after each
 * execution of `iteratee`. Invoked with any non-error callback results of
 * `iteratee`.
 * @param {Function} [callback] - A callback which is called after the test
 * function has passed and repeated execution of `iteratee` has stopped. `callback`
 * will be passed an error and any arguments passed to the final `iteratee`'s
 * callback. Invoked with (err, [results]);
 */
function doUntil(iteratee, test, callback) {
    doWhilst(iteratee, function() {
        return !test.apply(this, arguments);
    }, callback);
}

/**
 * Like [`whilst`]{@link module:ControlFlow.whilst}, except the `test` is an asynchronous function that
 * is passed a callback in the form of `function (err, truth)`. If error is
 * passed to `test` or `fn`, the main callback is immediately called with the
 * value of the error.
 *
 * @name during
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.whilst]{@link module:ControlFlow.whilst}
 * @category Control Flow
 * @param {AsyncFunction} test - asynchronous truth test to perform before each
 * execution of `fn`. Invoked with (callback).
 * @param {AsyncFunction} fn - An async function which is called each time
 * `test` passes. Invoked with (callback).
 * @param {Function} [callback] - A callback which is called after the test
 * function has failed and repeated execution of `fn` has stopped. `callback`
 * will be passed an error, if one occurred, otherwise `null`.
 * @example
 *
 * var count = 0;
 *
 * async.during(
 *     function (callback) {
 *         return callback(null, count < 5);
 *     },
 *     function (callback) {
 *         count++;
 *         setTimeout(callback, 1000);
 *     },
 *     function (err) {
 *         // 5 seconds have passed
 *     }
 * );
 */
function during(test, fn, callback) {
    callback = onlyOnce(callback || noop);
    var _fn = wrapAsync(fn);
    var _test = wrapAsync(test);

    function next(err) {
        if (err) return callback(err);
        _test(check);
    }

    function check(err, truth) {
        if (err) return callback(err);
        if (!truth) return callback(null);
        _fn(next);
    }

    _test(check);
}

function _withoutIndex(iteratee) {
    return function (value, index, callback) {
        return iteratee(value, callback);
    };
}

/**
 * Applies the function `iteratee` to each item in `coll`, in parallel.
 * The `iteratee` is called with an item from the list, and a callback for when
 * it has finished. If the `iteratee` passes an error to its `callback`, the
 * main `callback` (for the `each` function) is immediately called with the
 * error.
 *
 * Note, that since this function applies `iteratee` to each item in parallel,
 * there is no guarantee that the iteratee functions will complete in order.
 *
 * @name each
 * @static
 * @memberOf module:Collections
 * @method
 * @alias forEach
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to
 * each item in `coll`. Invoked with (item, callback).
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOf`.
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 * @example
 *
 * // assuming openFiles is an array of file names and saveFile is a function
 * // to save the modified contents of that file:
 *
 * async.each(openFiles, saveFile, function(err){
 *   // if any of the saves produced an error, err would equal that error
 * });
 *
 * // assuming openFiles is an array of file names
 * async.each(openFiles, function(file, callback) {
 *
 *     // Perform operation on file here.
 *     console.log('Processing file ' + file);
 *
 *     if( file.length > 32 ) {
 *       console.log('This file name is too long');
 *       callback('File name too long');
 *     } else {
 *       // Do work to process file here
 *       console.log('File processed');
 *       callback();
 *     }
 * }, function(err) {
 *     // if any of the file processing produced an error, err would equal that error
 *     if( err ) {
 *       // One of the iterations produced an error.
 *       // All processing will now stop.
 *       console.log('A file failed to process');
 *     } else {
 *       console.log('All files have been processed successfully');
 *     }
 * });
 */
function eachLimit(coll, iteratee, callback) {
    eachOf(coll, _withoutIndex(wrapAsync(iteratee)), callback);
}

/**
 * The same as [`each`]{@link module:Collections.each} but runs a maximum of `limit` async operations at a time.
 *
 * @name eachLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfLimit`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 */
function eachLimit$1(coll, limit, iteratee, callback) {
    _eachOfLimit(limit)(coll, _withoutIndex(wrapAsync(iteratee)), callback);
}

/**
 * The same as [`each`]{@link module:Collections.each} but runs only a single async operation at a time.
 *
 * @name eachSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.each]{@link module:Collections.each}
 * @alias forEachSeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each
 * item in `coll`.
 * The array index is not passed to the iteratee.
 * If you need the index, use `eachOfSeries`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called when all
 * `iteratee` functions have finished, or an error occurs. Invoked with (err).
 */
var eachSeries = doLimit(eachLimit$1, 1);

/**
 * Wrap an async function and ensure it calls its callback on a later tick of
 * the event loop.  If the function already calls its callback on a next tick,
 * no extra deferral is added. This is useful for preventing stack overflows
 * (`RangeError: Maximum call stack size exceeded`) and generally keeping
 * [Zalgo](http://blog.izs.me/post/59142742143/designing-apis-for-asynchrony)
 * contained. ES2017 `async` functions are returned as-is -- they are immune
 * to Zalgo's corrupting influences, as they always resolve on a later tick.
 *
 * @name ensureAsync
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} fn - an async function, one that expects a node-style
 * callback as its last argument.
 * @returns {AsyncFunction} Returns a wrapped function with the exact same call
 * signature as the function passed in.
 * @example
 *
 * function sometimesAsync(arg, callback) {
 *     if (cache[arg]) {
 *         return callback(null, cache[arg]); // this would be synchronous!!
 *     } else {
 *         doSomeIO(arg, callback); // this IO would be asynchronous
 *     }
 * }
 *
 * // this has a risk of stack overflows if many results are cached in a row
 * async.mapSeries(args, sometimesAsync, done);
 *
 * // this will defer sometimesAsync's callback if necessary,
 * // preventing stack overflows
 * async.mapSeries(args, async.ensureAsync(sometimesAsync), done);
 */
function ensureAsync(fn) {
    if (isAsync(fn)) return fn;
    return initialParams(function (args, callback) {
        var sync = true;
        args.push(function () {
            var innerArgs = arguments;
            if (sync) {
                setImmediate$1(function () {
                    callback.apply(null, innerArgs);
                });
            } else {
                callback.apply(null, innerArgs);
            }
        });
        fn.apply(this, args);
        sync = false;
    });
}

function notId(v) {
    return !v;
}

/**
 * Returns `true` if every element in `coll` satisfies an async test. If any
 * iteratee call returns `false`, the main `callback` is immediately called.
 *
 * @name every
 * @static
 * @memberOf module:Collections
 * @method
 * @alias all
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collection in parallel.
 * The iteratee must complete with a boolean result value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result will be either `true` or `false`
 * depending on the values of the async tests. Invoked with (err, result).
 * @example
 *
 * async.every(['file1','file2','file3'], function(filePath, callback) {
 *     fs.access(filePath, function(err) {
 *         callback(null, !err)
 *     });
 * }, function(err, result) {
 *     // if result is true then every file exists
 * });
 */
var every = doParallel(_createTester(notId, notId));

/**
 * The same as [`every`]{@link module:Collections.every} but runs a maximum of `limit` async operations at a time.
 *
 * @name everyLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.every]{@link module:Collections.every}
 * @alias allLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collection in parallel.
 * The iteratee must complete with a boolean result value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result will be either `true` or `false`
 * depending on the values of the async tests. Invoked with (err, result).
 */
var everyLimit = doParallelLimit(_createTester(notId, notId));

/**
 * The same as [`every`]{@link module:Collections.every} but runs only a single async operation at a time.
 *
 * @name everySeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.every]{@link module:Collections.every}
 * @alias allSeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collection in series.
 * The iteratee must complete with a boolean result value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result will be either `true` or `false`
 * depending on the values of the async tests. Invoked with (err, result).
 */
var everySeries = doLimit(everyLimit, 1);

/**
 * The base implementation of `_.property` without support for deep paths.
 *
 * @private
 * @param {string} key The key of the property to get.
 * @returns {Function} Returns the new accessor function.
 */
function baseProperty(key) {
  return function(object) {
    return object == null ? undefined : object[key];
  };
}

function filterArray(eachfn, arr, iteratee, callback) {
    var truthValues = new Array(arr.length);
    eachfn(arr, function (x, index, callback) {
        iteratee(x, function (err, v) {
            truthValues[index] = !!v;
            callback(err);
        });
    }, function (err) {
        if (err) return callback(err);
        var results = [];
        for (var i = 0; i < arr.length; i++) {
            if (truthValues[i]) results.push(arr[i]);
        }
        callback(null, results);
    });
}

function filterGeneric(eachfn, coll, iteratee, callback) {
    var results = [];
    eachfn(coll, function (x, index, callback) {
        iteratee(x, function (err, v) {
            if (err) {
                callback(err);
            } else {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            }
        });
    }, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, arrayMap(results.sort(function (a, b) {
                return a.index - b.index;
            }), baseProperty('value')));
        }
    });
}

function _filter(eachfn, coll, iteratee, callback) {
    var filter = isArrayLike(coll) ? filterArray : filterGeneric;
    filter(eachfn, coll, wrapAsync(iteratee), callback || noop);
}

/**
 * Returns a new array of all the values in `coll` which pass an async truth
 * test. This operation is performed in parallel, but the results array will be
 * in the same order as the original.
 *
 * @name filter
 * @static
 * @memberOf module:Collections
 * @method
 * @alias select
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
 * with a boolean argument once it has completed. Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results).
 * @example
 *
 * async.filter(['file1','file2','file3'], function(filePath, callback) {
 *     fs.access(filePath, function(err) {
 *         callback(null, !err)
 *     });
 * }, function(err, results) {
 *     // results now equals an array of the existing files
 * });
 */
var filter = doParallel(_filter);

/**
 * The same as [`filter`]{@link module:Collections.filter} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name filterLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.filter]{@link module:Collections.filter}
 * @alias selectLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
 * with a boolean argument once it has completed. Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results).
 */
var filterLimit = doParallelLimit(_filter);

/**
 * The same as [`filter`]{@link module:Collections.filter} but runs only a single async operation at a time.
 *
 * @name filterSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.filter]{@link module:Collections.filter}
 * @alias selectSeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {Function} iteratee - A truth test to apply to each item in `coll`.
 * The `iteratee` is passed a `callback(err, truthValue)`, which must be called
 * with a boolean argument once it has completed. Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results)
 */
var filterSeries = doLimit(filterLimit, 1);

/**
 * Calls the asynchronous function `fn` with a callback parameter that allows it
 * to call itself again, in series, indefinitely.

 * If an error is passed to the callback then `errback` is called with the
 * error, and execution stops, otherwise it will never be called.
 *
 * @name forever
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {AsyncFunction} fn - an async function to call repeatedly.
 * Invoked with (next).
 * @param {Function} [errback] - when `fn` passes an error to it's callback,
 * this function will be called, and execution stops. Invoked with (err).
 * @example
 *
 * async.forever(
 *     function(next) {
 *         // next is suitable for passing to things that need a callback(err [, whatever]);
 *         // it will result in this function being called again.
 *     },
 *     function(err) {
 *         // if next is called with a value in its first parameter, it will appear
 *         // in here as 'err', and execution will stop.
 *     }
 * );
 */
function forever(fn, errback) {
    var done = onlyOnce(errback || noop);
    var task = wrapAsync(ensureAsync(fn));

    function next(err) {
        if (err) return done(err);
        task(next);
    }
    next();
}

/**
 * The same as [`groupBy`]{@link module:Collections.groupBy} but runs a maximum of `limit` async operations at a time.
 *
 * @name groupByLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.groupBy]{@link module:Collections.groupBy}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with a `key` to group the value under.
 * Invoked with (value, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Result is an `Object` whoses
 * properties are arrays of values which returned the corresponding key.
 */
var groupByLimit = function(coll, limit, iteratee, callback) {
    callback = callback || noop;
    var _iteratee = wrapAsync(iteratee);
    mapLimit(coll, limit, function(val, callback) {
        _iteratee(val, function(err, key) {
            if (err) return callback(err);
            return callback(null, {key: key, val: val});
        });
    }, function(err, mapResults) {
        var result = {};
        // from MDN, handle object having an `hasOwnProperty` prop
        var hasOwnProperty = Object.prototype.hasOwnProperty;

        for (var i = 0; i < mapResults.length; i++) {
            if (mapResults[i]) {
                var key = mapResults[i].key;
                var val = mapResults[i].val;

                if (hasOwnProperty.call(result, key)) {
                    result[key].push(val);
                } else {
                    result[key] = [val];
                }
            }
        }

        return callback(err, result);
    });
};

/**
 * Returns a new object, where each value corresponds to an array of items, from
 * `coll`, that returned the corresponding key. That is, the keys of the object
 * correspond to the values passed to the `iteratee` callback.
 *
 * Note: Since this function applies the `iteratee` to each item in parallel,
 * there is no guarantee that the `iteratee` functions will complete in order.
 * However, the values for each key in the `result` will be in the same order as
 * the original `coll`. For Objects, the values will roughly be in the order of
 * the original Objects' keys (but this can vary across JavaScript engines).
 *
 * @name groupBy
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with a `key` to group the value under.
 * Invoked with (value, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Result is an `Object` whoses
 * properties are arrays of values which returned the corresponding key.
 * @example
 *
 * async.groupBy(['userId1', 'userId2', 'userId3'], function(userId, callback) {
 *     db.findById(userId, function(err, user) {
 *         if (err) return callback(err);
 *         return callback(null, user.age);
 *     });
 * }, function(err, result) {
 *     // result is object containing the userIds grouped by age
 *     // e.g. { 30: ['userId1', 'userId3'], 42: ['userId2']};
 * });
 */
var groupBy = doLimit(groupByLimit, Infinity);

/**
 * The same as [`groupBy`]{@link module:Collections.groupBy} but runs only a single async operation at a time.
 *
 * @name groupBySeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.groupBy]{@link module:Collections.groupBy}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with a `key` to group the value under.
 * Invoked with (value, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. Result is an `Object` whoses
 * properties are arrays of values which returned the corresponding key.
 */
var groupBySeries = doLimit(groupByLimit, 1);

/**
 * Logs the result of an `async` function to the `console`. Only works in
 * Node.js or in browsers that support `console.log` and `console.error` (such
 * as FF and Chrome). If multiple arguments are returned from the async
 * function, `console.log` is called on each argument in order.
 *
 * @name log
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} function - The function you want to eventually apply
 * all arguments to.
 * @param {...*} arguments... - Any number of arguments to apply to the function.
 * @example
 *
 * // in a module
 * var hello = function(name, callback) {
 *     setTimeout(function() {
 *         callback(null, 'hello ' + name);
 *     }, 1000);
 * };
 *
 * // in the node repl
 * node> async.log(hello, 'world');
 * 'hello world'
 */
var log = consoleFunc('log');

/**
 * The same as [`mapValues`]{@link module:Collections.mapValues} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name mapValuesLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.mapValues]{@link module:Collections.mapValues}
 * @category Collection
 * @param {Object} obj - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - A function to apply to each value and key
 * in `coll`.
 * The iteratee should complete with the transformed value as its result.
 * Invoked with (value, key, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. `result` is a new object consisting
 * of each key from `obj`, with each transformed value on the right-hand side.
 * Invoked with (err, result).
 */
function mapValuesLimit(obj, limit, iteratee, callback) {
    callback = once(callback || noop);
    var newObj = {};
    var _iteratee = wrapAsync(iteratee);
    eachOfLimit(obj, limit, function(val, key, next) {
        _iteratee(val, key, function (err, result) {
            if (err) return next(err);
            newObj[key] = result;
            next();
        });
    }, function (err) {
        callback(err, newObj);
    });
}

/**
 * A relative of [`map`]{@link module:Collections.map}, designed for use with objects.
 *
 * Produces a new Object by mapping each value of `obj` through the `iteratee`
 * function. The `iteratee` is called each `value` and `key` from `obj` and a
 * callback for when it has finished processing. Each of these callbacks takes
 * two arguments: an `error`, and the transformed item from `obj`. If `iteratee`
 * passes an error to its callback, the main `callback` (for the `mapValues`
 * function) is immediately called with the error.
 *
 * Note, the order of the keys in the result is not guaranteed.  The keys will
 * be roughly in the order they complete, (but this is very engine-specific)
 *
 * @name mapValues
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Object} obj - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A function to apply to each value and key
 * in `coll`.
 * The iteratee should complete with the transformed value as its result.
 * Invoked with (value, key, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. `result` is a new object consisting
 * of each key from `obj`, with each transformed value on the right-hand side.
 * Invoked with (err, result).
 * @example
 *
 * async.mapValues({
 *     f1: 'file1',
 *     f2: 'file2',
 *     f3: 'file3'
 * }, function (file, key, callback) {
 *   fs.stat(file, callback);
 * }, function(err, result) {
 *     // result is now a map of stats for each file, e.g.
 *     // {
 *     //     f1: [stats for file1],
 *     //     f2: [stats for file2],
 *     //     f3: [stats for file3]
 *     // }
 * });
 */

var mapValues = doLimit(mapValuesLimit, Infinity);

/**
 * The same as [`mapValues`]{@link module:Collections.mapValues} but runs only a single async operation at a time.
 *
 * @name mapValuesSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.mapValues]{@link module:Collections.mapValues}
 * @category Collection
 * @param {Object} obj - A collection to iterate over.
 * @param {AsyncFunction} iteratee - A function to apply to each value and key
 * in `coll`.
 * The iteratee should complete with the transformed value as its result.
 * Invoked with (value, key, callback).
 * @param {Function} [callback] - A callback which is called when all `iteratee`
 * functions have finished, or an error occurs. `result` is a new object consisting
 * of each key from `obj`, with each transformed value on the right-hand side.
 * Invoked with (err, result).
 */
var mapValuesSeries = doLimit(mapValuesLimit, 1);

function has(obj, key) {
    return key in obj;
}

/**
 * Caches the results of an async function. When creating a hash to store
 * function results against, the callback is omitted from the hash and an
 * optional hash function can be used.
 *
 * If no hash function is specified, the first argument is used as a hash key,
 * which may work reasonably if it is a string or a data type that converts to a
 * distinct string. Note that objects and arrays will not behave reasonably.
 * Neither will cases where the other arguments are significant. In such cases,
 * specify your own hash function.
 *
 * The cache of results is exposed as the `memo` property of the function
 * returned by `memoize`.
 *
 * @name memoize
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} fn - The async function to proxy and cache results from.
 * @param {Function} hasher - An optional function for generating a custom hash
 * for storing results. It has all the arguments applied to it apart from the
 * callback, and must be synchronous.
 * @returns {AsyncFunction} a memoized version of `fn`
 * @example
 *
 * var slow_fn = function(name, callback) {
 *     // do something
 *     callback(null, result);
 * };
 * var fn = async.memoize(slow_fn);
 *
 * // fn can now be used as if it were slow_fn
 * fn('some name', function() {
 *     // callback
 * });
 */
function memoize(fn, hasher) {
    var memo = Object.create(null);
    var queues = Object.create(null);
    hasher = hasher || identity;
    var _fn = wrapAsync(fn);
    var memoized = initialParams(function memoized(args, callback) {
        var key = hasher.apply(null, args);
        if (has(memo, key)) {
            setImmediate$1(function() {
                callback.apply(null, memo[key]);
            });
        } else if (has(queues, key)) {
            queues[key].push(callback);
        } else {
            queues[key] = [callback];
            _fn.apply(null, args.concat(function(/*args*/) {
                var args = slice(arguments);
                memo[key] = args;
                var q = queues[key];
                delete queues[key];
                for (var i = 0, l = q.length; i < l; i++) {
                    q[i].apply(null, args);
                }
            }));
        }
    });
    memoized.memo = memo;
    memoized.unmemoized = fn;
    return memoized;
}

/**
 * Calls `callback` on a later loop around the event loop. In Node.js this just
 * calls `setImmediate`.  In the browser it will use `setImmediate` if
 * available, otherwise `setTimeout(callback, 0)`, which means other higher
 * priority events may precede the execution of `callback`.
 *
 * This is used internally for browser-compatibility purposes.
 *
 * @name nextTick
 * @static
 * @memberOf module:Utils
 * @method
 * @alias setImmediate
 * @category Util
 * @param {Function} callback - The function to call on a later loop around
 * the event loop. Invoked with (args...).
 * @param {...*} args... - any number of additional arguments to pass to the
 * callback on the next tick.
 * @example
 *
 * var call_order = [];
 * async.nextTick(function() {
 *     call_order.push('two');
 *     // call_order now equals ['one','two']
 * });
 * call_order.push('one');
 *
 * async.setImmediate(function (a, b, c) {
 *     // a, b, and c equal 1, 2, and 3
 * }, 1, 2, 3);
 */
var _defer$1;

if (hasNextTick) {
    _defer$1 = process.nextTick;
} else if (hasSetImmediate) {
    _defer$1 = setImmediate;
} else {
    _defer$1 = fallback;
}

var nextTick = wrap(_defer$1);

function _parallel(eachfn, tasks, callback) {
    callback = callback || noop;
    var results = isArrayLike(tasks) ? [] : {};

    eachfn(tasks, function (task, key, callback) {
        wrapAsync(task)(function (err, result) {
            if (arguments.length > 2) {
                result = slice(arguments, 1);
            }
            results[key] = result;
            callback(err);
        });
    }, function (err) {
        callback(err, results);
    });
}

/**
 * Run the `tasks` collection of functions in parallel, without waiting until
 * the previous function has completed. If any of the functions pass an error to
 * its callback, the main `callback` is immediately called with the value of the
 * error. Once the `tasks` have completed, the results are passed to the final
 * `callback` as an array.
 *
 * **Note:** `parallel` is about kicking-off I/O tasks in parallel, not about
 * parallel execution of code.  If your tasks do not use any timers or perform
 * any I/O, they will actually be executed in series.  Any synchronous setup
 * sections for each task will happen one after the other.  JavaScript remains
 * single-threaded.
 *
 * **Hint:** Use [`reflect`]{@link module:Utils.reflect} to continue the
 * execution of other tasks when a task fails.
 *
 * It is also possible to use an object instead of an array. Each property will
 * be run as a function and the results will be passed to the final `callback`
 * as an object instead of an array. This can be a more readable way of handling
 * results from {@link async.parallel}.
 *
 * @name parallel
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array|Iterable|Object} tasks - A collection of
 * [async functions]{@link AsyncFunction} to run.
 * Each async function can complete with any number of optional `result` values.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed successfully. This function gets a results array
 * (or object) containing all the result arguments passed to the task callbacks.
 * Invoked with (err, results).
 *
 * @example
 * async.parallel([
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'one');
 *         }, 200);
 *     },
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'two');
 *         }, 100);
 *     }
 * ],
 * // optional callback
 * function(err, results) {
 *     // the results array will equal ['one','two'] even though
 *     // the second function had a shorter timeout.
 * });
 *
 * // an example using an object instead of an array
 * async.parallel({
 *     one: function(callback) {
 *         setTimeout(function() {
 *             callback(null, 1);
 *         }, 200);
 *     },
 *     two: function(callback) {
 *         setTimeout(function() {
 *             callback(null, 2);
 *         }, 100);
 *     }
 * }, function(err, results) {
 *     // results is now equals to: {one: 1, two: 2}
 * });
 */
function parallelLimit(tasks, callback) {
    _parallel(eachOf, tasks, callback);
}

/**
 * The same as [`parallel`]{@link module:ControlFlow.parallel} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name parallelLimit
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.parallel]{@link module:ControlFlow.parallel}
 * @category Control Flow
 * @param {Array|Iterable|Object} tasks - A collection of
 * [async functions]{@link AsyncFunction} to run.
 * Each async function can complete with any number of optional `result` values.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed successfully. This function gets a results array
 * (or object) containing all the result arguments passed to the task callbacks.
 * Invoked with (err, results).
 */
function parallelLimit$1(tasks, limit, callback) {
    _parallel(_eachOfLimit(limit), tasks, callback);
}

/**
 * A queue of tasks for the worker function to complete.
 * @typedef {Object} QueueObject
 * @memberOf module:ControlFlow
 * @property {Function} length - a function returning the number of items
 * waiting to be processed. Invoke with `queue.length()`.
 * @property {boolean} started - a boolean indicating whether or not any
 * items have been pushed and processed by the queue.
 * @property {Function} running - a function returning the number of items
 * currently being processed. Invoke with `queue.running()`.
 * @property {Function} workersList - a function returning the array of items
 * currently being processed. Invoke with `queue.workersList()`.
 * @property {Function} idle - a function returning false if there are items
 * waiting or being processed, or true if not. Invoke with `queue.idle()`.
 * @property {number} concurrency - an integer for determining how many `worker`
 * functions should be run in parallel. This property can be changed after a
 * `queue` is created to alter the concurrency on-the-fly.
 * @property {Function} push - add a new task to the `queue`. Calls `callback`
 * once the `worker` has finished processing the task. Instead of a single task,
 * a `tasks` array can be submitted. The respective callback is used for every
 * task in the list. Invoke with `queue.push(task, [callback])`,
 * @property {Function} unshift - add a new task to the front of the `queue`.
 * Invoke with `queue.unshift(task, [callback])`.
 * @property {Function} remove - remove items from the queue that match a test
 * function.  The test function will be passed an object with a `data` property,
 * and a `priority` property, if this is a
 * [priorityQueue]{@link module:ControlFlow.priorityQueue} object.
 * Invoked with `queue.remove(testFn)`, where `testFn` is of the form
 * `function ({data, priority}) {}` and returns a Boolean.
 * @property {Function} saturated - a callback that is called when the number of
 * running workers hits the `concurrency` limit, and further tasks will be
 * queued.
 * @property {Function} unsaturated - a callback that is called when the number
 * of running workers is less than the `concurrency` & `buffer` limits, and
 * further tasks will not be queued.
 * @property {number} buffer - A minimum threshold buffer in order to say that
 * the `queue` is `unsaturated`.
 * @property {Function} empty - a callback that is called when the last item
 * from the `queue` is given to a `worker`.
 * @property {Function} drain - a callback that is called when the last item
 * from the `queue` has returned from the `worker`.
 * @property {Function} error - a callback that is called when a task errors.
 * Has the signature `function(error, task)`.
 * @property {boolean} paused - a boolean for determining whether the queue is
 * in a paused state.
 * @property {Function} pause - a function that pauses the processing of tasks
 * until `resume()` is called. Invoke with `queue.pause()`.
 * @property {Function} resume - a function that resumes the processing of
 * queued tasks when the queue is paused. Invoke with `queue.resume()`.
 * @property {Function} kill - a function that removes the `drain` callback and
 * empties remaining tasks from the queue forcing it to go idle. No more tasks
 * should be pushed to the queue after calling this function. Invoke with `queue.kill()`.
 */

/**
 * Creates a `queue` object with the specified `concurrency`. Tasks added to the
 * `queue` are processed in parallel (up to the `concurrency` limit). If all
 * `worker`s are in progress, the task is queued until one becomes available.
 * Once a `worker` completes a `task`, that `task`'s callback is called.
 *
 * @name queue
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {AsyncFunction} worker - An async function for processing a queued task.
 * If you want to handle errors from an individual task, pass a callback to
 * `q.push()`. Invoked with (task, callback).
 * @param {number} [concurrency=1] - An `integer` for determining how many
 * `worker` functions should be run in parallel.  If omitted, the concurrency
 * defaults to `1`.  If the concurrency is `0`, an error is thrown.
 * @returns {module:ControlFlow.QueueObject} A queue object to manage the tasks. Callbacks can
 * attached as certain properties to listen for specific events during the
 * lifecycle of the queue.
 * @example
 *
 * // create a queue object with concurrency 2
 * var q = async.queue(function(task, callback) {
 *     console.log('hello ' + task.name);
 *     callback();
 * }, 2);
 *
 * // assign a callback
 * q.drain = function() {
 *     console.log('all items have been processed');
 * };
 *
 * // add some items to the queue
 * q.push({name: 'foo'}, function(err) {
 *     console.log('finished processing foo');
 * });
 * q.push({name: 'bar'}, function (err) {
 *     console.log('finished processing bar');
 * });
 *
 * // add some items to the queue (batch-wise)
 * q.push([{name: 'baz'},{name: 'bay'},{name: 'bax'}], function(err) {
 *     console.log('finished processing item');
 * });
 *
 * // add some items to the front of the queue
 * q.unshift({name: 'bar'}, function (err) {
 *     console.log('finished processing bar');
 * });
 */
var queue$1 = function (worker, concurrency) {
    var _worker = wrapAsync(worker);
    return queue(function (items, cb) {
        _worker(items[0], cb);
    }, concurrency, 1);
};

/**
 * The same as [async.queue]{@link module:ControlFlow.queue} only tasks are assigned a priority and
 * completed in ascending priority order.
 *
 * @name priorityQueue
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.queue]{@link module:ControlFlow.queue}
 * @category Control Flow
 * @param {AsyncFunction} worker - An async function for processing a queued task.
 * If you want to handle errors from an individual task, pass a callback to
 * `q.push()`.
 * Invoked with (task, callback).
 * @param {number} concurrency - An `integer` for determining how many `worker`
 * functions should be run in parallel.  If omitted, the concurrency defaults to
 * `1`.  If the concurrency is `0`, an error is thrown.
 * @returns {module:ControlFlow.QueueObject} A priorityQueue object to manage the tasks. There are two
 * differences between `queue` and `priorityQueue` objects:
 * * `push(task, priority, [callback])` - `priority` should be a number. If an
 *   array of `tasks` is given, all tasks will be assigned the same priority.
 * * The `unshift` method was removed.
 */
var priorityQueue = function(worker, concurrency) {
    // Start with a normal queue
    var q = queue$1(worker, concurrency);

    // Override push to accept second parameter representing priority
    q.push = function(data, priority, callback) {
        if (callback == null) callback = noop;
        if (typeof callback !== 'function') {
            throw new Error('task callback must be a function');
        }
        q.started = true;
        if (!isArray(data)) {
            data = [data];
        }
        if (data.length === 0) {
            // call drain immediately if there are no tasks
            return setImmediate$1(function() {
                q.drain();
            });
        }

        priority = priority || 0;
        var nextNode = q._tasks.head;
        while (nextNode && priority >= nextNode.priority) {
            nextNode = nextNode.next;
        }

        for (var i = 0, l = data.length; i < l; i++) {
            var item = {
                data: data[i],
                priority: priority,
                callback: callback
            };

            if (nextNode) {
                q._tasks.insertBefore(nextNode, item);
            } else {
                q._tasks.push(item);
            }
        }
        setImmediate$1(q.process);
    };

    // Remove unshift function
    delete q.unshift;

    return q;
};

/**
 * Runs the `tasks` array of functions in parallel, without waiting until the
 * previous function has completed. Once any of the `tasks` complete or pass an
 * error to its callback, the main `callback` is immediately called. It's
 * equivalent to `Promise.race()`.
 *
 * @name race
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array} tasks - An array containing [async functions]{@link AsyncFunction}
 * to run. Each function can complete with an optional `result` value.
 * @param {Function} callback - A callback to run once any of the functions have
 * completed. This function gets an error or result from the first function that
 * completed. Invoked with (err, result).
 * @returns undefined
 * @example
 *
 * async.race([
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'one');
 *         }, 200);
 *     },
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'two');
 *         }, 100);
 *     }
 * ],
 * // main callback
 * function(err, result) {
 *     // the result will be equal to 'two' as it finishes earlier
 * });
 */
function race(tasks, callback) {
    callback = once(callback || noop);
    if (!isArray(tasks)) return callback(new TypeError('First argument to race must be an array of functions'));
    if (!tasks.length) return callback();
    for (var i = 0, l = tasks.length; i < l; i++) {
        wrapAsync(tasks[i])(callback);
    }
}

/**
 * Same as [`reduce`]{@link module:Collections.reduce}, only operates on `array` in reverse order.
 *
 * @name reduceRight
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.reduce]{@link module:Collections.reduce}
 * @alias foldr
 * @category Collection
 * @param {Array} array - A collection to iterate over.
 * @param {*} memo - The initial state of the reduction.
 * @param {AsyncFunction} iteratee - A function applied to each item in the
 * array to produce the next step in the reduction.
 * The `iteratee` should complete with the next state of the reduction.
 * If the iteratee complete with an error, the reduction is stopped and the
 * main `callback` is immediately called with the error.
 * Invoked with (memo, item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result is the reduced value. Invoked with
 * (err, result).
 */
function reduceRight (array, memo, iteratee, callback) {
    var reversed = slice(array).reverse();
    reduce(reversed, memo, iteratee, callback);
}

/**
 * Wraps the async function in another function that always completes with a
 * result object, even when it errors.
 *
 * The result object has either the property `error` or `value`.
 *
 * @name reflect
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} fn - The async function you want to wrap
 * @returns {Function} - A function that always passes null to it's callback as
 * the error. The second argument to the callback will be an `object` with
 * either an `error` or a `value` property.
 * @example
 *
 * async.parallel([
 *     async.reflect(function(callback) {
 *         // do some stuff ...
 *         callback(null, 'one');
 *     }),
 *     async.reflect(function(callback) {
 *         // do some more stuff but error ...
 *         callback('bad stuff happened');
 *     }),
 *     async.reflect(function(callback) {
 *         // do some more stuff ...
 *         callback(null, 'two');
 *     })
 * ],
 * // optional callback
 * function(err, results) {
 *     // values
 *     // results[0].value = 'one'
 *     // results[1].error = 'bad stuff happened'
 *     // results[2].value = 'two'
 * });
 */
function reflect(fn) {
    var _fn = wrapAsync(fn);
    return initialParams(function reflectOn(args, reflectCallback) {
        args.push(function callback(error, cbArg) {
            if (error) {
                reflectCallback(null, { error: error });
            } else {
                var value;
                if (arguments.length <= 2) {
                    value = cbArg;
                } else {
                    value = slice(arguments, 1);
                }
                reflectCallback(null, { value: value });
            }
        });

        return _fn.apply(this, args);
    });
}

function reject$1(eachfn, arr, iteratee, callback) {
    _filter(eachfn, arr, function(value, cb) {
        iteratee(value, function(err, v) {
            cb(err, !v);
        });
    }, callback);
}

/**
 * The opposite of [`filter`]{@link module:Collections.filter}. Removes values that pass an `async` truth test.
 *
 * @name reject
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.filter]{@link module:Collections.filter}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {Function} iteratee - An async truth test to apply to each item in
 * `coll`.
 * The should complete with a boolean value as its `result`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results).
 * @example
 *
 * async.reject(['file1','file2','file3'], function(filePath, callback) {
 *     fs.access(filePath, function(err) {
 *         callback(null, !err)
 *     });
 * }, function(err, results) {
 *     // results now equals an array of missing files
 *     createFiles(results);
 * });
 */
var reject = doParallel(reject$1);

/**
 * A helper function that wraps an array or an object of functions with `reflect`.
 *
 * @name reflectAll
 * @static
 * @memberOf module:Utils
 * @method
 * @see [async.reflect]{@link module:Utils.reflect}
 * @category Util
 * @param {Array|Object|Iterable} tasks - The collection of
 * [async functions]{@link AsyncFunction} to wrap in `async.reflect`.
 * @returns {Array} Returns an array of async functions, each wrapped in
 * `async.reflect`
 * @example
 *
 * let tasks = [
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'one');
 *         }, 200);
 *     },
 *     function(callback) {
 *         // do some more stuff but error ...
 *         callback(new Error('bad stuff happened'));
 *     },
 *     function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'two');
 *         }, 100);
 *     }
 * ];
 *
 * async.parallel(async.reflectAll(tasks),
 * // optional callback
 * function(err, results) {
 *     // values
 *     // results[0].value = 'one'
 *     // results[1].error = Error('bad stuff happened')
 *     // results[2].value = 'two'
 * });
 *
 * // an example using an object instead of an array
 * let tasks = {
 *     one: function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'one');
 *         }, 200);
 *     },
 *     two: function(callback) {
 *         callback('two');
 *     },
 *     three: function(callback) {
 *         setTimeout(function() {
 *             callback(null, 'three');
 *         }, 100);
 *     }
 * };
 *
 * async.parallel(async.reflectAll(tasks),
 * // optional callback
 * function(err, results) {
 *     // values
 *     // results.one.value = 'one'
 *     // results.two.error = 'two'
 *     // results.three.value = 'three'
 * });
 */
function reflectAll(tasks) {
    var results;
    if (isArray(tasks)) {
        results = arrayMap(tasks, reflect);
    } else {
        results = {};
        baseForOwn(tasks, function(task, key) {
            results[key] = reflect.call(this, task);
        });
    }
    return results;
}

/**
 * The same as [`reject`]{@link module:Collections.reject} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name rejectLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.reject]{@link module:Collections.reject}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {Function} iteratee - An async truth test to apply to each item in
 * `coll`.
 * The should complete with a boolean value as its `result`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results).
 */
var rejectLimit = doParallelLimit(reject$1);

/**
 * The same as [`reject`]{@link module:Collections.reject} but runs only a single async operation at a time.
 *
 * @name rejectSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.reject]{@link module:Collections.reject}
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {Function} iteratee - An async truth test to apply to each item in
 * `coll`.
 * The should complete with a boolean value as its `result`.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Invoked with (err, results).
 */
var rejectSeries = doLimit(rejectLimit, 1);

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant$1(value) {
  return function() {
    return value;
  };
}

/**
 * Attempts to get a successful response from `task` no more than `times` times
 * before returning an error. If the task is successful, the `callback` will be
 * passed the result of the successful task. If all attempts fail, the callback
 * will be passed the error and result (if any) of the final attempt.
 *
 * @name retry
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @see [async.retryable]{@link module:ControlFlow.retryable}
 * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - Can be either an
 * object with `times` and `interval` or a number.
 * * `times` - The number of attempts to make before giving up.  The default
 *   is `5`.
 * * `interval` - The time to wait between retries, in milliseconds.  The
 *   default is `0`. The interval may also be specified as a function of the
 *   retry count (see example).
 * * `errorFilter` - An optional synchronous function that is invoked on
 *   erroneous result. If it returns `true` the retry attempts will continue;
 *   if the function returns `false` the retry flow is aborted with the current
 *   attempt's error and result being returned to the final callback.
 *   Invoked with (err).
 * * If `opts` is a number, the number specifies the number of times to retry,
 *   with the default interval of `0`.
 * @param {AsyncFunction} task - An async function to retry.
 * Invoked with (callback).
 * @param {Function} [callback] - An optional callback which is called when the
 * task has succeeded, or after the final failed attempt. It receives the `err`
 * and `result` arguments of the last attempt at completing the `task`. Invoked
 * with (err, results).
 *
 * @example
 *
 * // The `retry` function can be used as a stand-alone control flow by passing
 * // a callback, as shown below:
 *
 * // try calling apiMethod 3 times
 * async.retry(3, apiMethod, function(err, result) {
 *     // do something with the result
 * });
 *
 * // try calling apiMethod 3 times, waiting 200 ms between each retry
 * async.retry({times: 3, interval: 200}, apiMethod, function(err, result) {
 *     // do something with the result
 * });
 *
 * // try calling apiMethod 10 times with exponential backoff
 * // (i.e. intervals of 100, 200, 400, 800, 1600, ... milliseconds)
 * async.retry({
 *   times: 10,
 *   interval: function(retryCount) {
 *     return 50 * Math.pow(2, retryCount);
 *   }
 * }, apiMethod, function(err, result) {
 *     // do something with the result
 * });
 *
 * // try calling apiMethod the default 5 times no delay between each retry
 * async.retry(apiMethod, function(err, result) {
 *     // do something with the result
 * });
 *
 * // try calling apiMethod only when error condition satisfies, all other
 * // errors will abort the retry control flow and return to final callback
 * async.retry({
 *   errorFilter: function(err) {
 *     return err.message === 'Temporary error'; // only retry on a specific error
 *   }
 * }, apiMethod, function(err, result) {
 *     // do something with the result
 * });
 *
 * // It can also be embedded within other control flow functions to retry
 * // individual methods that are not as reliable, like this:
 * async.auto({
 *     users: api.getUsers.bind(api),
 *     payments: async.retryable(3, api.getPayments.bind(api))
 * }, function(err, results) {
 *     // do something with the results
 * });
 *
 */
function retry(opts, task, callback) {
    var DEFAULT_TIMES = 5;
    var DEFAULT_INTERVAL = 0;

    var options = {
        times: DEFAULT_TIMES,
        intervalFunc: constant$1(DEFAULT_INTERVAL)
    };

    function parseTimes(acc, t) {
        if (typeof t === 'object') {
            acc.times = +t.times || DEFAULT_TIMES;

            acc.intervalFunc = typeof t.interval === 'function' ?
                t.interval :
                constant$1(+t.interval || DEFAULT_INTERVAL);

            acc.errorFilter = t.errorFilter;
        } else if (typeof t === 'number' || typeof t === 'string') {
            acc.times = +t || DEFAULT_TIMES;
        } else {
            throw new Error("Invalid arguments for async.retry");
        }
    }

    if (arguments.length < 3 && typeof opts === 'function') {
        callback = task || noop;
        task = opts;
    } else {
        parseTimes(options, opts);
        callback = callback || noop;
    }

    if (typeof task !== 'function') {
        throw new Error("Invalid arguments for async.retry");
    }

    var _task = wrapAsync(task);

    var attempt = 1;
    function retryAttempt() {
        _task(function(err) {
            if (err && attempt++ < options.times &&
                (typeof options.errorFilter != 'function' ||
                    options.errorFilter(err))) {
                setTimeout(retryAttempt, options.intervalFunc(attempt));
            } else {
                callback.apply(null, arguments);
            }
        });
    }

    retryAttempt();
}

/**
 * A close relative of [`retry`]{@link module:ControlFlow.retry}.  This method
 * wraps a task and makes it retryable, rather than immediately calling it
 * with retries.
 *
 * @name retryable
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.retry]{@link module:ControlFlow.retry}
 * @category Control Flow
 * @param {Object|number} [opts = {times: 5, interval: 0}| 5] - optional
 * options, exactly the same as from `retry`
 * @param {AsyncFunction} task - the asynchronous function to wrap.
 * This function will be passed any arguments passed to the returned wrapper.
 * Invoked with (...args, callback).
 * @returns {AsyncFunction} The wrapped function, which when invoked, will
 * retry on an error, based on the parameters specified in `opts`.
 * This function will accept the same parameters as `task`.
 * @example
 *
 * async.auto({
 *     dep1: async.retryable(3, getFromFlakyService),
 *     process: ["dep1", async.retryable(3, function (results, cb) {
 *         maybeProcessData(results.dep1, cb);
 *     })]
 * }, callback);
 */
var retryable = function (opts, task) {
    if (!task) {
        task = opts;
        opts = null;
    }
    var _task = wrapAsync(task);
    return initialParams(function (args, callback) {
        function taskFn(cb) {
            _task.apply(null, args.concat(cb));
        }

        if (opts) retry(opts, taskFn, callback);
        else retry(taskFn, callback);

    });
};

/**
 * Run the functions in the `tasks` collection in series, each one running once
 * the previous function has completed. If any functions in the series pass an
 * error to its callback, no more functions are run, and `callback` is
 * immediately called with the value of the error. Otherwise, `callback`
 * receives an array of results when `tasks` have completed.
 *
 * It is also possible to use an object instead of an array. Each property will
 * be run as a function, and the results will be passed to the final `callback`
 * as an object instead of an array. This can be a more readable way of handling
 *  results from {@link async.series}.
 *
 * **Note** that while many implementations preserve the order of object
 * properties, the [ECMAScript Language Specification](http://www.ecma-international.org/ecma-262/5.1/#sec-8.6)
 * explicitly states that
 *
 * > The mechanics and order of enumerating the properties is not specified.
 *
 * So if you rely on the order in which your series of functions are executed,
 * and want this to work on all platforms, consider using an array.
 *
 * @name series
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array|Iterable|Object} tasks - A collection containing
 * [async functions]{@link AsyncFunction} to run in series.
 * Each function can complete with any number of optional `result` values.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed. This function gets a results array (or object)
 * containing all the result arguments passed to the `task` callbacks. Invoked
 * with (err, result).
 * @example
 * async.series([
 *     function(callback) {
 *         // do some stuff ...
 *         callback(null, 'one');
 *     },
 *     function(callback) {
 *         // do some more stuff ...
 *         callback(null, 'two');
 *     }
 * ],
 * // optional callback
 * function(err, results) {
 *     // results is now equal to ['one', 'two']
 * });
 *
 * async.series({
 *     one: function(callback) {
 *         setTimeout(function() {
 *             callback(null, 1);
 *         }, 200);
 *     },
 *     two: function(callback){
 *         setTimeout(function() {
 *             callback(null, 2);
 *         }, 100);
 *     }
 * }, function(err, results) {
 *     // results is now equal to: {one: 1, two: 2}
 * });
 */
function series(tasks, callback) {
    _parallel(eachOfSeries, tasks, callback);
}

/**
 * Returns `true` if at least one element in the `coll` satisfies an async test.
 * If any iteratee call returns `true`, the main `callback` is immediately
 * called.
 *
 * @name some
 * @static
 * @memberOf module:Collections
 * @method
 * @alias any
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collections in parallel.
 * The iteratee should complete with a boolean `result` value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the iteratee functions have finished.
 * Result will be either `true` or `false` depending on the values of the async
 * tests. Invoked with (err, result).
 * @example
 *
 * async.some(['file1','file2','file3'], function(filePath, callback) {
 *     fs.access(filePath, function(err) {
 *         callback(null, !err)
 *     });
 * }, function(err, result) {
 *     // if result is true then at least one of the files exists
 * });
 */
var some = doParallel(_createTester(Boolean, identity));

/**
 * The same as [`some`]{@link module:Collections.some} but runs a maximum of `limit` async operations at a time.
 *
 * @name someLimit
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.some]{@link module:Collections.some}
 * @alias anyLimit
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collections in parallel.
 * The iteratee should complete with a boolean `result` value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the iteratee functions have finished.
 * Result will be either `true` or `false` depending on the values of the async
 * tests. Invoked with (err, result).
 */
var someLimit = doParallelLimit(_createTester(Boolean, identity));

/**
 * The same as [`some`]{@link module:Collections.some} but runs only a single async operation at a time.
 *
 * @name someSeries
 * @static
 * @memberOf module:Collections
 * @method
 * @see [async.some]{@link module:Collections.some}
 * @alias anySeries
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async truth test to apply to each item
 * in the collections in series.
 * The iteratee should complete with a boolean `result` value.
 * Invoked with (item, callback).
 * @param {Function} [callback] - A callback which is called as soon as any
 * iteratee returns `true`, or after all the iteratee functions have finished.
 * Result will be either `true` or `false` depending on the values of the async
 * tests. Invoked with (err, result).
 */
var someSeries = doLimit(someLimit, 1);

/**
 * Sorts a list by the results of running each `coll` value through an async
 * `iteratee`.
 *
 * @name sortBy
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {AsyncFunction} iteratee - An async function to apply to each item in
 * `coll`.
 * The iteratee should complete with a value to use as the sort criteria as
 * its `result`.
 * Invoked with (item, callback).
 * @param {Function} callback - A callback which is called after all the
 * `iteratee` functions have finished, or an error occurs. Results is the items
 * from the original `coll` sorted by the values returned by the `iteratee`
 * calls. Invoked with (err, results).
 * @example
 *
 * async.sortBy(['file1','file2','file3'], function(file, callback) {
 *     fs.stat(file, function(err, stats) {
 *         callback(err, stats.mtime);
 *     });
 * }, function(err, results) {
 *     // results is now the original array of files sorted by
 *     // modified date
 * });
 *
 * // By modifying the callback parameter the
 * // sorting order can be influenced:
 *
 * // ascending order
 * async.sortBy([1,9,3,5], function(x, callback) {
 *     callback(null, x);
 * }, function(err,result) {
 *     // result callback
 * });
 *
 * // descending order
 * async.sortBy([1,9,3,5], function(x, callback) {
 *     callback(null, x*-1);    //<- x*-1 instead of x, turns the order around
 * }, function(err,result) {
 *     // result callback
 * });
 */
function sortBy (coll, iteratee, callback) {
    var _iteratee = wrapAsync(iteratee);
    map(coll, function (x, callback) {
        _iteratee(x, function (err, criteria) {
            if (err) return callback(err);
            callback(null, {value: x, criteria: criteria});
        });
    }, function (err, results) {
        if (err) return callback(err);
        callback(null, arrayMap(results.sort(comparator), baseProperty('value')));
    });

    function comparator(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
    }
}

/**
 * Sets a time limit on an asynchronous function. If the function does not call
 * its callback within the specified milliseconds, it will be called with a
 * timeout error. The code property for the error object will be `'ETIMEDOUT'`.
 *
 * @name timeout
 * @static
 * @memberOf module:Utils
 * @method
 * @category Util
 * @param {AsyncFunction} asyncFn - The async function to limit in time.
 * @param {number} milliseconds - The specified time limit.
 * @param {*} [info] - Any variable you want attached (`string`, `object`, etc)
 * to timeout Error for more information..
 * @returns {AsyncFunction} Returns a wrapped function that can be used with any
 * of the control flow functions.
 * Invoke this function with the same parameters as you would `asyncFunc`.
 * @example
 *
 * function myFunction(foo, callback) {
 *     doAsyncTask(foo, function(err, data) {
 *         // handle errors
 *         if (err) return callback(err);
 *
 *         // do some stuff ...
 *
 *         // return processed data
 *         return callback(null, data);
 *     });
 * }
 *
 * var wrapped = async.timeout(myFunction, 1000);
 *
 * // call `wrapped` as you would `myFunction`
 * wrapped({ bar: 'bar' }, function(err, data) {
 *     // if `myFunction` takes < 1000 ms to execute, `err`
 *     // and `data` will have their expected values
 *
 *     // else `err` will be an Error with the code 'ETIMEDOUT'
 * });
 */
function timeout(asyncFn, milliseconds, info) {
    var fn = wrapAsync(asyncFn);

    return initialParams(function (args, callback) {
        var timedOut = false;
        var timer;

        function timeoutCallback() {
            var name = asyncFn.name || 'anonymous';
            var error  = new Error('Callback function "' + name + '" timed out.');
            error.code = 'ETIMEDOUT';
            if (info) {
                error.info = info;
            }
            timedOut = true;
            callback(error);
        }

        args.push(function () {
            if (!timedOut) {
                callback.apply(null, arguments);
                clearTimeout(timer);
            }
        });

        // setup timer and call original function
        timer = setTimeout(timeoutCallback, milliseconds);
        fn.apply(null, args);
    });
}

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeCeil = Math.ceil;
var nativeMax = Math.max;

/**
 * The base implementation of `_.range` and `_.rangeRight` which doesn't
 * coerce arguments.
 *
 * @private
 * @param {number} start The start of the range.
 * @param {number} end The end of the range.
 * @param {number} step The value to increment or decrement by.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {Array} Returns the range of numbers.
 */
function baseRange(start, end, step, fromRight) {
  var index = -1,
      length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
      result = Array(length);

  while (length--) {
    result[fromRight ? length : ++index] = start;
    start += step;
  }
  return result;
}

/**
 * The same as [times]{@link module:ControlFlow.times} but runs a maximum of `limit` async operations at a
 * time.
 *
 * @name timesLimit
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.times]{@link module:ControlFlow.times}
 * @category Control Flow
 * @param {number} count - The number of times to run the function.
 * @param {number} limit - The maximum number of async operations at a time.
 * @param {AsyncFunction} iteratee - The async function to call `n` times.
 * Invoked with the iteration index and a callback: (n, next).
 * @param {Function} callback - see [async.map]{@link module:Collections.map}.
 */
function timeLimit(count, limit, iteratee, callback) {
    var _iteratee = wrapAsync(iteratee);
    mapLimit(baseRange(0, count, 1), limit, _iteratee, callback);
}

/**
 * Calls the `iteratee` function `n` times, and accumulates results in the same
 * manner you would use with [map]{@link module:Collections.map}.
 *
 * @name times
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.map]{@link module:Collections.map}
 * @category Control Flow
 * @param {number} n - The number of times to run the function.
 * @param {AsyncFunction} iteratee - The async function to call `n` times.
 * Invoked with the iteration index and a callback: (n, next).
 * @param {Function} callback - see {@link module:Collections.map}.
 * @example
 *
 * // Pretend this is some complicated async factory
 * var createUser = function(id, callback) {
 *     callback(null, {
 *         id: 'user' + id
 *     });
 * };
 *
 * // generate 5 users
 * async.times(5, function(n, next) {
 *     createUser(n, function(err, user) {
 *         next(err, user);
 *     });
 * }, function(err, users) {
 *     // we should now have 5 users
 * });
 */
var times = doLimit(timeLimit, Infinity);

/**
 * The same as [times]{@link module:ControlFlow.times} but runs only a single async operation at a time.
 *
 * @name timesSeries
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.times]{@link module:ControlFlow.times}
 * @category Control Flow
 * @param {number} n - The number of times to run the function.
 * @param {AsyncFunction} iteratee - The async function to call `n` times.
 * Invoked with the iteration index and a callback: (n, next).
 * @param {Function} callback - see {@link module:Collections.map}.
 */
var timesSeries = doLimit(timeLimit, 1);

/**
 * A relative of `reduce`.  Takes an Object or Array, and iterates over each
 * element in series, each step potentially mutating an `accumulator` value.
 * The type of the accumulator defaults to the type of collection passed in.
 *
 * @name transform
 * @static
 * @memberOf module:Collections
 * @method
 * @category Collection
 * @param {Array|Iterable|Object} coll - A collection to iterate over.
 * @param {*} [accumulator] - The initial state of the transform.  If omitted,
 * it will default to an empty Object or Array, depending on the type of `coll`
 * @param {AsyncFunction} iteratee - A function applied to each item in the
 * collection that potentially modifies the accumulator.
 * Invoked with (accumulator, item, key, callback).
 * @param {Function} [callback] - A callback which is called after all the
 * `iteratee` functions have finished. Result is the transformed accumulator.
 * Invoked with (err, result).
 * @example
 *
 * async.transform([1,2,3], function(acc, item, index, callback) {
 *     // pointless async:
 *     process.nextTick(function() {
 *         acc.push(item * 2)
 *         callback(null)
 *     });
 * }, function(err, result) {
 *     // result is now equal to [2, 4, 6]
 * });
 *
 * @example
 *
 * async.transform({a: 1, b: 2, c: 3}, function (obj, val, key, callback) {
 *     setImmediate(function () {
 *         obj[key] = val * 2;
 *         callback();
 *     })
 * }, function (err, result) {
 *     // result is equal to {a: 2, b: 4, c: 6}
 * })
 */
function transform (coll, accumulator, iteratee, callback) {
    if (arguments.length <= 3) {
        callback = iteratee;
        iteratee = accumulator;
        accumulator = isArray(coll) ? [] : {};
    }
    callback = once(callback || noop);
    var _iteratee = wrapAsync(iteratee);

    eachOf(coll, function(v, k, cb) {
        _iteratee(accumulator, v, k, cb);
    }, function(err) {
        callback(err, accumulator);
    });
}

/**
 * It runs each task in series but stops whenever any of the functions were
 * successful. If one of the tasks were successful, the `callback` will be
 * passed the result of the successful task. If all tasks fail, the callback
 * will be passed the error and result (if any) of the final attempt.
 *
 * @name tryEach
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array|Iterable|Object} tasks - A collection containing functions to
 * run, each function is passed a `callback(err, result)` it must call on
 * completion with an error `err` (which can be `null`) and an optional `result`
 * value.
 * @param {Function} [callback] - An optional callback which is called when one
 * of the tasks has succeeded, or all have failed. It receives the `err` and
 * `result` arguments of the last attempt at completing the `task`. Invoked with
 * (err, results).
 * @example
 * async.try([
 *     function getDataFromFirstWebsite(callback) {
 *         // Try getting the data from the first website
 *         callback(err, data);
 *     },
 *     function getDataFromSecondWebsite(callback) {
 *         // First website failed,
 *         // Try getting the data from the backup website
 *         callback(err, data);
 *     }
 * ],
 * // optional callback
 * function(err, results) {
 *     Now do something with the data.
 * });
 *
 */
function tryEach(tasks, callback) {
    var error = null;
    var result;
    callback = callback || noop;
    eachSeries(tasks, function(task, callback) {
        wrapAsync(task)(function (err, res/*, ...args*/) {
            if (arguments.length > 2) {
                result = slice(arguments, 1);
            } else {
                result = res;
            }
            error = err;
            callback(!err);
        });
    }, function () {
        callback(error, result);
    });
}

/**
 * Undoes a [memoize]{@link module:Utils.memoize}d function, reverting it to the original,
 * unmemoized form. Handy for testing.
 *
 * @name unmemoize
 * @static
 * @memberOf module:Utils
 * @method
 * @see [async.memoize]{@link module:Utils.memoize}
 * @category Util
 * @param {AsyncFunction} fn - the memoized function
 * @returns {AsyncFunction} a function that calls the original unmemoized function
 */
function unmemoize(fn) {
    return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
    };
}

/**
 * Repeatedly call `iteratee`, while `test` returns `true`. Calls `callback` when
 * stopped, or an error occurs.
 *
 * @name whilst
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Function} test - synchronous truth test to perform before each
 * execution of `iteratee`. Invoked with ().
 * @param {AsyncFunction} iteratee - An async function which is called each time
 * `test` passes. Invoked with (callback).
 * @param {Function} [callback] - A callback which is called after the test
 * function has failed and repeated execution of `iteratee` has stopped. `callback`
 * will be passed an error and any arguments passed to the final `iteratee`'s
 * callback. Invoked with (err, [results]);
 * @returns undefined
 * @example
 *
 * var count = 0;
 * async.whilst(
 *     function() { return count < 5; },
 *     function(callback) {
 *         count++;
 *         setTimeout(function() {
 *             callback(null, count);
 *         }, 1000);
 *     },
 *     function (err, n) {
 *         // 5 seconds have passed, n = 5
 *     }
 * );
 */
function whilst(test, iteratee, callback) {
    callback = onlyOnce(callback || noop);
    var _iteratee = wrapAsync(iteratee);
    if (!test()) return callback(null);
    var next = function(err/*, ...args*/) {
        if (err) return callback(err);
        if (test()) return _iteratee(next);
        var args = slice(arguments, 1);
        callback.apply(null, [null].concat(args));
    };
    _iteratee(next);
}

/**
 * Repeatedly call `iteratee` until `test` returns `true`. Calls `callback` when
 * stopped, or an error occurs. `callback` will be passed an error and any
 * arguments passed to the final `iteratee`'s callback.
 *
 * The inverse of [whilst]{@link module:ControlFlow.whilst}.
 *
 * @name until
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @see [async.whilst]{@link module:ControlFlow.whilst}
 * @category Control Flow
 * @param {Function} test - synchronous truth test to perform before each
 * execution of `iteratee`. Invoked with ().
 * @param {AsyncFunction} iteratee - An async function which is called each time
 * `test` fails. Invoked with (callback).
 * @param {Function} [callback] - A callback which is called after the test
 * function has passed and repeated execution of `iteratee` has stopped. `callback`
 * will be passed an error and any arguments passed to the final `iteratee`'s
 * callback. Invoked with (err, [results]);
 */
function until(test, iteratee, callback) {
    whilst(function() {
        return !test.apply(this, arguments);
    }, iteratee, callback);
}

/**
 * Runs the `tasks` array of functions in series, each passing their results to
 * the next in the array. However, if any of the `tasks` pass an error to their
 * own callback, the next function is not executed, and the main `callback` is
 * immediately called with the error.
 *
 * @name waterfall
 * @static
 * @memberOf module:ControlFlow
 * @method
 * @category Control Flow
 * @param {Array} tasks - An array of [async functions]{@link AsyncFunction}
 * to run.
 * Each function should complete with any number of `result` values.
 * The `result` values will be passed as arguments, in order, to the next task.
 * @param {Function} [callback] - An optional callback to run once all the
 * functions have completed. This will be passed the results of the last task's
 * callback. Invoked with (err, [results]).
 * @returns undefined
 * @example
 *
 * async.waterfall([
 *     function(callback) {
 *         callback(null, 'one', 'two');
 *     },
 *     function(arg1, arg2, callback) {
 *         // arg1 now equals 'one' and arg2 now equals 'two'
 *         callback(null, 'three');
 *     },
 *     function(arg1, callback) {
 *         // arg1 now equals 'three'
 *         callback(null, 'done');
 *     }
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 *
 * // Or, with named functions:
 * async.waterfall([
 *     myFirstFunction,
 *     mySecondFunction,
 *     myLastFunction,
 * ], function (err, result) {
 *     // result now equals 'done'
 * });
 * function myFirstFunction(callback) {
 *     callback(null, 'one', 'two');
 * }
 * function mySecondFunction(arg1, arg2, callback) {
 *     // arg1 now equals 'one' and arg2 now equals 'two'
 *     callback(null, 'three');
 * }
 * function myLastFunction(arg1, callback) {
 *     // arg1 now equals 'three'
 *     callback(null, 'done');
 * }
 */
var waterfall = function(tasks, callback) {
    callback = once(callback || noop);
    if (!isArray(tasks)) return callback(new Error('First argument to waterfall must be an array of functions'));
    if (!tasks.length) return callback();
    var taskIndex = 0;

    function nextTask(args) {
        var task = wrapAsync(tasks[taskIndex++]);
        args.push(onlyOnce(next));
        task.apply(null, args);
    }

    function next(err/*, ...args*/) {
        if (err || taskIndex === tasks.length) {
            return callback.apply(null, arguments);
        }
        nextTask(slice(arguments, 1));
    }

    nextTask([]);
};

/**
 * An "async function" in the context of Async is an asynchronous function with
 * a variable number of parameters, with the final parameter being a callback.
 * (`function (arg1, arg2, ..., callback) {}`)
 * The final callback is of the form `callback(err, results...)`, which must be
 * called once the function is completed.  The callback should be called with a
 * Error as its first argument to signal that an error occurred.
 * Otherwise, if no error occurred, it should be called with `null` as the first
 * argument, and any additional `result` arguments that may apply, to signal
 * successful completion.
 * The callback must be called exactly once, ideally on a later tick of the
 * JavaScript event loop.
 *
 * This type of function is also referred to as a "Node-style async function",
 * or a "continuation passing-style function" (CPS). Most of the methods of this
 * library are themselves CPS/Node-style async functions, or functions that
 * return CPS/Node-style async functions.
 *
 * Wherever we accept a Node-style async function, we also directly accept an
 * [ES2017 `async` function]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function}.
 * In this case, the `async` function will not be passed a final callback
 * argument, and any thrown error will be used as the `err` argument of the
 * implicit callback, and the return value will be used as the `result` value.
 * (i.e. a `rejected` of the returned Promise becomes the `err` callback
 * argument, and a `resolved` value becomes the `result`.)
 *
 * Note, due to JavaScript limitations, we can only detect native `async`
 * functions and not transpilied implementations.
 * Your environment must have `async`/`await` support for this to work.
 * (e.g. Node > v7.6, or a recent version of a modern browser).
 * If you are using `async` functions through a transpiler (e.g. Babel), you
 * must still wrap the function with [asyncify]{@link module:Utils.asyncify},
 * because the `async function` will be compiled to an ordinary function that
 * returns a promise.
 *
 * @typedef {Function} AsyncFunction
 * @static
 */

/**
 * Async is a utility module which provides straight-forward, powerful functions
 * for working with asynchronous JavaScript. Although originally designed for
 * use with [Node.js](http://nodejs.org) and installable via
 * `npm install --save async`, it can also be used directly in the browser.
 * @module async
 * @see AsyncFunction
 */


/**
 * A collection of `async` functions for manipulating collections, such as
 * arrays and objects.
 * @module Collections
 */

/**
 * A collection of `async` functions for controlling the flow through a script.
 * @module ControlFlow
 */

/**
 * A collection of `async` utility functions.
 * @module Utils
 */

var index = {
    applyEach: applyEach,
    applyEachSeries: applyEachSeries,
    apply: apply,
    asyncify: asyncify,
    auto: auto,
    autoInject: autoInject,
    cargo: cargo,
    compose: compose,
    concat: concat,
    concatLimit: concatLimit,
    concatSeries: concatSeries,
    constant: constant,
    detect: detect,
    detectLimit: detectLimit,
    detectSeries: detectSeries,
    dir: dir,
    doDuring: doDuring,
    doUntil: doUntil,
    doWhilst: doWhilst,
    during: during,
    each: eachLimit,
    eachLimit: eachLimit$1,
    eachOf: eachOf,
    eachOfLimit: eachOfLimit,
    eachOfSeries: eachOfSeries,
    eachSeries: eachSeries,
    ensureAsync: ensureAsync,
    every: every,
    everyLimit: everyLimit,
    everySeries: everySeries,
    filter: filter,
    filterLimit: filterLimit,
    filterSeries: filterSeries,
    forever: forever,
    groupBy: groupBy,
    groupByLimit: groupByLimit,
    groupBySeries: groupBySeries,
    log: log,
    map: map,
    mapLimit: mapLimit,
    mapSeries: mapSeries,
    mapValues: mapValues,
    mapValuesLimit: mapValuesLimit,
    mapValuesSeries: mapValuesSeries,
    memoize: memoize,
    nextTick: nextTick,
    parallel: parallelLimit,
    parallelLimit: parallelLimit$1,
    priorityQueue: priorityQueue,
    queue: queue$1,
    race: race,
    reduce: reduce,
    reduceRight: reduceRight,
    reflect: reflect,
    reflectAll: reflectAll,
    reject: reject,
    rejectLimit: rejectLimit,
    rejectSeries: rejectSeries,
    retry: retry,
    retryable: retryable,
    seq: seq,
    series: series,
    setImmediate: setImmediate$1,
    some: some,
    someLimit: someLimit,
    someSeries: someSeries,
    sortBy: sortBy,
    timeout: timeout,
    times: times,
    timesLimit: timeLimit,
    timesSeries: timesSeries,
    transform: transform,
    tryEach: tryEach,
    unmemoize: unmemoize,
    until: until,
    waterfall: waterfall,
    whilst: whilst,

    // aliases
    all: every,
    any: some,
    forEach: eachLimit,
    forEachSeries: eachSeries,
    forEachLimit: eachLimit$1,
    forEachOf: eachOf,
    forEachOfSeries: eachOfSeries,
    forEachOfLimit: eachOfLimit,
    inject: reduce,
    foldl: reduce,
    foldr: reduceRight,
    select: filter,
    selectLimit: filterLimit,
    selectSeries: filterSeries,
    wrapSync: asyncify
};

exports['default'] = index;
exports.applyEach = applyEach;
exports.applyEachSeries = applyEachSeries;
exports.apply = apply;
exports.asyncify = asyncify;
exports.auto = auto;
exports.autoInject = autoInject;
exports.cargo = cargo;
exports.compose = compose;
exports.concat = concat;
exports.concatLimit = concatLimit;
exports.concatSeries = concatSeries;
exports.constant = constant;
exports.detect = detect;
exports.detectLimit = detectLimit;
exports.detectSeries = detectSeries;
exports.dir = dir;
exports.doDuring = doDuring;
exports.doUntil = doUntil;
exports.doWhilst = doWhilst;
exports.during = during;
exports.each = eachLimit;
exports.eachLimit = eachLimit$1;
exports.eachOf = eachOf;
exports.eachOfLimit = eachOfLimit;
exports.eachOfSeries = eachOfSeries;
exports.eachSeries = eachSeries;
exports.ensureAsync = ensureAsync;
exports.every = every;
exports.everyLimit = everyLimit;
exports.everySeries = everySeries;
exports.filter = filter;
exports.filterLimit = filterLimit;
exports.filterSeries = filterSeries;
exports.forever = forever;
exports.groupBy = groupBy;
exports.groupByLimit = groupByLimit;
exports.groupBySeries = groupBySeries;
exports.log = log;
exports.map = map;
exports.mapLimit = mapLimit;
exports.mapSeries = mapSeries;
exports.mapValues = mapValues;
exports.mapValuesLimit = mapValuesLimit;
exports.mapValuesSeries = mapValuesSeries;
exports.memoize = memoize;
exports.nextTick = nextTick;
exports.parallel = parallelLimit;
exports.parallelLimit = parallelLimit$1;
exports.priorityQueue = priorityQueue;
exports.queue = queue$1;
exports.race = race;
exports.reduce = reduce;
exports.reduceRight = reduceRight;
exports.reflect = reflect;
exports.reflectAll = reflectAll;
exports.reject = reject;
exports.rejectLimit = rejectLimit;
exports.rejectSeries = rejectSeries;
exports.retry = retry;
exports.retryable = retryable;
exports.seq = seq;
exports.series = series;
exports.setImmediate = setImmediate$1;
exports.some = some;
exports.someLimit = someLimit;
exports.someSeries = someSeries;
exports.sortBy = sortBy;
exports.timeout = timeout;
exports.times = times;
exports.timesLimit = timeLimit;
exports.timesSeries = timesSeries;
exports.transform = transform;
exports.tryEach = tryEach;
exports.unmemoize = unmemoize;
exports.until = until;
exports.waterfall = waterfall;
exports.whilst = whilst;
exports.all = every;
exports.allLimit = everyLimit;
exports.allSeries = everySeries;
exports.any = some;
exports.anyLimit = someLimit;
exports.anySeries = someSeries;
exports.find = detect;
exports.findLimit = detectLimit;
exports.findSeries = detectSeries;
exports.forEach = eachLimit;
exports.forEachSeries = eachSeries;
exports.forEachLimit = eachLimit$1;
exports.forEachOf = eachOf;
exports.forEachOfSeries = eachOfSeries;
exports.forEachOfLimit = eachOfLimit;
exports.inject = reduce;
exports.foldl = reduce;
exports.foldr = reduceRight;
exports.select = filter;
exports.selectLimit = filterLimit;
exports.selectSeries = filterSeries;
exports.wrapSync = asyncify;

Object.defineProperty(exports, '__esModule', { value: true });

})));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(222)(module)))

/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = function (it, Constructor, name, forbiddenField) {
  if (!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)) {
    throw TypeError(name + ': incorrect invocation!');
  } return it;
};


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = __webpack_require__(24);
var TAG = __webpack_require__(3)('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};


/***/ }),
/* 36 */
/***/ (function(module, exports) {

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(8);
var document = __webpack_require__(5).document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(13);
var call = __webpack_require__(57);
var isArrayIter = __webpack_require__(56);
var anObject = __webpack_require__(10);
var toLength = __webpack_require__(44);
var getIterFn = __webpack_require__(70);
var BREAK = {};
var RETURN = {};
var exports = module.exports = function (iterable, entries, fn, that, ITERATOR) {
  var iterFn = ITERATOR ? function () { return iterable; } : getIterFn(iterable);
  var f = ctx(fn, that, entries ? 2 : 1);
  var index = 0;
  var length, step, iterator, result;
  if (typeof iterFn != 'function') throw TypeError(iterable + ' is not iterable!');
  // fast case for arrays with default iterator
  if (isArrayIter(iterFn)) for (length = toLength(iterable.length); length > index; index++) {
    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
    if (result === BREAK || result === RETURN) return result;
  } else for (iterator = iterFn.call(iterable); !(step = iterator.next()).done;) {
    result = call(iterator, f, step.value, entries);
    if (result === BREAK || result === RETURN) return result;
  }
};
exports.BREAK = BREAK;
exports.RETURN = RETURN;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(59);
var $export = __webpack_require__(25);
var redefine = __webpack_require__(18);
var hide = __webpack_require__(17);
var has = __webpack_require__(15);
var Iterators = __webpack_require__(20);
var $iterCreate = __webpack_require__(131);
var setToStringTag = __webpack_require__(28);
var getPrototypeOf = __webpack_require__(135);
var ITERATOR = __webpack_require__(3)('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

var ITERATOR = __webpack_require__(3)('iterator');
var SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () { SAFE_CLOSING = true; };
  // eslint-disable-next-line no-throw-literal
  Array.from(riter, function () { throw 2; });
} catch (e) { /* empty */ }

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7];
    var iter = arr[ITERATOR]();
    iter.next = function () { return { done: safe = true }; };
    arr[ITERATOR] = function () { return iter; };
    exec(arr);
  } catch (e) { /* empty */ }
  return safe;
};


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

var redefine = __webpack_require__(18);
module.exports = function (target, src, safe) {
  for (var key in src) redefine(target, key, src[key], safe);
  return target;
};


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

var shared = __webpack_require__(65)('keys');
var uid = __webpack_require__(30);
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};


/***/ }),
/* 43 */
/***/ (function(module, exports) {

// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.15 ToLength
var toInteger = __webpack_require__(43);
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $at = __webpack_require__(142)(true);

// 21.1.3.27 String.prototype[@@iterator]()
__webpack_require__(39)(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const jsonFile = __webpack_require__(204)

module.exports = {
  // jsonfile exports
  readJson: u(jsonFile.readFile),
  readJsonSync: jsonFile.readFileSync,
  writeJson: u(jsonFile.writeFile),
  writeJsonSync: jsonFile.writeFileSync
}


/***/ }),
/* 47 */
/***/ (function(module, exports) {

module.exports = require("child_process");

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bscore_1 = __webpack_require__(50);
var fse = __webpack_require__(83);
var path = __webpack_require__(0);
var ExifImage = __webpack_require__(153);
var sizeOf = __webpack_require__(87);
function getAssetExifData(assetItem) {
    if (assetItem.mediaType !== bscore_1.MediaType.Image) {
        return Promise.resolve(null);
    }
    return getExifData(path.join(assetItem.path, assetItem.name));
}
exports.getAssetExifData = getAssetExifData;
function getExifData(fullPath) {
    if (!fse.existsSync(fullPath)) {
        return Promise.resolve(null);
    }
    return new Promise(function (resolve, reject) {
        try {
            var ex = new ExifImage.ExifImage({ image: fullPath }, function (error, exifData) {
                var imageData = {
                    size: { width: 0, height: 0 },
                    orientation: bscore_1.RotationType.rot0,
                };
                if (exifData
                    && typeof exifData.exif.ExifImageWidth === 'number'
                    && typeof exifData.exif.ExifImageHeight === 'number') {
                    imageData.size.width = exifData.exif.ExifImageWidth;
                    imageData.size.height = exifData.exif.ExifImageHeight;
                }
                else {
                    var dimensions = sizeOf(fullPath);
                    imageData.size.height = dimensions.height;
                    imageData.size.width = dimensions.width;
                }
                if (exifData && typeof exifData.image.Orientation !== 'undefined') {
                    switch (exifData.image.Orientation) {
                        case 1:
                        case 2:
                            imageData.orientation = bscore_1.RotationType.rot0;
                            break;
                        case 3:
                        case 4:
                            imageData.orientation = bscore_1.RotationType.rot180;
                            break;
                        case 6:
                        case 7:
                            imageData.orientation = bscore_1.RotationType.rot90;
                            break;
                        case 5:
                        case 8:
                            imageData.orientation = bscore_1.RotationType.rot270;
                            break;
                    }
                }
                if (!exifData || typeof exifData.exif.DateTimeOriginal === 'undefined') {
                    fse.stat(fullPath).then(function (stats) {
                        imageData.dateTaken = stats.birthtime;
                        resolve(imageData);
                    });
                }
                else {
                    var res = exifData.exif.DateTimeOriginal.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
                    if (res != null && res.length === 7) {
                        imageData.dateTaken = new Date(res[1], res[2] - 1, res[3], res[4], res[5], res[6]);
                    }
                    resolve(imageData);
                }
            });
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.getExifData = getExifData;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var bscore_1 = __webpack_require__(50);
var path = __webpack_require__(0);
var fse = __webpack_require__(83);
var tmp = __webpack_require__(220);
var ffmpeg = __webpack_require__(156);
var resizeImg = __webpack_require__(219);
var parsePng = __webpack_require__(102);
var jpeg = __webpack_require__(100);
var crypto = __webpack_require__(114);
var sizeOf = __webpack_require__(87);
var error_1 = __webpack_require__(118);
function getThumbnail(assetItem) {
    if (assetItem.mediaType === bscore_1.MediaType.Image || assetItem.mediaType === bscore_1.MediaType.Video) {
        var fullPath = path.join(assetItem.path, assetItem.name);
        if (assetItem.mediaType === bscore_1.MediaType.Image) {
            return buildImageThumb(fullPath);
        }
        else if (assetItem.mediaType === bscore_1.MediaType.Video) {
            return buildVideoThumb(fullPath);
        }
    }
    return Promise.resolve(null);
}
exports.getThumbnail = getThumbnail;
function buildImageThumb(fullPath) {
    if (!fse.existsSync(fullPath)) {
        return Promise.resolve(null);
    }
    return new Promise(function (resolve, reject) {
        fse.readFile(fullPath)
            .then(function (buf) { return resizeImg(buf, { height: 120, out: 'jpg' }); })
            .then(function (buf) {
            var thumbSize = sizeOf(buf);
            resolve({
                kind: 'local',
                data: buf,
                type: 'image/jpeg',
                size: { width: thumbSize.width, height: thumbSize.height },
                hash: getBufferSha1(buf),
            });
        })
            .catch(function (error) { return reject(error); });
    });
}
exports.buildImageThumb = buildImageThumb;
function setFfMpegPath(ffmpegPath) {
    try {
        if (typeof ffmpegPath === 'string' && fse.existsSync(ffmpegPath)) {
            ffmpeg().setFfmpegPath(ffmpegPath);
        }
    }
    catch (e) {
        return;
    }
}
exports.setFfMpegPath = setFfMpegPath;
function buildVideoThumb(fullPath, ffmpegPath) {
    if (!fse.existsSync(fullPath)) {
        return Promise.resolve(null);
    }
    return new Promise(function (resolve, reject) {
        tmp.tmpName({ prefix: 'bsthmb-', postfix: '.png' }, function (error, thumbPath) {
            if (error) {
                reject(error);
            }
            setFfMpegPath(ffmpegPath);
            try {
                ffmpeg(fullPath)
                    .on('end', function () {
                    fse.readFile(thumbPath)
                        .then(function (buf) { fse.unlink(thumbPath); return parsePng(buf); })
                        .then(function (img) {
                        var buf = jpeg.encode({ width: img.width, height: img.height, data: img.data }).data;
                        resolve({
                            kind: 'local',
                            data: buf,
                            type: 'image/jpeg',
                            size: { width: img.width, height: img.height },
                            hash: getBufferSha1(buf),
                        });
                    })
                        .catch(function (err) { return reject(err); });
                })
                    .on('error', function (error2) {
                    reject(error2);
                })
                    .screenshots({
                    filename: path.basename(thumbPath),
                    timestamps: [2],
                    folder: path.dirname(thumbPath),
                    size: '?x120',
                });
            }
            catch (error3) {
                reject(error3);
            }
        });
    });
}
exports.buildVideoThumb = buildVideoThumb;
function getFileSha1(fullPath) {
    if (!fse.existsSync(fullPath)) {
        return Promise.reject(new error_1.FsError(error_1.FsErrorType.fileNotFoundError, fullPath));
    }
    return new Promise(function (resolve) {
        var rs = fse.createReadStream(fullPath);
        var hash = crypto.createHash('sha1');
        hash.setEncoding('hex');
        rs.on('end', function () {
            hash.end();
            resolve(hash.read());
        });
        rs.pipe(hash);
    });
}
exports.getFileSha1 = getFileSha1;
function getBufferSha1(data) {
    var hash = crypto.createHash('sha1');
    hash.update(data);
    return hash.digest('hex');
}
exports.getBufferSha1 = getBufferSha1;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory(__webpack_require__(51), __webpack_require__(52), __webpack_require__(99));
	else if(typeof define === 'function' && define.amd)
		define(["core-js/es6/set", "core-js/fn/array/from", "isomorphic-path"], factory);
	else if(typeof exports === 'object')
		exports["bsCore"] = factory(require("core-js/es6/set"), require("core-js/fn/array/from"), require("isomorphic-path"));
	else
		root["bsCore"] = factory(root["core-js/es6/set"], root["core-js/fn/array/from"], root["isomorphic-path"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_10__, __WEBPACK_EXTERNAL_MODULE_11__, __WEBPACK_EXTERNAL_MODULE_12__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var MediaType = (function () {
    function MediaType() {
    }
    MediaType.Video = 'Video';
    MediaType.Audio = 'Audio';
    MediaType.Image = 'Image';
    MediaType.Text = 'Text';
    MediaType.Other = 'Other';
    return MediaType;
}());
exports.MediaType = MediaType;
Object.freeze(MediaType);
var VideoConnectorType = (function () {
    function VideoConnectorType() {
    }
    VideoConnectorType.Hdmi = 'HDMI';
    VideoConnectorType.Vga = 'VGA';
    VideoConnectorType.Component = 'Component';
    return VideoConnectorType;
}());
exports.VideoConnectorType = VideoConnectorType;
Object.freeze(VideoConnectorType);
var MonitorOrientationType = (function () {
    function MonitorOrientationType() {
    }
    MonitorOrientationType.Landscape = 'Landscape';
    MonitorOrientationType.PortraitBottomLeft = 'PortraitBottomLeft';
    MonitorOrientationType.PortraitBottomRight = 'PortraitBottomRight';
    return MonitorOrientationType;
}());
exports.MonitorOrientationType = MonitorOrientationType;
Object.freeze(MonitorOrientationType);
var MonitorOverscanType = (function () {
    function MonitorOverscanType() {
    }
    MonitorOverscanType.NoOverscan = 'NoOverscan';
    MonitorOverscanType.OverscanActionSafeArea = 'OverscanActionSafeArea';
    MonitorOverscanType.OverscanTitleSafeArea = 'OverscanTitleSafeArea';
    return MonitorOverscanType;
}());
exports.MonitorOverscanType = MonitorOverscanType;
Object.freeze(MonitorOverscanType);
var DeviceWebPageDisplay = (function () {
    function DeviceWebPageDisplay() {
    }
    DeviceWebPageDisplay.None = 'None';
    DeviceWebPageDisplay.Standard = 'Standard';
    DeviceWebPageDisplay.Custom = 'Custom';
    return DeviceWebPageDisplay;
}());
exports.DeviceWebPageDisplay = DeviceWebPageDisplay;
Object.freeze(DeviceWebPageDisplay);
var TouchCursorDisplayModeType = (function () {
    function TouchCursorDisplayModeType() {
    }
    TouchCursorDisplayModeType.Disabled = 'Disabled';
    TouchCursorDisplayModeType.Auto = 'Auto';
    TouchCursorDisplayModeType.Display = 'Display';
    return TouchCursorDisplayModeType;
}());
exports.TouchCursorDisplayModeType = TouchCursorDisplayModeType;
Object.freeze(TouchCursorDisplayModeType);
var GraphicsZOrderType = (function () {
    function GraphicsZOrderType() {
    }
    GraphicsZOrderType.Back = 'Back';
    GraphicsZOrderType.Middle = 'Middle';
    GraphicsZOrderType.Front = 'Front';
    return GraphicsZOrderType;
}());
exports.GraphicsZOrderType = GraphicsZOrderType;
Object.freeze(GraphicsZOrderType);
var UdpAddressType = (function () {
    function UdpAddressType() {
    }
    UdpAddressType.IPAddress = 'IPAddress';
    UdpAddressType.LocalSubnet = 'LocalSubnet';
    UdpAddressType.Ethernet = 'Ethernet';
    UdpAddressType.Wireless = 'Wireless';
    return UdpAddressType;
}());
exports.UdpAddressType = UdpAddressType;
Object.freeze(UdpAddressType);
var LanguageType = (function () {
    function LanguageType() {
    }
    LanguageType.English = 'English';
    LanguageType.French = 'French';
    LanguageType.German = 'German';
    LanguageType.Spanish = 'Spanish';
    LanguageType.Italian = 'Italian';
    LanguageType.Dutch = 'Dutch';
    LanguageType.Swedish = 'Swedish';
    return LanguageType;
}());
exports.LanguageType = LanguageType;
Object.freeze(LanguageType);
var LanguageKeyType = (function () {
    function LanguageKeyType() {
    }
    LanguageKeyType.English = 'eng';
    LanguageKeyType.French = 'fre';
    LanguageKeyType.German = 'ger';
    LanguageKeyType.Spanish = 'spa';
    LanguageKeyType.Italian = 'ita';
    LanguageKeyType.Dutch = 'dut';
    LanguageKeyType.Swedish = 'swe';
    return LanguageKeyType;
}());
exports.LanguageKeyType = LanguageKeyType;
Object.freeze(LanguageKeyType);
var ZoneType = (function () {
    function ZoneType() {
    }
    ZoneType.VideoOrImages = 'VideoOrImages';
    ZoneType.VideoOnly = 'VideoOnly';
    ZoneType.Images = 'Images';
    ZoneType.AudioOnly = 'AudioOnly';
    ZoneType.EnhancedAudio = 'EnhancedAudio';
    ZoneType.Ticker = 'Ticker';
    ZoneType.Clock = 'Clock';
    ZoneType.BackgroundImage = 'BackgroundImage';
    return ZoneType;
}());
exports.ZoneType = ZoneType;
Object.freeze(ZoneType);
var ViewModeType = (function () {
    function ViewModeType() {
    }
    ViewModeType.ScaleToFill = 'Scale to Fill';
    ViewModeType.Letterboxed = 'Letterboxed and Centered';
    ViewModeType.FillAndCenter = 'Fill Screen and Centered';
    return ViewModeType;
}());
exports.ViewModeType = ViewModeType;
Object.freeze(ViewModeType);
var ImageModeType = (function () {
    function ImageModeType() {
    }
    ImageModeType.CenterImage = 'Center Image';
    ImageModeType.ScaleToFit = 'Scale to Fit';
    ImageModeType.FillAndCrop = 'Scale to Fill and Crop';
    ImageModeType.ScaleToFill = 'Scale to Fill';
    return ImageModeType;
}());
exports.ImageModeType = ImageModeType;
Object.freeze(ImageModeType);
var AudioOutputSelectionType = (function () {
    function AudioOutputSelectionType() {
    }
    AudioOutputSelectionType.Analog = 'Analog';
    AudioOutputSelectionType.Usb = 'Usb';
    AudioOutputSelectionType.DigitalPcm = 'DigitalPcm';
    AudioOutputSelectionType.DigitalAc3 = 'DigitalAc3';
    AudioOutputSelectionType.AnalogHdmiAc3 = 'AnalogHdmiAc3';
    return AudioOutputSelectionType;
}());
exports.AudioOutputSelectionType = AudioOutputSelectionType;
Object.freeze(AudioOutputSelectionType);
var AudioModeType = (function () {
    function AudioModeType() {
    }
    AudioModeType.Surround = 'Surround';
    AudioModeType.Stereo = 'Stereo';
    AudioModeType.NoAudio = 'NoAudio';
    AudioModeType.Left = 'Left';
    AudioModeType.Right = 'Right';
    return AudioModeType;
}());
exports.AudioModeType = AudioModeType;
Object.freeze(AudioModeType);
var AudioMappingType = (function () {
    function AudioMappingType() {
    }
    AudioMappingType.Audio1 = 'Audio1';
    AudioMappingType.Audio2 = 'Audio2';
    AudioMappingType.Audio3 = 'Audio3';
    AudioMappingType.AudioAll = 'AudioAll';
    return AudioMappingType;
}());
exports.AudioMappingType = AudioMappingType;
Object.freeze(AudioMappingType);
var AudioOutputName = (function () {
    function AudioOutputName() {
    }
    AudioOutputName.Analog1 = 'analog1';
    AudioOutputName.Analog2 = 'analog2';
    AudioOutputName.Analog3 = 'analog3';
    AudioOutputName.UsbA = 'usbA';
    AudioOutputName.UsbB = 'usbB';
    AudioOutputName.UsbC = 'usbC';
    AudioOutputName.UsbD = 'usbD';
    AudioOutputName.Hdmi = 'hdmi';
    AudioOutputName.Spdif = 'spdif';
    return AudioOutputName;
}());
exports.AudioOutputName = AudioOutputName;
Object.freeze(AudioOutputName);
exports.AudioOutputNameArray = [
    'analog1', 'analog2', 'analog3', 'usbA', 'usbB', 'usbC', 'usbD', 'hdmi', 'spdif',
];
var AudioOutputType = (function () {
    function AudioOutputType() {
    }
    AudioOutputType.Pcm = 'Pcm';
    AudioOutputType.Passthrough = 'Passthrough';
    AudioOutputType.Multichannel = 'Multichannel';
    AudioOutputType.None = 'None';
    return AudioOutputType;
}());
exports.AudioOutputType = AudioOutputType;
Object.freeze(AudioOutputType);
var AudioMixModeType = (function () {
    function AudioMixModeType() {
    }
    AudioMixModeType.Stereo = 'Stereo';
    AudioMixModeType.Left = 'Left';
    AudioMixModeType.Right = 'Right';
    return AudioMixModeType;
}());
exports.AudioMixModeType = AudioMixModeType;
Object.freeze(AudioMixModeType);
var LiveVideoInputType = (function () {
    function LiveVideoInputType() {
    }
    LiveVideoInputType.SVideo = 'S-Video';
    LiveVideoInputType.Composite = 'Composite';
    return LiveVideoInputType;
}());
exports.LiveVideoInputType = LiveVideoInputType;
Object.freeze(LiveVideoInputType);
var LiveVideoStandardType = (function () {
    function LiveVideoStandardType() {
    }
    LiveVideoStandardType.NtscM = 'NTSC-M';
    LiveVideoStandardType.NtscMj = 'NTSC-Mj';
    LiveVideoStandardType.Ntsc443 = 'NTSC-443';
    LiveVideoStandardType.NtscMk = 'NTSC-Mk';
    LiveVideoStandardType.PalB = 'PAL-B';
    LiveVideoStandardType.PalB1 = 'PAL-B1';
    LiveVideoStandardType.PalG = 'PAL-G';
    LiveVideoStandardType.PalDK = 'PAL-D/K';
    LiveVideoStandardType.PalH = 'PAL-H';
    LiveVideoStandardType.PalI = 'PAL-I';
    LiveVideoStandardType.PalD = 'PAL-D';
    LiveVideoStandardType.PalD1 = 'PAL-D1';
    LiveVideoStandardType.PalK = 'PAL-K';
    LiveVideoStandardType.PalM = 'PAL-M';
    LiveVideoStandardType.PalN = 'PAL-N';
    LiveVideoStandardType.PalNC = 'PAL-NC';
    LiveVideoStandardType.Pal60 = 'PAL-60';
    LiveVideoStandardType.SecamL = 'SECAM-L';
    LiveVideoStandardType.SecamB = 'SECAM-B';
    LiveVideoStandardType.SecamD = 'SECAM-D';
    LiveVideoStandardType.SecamG = 'SECAM-G';
    LiveVideoStandardType.SecamH = 'SECAM-H';
    LiveVideoStandardType.SecamK = 'SECAM-K';
    LiveVideoStandardType.SecamK1 = 'SECAM-K1';
    LiveVideoStandardType.SecamLC = 'SECAM-LC';
    LiveVideoStandardType.SecamDK = 'SECAM-D/K';
    return LiveVideoStandardType;
}());
exports.LiveVideoStandardType = LiveVideoStandardType;
Object.freeze(LiveVideoStandardType);
var MosaicMaxContentResolutionType = (function () {
    function MosaicMaxContentResolutionType() {
    }
    MosaicMaxContentResolutionType.NotApplicable = 'NotApplicable';
    MosaicMaxContentResolutionType.QCIF = 'QCIF';
    MosaicMaxContentResolutionType.CIF = 'CIF';
    MosaicMaxContentResolutionType.SD = 'SD';
    MosaicMaxContentResolutionType.HD = 'HD';
    MosaicMaxContentResolutionType.FK = '4K';
    return MosaicMaxContentResolutionType;
}());
exports.MosaicMaxContentResolutionType = MosaicMaxContentResolutionType;
Object.freeze(MosaicMaxContentResolutionType);
var VideoDisplayModeType = (function () {
    function VideoDisplayModeType() {
    }
    VideoDisplayModeType.m2D = '2D';
    VideoDisplayModeType.m3DTOB = '3DTOB';
    VideoDisplayModeType.m3DSBS = '3DSBS';
    return VideoDisplayModeType;
}());
exports.VideoDisplayModeType = VideoDisplayModeType;
Object.freeze(VideoDisplayModeType);
var RotationType = (function () {
    function RotationType() {
    }
    RotationType.rot0 = '0';
    RotationType.rot90 = '90';
    RotationType.rot180 = '180';
    RotationType.rot270 = '270';
    return RotationType;
}());
exports.RotationType = RotationType;
Object.freeze(RotationType);
var TextHAlignmentType = (function () {
    function TextHAlignmentType() {
    }
    TextHAlignmentType.Left = 'Left';
    TextHAlignmentType.Center = 'Center';
    TextHAlignmentType.Right = 'Right';
    return TextHAlignmentType;
}());
exports.TextHAlignmentType = TextHAlignmentType;
Object.freeze(TextHAlignmentType);
var TextScrollingMethodType = (function () {
    function TextScrollingMethodType() {
    }
    TextScrollingMethodType.Animated = 'Animated';
    TextScrollingMethodType.StaticText = 'StaticText';
    TextScrollingMethodType.Scrolling = 'Scrolling';
    return TextScrollingMethodType;
}());
exports.TextScrollingMethodType = TextScrollingMethodType;
Object.freeze(TextScrollingMethodType);
var GpioType = (function () {
    function GpioType() {
    }
    GpioType.Input = 'input';
    GpioType.Output = 'output';
    return GpioType;
}());
exports.GpioType = GpioType;
Object.freeze(GpioType);
var ButtonPanelName = (function () {
    function ButtonPanelName() {
    }
    ButtonPanelName.Bp900a = 'bp900a';
    ButtonPanelName.Bp900b = 'bp900b';
    ButtonPanelName.Bp900c = 'bp900c';
    ButtonPanelName.Bp900d = 'bp900d';
    ButtonPanelName.Bp200a = 'bp200a';
    ButtonPanelName.Bp200b = 'bp200b';
    ButtonPanelName.Bp200c = 'bp200c';
    ButtonPanelName.Bp200d = 'bp200d';
    return ButtonPanelName;
}());
exports.ButtonPanelName = ButtonPanelName;
Object.freeze(ButtonPanelName);
exports.ButtonPanelNameArray = [
    'bp900a', 'bp900b', 'bp900c', 'bp900d', 'bp200a', 'bp200b', 'bp200c', 'bp200d',
];
var ContentItemType = (function () {
    function ContentItemType() {
    }
    ContentItemType.Video = 'Video';
    ContentItemType.Image = 'Image';
    ContentItemType.Audio = 'Audio';
    ContentItemType.Html = 'Html';
    ContentItemType.LiveVideo = 'LiveVideo';
    ContentItemType.DataFeed = 'DataFeed';
    ContentItemType.MrssFeed = 'MrssFeed';
    ContentItemType.TwitterFeed = 'TwitterFeed';
    ContentItemType.Text = 'Text';
    ContentItemType.VideoStream = 'VideoStream';
    ContentItemType.AudioStream = 'AudioStream';
    ContentItemType.Clock = 'Clock';
    ContentItemType.EventHandler = 'EventHandler';
    ContentItemType.PlayFile = 'PlayFile';
    ContentItemType.MediaList = 'MediaList';
    ContentItemType.SuperState = 'SuperState';
    ContentItemType.Invalid = 'Invalid';
    return ContentItemType;
}());
exports.ContentItemType = ContentItemType;
Object.freeze(ContentItemType);
function bscGetContentItemTypeForMediaType(type) {
    if (type !== MediaType.Other) {
        return type;
    }
    return ContentItemType.Invalid;
}
exports.bscGetContentItemTypeForMediaType = bscGetContentItemTypeForMediaType;
var EventType = (function () {
    function EventType() {
    }
    EventType.MediaEnd = 'MediaEnd';
    EventType.Timer = 'Timer';
    EventType.MediaListEnd = 'MediaListEnd';
    EventType.Keyboard = 'Keyboard';
    EventType.Remote = 'Remote';
    EventType.Usb = 'Usb';
    EventType.Synchronize = 'Synchronize';
    EventType.ZoneMessage = 'ZoneMessage';
    EventType.InternalSynchronize = 'InternalSynchronize';
    EventType.Success = 'Success';
    EventType.Fail = 'Fail';
    EventType.Serial = 'Serial';
    EventType.TimeClock = 'TimeClock';
    EventType.AuxConnect = 'AuxConnect';
    EventType.AuxDisconnect = 'AuxDisconnect';
    EventType.Gps = 'Gps';
    EventType.AudioTimeCode = 'AudioTimeCode';
    EventType.VideoTimeCode = 'VideoTimeCode';
    EventType.RectangularTouch = 'RectangularTouch';
    EventType.Gpio = 'Gpio';
    EventType.Bp = 'Bp';
    EventType.PluginMessage = 'PluginMessage';
    EventType.Udp = 'Udp';
    EventType.InteractiveMenu = 'InteractiveMenu';
    return EventType;
}());
exports.EventType = EventType;
Object.freeze(EventType);
var TransitionType = (function () {
    function TransitionType() {
    }
    TransitionType.None = 'None';
    TransitionType.NoEffect = 'No effect';
    TransitionType.WipeTop = 'Image wipe from top';
    TransitionType.WipeBottom = 'Image wipe from bottom';
    TransitionType.WipeLeft = 'Image wipe from left';
    TransitionType.WipeRight = 'Image wipe from right';
    TransitionType.ExplodeFromCenter = 'Explode from center';
    TransitionType.ExplodeTopLeft = 'Explode top left';
    TransitionType.ExplodeTopRight = 'Explode top right';
    TransitionType.ExplodeBottomLeft = 'Explode bottom left';
    TransitionType.ExplodeBottomRight = 'Explode bottom right';
    TransitionType.BlindsVertical = 'Venetian blinds - vertical';
    TransitionType.BlindsHorizontal = 'Venetian blinds - horizontal';
    TransitionType.CombVertical = 'Comb effect - vertical';
    TransitionType.CombHorizontal = 'Comb effect - horizontal';
    TransitionType.FadeToBackground = 'Fade to background color';
    TransitionType.Fade = 'Fade to new image';
    TransitionType.SlideFromTop = 'Slide from top';
    TransitionType.SlideFromBottom = 'Slide from bottom';
    TransitionType.SlideFromLeft = 'Slide from left';
    TransitionType.SlideFromRight = 'Slide from right';
    return TransitionType;
}());
exports.TransitionType = TransitionType;
Object.freeze(TransitionType);
var CompareOperator = (function () {
    function CompareOperator() {
    }
    CompareOperator.EQ = 'EQ';
    CompareOperator.NEQ = 'NEQ';
    CompareOperator.BTW = 'BTW';
    CompareOperator.GT = 'GT';
    CompareOperator.GTE = 'GTE';
    CompareOperator.LT = 'LT';
    CompareOperator.LTE = 'LTE';
    return CompareOperator;
}());
exports.CompareOperator = CompareOperator;
Object.freeze(CompareOperator);
var AccessType = (function () {
    function AccessType() {
    }
    AccessType.Private = 'Private';
    AccessType.Shared = 'Shared';
    return AccessType;
}());
exports.AccessType = AccessType;
Object.freeze(AccessType);
var StringParameterType = (function () {
    function StringParameterType() {
    }
    StringParameterType.Text = 'Text';
    StringParameterType.UserVariable = 'UserVariable';
    StringParameterType.UserVariableName = 'UserVariableName';
    return StringParameterType;
}());
exports.StringParameterType = StringParameterType;
Object.freeze(StringParameterType);
var HtmlSiteType = (function () {
    function HtmlSiteType() {
    }
    HtmlSiteType.Hosted = 'Hosted';
    HtmlSiteType.Remote = 'Remote';
    return HtmlSiteType;
}());
exports.HtmlSiteType = HtmlSiteType;
Object.freeze(HtmlSiteType);
var DataFeedType = (function () {
    function DataFeedType() {
    }
    DataFeedType.URLDataFeed = 'URLDataFeed';
    DataFeedType.BSNDataFeed = 'BSNDataFeed';
    DataFeedType.BSNMediaFeed = 'BSNMediaFeed';
    DataFeedType.BSNDynamicPlaylist = 'BSNDynamicPlaylist';
    DataFeedType.BSNTaggedPlaylist = 'BSNTaggedPlaylist';
    return DataFeedType;
}());
exports.DataFeedType = DataFeedType;
Object.freeze(DataFeedType);
var DataFeedUsageType = (function () {
    function DataFeedUsageType() {
    }
    DataFeedUsageType.Text = 'Text';
    DataFeedUsageType.Mrss = 'MRSS';
    DataFeedUsageType.MrssWith4K = 'MRSSWith4K';
    DataFeedUsageType.Content = 'Content';
    return DataFeedUsageType;
}());
exports.DataFeedUsageType = DataFeedUsageType;
Object.freeze(DataFeedUsageType);
var PlayerTagMatchingType = (function () {
    function PlayerTagMatchingType() {
    }
    PlayerTagMatchingType.DoNotMatchTags = 'DoNotMatchTags';
    PlayerTagMatchingType.MatchAllMediaTagsToPlayerTags = 'MatchAllMediaTagsToPlayerTags';
    PlayerTagMatchingType.MatchAllPlayerTagsToMediaTags = 'MatchAllPlayerTagsToMediaTags';
    PlayerTagMatchingType.MatchAnyPlayerAndMediaTags = 'MatchAnyPlayerAndMediaTags';
    return PlayerTagMatchingType;
}());
exports.PlayerTagMatchingType = PlayerTagMatchingType;
Object.freeze(PlayerTagMatchingType);
var SystemVariableType = (function () {
    function SystemVariableType() {
    }
    SystemVariableType.SerialNumber = 'SerialNumber';
    SystemVariableType.IPAddressWired = 'IPAddressWired';
    SystemVariableType.IPAddressWireless = 'IPAddressWireless';
    SystemVariableType.FirmwareVersion = 'FirmwareVersion';
    SystemVariableType.ScriptVersion = 'ScriptVersion';
    SystemVariableType.EdidMonitorSerialNumber = 'EdidMonitorSerialNumber';
    SystemVariableType.EdidYearOfManufacture = 'EdidYearOfManufacture';
    SystemVariableType.EdidMonitorName = 'EdidMonitorName';
    SystemVariableType.EdidManufacturer = 'EdidManufacturer';
    SystemVariableType.EdidUnspecifiedText = 'EdidUnspecifiedText';
    SystemVariableType.EdidSerialNumber = 'EdidSerialNumber';
    SystemVariableType.EdidManufacturerProductCode = 'EdidManufacturerProductCode';
    SystemVariableType.EdidWeekOfManufacture = 'EdidWeekOfManufacture';
    SystemVariableType.ActivePresentation = 'ActivePresentation';
    return SystemVariableType;
}());
exports.SystemVariableType = SystemVariableType;
exports.BsBlack = { a: 255, r: 0, g: 0, b: 0 };
Object.freeze(exports.BsBlack);
exports.DmBlack = exports.BsBlack;
function getEnumKeyOfValue(enumType, value) {
    for (var _i = 0, _a = Object.keys(enumType); _i < _a.length; _i++) {
        var key = _a[_i];
        if (enumType[key] === value) {
            return key;
        }
    }
    return null;
}
exports.getEnumKeyOfValue = getEnumKeyOfValue;
function isInstanceOfEnum(enumType, value) {
    return getEnumKeyOfValue(enumType, value) !== null;
}
exports.isInstanceOfEnum = isInstanceOfEnum;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var PlayerFamily = (function () {
    function PlayerFamily() {
    }
    PlayerFamily.Unknown = 'Unknown';
    PlayerFamily.Malibu = 'Malibu';
    PlayerFamily.Impala = 'Impala';
    PlayerFamily.Pantera = 'Pantera';
    PlayerFamily.Tiger = 'Tiger';
    PlayerFamily.Lynx = 'Lynx';
    PlayerFamily.Bobcat = 'Bobcat';
    PlayerFamily.Cheetah = 'Cheetah';
    PlayerFamily.Panther = 'Panther';
    PlayerFamily.Puma = 'Puma';
    PlayerFamily.Monaco = 'Monaco';
    return PlayerFamily;
}());
exports.PlayerFamily = PlayerFamily;
var PlayerModel = (function () {
    function PlayerModel() {
    }
    PlayerModel.Unknown = 'Unknown';
    PlayerModel.XD1034 = 'XD1034';
    PlayerModel.XD234 = 'XD234';
    PlayerModel.XT1144 = 'XT1144';
    PlayerModel.XT244 = 'XT244';
    PlayerModel.XD1133 = 'XD1133';
    PlayerModel.XD1033 = 'XD1033';
    PlayerModel.XD233 = 'XD233';
    PlayerModel.XT1043 = 'XT1043';
    PlayerModel.XT1143 = 'XT1143';
    PlayerModel.XT243 = 'XT243';
    PlayerModel.HD1423 = 'HD1423';
    PlayerModel.HD1023 = 'HD1023';
    PlayerModel.HD223 = 'HD223';
    PlayerModel.HS123 = 'HS123';
    PlayerModel.HO523 = 'HO523';
    PlayerModel.LS423 = 'LS423';
    PlayerModel.FK1142 = '4K1142';
    PlayerModel.FK1042 = '4K1042';
    PlayerModel.FK242 = '4K242';
    PlayerModel.TK1042 = '2K1042';
    PlayerModel.XD1132 = 'XD1132';
    PlayerModel.XD1032 = 'XD1032';
    PlayerModel.XD232 = 'XD232';
    PlayerModel.HD1022 = 'HD1022';
    PlayerModel.HD222 = 'HD222';
    PlayerModel.HD972 = 'HD972';
    PlayerModel.HD922 = 'HD922';
    PlayerModel.XD1230 = 'XD1230';
    PlayerModel.XD1030 = 'XD1030';
    PlayerModel.XD230 = 'XD230';
    PlayerModel.HD1020 = 'HD1020';
    PlayerModel.HD220 = 'HD220';
    PlayerModel.HD120 = 'HD120';
    PlayerModel.LS422 = 'LS422';
    PlayerModel.LS322 = 'LS322';
    PlayerModel.AU320 = 'AU320';
    PlayerModel.HD970 = 'HD970';
    PlayerModel.HD920 = 'HD920';
    PlayerModel.A915 = 'A915';
    PlayerModel.HD917 = 'HD917';
    PlayerModel.HD210 = 'HD210';
    PlayerModel.HD1010 = 'HD1010';
    PlayerModel.TD1012 = 'TD1012';
    return PlayerModel;
}());
exports.PlayerModel = PlayerModel;
var MalibuModelArray = [
    PlayerModel.XD1034,
    PlayerModel.XD234,
    PlayerModel.XT1144,
    PlayerModel.XT244,
];
exports.MalibuModels = new Set(MalibuModelArray);
var ImpalaModelArray = [
    PlayerModel.XD1033,
    PlayerModel.XD233,
    PlayerModel.XT1143,
    PlayerModel.XT243,
];
exports.ImpalaModels = new Set(ImpalaModelArray);
var PanteraModelArray = [
    PlayerModel.HD1023,
    PlayerModel.HD223,
    PlayerModel.HS123,
    PlayerModel.HO523,
    PlayerModel.LS423,
];
exports.PanteraModels = new Set(PanteraModelArray);
var TigerModelArray = [
    PlayerModel.FK1142,
    PlayerModel.FK1042,
    PlayerModel.FK242,
];
exports.TigerModels = new Set(TigerModelArray);
var LynxModelArray = [
    PlayerModel.XD1132,
    PlayerModel.XD1032,
    PlayerModel.XD232,
];
exports.LynxModels = new Set(LynxModelArray);
var BobcatModelArray = [
    PlayerModel.HD1022,
    PlayerModel.HD222,
    PlayerModel.HD972,
    PlayerModel.HD922,
];
exports.BobcatModels = new Set(BobcatModelArray);
var CheetahModelArray = [
    PlayerModel.XD1230,
    PlayerModel.XD1030,
    PlayerModel.XD230,
];
exports.CheetahModels = new Set(CheetahModelArray);
var PantherModelArray = [
    PlayerModel.HD1020,
    PlayerModel.HD220,
    PlayerModel.HD120,
    PlayerModel.LS422,
    PlayerModel.LS322,
    PlayerModel.AU320,
];
exports.PantherModels = new Set(PantherModelArray);
var PumaModelArray = [
    PlayerModel.HD970,
    PlayerModel.HD920,
    PlayerModel.A915,
    PlayerModel.HD917,
];
exports.PumaModels = new Set(PumaModelArray);
var MonacoModelArray = [
    PlayerModel.HD210,
    PlayerModel.HD1010,
    PlayerModel.TD1012,
];
exports.MonacoModels = new Set(MonacoModelArray);
exports.Series4Models = new Set(MalibuModelArray);
exports.Series3Models = new Set(ImpalaModelArray.concat(PanteraModelArray));
exports.Series2Models = new Set(TigerModelArray.concat(LynxModelArray, BobcatModelArray));
exports.AllModels = new Set(MalibuModelArray.concat(ImpalaModelArray, PanteraModelArray, TigerModelArray, LynxModelArray, BobcatModelArray, CheetahModelArray, PantherModelArray, PumaModelArray, MonacoModelArray));


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(11);
__webpack_require__(10);
__export(__webpack_require__(0));
__export(__webpack_require__(1));
__export(__webpack_require__(8));
__export(__webpack_require__(9));
__export(__webpack_require__(6));
__export(__webpack_require__(3));
__export(__webpack_require__(7));
__export(__webpack_require__(5));
__export(__webpack_require__(4));


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var metadata_1 = __webpack_require__(0);
var isomorphic_path_1 = __webpack_require__(12);
exports.BsAssetIdNone = '0';
function bscIsValidAssetId(id) {
    return typeof id === 'string' && id.length >= 8;
}
exports.bscIsValidAssetId = bscIsValidAssetId;
var AssetLocation = (function () {
    function AssetLocation() {
    }
    AssetLocation.Local = 'Local';
    AssetLocation.Bsn = 'Bsn';
    return AssetLocation;
}());
exports.AssetLocation = AssetLocation;
Object.freeze(AssetLocation);
var AssetType = (function () {
    function AssetType() {
    }
    AssetType.Content = 'Content';
    AssetType.Project = 'Project';
    AssetType.ProjectBpf = 'ProjectBpf';
    AssetType.BrightScript = 'BrightScript';
    AssetType.HtmlSite = 'HtmlSite';
    AssetType.DeviceHtmlSite = 'DeviceHtmlSite';
    AssetType.Font = 'Font';
    AssetType.Folder = 'Folder';
    AssetType.BSNDataFeed = 'BSNDataFeed';
    AssetType.BSNMediaFeed = 'BSNMediaFeed';
    AssetType.BSNDynamicPlaylist = 'BSNDynamicPlaylist';
    AssetType.BSNTaggedPlaylist = 'BSNTaggedPlaylist';
    AssetType.Xml = 'Xml';
    AssetType.Other = 'Other';
    return AssetType;
}());
exports.AssetType = AssetType;
Object.freeze(AssetType);
function bscIsLocalAssetThumbnail(assetThumbnail) {
    return assetThumbnail.kind === 'local';
}
exports.bscIsLocalAssetThumbnail = bscIsLocalAssetThumbnail;
function bscIsAssetItem(item) {
    return item != null
        && typeof item === 'object'
        && item.hasOwnProperty('assetType')
        && item.hasOwnProperty('location')
        && item.hasOwnProperty('locator');
}
exports.bscIsAssetItem = bscIsAssetItem;
function bscAssetItemIsBsnDataFeed(item) {
    return item.hasOwnProperty('assetType')
        && (item.assetType === AssetType.BSNDataFeed
            || item.assetType === AssetType.BSNMediaFeed
            || item.assetType === AssetType.BSNDynamicPlaylist
            || item.assetType === AssetType.BSNTaggedPlaylist);
}
exports.bscAssetItemIsBsnDataFeed = bscAssetItemIsBsnDataFeed;
function bscAssetItemFromAssetLocator(assetLocator) {
    return __assign({ id: exports.BsAssetIdNone }, assetLocator, { locator: bscGenerateAssetLocatorKey(assetLocator) });
}
exports.bscAssetItemFromAssetLocator = bscAssetItemFromAssetLocator;
function bscAssetLocatorForBsnAsset(assetType, bsnId, network) {
    if (network === void 0) { network = ''; }
    return {
        name: '',
        path: '',
        location: AssetLocation.Bsn,
        assetType: assetType,
        networkId: bsnId,
        scope: network,
    };
}
exports.bscAssetLocatorForBsnAsset = bscAssetLocatorForBsnAsset;
function bscGetAssetName(locator) {
    if (locator.location === AssetLocation.Bsn && locator.assetType !== AssetType.Content) {
        return locator.name;
    }
    return isomorphic_path_1.default.basename(locator.name, isomorphic_path_1.default.extname(locator.name));
}
exports.bscGetAssetName = bscGetAssetName;
function bscGetAssetExtension(locator) {
    if (locator.location === AssetLocation.Local || locator.assetType === AssetType.Content) {
        return isomorphic_path_1.default.extname(locator.name);
    }
    return '';
}
exports.bscGetAssetExtension = bscGetAssetExtension;
var leadingSep = function (path) {
    return path.charAt(0) === isomorphic_path_1.default.sep ? '' : isomorphic_path_1.default.sep;
};
var trailingSep = function (path) {
    return !path || path.charAt(path.length - 1) === isomorphic_path_1.default.sep ? '' : isomorphic_path_1.default.sep;
};
function bscAssetLocatorForLocalAsset(assetType, fullPath, scope) {
    if (scope === void 0) { scope = ''; }
    var dirName = isomorphic_path_1.default.dirname(fullPath);
    return {
        name: isomorphic_path_1.default.basename(fullPath),
        path: dirName + trailingSep(dirName),
        location: AssetLocation.Local,
        assetType: assetType,
        networkId: 0,
        scope: scope,
    };
}
exports.bscAssetLocatorForLocalAsset = bscAssetLocatorForLocalAsset;
function bscAssetItemFromBasicAssetInfo(assetType, fileName, fileDirPath, bsnId, mediaType, scope) {
    if (fileDirPath === void 0) { fileDirPath = null; }
    if (bsnId === void 0) { bsnId = 0; }
    if (mediaType === void 0) { mediaType = null; }
    if (scope === void 0) { scope = ''; }
    var assetLocator;
    if (!fileDirPath) {
        fileDirPath = isomorphic_path_1.default.sep;
    }
    if (bsnId) {
        assetLocator = bscAssetLocatorForBsnAsset(assetType, bsnId, scope);
        assetLocator.name = fileName;
        assetLocator.path = fileDirPath;
    }
    else if (fileName) {
        var fullPath = isomorphic_path_1.default.join(fileDirPath, fileName);
        assetLocator = bscAssetLocatorForLocalAsset(assetType, fullPath, scope);
    }
    if (assetLocator) {
        var assetItem = bscAssetItemFromAssetLocator(assetLocator);
        if (assetType === AssetType.Content) {
            assetItem.mediaType = mediaType ? mediaType : bscGetFileMediaType(assetItem.name);
        }
        return assetItem;
    }
    return null;
}
exports.bscAssetItemFromBasicAssetInfo = bscAssetItemFromBasicAssetInfo;
function bscGenerateAssetLocatorKey(item) {
    switch (item.location) {
        case AssetLocation.Local:
        default:
            if (item.path !== undefined && item.name) {
                return 'file://' + leadingSep(item.path) + item.path + trailingSep(item.path) + item.name;
            }
            break;
        case AssetLocation.Bsn:
            if (item.networkId) {
                return 'bsn://' + item.assetType + '/' + item.networkId;
            }
            break;
    }
    return '';
}
exports.bscGenerateAssetLocatorKey = bscGenerateAssetLocatorKey;
function bscGenerateAssetLocator(item) {
    return bscGenerateAssetLocatorKey(item);
}
exports.bscGenerateAssetLocator = bscGenerateAssetLocator;
function bscGetLocalAssetLocatorKey(path) {
    return path ? 'file://' + leadingSep(path) + path : '';
}
exports.bscGetLocalAssetLocatorKey = bscGetLocalAssetLocatorKey;
function bscGetLocalAssetLocator(path) {
    return bscGetLocalAssetLocatorKey(path);
}
exports.bscGetLocalAssetLocator = bscGetLocalAssetLocator;
function bscGetBsnAssetLocatorKey(bsnId, assetType) {
    return bsnId ? 'bsn://' + assetType + '/' + bsnId : '';
}
exports.bscGetBsnAssetLocatorKey = bscGetBsnAssetLocatorKey;
var NullAssetBaseName = '__null__';
function bscGetNullAssetItem(assetType, assetLocation, mediaType) {
    if (assetLocation === void 0) { assetLocation = AssetLocation.Local; }
    var nullAssetItem = {
        id: exports.BsAssetIdNone,
        name: NullAssetBaseName + assetType,
        path: '',
        location: assetLocation,
        assetType: assetType,
        networkId: -1,
        scope: null,
        locator: null,
    };
    if (assetType === AssetType.Content && mediaType) {
        nullAssetItem.name = NullAssetBaseName + mediaType;
        nullAssetItem.mediaType = mediaType;
    }
    return nullAssetItem;
}
exports.bscGetNullAssetItem = bscGetNullAssetItem;
function bscIsNullAssetItem(assetItem) {
    return bscIsAssetItem(assetItem)
        && assetItem.name.substr(0, NullAssetBaseName.length) === NullAssetBaseName
        && assetItem.networkId === -1;
}
exports.bscIsNullAssetItem = bscIsNullAssetItem;
var DefaultAssetBaseName = '__default__';
function bscGetDefaultAssetItem(assetType, assetLocation, mediaType) {
    if (assetLocation === void 0) { assetLocation = AssetLocation.Local; }
    var defaultAssetItem = {
        id: exports.BsAssetIdNone,
        name: DefaultAssetBaseName + assetType,
        path: '',
        location: assetLocation,
        assetType: assetType,
        networkId: -1,
        scope: null,
        locator: null,
    };
    if (assetType === AssetType.Content && mediaType) {
        defaultAssetItem.name = DefaultAssetBaseName + mediaType;
        defaultAssetItem.mediaType = mediaType;
    }
    return defaultAssetItem;
}
exports.bscGetDefaultAssetItem = bscGetDefaultAssetItem;
function bscIsDefaultAssetItem(assetItem) {
    return bscIsAssetItem(assetItem)
        && assetItem.name.substr(0, DefaultAssetBaseName.length) === DefaultAssetBaseName
        && assetItem.networkId === -1;
}
exports.bscIsDefaultAssetItem = bscIsDefaultAssetItem;
exports.imageFileSuffixes = new Set(['jpg', 'jpeg', 'png', 'bmp']);
exports.videoFileSuffixes = new Set(['mov', 'mp4', 'mpg', 'ts', 'vob', 'wmv', 'm2ts', 'mkv']);
exports.audioFileSuffixes = new Set(['mp3', 'wav', 'm4a', 'aiff', 'aac']);
exports.textFileSuffixes = new Set(['txt']);
function bscGetFileExt(pathOrFileName) {
    var result = pathOrFileName.match(/\.([A-Z0-9]+)$/i);
    return result ? result[1].toLowerCase() : '';
}
function bscGetFileMediaType(pathOrFileName) {
    if (pathOrFileName) {
        var ext = bscGetFileExt(pathOrFileName);
        if (ext) {
            if (exports.imageFileSuffixes.has(ext)) {
                return metadata_1.MediaType.Image;
            }
            else if (exports.videoFileSuffixes.has(ext)) {
                return metadata_1.MediaType.Video;
            }
            else if (exports.audioFileSuffixes.has(ext)) {
                return metadata_1.MediaType.Audio;
            }
            else if (exports.textFileSuffixes.has(ext)) {
                return metadata_1.MediaType.Text;
            }
        }
    }
    return metadata_1.MediaType.Other;
}
exports.bscGetFileMediaType = bscGetFileMediaType;
exports.projectFileSuffixes = new Set(['bpfx']);
exports.projectBpfFileSuffixes = new Set(['bpf']);
exports.htmlSiteFileSuffixes = new Set(['html', 'htm', 'css', 'js']);
exports.fontFileSuffixes = new Set(['ttf', 'otf']);
function bscGetBscFileTypeInfo(pathOrFileName) {
    var typeInfo = {
        assetType: AssetType.Content,
        mediaType: bscGetFileMediaType(pathOrFileName),
    };
    if (typeInfo.mediaType === metadata_1.MediaType.Other) {
        var ext = bscGetFileExt(pathOrFileName);
        if (ext === 'bpfx') {
            typeInfo.assetType = AssetType.Project;
        }
        else if (ext === 'bpf') {
            typeInfo.assetType = AssetType.ProjectBpf;
        }
        else if (exports.htmlSiteFileSuffixes.has(ext)) {
            typeInfo.assetType = AssetType.HtmlSite;
        }
        else if (exports.fontFileSuffixes.has(ext)) {
            typeInfo.assetType = AssetType.Font;
        }
        else if (ext === 'brs') {
            typeInfo.assetType = AssetType.BrightScript;
        }
        else if (ext === 'xml') {
            typeInfo.assetType = AssetType.Xml;
        }
        else {
            typeInfo.assetType = AssetType.Other;
        }
    }
    return typeInfo;
}
exports.bscGetBscFileTypeInfo = bscGetBscFileTypeInfo;


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var BsnPresentationType = (function () {
    function BsnPresentationType() {
    }
    BsnPresentationType.Simple = 'Simple';
    BsnPresentationType.Complete = 'Complete';
    return BsnPresentationType;
}());
exports.BsnPresentationType = BsnPresentationType;
var BsnPresentationStatus = (function () {
    function BsnPresentationStatus() {
    }
    BsnPresentationStatus.Draft = 'Draft';
    BsnPresentationStatus.Published = 'Published';
    return BsnPresentationStatus;
}());
exports.BsnPresentationStatus = BsnPresentationStatus;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var ScheduleRecurrencePattern = (function () {
    function ScheduleRecurrencePattern() {
    }
    ScheduleRecurrencePattern.AllDays = 'AllDays';
    ScheduleRecurrencePattern.Weekends = 'Weekends';
    ScheduleRecurrencePattern.Weekdays = 'Weekdays';
    ScheduleRecurrencePattern.Custom = 'Custom';
    return ScheduleRecurrencePattern;
}());
exports.ScheduleRecurrencePattern = ScheduleRecurrencePattern;
Object.freeze(ScheduleRecurrencePattern);
exports.PublishDataKeys = [
    'hD920_970Firmware', 'hD920_970FirmwareId', 'hD922_972Firmware', 'hD922_972FirmwareId',
    'hdX10Firmware', 'hdX10FirmwareId', 'hdX20Firmware', 'hdX20FirmwareId', 'hdX22Firmware', 'hdX22FirmwareId',
    'hdX23Firmware', 'hdX23FirmwareId', 'lsX23Firmware', 'lsX23FirmwareId', 'hsX23Firmware', 'hsX23FirmwareId',
    'hoX23Firmware', 'hoX23FirmwareId', 'xdX30Firmware', 'xdX30FirmwareId', 'xdX32Firmware', 'xdX32FirmwareId',
    'xdX33Firmware', 'xdX33FirmwareId', 'xtX43Firmware', 'xtX43FirmwareId', '4KX42Firmware', '4KX42FirmwareId',
    'enableSerialDebugging', 'enableSystemLogDebugging', 'enableStorageSpaceLimit',
    'storageSpaceLimitUnits', 'publishedDataSizeLimit', 'dynamicDataSizeLimit',
    'htmlDataSizeLimit', 'htmlLocalStorageSizeLimit', 'webDatabaseSizeLimit',
];


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var main_1 = __webpack_require__(2);
function bscCreatePercentageRect(x, y, width, height) {
    return { x: x, y: y, width: width, height: height, pct: true };
}
exports.bscCreatePercentageRect = bscCreatePercentageRect;
function bscCreateAbsoluteRect(x, y, width, height) {
    return { x: x, y: y, width: width, height: height, pct: false };
}
exports.bscCreateAbsoluteRect = bscCreateAbsoluteRect;
function bscGetAbsoluteRectForVideoMode(rect, mode) {
    var returnRect = rect;
    if (rect.pct) {
        var modeComponents = main_1.bscParseVideoModeComponents(mode);
        returnRect = bscCreateAbsoluteRect(Math.round(rect.x * modeComponents.width / 100), Math.round(rect.y * modeComponents.height / 100), Math.round(rect.width * modeComponents.width / 100), Math.round(rect.height * modeComponents.height / 100));
    }
    return returnRect;
}
exports.bscGetAbsoluteRectForVideoMode = bscGetAbsoluteRectForVideoMode;
function bscGetPercentageRectForVideoMode(rect, mode) {
    var returnRect = rect;
    if (!rect.pct) {
        var modeComponents = main_1.bscParseVideoModeComponents(mode);
        if (!(modeComponents.width && modeComponents.height)) {
            returnRect = bscCreatePercentageRect(0, 0, 0, 0);
        }
        else {
            returnRect = bscCreatePercentageRect(Math.round(rect.x * 10000 / modeComponents.width) / 100, Math.round(rect.y * 10000 / modeComponents.height) / 100, Math.round(rect.width * 10000 / modeComponents.width) / 100, Math.round(rect.height * 10000 / modeComponents.height) / 100);
        }
    }
    return returnRect;
}
exports.bscGetPercentageRectForVideoMode = bscGetPercentageRectForVideoMode;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var BsUploadItemStatus = (function () {
    function BsUploadItemStatus() {
    }
    BsUploadItemStatus.Pending = 'Pending';
    BsUploadItemStatus.Uploading = 'Uploading';
    BsUploadItemStatus.Uploaded = 'Uploaded';
    BsUploadItemStatus.Matched = 'Matched';
    BsUploadItemStatus.Cancelled = 'Cancelled';
    BsUploadItemStatus.Failed = 'Failed';
    return BsUploadItemStatus;
}());
exports.BsUploadItemStatus = BsUploadItemStatus;
Object.freeze(BsUploadItemStatus);
var BsUploadFileStatus = (function () {
    function BsUploadFileStatus() {
    }
    BsUploadFileStatus.Pending = 'Pending';
    BsUploadFileStatus.Uploading = 'Uploading';
    BsUploadFileStatus.Uploaded = 'Uploaded';
    BsUploadFileStatus.Matched = 'Matched';
    BsUploadFileStatus.Cancelled = 'Cancelled';
    BsUploadFileStatus.Failed = 'Failed';
    return BsUploadFileStatus;
}());
exports.BsUploadFileStatus = BsUploadFileStatus;
Object.freeze(BsUploadFileStatus);


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var playerModel_1 = __webpack_require__(1);
var metadata_1 = __webpack_require__(0);
var VideoResolution = (function () {
    function VideoResolution() {
    }
    VideoResolution.v4096x2160 = '4096x2160';
    VideoResolution.v3840x2160 = '3840x2160';
    VideoResolution.v3840x600 = '3840x600';
    VideoResolution.v3440x1440 = '3440x1440';
    VideoResolution.v2560x1600 = '2560x1600';
    VideoResolution.v2560x1440 = '2560x1440';
    VideoResolution.v2560x1080 = '2560x1080';
    VideoResolution.v2048x1152 = '2048x1152';
    VideoResolution.v1920x1080 = '1920x1080';
    VideoResolution.v1920x1200 = '1920x1200';
    VideoResolution.v1680x1050 = '1680x1050';
    VideoResolution.v1600x1200 = '1600x1200';
    VideoResolution.v1600x900 = '1600x900';
    VideoResolution.v1400x1050 = '1400x1050';
    VideoResolution.v1440x900 = '1440x900';
    VideoResolution.v1366x768 = '1366x768';
    VideoResolution.v1360x768 = '1360x768';
    VideoResolution.v1280x1024 = '1280x1024';
    VideoResolution.v1280x960 = '1280x960';
    VideoResolution.v1280x800 = '1280x800';
    VideoResolution.v1280x768 = '1280x768';
    VideoResolution.v1280x720 = '1280x720';
    VideoResolution.v1024x768 = '1024x768';
    VideoResolution.v960x960 = '960x960';
    VideoResolution.v848x480 = '848x480';
    VideoResolution.v800x600 = '800x600';
    VideoResolution.v640x480 = '640x480';
    VideoResolution.v720x576 = '720x576';
    VideoResolution.v720x480 = '720x480';
    VideoResolution.vNtscComponent = 'NTSC-COMPONENT';
    VideoResolution.vNtscM = 'NTSC-M';
    VideoResolution.vNtscMJpn = 'NTSC-M-JPN';
    VideoResolution.vPalComponent = 'PAL-COMPONENT';
    VideoResolution.vPalI = 'PAL-I';
    VideoResolution.vPalBG = 'PAL-BG';
    VideoResolution.vPalN = 'PAL-N';
    VideoResolution.vPalNC = 'PAL-NC';
    VideoResolution.vPalM = 'PAL-M';
    VideoResolution.vSecam = 'SECAM';
    return VideoResolution;
}());
exports.VideoResolution = VideoResolution;
var VideoFrameRate = (function () {
    function VideoFrameRate() {
    }
    VideoFrameRate.r75p = '75p';
    VideoFrameRate.r60p = '60p';
    VideoFrameRate.r59p = '59.94p';
    VideoFrameRate.r50p = '50p';
    VideoFrameRate.r30p = '30p';
    VideoFrameRate.r29p = '29.97p';
    VideoFrameRate.r25p = '25p';
    VideoFrameRate.r24p = '24p';
    VideoFrameRate.r23p = '23.976p';
    VideoFrameRate.r60i = '60i';
    VideoFrameRate.r59i = '59.94i';
    VideoFrameRate.r50i = '50i';
    return VideoFrameRate;
}());
exports.VideoFrameRate = VideoFrameRate;
var VideoMode = (function () {
    function VideoMode() {
    }
    VideoMode.v4096x2160x60p = '4096x2160x60p';
    VideoMode.v4096x2160x59p = '4096x2160x59.94p';
    VideoMode.v4096x2160x50p = '4096x2160x50p';
    VideoMode.v4096x2160x30p = '4096x2160x30p';
    VideoMode.v4096x2160x29p = '4096x2160x29.97p';
    VideoMode.v4096x2160x25p = '4096x2160x25p';
    VideoMode.v4096x2160x24p = '4096x2160x24p';
    VideoMode.v4096x2160x23p = '4096x2160x23.976p';
    VideoMode.v3840x2160x60p = '3840x2160x60p';
    VideoMode.v3840x2160x59p = '3840x2160x59.94p';
    VideoMode.v3840x2160x50p = '3840x2160x50p';
    VideoMode.v3840x2160x30p = '3840x2160x30p';
    VideoMode.v3840x2160x29p = '3840x2160x29.97p';
    VideoMode.v3840x2160x25p = '3840x2160x25p';
    VideoMode.v3840x2160x24p = '3840x2160x24p';
    VideoMode.v3840x2160x23p = '3840x2160x23.976p';
    VideoMode.v3840x600x60p = '3840x600x60p';
    VideoMode.v3440x1440x60p = '3440x1440x60p';
    VideoMode.v3440x1440x50p = '3440x1440x50p';
    VideoMode.v3440x1440x30p = '3440x1440x30p';
    VideoMode.v2560x1600x60p = '2560x1600x60p';
    VideoMode.v2560x1440x60p = '2560x1440x60p';
    VideoMode.v2560x1440x30p = '2560x1440x30p';
    VideoMode.v2560x1080x60p = '2560x1080x60p';
    VideoMode.v2048x1152x60p = '2048x1152x60p';
    VideoMode.v1920x1080x60p = '1920x1080x60p';
    VideoMode.v1920x1080x59p = '1920x1080x59.94p';
    VideoMode.v1920x1080x50p = '1920x1080x50p';
    VideoMode.v1920x1080x30p = '1920x1080x30p';
    VideoMode.v1920x1080x29p = '1920x1080x29.97p';
    VideoMode.v1920x1080x25p = '1920x1080x25p';
    VideoMode.v1920x1080x24p = '1920x1080x24p';
    VideoMode.v1920x1080x23p = '1920x1080x23.976p';
    VideoMode.v1920x1080x60i = '1920x1080x60i';
    VideoMode.v1920x1080x59i = '1920x1080x59.94i';
    VideoMode.v1920x1080x50i = '1920x1080x50i';
    VideoMode.v1920x1200x60p = '1920x1200x60p';
    VideoMode.v1680x1050x60p = '1680x1050x60p';
    VideoMode.v1600x1200x60p = '1600x1200x60p';
    VideoMode.v1600x900x60p = '1600x900x60p';
    VideoMode.v1440x900x75p = '1440x900x75p';
    VideoMode.v1440x900x60p = '1440x900x60p';
    VideoMode.v1400x1050x75p = '1400x1050x75p';
    VideoMode.v1400x1050x60p = '1400x1050x60p';
    VideoMode.v1366x768x60p = '1366x768x60p';
    VideoMode.v1360x768x60p = '1360x768x60p';
    VideoMode.v1280x1024x75p = '1280x1024x75p';
    VideoMode.v1280x1024x60p = '1280x1024x60p';
    VideoMode.v1280x960x60p = '1280x960x60p';
    VideoMode.v1280x800x75p = '1280x800x75p';
    VideoMode.v1280x800x60p = '1280x800x60p';
    VideoMode.v1280x768x60p = '1280x768x60p';
    VideoMode.v1280x720x75p = '1280x720x75p';
    VideoMode.v1280x720x60p = '1280x720x60p';
    VideoMode.v1280x720x59p = '1280x720x59.94p';
    VideoMode.v1280x720x50p = '1280x720x50p';
    VideoMode.v1280x720x25p = '1280x720x25p';
    VideoMode.v1280x720x24p = '1280x720x24p';
    VideoMode.v1280x720x23p = '1280x720x23.976p';
    VideoMode.v1024x768x75p = '1024x768x75p';
    VideoMode.v1024x768x60p = '1024x768x60p';
    VideoMode.v960x960x60p = '960x960x60p';
    VideoMode.v848x480x60p = '848x480x60p';
    VideoMode.v800x600x75p = '800x600x75p';
    VideoMode.v800x600x60p = '800x600x60p';
    VideoMode.v640x480x60p = '640x480x60p';
    VideoMode.v720x576x50p = '720x576x50p';
    VideoMode.v720x576x50i = '720x576x50i';
    VideoMode.v720x480x60p = '720x480x60p';
    VideoMode.v720x480x59p = '720x480x59.94p';
    VideoMode.v720x480x60i = '720x480x60i';
    VideoMode.vNtscComponent = 'NTSC-COMPONENT';
    VideoMode.vNtscM = 'NTSC-M';
    VideoMode.vNtscMJpn = 'NTSC-M-JPN';
    VideoMode.vPalComponent = 'PAL-COMPONENT';
    VideoMode.vPalI = 'PAL-I';
    VideoMode.vPalBG = 'PAL-BG';
    VideoMode.vPalN = 'PAL-N';
    VideoMode.vPalNC = 'PAL-NC';
    VideoMode.vPalM = 'PAL-M';
    VideoMode.vSecam = 'SECAM';
    return VideoMode;
}());
exports.VideoMode = VideoMode;
function bscGetVideoMode(resolution, frameRate) {
    if (resolution[0] === 'N' || resolution[0] === 'P' || resolution[0] === 'S') {
        return resolution;
    }
    else {
        return resolution + 'x' + frameRate;
    }
}
exports.bscGetVideoMode = bscGetVideoMode;
exports.ImpalaVideoModeSpec = [
    { resolution: VideoResolution.v4096x2160, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r59p, VideoFrameRate.r50p, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v3840x2160, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r59p, VideoFrameRate.r50p, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v3440x1440, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r50p, VideoFrameRate.r30p] },
    { resolution: VideoResolution.v2560x1600, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v2560x1440, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r30p] },
    { resolution: VideoResolution.v2560x1080, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v2048x1152, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x900, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1366x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x720, availableRates: [
            VideoFrameRate.r75p, VideoFrameRate.r60p, VideoFrameRate.r59p, VideoFrameRate.r50p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v1024x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v960x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v848x480, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p, VideoFrameRate.r50i] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r60i, VideoFrameRate.r59p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
];
exports.PanteraVideoModeSpec = [
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60i, VideoFrameRate.r59i, VideoFrameRate.r50i, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x900, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1366x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x720, availableRates: [
            VideoFrameRate.r75p, VideoFrameRate.r60p, VideoFrameRate.r59p, VideoFrameRate.r50p,
            VideoFrameRate.r25p, VideoFrameRate.r24p, VideoFrameRate.r23p
        ] },
    { resolution: VideoResolution.v1024x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v960x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v848x480, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p, VideoFrameRate.r50i] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r60i, VideoFrameRate.r59p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
];
exports.TigerVideoModeSpec = [
    { resolution: VideoResolution.v4096x2160, availableRates: [VideoFrameRate.r24p] },
    { resolution: VideoResolution.v3840x2160, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r59p, VideoFrameRate.r50p, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v3840x600, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v3440x1440, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r50p, VideoFrameRate.r30p] },
    { resolution: VideoResolution.v2560x1600, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v2560x1440, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r30p] },
    { resolution: VideoResolution.v2560x1080, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v2048x1152, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x720, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r59p, VideoFrameRate.r50p] },
    { resolution: VideoResolution.v1024x768, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v960x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r59p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.vSecam, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscComponent, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalComponent, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscM, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vNtscMJpn, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalI, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalBG, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalN, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalNC, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalM, availableRates: [VideoFrameRate.r59i] },
];
exports.LynxHdmiVideoModeSpec = [
    { resolution: VideoResolution.v3840x2160, availableRates: [
            VideoFrameRate.r30p, VideoFrameRate.r29p, VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x720, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r59p, VideoFrameRate.r50p] },
    { resolution: VideoResolution.v1024x768, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v960x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r59p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.vSecam, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscComponent, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalComponent, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscM, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vNtscMJpn, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalI, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalBG, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalN, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalNC, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalM, availableRates: [VideoFrameRate.r59i] },
];
exports.LynxComponentVideoModeSpec = [
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1280x720, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r59p, VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r59p] },
    { resolution: VideoResolution.vNtscComponent, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalComponent, availableRates: [VideoFrameRate.r50i] },
];
exports.LynxVgaVideoModeSpec = [
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
];
exports.BobcatHdmiVideoModeSpec = [
    { resolution: VideoResolution.v3840x2160, availableRates: [
            VideoFrameRate.r30p, VideoFrameRate.r29p, VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x720, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r59p, VideoFrameRate.r50p] },
    { resolution: VideoResolution.v1024x768, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v960x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r59p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.vSecam, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscComponent, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalComponent, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vNtscM, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vNtscMJpn, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalI, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalBG, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalN, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalNC, availableRates: [VideoFrameRate.r50i] },
    { resolution: VideoResolution.vPalM, availableRates: [VideoFrameRate.r59i] },
];
exports.BobcatComponentVideoModeSpec = [
    { resolution: VideoResolution.v1920x1080, availableRates: [
            VideoFrameRate.r60p, VideoFrameRate.r60i, VideoFrameRate.r59p, VideoFrameRate.r59i,
            VideoFrameRate.r50p, VideoFrameRate.r50i, VideoFrameRate.r30p, VideoFrameRate.r29p,
            VideoFrameRate.r25p, VideoFrameRate.r24p
        ] },
    { resolution: VideoResolution.v1280x720, availableRates: [VideoFrameRate.r60p,
            VideoFrameRate.r59p, VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x576, availableRates: [VideoFrameRate.r50p] },
    { resolution: VideoResolution.v720x480, availableRates: [VideoFrameRate.r60p, VideoFrameRate.r59p] },
    { resolution: VideoResolution.vNtscComponent, availableRates: [VideoFrameRate.r59i] },
    { resolution: VideoResolution.vPalComponent, availableRates: [VideoFrameRate.r50i] },
];
exports.BobcatVgaVideoModeSpec = [
    { resolution: VideoResolution.v1920x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1680x1050, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1600x1200, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1440x900, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1400x1050, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1360x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x1024, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x960, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x800, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v1280x768, availableRates: [VideoFrameRate.r60p] },
    { resolution: VideoResolution.v800x600, availableRates: [VideoFrameRate.r75p, VideoFrameRate.r60p] },
    { resolution: VideoResolution.v640x480, availableRates: [VideoFrameRate.r60p] },
];
exports.AllVideoConnectorTypeSpec = [
    metadata_1.VideoConnectorType.Hdmi,
    metadata_1.VideoConnectorType.Vga,
    metadata_1.VideoConnectorType.Component,
];
exports.HdmiVideoConnectorTypeSpec = [
    metadata_1.VideoConnectorType.Hdmi,
];
function bscGetPlayerVideoConnectorTypes(model) {
    switch (model) {
        case playerModel_1.PlayerModel.HD120:
        case playerModel_1.PlayerModel.HD220:
        case playerModel_1.PlayerModel.HD1020:
        case playerModel_1.PlayerModel.XD230:
        case playerModel_1.PlayerModel.XD1030:
        case playerModel_1.PlayerModel.XD1230:
        case playerModel_1.PlayerModel.HD920:
        case playerModel_1.PlayerModel.HD970:
        case playerModel_1.PlayerModel.HD922:
        case playerModel_1.PlayerModel.HD972:
        case playerModel_1.PlayerModel.HD222:
        case playerModel_1.PlayerModel.HD1022:
        case playerModel_1.PlayerModel.XD232:
        case playerModel_1.PlayerModel.XD1032:
        case playerModel_1.PlayerModel.XD1132:
            return exports.AllVideoConnectorTypeSpec;
        case playerModel_1.PlayerModel.HD1023:
        case playerModel_1.PlayerModel.HS123:
        case playerModel_1.PlayerModel.HD223:
        case playerModel_1.PlayerModel.XD1033:
        case playerModel_1.PlayerModel.XD233:
        case playerModel_1.PlayerModel.XT1143:
        case playerModel_1.PlayerModel.XT243:
        case playerModel_1.PlayerModel.LS423:
        case playerModel_1.PlayerModel.A915:
        case playerModel_1.PlayerModel.HD917:
        case playerModel_1.PlayerModel.FK242:
        case playerModel_1.PlayerModel.FK1042:
        case playerModel_1.PlayerModel.FK1142:
        case playerModel_1.PlayerModel.LS422:
            return exports.HdmiVideoConnectorTypeSpec;
        default:
            return null;
    }
}
exports.bscGetPlayerVideoConnectorTypes = bscGetPlayerVideoConnectorTypes;
function bscIsValidConnectorType(model, connectorType) {
    var validConnectorTypes = bscGetPlayerVideoConnectorTypes(model);
    if (validConnectorTypes !== null) {
        return validConnectorTypes.indexOf(connectorType) > -1;
    }
    else {
        return false;
    }
}
exports.bscIsValidConnectorType = bscIsValidConnectorType;
function bscGetPlayerVideoModeSpecs(model, connectorType) {
    switch (true) {
        case playerModel_1.ImpalaModels.has(model):
            return exports.ImpalaVideoModeSpec;
        case playerModel_1.PanteraModels.has(model):
            return exports.PanteraVideoModeSpec;
        case playerModel_1.TigerModels.has(model):
            return exports.TigerVideoModeSpec;
        case playerModel_1.LynxModels.has(model): {
            switch (connectorType) {
                case metadata_1.VideoConnectorType.Hdmi: return exports.LynxHdmiVideoModeSpec;
                case metadata_1.VideoConnectorType.Vga: return exports.LynxVgaVideoModeSpec;
                case metadata_1.VideoConnectorType.Component: return exports.LynxComponentVideoModeSpec;
                default: return null;
            }
        }
        case playerModel_1.BobcatModels.has(model): {
            switch (connectorType) {
                case metadata_1.VideoConnectorType.Hdmi: return exports.BobcatHdmiVideoModeSpec;
                case metadata_1.VideoConnectorType.Vga: return exports.BobcatVgaVideoModeSpec;
                case metadata_1.VideoConnectorType.Component: return exports.BobcatComponentVideoModeSpec;
                default: return null;
            }
        }
        default:
            return null;
    }
}
exports.bscGetPlayerVideoModeSpecs = bscGetPlayerVideoModeSpecs;
function bscGetFrameRates(model, connectorType, resolution) {
    var videoModeOptions = bscGetPlayerVideoModeSpecs(model, connectorType);
    if (videoModeOptions !== null) {
        for (var _i = 0, videoModeOptions_1 = videoModeOptions; _i < videoModeOptions_1.length; _i++) {
            var videoModeOption = videoModeOptions_1[_i];
            if (resolution === videoModeOption.resolution) {
                return videoModeOption.availableRates;
            }
        }
    }
    return null;
}
exports.bscGetFrameRates = bscGetFrameRates;
function bscIsValidResolution(model, connectorType, resolution) {
    return bscGetFrameRates(model, connectorType, resolution) !== null;
}
exports.bscIsValidResolution = bscIsValidResolution;
function bscIsValidFrameRate(model, connectorType, resolution, frameRate) {
    var validFrameRates = bscGetFrameRates(model, connectorType, resolution);
    if (validFrameRates !== null) {
        return validFrameRates.indexOf(frameRate) > -1;
    }
    else {
        return false;
    }
}
exports.bscIsValidFrameRate = bscIsValidFrameRate;
function bscParseVideoModeComponents(mode) {
    var components = { width: 0, height: 0, frameRate: 0, interlaced: false };
    var matchResult = mode.match(/(\d*)x(\d*)x(.*|.*\..*)([ip])/);
    if (matchResult != null && matchResult.length === 5) {
        components.width = Number(matchResult[1]);
        components.height = Number(matchResult[2]);
        components.frameRate = Number(matchResult[3]);
        components.interlaced = matchResult[4] === 'i';
    }
    else if (mode.match(/NTSC/) || mode.match(/PAL-M/)) {
        components.width = 720;
        components.height = 480;
        components.frameRate = 59.94;
        components.interlaced = true;
    }
    else if (mode.match(/PAL/) || mode.match(/SECAM/)) {
        components.width = 720;
        components.height = 576;
        components.frameRate = 50;
        components.interlaced = true;
    }
    return components;
}
exports.bscParseVideoModeComponents = bscParseVideoModeComponents;
function bscParseVideoModeResolutionAndRate(mode) {
    var result = {
        resolution: VideoResolution.v1920x1080,
        frameRate: VideoFrameRate.r60p,
    };
    var matchResult = mode.match(/(\d*x\d*)x(.*|.*\..*[ip])/);
    if (matchResult != null && matchResult.length === 3) {
        result.resolution = matchResult[1];
        result.frameRate = matchResult[2];
    }
    else if (mode.match(/NTSC/) || mode.match(/PAL-M/)) {
        result.resolution = mode;
        result.frameRate = VideoFrameRate.r59i;
    }
    else if (mode.match(/PAL/) || mode.match(/SECAM/)) {
        result.resolution = mode;
        result.frameRate = VideoFrameRate.r50i;
    }
    else {
        return null;
    }
    return result;
}
exports.bscParseVideoModeResolutionAndRate = bscParseVideoModeResolutionAndRate;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var metadata_1 = __webpack_require__(0);
var playerModel_1 = __webpack_require__(1);
function bscGetZoneLimit(type, player) {
    var result = null;
    if (type === metadata_1.ZoneType.BackgroundImage) {
        result = 1;
    }
    else if (type === metadata_1.ZoneType.VideoOrImages || type === metadata_1.ZoneType.VideoOnly) {
        result = 1;
        switch (player) {
            case playerModel_1.PlayerModel.XD233:
            case playerModel_1.PlayerModel.XD1033:
            case playerModel_1.PlayerModel.XD1133:
            case playerModel_1.PlayerModel.XT243:
            case playerModel_1.PlayerModel.XT1043:
            case playerModel_1.PlayerModel.XT1143:
            case playerModel_1.PlayerModel.XD230:
            case playerModel_1.PlayerModel.XD232:
            case playerModel_1.PlayerModel.XD1030:
            case playerModel_1.PlayerModel.XD1032:
            case playerModel_1.PlayerModel.XD1132:
            case playerModel_1.PlayerModel.XD1230:
            case playerModel_1.PlayerModel.FK242:
            case playerModel_1.PlayerModel.FK1042:
            case playerModel_1.PlayerModel.FK1142:
            case playerModel_1.PlayerModel.TK1042:
                result = 2;
                break;
            default:
                break;
        }
    }
    else if (type === metadata_1.ZoneType.AudioOnly || type === metadata_1.ZoneType.EnhancedAudio) {
        result = 3;
    }
    return result;
}
exports.bscGetZoneLimit = bscGetZoneLimit;


/***/ }),
/* 10 */
/***/ (function(module, exports) {

module.exports = __webpack_require__(51);

/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = __webpack_require__(52);

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = __webpack_require__(99);

/***/ })
/******/ ]);
});
//# sourceMappingURL=bscore.js.map

/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(71);
__webpack_require__(45);
__webpack_require__(72);
__webpack_require__(147);
module.exports = __webpack_require__(12).Set;


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(45);
__webpack_require__(144);
module.exports = __webpack_require__(12).Array.from;


/***/ }),
/* 53 */
/***/ (function(module, exports) {

// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

var document = __webpack_require__(5).document;
module.exports = document && document.documentElement;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = !__webpack_require__(14) && !__webpack_require__(26)(function () {
  return Object.defineProperty(__webpack_require__(37)('div'), 'a', { get: function () { return 7; } }).a != 7;
});


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

// check on default Array iterator
var Iterators = __webpack_require__(20);
var ITERATOR = __webpack_require__(3)('iterator');
var ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

// call something on iterator step with safe closing on error
var anObject = __webpack_require__(10);
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
  // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};


/***/ }),
/* 58 */
/***/ (function(module, exports) {

module.exports = function (done, value) {
  return { value: value, done: !!done };
};


/***/ }),
/* 59 */
/***/ (function(module, exports) {

module.exports = false;


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

var META = __webpack_require__(30)('meta');
var isObject = __webpack_require__(8);
var has = __webpack_require__(15);
var setDesc = __webpack_require__(16).f;
var id = 0;
var isExtensible = Object.isExtensible || function () {
  return true;
};
var FREEZE = !__webpack_require__(26)(function () {
  return isExtensible(Object.preventExtensions({}));
});
var setMeta = function (it) {
  setDesc(it, META, { value: {
    i: 'O' + ++id, // object ID
    w: {}          // weak collections IDs
  } });
};
var fastKey = function (it, create) {
  // return primitive with prefix
  if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return 'F';
    // not necessary to add metadata
    if (!create) return 'E';
    // add missing metadata
    setMeta(it);
  // return object ID
  } return it[META].i;
};
var getWeak = function (it, create) {
  if (!has(it, META)) {
    // can't set metadata to uncaught frozen object
    if (!isExtensible(it)) return true;
    // not necessary to add metadata
    if (!create) return false;
    // add missing metadata
    setMeta(it);
  // return hash weak collections IDs
  } return it[META].w;
};
// add metadata on freeze-family methods calling
var onFreeze = function (it) {
  if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
  return it;
};
var meta = module.exports = {
  KEY: META,
  NEED: false,
  fastKey: fastKey,
  getWeak: getWeak,
  onFreeze: onFreeze
};


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 25.4.1.5 NewPromiseCapability(C)
var aFunction = __webpack_require__(23);

function PromiseCapability(C) {
  var resolve, reject;
  this.promise = new C(function ($$resolve, $$reject) {
    if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
    resolve = $$resolve;
    reject = $$reject;
  });
  this.resolve = aFunction(resolve);
  this.reject = aFunction(reject);
}

module.exports.f = function (C) {
  return new PromiseCapability(C);
};


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = __webpack_require__(10);
var dPs = __webpack_require__(133);
var enumBugKeys = __webpack_require__(53);
var IE_PROTO = __webpack_require__(42)('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = __webpack_require__(37)('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  __webpack_require__(54).appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = __webpack_require__(136);
var enumBugKeys = __webpack_require__(53);

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(5);
var dP = __webpack_require__(16);
var DESCRIPTORS = __webpack_require__(14);
var SPECIES = __webpack_require__(3)('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function () { return this; }
  });
};


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(5);
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

var ctx = __webpack_require__(13);
var invoke = __webpack_require__(129);
var html = __webpack_require__(54);
var cel = __webpack_require__(37);
var global = __webpack_require__(5);
var process = global.process;
var setTask = global.setImmediate;
var clearTask = global.clearImmediate;
var MessageChannel = global.MessageChannel;
var Dispatch = global.Dispatch;
var counter = 0;
var queue = {};
var ONREADYSTATECHANGE = 'onreadystatechange';
var defer, channel, port;
var run = function () {
  var id = +this;
  // eslint-disable-next-line no-prototype-builtins
  if (queue.hasOwnProperty(id)) {
    var fn = queue[id];
    delete queue[id];
    fn();
  }
};
var listener = function (event) {
  run.call(event.data);
};
// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
if (!setTask || !clearTask) {
  setTask = function setImmediate(fn) {
    var args = [];
    var i = 1;
    while (arguments.length > i) args.push(arguments[i++]);
    queue[++counter] = function () {
      // eslint-disable-next-line no-new-func
      invoke(typeof fn == 'function' ? fn : Function(fn), args);
    };
    defer(counter);
    return counter;
  };
  clearTask = function clearImmediate(id) {
    delete queue[id];
  };
  // Node.js 0.8-
  if (__webpack_require__(24)(process) == 'process') {
    defer = function (id) {
      process.nextTick(ctx(run, id, 1));
    };
  // Sphere (JS game engine) Dispatch API
  } else if (Dispatch && Dispatch.now) {
    defer = function (id) {
      Dispatch.now(ctx(run, id, 1));
    };
  // Browsers with MessageChannel, includes WebWorkers
  } else if (MessageChannel) {
    channel = new MessageChannel();
    port = channel.port2;
    channel.port1.onmessage = listener;
    defer = ctx(port.postMessage, port, 1);
  // Browsers with postMessage, skip WebWorkers
  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
  } else if (global.addEventListener && typeof postMessage == 'function' && !global.importScripts) {
    defer = function (id) {
      global.postMessage(id + '', '*');
    };
    global.addEventListener('message', listener, false);
  // IE8-
  } else if (ONREADYSTATECHANGE in cel('script')) {
    defer = function (id) {
      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function () {
        html.removeChild(this);
        run.call(id);
      };
    };
  // Rest old browsers
  } else {
    defer = function (id) {
      setTimeout(ctx(run, id, 1), 0);
    };
  }
}
module.exports = {
  set: setTask,
  clear: clearTask
};


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.13 ToObject(argument)
var defined = __webpack_require__(36);
module.exports = function (it) {
  return Object(defined(it));
};


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = __webpack_require__(8);
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(8);
module.exports = function (it, TYPE) {
  if (!isObject(it) || it._t !== TYPE) throw TypeError('Incompatible receiver, ' + TYPE + ' required!');
  return it;
};


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

var classof = __webpack_require__(35);
var ITERATOR = __webpack_require__(3)('iterator');
var Iterators = __webpack_require__(20);
module.exports = __webpack_require__(12).getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// 19.1.3.6 Object.prototype.toString()
var classof = __webpack_require__(35);
var test = {};
test[__webpack_require__(3)('toStringTag')] = 'z';
if (test + '' != '[object z]') {
  __webpack_require__(18)(Object.prototype, 'toString', function toString() {
    return '[object ' + classof(this) + ']';
  }, true);
}


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

var $iterators = __webpack_require__(145);
var getKeys = __webpack_require__(63);
var redefine = __webpack_require__(18);
var global = __webpack_require__(5);
var hide = __webpack_require__(17);
var Iterators = __webpack_require__(20);
var wks = __webpack_require__(3);
var ITERATOR = wks('iterator');
var TO_STRING_TAG = wks('toStringTag');
var ArrayValues = Iterators.Array;

var DOMIterables = {
  CSSRuleList: true, // TODO: Not spec compliant, should be false.
  CSSStyleDeclaration: false,
  CSSValueList: false,
  ClientRectList: false,
  DOMRectList: false,
  DOMStringList: false,
  DOMTokenList: true,
  DataTransferItemList: false,
  FileList: false,
  HTMLAllCollection: false,
  HTMLCollection: false,
  HTMLFormElement: false,
  HTMLSelectElement: false,
  MediaList: true, // TODO: Not spec compliant, should be false.
  MimeTypeArray: false,
  NamedNodeMap: false,
  NodeList: true,
  PaintRequestList: false,
  Plugin: false,
  PluginArray: false,
  SVGLengthList: false,
  SVGNumberList: false,
  SVGPathSegList: false,
  SVGPointList: false,
  SVGStringList: false,
  SVGTransformList: false,
  SourceBufferList: false,
  StyleSheetList: true, // TODO: Not spec compliant, should be false.
  TextTrackCueList: false,
  TextTrackList: false,
  TouchList: false
};

for (var collections = getKeys(DOMIterables), i = 0; i < collections.length; i++) {
  var NAME = collections[i];
  var explicit = DOMIterables[NAME];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  var key;
  if (proto) {
    if (!proto[ITERATOR]) hide(proto, ITERATOR, ArrayValues);
    if (!proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = ArrayValues;
    if (explicit) for (key in $iterators) if (!proto[key]) redefine(proto, key, $iterators[key], true);
  }
}


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {


/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = __webpack_require__(205);

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}


/***/ }),
/* 74 */
/***/ (function(module, exports) {

/**
 * Extracts Agfa flavored Makernotes which are equal to those of Olympus.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Olympus.html
  var tags = {

    0x0000 : "MakerNoteVersion",
    0x0001 : "MinoltaCameraSettingsOld",
    0x0003 : "MinoltaCameraSettings",
    0x0040 : "CompressedImageSize",
    0x0081 : "PreviewImageData",
    0x0088 : "PreviewImageStart",
    0x0089 : "PreviewImageLength",
    0x0100 : "ThumbnailImage",
    0x0104 : "BodyFirmwareVersion",
    0x0200 : "SpecialMode",
    0x0201 : "Quality",
    0x0202 : "Macro",
    0x0203 : "BWMode",
    0x0204 : "DigitalZoom",
    0x0205 : "FocalPlaneDiagonal",
    0x0206 : "LensDistortionParams",
    0x0207 : "CameraType",
    0x0208 : "TextInfo",
    0x0209 : "CameraID",
    0x020B : "EpsonImageWidth",
    0x020C : "EpsonImageHeight",
    0x020D : "EpsonSoftware",
    0x0280 : "PreviewImage",
    0x0300 : "PreCaptureFrames",
    0x0301 : "WhiteBoard",
    0x0302 : "OneTouchWB",
    0x0303 : "WhiteBalanceBracket",
    0x0304 : "WhiteBalanceBias",
    0x0403 : "SceneMode",
    0x0404 : "SerialNumber",
    0x0405 : "Firmware",
    0x0E00 : "PrintIM",
    0x0F00 : "DataDump",
    0x0F01 : "DataDump2",
    0x0F04 : "ZoomedPreviewStart",
    0x0F05 : "ZoomedPreviewLength",
    0x0F06 : "ZoomedPreviewSize",
    0x1000 : "ShutterSpeedValue",
    0x1001 : "ISOValue",
    0x1002 : "ApertureValue",
    0x1003 : "BrightnessValue",
    0x1004 : "FlashMode",
    0x1005 : "FlashDevice",
    0x1006 : "ExposureCompensation",
    0x1007 : "SensorTemperature",
    0x1008 : "LensTemperature",
    0x1009 : "LightCondition",
    0x100A : "FocusRange",
    0x100B : "FocusMode",
    0x100C : "ManualFocusDistance",
    0x100D : "ZoomStepCount",
    0x100E : "FocusStepCount",
    0x100F : "Sharpness",
    0x1010 : "FlashChargeLevel",
    0x1011 : "ColorMatrix",
    0x1012 : "BlackLevel",
    0x1013 : "ColorTemperatureBG?",
    0x1014 : "ColorTemperatureRG?",
    0x1015 : "WBMode",
    0x1017 : "RedBalance",
    0x1018 : "BlueBalance",
    0x1019 : "ColorMatrixNumber",
    0x101A : "SerialNumber",
    0x101B : "ExternalFlashAE1_0?",
    0x101C : "ExternalFlashAE2_0?",
    0x101D : "InternalFlashAE1_0?",
    0x101E : "InternalFlashAE2_0?",
    0x101F : "ExternalFlashAE1?",
    0x1020 : "ExternalFlashAE2?",
    0x1021 : "InternalFlashAE1?",
    0x1022 : "InternalFlashAE2?",
    0x1023 : "FlashExposureComp",
    0x1024 : "InternalFlashTable",
    0x1025 : "ExternalFlashGValue",
    0x1026 : "ExternalFlashBounce",
    0x1027 : "ExternalFlashZoom",
    0x1028 : "ExternalFlashMode",
    0x1029 : "Contrast",
    0x102A : "SharpnessFactor",
    0x102B : "ColorControl",
    0x102C : "ValidBits",
    0x102D : "CoringFilter",
    0x102E : "OlympusImageWidth",
    0x102F : "OlympusImageHeight",
    0x1030 : "SceneDetect",
    0x1031 : "SceneArea?",
    0x1033 : "SceneDetectData?",
    0x1034 : "CompressionRatio",
    0x1035 : "PreviewImageValid",
    0x1036 : "PreviewImageStart",
    0x1037 : "PreviewImageLength",
    0x1038 : "AFResult",
    0x1039 : "CCDScanMode",
    0x103A : "NoiseReduction",
    0x103B : "FocusStepInfinity",
    0x103C : "FocusStepNear",
    0x103D : "LightValueCenter",
    0x103E : "LightValuePeriphery",
    0x103F : "FieldCount?",
    0x2010 : "Equipment",
    0x2020 : "CameraSettings",
    0x2030 : "RawDevelopment",
    0x2031 : "RawDev2",
    0x2040 : "ImageProcessing",
    0x2050 : "FocusInfo",
    0x2100 : "Olympus2100",
    0x2200 : "Olympus2200",
    0x2300 : "Olympus2300",
    0x2400 : "Olympus2400",
    0x2500 : "Olympus2500",
    0x2600 : "Olympus2600",
    0x2700 : "Olympus2700",
    0x2800 : "Olympus2800",
    0x2900 : "Olympus2900",
    0x3000 : "RawInfo",
    0x4000 : "MainInfo",
    0x5000 : "UnknownInfo"

  };

  // Agfa flavored Makernote data starts after eight bytes
  var ifdOffset = makernoteOffset + 8;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.agfaMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.agfaMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
    if (exifEntry && exifEntry.tagName !== null) {
      makernoteData[exifEntry.tagName] = exifEntry.value;
    }
  }

  return makernoteData;

};

/***/ }),
/* 75 */
/***/ (function(module, exports) {

/**
 * Extracts Epson flavored Makernotes which are equal to those of Olympus.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Olympus.html
  var tags = {

    0x0000 : "MakerNoteVersion",
    0x0001 : "MinoltaCameraSettingsOld",
    0x0003 : "MinoltaCameraSettings",
    0x0040 : "CompressedImageSize",
    0x0081 : "PreviewImageData",
    0x0088 : "PreviewImageStart",
    0x0089 : "PreviewImageLength",
    0x0100 : "ThumbnailImage",
    0x0104 : "BodyFirmwareVersion",
    0x0200 : "SpecialMode",
    0x0201 : "Quality",
    0x0202 : "Macro",
    0x0203 : "BWMode",
    0x0204 : "DigitalZoom",
    0x0205 : "FocalPlaneDiagonal",
    0x0206 : "LensDistortionParams",
    0x0207 : "CameraType",
    0x0208 : "TextInfo",
    0x0209 : "CameraID",
    0x020B : "EpsonImageWidth",
    0x020C : "EpsonImageHeight",
    0x020D : "EpsonSoftware",
    0x0280 : "PreviewImage",
    0x0300 : "PreCaptureFrames",
    0x0301 : "WhiteBoard",
    0x0302 : "OneTouchWB",
    0x0303 : "WhiteBalanceBracket",
    0x0304 : "WhiteBalanceBias",
    0x0403 : "SceneMode",
    0x0404 : "SerialNumber",
    0x0405 : "Firmware",
    0x0E00 : "PrintIM",
    0x0F00 : "DataDump",
    0x0F01 : "DataDump2",
    0x0F04 : "ZoomedPreviewStart",
    0x0F05 : "ZoomedPreviewLength",
    0x0F06 : "ZoomedPreviewSize",
    0x1000 : "ShutterSpeedValue",
    0x1001 : "ISOValue",
    0x1002 : "ApertureValue",
    0x1003 : "BrightnessValue",
    0x1004 : "FlashMode",
    0x1005 : "FlashDevice",
    0x1006 : "ExposureCompensation",
    0x1007 : "SensorTemperature",
    0x1008 : "LensTemperature",
    0x1009 : "LightCondition",
    0x100A : "FocusRange",
    0x100B : "FocusMode",
    0x100C : "ManualFocusDistance",
    0x100D : "ZoomStepCount",
    0x100E : "FocusStepCount",
    0x100F : "Sharpness",
    0x1010 : "FlashChargeLevel",
    0x1011 : "ColorMatrix",
    0x1012 : "BlackLevel",
    0x1013 : "ColorTemperatureBG?",
    0x1014 : "ColorTemperatureRG?",
    0x1015 : "WBMode",
    0x1017 : "RedBalance",
    0x1018 : "BlueBalance",
    0x1019 : "ColorMatrixNumber",
    0x101A : "SerialNumber",
    0x101B : "ExternalFlashAE1_0?",
    0x101C : "ExternalFlashAE2_0?",
    0x101D : "InternalFlashAE1_0?",
    0x101E : "InternalFlashAE2_0?",
    0x101F : "ExternalFlashAE1?",
    0x1020 : "ExternalFlashAE2?",
    0x1021 : "InternalFlashAE1?",
    0x1022 : "InternalFlashAE2?",
    0x1023 : "FlashExposureComp",
    0x1024 : "InternalFlashTable",
    0x1025 : "ExternalFlashGValue",
    0x1026 : "ExternalFlashBounce",
    0x1027 : "ExternalFlashZoom",
    0x1028 : "ExternalFlashMode",
    0x1029 : "Contrast",
    0x102A : "SharpnessFactor",
    0x102B : "ColorControl",
    0x102C : "ValidBits",
    0x102D : "CoringFilter",
    0x102E : "OlympusImageWidth",
    0x102F : "OlympusImageHeight",
    0x1030 : "SceneDetect",
    0x1031 : "SceneArea?",
    0x1033 : "SceneDetectData?",
    0x1034 : "CompressionRatio",
    0x1035 : "PreviewImageValid",
    0x1036 : "PreviewImageStart",
    0x1037 : "PreviewImageLength",
    0x1038 : "AFResult",
    0x1039 : "CCDScanMode",
    0x103A : "NoiseReduction",
    0x103B : "FocusStepInfinity",
    0x103C : "FocusStepNear",
    0x103D : "LightValueCenter",
    0x103E : "LightValuePeriphery",
    0x103F : "FieldCount?",
    0x2010 : "Equipment",
    0x2020 : "CameraSettings",
    0x2030 : "RawDevelopment",
    0x2031 : "RawDev2",
    0x2040 : "ImageProcessing",
    0x2050 : "FocusInfo",
    0x2100 : "Olympus2100",
    0x2200 : "Olympus2200",
    0x2300 : "Olympus2300",
    0x2400 : "Olympus2400",
    0x2500 : "Olympus2500",
    0x2600 : "Olympus2600",
    0x2700 : "Olympus2700",
    0x2800 : "Olympus2800",
    0x2900 : "Olympus2900",
    0x3000 : "RawInfo",
    0x4000 : "MainInfo",
    0x5000 : "UnknownInfo"

  };

  // Epson flavored Makernote data starts after eight bytes
  var ifdOffset = makernoteOffset + 8;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.epsonMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.epsonMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
    if (exifEntry && exifEntry.tagName !== null) {
      makernoteData[exifEntry.tagName] = exifEntry.value;
    }
  }

  return makernoteData;

};

/***/ }),
/* 76 */
/***/ (function(module, exports) {

/**
 * Extracts Fujifilm flavored Makernotes which are always stored in little
 * endian, no matter what the rest of the file is. Additionally the offsets
 * are relative to the start of the Makernote instead of the start of the
 * TIFF header.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/FujiFilm.html
  var tags = {
    0x0000 : "Version",
    0x0010 : "InternalSerialNumber",
    0x1000 : "Quality",
    0x1001 : "Sharpness",
    0x1002 : "WhiteBalance",
    0x1003 : "Saturation",
    0x1004 : "Contrast",
    0x1005 : "ColorTemperature",
    0x1006 : "Contrast",
    0x100a : "WhiteBalanceFineTune",
    0x100b : "NoiseReduction",
    0x100e : "HighISONoiseReduction",
    0x1010 : "FujiFlashMode",
    0x1011 : "FlashExposureComp",
    0x1020 : "Macro",
    0x1021 : "FocusMode",
    0x1023 : "FocusPixel",
    0x1030 : "SlowSync",
    0x1033 : "EXRAuto",
    0x1034 : "EXRMode",
    0x1100 : "AutoBracketing",
    0x1101 : "SequenceNumber",
    0x1210 : "ColorMode",
    0x1300 : "BlurWarning",
    0x1301 : "FocusWarning",
    0x1302 : "ExposureWarning",
    0x1304 : "GEImageSize",
    0x1400 : "DynamicRange",
    0x1401 : "FilmMode",
    0x1402 : "DynamicRangeSetting",
    0x1403 : "DevelopmentDynamicRange",
    0x1404 : "MinFocalLength",
    0x1405 : "MaxFocalLength",
    0x1406 : "MaxApertureAtMinFocal",
    0x1407 : "MaxApertureAtMaxFocal",
    0x140b : "AutoDynamicRange",
    0x4100 : "FacesDetected",
    0x4103 : "FacePositions",
    0x4282 : "FaceRecInfo",
    0x8000 : "FileSource",
    0x8002 : "OrderNumber",
    0x8003 : "FrameNumber",
    0xb211 : "Parallax"

  };

  // Start of the Fujifilm flavored Makernote data is determined by the four
  // bytes following the Makernote vendor name
  var ifdOffset = makernoteOffset + data.getLong(makernoteOffset + 8, false, tiffOffset);

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, false);
  if (this.options.fujifilmMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.fujifilmMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), makernoteOffset, false, tags);
    if (exifEntry && exifEntry.tagName !== null) makernoteData[exifEntry.tagName] = exifEntry.value;
  }

  return makernoteData;

};

/***/ }),
/* 77 */
/***/ (function(module, exports) {

/**
 * Extracts Olympus flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Olympus.html
  var tags = {

    0x0000 : "MakerNoteVersion",
    0x0001 : "MinoltaCameraSettingsOld",
    0x0003 : "MinoltaCameraSettings",
    0x0040 : "CompressedImageSize",
    0x0081 : "PreviewImageData",
    0x0088 : "PreviewImageStart",
    0x0089 : "PreviewImageLength",
    0x0100 : "ThumbnailImage",
    0x0104 : "BodyFirmwareVersion",
    0x0200 : "SpecialMode",
    0x0201 : "Quality",
    0x0202 : "Macro",
    0x0203 : "BWMode",
    0x0204 : "DigitalZoom",
    0x0205 : "FocalPlaneDiagonal",
    0x0206 : "LensDistortionParams",
    0x0207 : "CameraType",
    0x0208 : "TextInfo",
    0x0209 : "CameraID",
    0x020B : "EpsonImageWidth",
    0x020C : "EpsonImageHeight",
    0x020D : "EpsonSoftware",
    0x0280 : "PreviewImage",
    0x0300 : "PreCaptureFrames",
    0x0301 : "WhiteBoard",
    0x0302 : "OneTouchWB",
    0x0303 : "WhiteBalanceBracket",
    0x0304 : "WhiteBalanceBias",
    0x0403 : "SceneMode",
    0x0404 : "SerialNumber",
    0x0405 : "Firmware",
    0x0E00 : "PrintIM",
    0x0F00 : "DataDump",
    0x0F01 : "DataDump2",
    0x0F04 : "ZoomedPreviewStart",
    0x0F05 : "ZoomedPreviewLength",
    0x0F06 : "ZoomedPreviewSize",
    0x1000 : "ShutterSpeedValue",
    0x1001 : "ISOValue",
    0x1002 : "ApertureValue",
    0x1003 : "BrightnessValue",
    0x1004 : "FlashMode",
    0x1005 : "FlashDevice",
    0x1006 : "ExposureCompensation",
    0x1007 : "SensorTemperature",
    0x1008 : "LensTemperature",
    0x1009 : "LightCondition",
    0x100A : "FocusRange",
    0x100B : "FocusMode",
    0x100C : "ManualFocusDistance",
    0x100D : "ZoomStepCount",
    0x100E : "FocusStepCount",
    0x100F : "Sharpness",
    0x1010 : "FlashChargeLevel",
    0x1011 : "ColorMatrix",
    0x1012 : "BlackLevel",
    0x1013 : "ColorTemperatureBG?",
    0x1014 : "ColorTemperatureRG?",
    0x1015 : "WBMode",
    0x1017 : "RedBalance",
    0x1018 : "BlueBalance",
    0x1019 : "ColorMatrixNumber",
    0x101A : "SerialNumber",
    0x101B : "ExternalFlashAE1_0?",
    0x101C : "ExternalFlashAE2_0?",
    0x101D : "InternalFlashAE1_0?",
    0x101E : "InternalFlashAE2_0?",
    0x101F : "ExternalFlashAE1?",
    0x1020 : "ExternalFlashAE2?",
    0x1021 : "InternalFlashAE1?",
    0x1022 : "InternalFlashAE2?",
    0x1023 : "FlashExposureComp",
    0x1024 : "InternalFlashTable",
    0x1025 : "ExternalFlashGValue",
    0x1026 : "ExternalFlashBounce",
    0x1027 : "ExternalFlashZoom",
    0x1028 : "ExternalFlashMode",
    0x1029 : "Contrast",
    0x102A : "SharpnessFactor",
    0x102B : "ColorControl",
    0x102C : "ValidBits",
    0x102D : "CoringFilter",
    0x102E : "OlympusImageWidth",
    0x102F : "OlympusImageHeight",
    0x1030 : "SceneDetect",
    0x1031 : "SceneArea?",
    0x1033 : "SceneDetectData?",
    0x1034 : "CompressionRatio",
    0x1035 : "PreviewImageValid",
    0x1036 : "PreviewImageStart",
    0x1037 : "PreviewImageLength",
    0x1038 : "AFResult",
    0x1039 : "CCDScanMode",
    0x103A : "NoiseReduction",
    0x103B : "FocusStepInfinity",
    0x103C : "FocusStepNear",
    0x103D : "LightValueCenter",
    0x103E : "LightValuePeriphery",
    0x103F : "FieldCount?",
    0x2010 : "Equipment",
    0x2020 : "CameraSettings",
    0x2030 : "RawDevelopment",
    0x2031 : "RawDev2",
    0x2040 : "ImageProcessing",
    0x2050 : "FocusInfo",
    0x2100 : "Olympus2100",
    0x2200 : "Olympus2200",
    0x2300 : "Olympus2300",
    0x2400 : "Olympus2400",
    0x2500 : "Olympus2500",
    0x2600 : "Olympus2600",
    0x2700 : "Olympus2700",
    0x2800 : "Olympus2800",
    0x2900 : "Olympus2900",
    0x3000 : "RawInfo",
    0x4000 : "MainInfo",
    0x5000 : "UnknownInfo"

  };

  // Olympus flavored Makernote data starts after eight bytes
  var ifdOffset = makernoteOffset + 8;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.olympusMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.olympusMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
    if (exifEntry && exifEntry.tagName !== null) makernoteData[exifEntry.tagName] = exifEntry.value;
  }

  return makernoteData;

};

/***/ }),
/* 78 */
/***/ (function(module, exports) {

/**
 * Extracts Panasonic flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Panasonic.html
  var tags = {

    0x0001 : "ImageQuality",
    0x0002 : "FirmwareVersion",
    0x0003 : "WhiteBalance",
    0x0007 : "FocusMode",
    0x000f : "AFAreaMode",
    0x001a : "ImageStabilization",
    0x001c : "MacroMode",
    0x001f : "ShootingMode",
    0x0020 : "Audio",
    0x0021 : "DataDump",
    0x0023 : "WhiteBalanceBias",
    0x0024 : "FlashBias",
    0x0025 : "InternalSerialNumber",
    0x0026 : "PanasonicExifVersion",
    0x0028 : "ColorEffect",
    0x0029 : "TimeSincePowerOn",
    0x002a : "BurstMode",
    0x002b : "SequenceNumber",
    0x002c : "ContrastMode",
    0x002d : "NoiseReduction",
    0x002e : "SelfTimer",
    0x0030 : "Rotation",
    0x0031 : "AFAssistLamp",
    0x0032 : "ColorMode",
    0x0033 : "BabyAge",
    0x0034 : "OpticalZoomMode",
    0x0035 : "ConversionLens",
    0x0036 : "TravelDay",
    0x0039 : "Contrast",
    0x003a : "WorldTimeLocation",
    0x003b : "TextStamp",
    0x003c : "ProgramISO",
    0x003d : "AdvancedSceneType",
    0x003e : "TextStamp",
    0x003f : "FacesDetected",
    0x0040 : "Saturation",
    0x0041 : "Sharpness",
    0x0042 : "FilmMode",
    0x0044 : "ColorTempKelvin",
    0x0045 : "BracketSettings",
    0x0046 : "WBShiftAB",
    0x0047 : "WBShiftGM",
    0x0048 : "FlashCurtain",
    0x0049 : "LongExposureNoiseReduction",
    0x004b : "PanasonicImageWidth",
    0x004c : "PanasonicImageHeight",
    0x004d : "AFPointPosition",
    0x004e : "FaceDetInfo",
    0x0051 : "LensType",
    0x0052 : "LensSerialNumber",
    0x0053 : "AccessoryType",
    0x0054 : "AccessorySerialNumber",
    0x0059 : "Transform",
    0x005d : "IntelligentExposure",
    0x0060 : "LensFirmwareVersion",
    0x0061 : "FaceRecInfo",
    0x0062 : "FlashWarning",
    0x0063 : "RecognizedFaceFlags?",
    0x0065 : "Title",
    0x0066 : "BabyName",
    0x0067 : "Location",
    0x0069 : "Country",
    0x006b : "State",
    0x006d : "City",
    0x006f : "Landmark",
    0x0070 : "IntelligentResolution",
    0x0077 : "BurstSpeed",
    0x0079 : "IntelligentD-Range",
    0x007c : "ClearRetouch",
    0x0086 : "ManometerPressure",
    0x0089 : "PhotoStyle",
    0x008a : "ShadingCompensation",
    0x008c : "AccelerometerZ",
    0x008d : "AccelerometerX",
    0x008e : "AccelerometerY",
    0x008f : "CameraOrientation",
    0x0090 : "RollAngle",
    0x0091 : "PitchAngle",
    0x0093 : "SweepPanoramaDirection",
    0x0094 : "SweepPanoramaFieldOfView",
    0x0096 : "TimerRecording",
    0x009d : "InternalNDFilter",
    0x009e : "HDR",
    0x009f : "ShutterType",
    0x00a3 : "ClearRetouchValue",
    0x00ab : "TouchAE",
    0x0e00 : "PrintIM",
    0x8000 : "MakerNoteVersion",
    0x8001 : "SceneMode",
    0x8004 : "WBRedLevel",
    0x8005 : "WBGreenLevel",
    0x8006 : "WBBlueLevel",
    0x8007 : "FlashFired",
    0x8008 : "TextStamp",
    0x8009 : "TextStamp",
    0x8010 : "BabyAge",
    0x8012 : "Transform"

  };

  // Panasonic flavored Makernote data starts after twelve bytes
  var ifdOffset = makernoteOffset + 12;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.panasonicMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.panasonicMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), makernoteOffset, false, tags);
    if( ! exifEntry ) break; // stop if exifEntry starts to return false, prevents a process out of memory
    if (exifEntry && exifEntry.tagName) {
      makernoteData[exifEntry.tagName] = exifEntry.value;
    }
  }

  return makernoteData;

};


/***/ }),
/* 79 */
/***/ (function(module, exports) {

/**
 * Extracts Sanyo flavored Makernotes.
 */
exports.extractMakernotes = function (data, makernoteOffset, tiffOffset) {

  // List of vendor specific Makernote tags found on
  // http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/Sanyo.html
  var tags = {

    0x00FF : "MakerNoteOffset",
    0x0100 : "SanyoThumbnail",
    0x0200 : "SpecialMode",
    0x0201 : "SanyoQuality",
    0x0202 : "Macro",
    0x0204 : "DigitalZoom",
    0x0207 : "SoftwareVersion",
    0x0208 : "PictInfo",
    0x0209 : "CameraID",
    0x020E : "SequentialShot",
    0x020F : "WideRange",
    0x0210 : "ColorAdjustmentMode",
    0x0213 : "QuickShot",
    0x0214 : "SelfTimer",
    0x0216 : "VoiceMemo",
    0x0217 : "RecordShutterRelease",
    0x0218 : "FlickerReduce",
    0x0219 : "OpticalZoomOn",
    0x021B : "DigitalZoomOn",
    0x021D : "LightSourceSpecial",
    0x021E : "Resaved",
    0x021F : "SceneSelect",
    0x0223 : function (entry) {

      switch (entry.format) {
        case 0x0005:
          return "ManualFocusDistance";
        case 0x0007:
          return "FaceInfo";
        default:
          return false;
      }

    },
    0x0224 : "SequenceShotInterval",
    0x0225 : "FlashMode",
    0x0E00 : "PrintIM",
    0x0F00 : "DataDump"

  };

  // Sanyo flavored Makernote data starts after eight bytes
  var ifdOffset = makernoteOffset + 8;

  // Get the number of entries and extract them
  var numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.sanyoMaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.sanyoMaxEntries);
  }

  var makernoteData = {};

  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, tags);
    if (exifEntry && exifEntry.tagName) {
      makernoteData[exifEntry.tagName] = exifEntry.value;
    }
  }

  return makernoteData;

};

/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = {
  copySync: __webpack_require__(171)
}


/***/ }),
/* 81 */
/***/ (function(module, exports, __webpack_require__) {

// imported from ncp (this is temporary, will rewrite)

var fs = __webpack_require__(1)
var path = __webpack_require__(0)
var utimes = __webpack_require__(191)

function ncp (source, dest, options, callback) {
  if (!callback) {
    callback = options
    options = {}
  }

  var basePath = process.cwd()
  var currentPath = path.resolve(basePath, source)
  var targetPath = path.resolve(basePath, dest)

  var filter = options.filter
  var transform = options.transform
  var overwrite = options.overwrite
  // If overwrite is undefined, use clobber, otherwise default to true:
  if (overwrite === undefined) overwrite = options.clobber
  if (overwrite === undefined) overwrite = true
  var errorOnExist = options.errorOnExist
  var dereference = options.dereference
  var preserveTimestamps = options.preserveTimestamps === true

  var started = 0
  var finished = 0
  var running = 0

  var errored = false

  startCopy(currentPath)

  function startCopy (source) {
    started++
    if (filter) {
      if (filter instanceof RegExp) {
        console.warn('Warning: fs-extra: Passing a RegExp filter is deprecated, use a function')
        if (!filter.test(source)) {
          return doneOne(true)
        }
      } else if (typeof filter === 'function') {
        if (!filter(source, dest)) {
          return doneOne(true)
        }
      }
    }
    return getStats(source)
  }

  function getStats (source) {
    var stat = dereference ? fs.stat : fs.lstat
    running++
    stat(source, function (err, stats) {
      if (err) return onError(err)

      // We need to get the mode from the stats object and preserve it.
      var item = {
        name: source,
        mode: stats.mode,
        mtime: stats.mtime, // modified time
        atime: stats.atime, // access time
        stats: stats // temporary
      }

      if (stats.isDirectory()) {
        return onDir(item)
      } else if (stats.isFile() || stats.isCharacterDevice() || stats.isBlockDevice()) {
        return onFile(item)
      } else if (stats.isSymbolicLink()) {
        // Symlinks don't really need to know about the mode.
        return onLink(source)
      }
    })
  }

  function onFile (file) {
    var target = file.name.replace(currentPath, targetPath.replace('$', '$$$$')) // escapes '$' with '$$'
    isWritable(target, function (writable) {
      if (writable) {
        copyFile(file, target)
      } else {
        if (overwrite) {
          rmFile(target, function () {
            copyFile(file, target)
          })
        } else if (errorOnExist) {
          onError(new Error(target + ' already exists'))
        } else {
          doneOne()
        }
      }
    })
  }

  function copyFile (file, target) {
    var readStream = fs.createReadStream(file.name)
    var writeStream = fs.createWriteStream(target, { mode: file.mode })

    readStream.on('error', onError)
    writeStream.on('error', onError)

    if (transform) {
      transform(readStream, writeStream, file)
    } else {
      writeStream.on('open', function () {
        readStream.pipe(writeStream)
      })
    }

    writeStream.once('close', function () {
      fs.chmod(target, file.mode, function (err) {
        if (err) return onError(err)
        if (preserveTimestamps) {
          utimes.utimesMillis(target, file.atime, file.mtime, function (err) {
            if (err) return onError(err)
            return doneOne()
          })
        } else {
          doneOne()
        }
      })
    })
  }

  function rmFile (file, done) {
    fs.unlink(file, function (err) {
      if (err) return onError(err)
      return done()
    })
  }

  function onDir (dir) {
    var target = dir.name.replace(currentPath, targetPath.replace('$', '$$$$')) // escapes '$' with '$$'
    isWritable(target, function (writable) {
      if (writable) {
        return mkDir(dir, target)
      }
      copyDir(dir.name)
    })
  }

  function mkDir (dir, target) {
    fs.mkdir(target, dir.mode, function (err) {
      if (err) return onError(err)
      // despite setting mode in fs.mkdir, doesn't seem to work
      // so we set it here.
      fs.chmod(target, dir.mode, function (err) {
        if (err) return onError(err)
        copyDir(dir.name)
      })
    })
  }

  function copyDir (dir) {
    fs.readdir(dir, function (err, items) {
      if (err) return onError(err)
      items.forEach(function (item) {
        startCopy(path.join(dir, item))
      })
      return doneOne()
    })
  }

  function onLink (link) {
    var target = link.replace(currentPath, targetPath)
    fs.readlink(link, function (err, resolvedPath) {
      if (err) return onError(err)
      checkLink(resolvedPath, target)
    })
  }

  function checkLink (resolvedPath, target) {
    if (dereference) {
      resolvedPath = path.resolve(basePath, resolvedPath)
    }
    isWritable(target, function (writable) {
      if (writable) {
        return makeLink(resolvedPath, target)
      }
      fs.readlink(target, function (err, targetDest) {
        if (err) return onError(err)

        if (dereference) {
          targetDest = path.resolve(basePath, targetDest)
        }
        if (targetDest === resolvedPath) {
          return doneOne()
        }
        return rmFile(target, function () {
          makeLink(resolvedPath, target)
        })
      })
    })
  }

  function makeLink (linkPath, target) {
    fs.symlink(linkPath, target, function (err) {
      if (err) return onError(err)
      return doneOne()
    })
  }

  function isWritable (path, done) {
    fs.lstat(path, function (err) {
      if (err) {
        if (err.code === 'ENOENT') return done(true)
        return done(false)
      }
      return done(false)
    })
  }

  function onError (err) {
    // ensure callback is defined & called only once:
    if (!errored && callback !== undefined) {
      errored = true
      return callback(err)
    }
  }

  function doneOne (skipped) {
    if (!skipped) running--
    finished++
    if ((started === finished) && (running === 0)) {
      if (callback !== undefined) {
        return callback(null)
      }
    }
  }
}

module.exports = ncp


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

// This is adapted from https://github.com/normalize/mz
// Copyright (c) 2014-2016 Jonathan Ong me@jongleberry.com and Contributors
const u = __webpack_require__(4).fromCallback
const fs = __webpack_require__(1)

const api = [
  'access',
  'appendFile',
  'chmod',
  'chown',
  'close',
  'fchmod',
  'fchown',
  'fdatasync',
  'fstat',
  'fsync',
  'ftruncate',
  'futimes',
  'lchown',
  'link',
  'lstat',
  'mkdir',
  'open',
  'read',
  'readFile',
  'readdir',
  'readlink',
  'realpath',
  'rename',
  'rmdir',
  'stat',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'write',
  'writeFile'
]
// fs.mkdtemp() was added in Node.js v5.10.0, so check if it exists
typeof fs.mkdtemp === 'function' && api.push('mkdtemp')

// Export all keys:
Object.keys(fs).forEach(key => {
  exports[key] = fs[key]
})

// Universalify async methods:
api.forEach(method => {
  exports[method] = u(fs[method])
})

// We differ from mz/fs in that we still ship the old, broken, fs.exists()
// since we are a drop-in replacement for the native module
exports.exists = function (filename, callback) {
  if (typeof callback === 'function') {
    return fs.exists(filename, callback)
  }
  return new Promise(resolve => {
    return fs.exists(filename, resolve)
  })
}


/***/ }),
/* 83 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const assign = __webpack_require__(190)

const fs = {}

// Export graceful-fs:
assign(fs, __webpack_require__(82))
// Export extra methods:
assign(fs, __webpack_require__(173))
assign(fs, __webpack_require__(80))
assign(fs, __webpack_require__(6))
assign(fs, __webpack_require__(31))
assign(fs, __webpack_require__(181))
assign(fs, __webpack_require__(187))
assign(fs, __webpack_require__(186))
assign(fs, __webpack_require__(174))
assign(fs, __webpack_require__(176))
assign(fs, __webpack_require__(188))
assign(fs, __webpack_require__(11))

module.exports = fs


/***/ }),
/* 84 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0)

// get drive on windows
function getRootPath (p) {
  p = path.normalize(path.resolve(p)).split(path.sep)
  if (p.length > 0) return p[0]
  return null
}

// http://stackoverflow.com/a/62888/10333 contains more accurate
// TODO: expand to include the rest
const INVALID_PATH_CHARS = /[<>:"|?*]/

function invalidWin32Path (p) {
  const rp = getRootPath(p)
  p = p.replace(rp, '')
  return INVALID_PATH_CHARS.test(p)
}

module.exports = {
  getRootPath,
  invalidWin32Path
}


/***/ }),
/* 85 */
/***/ (function(module, exports) {

/* eslint-disable node/no-deprecated-api */
module.exports = function (size) {
  if (typeof Buffer.allocUnsafe === 'function') {
    try {
      return Buffer.allocUnsafe(size)
    } catch (e) {
      return new Buffer(size)
    }
  }
  return new Buffer(size)
}


/***/ }),
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(2)

module.exports = clone(fs)

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ }
  else
    var copy = Object.create(null)

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
  })

  return copy
}


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(2);
var path = __webpack_require__(0);

var detector = __webpack_require__(196);

var handlers = {};
var types = __webpack_require__(89);

// load all available handlers
types.forEach(function (type) {
  handlers[type] = __webpack_require__(88)("./" + type);
});

// Maximum buffer size, with a default of 128 kilobytes.
// TO-DO: make this adaptive based on the initial signature of the image
var MaxBufferSize = 128*1024;

function lookup (buffer, filepath) {
  // detect the file type.. don't rely on the extension
  var type = detector(buffer, filepath);

  // find an appropriate handler for this file type
  if (type in handlers) {
    var size = handlers[type].calculate(buffer, filepath);
    if (size !== false) {
      size.type = type;
      return size;
    }
  }

  // throw up, if we don't understand the file
  throw new TypeError('unsupported file type: ' + type + ' (file: ' + filepath + ')');
}

function asyncFileToBuffer (filepath, callback) {
  // open the file in read only mode
  fs.open(filepath, 'r', function (err, descriptor) {
    if (err) { return callback(err); }
    var size = fs.fstatSync(descriptor).size;
    if (size <= 0){return callback(new Error("File size is not greater than 0 —— " + filepath)); }
    var bufferSize = Math.min(size, MaxBufferSize);
    var buffer = new Buffer(bufferSize);
    // read first buffer block from the file, asynchronously
    fs.read(descriptor, buffer, 0, bufferSize, 0, function (err) {
      if (err) { return callback(err); }
      // close the file, we are done
      fs.close(descriptor, function (err) {
        callback(err, buffer);
      });
    });
  });
}

function syncFileToBuffer (filepath) {
  // read from the file, synchronously
  var descriptor = fs.openSync(filepath, 'r');
  var size = fs.fstatSync(descriptor).size;
  var bufferSize = Math.min(size, MaxBufferSize);
  var buffer = new Buffer(bufferSize);
  fs.readSync(descriptor, buffer, 0, bufferSize, 0);
  fs.closeSync(descriptor);
  return buffer;
}

/**
 * @params input - buffer or relative/absolute path of the image file
 * @params callback - optional function for async detection
 */
module.exports = function (input, callback) {

  // Handle buffer input
  if (Buffer.isBuffer(input)) {
    return lookup(input);
  }

  // input should be a string at this point
  if (typeof input !== 'string') {
    throw new TypeError('invalid invocation');
  }

  // resolve the file path
  var filepath = path.resolve(input);

  if (typeof callback === 'function') {
    asyncFileToBuffer(filepath, function (err, buffer) {
      if (err) { return callback(err); }

      // return the dimensions
      var dimensions;
      try {
        dimensions = lookup(buffer, filepath);
      } catch (e) {
        err = e;
      }
      callback(err, dimensions);
    });
  } else {
    var buffer = syncFileToBuffer(filepath);
    return lookup(buffer, filepath);
  }
};

module.exports.types = types;


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./bmp": 90,
	"./bmp.js": 90,
	"./dds": 91,
	"./dds.js": 91,
	"./gif": 92,
	"./gif.js": 92,
	"./jpg": 93,
	"./jpg.js": 93,
	"./png": 94,
	"./png.js": 94,
	"./psd": 95,
	"./psd.js": 95,
	"./svg": 96,
	"./svg.js": 96,
	"./tiff": 97,
	"./tiff.js": 97,
	"./webp": 98,
	"./webp.js": 98
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 88;

/***/ }),
/* 89 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = [
  'bmp',
  'gif',
  'jpg',
  'png',
  'psd',
  'svg',
  'tiff',
  'webp',
  'dds'
];


/***/ }),
/* 90 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function isBMP (buffer) {
  return ('BM' === buffer.toString('ascii', 0, 2));
}

function calculate (buffer) {
  return {
    'width': buffer.readUInt32LE(18),
    'height': Math.abs(buffer.readInt32LE(22))
  };
}

module.exports = {
  'detect': isBMP,
  'calculate': calculate
};


/***/ }),
/* 91 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function isDDS(buffer){
	return buffer.readUInt32LE(0) === 0x20534444;
}

function calculate(buffer){
	// read file resolution metadata
	return {
		'height': buffer.readUInt32LE(12),
		'width': buffer.readUInt32LE(16)
	};
}

module.exports = {
	'detect': isDDS,
	'calculate': calculate
};


/***/ }),
/* 92 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var gifRegexp = /^GIF8[79]a/;
function isGIF (buffer) {
  var signature = buffer.toString('ascii', 0, 6);
  return (gifRegexp.test(signature));
}

function calculate(buffer) {
  return {
    'width': buffer.readUInt16LE(6),
    'height': buffer.readUInt16LE(8)
  };
}

module.exports = {
  'detect': isGIF,
  'calculate': calculate
};


/***/ }),
/* 93 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// NOTE: we only support baseline and progressive JPGs here
// due to the structure of the loader class, we only get a buffer
// with a maximum size of 4096 bytes. so if the SOF marker is outside
// if this range we can't detect the file size correctly.

function isJPG (buffer) { //, filepath
  var SOIMarker = buffer.toString('hex', 0, 2);
  return ('ffd8' === SOIMarker);
}

function extractSize (buffer, i) {
  return {
    'height' : buffer.readUInt16BE(i),
    'width' : buffer.readUInt16BE(i + 2)
  };
}

function validateBuffer (buffer, i) {
  // index should be within buffer limits
  if (i > buffer.length) {
    throw new TypeError('Corrupt JPG, exceeded buffer limits');
  }
  // Every JPEG block must begin with a 0xFF
  if (buffer[i] !== 0xFF) {
    throw new TypeError('Invalid JPG, marker table corrupted');
  }
}

function calculate (buffer) {

  // Skip 4 chars, they are for signature
  buffer = buffer.slice(4);

  var i, next;
  while (buffer.length) {
    // read length of the next block
    i = buffer.readUInt16BE(0);

    // ensure correct format
    validateBuffer(buffer, i);

    // 0xFFC0 is baseline standard(SOF)
    // 0xFFC1 is baseline optimized(SOF)
    // 0xFFC2 is progressive(SOF2)
    next = buffer[i + 1];
    if (next === 0xC0 || next === 0xC1 || next === 0xC2) {
      return extractSize(buffer, i + 5);
    }

    // move to the next block
    buffer = buffer.slice(i + 2);
  }

  throw new TypeError('Invalid JPG, no size found');
}

module.exports = {
  'detect': isJPG,
  'calculate': calculate
};


/***/ }),
/* 94 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var pngSignature = 'PNG\r\n\x1a\n';
var pngImageHeaderChunkName = 'IHDR';
var pngFriedChunkName = 'CgBI'; // Used to detect "fried" png's: http://www.jongware.com/pngdefry.html

function isPNG (buffer) {
  if (pngSignature === buffer.toString('ascii', 1, 8)) {
    var chunkName = buffer.toString('ascii', 12, 16);
    if (chunkName === pngFriedChunkName) {
      chunkName = buffer.toString('ascii', 28, 32);
    }
    if (chunkName !== pngImageHeaderChunkName) {
      throw new TypeError('invalid png');
    }
    return true;
  }
}

function calculate (buffer) {
  if (buffer.toString('ascii', 12, 16) === pngFriedChunkName) {
    return {
      'width': buffer.readUInt32BE(32),
      'height': buffer.readUInt32BE(36)
    };
  }
  return {
    'width': buffer.readUInt32BE(16),
    'height': buffer.readUInt32BE(20)
  };
}

module.exports = {
  'detect': isPNG,
  'calculate': calculate
};


/***/ }),
/* 95 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function isPSD (buffer) {
  return ('8BPS' === buffer.toString('ascii', 0, 4));
}

function calculate (buffer) {
  return {
    'width': buffer.readUInt32BE(18),
    'height': buffer.readUInt32BE(14)
  };
}

module.exports = {
  'detect': isPSD,
  'calculate': calculate
};


/***/ }),
/* 96 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var svgReg = /<svg[^>]+[^>]*>/;
function isSVG (buffer) {
  return svgReg.test(buffer);
}

var extractorRegExps = {
  'root': /<svg\s[^>]+>/,
  'width': /\bwidth=(['"])([^%]+?)\1/,
  'height': /\bheight=(['"])([^%]+?)\1/,
  'viewbox': /\bviewBox=(['"])(.+?)\1/
};

function parseViewbox (viewbox) {
  var bounds = viewbox.split(' ');
  return {
    'width': parseInt(bounds[2], 10),
    'height': parseInt(bounds[3], 10)
  };
}

function parseAttributes (root) {
  var width = root.match(extractorRegExps.width);
  var height = root.match(extractorRegExps.height);
  var viewbox = root.match(extractorRegExps.viewbox);
  return {
    'width': width && parseInt(width[2], 10),
    'height': height && parseInt(height[2], 10),
    'viewbox': viewbox && parseViewbox(viewbox[2])
  };
}

function calculateByDimensions (attrs) {
  return {
    'width': attrs.width,
    'height': attrs.height
  };
}

function calculateByViewbox (attrs) {
  var ratio = attrs.viewbox.width / attrs.viewbox.height;
  if (attrs.width) {
    return {
      'width': attrs.width,
      'height': Math.floor(attrs.width / ratio)
    };
  }
  if (attrs.height) {
    return {
      'width': Math.floor(attrs.height * ratio),
      'height': attrs.height
    };
  }
  return {
    'width': attrs.viewbox.width,
    'height': attrs.viewbox.height
  };
}

function calculate (buffer) {
  var root = buffer.toString('utf8').match(extractorRegExps.root);
  if (root) {
    var attrs = parseAttributes(root[0]);
    if (attrs.width && attrs.height) {
      return calculateByDimensions(attrs);
    }
    if (attrs.viewbox) {
      return calculateByViewbox(attrs);
    }
  }
  throw new TypeError('invalid svg');
}

module.exports = {
  'detect': isSVG,
  'calculate': calculate
};


/***/ }),
/* 97 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// based on http://www.compix.com/fileformattif.htm
// TO-DO: support big-endian as well

var fs = __webpack_require__(2);
var readUInt = __webpack_require__(197);

function isTIFF (buffer) {
  var hex4 = buffer.toString('hex', 0, 4);
  return ('49492a00' === hex4 || '4d4d002a' === hex4);
}

// Read IFD (image-file-directory) into a buffer
function readIFD (buffer, filepath, isBigEndian) {

  var ifdOffset = readUInt(buffer, 32, 4, isBigEndian);

  // read only till the end of the file
  var bufferSize = 1024;
  var fileSize = fs.statSync(filepath).size;
  if (ifdOffset + bufferSize > fileSize) {
    bufferSize = fileSize - ifdOffset - 10;
  }

  // populate the buffer
  var endBuffer = new Buffer(bufferSize);
  var descriptor = fs.openSync(filepath, 'r');
  fs.readSync(descriptor, endBuffer, 0, bufferSize, ifdOffset);

  // var ifdLength = readUInt(endBuffer, 16, 0, isBigEndian);
  var ifdBuffer = endBuffer.slice(2); //, 2 + 12 * ifdLength);
  return ifdBuffer;
}

// TIFF values seem to be messed up on Big-Endian, this helps
function readValue (buffer, isBigEndian) {
  var low = readUInt(buffer, 16, 8, isBigEndian);
  var high = readUInt(buffer, 16, 10, isBigEndian);
  return (high << 16) + low;
}

// move to the next tag
function nextTag (buffer) {
  if (buffer.length > 24) {
    return buffer.slice(12);
  }
}

// Extract IFD tags from TIFF metadata
function extractTags (buffer, isBigEndian) {
  var tags = {};
  var code, type, length;

  while (buffer && buffer.length) {
    code = readUInt(buffer, 16, 0, isBigEndian);
    type = readUInt(buffer, 16, 2, isBigEndian);
    length = readUInt(buffer, 32, 4, isBigEndian);

    // 0 means end of IFD
    if (code === 0) {
      break;
    } else {
      // 256 is width, 257 is height
      // if (code === 256 || code === 257) {
      if (length === 1 && (type === 3 || type === 4)) {
        tags[code] = readValue(buffer, isBigEndian);
      }

      // move to the next tag
      buffer = nextTag(buffer);
    }
  }
  return tags;
}

// Test if the TIFF is Big Endian or Little Endian
function determineEndianness (buffer) {
  var signature = buffer.toString('ascii', 0, 2);
  if ('II' === signature) {
    return 'LE';
  } else if ('MM' === signature) {
    return 'BE';
  }
}

function calculate (buffer, filepath) {

  if (!filepath) {
    throw new TypeError('Tiff doesn\'t support buffer');
  }

  // Determine BE/LE
  var isBigEndian = determineEndianness(buffer) === 'BE';

  // read the IFD
  var ifdBuffer = readIFD(buffer, filepath, isBigEndian);

  // extract the tags from the IFD
  var tags = extractTags(ifdBuffer, isBigEndian);

  var width = tags[256];
  var height = tags[257];

  if (!width || !height) {
    throw new TypeError('Invalid Tiff, missing tags');
  }

  return {
    'width': width,
    'height': height
  };
}

module.exports = {
  'detect': isTIFF,
  'calculate': calculate
};


/***/ }),
/* 98 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// based on https://developers.google.com/speed/webp/docs/riff_container

function isWebP (buffer) {
  var riffHeader = 'RIFF' === buffer.toString('ascii', 0, 4);
  var webpHeader = 'WEBP' === buffer.toString('ascii', 8, 12);
  var vp8Header  = 'VP8'  === buffer.toString('ascii', 12, 15);
  return (riffHeader && webpHeader && vp8Header);
}

function calculate (buffer) {
  var chunkHeader = buffer.toString('ascii', 12, 16);
  buffer = buffer.slice(20, 30);

  // Extended webp stream signature
  if (chunkHeader === 'VP8X') {
    var extendedHeader = buffer[0];
    var validStart = (extendedHeader & 0xc0) === 0;
    var validEnd = (extendedHeader & 0x01) === 0;
    if (validStart && validEnd) {
      return calculateExtended(buffer);
    } else {
      return false;
    }
  }

  // Lossless webp stream signature
  if (chunkHeader === 'VP8 ' && buffer[0] !== 0x2f) {
    return calculateLossy(buffer);
  }

  // Lossy webp stream signature
  var signature = buffer.toString('hex', 3, 6);
  if (chunkHeader === 'VP8L' && signature !== '9d012a') {
    return calculateLossless(buffer);
  }

  return false;
}

function calculateExtended (buffer) {
  return {
    'width': 1 + buffer.readUIntLE(4, 3),
    'height': 1 + buffer.readUIntLE(7, 3)
  }
}

function calculateLossless (buffer) {
  return {
    'width': 1 + (((buffer[2] & 0x3F) << 8) | buffer[1]),
    'height': 1 + (((buffer[4] & 0xF) << 10) | (buffer[3] << 2) |
                  ((buffer[2] & 0xC0) >> 6))
  };
}

function calculateLossy (buffer) {
  // `& 0x3fff` returns the last 14 bits
  // TO-DO: include webp scaling in the calculations
  return {
    'width': buffer.readInt16LE(6) & 0x3fff,
    'height': buffer.readInt16LE(8) & 0x3fff
  };
}

module.exports = {
  'detect': isWebP,
  'calculate': calculate
};


/***/ }),
/* 99 */
/***/ (function(module, exports, __webpack_require__) {

(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["isomorphic-path"] = factory();
	else
		root["isomorphic-path"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../typings/path.d.ts" />
const path_1 = __webpack_require__(2);
const platform_1 = __webpack_require__(4);
const noop_1 = __webpack_require__(5);
const unsupportedMethods = {
    resolve: noop_1.noop,
    relative: noop_1.noop
};
const win32Runtime = Object.assign({}, path_1.win32, platform_1.isBrowser() ? unsupportedMethods : {});
exports.win32 = win32Runtime;
const posixRuntime = Object.assign({}, path_1.posix, platform_1.isBrowser() ? unsupportedMethods : {});
exports.posix = posixRuntime;
const basePath = {
    win32: win32Runtime,
    posix: posixRuntime
};
const defaultExport = Object.assign({}, platform_1.isPc() ? win32Runtime : posixRuntime, basePath);
exports.default = defaultExport;


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __webpack_require__(0);
const path_2 = __webpack_require__(0);
exports.win32 = path_2.win32;
exports.posix = path_2.posix;
exports.default = path_1.default;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.




var isWindows = process.platform === 'win32';
var util = __webpack_require__(3);


// resolves . and .. elements in a path array with directory names there
// must be no slashes or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  var res = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];

    // ignore empty parts
    if (!p || p === '.')
      continue;

    if (p === '..') {
      if (res.length && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }

  return res;
}

// returns an array with empty elements removed from either end of the input
// array or the original array if no elements need to be removed
function trimArray(arr) {
  var lastIndex = arr.length - 1;
  var start = 0;
  for (; start <= lastIndex; start++) {
    if (arr[start])
      break;
  }

  var end = lastIndex;
  for (; end >= 0; end--) {
    if (arr[end])
      break;
  }

  if (start === 0 && end === lastIndex)
    return arr;
  if (start > end)
    return [];
  return arr.slice(start, end + 1);
}

// Regex to split a windows path into three parts: [*, device, slash,
// tail] windows-only
var splitDeviceRe =
    /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;

// Regex to split the tail part of the above into [*, dir, basename, ext]
var splitTailRe =
    /^([\s\S]*?)((?:\.{1,2}|[^\\\/]+?|)(\.[^.\/\\]*|))(?:[\\\/]*)$/;

var win32 = {};

// Function to split a filename into [root, dir, basename, ext]
function win32SplitPath(filename) {
  // Separate device+slash from tail
  var result = splitDeviceRe.exec(filename),
      device = (result[1] || '') + (result[2] || ''),
      tail = result[3] || '';
  // Split the tail into dir, basename and extension
  var result2 = splitTailRe.exec(tail),
      dir = result2[1],
      basename = result2[2],
      ext = result2[3];
  return [device, dir, basename, ext];
}

function win32StatPath(path) {
  var result = splitDeviceRe.exec(path),
      device = result[1] || '',
      isUnc = !!device && device[1] !== ':';
  return {
    device: device,
    isUnc: isUnc,
    isAbsolute: isUnc || !!result[2], // UNC paths are always absolute
    tail: result[3]
  };
}

function normalizeUNCRoot(device) {
  return '\\\\' + device.replace(/^[\\\/]+/, '').replace(/[\\\/]+/g, '\\');
}

// path.resolve([from ...], to)
win32.resolve = function() {
  var resolvedDevice = '',
      resolvedTail = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1; i--) {
    var path;
    if (i >= 0) {
      path = arguments[i];
    } else if (!resolvedDevice) {
      path = process.cwd();
    } else {
      // Windows has the concept of drive-specific current working
      // directories. If we've resolved a drive letter but not yet an
      // absolute path, get cwd for that drive. We're sure the device is not
      // an unc path at this points, because unc paths are always absolute.
      path = process.env['=' + resolvedDevice];
      // Verify that a drive-local cwd was found and that it actually points
      // to our drive. If not, default to the drive's root.
      if (!path || path.substr(0, 3).toLowerCase() !==
          resolvedDevice.toLowerCase() + '\\') {
        path = resolvedDevice + '\\';
      }
    }

    // Skip empty and invalid entries
    if (!util.isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    var result = win32StatPath(path),
        device = result.device,
        isUnc = result.isUnc,
        isAbsolute = result.isAbsolute,
        tail = result.tail;

    if (device &&
        resolvedDevice &&
        device.toLowerCase() !== resolvedDevice.toLowerCase()) {
      // This path points to another device so it is not applicable
      continue;
    }

    if (!resolvedDevice) {
      resolvedDevice = device;
    }
    if (!resolvedAbsolute) {
      resolvedTail = tail + '\\' + resolvedTail;
      resolvedAbsolute = isAbsolute;
    }

    if (resolvedDevice && resolvedAbsolute) {
      break;
    }
  }

  // Convert slashes to backslashes when `resolvedDevice` points to an UNC
  // root. Also squash multiple slashes into a single one where appropriate.
  if (isUnc) {
    resolvedDevice = normalizeUNCRoot(resolvedDevice);
  }

  // At this point the path should be resolved to a full absolute path,
  // but handle relative paths to be safe (might happen when process.cwd()
  // fails)

  // Normalize the tail path
  resolvedTail = normalizeArray(resolvedTail.split(/[\\\/]+/),
                                !resolvedAbsolute).join('\\');

  return (resolvedDevice + (resolvedAbsolute ? '\\' : '') + resolvedTail) ||
         '.';
};


win32.normalize = function(path) {
  var result = win32StatPath(path),
      device = result.device,
      isUnc = result.isUnc,
      isAbsolute = result.isAbsolute,
      tail = result.tail,
      trailingSlash = /[\\\/]$/.test(tail);

  // Normalize the tail path
  tail = normalizeArray(tail.split(/[\\\/]+/), !isAbsolute).join('\\');

  if (!tail && !isAbsolute) {
    tail = '.';
  }
  if (tail && trailingSlash) {
    tail += '\\';
  }

  // Convert slashes to backslashes when `device` points to an UNC root.
  // Also squash multiple slashes into a single one where appropriate.
  if (isUnc) {
    device = normalizeUNCRoot(device);
  }

  return device + (isAbsolute ? '\\' : '') + tail;
};


win32.isAbsolute = function(path) {
  return win32StatPath(path).isAbsolute;
};

win32.join = function() {
  var paths = [];
  for (var i = 0; i < arguments.length; i++) {
    var arg = arguments[i];
    if (!util.isString(arg)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (arg) {
      paths.push(arg);
    }
  }

  var joined = paths.join('\\');

  // Make sure that the joined path doesn't start with two slashes, because
  // normalize() will mistake it for an UNC path then.
  //
  // This step is skipped when it is very clear that the user actually
  // intended to point at an UNC path. This is assumed when the first
  // non-empty string arguments starts with exactly two slashes followed by
  // at least one more non-slash character.
  //
  // Note that for normalize() to treat a path as an UNC path it needs to
  // have at least 2 components, so we don't filter for that here.
  // This means that the user can use join to construct UNC paths from
  // a server name and a share name; for example:
  //   path.join('//server', 'share') -> '\\\\server\\share\')
  if (!/^[\\\/]{2}[^\\\/]/.test(paths[0])) {
    joined = joined.replace(/^[\\\/]{2,}/, '\\');
  }

  return win32.normalize(joined);
};


// path.relative(from, to)
// it will solve the relative path from 'from' to 'to', for instance:
// from = 'C:\\orandea\\test\\aaa'
// to = 'C:\\orandea\\impl\\bbb'
// The output of the function should be: '..\\..\\impl\\bbb'
win32.relative = function(from, to) {
  from = win32.resolve(from);
  to = win32.resolve(to);

  // windows is not case sensitive
  var lowerFrom = from.toLowerCase();
  var lowerTo = to.toLowerCase();

  var toParts = trimArray(to.split('\\'));

  var lowerFromParts = trimArray(lowerFrom.split('\\'));
  var lowerToParts = trimArray(lowerTo.split('\\'));

  var length = Math.min(lowerFromParts.length, lowerToParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (lowerFromParts[i] !== lowerToParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  if (samePartsLength == 0) {
    return to;
  }

  var outputParts = [];
  for (var i = samePartsLength; i < lowerFromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('\\');
};


win32._makeLong = function(path) {
  // Note: this will *probably* throw somewhere.
  if (!util.isString(path))
    return path;

  if (!path) {
    return '';
  }

  var resolvedPath = win32.resolve(path);

  if (/^[a-zA-Z]\:\\/.test(resolvedPath)) {
    // path is local filesystem path, which needs to be converted
    // to long UNC path.
    return '\\\\?\\' + resolvedPath;
  } else if (/^\\\\[^?.]/.test(resolvedPath)) {
    // path is network UNC path, which needs to be converted
    // to long UNC path.
    return '\\\\?\\UNC\\' + resolvedPath.substring(2);
  }

  return path;
};


win32.dirname = function(path) {
  var result = win32SplitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


win32.basename = function(path, ext) {
  var f = win32SplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


win32.extname = function(path) {
  return win32SplitPath(path)[3];
};


win32.format = function(pathObject) {
  if (!util.isObject(pathObject)) {
    throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof pathObject
    );
  }

  var root = pathObject.root || '';

  if (!util.isString(root)) {
    throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " +
        typeof pathObject.root
    );
  }

  var dir = pathObject.dir;
  var base = pathObject.base || '';
  if (!dir) {
    return base;
  }
  if (dir[dir.length - 1] === win32.sep) {
    return dir + base;
  }
  return dir + win32.sep + base;
};


win32.parse = function(pathString) {
  if (!util.isString(pathString)) {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = win32SplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


win32.sep = '\\';
win32.delimiter = ';';


// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var posix = {};


function posixSplitPath(filename) {
  return splitPathRe.exec(filename).slice(1);
}


// path.resolve([from ...], to)
// posix version
posix.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (!util.isString(path)) {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path[0] === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(resolvedPath.split('/'),
                                !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
posix.normalize = function(path) {
  var isAbsolute = posix.isAbsolute(path),
      trailingSlash = path && path[path.length - 1] === '/';

  // Normalize the path
  path = normalizeArray(path.split('/'), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
posix.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
posix.join = function() {
  var path = '';
  for (var i = 0; i < arguments.length; i++) {
    var segment = arguments[i];
    if (!util.isString(segment)) {
      throw new TypeError('Arguments to path.join must be strings');
    }
    if (segment) {
      if (!path) {
        path += segment;
      } else {
        path += '/' + segment;
      }
    }
  }
  return posix.normalize(path);
};


// path.relative(from, to)
// posix version
posix.relative = function(from, to) {
  from = posix.resolve(from).substr(1);
  to = posix.resolve(to).substr(1);

  var fromParts = trimArray(from.split('/'));
  var toParts = trimArray(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};


posix._makeLong = function(path) {
  return path;
};


posix.dirname = function(path) {
  var result = posixSplitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


posix.basename = function(path, ext) {
  var f = posixSplitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


posix.extname = function(path) {
  return posixSplitPath(path)[3];
};


posix.format = function(pathObject) {
  if (!util.isObject(pathObject)) {
    throw new TypeError(
        "Parameter 'pathObject' must be an object, not " + typeof pathObject
    );
  }

  var root = pathObject.root || '';

  if (!util.isString(root)) {
    throw new TypeError(
        "'pathObject.root' must be a string or undefined, not " +
        typeof pathObject.root
    );
  }

  var dir = pathObject.dir ? pathObject.dir + posix.sep : '';
  var base = pathObject.base || '';
  return dir + base;
};


posix.parse = function(pathString) {
  if (!util.isString(pathString)) {
    throw new TypeError(
        "Parameter 'pathString' must be a string, not " + typeof pathString
    );
  }
  var allParts = posixSplitPath(pathString);
  if (!allParts || allParts.length !== 4) {
    throw new TypeError("Invalid path '" + pathString + "'");
  }
  allParts[1] = allParts[1] || '';
  allParts[2] = allParts[2] || '';
  allParts[3] = allParts[3] || '';

  return {
    root: allParts[0],
    dir: allParts[0] + allParts[1].slice(0, -1),
    base: allParts[2],
    ext: allParts[3],
    name: allParts[2].slice(0, allParts[2].length - allParts[3].length)
  };
};


posix.sep = '/';
posix.delimiter = ':';


if (isWindows)
  module.exports = win32;
else /* posix */
  module.exports = posix;

module.exports.posix = posix;
module.exports.win32 = win32;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = __webpack_require__(7);

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.isMac = () => {
    if (process
        && typeof process.platform === 'string'
        && process.platform.toLowerCase() === 'darwin') {
        return true;
    }
    else if (typeof navigator !== 'undefined'
        && typeof navigator.platform === 'string'
        && navigator.platform.toLowerCase().indexOf('mac') > -1) {
        return true;
    }
    else {
        return false;
    }
};
exports.isPc = () => {
    if (process
        && typeof process.platform === 'string'
        && process.platform.toLowerCase() === 'win32') {
        return true;
    }
    else if (typeof navigator !== 'undefined'
        && typeof navigator.platform === 'string'
        && navigator.platform.toLowerCase().indexOf('win') > -1) {
        return true;
    }
    else {
        return false;
    }
};
exports.isBrowser = () => {
    return typeof window !== 'undefined';
};
exports.isNode = () => {
    return typeof window === 'undefined' && typeof process !== 'undefined';
};


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
exports.noop = (from, to) => {
    throw 'method unsupported in isomorphic-path';
};


/***/ })
/******/ ]);
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAyYTE2NDExNTFlNTEzYWU1ZjE3OCIsIndlYnBhY2s6Ly8vLi9saWIvcGF0aC50cyIsIndlYnBhY2s6Ly8vLi9saWIvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3BhdGgvcGF0aC5qcyIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJ1dGlsXCIiLCJ3ZWJwYWNrOi8vLy4vbGliL3BsYXRmb3JtLnRzIiwid2VicGFjazovLy8uL2xpYi9ub29wLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7QUM3REEsNkNBQTZDO0FBQzdDLHNDQUFtRTtBQUNuRSwwQ0FBNkM7QUFDN0Msc0NBQThCO0FBK0I5QixNQUFNLGtCQUFrQixHQUFHO0lBQ3pCLE9BQU8sRUFBRSxXQUFJO0lBQ2IsUUFBUSxFQUFFLFdBQUk7Q0FDZixDQUFDO0FBRUYsTUFBTSxZQUFZLEdBQVcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsWUFBUyxFQUFFLG9CQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBWXhFLDZCQUFLO0FBWDlCLE1BQU0sWUFBWSxHQUFVLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLFlBQVMsRUFBRyxvQkFBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQVdqRCw2QkFBSztBQVZyRCxNQUFNLFFBQVEsR0FBYztJQUMxQixLQUFLLEVBQUUsWUFBWTtJQUNuQixLQUFLLEVBQUUsWUFBWTtDQUNwQixDQUFDO0FBQ0YsTUFBTSxhQUFhLEdBQXNCLE1BQU0sQ0FBQyxNQUFNLENBQ3BELEVBQUUsRUFDRixlQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLEVBQ3BDLFFBQVEsQ0FDVCxDQUFDO0FBQ0Ysa0JBQWUsYUFBYSxDQUFDOzs7Ozs7Ozs7O0FDbEQ3QixzQ0FBMEI7QUFDMUIsc0NBQWtEO0FBRXpDLGdCQUZBLFlBQUssQ0FFQTtBQUFFLGdCQUZBLFlBQUssQ0FFQTtBQURyQixrQkFBZSxjQUFJLENBQUM7Ozs7Ozs7O0FDRnBCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7OztBQUdBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQixrQkFBa0I7QUFDbkM7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxRQUFRLG9CQUFvQjtBQUM1QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxRQUFRLFVBQVU7QUFDbEI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsRUFBRTs7QUFFMUI7QUFDQTtBQUNBLHVCQUF1QixJQUFJOztBQUUzQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLG9DQUFvQyxTQUFTO0FBQzdDO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLGlCQUFpQixzQkFBc0I7QUFDdkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DO0FBQ3BDO0FBQ0EsZ0JBQWdCLEVBQUU7QUFDbEIscUNBQXFDLEdBQUc7QUFDeEM7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaUJBQWlCLFlBQVk7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSwrQkFBK0IsMkJBQTJCO0FBQzFEO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FBRztBQUNIO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBLG9CQUFvQjs7O0FBR3BCO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QixJQUFJO0FBQ2pDOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsb0NBQW9DLDhCQUE4QjtBQUNsRTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCLHNCQUFzQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsaUJBQWlCLFlBQVk7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLCtCQUErQixzQkFBc0I7QUFDckQ7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7OztBQ25uQkEsaUM7Ozs7Ozs7OztBQ0FhLGFBQUssR0FBRyxHQUFZLEVBQUU7SUFDakMsRUFBRSxFQUFDLE9BQU87V0FDUCxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUTtXQUNwQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxFQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVc7V0FDdkMsT0FBTyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVE7V0FDdEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDTixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUMsQ0FBQztBQUVXLFlBQUksR0FBRyxHQUFZLEVBQUU7SUFDaEMsRUFBRSxFQUFDLE9BQU87V0FDUCxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssUUFBUTtXQUNwQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDOUMsTUFBTSxDQUFDLElBQUksQ0FBQztJQUNkLENBQUM7SUFBQyxJQUFJLENBQUMsRUFBRSxFQUFDLE9BQU8sU0FBUyxLQUFLLFdBQVc7V0FDckMsT0FBTyxTQUFTLENBQUMsUUFBUSxLQUFLLFFBQVE7V0FDdEMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDTixNQUFNLENBQUMsS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUMsQ0FBQztBQUVXLGlCQUFTLEdBQUcsR0FBWSxFQUFFO0lBQ3JDLE1BQU0sQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUM7QUFDdkMsQ0FBQyxDQUFDO0FBRVcsY0FBTSxHQUFHLEdBQVksRUFBRTtJQUNsQyxNQUFNLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsQ0FBQztBQUN6RSxDQUFDLENBQUM7Ozs7Ozs7Ozs7QUNsQ1csWUFBSSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQVUsRUFBVSxFQUFFO0lBQ3ZELE1BQU0sdUNBQXVDLENBQUM7QUFDaEQsQ0FBQyxDQUFDIiwiZmlsZSI6Imlzb21vcnBoaWMtcGF0aC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcImlzb21vcnBoaWMtcGF0aFwiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJpc29tb3JwaGljLXBhdGhcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiBcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMmExNjQxMTUxZTUxM2FlNWYxNzgiLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vdHlwaW5ncy9wYXRoLmQudHNcIiAvPlxuaW1wb3J0IHsgd2luMzIgYXMgd2luMzJCYXNlLCBwb3NpeCBhcyBwb3NpeEJhc2UgfSBmcm9tICdwYXRoL3BhdGgnO1xuaW1wb3J0IHsgaXNQYywgaXNCcm93c2VyIH0gZnJvbSAnLi9wbGF0Zm9ybSc7XG5pbXBvcnQgeyBub29wIH0gZnJvbSAnLi9ub29wJztcblxuZXhwb3J0IGludGVyZmFjZSBQYXJzZWRQYXRoIHtcbiAgICByb290OiBzdHJpbmc7XG4gICAgZGlyOiBzdHJpbmc7XG4gICAgYmFzZTogc3RyaW5nO1xuICAgIGV4dDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIElQYXRoIHtcbiAgbm9ybWFsaXplKHA6IHN0cmluZyk6IHN0cmluZztcbiAgam9pbiguLi5wYXRoczogYW55W10pOiBzdHJpbmc7XG4gIHJlc29sdmUoLi4ucGF0aFNlZ21lbnRzOiBhbnlbXSk6IHN0cmluZztcbiAgaXNBYnNvbHV0ZShwOiBzdHJpbmcpOiBib29sZWFuO1xuICByZWxhdGl2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmc7XG4gIGRpcm5hbWUocDogc3RyaW5nKTogc3RyaW5nO1xuICBiYXNlbmFtZShwOiBzdHJpbmcsIGV4dD86IHN0cmluZyk6IHN0cmluZztcbiAgZXh0bmFtZShwOiBzdHJpbmcpOiBzdHJpbmc7XG4gIHNlcDogc3RyaW5nO1xuICBkZWxpbWl0ZXI6IHN0cmluZztcbiAgcGFyc2UocDogc3RyaW5nKTogUGFyc2VkUGF0aDtcbiAgZm9ybWF0KHBQOiBQYXJzZWRQYXRoKTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUJhc2VQYXRoIHtcbiAgd2luMzI6IElQYXRoO1xuICBwb3NpeDogSVBhdGg7XG59XG5cblxuY29uc3QgdW5zdXBwb3J0ZWRNZXRob2RzID0ge1xuICByZXNvbHZlOiBub29wLFxuICByZWxhdGl2ZTogbm9vcFxufTtcblxuY29uc3Qgd2luMzJSdW50aW1lOiBJUGF0aCA9ICBPYmplY3QuYXNzaWduKHt9LCB3aW4zMkJhc2UsIGlzQnJvd3NlcigpID8gdW5zdXBwb3J0ZWRNZXRob2RzIDoge30pO1xuY29uc3QgcG9zaXhSdW50aW1lOiBJUGF0aCA9IE9iamVjdC5hc3NpZ24oe30sIHBvc2l4QmFzZSwgIGlzQnJvd3NlcigpID8gdW5zdXBwb3J0ZWRNZXRob2RzIDoge30pO1xuY29uc3QgYmFzZVBhdGg6IElCYXNlUGF0aCA9IHtcbiAgd2luMzI6IHdpbjMyUnVudGltZSxcbiAgcG9zaXg6IHBvc2l4UnVudGltZVxufTtcbmNvbnN0IGRlZmF1bHRFeHBvcnQ6IElQYXRoICYgSUJhc2VQYXRoID0gT2JqZWN0LmFzc2lnbihcbiAge30sXG4gIGlzUGMoKSA/IHdpbjMyUnVudGltZSA6IHBvc2l4UnVudGltZSxcbiAgYmFzZVBhdGhcbik7XG5leHBvcnQgZGVmYXVsdCBkZWZhdWx0RXhwb3J0O1xuZXhwb3J0IHsgd2luMzJSdW50aW1lIGFzIHdpbjMyLCBwb3NpeFJ1bnRpbWUgYXMgcG9zaXggfTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9wYXRoLnRzIiwiaW1wb3J0IHBhdGggZnJvbSAnLi9wYXRoJztcbmltcG9ydCB7IHdpbjMyLCBwb3NpeCwgUGFyc2VkUGF0aCB9IGZyb20gJy4vcGF0aCc7XG5leHBvcnQgZGVmYXVsdCBwYXRoO1xuZXhwb3J0IHsgd2luMzIsIHBvc2l4LCBQYXJzZWRQYXRoIH07XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9saWIvaW5kZXgudHMiLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cclxuLy9cclxuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcclxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxyXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcclxuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxyXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XHJcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxyXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcclxuLy9cclxuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcclxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXHJcbi8vXHJcbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1NcclxuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxyXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXHJcbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxyXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1JcclxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxyXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuXHJcbnZhciBpc1dpbmRvd3MgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xyXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcclxuXHJcblxyXG4vLyByZXNvbHZlcyAuIGFuZCAuLiBlbGVtZW50cyBpbiBhIHBhdGggYXJyYXkgd2l0aCBkaXJlY3RvcnkgbmFtZXMgdGhlcmVcclxuLy8gbXVzdCBiZSBubyBzbGFzaGVzIG9yIGRldmljZSBuYW1lcyAoYzpcXCkgaW4gdGhlIGFycmF5XHJcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxyXG4vLyByZWxhdGl2ZSBhbmQgYWJzb2x1dGUgcGF0aHMpXHJcbmZ1bmN0aW9uIG5vcm1hbGl6ZUFycmF5KHBhcnRzLCBhbGxvd0Fib3ZlUm9vdCkge1xyXG4gIHZhciByZXMgPSBbXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICB2YXIgcCA9IHBhcnRzW2ldO1xyXG5cclxuICAgIC8vIGlnbm9yZSBlbXB0eSBwYXJ0c1xyXG4gICAgaWYgKCFwIHx8IHAgPT09ICcuJylcclxuICAgICAgY29udGludWU7XHJcblxyXG4gICAgaWYgKHAgPT09ICcuLicpIHtcclxuICAgICAgaWYgKHJlcy5sZW5ndGggJiYgcmVzW3Jlcy5sZW5ndGggLSAxXSAhPT0gJy4uJykge1xyXG4gICAgICAgIHJlcy5wb3AoKTtcclxuICAgICAgfSBlbHNlIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xyXG4gICAgICAgIHJlcy5wdXNoKCcuLicpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXMucHVzaChwKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIHJldHVybiByZXM7XHJcbn1cclxuXHJcbi8vIHJldHVybnMgYW4gYXJyYXkgd2l0aCBlbXB0eSBlbGVtZW50cyByZW1vdmVkIGZyb20gZWl0aGVyIGVuZCBvZiB0aGUgaW5wdXRcclxuLy8gYXJyYXkgb3IgdGhlIG9yaWdpbmFsIGFycmF5IGlmIG5vIGVsZW1lbnRzIG5lZWQgdG8gYmUgcmVtb3ZlZFxyXG5mdW5jdGlvbiB0cmltQXJyYXkoYXJyKSB7XHJcbiAgdmFyIGxhc3RJbmRleCA9IGFyci5sZW5ndGggLSAxO1xyXG4gIHZhciBzdGFydCA9IDA7XHJcbiAgZm9yICg7IHN0YXJ0IDw9IGxhc3RJbmRleDsgc3RhcnQrKykge1xyXG4gICAgaWYgKGFycltzdGFydF0pXHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgdmFyIGVuZCA9IGxhc3RJbmRleDtcclxuICBmb3IgKDsgZW5kID49IDA7IGVuZC0tKSB7XHJcbiAgICBpZiAoYXJyW2VuZF0pXHJcbiAgICAgIGJyZWFrO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gbGFzdEluZGV4KVxyXG4gICAgcmV0dXJuIGFycjtcclxuICBpZiAoc3RhcnQgPiBlbmQpXHJcbiAgICByZXR1cm4gW107XHJcbiAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kICsgMSk7XHJcbn1cclxuXHJcbi8vIFJlZ2V4IHRvIHNwbGl0IGEgd2luZG93cyBwYXRoIGludG8gdGhyZWUgcGFydHM6IFsqLCBkZXZpY2UsIHNsYXNoLFxyXG4vLyB0YWlsXSB3aW5kb3dzLW9ubHlcclxudmFyIHNwbGl0RGV2aWNlUmUgPVxyXG4gICAgL14oW2EtekEtWl06fFtcXFxcXFwvXXsyfVteXFxcXFxcL10rW1xcXFxcXC9dK1teXFxcXFxcL10rKT8oW1xcXFxcXC9dKT8oW1xcc1xcU10qPykkLztcclxuXHJcbi8vIFJlZ2V4IHRvIHNwbGl0IHRoZSB0YWlsIHBhcnQgb2YgdGhlIGFib3ZlIGludG8gWyosIGRpciwgYmFzZW5hbWUsIGV4dF1cclxudmFyIHNwbGl0VGFpbFJlID1cclxuICAgIC9eKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFxcXFxcL10rP3wpKFxcLlteLlxcL1xcXFxdKnwpKSg/OltcXFxcXFwvXSopJC87XHJcblxyXG52YXIgd2luMzIgPSB7fTtcclxuXHJcbi8vIEZ1bmN0aW9uIHRvIHNwbGl0IGEgZmlsZW5hbWUgaW50byBbcm9vdCwgZGlyLCBiYXNlbmFtZSwgZXh0XVxyXG5mdW5jdGlvbiB3aW4zMlNwbGl0UGF0aChmaWxlbmFtZSkge1xyXG4gIC8vIFNlcGFyYXRlIGRldmljZStzbGFzaCBmcm9tIHRhaWxcclxuICB2YXIgcmVzdWx0ID0gc3BsaXREZXZpY2VSZS5leGVjKGZpbGVuYW1lKSxcclxuICAgICAgZGV2aWNlID0gKHJlc3VsdFsxXSB8fCAnJykgKyAocmVzdWx0WzJdIHx8ICcnKSxcclxuICAgICAgdGFpbCA9IHJlc3VsdFszXSB8fCAnJztcclxuICAvLyBTcGxpdCB0aGUgdGFpbCBpbnRvIGRpciwgYmFzZW5hbWUgYW5kIGV4dGVuc2lvblxyXG4gIHZhciByZXN1bHQyID0gc3BsaXRUYWlsUmUuZXhlYyh0YWlsKSxcclxuICAgICAgZGlyID0gcmVzdWx0MlsxXSxcclxuICAgICAgYmFzZW5hbWUgPSByZXN1bHQyWzJdLFxyXG4gICAgICBleHQgPSByZXN1bHQyWzNdO1xyXG4gIHJldHVybiBbZGV2aWNlLCBkaXIsIGJhc2VuYW1lLCBleHRdO1xyXG59XHJcblxyXG5mdW5jdGlvbiB3aW4zMlN0YXRQYXRoKHBhdGgpIHtcclxuICB2YXIgcmVzdWx0ID0gc3BsaXREZXZpY2VSZS5leGVjKHBhdGgpLFxyXG4gICAgICBkZXZpY2UgPSByZXN1bHRbMV0gfHwgJycsXHJcbiAgICAgIGlzVW5jID0gISFkZXZpY2UgJiYgZGV2aWNlWzFdICE9PSAnOic7XHJcbiAgcmV0dXJuIHtcclxuICAgIGRldmljZTogZGV2aWNlLFxyXG4gICAgaXNVbmM6IGlzVW5jLFxyXG4gICAgaXNBYnNvbHV0ZTogaXNVbmMgfHwgISFyZXN1bHRbMl0sIC8vIFVOQyBwYXRocyBhcmUgYWx3YXlzIGFic29sdXRlXHJcbiAgICB0YWlsOiByZXN1bHRbM11cclxuICB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBub3JtYWxpemVVTkNSb290KGRldmljZSkge1xyXG4gIHJldHVybiAnXFxcXFxcXFwnICsgZGV2aWNlLnJlcGxhY2UoL15bXFxcXFxcL10rLywgJycpLnJlcGxhY2UoL1tcXFxcXFwvXSsvZywgJ1xcXFwnKTtcclxufVxyXG5cclxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxyXG53aW4zMi5yZXNvbHZlID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHJlc29sdmVkRGV2aWNlID0gJycsXHJcbiAgICAgIHJlc29sdmVkVGFpbCA9ICcnLFxyXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XHJcblxyXG4gIGZvciAodmFyIGkgPSBhcmd1bWVudHMubGVuZ3RoIC0gMTsgaSA+PSAtMTsgaS0tKSB7XHJcbiAgICB2YXIgcGF0aDtcclxuICAgIGlmIChpID49IDApIHtcclxuICAgICAgcGF0aCA9IGFyZ3VtZW50c1tpXTtcclxuICAgIH0gZWxzZSBpZiAoIXJlc29sdmVkRGV2aWNlKSB7XHJcbiAgICAgIHBhdGggPSBwcm9jZXNzLmN3ZCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gV2luZG93cyBoYXMgdGhlIGNvbmNlcHQgb2YgZHJpdmUtc3BlY2lmaWMgY3VycmVudCB3b3JraW5nXHJcbiAgICAgIC8vIGRpcmVjdG9yaWVzLiBJZiB3ZSd2ZSByZXNvbHZlZCBhIGRyaXZlIGxldHRlciBidXQgbm90IHlldCBhblxyXG4gICAgICAvLyBhYnNvbHV0ZSBwYXRoLCBnZXQgY3dkIGZvciB0aGF0IGRyaXZlLiBXZSdyZSBzdXJlIHRoZSBkZXZpY2UgaXMgbm90XHJcbiAgICAgIC8vIGFuIHVuYyBwYXRoIGF0IHRoaXMgcG9pbnRzLCBiZWNhdXNlIHVuYyBwYXRocyBhcmUgYWx3YXlzIGFic29sdXRlLlxyXG4gICAgICBwYXRoID0gcHJvY2Vzcy5lbnZbJz0nICsgcmVzb2x2ZWREZXZpY2VdO1xyXG4gICAgICAvLyBWZXJpZnkgdGhhdCBhIGRyaXZlLWxvY2FsIGN3ZCB3YXMgZm91bmQgYW5kIHRoYXQgaXQgYWN0dWFsbHkgcG9pbnRzXHJcbiAgICAgIC8vIHRvIG91ciBkcml2ZS4gSWYgbm90LCBkZWZhdWx0IHRvIHRoZSBkcml2ZSdzIHJvb3QuXHJcbiAgICAgIGlmICghcGF0aCB8fCBwYXRoLnN1YnN0cigwLCAzKS50b0xvd2VyQ2FzZSgpICE9PVxyXG4gICAgICAgICAgcmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKSArICdcXFxcJykge1xyXG4gICAgICAgIHBhdGggPSByZXNvbHZlZERldmljZSArICdcXFxcJztcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXN1bHQgPSB3aW4zMlN0YXRQYXRoKHBhdGgpLFxyXG4gICAgICAgIGRldmljZSA9IHJlc3VsdC5kZXZpY2UsXHJcbiAgICAgICAgaXNVbmMgPSByZXN1bHQuaXNVbmMsXHJcbiAgICAgICAgaXNBYnNvbHV0ZSA9IHJlc3VsdC5pc0Fic29sdXRlLFxyXG4gICAgICAgIHRhaWwgPSByZXN1bHQudGFpbDtcclxuXHJcbiAgICBpZiAoZGV2aWNlICYmXHJcbiAgICAgICAgcmVzb2x2ZWREZXZpY2UgJiZcclxuICAgICAgICBkZXZpY2UudG9Mb3dlckNhc2UoKSAhPT0gcmVzb2x2ZWREZXZpY2UudG9Mb3dlckNhc2UoKSkge1xyXG4gICAgICAvLyBUaGlzIHBhdGggcG9pbnRzIHRvIGFub3RoZXIgZGV2aWNlIHNvIGl0IGlzIG5vdCBhcHBsaWNhYmxlXHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVzb2x2ZWREZXZpY2UpIHtcclxuICAgICAgcmVzb2x2ZWREZXZpY2UgPSBkZXZpY2U7XHJcbiAgICB9XHJcbiAgICBpZiAoIXJlc29sdmVkQWJzb2x1dGUpIHtcclxuICAgICAgcmVzb2x2ZWRUYWlsID0gdGFpbCArICdcXFxcJyArIHJlc29sdmVkVGFpbDtcclxuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHJlc29sdmVkRGV2aWNlICYmIHJlc29sdmVkQWJzb2x1dGUpIHtcclxuICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvLyBDb252ZXJ0IHNsYXNoZXMgdG8gYmFja3NsYXNoZXMgd2hlbiBgcmVzb2x2ZWREZXZpY2VgIHBvaW50cyB0byBhbiBVTkNcclxuICAvLyByb290LiBBbHNvIHNxdWFzaCBtdWx0aXBsZSBzbGFzaGVzIGludG8gYSBzaW5nbGUgb25lIHdoZXJlIGFwcHJvcHJpYXRlLlxyXG4gIGlmIChpc1VuYykge1xyXG4gICAgcmVzb2x2ZWREZXZpY2UgPSBub3JtYWxpemVVTkNSb290KHJlc29sdmVkRGV2aWNlKTtcclxuICB9XHJcblxyXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLFxyXG4gIC8vIGJ1dCBoYW5kbGUgcmVsYXRpdmUgcGF0aHMgdG8gYmUgc2FmZSAobWlnaHQgaGFwcGVuIHdoZW4gcHJvY2Vzcy5jd2QoKVxyXG4gIC8vIGZhaWxzKVxyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHRhaWwgcGF0aFxyXG4gIHJlc29sdmVkVGFpbCA9IG5vcm1hbGl6ZUFycmF5KHJlc29sdmVkVGFpbC5zcGxpdCgvW1xcXFxcXC9dKy8pLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICFyZXNvbHZlZEFic29sdXRlKS5qb2luKCdcXFxcJyk7XHJcblxyXG4gIHJldHVybiAocmVzb2x2ZWREZXZpY2UgKyAocmVzb2x2ZWRBYnNvbHV0ZSA/ICdcXFxcJyA6ICcnKSArIHJlc29sdmVkVGFpbCkgfHxcclxuICAgICAgICAgJy4nO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICB2YXIgcmVzdWx0ID0gd2luMzJTdGF0UGF0aChwYXRoKSxcclxuICAgICAgZGV2aWNlID0gcmVzdWx0LmRldmljZSxcclxuICAgICAgaXNVbmMgPSByZXN1bHQuaXNVbmMsXHJcbiAgICAgIGlzQWJzb2x1dGUgPSByZXN1bHQuaXNBYnNvbHV0ZSxcclxuICAgICAgdGFpbCA9IHJlc3VsdC50YWlsLFxyXG4gICAgICB0cmFpbGluZ1NsYXNoID0gL1tcXFxcXFwvXSQvLnRlc3QodGFpbCk7XHJcblxyXG4gIC8vIE5vcm1hbGl6ZSB0aGUgdGFpbCBwYXRoXHJcbiAgdGFpbCA9IG5vcm1hbGl6ZUFycmF5KHRhaWwuc3BsaXQoL1tcXFxcXFwvXSsvKSwgIWlzQWJzb2x1dGUpLmpvaW4oJ1xcXFwnKTtcclxuXHJcbiAgaWYgKCF0YWlsICYmICFpc0Fic29sdXRlKSB7XHJcbiAgICB0YWlsID0gJy4nO1xyXG4gIH1cclxuICBpZiAodGFpbCAmJiB0cmFpbGluZ1NsYXNoKSB7XHJcbiAgICB0YWlsICs9ICdcXFxcJztcclxuICB9XHJcblxyXG4gIC8vIENvbnZlcnQgc2xhc2hlcyB0byBiYWNrc2xhc2hlcyB3aGVuIGBkZXZpY2VgIHBvaW50cyB0byBhbiBVTkMgcm9vdC5cclxuICAvLyBBbHNvIHNxdWFzaCBtdWx0aXBsZSBzbGFzaGVzIGludG8gYSBzaW5nbGUgb25lIHdoZXJlIGFwcHJvcHJpYXRlLlxyXG4gIGlmIChpc1VuYykge1xyXG4gICAgZGV2aWNlID0gbm9ybWFsaXplVU5DUm9vdChkZXZpY2UpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGRldmljZSArIChpc0Fic29sdXRlID8gJ1xcXFwnIDogJycpICsgdGFpbDtcclxufTtcclxuXHJcblxyXG53aW4zMi5pc0Fic29sdXRlID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiB3aW4zMlN0YXRQYXRoKHBhdGgpLmlzQWJzb2x1dGU7XHJcbn07XHJcblxyXG53aW4zMi5qb2luID0gZnVuY3Rpb24oKSB7XHJcbiAgdmFyIHBhdGhzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBhcmcgPSBhcmd1bWVudHNbaV07XHJcbiAgICBpZiAoIXV0aWwuaXNTdHJpbmcoYXJnKSkge1xyXG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xyXG4gICAgfVxyXG4gICAgaWYgKGFyZykge1xyXG4gICAgICBwYXRocy5wdXNoKGFyZyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgam9pbmVkID0gcGF0aHMuam9pbignXFxcXCcpO1xyXG5cclxuICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgam9pbmVkIHBhdGggZG9lc24ndCBzdGFydCB3aXRoIHR3byBzbGFzaGVzLCBiZWNhdXNlXHJcbiAgLy8gbm9ybWFsaXplKCkgd2lsbCBtaXN0YWtlIGl0IGZvciBhbiBVTkMgcGF0aCB0aGVuLlxyXG4gIC8vXHJcbiAgLy8gVGhpcyBzdGVwIGlzIHNraXBwZWQgd2hlbiBpdCBpcyB2ZXJ5IGNsZWFyIHRoYXQgdGhlIHVzZXIgYWN0dWFsbHlcclxuICAvLyBpbnRlbmRlZCB0byBwb2ludCBhdCBhbiBVTkMgcGF0aC4gVGhpcyBpcyBhc3N1bWVkIHdoZW4gdGhlIGZpcnN0XHJcbiAgLy8gbm9uLWVtcHR5IHN0cmluZyBhcmd1bWVudHMgc3RhcnRzIHdpdGggZXhhY3RseSB0d28gc2xhc2hlcyBmb2xsb3dlZCBieVxyXG4gIC8vIGF0IGxlYXN0IG9uZSBtb3JlIG5vbi1zbGFzaCBjaGFyYWN0ZXIuXHJcbiAgLy9cclxuICAvLyBOb3RlIHRoYXQgZm9yIG5vcm1hbGl6ZSgpIHRvIHRyZWF0IGEgcGF0aCBhcyBhbiBVTkMgcGF0aCBpdCBuZWVkcyB0b1xyXG4gIC8vIGhhdmUgYXQgbGVhc3QgMiBjb21wb25lbnRzLCBzbyB3ZSBkb24ndCBmaWx0ZXIgZm9yIHRoYXQgaGVyZS5cclxuICAvLyBUaGlzIG1lYW5zIHRoYXQgdGhlIHVzZXIgY2FuIHVzZSBqb2luIHRvIGNvbnN0cnVjdCBVTkMgcGF0aHMgZnJvbVxyXG4gIC8vIGEgc2VydmVyIG5hbWUgYW5kIGEgc2hhcmUgbmFtZTsgZm9yIGV4YW1wbGU6XHJcbiAgLy8gICBwYXRoLmpvaW4oJy8vc2VydmVyJywgJ3NoYXJlJykgLT4gJ1xcXFxcXFxcc2VydmVyXFxcXHNoYXJlXFwnKVxyXG4gIGlmICghL15bXFxcXFxcL117Mn1bXlxcXFxcXC9dLy50ZXN0KHBhdGhzWzBdKSkge1xyXG4gICAgam9pbmVkID0gam9pbmVkLnJlcGxhY2UoL15bXFxcXFxcL117Mix9LywgJ1xcXFwnKTtcclxuICB9XHJcblxyXG4gIHJldHVybiB3aW4zMi5ub3JtYWxpemUoam9pbmVkKTtcclxufTtcclxuXHJcblxyXG4vLyBwYXRoLnJlbGF0aXZlKGZyb20sIHRvKVxyXG4vLyBpdCB3aWxsIHNvbHZlIHRoZSByZWxhdGl2ZSBwYXRoIGZyb20gJ2Zyb20nIHRvICd0bycsIGZvciBpbnN0YW5jZTpcclxuLy8gZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xyXG4vLyB0byA9ICdDOlxcXFxvcmFuZGVhXFxcXGltcGxcXFxcYmJiJ1xyXG4vLyBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcclxud2luMzIucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xyXG4gIGZyb20gPSB3aW4zMi5yZXNvbHZlKGZyb20pO1xyXG4gIHRvID0gd2luMzIucmVzb2x2ZSh0byk7XHJcblxyXG4gIC8vIHdpbmRvd3MgaXMgbm90IGNhc2Ugc2Vuc2l0aXZlXHJcbiAgdmFyIGxvd2VyRnJvbSA9IGZyb20udG9Mb3dlckNhc2UoKTtcclxuICB2YXIgbG93ZXJUbyA9IHRvLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gIHZhciB0b1BhcnRzID0gdHJpbUFycmF5KHRvLnNwbGl0KCdcXFxcJykpO1xyXG5cclxuICB2YXIgbG93ZXJGcm9tUGFydHMgPSB0cmltQXJyYXkobG93ZXJGcm9tLnNwbGl0KCdcXFxcJykpO1xyXG4gIHZhciBsb3dlclRvUGFydHMgPSB0cmltQXJyYXkobG93ZXJUby5zcGxpdCgnXFxcXCcpKTtcclxuXHJcbiAgdmFyIGxlbmd0aCA9IE1hdGgubWluKGxvd2VyRnJvbVBhcnRzLmxlbmd0aCwgbG93ZXJUb1BhcnRzLmxlbmd0aCk7XHJcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAobG93ZXJGcm9tUGFydHNbaV0gIT09IGxvd2VyVG9QYXJ0c1tpXSkge1xyXG4gICAgICBzYW1lUGFydHNMZW5ndGggPSBpO1xyXG4gICAgICBicmVhaztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGlmIChzYW1lUGFydHNMZW5ndGggPT0gMCkge1xyXG4gICAgcmV0dXJuIHRvO1xyXG4gIH1cclxuXHJcbiAgdmFyIG91dHB1dFBhcnRzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGxvd2VyRnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBvdXRwdXRQYXJ0cy5wdXNoKCcuLicpO1xyXG4gIH1cclxuXHJcbiAgb3V0cHV0UGFydHMgPSBvdXRwdXRQYXJ0cy5jb25jYXQodG9QYXJ0cy5zbGljZShzYW1lUGFydHNMZW5ndGgpKTtcclxuXHJcbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJ1xcXFwnKTtcclxufTtcclxuXHJcblxyXG53aW4zMi5fbWFrZUxvbmcgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgLy8gTm90ZTogdGhpcyB3aWxsICpwcm9iYWJseSogdGhyb3cgc29tZXdoZXJlLlxyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoKSlcclxuICAgIHJldHVybiBwYXRoO1xyXG5cclxuICBpZiAoIXBhdGgpIHtcclxuICAgIHJldHVybiAnJztcclxuICB9XHJcblxyXG4gIHZhciByZXNvbHZlZFBhdGggPSB3aW4zMi5yZXNvbHZlKHBhdGgpO1xyXG5cclxuICBpZiAoL15bYS16QS1aXVxcOlxcXFwvLnRlc3QocmVzb2x2ZWRQYXRoKSkge1xyXG4gICAgLy8gcGF0aCBpcyBsb2NhbCBmaWxlc3lzdGVtIHBhdGgsIHdoaWNoIG5lZWRzIHRvIGJlIGNvbnZlcnRlZFxyXG4gICAgLy8gdG8gbG9uZyBVTkMgcGF0aC5cclxuICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXCcgKyByZXNvbHZlZFBhdGg7XHJcbiAgfSBlbHNlIGlmICgvXlxcXFxcXFxcW14/Ll0vLnRlc3QocmVzb2x2ZWRQYXRoKSkge1xyXG4gICAgLy8gcGF0aCBpcyBuZXR3b3JrIFVOQyBwYXRoLCB3aGljaCBuZWVkcyB0byBiZSBjb252ZXJ0ZWRcclxuICAgIC8vIHRvIGxvbmcgVU5DIHBhdGguXHJcbiAgICByZXR1cm4gJ1xcXFxcXFxcP1xcXFxVTkNcXFxcJyArIHJlc29sdmVkUGF0aC5zdWJzdHJpbmcoMik7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcGF0aDtcclxufTtcclxuXHJcblxyXG53aW4zMi5kaXJuYW1lID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHZhciByZXN1bHQgPSB3aW4zMlNwbGl0UGF0aChwYXRoKSxcclxuICAgICAgcm9vdCA9IHJlc3VsdFswXSxcclxuICAgICAgZGlyID0gcmVzdWx0WzFdO1xyXG5cclxuICBpZiAoIXJvb3QgJiYgIWRpcikge1xyXG4gICAgLy8gTm8gZGlybmFtZSB3aGF0c29ldmVyXHJcbiAgICByZXR1cm4gJy4nO1xyXG4gIH1cclxuXHJcbiAgaWYgKGRpcikge1xyXG4gICAgLy8gSXQgaGFzIGEgZGlybmFtZSwgc3RyaXAgdHJhaWxpbmcgc2xhc2hcclxuICAgIGRpciA9IGRpci5zdWJzdHIoMCwgZGlyLmxlbmd0aCAtIDEpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHJvb3QgKyBkaXI7XHJcbn07XHJcblxyXG5cclxud2luMzIuYmFzZW5hbWUgPSBmdW5jdGlvbihwYXRoLCBleHQpIHtcclxuICB2YXIgZiA9IHdpbjMyU3BsaXRQYXRoKHBhdGgpWzJdO1xyXG4gIC8vIFRPRE86IG1ha2UgdGhpcyBjb21wYXJpc29uIGNhc2UtaW5zZW5zaXRpdmUgb24gd2luZG93cz9cclxuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xyXG4gICAgZiA9IGYuc3Vic3RyKDAsIGYubGVuZ3RoIC0gZXh0Lmxlbmd0aCk7XHJcbiAgfVxyXG4gIHJldHVybiBmO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgcmV0dXJuIHdpbjMyU3BsaXRQYXRoKHBhdGgpWzNdO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLmZvcm1hdCA9IGZ1bmN0aW9uKHBhdGhPYmplY3QpIHtcclxuICBpZiAoIXV0aWwuaXNPYmplY3QocGF0aE9iamVjdCkpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXHJcbiAgICAgICAgXCJQYXJhbWV0ZXIgJ3BhdGhPYmplY3QnIG11c3QgYmUgYW4gb2JqZWN0LCBub3QgXCIgKyB0eXBlb2YgcGF0aE9iamVjdFxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHZhciByb290ID0gcGF0aE9iamVjdC5yb290IHx8ICcnO1xyXG5cclxuICBpZiAoIXV0aWwuaXNTdHJpbmcocm9vdCkpIHtcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXHJcbiAgICAgICAgXCIncGF0aE9iamVjdC5yb290JyBtdXN0IGJlIGEgc3RyaW5nIG9yIHVuZGVmaW5lZCwgbm90IFwiICtcclxuICAgICAgICB0eXBlb2YgcGF0aE9iamVjdC5yb290XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRpciA9IHBhdGhPYmplY3QuZGlyO1xyXG4gIHZhciBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8ICcnO1xyXG4gIGlmICghZGlyKSB7XHJcbiAgICByZXR1cm4gYmFzZTtcclxuICB9XHJcbiAgaWYgKGRpcltkaXIubGVuZ3RoIC0gMV0gPT09IHdpbjMyLnNlcCkge1xyXG4gICAgcmV0dXJuIGRpciArIGJhc2U7XHJcbiAgfVxyXG4gIHJldHVybiBkaXIgKyB3aW4zMi5zZXAgKyBiYXNlO1xyXG59O1xyXG5cclxuXHJcbndpbjMyLnBhcnNlID0gZnVuY3Rpb24ocGF0aFN0cmluZykge1xyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoU3RyaW5nKSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aFN0cmluZycgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHBhdGhTdHJpbmdcclxuICAgICk7XHJcbiAgfVxyXG4gIHZhciBhbGxQYXJ0cyA9IHdpbjMyU3BsaXRQYXRoKHBhdGhTdHJpbmcpO1xyXG4gIGlmICghYWxsUGFydHMgfHwgYWxsUGFydHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBwYXRoICdcIiArIHBhdGhTdHJpbmcgKyBcIidcIik7XHJcbiAgfVxyXG4gIHJldHVybiB7XHJcbiAgICByb290OiBhbGxQYXJ0c1swXSxcclxuICAgIGRpcjogYWxsUGFydHNbMF0gKyBhbGxQYXJ0c1sxXS5zbGljZSgwLCAtMSksXHJcbiAgICBiYXNlOiBhbGxQYXJ0c1syXSxcclxuICAgIGV4dDogYWxsUGFydHNbM10sXHJcbiAgICBuYW1lOiBhbGxQYXJ0c1syXS5zbGljZSgwLCBhbGxQYXJ0c1syXS5sZW5ndGggLSBhbGxQYXJ0c1szXS5sZW5ndGgpXHJcbiAgfTtcclxufTtcclxuXHJcblxyXG53aW4zMi5zZXAgPSAnXFxcXCc7XHJcbndpbjMyLmRlbGltaXRlciA9ICc7JztcclxuXHJcblxyXG4vLyBTcGxpdCBhIGZpbGVuYW1lIGludG8gW3Jvb3QsIGRpciwgYmFzZW5hbWUsIGV4dF0sIHVuaXggdmVyc2lvblxyXG4vLyAncm9vdCcgaXMganVzdCBhIHNsYXNoLCBvciBub3RoaW5nLlxyXG52YXIgc3BsaXRQYXRoUmUgPVxyXG4gICAgL14oXFwvP3wpKFtcXHNcXFNdKj8pKCg/OlxcLnsxLDJ9fFteXFwvXSs/fCkoXFwuW14uXFwvXSp8KSkoPzpbXFwvXSopJC87XHJcbnZhciBwb3NpeCA9IHt9O1xyXG5cclxuXHJcbmZ1bmN0aW9uIHBvc2l4U3BsaXRQYXRoKGZpbGVuYW1lKSB7XHJcbiAgcmV0dXJuIHNwbGl0UGF0aFJlLmV4ZWMoZmlsZW5hbWUpLnNsaWNlKDEpO1xyXG59XHJcblxyXG5cclxuLy8gcGF0aC5yZXNvbHZlKFtmcm9tIC4uLl0sIHRvKVxyXG4vLyBwb3NpeCB2ZXJzaW9uXHJcbnBvc2l4LnJlc29sdmUgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXHJcbiAgICAgIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcclxuXHJcbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcclxuICAgIHZhciBwYXRoID0gKGkgPj0gMCkgPyBhcmd1bWVudHNbaV0gOiBwcm9jZXNzLmN3ZCgpO1xyXG5cclxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHBhdGgpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9IGVsc2UgaWYgKCFwYXRoKSB7XHJcbiAgICAgIGNvbnRpbnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XHJcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aFswXSA9PT0gJy8nO1xyXG4gIH1cclxuXHJcbiAgLy8gQXQgdGhpcyBwb2ludCB0aGUgcGF0aCBzaG91bGQgYmUgcmVzb2x2ZWQgdG8gYSBmdWxsIGFic29sdXRlIHBhdGgsIGJ1dFxyXG4gIC8vIGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpIGZhaWxzKVxyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcclxuICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVBcnJheShyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xyXG5cclxuICByZXR1cm4gKChyZXNvbHZlZEFic29sdXRlID8gJy8nIDogJycpICsgcmVzb2x2ZWRQYXRoKSB8fCAnLic7XHJcbn07XHJcblxyXG4vLyBwYXRoLm5vcm1hbGl6ZShwYXRoKVxyXG4vLyBwb3NpeCB2ZXJzaW9uXHJcbnBvc2l4Lm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICB2YXIgaXNBYnNvbHV0ZSA9IHBvc2l4LmlzQWJzb2x1dGUocGF0aCksXHJcbiAgICAgIHRyYWlsaW5nU2xhc2ggPSBwYXRoICYmIHBhdGhbcGF0aC5sZW5ndGggLSAxXSA9PT0gJy8nO1xyXG5cclxuICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcclxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkocGF0aC5zcGxpdCgnLycpLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xyXG5cclxuICBpZiAoIXBhdGggJiYgIWlzQWJzb2x1dGUpIHtcclxuICAgIHBhdGggPSAnLic7XHJcbiAgfVxyXG4gIGlmIChwYXRoICYmIHRyYWlsaW5nU2xhc2gpIHtcclxuICAgIHBhdGggKz0gJy8nO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcclxufTtcclxuXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXguaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICByZXR1cm4gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcclxufTtcclxuXHJcbi8vIHBvc2l4IHZlcnNpb25cclxucG9zaXguam9pbiA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBwYXRoID0gJyc7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBzZWdtZW50ID0gYXJndW1lbnRzW2ldO1xyXG4gICAgaWYgKCF1dGlsLmlzU3RyaW5nKHNlZ21lbnQpKSB7XHJcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLmpvaW4gbXVzdCBiZSBzdHJpbmdzJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoc2VnbWVudCkge1xyXG4gICAgICBpZiAoIXBhdGgpIHtcclxuICAgICAgICBwYXRoICs9IHNlZ21lbnQ7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcGF0aCArPSAnLycgKyBzZWdtZW50O1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBwb3NpeC5ub3JtYWxpemUocGF0aCk7XHJcbn07XHJcblxyXG5cclxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcclxuLy8gcG9zaXggdmVyc2lvblxyXG5wb3NpeC5yZWxhdGl2ZSA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XHJcbiAgZnJvbSA9IHBvc2l4LnJlc29sdmUoZnJvbSkuc3Vic3RyKDEpO1xyXG4gIHRvID0gcG9zaXgucmVzb2x2ZSh0bykuc3Vic3RyKDEpO1xyXG5cclxuICB2YXIgZnJvbVBhcnRzID0gdHJpbUFycmF5KGZyb20uc3BsaXQoJy8nKSk7XHJcbiAgdmFyIHRvUGFydHMgPSB0cmltQXJyYXkodG8uc3BsaXQoJy8nKSk7XHJcblxyXG4gIHZhciBsZW5ndGggPSBNYXRoLm1pbihmcm9tUGFydHMubGVuZ3RoLCB0b1BhcnRzLmxlbmd0aCk7XHJcbiAgdmFyIHNhbWVQYXJ0c0xlbmd0aCA9IGxlbmd0aDtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcbiAgICBpZiAoZnJvbVBhcnRzW2ldICE9PSB0b1BhcnRzW2ldKSB7XHJcbiAgICAgIHNhbWVQYXJ0c0xlbmd0aCA9IGk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIG91dHB1dFBhcnRzID0gW107XHJcbiAgZm9yICh2YXIgaSA9IHNhbWVQYXJ0c0xlbmd0aDsgaSA8IGZyb21QYXJ0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcclxuICB9XHJcblxyXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XHJcblxyXG4gIHJldHVybiBvdXRwdXRQYXJ0cy5qb2luKCcvJyk7XHJcbn07XHJcblxyXG5cclxucG9zaXguX21ha2VMb25nID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gIHJldHVybiBwYXRoO1xyXG59O1xyXG5cclxuXHJcbnBvc2l4LmRpcm5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XHJcbiAgdmFyIHJlc3VsdCA9IHBvc2l4U3BsaXRQYXRoKHBhdGgpLFxyXG4gICAgICByb290ID0gcmVzdWx0WzBdLFxyXG4gICAgICBkaXIgPSByZXN1bHRbMV07XHJcblxyXG4gIGlmICghcm9vdCAmJiAhZGlyKSB7XHJcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcclxuICAgIHJldHVybiAnLic7XHJcbiAgfVxyXG5cclxuICBpZiAoZGlyKSB7XHJcbiAgICAvLyBJdCBoYXMgYSBkaXJuYW1lLCBzdHJpcCB0cmFpbGluZyBzbGFzaFxyXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gcm9vdCArIGRpcjtcclxufTtcclxuXHJcblxyXG5wb3NpeC5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xyXG4gIHZhciBmID0gcG9zaXhTcGxpdFBhdGgocGF0aClbMl07XHJcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xyXG4gIGlmIChleHQgJiYgZi5zdWJzdHIoLTEgKiBleHQubGVuZ3RoKSA9PT0gZXh0KSB7XHJcbiAgICBmID0gZi5zdWJzdHIoMCwgZi5sZW5ndGggLSBleHQubGVuZ3RoKTtcclxuICB9XHJcbiAgcmV0dXJuIGY7XHJcbn07XHJcblxyXG5cclxucG9zaXguZXh0bmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcclxuICByZXR1cm4gcG9zaXhTcGxpdFBhdGgocGF0aClbM107XHJcbn07XHJcblxyXG5cclxucG9zaXguZm9ybWF0ID0gZnVuY3Rpb24ocGF0aE9iamVjdCkge1xyXG4gIGlmICghdXRpbC5pc09iamVjdChwYXRoT2JqZWN0KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aE9iamVjdCcgbXVzdCBiZSBhbiBvYmplY3QsIG5vdCBcIiArIHR5cGVvZiBwYXRoT2JqZWN0XHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgdmFyIHJvb3QgPSBwYXRoT2JqZWN0LnJvb3QgfHwgJyc7XHJcblxyXG4gIGlmICghdXRpbC5pc1N0cmluZyhyb290KSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIidwYXRoT2JqZWN0LnJvb3QnIG11c3QgYmUgYSBzdHJpbmcgb3IgdW5kZWZpbmVkLCBub3QgXCIgK1xyXG4gICAgICAgIHR5cGVvZiBwYXRoT2JqZWN0LnJvb3RcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICB2YXIgZGlyID0gcGF0aE9iamVjdC5kaXIgPyBwYXRoT2JqZWN0LmRpciArIHBvc2l4LnNlcCA6ICcnO1xyXG4gIHZhciBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8ICcnO1xyXG4gIHJldHVybiBkaXIgKyBiYXNlO1xyXG59O1xyXG5cclxuXHJcbnBvc2l4LnBhcnNlID0gZnVuY3Rpb24ocGF0aFN0cmluZykge1xyXG4gIGlmICghdXRpbC5pc1N0cmluZyhwYXRoU3RyaW5nKSkge1xyXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcclxuICAgICAgICBcIlBhcmFtZXRlciAncGF0aFN0cmluZycgbXVzdCBiZSBhIHN0cmluZywgbm90IFwiICsgdHlwZW9mIHBhdGhTdHJpbmdcclxuICAgICk7XHJcbiAgfVxyXG4gIHZhciBhbGxQYXJ0cyA9IHBvc2l4U3BsaXRQYXRoKHBhdGhTdHJpbmcpO1xyXG4gIGlmICghYWxsUGFydHMgfHwgYWxsUGFydHMubGVuZ3RoICE9PSA0KSB7XHJcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBwYXRoICdcIiArIHBhdGhTdHJpbmcgKyBcIidcIik7XHJcbiAgfVxyXG4gIGFsbFBhcnRzWzFdID0gYWxsUGFydHNbMV0gfHwgJyc7XHJcbiAgYWxsUGFydHNbMl0gPSBhbGxQYXJ0c1syXSB8fCAnJztcclxuICBhbGxQYXJ0c1szXSA9IGFsbFBhcnRzWzNdIHx8ICcnO1xyXG5cclxuICByZXR1cm4ge1xyXG4gICAgcm9vdDogYWxsUGFydHNbMF0sXHJcbiAgICBkaXI6IGFsbFBhcnRzWzBdICsgYWxsUGFydHNbMV0uc2xpY2UoMCwgLTEpLFxyXG4gICAgYmFzZTogYWxsUGFydHNbMl0sXHJcbiAgICBleHQ6IGFsbFBhcnRzWzNdLFxyXG4gICAgbmFtZTogYWxsUGFydHNbMl0uc2xpY2UoMCwgYWxsUGFydHNbMl0ubGVuZ3RoIC0gYWxsUGFydHNbM10ubGVuZ3RoKVxyXG4gIH07XHJcbn07XHJcblxyXG5cclxucG9zaXguc2VwID0gJy8nO1xyXG5wb3NpeC5kZWxpbWl0ZXIgPSAnOic7XHJcblxyXG5cclxuaWYgKGlzV2luZG93cylcclxuICBtb2R1bGUuZXhwb3J0cyA9IHdpbjMyO1xyXG5lbHNlIC8qIHBvc2l4ICovXHJcbiAgbW9kdWxlLmV4cG9ydHMgPSBwb3NpeDtcclxuXHJcbm1vZHVsZS5leHBvcnRzLnBvc2l4ID0gcG9zaXg7XHJcbm1vZHVsZS5leHBvcnRzLndpbjMyID0gd2luMzI7XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vbm9kZV9tb2R1bGVzL3BhdGgvcGF0aC5qc1xuLy8gbW9kdWxlIGlkID0gMlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJ1dGlsXCIpO1xuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIGV4dGVybmFsIFwidXRpbFwiXG4vLyBtb2R1bGUgaWQgPSAzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImV4cG9ydCBjb25zdCBpc01hYyA9ICgpOiBib29sZWFuID0+IHtcbiAgaWYocHJvY2Vzc1xuICAmJiB0eXBlb2YgcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3N0cmluZydcbiAgJiYgcHJvY2Vzcy5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpID09PSAnZGFyd2luJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCdcbiAgJiYgdHlwZW9mIG5hdmlnYXRvci5wbGF0Zm9ybSA9PT0gJ3N0cmluZydcbiAgJiYgbmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignbWFjJykgPiAtMSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxuZXhwb3J0IGNvbnN0IGlzUGMgPSAoKTogYm9vbGVhbiA9PiB7XG4gIGlmKHByb2Nlc3NcbiAgJiYgdHlwZW9mIHByb2Nlc3MucGxhdGZvcm0gPT09ICdzdHJpbmcnXG4gICYmIHByb2Nlc3MucGxhdGZvcm0udG9Mb3dlckNhc2UoKSA9PT0gJ3dpbjMyJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYodHlwZW9mIG5hdmlnYXRvciAhPT0gJ3VuZGVmaW5lZCdcbiAgICAmJiB0eXBlb2YgbmF2aWdhdG9yLnBsYXRmb3JtID09PSAnc3RyaW5nJ1xuICAgICYmIG5hdmlnYXRvci5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3dpbicpID4gLTEpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbmV4cG9ydCBjb25zdCBpc0Jyb3dzZXIgPSAoKTogYm9vbGVhbiA9PiB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJztcbn07XG5cbmV4cG9ydCBjb25zdCBpc05vZGUgPSAoKTogYm9vbGVhbiA9PiB7XG4gIHJldHVybiB0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCc7XG59O1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vbGliL3BsYXRmb3JtLnRzIiwiZXhwb3J0IGNvbnN0IG5vb3AgPSAoZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgdGhyb3cgJ21ldGhvZCB1bnN1cHBvcnRlZCBpbiBpc29tb3JwaGljLXBhdGgnO1xufTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL2xpYi9ub29wLnRzIl0sInNvdXJjZVJvb3QiOiIifQ==

/***/ }),
/* 100 */
/***/ (function(module, exports, __webpack_require__) {

var encode = __webpack_require__(203),
    decode = __webpack_require__(202);

module.exports = {
  encode: encode,
  decode: decode
};


/***/ }),
/* 101 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),
/* 102 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const PNG = __webpack_require__(112).PNG;

module.exports = (buf, opts) => {
	if (!Buffer.isBuffer(buf)) {
		return Promise.reject(new TypeError('Expected a buffer'));
	}

	return new Promise((resolve, reject) => {
		let png = new PNG(opts);

		png.on('metadata', data => {
			png = Object.assign(png, data);
		});

		png.on('error', reject);
		png.on('parsed', () => resolve(png));

		png.end(buf);
	});
};


/***/ }),
/* 103 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var interlaceUtils = __webpack_require__(108);

var pixelBppMap = {
  1: { // L
    0: 0,
    1: 0,
    2: 0,
    3: 0xff
  },
  2: { // LA
    0: 0,
    1: 0,
    2: 0,
    3: 1
  },
  3: { // RGB
    0: 0,
    1: 1,
    2: 2,
    3: 0xff
  },
  4: { // RGBA
    0: 0,
    1: 1,
    2: 2,
    3: 3
  }
};

function bitRetriever(data, depth) {

  var leftOver = [];
  var i = 0;

  function split() {
    if (i === data.length) {
      throw new Error('Ran out of data');
    }
    var byte = data[i];
    i++;
    var byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
    switch (depth) {
      default:
        throw new Error('unrecognised depth');
      case 16:
        byte2 = data[i];
        i++;
        leftOver.push(((byte << 8) + byte2));
        break;
      case 4:
        byte2 = byte & 0x0f;
        byte1 = byte >> 4;
        leftOver.push(byte1, byte2);
        break;
      case 2:
        byte4 = byte & 3;
        byte3 = byte >> 2 & 3;
        byte2 = byte >> 4 & 3;
        byte1 = byte >> 6 & 3;
        leftOver.push(byte1, byte2, byte3, byte4);
        break;
      case 1:
        byte8 = byte & 1;
        byte7 = byte >> 1 & 1;
        byte6 = byte >> 2 & 1;
        byte5 = byte >> 3 & 1;
        byte4 = byte >> 4 & 1;
        byte3 = byte >> 5 & 1;
        byte2 = byte >> 6 & 1;
        byte1 = byte >> 7 & 1;
        leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
        break;
    }
  }

  return {
    get: function(count) {
      while (leftOver.length < count) {
        split();
      }
      var returner = leftOver.slice(0, count);
      leftOver = leftOver.slice(count);
      return returner;
    },
    resetAfterLine: function() {
      leftOver.length = 0;
    },
    end: function() {
      if (i !== data.length) {
        throw new Error('extra data found');
      }
    }
  };
}

function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) { // eslint-disable-line max-params
  var imageWidth = image.width;
  var imageHeight = image.height;
  var imagePass = image.index;
  for (var y = 0; y < imageHeight; y++) {
    for (var x = 0; x < imageWidth; x++) {
      var pxPos = getPxPos(x, y, imagePass);

      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[bpp][i];
        if (idx === 0xff) {
          pxData[pxPos + i] = 0xff;
        } else {
          var dataPos = idx + rawPos;
          if (dataPos === data.length) {
            throw new Error('Ran out of data');
          }
          pxData[pxPos + i] = data[dataPos];
        }
      }
      rawPos += bpp; //eslint-disable-line no-param-reassign
    }
  }
  return rawPos;
}

function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) { // eslint-disable-line max-params
  var imageWidth = image.width;
  var imageHeight = image.height;
  var imagePass = image.index;
  for (var y = 0; y < imageHeight; y++) {
    for (var x = 0; x < imageWidth; x++) {
      var pixelData = bits.get(bpp);
      var pxPos = getPxPos(x, y, imagePass);

      for (var i = 0; i < 4; i++) {
        var idx = pixelBppMap[bpp][i];
        pxData[pxPos + i] = idx !== 0xff ? pixelData[idx] : maxBit;
      }
    }
    bits.resetAfterLine();
  }
}

exports.dataToBitMap = function(data, bitmapInfo) {

  var width = bitmapInfo.width;
  var height = bitmapInfo.height;
  var depth = bitmapInfo.depth;
  var bpp = bitmapInfo.bpp;
  var interlace = bitmapInfo.interlace;

  if (depth !== 8) {
    var bits = bitRetriever(data, depth);
  }
  var pxData;
  if (depth <= 8) {
    pxData = new Buffer(width * height * 4);
  }
  else {
    pxData = new Uint16Array(width * height * 4);
  }
  var maxBit = Math.pow(2, depth) - 1;
  var rawPos = 0;
  var images;
  var getPxPos;

  if (interlace) {
    images = interlaceUtils.getImagePasses(width, height);
    getPxPos = interlaceUtils.getInterlaceIterator(width, height);
  }
  else {
    var nonInterlacedPxPos = 0;
    getPxPos = function() {
      var returner = nonInterlacedPxPos;
      nonInterlacedPxPos += 4;
      return returner;
    };
    images = [{ width: width, height: height }];
  }

  for (var imageIndex = 0; imageIndex < images.length; imageIndex++) {
    if (depth === 8) {
      rawPos = mapImage8Bit(images[imageIndex], pxData, getPxPos, bpp, data, rawPos);
    }
    else {
      mapImageCustomBit(images[imageIndex], pxData, getPxPos, bpp, bits, maxBit);
    }
  }
  if (depth === 8) {
    if (rawPos !== data.length) {
      throw new Error('extra data found');
    }
  }
  else {
    bits.end();
  }

  return pxData;
};


/***/ }),
/* 104 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



var util = __webpack_require__(7);
var Stream = __webpack_require__(19);


var ChunkStream = module.exports = function() {
  Stream.call(this);

  this._buffers = [];
  this._buffered = 0;

  this._reads = [];
  this._paused = false;

  this._encoding = 'utf8';
  this.writable = true;
};
util.inherits(ChunkStream, Stream);


ChunkStream.prototype.read = function(length, callback) {

  this._reads.push({
    length: Math.abs(length),  // if length < 0 then at most this length
    allowLess: length < 0,
    func: callback
  });

  process.nextTick(function() {
    this._process();

    // its paused and there is not enought data then ask for more
    if (this._paused && this._reads.length > 0) {
      this._paused = false;

      this.emit('drain');
    }
  }.bind(this));
};

ChunkStream.prototype.write = function(data, encoding) {

  if (!this.writable) {
    this.emit('error', new Error('Stream not writable'));
    return false;
  }

  var dataBuffer;
  if (Buffer.isBuffer(data)) {
    dataBuffer = data;
  }
  else {
    dataBuffer = new Buffer(data, encoding || this._encoding);
  }

  this._buffers.push(dataBuffer);
  this._buffered += dataBuffer.length;

  this._process();

  // ok if there are no more read requests
  if (this._reads && this._reads.length === 0) {
    this._paused = true;
  }

  return this.writable && !this._paused;
};

ChunkStream.prototype.end = function(data, encoding) {

  if (data) {
    this.write(data, encoding);
  }

  this.writable = false;

  // already destroyed
  if (!this._buffers) {
    return;
  }

  // enqueue or handle end
  if (this._buffers.length === 0) {
    this._end();
  }
  else {
    this._buffers.push(null);
    this._process();
  }
};

ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;

ChunkStream.prototype._end = function() {

  if (this._reads.length > 0) {
    this.emit('error',
      new Error('There are some read requests waiting on finished stream')
    );
  }

  this.destroy();
};

ChunkStream.prototype.destroy = function() {

  if (!this._buffers) {
    return;
  }

  this.writable = false;
  this._reads = null;
  this._buffers = null;

  this.emit('close');
};

ChunkStream.prototype._processReadAllowingLess = function(read) {
  // ok there is any data so that we can satisfy this request
  this._reads.shift(); // == read

  // first we need to peek into first buffer
  var smallerBuf = this._buffers[0];

  // ok there is more data than we need
  if (smallerBuf.length > read.length) {

    this._buffered -= read.length;
    this._buffers[0] = smallerBuf.slice(read.length);

    read.func.call(this, smallerBuf.slice(0, read.length));

  }
  else {
    // ok this is less than maximum length so use it all
    this._buffered -= smallerBuf.length;
    this._buffers.shift(); // == smallerBuf

    read.func.call(this, smallerBuf);
  }
};

ChunkStream.prototype._processRead = function(read) {
  this._reads.shift(); // == read

  var pos = 0;
  var count = 0;
  var data = new Buffer(read.length);

  // create buffer for all data
  while (pos < read.length) {

    var buf = this._buffers[count++];
    var len = Math.min(buf.length, read.length - pos);

    buf.copy(data, pos, 0, len);
    pos += len;

    // last buffer wasn't used all so just slice it and leave
    if (len !== buf.length) {
      this._buffers[--count] = buf.slice(len);
    }
  }

  // remove all used buffers
  if (count > 0) {
    this._buffers.splice(0, count);
  }

  this._buffered -= read.length;

  read.func.call(this, data);
};

ChunkStream.prototype._process = function() {

  try {
    // as long as there is any data and read requests
    while (this._buffered > 0 && this._reads && this._reads.length > 0) {

      var read = this._reads[0];

      // read any data (but no more than length)
      if (read.allowLess) {
        this._processReadAllowingLess(read);

      }
      else if (this._buffered >= read.length) {
        // ok we can meet some expectations

        this._processRead(read);
      }
      else {
        // not enought data to satisfy first request in queue
        // so we need to wait for more
        break;
      }
    }

    if (this._buffers && this._buffers.length > 0 && this._buffers[0] === null) {
      this._end();
    }
  }
  catch (ex) {
    this.emit('error', ex);
  }
};


/***/ }),
/* 105 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var crcTable = [];

(function() {
  for (var i = 0; i < 256; i++) {
    var currentCrc = i;
    for (var j = 0; j < 8; j++) {
      if (currentCrc & 1) {
        currentCrc = 0xedb88320 ^ (currentCrc >>> 1);
      }
      else {
        currentCrc = currentCrc >>> 1;
      }
    }
    crcTable[i] = currentCrc;
  }
}());

var CrcCalculator = module.exports = function() {
  this._crc = -1;
};

CrcCalculator.prototype.write = function(data) {

  for (var i = 0; i < data.length; i++) {
    this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ (this._crc >>> 8);
  }
  return true;
};

CrcCalculator.prototype.crc32 = function() {
  return this._crc ^ -1;
};


CrcCalculator.crc32 = function(buf) {

  var crc = -1;
  for (var i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
};


/***/ }),
/* 106 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var interlaceUtils = __webpack_require__(108);
var paethPredictor = __webpack_require__(110);

function getByteWidth(width, bpp, depth) {
  var byteWidth = width * bpp;
  if (depth !== 8) {
    byteWidth = Math.ceil(byteWidth / (8 / depth));
  }
  return byteWidth;
}

var Filter = module.exports = function(bitmapInfo, dependencies) {

  var width = bitmapInfo.width;
  var height = bitmapInfo.height;
  var interlace = bitmapInfo.interlace;
  var bpp = bitmapInfo.bpp;
  var depth = bitmapInfo.depth;

  this.read = dependencies.read;
  this.write = dependencies.write;
  this.complete = dependencies.complete;

  this._imageIndex = 0;
  this._images = [];
  if (interlace) {
    var passes = interlaceUtils.getImagePasses(width, height);
    for (var i = 0; i < passes.length; i++) {
      this._images.push({
        byteWidth: getByteWidth(passes[i].width, bpp, depth),
        height: passes[i].height,
        lineIndex: 0
      });
    }
  }
  else {
    this._images.push({
      byteWidth: getByteWidth(width, bpp, depth),
      height: height,
      lineIndex: 0
    });
  }

  // when filtering the line we look at the pixel to the left
  // the spec also says it is done on a byte level regardless of the number of pixels
  // so if the depth is byte compatible (8 or 16) we subtract the bpp in order to compare back
  // a pixel rather than just a different byte part. However if we are sub byte, we ignore.
  if (depth === 8) {
    this._xComparison = bpp;
  }
  else if (depth === 16) {
    this._xComparison = bpp * 2;
  }
  else {
    this._xComparison = 1;
  }
};

Filter.prototype.start = function() {
  this.read(this._images[this._imageIndex].byteWidth + 1, this._reverseFilterLine.bind(this));
};

Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    unfilteredLine[x] = rawByte + f1Left;
  }
};

Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {

  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f2Up = lastLine ? lastLine[x] : 0;
    unfilteredLine[x] = rawByte + f2Up;
  }
};

Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;
  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f3Up = lastLine ? lastLine[x] : 0;
    var f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    var f3Add = Math.floor((f3Left + f3Up) / 2);
    unfilteredLine[x] = rawByte + f3Add;
  }
};

Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {

  var xComparison = this._xComparison;
  var xBiggerThan = xComparison - 1;
  var lastLine = this._lastLine;

  for (var x = 0; x < byteWidth; x++) {
    var rawByte = rawData[1 + x];
    var f4Up = lastLine ? lastLine[x] : 0;
    var f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
    var f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
    var f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
    unfilteredLine[x] = rawByte + f4Add;
  }
};

Filter.prototype._reverseFilterLine = function(rawData) {

  var filter = rawData[0];
  var unfilteredLine;
  var currentImage = this._images[this._imageIndex];
  var byteWidth = currentImage.byteWidth;

  if (filter === 0) {
    unfilteredLine = rawData.slice(1, byteWidth + 1);
  }
  else {

    unfilteredLine = new Buffer(byteWidth);

    switch (filter) {
      case 1:
        this._unFilterType1(rawData, unfilteredLine, byteWidth);
        break;
      case 2:
        this._unFilterType2(rawData, unfilteredLine, byteWidth);
        break;
      case 3:
        this._unFilterType3(rawData, unfilteredLine, byteWidth);
        break;
      case 4:
        this._unFilterType4(rawData, unfilteredLine, byteWidth);
        break;
      default:
        throw new Error('Unrecognised filter type - ' + filter);
    }
  }

  this.write(unfilteredLine);

  currentImage.lineIndex++;
  if (currentImage.lineIndex >= currentImage.height) {
    this._lastLine = null;
    this._imageIndex++;
    currentImage = this._images[this._imageIndex];
  }
  else {
    this._lastLine = unfilteredLine;
  }

  if (currentImage) {
    // read, using the byte width that may be from the new current image
    this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
  }
  else {
    this._lastLine = null;
    this.complete();
  }
};


/***/ }),
/* 107 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function dePalette(indata, outdata, width, height, palette) {
  var pxPos = 0;
  // use values from palette
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var color = palette[indata[pxPos]];

      if (!color) {
        throw new Error('index ' + indata[pxPos] + ' not in palette');
      }

      for (var i = 0; i < 4; i++) {
        outdata[pxPos + i] = color[i];
      }
      pxPos += 4;
    }
  }
}

function replaceTransparentColor(indata, outdata, width, height, transColor) {
  var pxPos = 0;
  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var makeTrans = false;

      if (transColor.length === 1) {
        if (transColor[0] === indata[pxPos]) {
          makeTrans = true;
        }
      }
      else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
        makeTrans = true;
      }
      if (makeTrans) {
        for (var i = 0; i < 4; i++) {
          outdata[pxPos + i] = 0;
        }
      }
      pxPos += 4;
    }
  }
}

function scaleDepth(indata, outdata, width, height, depth) {
  var maxOutSample = 255;
  var maxInSample = Math.pow(2, depth) - 1;
  var pxPos = 0;

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      for (var i = 0; i < 4; i++) {
        outdata[pxPos + i] = Math.floor((indata[pxPos + i] * maxOutSample) / maxInSample + 0.5);
      }
      pxPos += 4;
    }
  }
}

module.exports = function(indata, imageData) {

  var depth = imageData.depth;
  var width = imageData.width;
  var height = imageData.height;
  var colorType = imageData.colorType;
  var transColor = imageData.transColor;
  var palette = imageData.palette;

  var outdata = indata; // only different for 16 bits

  if (colorType === 3) { // paletted
    dePalette(indata, outdata, width, height, palette);
  }
  else {
    if (transColor) {
      replaceTransparentColor(indata, outdata, width, height, transColor);
    }
    // if it needs scaling
    if (depth !== 8) {
      // if we need to change the buffer size
      if (depth === 16) {
        outdata = new Buffer(width * height * 4);
      }
      scaleDepth(indata, outdata, width, height, depth);
    }
  }
  return outdata;
};


/***/ }),
/* 108 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Adam 7
//   0 1 2 3 4 5 6 7
// 0 x 6 4 6 x 6 4 6
// 1 7 7 7 7 7 7 7 7
// 2 5 6 5 6 5 6 5 6
// 3 7 7 7 7 7 7 7 7
// 4 3 6 4 6 3 6 4 6
// 5 7 7 7 7 7 7 7 7
// 6 5 6 5 6 5 6 5 6
// 7 7 7 7 7 7 7 7 7


var imagePasses = [
  { // pass 1 - 1px
    x: [0],
    y: [0]
  },
  { // pass 2 - 1px
    x: [4],
    y: [0]
  },
  { // pass 3 - 2px
    x: [0, 4],
    y: [4]
  },
  { // pass 4 - 4px
    x: [2, 6],
    y: [0, 4]
  },
  { // pass 5 - 8px
    x: [0, 2, 4, 6],
    y: [2, 6]
  },
  { // pass 6 - 16px
    x: [1, 3, 5, 7],
    y: [0, 2, 4, 6]
  },
  { // pass 7 - 32px
    x: [0, 1, 2, 3, 4, 5, 6, 7],
    y: [1, 3, 5, 7]
  }
];

exports.getImagePasses = function(width, height) {
  var images = [];
  var xLeftOver = width % 8;
  var yLeftOver = height % 8;
  var xRepeats = (width - xLeftOver) / 8;
  var yRepeats = (height - yLeftOver) / 8;
  for (var i = 0; i < imagePasses.length; i++) {
    var pass = imagePasses[i];
    var passWidth = xRepeats * pass.x.length;
    var passHeight = yRepeats * pass.y.length;
    for (var j = 0; j < pass.x.length; j++) {
      if (pass.x[j] < xLeftOver) {
        passWidth++;
      }
      else {
        break;
      }
    }
    for (j = 0; j < pass.y.length; j++) {
      if (pass.y[j] < yLeftOver) {
        passHeight++;
      }
      else {
        break;
      }
    }
    if (passWidth > 0 && passHeight > 0) {
      images.push({ width: passWidth, height: passHeight, index: i });
    }
  }
  return images;
};

exports.getInterlaceIterator = function(width) {
  return function(x, y, pass) {
    var outerXLeftOver = x % imagePasses[pass].x.length;
    var outerX = (((x - outerXLeftOver) / imagePasses[pass].x.length) * 8) + imagePasses[pass].x[outerXLeftOver];
    var outerYLeftOver = y % imagePasses[pass].y.length;
    var outerY = (((y - outerYLeftOver) / imagePasses[pass].y.length) * 8) + imagePasses[pass].y[outerYLeftOver];
    return (outerX * 4) + (outerY * width * 4);
  };
};

/***/ }),
/* 109 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(21);
var CrcStream = __webpack_require__(105);
var bitPacker = __webpack_require__(209);
var filter = __webpack_require__(210);
var zlib = __webpack_require__(22);

var Packer = module.exports = function(options) {
  this._options = options;

  options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
  options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
  options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
  options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
  options.deflateFactory = options.deflateFactory || zlib.createDeflate;
  options.bitDepth = options.bitDepth || 8;
  // This is outputColorType
  options.colorType = (typeof options.colorType === 'number') ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
  options.inputColorType = (typeof options.inputColorType === 'number') ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;

  if ([
    constants.COLORTYPE_GRAYSCALE,
    constants.COLORTYPE_COLOR,
    constants.COLORTYPE_COLOR_ALPHA,
    constants.COLORTYPE_ALPHA
  ].indexOf(options.colorType) === -1) {
    throw new Error('option color type:' + options.colorType + ' is not supported at present');
  }
  if ([
    constants.COLORTYPE_GRAYSCALE,
    constants.COLORTYPE_COLOR,
    constants.COLORTYPE_COLOR_ALPHA,
    constants.COLORTYPE_ALPHA
  ].indexOf(options.inputColorType) === -1) {
    throw new Error('option input color type:' + options.inputColorType + ' is not supported at present');
  }
  if (options.bitDepth !== 8 && options.bitDepth !== 16) {
    throw new Error('option bit depth:' + options.bitDepth + ' is not supported at present');
  }
};

Packer.prototype.getDeflateOptions = function() {
  return {
    chunkSize: this._options.deflateChunkSize,
    level: this._options.deflateLevel,
    strategy: this._options.deflateStrategy
  };
};

Packer.prototype.createDeflate = function() {
  return this._options.deflateFactory(this.getDeflateOptions());
};

Packer.prototype.filterData = function(data, width, height) {
  // convert to correct format for filtering (e.g. right bpp and bit depth)
  var packedData = bitPacker(data, width, height, this._options);

  // filter pixel data
  var bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
  var filteredData = filter(packedData, width, height, this._options, bpp);
  return filteredData;
};

Packer.prototype._packChunk = function(type, data) {

  var len = (data ? data.length : 0);
  var buf = new Buffer(len + 12);

  buf.writeUInt32BE(len, 0);
  buf.writeUInt32BE(type, 4);

  if (data) {
    data.copy(buf, 8);
  }

  buf.writeInt32BE(CrcStream.crc32(buf.slice(4, buf.length - 4)), buf.length - 4);
  return buf;
};

Packer.prototype.packGAMA = function(gamma) {
  var buf = new Buffer(4);
  buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
  return this._packChunk(constants.TYPE_gAMA, buf);
};

Packer.prototype.packIHDR = function(width, height) {

  var buf = new Buffer(13);
  buf.writeUInt32BE(width, 0);
  buf.writeUInt32BE(height, 4);
  buf[8] = this._options.bitDepth; // Bit depth
  buf[9] = this._options.colorType; // colorType
  buf[10] = 0; // compression
  buf[11] = 0; // filter
  buf[12] = 0; // interlace

  return this._packChunk(constants.TYPE_IHDR, buf);
};

Packer.prototype.packIDAT = function(data) {
  return this._packChunk(constants.TYPE_IDAT, data);
};

Packer.prototype.packIEND = function() {
  return this._packChunk(constants.TYPE_IEND, null);
};


/***/ }),
/* 110 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function paethPredictor(left, above, upLeft) {

  var paeth = left + above - upLeft;
  var pLeft = Math.abs(paeth - left);
  var pAbove = Math.abs(paeth - above);
  var pUpLeft = Math.abs(paeth - upLeft);

  if (pLeft <= pAbove && pLeft <= pUpLeft) {
    return left;
  }
  if (pAbove <= pUpLeft) {
    return above;
  }
  return upLeft;
};

/***/ }),
/* 111 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(21);
var CrcCalculator = __webpack_require__(105);


var Parser = module.exports = function(options, dependencies) {

  this._options = options;
  options.checkCRC = options.checkCRC !== false;

  this._hasIHDR = false;
  this._hasIEND = false;

  // input flags/metadata
  this._palette = [];
  this._colorType = 0;

  this._chunks = {};
  this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
  this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
  this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
  this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
  this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
  this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);

  this.read = dependencies.read;
  this.error = dependencies.error;
  this.metadata = dependencies.metadata;
  this.gamma = dependencies.gamma;
  this.transColor = dependencies.transColor;
  this.palette = dependencies.palette;
  this.parsed = dependencies.parsed;
  this.inflateData = dependencies.inflateData;
  this.finished = dependencies.finished;
};

Parser.prototype.start = function() {
  this.read(constants.PNG_SIGNATURE.length,
    this._parseSignature.bind(this)
  );
};

Parser.prototype._parseSignature = function(data) {

  var signature = constants.PNG_SIGNATURE;

  for (var i = 0; i < signature.length; i++) {
    if (data[i] !== signature[i]) {
      this.error(new Error('Invalid file signature'));
      return;
    }
  }
  this.read(8, this._parseChunkBegin.bind(this));
};

Parser.prototype._parseChunkBegin = function(data) {

  // chunk content length
  var length = data.readUInt32BE(0);

  // chunk type
  var type = data.readUInt32BE(4);
  var name = '';
  for (var i = 4; i < 8; i++) {
    name += String.fromCharCode(data[i]);
  }

  //console.log('chunk ', name, length);

  // chunk flags
  var ancillary = Boolean(data[4] & 0x20); // or critical
//    priv = Boolean(data[5] & 0x20), // or public
//    safeToCopy = Boolean(data[7] & 0x20); // or unsafe

  if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
    this.error(new Error('Expected IHDR on beggining'));
    return;
  }

  this._crc = new CrcCalculator();
  this._crc.write(new Buffer(name));

  if (this._chunks[type]) {
    return this._chunks[type](length);
  }

  if (!ancillary) {
    this.error(new Error('Unsupported critical chunk type ' + name));
    return;
  }

  this.read(length + 4, this._skipChunk.bind(this));
};

Parser.prototype._skipChunk = function(/*data*/) {
  this.read(8, this._parseChunkBegin.bind(this));
};

Parser.prototype._handleChunkEnd = function() {
  this.read(4, this._parseChunkEnd.bind(this));
};

Parser.prototype._parseChunkEnd = function(data) {

  var fileCrc = data.readInt32BE(0);
  var calcCrc = this._crc.crc32();

  // check CRC
  if (this._options.checkCRC && calcCrc !== fileCrc) {
    this.error(new Error('Crc error - ' + fileCrc + ' - ' + calcCrc));
    return;
  }

  if (!this._hasIEND) {
    this.read(8, this._parseChunkBegin.bind(this));
  }
};

Parser.prototype._handleIHDR = function(length) {
  this.read(length, this._parseIHDR.bind(this));
};
Parser.prototype._parseIHDR = function(data) {

  this._crc.write(data);

  var width = data.readUInt32BE(0);
  var height = data.readUInt32BE(4);
  var depth = data[8];
  var colorType = data[9]; // bits: 1 palette, 2 color, 4 alpha
  var compr = data[10];
  var filter = data[11];
  var interlace = data[12];

  // console.log('    width', width, 'height', height,
  //     'depth', depth, 'colorType', colorType,
  //     'compr', compr, 'filter', filter, 'interlace', interlace
  // );

  if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
    this.error(new Error('Unsupported bit depth ' + depth));
    return;
  }
  if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
    this.error(new Error('Unsupported color type'));
    return;
  }
  if (compr !== 0) {
    this.error(new Error('Unsupported compression method'));
    return;
  }
  if (filter !== 0) {
    this.error(new Error('Unsupported filter method'));
    return;
  }
  if (interlace !== 0 && interlace !== 1) {
    this.error(new Error('Unsupported interlace method'));
    return;
  }

  this._colorType = colorType;

  var bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];

  this._hasIHDR = true;

  this.metadata({
    width: width,
    height: height,
    depth: depth,
    interlace: Boolean(interlace),
    palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
    color: Boolean(colorType & constants.COLORTYPE_COLOR),
    alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
    bpp: bpp,
    colorType: colorType
  });

  this._handleChunkEnd();
};


Parser.prototype._handlePLTE = function(length) {
  this.read(length, this._parsePLTE.bind(this));
};
Parser.prototype._parsePLTE = function(data) {

  this._crc.write(data);

  var entries = Math.floor(data.length / 3);
  // console.log('Palette:', entries);

  for (var i = 0; i < entries; i++) {
    this._palette.push([
      data[i * 3],
      data[i * 3 + 1],
      data[i * 3 + 2],
      0xff
    ]);
  }

  this.palette(this._palette);

  this._handleChunkEnd();
};

Parser.prototype._handleTRNS = function(length) {
  this.read(length, this._parseTRNS.bind(this));
};
Parser.prototype._parseTRNS = function(data) {

  this._crc.write(data);

  // palette
  if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
    if (this._palette.length === 0) {
      this.error(new Error('Transparency chunk must be after palette'));
      return;
    }
    if (data.length > this._palette.length) {
      this.error(new Error('More transparent colors than palette size'));
      return;
    }
    for (var i = 0; i < data.length; i++) {
      this._palette[i][3] = data[i];
    }
    this.palette(this._palette);
  }

  // for colorType 0 (grayscale) and 2 (rgb)
  // there might be one gray/color defined as transparent
  if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
    // grey, 2 bytes
    this.transColor([data.readUInt16BE(0)]);
  }
  if (this._colorType === constants.COLORTYPE_COLOR) {
    this.transColor([data.readUInt16BE(0), data.readUInt16BE(2), data.readUInt16BE(4)]);
  }

  this._handleChunkEnd();
};

Parser.prototype._handleGAMA = function(length) {
  this.read(length, this._parseGAMA.bind(this));
};
Parser.prototype._parseGAMA = function(data) {

  this._crc.write(data);
  this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);

  this._handleChunkEnd();
};

Parser.prototype._handleIDAT = function(length) {
  this.read(-length, this._parseIDAT.bind(this, length));
};
Parser.prototype._parseIDAT = function(length, data) {

  this._crc.write(data);

  if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
    throw new Error('Expected palette not found');
  }

  this.inflateData(data);
  var leftOverLength = length - data.length;

  if (leftOverLength > 0) {
    this._handleIDAT(leftOverLength);
  }
  else {
    this._handleChunkEnd();
  }
};

Parser.prototype._handleIEND = function(length) {
  this.read(length, this._parseIEND.bind(this));
};
Parser.prototype._parseIEND = function(data) {

  this._crc.write(data);

  this._hasIEND = true;
  this._handleChunkEnd();

  if (this.finished) {
    this.finished();
  }
};


/***/ }),
/* 112 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(7);
var Stream = __webpack_require__(19);
var Parser = __webpack_require__(215);
var Packer = __webpack_require__(213);
var PNGSync = __webpack_require__(217);


var PNG = exports.PNG = function(options) {
  Stream.call(this);

  options = options || {}; // eslint-disable-line no-param-reassign

  // coerce pixel dimensions to integers (also coerces undefined -> 0):
  this.width = options.width | 0;
  this.height = options.height | 0;

  this.data = this.width > 0 && this.height > 0 ?
    new Buffer(4 * this.width * this.height) : null;

  if (options.fill && this.data) {
    this.data.fill(0);
  }

  this.gamma = 0;
  this.readable = this.writable = true;

  this._parser = new Parser(options);

  this._parser.on('error', this.emit.bind(this, 'error'));
  this._parser.on('close', this._handleClose.bind(this));
  this._parser.on('metadata', this._metadata.bind(this));
  this._parser.on('gamma', this._gamma.bind(this));
  this._parser.on('parsed', function(data) {
    this.data = data;
    this.emit('parsed', data);
  }.bind(this));

  this._packer = new Packer(options);
  this._packer.on('data', this.emit.bind(this, 'data'));
  this._packer.on('end', this.emit.bind(this, 'end'));
  this._parser.on('close', this._handleClose.bind(this));
  this._packer.on('error', this.emit.bind(this, 'error'));

};
util.inherits(PNG, Stream);

PNG.sync = PNGSync;

PNG.prototype.pack = function() {

  if (!this.data || !this.data.length) {
    this.emit('error', 'No data provided');
    return this;
  }

  process.nextTick(function() {
    this._packer.pack(this.data, this.width, this.height, this.gamma);
  }.bind(this));

  return this;
};


PNG.prototype.parse = function(data, callback) {

  if (callback) {
    var onParsed, onError;

    onParsed = function(parsedData) {
      this.removeListener('error', onError);

      this.data = parsedData;
      callback(null, this);
    }.bind(this);

    onError = function(err) {
      this.removeListener('parsed', onParsed);

      callback(err, null);
    }.bind(this);

    this.once('parsed', onParsed);
    this.once('error', onError);
  }

  this.end(data);
  return this;
};

PNG.prototype.write = function(data) {
  this._parser.write(data);
  return true;
};

PNG.prototype.end = function(data) {
  this._parser.end(data);
};

PNG.prototype._metadata = function(metadata) {
  this.width = metadata.width;
  this.height = metadata.height;

  this.emit('metadata', metadata);
};

PNG.prototype._gamma = function(gamma) {
  this.gamma = gamma;
};

PNG.prototype._handleClose = function() {
  if (!this._parser.writable && !this._packer.readable) {
    this.emit('close');
  }
};


PNG.bitblt = function(src, dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params
  // coerce pixel dimensions to integers (also coerces undefined -> 0):
  /* eslint-disable no-param-reassign */
  srcX |= 0;
  srcY |= 0;
  width |= 0;
  height |= 0;
  deltaX |= 0;
  deltaY |= 0;
  /* eslint-enable no-param-reassign */

  if (srcX > src.width || srcY > src.height || srcX + width > src.width || srcY + height > src.height) {
    throw new Error('bitblt reading outside image');
  }

  if (deltaX > dst.width || deltaY > dst.height || deltaX + width > dst.width || deltaY + height > dst.height) {
    throw new Error('bitblt writing outside image');
  }

  for (var y = 0; y < height; y++) {
    src.data.copy(dst.data,
      ((deltaY + y) * dst.width + deltaX) << 2,
      ((srcY + y) * src.width + srcX) << 2,
      ((srcY + y) * src.width + srcX + width) << 2
    );
  }
};


PNG.prototype.bitblt = function(dst, srcX, srcY, width, height, deltaX, deltaY) { // eslint-disable-line max-params

  PNG.bitblt(this, dst, srcX, srcY, width, height, deltaX, deltaY);
  return this;
};

PNG.adjustGamma = function(src) {
  if (src.gamma) {
    for (var y = 0; y < src.height; y++) {
      for (var x = 0; x < src.width; x++) {
        var idx = (src.width * y + x) << 2;

        for (var i = 0; i < 3; i++) {
          var sample = src.data[idx + i] / 255;
          sample = Math.pow(sample, 1 / 2.2 / src.gamma);
          src.data[idx + i] = Math.round(sample * 255);
        }
      }
    }
    src.gamma = 0;
  }
};

PNG.prototype.adjustGamma = function() {
  PNG.adjustGamma(this);
};


/***/ }),
/* 113 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SyncReader = module.exports = function(buffer) {

  this._buffer = buffer;
  this._reads = [];
};

SyncReader.prototype.read = function(length, callback) {

  this._reads.push({
    length: Math.abs(length),  // if length < 0 then at most this length
    allowLess: length < 0,
    func: callback
  });
};

SyncReader.prototype.process = function() {

  // as long as there is any data and read requests
  while (this._reads.length > 0 && this._buffer.length) {

    var read = this._reads[0];

    if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {

      // ok there is any data so that we can satisfy this request
      this._reads.shift(); // == read

      var buf = this._buffer;

      this._buffer = buf.slice(read.length);

      read.func.call(this, buf.slice(0, read.length));

    }
    else {
      break;
    }

  }

  if (this._reads.length > 0) {
    return new Error('There are some read requests waitng on finished stream');
  }

  if (this._buffer.length > 0) {
    return new Error('unrecognised content at end of stream');
  }

};


/***/ }),
/* 114 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 115 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 116 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var thumbnail_1 = __webpack_require__(49);
var exif_1 = __webpack_require__(48);
function getImageThumbnail(fullPath) {
    return thumbnail_1.buildImageThumb(fullPath)
        .then(function (assetThumbnail) {
        return assetThumbnail ? {
            type: assetThumbnail.type,
            data: assetThumbnail.data.toString('base64'),
            size: assetThumbnail.size,
            hash: assetThumbnail.hash,
        } : {
            type: null,
        };
    });
}
exports.getImageThumbnail = getImageThumbnail;
function getVideoThumbnail(fullPath, ffmpegPath) {
    return thumbnail_1.buildVideoThumb(fullPath, ffmpegPath)
        .then(function (assetThumbnail) {
        return assetThumbnail ? {
            type: assetThumbnail.type,
            data: assetThumbnail.data.toString('base64'),
            size: assetThumbnail.size,
            hash: assetThumbnail.hash,
        } : {
            type: null,
        };
    });
}
exports.getVideoThumbnail = getVideoThumbnail;
var worker = {
    on: process.on.bind(process),
    send: process.send.bind(process),
    methods: { getImageThumbnail: getImageThumbnail, getVideoThumbnail: getVideoThumbnail, getExifData: exif_1.getExifData, getFileSha1: thumbnail_1.getFileSha1 },
};
function convertError(error) {
    return Object.getOwnPropertyNames(error).reduce(function (product, name) {
        return Object.defineProperty(product, name, {
            value: error[name],
            enumerable: true,
        });
    }, {});
}
function isPromise(value) {
    return value && (typeof value.then === 'function') && (typeof value.catch === 'function');
}
worker.on('message', function (request) {
    try {
        var method = worker.methods[request.method];
        if (method) {
            var methodResult = method.apply(method, request.params);
            if (isPromise(methodResult)) {
                methodResult
                    .then(function (result) {
                    worker.send({
                        id: request.id,
                        result: result,
                        error: null,
                    });
                })
                    .catch(function (err) {
                    worker.send({
                        id: request.id,
                        result: null,
                        error: convertError(err),
                    });
                });
            }
            else {
                worker.send({
                    id: request.id,
                    result: methodResult,
                    error: null,
                });
            }
        }
        else {
            throw new Error('Unknown method "' + request.method + '"');
        }
    }
    catch (err) {
        worker.send({
            id: request.id,
            result: null,
            error: convertError(err),
        });
    }
});
worker.send('ready');


/***/ }),
/* 117 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(71);
__webpack_require__(45);
__webpack_require__(72);
__webpack_require__(146);
module.exports = __webpack_require__(12).Promise;


/***/ }),
/* 118 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FsErrorType;
(function (FsErrorType) {
    FsErrorType[FsErrorType["fsNotAvailableError"] = 0] = "fsNotAvailableError";
    FsErrorType[FsErrorType["fileNotFoundError"] = 1] = "fileNotFoundError";
})(FsErrorType = exports.FsErrorType || (exports.FsErrorType = {}));
var fsErrorMessage = (_a = {},
    _a[FsErrorType.fsNotAvailableError] = 'Local file system is not accessible',
    _a[FsErrorType.fileNotFoundError] = 'File not found',
    _a);
var FsError = (function (_super) {
    __extends(FsError, _super);
    function FsError(type, reason) {
        var _this = _super.call(this) || this;
        _this.name = 'FsError';
        _this.type = type;
        if (reason) {
            _this.message = fsErrorMessage[type] + ': ' + reason;
        }
        else {
            _this.message = fsErrorMessage[type];
        }
        Object.setPrototypeOf(_this, FsError.prototype);
        return _this;
    }
    return FsError;
}(Error));
exports.FsError = FsError;
var _a;


/***/ }),
/* 119 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(117);
__webpack_require__(116);
__export(__webpack_require__(49));
__export(__webpack_require__(48));


/***/ }),
/* 120 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * @author shaozilee
 *
 * support 1bit 4bit 8bit 24bit decode
 * encode with 24bit
 * 
 */

var encode = __webpack_require__(122),
    decode = __webpack_require__(121);

module.exports = {
  encode: encode,
  decode: decode
};


/***/ }),
/* 121 */
/***/ (function(module, exports) {

/**
 * @author shaozilee
 *
 * Bmp format decoder,support 1bit 4bit 8bit 24bit bmp
 * 
 */

function BmpDecoder(buffer) {
  this.pos = 0;
  this.buffer = buffer;
  this.flag = this.buffer.toString("utf-8", 0, this.pos += 2);
  if (this.flag != "BM") throw new Error("Invalid BMP File");
  this.parseHeader();
  this.parseBGR();
}

BmpDecoder.prototype.parseHeader = function() {
  this.fileSize = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.reserved = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.offset = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.headerSize = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.width = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.height = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.planes = this.buffer.readUInt16LE(this.pos);
  this.pos += 2;
  this.bitPP = this.buffer.readUInt16LE(this.pos);
  this.pos += 2;
  this.compress = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.rawSize = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.hr = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.vr = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.colors = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;
  this.importantColors = this.buffer.readUInt32LE(this.pos);
  this.pos += 4;

  if (this.bitPP < 24) {
    var len = 1 << this.bitPP;
    this.palette = new Array(len);
    for (var i = 0; i < len; i++) {
      var blue = this.buffer.readUInt8(this.pos++);
      var green = this.buffer.readUInt8(this.pos++);
      var red = this.buffer.readUInt8(this.pos++);
      var quad = this.buffer.readUInt8(this.pos++);
      this.palette[i] = {
        red: red,
        green: green,
        blue: blue,
        quad: quad
      };
    }
  }

}

BmpDecoder.prototype.parseBGR = function() {
  this.pos = this.offset;
  try {
    var bitn = "bit" + this.bitPP;
    var len = this.width * this.height * 4;
    this.data = new Buffer(len);

    this[bitn]();
  } catch (e) {
    console.log("bit decode error:" + e);
  }

};

BmpDecoder.prototype.bit1 = function() {
  var xlen = Math.ceil(this.width / 8);
  var mode = xlen%4;
  for (var y = this.height - 1; y >= 0; y--) {
    for (var x = 0; x < xlen; x++) {
      var b = this.buffer.readUInt8(this.pos++);
      var location = y * this.width * 4 + x*8*4;
      for (var i = 0; i < 8; i++) {
        if(x*8+i<this.width){
          var rgb = this.palette[((b>>(7-i))&0x1)];
          this.data[location+i*4] = rgb.blue;
          this.data[location+i*4 + 1] = rgb.green;
          this.data[location+i*4 + 2] = rgb.red;
          this.data[location+i*4 + 3] = 0xFF;  
        }else{
          break;
        }
      }
    }

    if (mode != 0){
      this.pos+=(4 - mode);
    }
  }
};

BmpDecoder.prototype.bit4 = function() {
  var xlen = Math.ceil(this.width/2);
  var mode = xlen%4;
  for (var y = this.height - 1; y >= 0; y--) {
    for (var x = 0; x < xlen; x++) {
      var b = this.buffer.readUInt8(this.pos++);
      var location = y * this.width * 4 + x*2*4;

      var before = b>>4;
      var after = b&0x0F;

      var rgb = this.palette[before];
      this.data[location] = rgb.blue;
      this.data[location + 1] = rgb.green;
      this.data[location + 2] = rgb.red;
      this.data[location + 3] = 0xFF;  

      if(x*2+1>=this.width)break;

      rgb = this.palette[after];
      this.data[location+4] = rgb.blue;
      this.data[location+4 + 1] = rgb.green;
      this.data[location+4 + 2] = rgb.red;
      this.data[location+4 + 3] = 0xFF;  
    }

    if (mode != 0){
      this.pos+=(4 - mode);
    }
  }

};

BmpDecoder.prototype.bit8 = function() {
  var mode = this.width%4;
  for (var y = this.height - 1; y >= 0; y--) {
    for (var x = 0; x < this.width; x++) {
      var b = this.buffer.readUInt8(this.pos++);
      var location = y * this.width * 4 + x*4;
      var rgb = this.palette[b];
      this.data[location] = rgb.blue;
      this.data[location + 1] = rgb.green;
      this.data[location + 2] = rgb.red;
      this.data[location + 3] = 0xFF;  
    }
    if (mode != 0){
      this.pos+=(4 - mode);
    }
  }
};

BmpDecoder.prototype.bit24 = function() {
  //when height > 0
  for (var y = this.height - 1; y >= 0; y--) {
    for (var x = 0; x < this.width; x++) {
      var blue = this.buffer.readUInt8(this.pos++);
      var green = this.buffer.readUInt8(this.pos++);
      var red = this.buffer.readUInt8(this.pos++);
      var location = y * this.width * 4 + x * 4;
      this.data[location] = red;
      this.data[location + 1] = green;
      this.data[location + 2] = blue;
      this.data[location + 3] = 0xFF;
    }
    //skip extra bytes
    this.pos += (this.width % 4);
  }

};

BmpDecoder.prototype.getData = function() {
  return this.data;
};



module.exports = decode = function(bmpData) {
  var decoder = new BmpDecoder(bmpData);
  return {
    data: decoder.getData(),
    width: decoder.width,
    height: decoder.height
  };
}

/***/ }),
/* 122 */
/***/ (function(module, exports) {

/**
 * @author shaozilee
 *
 * BMP format encoder,encode 24bit BMP
 * Not support quality compression
 * 
 */

function BmpEncoder(imgData){
	this.buffer = imgData.data;
	this.width = imgData.width;
	this.height = imgData.height;
	this.extraBytes = this.width%4;
	this.rgbSize = this.height*(3*this.width+this.extraBytes);
	this.headerInfoSize = 40;

	this.data = [];
	/******************header***********************/
	this.flag = "BM";
	this.reserved = 0;
	this.offset = 54;
	this.fileSize = this.rgbSize+this.offset;
	this.planes = 1;
	this.bitPP = 24;
	this.compress = 0;
	this.hr = 0;
	this.vr = 0;
	this.colors = 0;
	this.importantColors = 0;
}

BmpEncoder.prototype.encode = function() {
	var tempBuffer = new Buffer(this.offset+this.rgbSize);
	this.pos = 0;
	tempBuffer.write(this.flag,this.pos,2);this.pos+=2;
	tempBuffer.writeUInt32LE(this.fileSize,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.reserved,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.offset,this.pos);this.pos+=4;

	tempBuffer.writeUInt32LE(this.headerInfoSize,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.width,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.height,this.pos);this.pos+=4;
	tempBuffer.writeUInt16LE(this.planes,this.pos);this.pos+=2;
	tempBuffer.writeUInt16LE(this.bitPP,this.pos);this.pos+=2;
	tempBuffer.writeUInt32LE(this.compress,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.rgbSize,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.hr,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.vr,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.colors,this.pos);this.pos+=4;
	tempBuffer.writeUInt32LE(this.importantColors,this.pos);this.pos+=4;

	var i=0;
	var rowBytes = 3*this.width+this.extraBytes;

	for (var y = this.height - 1; y >= 0; y--){
		for (var x = 0; x < this.width; x++){
			var p = this.pos+y*rowBytes+x*3;
			tempBuffer[p+2]= this.buffer[i++];//r
			tempBuffer[p+1] = this.buffer[i++];//g
			tempBuffer[p]  = this.buffer[i++];//b
			i++;
		}
		if(this.extraBytes>0){
			var fillOffset = this.pos+y*rowBytes+this.width*3;
			tempBuffer.fill(0,fillOffset,fillOffset+this.extraBytes);	
		}
	}

	return tempBuffer;
};




module.exports = encode = function(imgData, quality) {
  if (typeof quality === 'undefined') quality = 100;
 	var encoder = new BmpEncoder(imgData);
	var data = encoder.encode();
  return {
    data: data,
    width: imgData.width,
    height: imgData.height
  };
}


/***/ }),
/* 123 */
/***/ (function(module, exports, __webpack_require__) {

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = __webpack_require__(3)('unscopables');
var ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) __webpack_require__(17)(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};


/***/ }),
/* 124 */
/***/ (function(module, exports, __webpack_require__) {

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = __webpack_require__(29);
var toLength = __webpack_require__(44);
var toAbsoluteIndex = __webpack_require__(143);
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};


/***/ }),
/* 125 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var dP = __webpack_require__(16).f;
var create = __webpack_require__(62);
var redefineAll = __webpack_require__(41);
var ctx = __webpack_require__(13);
var anInstance = __webpack_require__(34);
var forOf = __webpack_require__(38);
var $iterDefine = __webpack_require__(39);
var step = __webpack_require__(58);
var setSpecies = __webpack_require__(64);
var DESCRIPTORS = __webpack_require__(14);
var fastKey = __webpack_require__(60).fastKey;
var validate = __webpack_require__(69);
var SIZE = DESCRIPTORS ? '_s' : 'size';

var getEntry = function (that, key) {
  // fast case
  var index = fastKey(key);
  var entry;
  if (index !== 'F') return that._i[index];
  // frozen object case
  for (entry = that._f; entry; entry = entry.n) {
    if (entry.k == key) return entry;
  }
};

module.exports = {
  getConstructor: function (wrapper, NAME, IS_MAP, ADDER) {
    var C = wrapper(function (that, iterable) {
      anInstance(that, C, NAME, '_i');
      that._t = NAME;         // collection type
      that._i = create(null); // index
      that._f = undefined;    // first entry
      that._l = undefined;    // last entry
      that[SIZE] = 0;         // size
      if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
    });
    redefineAll(C.prototype, {
      // 23.1.3.1 Map.prototype.clear()
      // 23.2.3.2 Set.prototype.clear()
      clear: function clear() {
        for (var that = validate(this, NAME), data = that._i, entry = that._f; entry; entry = entry.n) {
          entry.r = true;
          if (entry.p) entry.p = entry.p.n = undefined;
          delete data[entry.i];
        }
        that._f = that._l = undefined;
        that[SIZE] = 0;
      },
      // 23.1.3.3 Map.prototype.delete(key)
      // 23.2.3.4 Set.prototype.delete(value)
      'delete': function (key) {
        var that = validate(this, NAME);
        var entry = getEntry(that, key);
        if (entry) {
          var next = entry.n;
          var prev = entry.p;
          delete that._i[entry.i];
          entry.r = true;
          if (prev) prev.n = next;
          if (next) next.p = prev;
          if (that._f == entry) that._f = next;
          if (that._l == entry) that._l = prev;
          that[SIZE]--;
        } return !!entry;
      },
      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
      forEach: function forEach(callbackfn /* , that = undefined */) {
        validate(this, NAME);
        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
        var entry;
        while (entry = entry ? entry.n : this._f) {
          f(entry.v, entry.k, this);
          // revert to the last existing entry
          while (entry && entry.r) entry = entry.p;
        }
      },
      // 23.1.3.7 Map.prototype.has(key)
      // 23.2.3.7 Set.prototype.has(value)
      has: function has(key) {
        return !!getEntry(validate(this, NAME), key);
      }
    });
    if (DESCRIPTORS) dP(C.prototype, 'size', {
      get: function () {
        return validate(this, NAME)[SIZE];
      }
    });
    return C;
  },
  def: function (that, key, value) {
    var entry = getEntry(that, key);
    var prev, index;
    // change existing entry
    if (entry) {
      entry.v = value;
    // create new entry
    } else {
      that._l = entry = {
        i: index = fastKey(key, true), // <- index
        k: key,                        // <- key
        v: value,                      // <- value
        p: prev = that._l,             // <- previous entry
        n: undefined,                  // <- next entry
        r: false                       // <- removed
      };
      if (!that._f) that._f = entry;
      if (prev) prev.n = entry;
      that[SIZE]++;
      // add to index
      if (index !== 'F') that._i[index] = entry;
    } return that;
  },
  getEntry: getEntry,
  setStrong: function (C, NAME, IS_MAP) {
    // add .keys, .values, .entries, [@@iterator]
    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
    $iterDefine(C, NAME, function (iterated, kind) {
      this._t = validate(iterated, NAME); // target
      this._k = kind;                     // kind
      this._l = undefined;                // previous
    }, function () {
      var that = this;
      var kind = that._k;
      var entry = that._l;
      // revert to the last existing entry
      while (entry && entry.r) entry = entry.p;
      // get next entry
      if (!that._t || !(that._l = entry = entry ? entry.n : that._t._f)) {
        // or finish the iteration
        that._t = undefined;
        return step(1);
      }
      // return step by kind
      if (kind == 'keys') return step(0, entry.k);
      if (kind == 'values') return step(0, entry.v);
      return step(0, [entry.k, entry.v]);
    }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

    // add [@@species], 23.1.2.2, 23.2.2.2
    setSpecies(NAME);
  }
};


/***/ }),
/* 126 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var global = __webpack_require__(5);
var $export = __webpack_require__(25);
var redefine = __webpack_require__(18);
var redefineAll = __webpack_require__(41);
var meta = __webpack_require__(60);
var forOf = __webpack_require__(38);
var anInstance = __webpack_require__(34);
var isObject = __webpack_require__(8);
var fails = __webpack_require__(26);
var $iterDetect = __webpack_require__(40);
var setToStringTag = __webpack_require__(28);
var inheritIfRequired = __webpack_require__(128);

module.exports = function (NAME, wrapper, methods, common, IS_MAP, IS_WEAK) {
  var Base = global[NAME];
  var C = Base;
  var ADDER = IS_MAP ? 'set' : 'add';
  var proto = C && C.prototype;
  var O = {};
  var fixMethod = function (KEY) {
    var fn = proto[KEY];
    redefine(proto, KEY,
      KEY == 'delete' ? function (a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'has' ? function has(a) {
        return IS_WEAK && !isObject(a) ? false : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'get' ? function get(a) {
        return IS_WEAK && !isObject(a) ? undefined : fn.call(this, a === 0 ? 0 : a);
      } : KEY == 'add' ? function add(a) { fn.call(this, a === 0 ? 0 : a); return this; }
        : function set(a, b) { fn.call(this, a === 0 ? 0 : a, b); return this; }
    );
  };
  if (typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function () {
    new C().entries().next();
  }))) {
    // create collection constructor
    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
    redefineAll(C.prototype, methods);
    meta.NEED = true;
  } else {
    var instance = new C();
    // early implementations not supports chaining
    var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
    // V8 ~  Chromium 40- weak-collections throws on primitives, but should return false
    var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
    // most early implementations doesn't supports iterables, most modern - not close it correctly
    var ACCEPT_ITERABLES = $iterDetect(function (iter) { new C(iter); }); // eslint-disable-line no-new
    // for early implementations -0 and +0 not the same
    var BUGGY_ZERO = !IS_WEAK && fails(function () {
      // V8 ~ Chromium 42- fails only with 5+ elements
      var $instance = new C();
      var index = 5;
      while (index--) $instance[ADDER](index, index);
      return !$instance.has(-0);
    });
    if (!ACCEPT_ITERABLES) {
      C = wrapper(function (target, iterable) {
        anInstance(target, C, NAME);
        var that = inheritIfRequired(new Base(), target, C);
        if (iterable != undefined) forOf(iterable, IS_MAP, that[ADDER], that);
        return that;
      });
      C.prototype = proto;
      proto.constructor = C;
    }
    if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
      fixMethod('delete');
      fixMethod('has');
      IS_MAP && fixMethod('get');
    }
    if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);
    // weak collections should not contains .clear method
    if (IS_WEAK && proto.clear) delete proto.clear;
  }

  setToStringTag(C, NAME);

  O[NAME] = C;
  $export($export.G + $export.W + $export.F * (C != Base), O);

  if (!IS_WEAK) common.setStrong(C, NAME, IS_MAP);

  return C;
};


/***/ }),
/* 127 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var $defineProperty = __webpack_require__(16);
var createDesc = __webpack_require__(27);

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));
  else object[index] = value;
};


/***/ }),
/* 128 */
/***/ (function(module, exports, __webpack_require__) {

var isObject = __webpack_require__(8);
var setPrototypeOf = __webpack_require__(140).set;
module.exports = function (that, target, C) {
  var S = target.constructor;
  var P;
  if (S !== C && typeof S == 'function' && (P = S.prototype) !== C.prototype && isObject(P) && setPrototypeOf) {
    setPrototypeOf(that, P);
  } return that;
};


/***/ }),
/* 129 */
/***/ (function(module, exports) {

// fast apply, http://jsperf.lnkit.com/fast-apply/5
module.exports = function (fn, args, that) {
  var un = that === undefined;
  switch (args.length) {
    case 0: return un ? fn()
                      : fn.call(that);
    case 1: return un ? fn(args[0])
                      : fn.call(that, args[0]);
    case 2: return un ? fn(args[0], args[1])
                      : fn.call(that, args[0], args[1]);
    case 3: return un ? fn(args[0], args[1], args[2])
                      : fn.call(that, args[0], args[1], args[2]);
    case 4: return un ? fn(args[0], args[1], args[2], args[3])
                      : fn.call(that, args[0], args[1], args[2], args[3]);
  } return fn.apply(that, args);
};


/***/ }),
/* 130 */
/***/ (function(module, exports, __webpack_require__) {

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = __webpack_require__(24);
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};


/***/ }),
/* 131 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var create = __webpack_require__(62);
var descriptor = __webpack_require__(27);
var setToStringTag = __webpack_require__(28);
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
__webpack_require__(17)(IteratorPrototype, __webpack_require__(3)('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};


/***/ }),
/* 132 */
/***/ (function(module, exports, __webpack_require__) {

var global = __webpack_require__(5);
var macrotask = __webpack_require__(66).set;
var Observer = global.MutationObserver || global.WebKitMutationObserver;
var process = global.process;
var Promise = global.Promise;
var isNode = __webpack_require__(24)(process) == 'process';

module.exports = function () {
  var head, last, notify;

  var flush = function () {
    var parent, fn;
    if (isNode && (parent = process.domain)) parent.exit();
    while (head) {
      fn = head.fn;
      head = head.next;
      try {
        fn();
      } catch (e) {
        if (head) notify();
        else last = undefined;
        throw e;
      }
    } last = undefined;
    if (parent) parent.enter();
  };

  // Node.js
  if (isNode) {
    notify = function () {
      process.nextTick(flush);
    };
  // browsers with MutationObserver
  } else if (Observer) {
    var toggle = true;
    var node = document.createTextNode('');
    new Observer(flush).observe(node, { characterData: true }); // eslint-disable-line no-new
    notify = function () {
      node.data = toggle = !toggle;
    };
  // environments with maybe non-completely correct, but existent Promise
  } else if (Promise && Promise.resolve) {
    var promise = Promise.resolve();
    notify = function () {
      promise.then(flush);
    };
  // for other environments - macrotask based on:
  // - setImmediate
  // - MessageChannel
  // - window.postMessag
  // - onreadystatechange
  // - setTimeout
  } else {
    notify = function () {
      // strange IE + webpack dev server bug - use .call(global)
      macrotask.call(global, flush);
    };
  }

  return function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };
};


/***/ }),
/* 133 */
/***/ (function(module, exports, __webpack_require__) {

var dP = __webpack_require__(16);
var anObject = __webpack_require__(10);
var getKeys = __webpack_require__(63);

module.exports = __webpack_require__(14) ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};


/***/ }),
/* 134 */
/***/ (function(module, exports, __webpack_require__) {

var pIE = __webpack_require__(137);
var createDesc = __webpack_require__(27);
var toIObject = __webpack_require__(29);
var toPrimitive = __webpack_require__(68);
var has = __webpack_require__(15);
var IE8_DOM_DEFINE = __webpack_require__(55);
var gOPD = Object.getOwnPropertyDescriptor;

exports.f = __webpack_require__(14) ? gOPD : function getOwnPropertyDescriptor(O, P) {
  O = toIObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return gOPD(O, P);
  } catch (e) { /* empty */ }
  if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
};


/***/ }),
/* 135 */
/***/ (function(module, exports, __webpack_require__) {

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = __webpack_require__(15);
var toObject = __webpack_require__(67);
var IE_PROTO = __webpack_require__(42)('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};


/***/ }),
/* 136 */
/***/ (function(module, exports, __webpack_require__) {

var has = __webpack_require__(15);
var toIObject = __webpack_require__(29);
var arrayIndexOf = __webpack_require__(124)(false);
var IE_PROTO = __webpack_require__(42)('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};


/***/ }),
/* 137 */
/***/ (function(module, exports) {

exports.f = {}.propertyIsEnumerable;


/***/ }),
/* 138 */
/***/ (function(module, exports) {

module.exports = function (exec) {
  try {
    return { e: false, v: exec() };
  } catch (e) {
    return { e: true, v: e };
  }
};


/***/ }),
/* 139 */
/***/ (function(module, exports, __webpack_require__) {

var anObject = __webpack_require__(10);
var isObject = __webpack_require__(8);
var newPromiseCapability = __webpack_require__(61);

module.exports = function (C, x) {
  anObject(C);
  if (isObject(x) && x.constructor === C) return x;
  var promiseCapability = newPromiseCapability.f(C);
  var resolve = promiseCapability.resolve;
  resolve(x);
  return promiseCapability.promise;
};


/***/ }),
/* 140 */
/***/ (function(module, exports, __webpack_require__) {

// Works with __proto__ only. Old v8 can't work with null proto objects.
/* eslint-disable no-proto */
var isObject = __webpack_require__(8);
var anObject = __webpack_require__(10);
var check = function (O, proto) {
  anObject(O);
  if (!isObject(proto) && proto !== null) throw TypeError(proto + ": can't set as prototype!");
};
module.exports = {
  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
    function (test, buggy, set) {
      try {
        set = __webpack_require__(13)(Function.call, __webpack_require__(134).f(Object.prototype, '__proto__').set, 2);
        set(test, []);
        buggy = !(test instanceof Array);
      } catch (e) { buggy = true; }
      return function setPrototypeOf(O, proto) {
        check(O, proto);
        if (buggy) O.__proto__ = proto;
        else set(O, proto);
        return O;
      };
    }({}, false) : undefined),
  check: check
};


/***/ }),
/* 141 */
/***/ (function(module, exports, __webpack_require__) {

// 7.3.20 SpeciesConstructor(O, defaultConstructor)
var anObject = __webpack_require__(10);
var aFunction = __webpack_require__(23);
var SPECIES = __webpack_require__(3)('species');
module.exports = function (O, D) {
  var C = anObject(O).constructor;
  var S;
  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
};


/***/ }),
/* 142 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(43);
var defined = __webpack_require__(36);
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};


/***/ }),
/* 143 */
/***/ (function(module, exports, __webpack_require__) {

var toInteger = __webpack_require__(43);
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};


/***/ }),
/* 144 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var ctx = __webpack_require__(13);
var $export = __webpack_require__(25);
var toObject = __webpack_require__(67);
var call = __webpack_require__(57);
var isArrayIter = __webpack_require__(56);
var toLength = __webpack_require__(44);
var createProperty = __webpack_require__(127);
var getIterFn = __webpack_require__(70);

$export($export.S + $export.F * !__webpack_require__(40)(function (iter) { Array.from(iter); }), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /* , mapfn = undefined, thisArg = undefined */) {
    var O = toObject(arrayLike);
    var C = typeof this == 'function' ? this : Array;
    var aLen = arguments.length;
    var mapfn = aLen > 1 ? arguments[1] : undefined;
    var mapping = mapfn !== undefined;
    var index = 0;
    var iterFn = getIterFn(O);
    var length, result, step, iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});


/***/ }),
/* 145 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var addToUnscopables = __webpack_require__(123);
var step = __webpack_require__(58);
var Iterators = __webpack_require__(20);
var toIObject = __webpack_require__(29);

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = __webpack_require__(39)(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');


/***/ }),
/* 146 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var LIBRARY = __webpack_require__(59);
var global = __webpack_require__(5);
var ctx = __webpack_require__(13);
var classof = __webpack_require__(35);
var $export = __webpack_require__(25);
var isObject = __webpack_require__(8);
var aFunction = __webpack_require__(23);
var anInstance = __webpack_require__(34);
var forOf = __webpack_require__(38);
var speciesConstructor = __webpack_require__(141);
var task = __webpack_require__(66).set;
var microtask = __webpack_require__(132)();
var newPromiseCapabilityModule = __webpack_require__(61);
var perform = __webpack_require__(138);
var promiseResolve = __webpack_require__(139);
var PROMISE = 'Promise';
var TypeError = global.TypeError;
var process = global.process;
var $Promise = global[PROMISE];
var isNode = classof(process) == 'process';
var empty = function () { /* empty */ };
var Internal, newGenericPromiseCapability, OwnPromiseCapability, Wrapper;
var newPromiseCapability = newGenericPromiseCapability = newPromiseCapabilityModule.f;

var USE_NATIVE = !!function () {
  try {
    // correct subclassing with @@species support
    var promise = $Promise.resolve(1);
    var FakePromise = (promise.constructor = {})[__webpack_require__(3)('species')] = function (exec) {
      exec(empty, empty);
    };
    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
  } catch (e) { /* empty */ }
}();

// helpers
var isThenable = function (it) {
  var then;
  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
};
var notify = function (promise, isReject) {
  if (promise._n) return;
  promise._n = true;
  var chain = promise._c;
  microtask(function () {
    var value = promise._v;
    var ok = promise._s == 1;
    var i = 0;
    var run = function (reaction) {
      var handler = ok ? reaction.ok : reaction.fail;
      var resolve = reaction.resolve;
      var reject = reaction.reject;
      var domain = reaction.domain;
      var result, then;
      try {
        if (handler) {
          if (!ok) {
            if (promise._h == 2) onHandleUnhandled(promise);
            promise._h = 1;
          }
          if (handler === true) result = value;
          else {
            if (domain) domain.enter();
            result = handler(value);
            if (domain) domain.exit();
          }
          if (result === reaction.promise) {
            reject(TypeError('Promise-chain cycle'));
          } else if (then = isThenable(result)) {
            then.call(result, resolve, reject);
          } else resolve(result);
        } else reject(value);
      } catch (e) {
        reject(e);
      }
    };
    while (chain.length > i) run(chain[i++]); // variable length - can't use forEach
    promise._c = [];
    promise._n = false;
    if (isReject && !promise._h) onUnhandled(promise);
  });
};
var onUnhandled = function (promise) {
  task.call(global, function () {
    var value = promise._v;
    var unhandled = isUnhandled(promise);
    var result, handler, console;
    if (unhandled) {
      result = perform(function () {
        if (isNode) {
          process.emit('unhandledRejection', value, promise);
        } else if (handler = global.onunhandledrejection) {
          handler({ promise: promise, reason: value });
        } else if ((console = global.console) && console.error) {
          console.error('Unhandled promise rejection', value);
        }
      });
      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
    } promise._a = undefined;
    if (unhandled && result.e) throw result.v;
  });
};
var isUnhandled = function (promise) {
  if (promise._h == 1) return false;
  var chain = promise._a || promise._c;
  var i = 0;
  var reaction;
  while (chain.length > i) {
    reaction = chain[i++];
    if (reaction.fail || !isUnhandled(reaction.promise)) return false;
  } return true;
};
var onHandleUnhandled = function (promise) {
  task.call(global, function () {
    var handler;
    if (isNode) {
      process.emit('rejectionHandled', promise);
    } else if (handler = global.onrejectionhandled) {
      handler({ promise: promise, reason: promise._v });
    }
  });
};
var $reject = function (value) {
  var promise = this;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  promise._v = value;
  promise._s = 2;
  if (!promise._a) promise._a = promise._c.slice();
  notify(promise, true);
};
var $resolve = function (value) {
  var promise = this;
  var then;
  if (promise._d) return;
  promise._d = true;
  promise = promise._w || promise; // unwrap
  try {
    if (promise === value) throw TypeError("Promise can't be resolved itself");
    if (then = isThenable(value)) {
      microtask(function () {
        var wrapper = { _w: promise, _d: false }; // wrap
        try {
          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
        } catch (e) {
          $reject.call(wrapper, e);
        }
      });
    } else {
      promise._v = value;
      promise._s = 1;
      notify(promise, false);
    }
  } catch (e) {
    $reject.call({ _w: promise, _d: false }, e); // wrap
  }
};

// constructor polyfill
if (!USE_NATIVE) {
  // 25.4.3.1 Promise(executor)
  $Promise = function Promise(executor) {
    anInstance(this, $Promise, PROMISE, '_h');
    aFunction(executor);
    Internal.call(this);
    try {
      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
    } catch (err) {
      $reject.call(this, err);
    }
  };
  // eslint-disable-next-line no-unused-vars
  Internal = function Promise(executor) {
    this._c = [];             // <- awaiting reactions
    this._a = undefined;      // <- checked in isUnhandled reactions
    this._s = 0;              // <- state
    this._d = false;          // <- done
    this._v = undefined;      // <- value
    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
    this._n = false;          // <- notify
  };
  Internal.prototype = __webpack_require__(41)($Promise.prototype, {
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    then: function then(onFulfilled, onRejected) {
      var reaction = newPromiseCapability(speciesConstructor(this, $Promise));
      reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
      reaction.fail = typeof onRejected == 'function' && onRejected;
      reaction.domain = isNode ? process.domain : undefined;
      this._c.push(reaction);
      if (this._a) this._a.push(reaction);
      if (this._s) notify(this, false);
      return reaction.promise;
    },
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    'catch': function (onRejected) {
      return this.then(undefined, onRejected);
    }
  });
  OwnPromiseCapability = function () {
    var promise = new Internal();
    this.promise = promise;
    this.resolve = ctx($resolve, promise, 1);
    this.reject = ctx($reject, promise, 1);
  };
  newPromiseCapabilityModule.f = newPromiseCapability = function (C) {
    return C === $Promise || C === Wrapper
      ? new OwnPromiseCapability(C)
      : newGenericPromiseCapability(C);
  };
}

$export($export.G + $export.W + $export.F * !USE_NATIVE, { Promise: $Promise });
__webpack_require__(28)($Promise, PROMISE);
__webpack_require__(64)(PROMISE);
Wrapper = __webpack_require__(12)[PROMISE];

// statics
$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
  // 25.4.4.5 Promise.reject(r)
  reject: function reject(r) {
    var capability = newPromiseCapability(this);
    var $$reject = capability.reject;
    $$reject(r);
    return capability.promise;
  }
});
$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
  // 25.4.4.6 Promise.resolve(x)
  resolve: function resolve(x) {
    return promiseResolve(LIBRARY && this === Wrapper ? $Promise : this, x);
  }
});
$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(40)(function (iter) {
  $Promise.all(iter)['catch'](empty);
})), PROMISE, {
  // 25.4.4.1 Promise.all(iterable)
  all: function all(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var resolve = capability.resolve;
    var reject = capability.reject;
    var result = perform(function () {
      var values = [];
      var index = 0;
      var remaining = 1;
      forOf(iterable, false, function (promise) {
        var $index = index++;
        var alreadyCalled = false;
        values.push(undefined);
        remaining++;
        C.resolve(promise).then(function (value) {
          if (alreadyCalled) return;
          alreadyCalled = true;
          values[$index] = value;
          --remaining || resolve(values);
        }, reject);
      });
      --remaining || resolve(values);
    });
    if (result.e) reject(result.v);
    return capability.promise;
  },
  // 25.4.4.4 Promise.race(iterable)
  race: function race(iterable) {
    var C = this;
    var capability = newPromiseCapability(C);
    var reject = capability.reject;
    var result = perform(function () {
      forOf(iterable, false, function (promise) {
        C.resolve(promise).then(capability.resolve, reject);
      });
    });
    if (result.e) reject(result.v);
    return capability.promise;
  }
});


/***/ }),
/* 147 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var strong = __webpack_require__(125);
var validate = __webpack_require__(69);
var SET = 'Set';

// 23.2 Set Objects
module.exports = __webpack_require__(126)(SET, function (get) {
  return function Set() { return get(this, arguments.length > 0 ? arguments[0] : undefined); };
}, {
  // 23.2.3.1 Set.prototype.add(value)
  add: function add(value) {
    return strong.def(validate(this, SET), value = value === 0 ? 0 : value, value);
  }
}, strong);


/***/ }),
/* 148 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(73);
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}


/***/ }),
/* 149 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Detect Electron renderer process, which is node, but we should
 * treat as a browser.
 */

if (typeof process !== 'undefined' && process.type === 'renderer') {
  module.exports = __webpack_require__(148);
} else {
  module.exports = __webpack_require__(150);
}


/***/ }),
/* 150 */
/***/ (function(module, exports, __webpack_require__) {

/**
 * Module dependencies.
 */

var tty = __webpack_require__(227);
var util = __webpack_require__(7);

/**
 * This is the Node.js implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = __webpack_require__(73);
exports.init = init;
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [6, 2, 3, 4, 5, 1];

/**
 * Build up the default `inspectOpts` object from the environment variables.
 *
 *   $ DEBUG_COLORS=no DEBUG_DEPTH=10 DEBUG_SHOW_HIDDEN=enabled node script.js
 */

exports.inspectOpts = Object.keys(process.env).filter(function (key) {
  return /^debug_/i.test(key);
}).reduce(function (obj, key) {
  // camel-case
  var prop = key
    .substring(6)
    .toLowerCase()
    .replace(/_([a-z])/g, function (_, k) { return k.toUpperCase() });

  // coerce string value into JS value
  var val = process.env[key];
  if (/^(yes|on|true|enabled)$/i.test(val)) val = true;
  else if (/^(no|off|false|disabled)$/i.test(val)) val = false;
  else if (val === 'null') val = null;
  else val = Number(val);

  obj[prop] = val;
  return obj;
}, {});

/**
 * The file descriptor to write the `debug()` calls to.
 * Set the `DEBUG_FD` env variable to override with another value. i.e.:
 *
 *   $ DEBUG_FD=3 node script.js 3>debug.log
 */

var fd = parseInt(process.env.DEBUG_FD, 10) || 2;

if (1 !== fd && 2 !== fd) {
  util.deprecate(function(){}, 'except for stderr(2) and stdout(1), any other usage of DEBUG_FD is deprecated. Override debug.log if you want to use a different log function (https://git.io/debug_fd)')()
}

var stream = 1 === fd ? process.stdout :
             2 === fd ? process.stderr :
             createWritableStdioStream(fd);

/**
 * Is stdout a TTY? Colored output is enabled when `true`.
 */

function useColors() {
  return 'colors' in exports.inspectOpts
    ? Boolean(exports.inspectOpts.colors)
    : tty.isatty(fd);
}

/**
 * Map %o to `util.inspect()`, all on a single line.
 */

exports.formatters.o = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts)
    .split('\n').map(function(str) {
      return str.trim()
    }).join(' ');
};

/**
 * Map %o to `util.inspect()`, allowing multiple lines if needed.
 */

exports.formatters.O = function(v) {
  this.inspectOpts.colors = this.useColors;
  return util.inspect(v, this.inspectOpts);
};

/**
 * Adds ANSI color escape codes if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var name = this.namespace;
  var useColors = this.useColors;

  if (useColors) {
    var c = this.color;
    var prefix = '  \u001b[3' + c + ';1m' + name + ' ' + '\u001b[0m';

    args[0] = prefix + args[0].split('\n').join('\n' + prefix);
    args.push('\u001b[3' + c + 'm+' + exports.humanize(this.diff) + '\u001b[0m');
  } else {
    args[0] = new Date().toUTCString()
      + ' ' + name + ' ' + args[0];
  }
}

/**
 * Invokes `util.format()` with the specified arguments and writes to `stream`.
 */

function log() {
  return stream.write(util.format.apply(util, arguments) + '\n');
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  if (null == namespaces) {
    // If you set a process.env field to null or undefined, it gets cast to the
    // string 'null' or 'undefined'. Just delete instead.
    delete process.env.DEBUG;
  } else {
    process.env.DEBUG = namespaces;
  }
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  return process.env.DEBUG;
}

/**
 * Copied from `node/src/node.js`.
 *
 * XXX: It's lame that node doesn't expose this API out-of-the-box. It also
 * relies on the undocumented `tty_wrap.guessHandleType()` which is also lame.
 */

function createWritableStdioStream (fd) {
  var stream;
  var tty_wrap = process.binding('tty_wrap');

  // Note stream._type is used for test-module-load-list.js

  switch (tty_wrap.guessHandleType(fd)) {
    case 'TTY':
      stream = new tty.WriteStream(fd);
      stream._type = 'tty';

      // Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    case 'FILE':
      var fs = __webpack_require__(2);
      stream = new fs.SyncWriteStream(fd, { autoClose: false });
      stream._type = 'fs';
      break;

    case 'PIPE':
    case 'TCP':
      var net = __webpack_require__(226);
      stream = new net.Socket({
        fd: fd,
        readable: false,
        writable: true
      });

      // FIXME Should probably have an option in net.Socket to create a
      // stream from an existing fd which is writable only. But for now
      // we'll just add this hack and set the `readable` member to false.
      // Test: ./node test/fixtures/echo.js < /etc/passwd
      stream.readable = false;
      stream.read = null;
      stream._type = 'pipe';

      // FIXME Hack to have stream not keep the event loop alive.
      // See https://github.com/joyent/node/issues/1726
      if (stream._handle && stream._handle.unref) {
        stream._handle.unref();
      }
      break;

    default:
      // Probably an error on in uv_guess_handle()
      throw new Error('Implement me. Unknown stream file type!');
  }

  // For supporting legacy API we put the FD here.
  stream.fd = fd;

  stream._isStdio = true;

  return stream;
}

/**
 * Init logic for `debug` instances.
 *
 * Create a new `inspectOpts` object in case `useColors` is set
 * differently for a particular `debug` instance.
 */

function init (debug) {
  debug.inspectOpts = {};

  var keys = Object.keys(exports.inspectOpts);
  for (var i = 0; i < keys.length; i++) {
    debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
  }
}

/**
 * Enable namespaces listed in `process.env.DEBUG` initially.
 */

exports.enable(load());


/***/ }),
/* 151 */
/***/ (function(module, exports) {

//
// A couple of methods that make working with buffers more easy.
//

Buffer.prototype.getByte = function (offset) {
  return this[offset];
};

Buffer.prototype.getSignedByte = function (offset) {
  return (this[offset] > 127) ? this[offset] - 256 : this[offset];
};

Buffer.prototype.getShort = function (offset, bigEndian) {
  var shortVal = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset];
  return (shortVal < 0) ? shortVal + 65536 : shortVal;
};

Buffer.prototype.getSignedShort = function (offset, bigEndian) {
  var shortVal = (bigEndian) ? (this[offset] << 8) + this[offset + 1] : (this[offset + 1] << 8) + this[offset];
  return (shortVal > 32767) ? shortVal - 65536 : shortVal;
};

Buffer.prototype.getLong = function (offset, bigEndian) {
  var longVal = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset];
  return (longVal < 0) ? longVal + 4294967296 : longVal;
};

Buffer.prototype.getSignedLong = function (offset, bigEndian) {
  var longVal = (bigEndian) ? (((((this[offset] << 8) + this[offset + 1]) << 8) + this[offset + 2]) << 8) + this[offset + 3] : (((((this[offset + 3] << 8) + this[offset + 2]) << 8) + this[offset + 1]) << 8) + this[offset];
  return (longVal > 2147483647) ? longVal - 4294967296 : longVal;
};

Buffer.prototype.getString = function (offset, length) {
  var string = [];
  for (var i = offset; i < offset + length; i++) {
    string.push(String.fromCharCode(this[i]));
  }
  return string.join('');
};

/***/ }),
/* 152 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jslint node: true */


var assert = __webpack_require__(32);
var fs = __webpack_require__(2);
var util = __webpack_require__(7);
var BufferExtender = __webpack_require__(151); // bad idea
var debug = __webpack_require__(149)('exif');

var DEFAULT_MAX_ENTRIES=128;

/**
 * Represents an image with Exif information. When instantiating it you have to
 * provide an image and a callback function which is called once all metadata
 * is extracted from the image.
 *
 * Available options are:
 *  - image The image to get Exif data from can be either a filesystem path or
 *          a Buffer.
 *  - tiffOffsets  (boolean) an object named "offsets" is added to exifData 
 *          and contains lot of offsets needed to get thumbnail and other things. 
 *  - fixThumbnailOffset:  node-exif corrects the thumbnail offset in order to have an offset from the start of the buffer/file.
 *  - maxEntries: Specifies the maximum entries to be parsed
 *  - ifd0MaxEntries
 *  - ifd1MaxEntries
 *  - maxGpsEntries
 *  - maxInteroperabilityEntries
 *  - agfaMaxEntries 
 *  - epsonMaxEntries
 *  - fujifilmMaxEntries
 *  - olympusMaxEntries
 *  - panasonicMaxEntries
 *  - sanyoMaxEntries
 *  - noPadding
 *
 * If you don't set the image field, you might call  exifImage.loadImage(image, callback) to get exif datas. 
 *
 * @param options Configuration options as described above
 * @param callback Function to call when data is extracted or an error occurred
 * @return Nothing of importance, calls the specified callback function instead
 */
function ExifImage (options, callback) {
  if (!(this instanceof ExifImage)) {
    if (typeof(options)==="string") {
      options = {
          image: options
      }
    }

    assert(typeof(options)==="object", "Invalid options object");
    
    var exifImage = new ExifImage(options, function(error, data) {
      if (error) {
        return callback(error);
      }
      
      callback(null, data, options.image);      
    });
    
    return exifImage;
  }

  if (typeof(options)==="string") {
    options= {
        image: options
    }
  } else if (options instanceof Buffer) {
    options= {
        image: options
    }
  }
  
  var ops={};
  if (options) {
    for(var k in options) {
      ops[k]=options[k];
    }
  }
  this.options=ops;

  // Default option values
  ["ifd0MaxEntries", "ifd1MaxEntries", "maxGpsEntries", "maxInteroperabilityEntries", "agfaMaxEntries", "epsonMaxEntries", 
     "fujifilmMaxEntries", "olympusMaxEntries", "panasonicMaxEntries", "sanyoMaxEntries"].forEach(function(p) {
       if (ops[p]===undefined) {
         ops[p]=DEFAULT_MAX_ENTRIES;
       }
     });

  this.exifData = {
    image : {},                 // Information about the main image
    thumbnail : {},             // Information about the thumbnail
    exif : {},                  // Exif information
    gps : {},                   // GPS information
    interoperability: {},       // Exif Interoperability information
    makernote : {}              // Makernote information
  };
   
  this.offsets={};
  if (ops.tiffOffsets) {
    exifData.offsets=offsets;
  }
  
  debug("New ExifImage options=",options);

  if (!ops.image) {
    // If options image is not specified, the developper must call loadImage() to parse the image.
//    callback(new Error('You have to provide an image, it is pretty hard to extract Exif data from nothing...'));
    return;
  }

  if (typeof callback !== 'function') {
    throw new Error('You have to provide a callback function.');
  }
 
  var self=this;
  setImmediate(function() {
    self.loadImage(ops.image, function (error, exifData) {
      if (error) {
        return callback(error);
      }
    
      callback(null, exifData, ops.image);
    });
  });
}

ExifImage.ExifImage=ExifImage;

module.exports = ExifImage;

/**
 * Load image and parse exifDatas
 *
 * @param [String|Buffer] image the image
 * @param callback a callback which is called when exif datas are parsed.
 * @return Nothing
 */
ExifImage.prototype.loadImage = function (image, callback) {
  assert(typeof(callback)==="function", "Callback must be a function");
  
  var self = this;

  debug("loadImage image=", image);
  
  if (image.constructor.name === 'Buffer') {
    this.processImage("Buffer", image, callback);
    return;
  }
  
  if (image.constructor.name === 'String') {
    fs.readFile(image, function (error, data) {
      if (error) {
        callback(new Error('Encountered the following error while trying to read given image: '+error));
        return;
      }

      self.processImage("File: "+image, data, callback);
    });
    return;
  }

  callback(new Error('Given image is neither a buffer nor a file, please provide one of these.'));
};

ExifImage.prototype.processImage = function (source, data, callback) {
  assert(typeof(source)==="string", "Source must be a string");
  assert(typeof(callback)==="function", "Callback must be a function");
  
  var offset = 0;

  if (data[offset++] != 0xFF || data[offset++] != 0xD8) {
    var e=new Error('The given image is not a JPEG and thus unsupported right now.');
    e.source=source;
    e.code="NOT_A_JPEG";
    callback(e);
    return;
  }

  this.imageType = 'JPEG';

  while (offset < data.length) {

    if (data[offset++] != 0xFF) {
      break;
    }

    if (data[offset++] == 0xE1) {
      try {
        this.extractExifData(data, offset + 2, data.getShort(offset, true) - 2);

      } catch (error) {
        error.code="PARSING_ERROR";
        error.source=source;        

        debug("Extract exif data error source=", source, "offset=", offset, "error=",error);
        
        callback(error);
        return;
      }
      
      debug("Extract exif data success source=", source, "exifData=",this.exifData);

      callback(null, this.exifData);
      return;
    }

    offset += data.getShort(offset, true);
  }

  var e2=new Error('No Exif segment found in the given image.');
  e2.source=source;
  e2.code="NO_EXIF_SEGMENT";
  
  callback(e2);
};

ExifImage.prototype.extractExifData = function (data, start, length) {

  var exifData=this.exifData;
  var tiffOffset = start + 6;
  var ifdOffset, numberOfEntries;
  var noPadding = (this.options.noPadding!==false);
  
  this.offsets.tiff=tiffOffset;

  // Exif data always starts with Exif\0\0
  if (data.toString('utf8', start, tiffOffset) != 'Exif\0\0') {
    throw new Error('The Exif data is not valid.');
  }

  // After the Exif start we either have 0x4949 if the following data is
  // stored in big endian or 0x4D4D if it is stored in little endian
  if (data.getShort(tiffOffset) == 0x4949) {
    this.isBigEndian = false;
    
  } else if (data.getShort(tiffOffset) == 0x4D4D) {
    this.isBigEndian = true;
    
  } else {
    throw new Error('Invalid TIFF data! Expected 0x4949 or 0x4D4D at offset '+(tiffOffset)+' but found 0x'+data[tiffOffset].toString(16).toUpperCase()+data[tiffOffset + 1].toString(16).toUpperCase()+".");
  }

  debug("BigEndian=",this.isBigEndian);
  
  // Valid TIFF headers always have 0x002A here
  if (data.getShort(tiffOffset + 2, this.isBigEndian) != 0x002A) {
    var expected = (this.isBigEndian) ? '0x002A' : '0x2A00';
    throw new Error('Invalid TIFF data! Expected '+expected+' at offset '+(tiffOffset + 2)+' but found 0x'+data[tiffOffset + 2].toString(16).toUpperCase()+data[tiffOffset + 3].toString(16).toUpperCase()+".");
  }

  /********************************* IFD0 **********************************/

  // Offset to IFD0 which is always followed by two bytes with the amount of
  // entries in this IFD
  ifdOffset = tiffOffset + data.getLong(tiffOffset + 4, this.isBigEndian);
  this.offsets.ifd0=ifdOffset;
  
  numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
  if (this.options.ifd0MaxEntries) {
    numberOfEntries=Math.min(numberOfEntries, this.options.ifd0MaxEntries);
  }

  debug("IFD0 ifdOffset=",ifdOffset, "numberOfEntries=", numberOfEntries);

  // Each IFD entry consists of 12 bytes which we loop through and extract
  // the data from
  for (var i = 0; i < numberOfEntries; i++) {
    var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
    if (!exifEntry) {
      continue;
    }
    
    if (exifEntry.tagId===0xEA1C && noPadding) {
      continue;
    }
    
    exifData.image[exifEntry.tagName] = exifEntry.value;
  }

  debug("IFD0 parsed", exifData.image);

  /********************************* IFD1 **********************************/

  // Check if there is an offset for IFD1. If so it is always followed by two
  // bytes with the amount of entries in this IFD, if not there is no IFD1
  var nextIfdOffset = data.getLong(ifdOffset + 2 + (numberOfEntries * 12), this.isBigEndian)
  if (nextIfdOffset != 0x00000000) {
    ifdOffset = tiffOffset + nextIfdOffset;
    this.offsets.ifd1=ifdOffset;
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
    if (this.options.ifd1MaxEntries) {
      numberOfEntries=Math.min(numberOfEntries, this.options.ifd1MaxEntries);
    }

    debug("IFD1 ifdOffset=",ifdOffset, "numberOfEntries=", numberOfEntries);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (!exifEntry) {
        continue;
      }

      if (exifEntry.tagId===0xEA1C && noPadding) {
        continue;
      }
                  
      exifData.thumbnail[exifEntry.tagName] = exifEntry.value;
    }
    
    if (this.options.fixThumbnailOffset) {
      var thumbnailOffset=exifData.thumbnail[ExifImage.TAGS.exif[0x0201]];
      if (thumbnailOffset) {
        debug("IFD1 fix thumbnail offset, add=",this.offsets.tiff);
        
        exifData.thumbnail[ExifImage.TAGS.exif[0x0201]]+=this.offsets.tiff;
      }
    }

    debug("IFD1 parsed", exifData.thumbnail);
  }

  /******************************* EXIF IFD ********************************/

  // Look for a pointer to the Exif IFD in IFD0 and extract information from
  // it if available
  if (exifData.image[ExifImage.TAGS.exif[0x8769]]) {

    ifdOffset = tiffOffset + exifData.image[ExifImage.TAGS.exif[0x8769]];
    this.offsets.tags=ifdOffset;
    
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
    if (this.options.maxEntries) {
      numberOfEntries=Math.min(numberOfEntries, this.options.maxEntries);
    }
    
    debug("EXIF IFD ifdOffset=",ifdOffset, "numberOfEntries=", numberOfEntries);
    
    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (!exifEntry) {
        continue;
      }

      if (exifEntry.tagId===0xEA1C && noPadding) {
        continue;
      }
            
      exifData.exif[exifEntry.tagName] = exifEntry.value;
    }

    debug("EXIF IFD parsed",exifData.exif);
  }

  /******************************** GPS IFD ********************************/

  // Look for a pointer to the GPS IFD in IFD0 and extract information from
  // it if available
  if (exifData.image[ExifImage.TAGS.exif[0x8825]]) {

    ifdOffset = tiffOffset + exifData.image[ExifImage.TAGS.exif[0x8825]];
    this.offsets.gps=ifdOffset;

    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
    if (this.options.maxGpsEntries) {
      numberOfEntries=Math.min(numberOfEntries, this.options.maxGpsEntries);
    }
    
    debug("GPS IFD ifdOffset=", ifdOffset, "numberOfEntries=", numberOfEntries);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.gps);
      if (!exifEntry) {
        continue;
      }

      if (exifEntry.tagId===0xEA1C && noPadding) {
        continue;
      }
      
      exifData.gps[exifEntry.tagName] = exifEntry.value;
    }

    debug("GPS IFD parsed",exifData.gps);
   }

  /************************* Interoperability IFD **************************/

  // Look for a pointer to the interoperatbility IFD in the Exif IFD and
  // extract information from it if available
  if (exifData.exif[ExifImage.TAGS.exif[0xA005]]) {

    ifdOffset = tiffOffset + exifData.exif[ExifImage.TAGS.exif[0xA005]];
    this.offsets.interoperability=ifdOffset;
    
    numberOfEntries = data.getShort(ifdOffset, this.isBigEndian);
    if (this.options.maxInteroperabilityEntries) {
      numberOfEntries=Math.min(numberOfEntries, this.options.maxInteroperabilityEntries);
    }
    
    debug("Interoperability IFD ifdOffset=", ifdOffset, "numberOfEntries=", numberOfEntries);

    // Each IFD entry consists of 12 bytes which we loop through and extract
    // the data from
    for (var i = 0; i < numberOfEntries; i++) {
      var exifEntry = this.extractExifEntry(data, (ifdOffset + 2 + (i * 12)), tiffOffset, this.isBigEndian, ExifImage.TAGS.exif);
      if (!exifEntry) {
        break;
      }

      if (exifEntry.tagId===0xEA1C && noPadding) {
        continue;
      }
            
      exifData.interoperability[exifEntry.tagName] = exifEntry.value;
   }

    debug("Interoperability IFD parsed",exifData.gps);
  }

  /***************************** Makernote IFD *****************************/

  // Look for Makernote data in the Exif IFD, check which type of proprietary
  // Makernotes the image contains, load the respective functionality and
  // start the extraction
  if (typeof exifData.exif[ExifImage.TAGS.exif[0x927C]] != "undefined") {

    var type;
    // Check the header to see what kind of Makernote we are dealing with
    if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "OLYMP\x00\x01" || exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "OLYMP\x00\x02") {
      type="olympus"

    } else if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 7) === "AGFA \x00\x01") {
      type="agfa";

    } else if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 8) === "EPSON\x00\x01\x00") {
      type="epson";

    } else if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 8) === "FUJIFILM") {
      type="fujifilm";

    } else if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 9) === "Panasonic") {
      type="panasonic";

    } else if (exifData.exif[ExifImage.TAGS.exif[0x927C]].getString(0, 5) === "SANYO") {
      type="sanyo";
    }
   

    debug("Makernote IFD ifdOffset=", ifdOffset, "type=", type);

    if (type) {
      var extractMakernotes = __webpack_require__(154)("./"+type).extractMakernotes;

      exifData.makernote = extractMakernotes.call(this, data, this.makernoteOffset, tiffOffset);
      
    } else {      
      // Makernotes are available but the format is not recognized so
      // an error message is pushed instead, this ain't the best
      // solution but should do for now
       exifData.makernote['error'] = 'Unable to extract Makernote information as it is in an unsupported or unrecognized format.';    
    }

    debug("Makernote IFD parsed",exifData.makernote);
  }
};

ExifImage.prototype.extractExifEntry = function (data, entryOffset, tiffOffset, isBigEndian, tags) {

  var entry = {
    tag : data.slice(entryOffset, entryOffset + 2),
    tagId : null,
    tagName : null,
    format : data.getShort(entryOffset + 2, isBigEndian),
    components : data.getLong(entryOffset + 4, isBigEndian),
    valueOffset: null,
    value : []
  }

  entry.tagId = entry.tag.getShort(0, isBigEndian);

  // The tagId may correspond to more then one tagName so check which
  if (tags && tags[entry.tagId] && typeof tags[entry.tagId] == "function") {
    entry.tagName = tags[entry.tagId].call(this, entry);    
    if (!entry.tagName) {
      return false;
    }

  // The tagId corresponds to exactly one tagName
  } else if (tags && tags[entry.tagId]) {
    entry.tagName = tags[entry.tagId];
    if (entry.tagName===undefined) {
      return false;
    }

  // The tagId is not recognized
  } else {
    return false;
  }

  switch (entry.format) {

    case 0x0001: // unsigned byte, 1 byte per component
      entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getByte(entry.valueOffset + i));
      break;

    case 0x0002: // ascii strings, 1 byte per component
      entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      entry.value = data.getString(entry.valueOffset, entry.components);
      if (entry.value[entry.value.length - 1] === "\u0000") // Trim null terminated strings
        entry.value = entry.value.substring(0, entry.value.length - 1);
      break;

    case 0x0003: // unsigned short, 2 byte per component
      entry.valueOffset = (entry.components <= 2) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getShort(entry.valueOffset + i * 2, isBigEndian));
      break;

    case 0x0004: // unsigned long, 4 byte per component
      entry.valueOffset = (entry.components == 1) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getLong(entry.valueOffset + i * 4, isBigEndian));
      break;

    case 0x0005: // unsigned rational, 8 byte per component (4 byte numerator and 4 byte denominator)
      entry.valueOffset = data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getLong(entry.valueOffset + i * 8, isBigEndian) / data.getLong(entry.valueOffset + i * 8 + 4, isBigEndian));
      break;

    case 0x0006: // signed byte, 1 byte per component
      entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getSignedByte(entry.valueOffset + i));
      break;

    case 0x0007: // undefined, 1 byte per component
      entry.valueOffset = (entry.components <= 4) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      entry.value.push(data.slice(entry.valueOffset, entry.valueOffset + entry.components));
      break;

    case 0x0008: // signed short, 2 byte per component
      entry.valueOffset = (entry.components <= 2) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getSignedShort(entry.valueOffset + i * 2, isBigEndian));
      break;

    case 0x0009: // signed long, 4 byte per component
      entry.valueOffset = (entry.components == 1) ? entryOffset + 8 : data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getSignedLong(entry.valueOffset + i * 4, isBigEndian));
      break;

    case 0x000A: // signed rational, 8 byte per component (4 byte numerator and 4 byte denominator)
      entry.valueOffset = data.getLong(entryOffset + 8, isBigEndian) + tiffOffset;
      for (var i = 0; i < entry.components; i++)
        entry.value.push(data.getSignedLong(entry.valueOffset + i * 8, isBigEndian) / data.getSignedLong(entry.valueOffset + i * 8 + 4, isBigEndian));
      break;

    default:
      return false;

  }

  // If this is the Makernote tag save its offset for later use
  if (entry.tagName === "MakerNote") {
    this.offsets.makernoteOffset = entry.valueOffset;
  }

  // If the value array has only one element we don't need an array
  if (entry.value.length == 1) {
    entry.value = entry.value[0];
  }

  return entry;
};

/**
 * Comprehensive list of TIFF and Exif tags found on
 * http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/EXIF.html
 */
ExifImage.TAGS = {

  // Exif tags
  exif : {

    0x0001 : "InteropIndex",
    0x0002 : "InteropVersion",
    0x000B : "ProcessingSoftware",
    0x00FE : "SubfileType",
    0x00FF : "OldSubfileType",
    0x0100 : "ImageWidth",
    0x0101 : "ImageHeight",
    0x0102 : "BitsPerSample",
    0x0103 : "Compression",
    0x0106 : "PhotometricInterpretation",
    0x0107 : "Thresholding",
    0x0108 : "CellWidth",
    0x0109 : "CellLength",
    0x010A : "FillOrder",
    0x010D : "DocumentName",
    0x010E : "ImageDescription",
    0x010F : "Make",
    0x0110 : "Model",
    0x0111 : "StripOffsets",
    0x0112 : "Orientation",
    0x0115 : "SamplesPerPixel",
    0x0116 : "RowsPerStrip",
    0x0117 : "StripByteCounts",
    0x0118 : "MinSampleValue",
    0x0119 : "MaxSampleValue",
    0x011A : "XResolution",
    0x011B : "YResolution",
    0x011C : "PlanarConfiguration",
    0x011D : "PageName",
    0x011E : "XPosition",
    0x011F : "YPosition",
    0x0120 : "FreeOffsets",
    0x0121 : "FreeByteCounts",
    0x0122 : "GrayResponseUnit",
    0x0123 : "GrayResponseCurve",
    0x0124 : "T4Options",
    0x0125 : "T6Options",
    0x0128 : "ResolutionUnit",
    0x0129 : "PageNumber",
    0x012C : "ColorResponseUnit",
    0x012D : "TransferFunction",
    0x0131 : "Software",
    0x0132 : "ModifyDate",
    0x013B : "Artist",
    0x013C : "HostComputer",
    0x013D : "Predictor",
    0x013E : "WhitePoint",
    0x013F : "PrimaryChromaticities",
    0x0140 : "ColorMap",
    0x0141 : "HalftoneHints",
    0x0142 : "TileWidth",
    0x0143 : "TileLength",
    0x0144 : "TileOffsets",
    0x0145 : "TileByteCounts",
    0x0146 : "BadFaxLines",
    0x0147 : "CleanFaxData",
    0x0148 : "ConsecutiveBadFaxLines",
    0x014A : "SubIFD",
    0x014C : "InkSet",
    0x014D : "InkNames",
    0x014E : "NumberofInks",
    0x0150 : "DotRange",
    0x0151 : "TargetPrinter",
    0x0152 : "ExtraSamples",
    0x0153 : "SampleFormat",
    0x0154 : "SMinSampleValue",
    0x0155 : "SMaxSampleValue",
    0x0156 : "TransferRange",
    0x0157 : "ClipPath",
    0x0158 : "XClipPathUnits",
    0x0159 : "YClipPathUnits",
    0x015A : "Indexed",
    0x015B : "JPEGTables",
    0x015F : "OPIProxy",
    0x0190 : "GlobalParametersIFD",
    0x0191 : "ProfileType",
    0x0192 : "FaxProfile",
    0x0193 : "CodingMethods",
    0x0194 : "VersionYear",
    0x0195 : "ModeNumber",
    0x01B1 : "Decode",
    0x01B2 : "DefaultImageColor",
    0x01B3 : "T82Options",
    0x01B5 : "JPEGTables",
    0x0200 : "JPEGProc",
    0x0201 : "ThumbnailOffset",
    0x0202 : "ThumbnailLength",
    0x0203 : "JPEGRestartInterval",
    0x0205 : "JPEGLosslessPredictors",
    0x0206 : "JPEGPointTransforms",
    0x0207 : "JPEGQTables",
    0x0208 : "JPEGDCTables",
    0x0209 : "JPEGACTables",
    0x0211 : "YCbCrCoefficients",
    0x0212 : "YCbCrSubSampling",
    0x0213 : "YCbCrPositioning",
    0x0214 : "ReferenceBlackWhite",
    0x022F : "StripRowCounts",
    0x02BC : "ApplicationNotes",
    0x03E7 : "USPTOMiscellaneous",
    0x1000 : "RelatedImageFileFormat",
    0x1001 : "RelatedImageWidth",
    0x1002 : "RelatedImageHeight",
    0x4746 : "Rating",
    0x4747 : "XP_DIP_XML",
    0x4748 : "StitchInfo",
    0x4749 : "RatingPercent",
    0x800D : "ImageID",
    0x80A3 : "WangTag1",
    0x80A4 : "WangAnnotation",
    0x80A5 : "WangTag3",
    0x80A6 : "WangTag4",
    0x80E3 : "Matteing",
    0x80E4 : "DataType",
    0x80E5 : "ImageDepth",
    0x80E6 : "TileDepth",
    0x827D : "Model2",
    0x828D : "CFARepeatPatternDim",
    0x828E : "CFAPattern2",
    0x828F : "BatteryLevel",
    0x8290 : "KodakIFD",
    0x8298 : "Copyright",
    0x829A : "ExposureTime",
    0x829D : "FNumber",
    0x82A5 : "MDFileTag",
    0x82A6 : "MDScalePixel",
    0x82A7 : "MDColorTable",
    0x82A8 : "MDLabName",
    0x82A9 : "MDSampleInfo",
    0x82AA : "MDPrepDate",
    0x82AB : "MDPrepTime",
    0x82AC : "MDFileUnits",
    0x830E : "PixelScale",
    0x8335 : "AdventScale",
    0x8336 : "AdventRevision",
    0x835C : "UIC1Tag",
    0x835D : "UIC2Tag",
    0x835E : "UIC3Tag",
    0x835F : "UIC4Tag",
    0x83BB : "IPTC-NAA",
    0x847E : "IntergraphPacketData",
    0x847F : "IntergraphFlagRegisters",
    0x8480 : "IntergraphMatrix",
    0x8481 : "INGRReserved",
    0x8482 : "ModelTiePoint",
    0x84E0 : "Site",
    0x84E1 : "ColorSequence",
    0x84E2 : "IT8Header",
    0x84E3 : "RasterPadding",
    0x84E4 : "BitsPerRunLength",
    0x84E5 : "BitsPerExtendedRunLength",
    0x84E6 : "ColorTable",
    0x84E7 : "ImageColorIndicator",
    0x84E8 : "BackgroundColorIndicator",
    0x84E9 : "ImageColorValue",
    0x84EA : "BackgroundColorValue",
    0x84EB : "PixelIntensityRange",
    0x84EC : "TransparencyIndicator",
    0x84ED : "ColorCharacterization",
    0x84EE : "HCUsage",
    0x84EF : "TrapIndicator",
    0x84F0 : "CMYKEquivalent",
    0x8546 : "SEMInfo",
    0x8568 : "AFCP_IPTC",
    0x85B8 : "PixelMagicJBIGOptions",
    0x85D8 : "ModelTransform",
    0x8602 : "WB_GRGBLevels",
    0x8606 : "LeafData",
    0x8649 : "PhotoshopSettings",
    0x8769 : "ExifOffset",
    0x8773 : "ICC_Profile",
    0x877F : "TIFF_FXExtensions",
    0x8780 : "MultiProfiles",
    0x8781 : "SharedData",
    0x8782 : "T88Options",
    0x87AC : "ImageLayer",
    0x87AF : "GeoTiffDirectory",
    0x87B0 : "GeoTiffDoubleParams",
    0x87B1 : "GeoTiffAsciiParams",
    0x8822 : "ExposureProgram",
    0x8824 : "SpectralSensitivity",
    0x8825 : "GPSInfo",
    0x8827 : "ISO",
    0x8828 : "Opto-ElectricConvFactor",
    0x8829 : "Interlace",
    0x882A : "TimeZoneOffset",
    0x882B : "SelfTimerMode",
    0x8830 : "SensitivityType",
    0x8831 : "StandardOutputSensitivity",
    0x8832 : "RecommendedExposureIndex",
    0x8833 : "ISOSpeed",
    0x8834 : "ISOSpeedLatitudeyyy",
    0x8835 : "ISOSpeedLatitudezzz",
    0x885C : "FaxRecvParams",
    0x885D : "FaxSubAddress",
    0x885E : "FaxRecvTime",
    0x888A : "LeafSubIFD",
    0x9000 : "ExifVersion",
    0x9003 : "DateTimeOriginal",
    0x9004 : "CreateDate",
    0x9101 : "ComponentsConfiguration",
    0x9102 : "CompressedBitsPerPixel",
    0x9201 : "ShutterSpeedValue",
    0x9202 : "ApertureValue",
    0x9203 : "BrightnessValue",
    0x9204 : "ExposureCompensation",
    0x9205 : "MaxApertureValue",
    0x9206 : "SubjectDistance",
    0x9207 : "MeteringMode",
    0x9208 : "LightSource",
    0x9209 : "Flash",
    0x920A : "FocalLength",
    0x920B : "FlashEnergy",
    0x920C : "SpatialFrequencyResponse",
    0x920D : "Noise",
    0x920E : "FocalPlaneXResolution",
    0x920F : "FocalPlaneYResolution",
    0x9210 : "FocalPlaneResolutionUnit",
    0x9211 : "ImageNumber",
    0x9212 : "SecurityClassification",
    0x9213 : "ImageHistory",
    0x9214 : "SubjectArea",
    0x9215 : "ExposureIndex",
    0x9216 : "TIFF-EPStandardID",
    0x9217 : "SensingMethod",
    0x923A : "CIP3DataFile",
    0x923B : "CIP3Sheet",
    0x923C : "CIP3Side",
    0x923F : "StoNits",
    0x927C : "MakerNote",
    0x9286 : "UserComment",
    0x9290 : "SubSecTime",
    0x9291 : "SubSecTimeOriginal",
    0x9292 : "SubSecTimeDigitized",
    0x932F : "MSDocumentText",
    0x9330 : "MSPropertySetStorage",
    0x9331 : "MSDocumentTextPosition",
    0x935C : "ImageSourceData",
    0x9C9B : "XPTitle",
    0x9C9C : "XPComment",
    0x9C9D : "XPAuthor",
    0x9C9E : "XPKeywords",
    0x9C9F : "XPSubject",
    0xA000 : "FlashpixVersion",
    0xA001 : "ColorSpace",
    0xA002 : "ExifImageWidth",
    0xA003 : "ExifImageHeight",
    0xA004 : "RelatedSoundFile",
    0xA005 : "InteropOffset",
    0xA20B : "FlashEnergy",
    0xA20C : "SpatialFrequencyResponse",
    0xA20D : "Noise",
    0xA20E : "FocalPlaneXResolution",
    0xA20F : "FocalPlaneYResolution",
    0xA210 : "FocalPlaneResolutionUnit",
    0xA211 : "ImageNumber",
    0xA212 : "SecurityClassification",
    0xA213 : "ImageHistory",
    0xA214 : "SubjectLocation",
    0xA215 : "ExposureIndex",
    0xA216 : "TIFF-EPStandardID",
    0xA217 : "SensingMethod",
    0xA300 : "FileSource",
    0xA301 : "SceneType",
    0xA302 : "CFAPattern",
    0xA401 : "CustomRendered",
    0xA402 : "ExposureMode",
    0xA403 : "WhiteBalance",
    0xA404 : "DigitalZoomRatio",
    0xA405 : "FocalLengthIn35mmFormat",
    0xA406 : "SceneCaptureType",
    0xA407 : "GainControl",
    0xA408 : "Contrast",
    0xA409 : "Saturation",
    0xA40A : "Sharpness",
    0xA40B : "DeviceSettingDescription",
    0xA40C : "SubjectDistanceRange",
    0xA420 : "ImageUniqueID",
    0xA430 : "OwnerName",
    0xA431 : "SerialNumber",
    0xA432 : "LensInfo",
    0xA433 : "LensMake",
    0xA434 : "LensModel",
    0xA435 : "LensSerialNumber",
    0xA480 : "GDALMetadata",
    0xA481 : "GDALNoData",
    0xA500 : "Gamma",
    0xAFC0 : "ExpandSoftware",
    0xAFC1 : "ExpandLens",
    0xAFC2 : "ExpandFilm",
    0xAFC3 : "ExpandFilterLens",
    0xAFC4 : "ExpandScanner",
    0xAFC5 : "ExpandFlashLamp",
    0xBC01 : "PixelFormat",
    0xBC02 : "Transformation",
    0xBC03 : "Uncompressed",
    0xBC04 : "ImageType",
    0xBC80 : "ImageWidth",
    0xBC81 : "ImageHeight",
    0xBC82 : "WidthResolution",
    0xBC83 : "HeightResolution",
    0xBCC0 : "ImageOffset",
    0xBCC1 : "ImageByteCount",
    0xBCC2 : "AlphaOffset",
    0xBCC3 : "AlphaByteCount",
    0xBCC4 : "ImageDataDiscard",
    0xBCC5 : "AlphaDataDiscard",
    0xC427 : "OceScanjobDesc",
    0xC428 : "OceApplicationSelector",
    0xC429 : "OceIDNumber",
    0xC42A : "OceImageLogic",
    0xC44F : "Annotations",
    0xC4A5 : "PrintIM",
    0xC580 : "USPTOOriginalContentType",
    0xC612 : "DNGVersion",
    0xC613 : "DNGBackwardVersion",
    0xC614 : "UniqueCameraModel",
    0xC615 : "LocalizedCameraModel",
    0xC616 : "CFAPlaneColor",
    0xC617 : "CFALayout",
    0xC618 : "LinearizationTable",
    0xC619 : "BlackLevelRepeatDim",
    0xC61A : "BlackLevel",
    0xC61B : "BlackLevelDeltaH",
    0xC61C : "BlackLevelDeltaV",
    0xC61D : "WhiteLevel",
    0xC61E : "DefaultScale",
    0xC61F : "DefaultCropOrigin",
    0xC620 : "DefaultCropSize",
    0xC621 : "ColorMatrix1",
    0xC622 : "ColorMatrix2",
    0xC623 : "CameraCalibration1",
    0xC624 : "CameraCalibration2",
    0xC625 : "ReductionMatrix1",
    0xC626 : "ReductionMatrix2",
    0xC627 : "AnalogBalance",
    0xC628 : "AsShotNeutral",
    0xC629 : "AsShotWhiteXY",
    0xC62A : "BaselineExposure",
    0xC62B : "BaselineNoise",
    0xC62C : "BaselineSharpness",
    0xC62D : "BayerGreenSplit",
    0xC62E : "LinearResponseLimit",
    0xC62F : "CameraSerialNumber",
    0xC630 : "DNGLensInfo",
    0xC631 : "ChromaBlurRadius",
    0xC632 : "AntiAliasStrength",
    0xC633 : "ShadowScale",
    0xC634 : "DNGPrivateData",
    0xC635 : "MakerNoteSafety",
    0xC640 : "RawImageSegmentation",
    0xC65A : "CalibrationIlluminant1",
    0xC65B : "CalibrationIlluminant2",
    0xC65C : "BestQualityScale",
    0xC65D : "RawDataUniqueID",
    0xC660 : "AliasLayerMetadata",
    0xC68B : "OriginalRawFileName",
    0xC68C : "OriginalRawFileData",
    0xC68D : "ActiveArea",
    0xC68E : "MaskedAreas",
    0xC68F : "AsShotICCProfile",
    0xC690 : "AsShotPreProfileMatrix",
    0xC691 : "CurrentICCProfile",
    0xC692 : "CurrentPreProfileMatrix",
    0xC6BF : "ColorimetricReference",
    0xC6D2 : "PanasonicTitle",
    0xC6D3 : "PanasonicTitle2",
    0xC6F3 : "CameraCalibrationSig",
    0xC6F4 : "ProfileCalibrationSig",
    0xC6F5 : "ProfileIFD",
    0xC6F6 : "AsShotProfileName",
    0xC6F7 : "NoiseReductionApplied",
    0xC6F8 : "ProfileName",
    0xC6F9 : "ProfileHueSatMapDims",
    0xC6FA : "ProfileHueSatMapData1",
    0xC6FB : "ProfileHueSatMapData2",
    0xC6FC : "ProfileToneCurve",
    0xC6FD : "ProfileEmbedPolicy",
    0xC6FE : "ProfileCopyright",
    0xC714 : "ForwardMatrix1",
    0xC715 : "ForwardMatrix2",
    0xC716 : "PreviewApplicationName",
    0xC717 : "PreviewApplicationVersion",
    0xC718 : "PreviewSettingsName",
    0xC719 : "PreviewSettingsDigest",
    0xC71A : "PreviewColorSpace",
    0xC71B : "PreviewDateTime",
    0xC71C : "RawImageDigest",
    0xC71D : "OriginalRawFileDigest",
    0xC71E : "SubTileBlockSize",
    0xC71F : "RowInterleaveFactor",
    0xC725 : "ProfileLookTableDims",
    0xC726 : "ProfileLookTableData",
    0xC740 : "OpcodeList1",
    0xC741 : "OpcodeList2",
    0xC74E : "OpcodeList3",
    0xC761 : "NoiseProfile",
    0xC763 : "TimeCodes",
    0xC764 : "FrameRate",
    0xC772 : "TStop",
    0xC789 : "ReelName",
    0xC791 : "OriginalDefaultFinalSize",
    0xC792 : "OriginalBestQualitySize",
    0xC793 : "OriginalDefaultCropSize",
    0xC7A1 : "CameraLabel",
    0xC7A3 : "ProfileHueSatMapEncoding",
    0xC7A4 : "ProfileLookTableEncoding",
    0xC7A5 : "BaselineExposureOffset",
    0xC7A6 : "DefaultBlackRender",
    0xC7A7 : "NewRawImageDigest",
    0xC7A8 : "RawToPreviewGain",
    0xC7B5 : "DefaultUserCrop",
    0xEA1C : "Padding",
    0xEA1D : "OffsetSchema",
    0xFDE8 : "OwnerName",
    0xFDE9 : "SerialNumber",
    0xFDEA : "Lens",
    0xFE00 : "KDC_IFD",
    0xFE4C : "RawFile",
    0xFE4D : "Converter",
    0xFE4E : "WhiteBalance",
    0xFE51 : "Exposure",
    0xFE52 : "Shadows",
    0xFE53 : "Brightness",
    0xFE54 : "Contrast",
    0xFE55 : "Saturation",
    0xFE56 : "Sharpness",
    0xFE57 : "Smoothness",
    0xFE58 : "MoireFilter"

  },

  // GPS Tags
  gps : {

    0x0000 : 'GPSVersionID',
    0x0001 : 'GPSLatitudeRef',
    0x0002 : 'GPSLatitude',
    0x0003 : 'GPSLongitudeRef',
    0x0004 : 'GPSLongitude',
    0x0005 : 'GPSAltitudeRef',
    0x0006 : 'GPSAltitude',
    0x0007 : 'GPSTimeStamp',
    0x0008 : 'GPSSatellites',
    0x0009 : 'GPSStatus',
    0x000A : 'GPSMeasureMode',
    0x000B : 'GPSDOP',
    0x000C : 'GPSSpeedRef',
    0x000D : 'GPSSpeed',
    0x000E : 'GPSTrackRef',
    0x000F : 'GPSTrack',
    0x0010 : 'GPSImgDirectionRef',
    0x0011 : 'GPSImgDirection',
    0x0012 : 'GPSMapDatum',
    0x0013 : 'GPSDestLatitudeRef',
    0x0014 : 'GPSDestLatitude',
    0x0015 : 'GPSDestLongitudeRef',
    0x0016 : 'GPSDestLongitude',
    0x0017 : 'GPSDestBearingRef',
    0x0018 : 'GPSDestBearing',
    0x0019 : 'GPSDestDistanceRef',
    0x001A : 'GPSDestDistance',
    0x001B : 'GPSProcessingMethod',
    0x001C : 'GPSAreaInformation',
    0x001D : 'GPSDateStamp',
    0x001E : 'GPSDifferential',
    0x001F : 'GPSHPositioningError'

  }

};

/***/ }),
/* 153 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(152);

/***/ }),
/* 154 */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./agfa": 74,
	"./agfa.js": 74,
	"./epson": 75,
	"./epson.js": 75,
	"./fujifilm": 76,
	"./fujifilm.js": 76,
	"./olympus": 77,
	"./olympus.js": 77,
	"./panasonic": 78,
	"./panasonic.js": 78,
	"./sanyo": 79,
	"./sanyo.js": 79
};
function webpackContext(req) {
	return __webpack_require__(webpackContextResolve(req));
};
function webpackContextResolve(req) {
	var id = map[req];
	if(!(id + 1)) // check for number or string
		throw new Error("Cannot find module '" + req + "'.");
	return id;
};
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = 154;

/***/ }),
/* 155 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

module.exports = function (buf) {
	if (!(buf && buf.length > 1)) {
		return null;
	}

	if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) {
		return {
			ext: 'jpg',
			mime: 'image/jpeg'
		};
	}

	if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
		return {
			ext: 'png',
			mime: 'image/png'
		};
	}

	if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
		return {
			ext: 'gif',
			mime: 'image/gif'
		};
	}

	if (buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
		return {
			ext: 'webp',
			mime: 'image/webp'
		};
	}

	if (buf[0] === 0x46 && buf[1] === 0x4C && buf[2] === 0x49 && buf[3] === 0x46) {
		return {
			ext: 'flif',
			mime: 'image/flif'
		};
	}

	// needs to be before `tif` check
	if (((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2A && buf[3] === 0x0) || (buf[0] === 0x4D && buf[1] === 0x4D && buf[2] === 0x0 && buf[3] === 0x2A)) && buf[8] === 0x43 && buf[9] === 0x52) {
		return {
			ext: 'cr2',
			mime: 'image/x-canon-cr2'
		};
	}

	if ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2A && buf[3] === 0x0) || (buf[0] === 0x4D && buf[1] === 0x4D && buf[2] === 0x0 && buf[3] === 0x2A)) {
		return {
			ext: 'tif',
			mime: 'image/tiff'
		};
	}

	if (buf[0] === 0x42 && buf[1] === 0x4D) {
		return {
			ext: 'bmp',
			mime: 'image/bmp'
		};
	}

	if (buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0xBC) {
		return {
			ext: 'jxr',
			mime: 'image/vnd.ms-photo'
		};
	}

	if (buf[0] === 0x38 && buf[1] === 0x42 && buf[2] === 0x50 && buf[3] === 0x53) {
		return {
			ext: 'psd',
			mime: 'image/vnd.adobe.photoshop'
		};
	}

	// needs to be before `zip` check
	if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x3 && buf[3] === 0x4 && buf[30] === 0x6D && buf[31] === 0x69 && buf[32] === 0x6D && buf[33] === 0x65 && buf[34] === 0x74 && buf[35] === 0x79 && buf[36] === 0x70 && buf[37] === 0x65 && buf[38] === 0x61 && buf[39] === 0x70 && buf[40] === 0x70 && buf[41] === 0x6C && buf[42] === 0x69 && buf[43] === 0x63 && buf[44] === 0x61 && buf[45] === 0x74 && buf[46] === 0x69 && buf[47] === 0x6F && buf[48] === 0x6E && buf[49] === 0x2F && buf[50] === 0x65 && buf[51] === 0x70 && buf[52] === 0x75 && buf[53] === 0x62 && buf[54] === 0x2B && buf[55] === 0x7A && buf[56] === 0x69 && buf[57] === 0x70) {
		return {
			ext: 'epub',
			mime: 'application/epub+zip'
		};
	}

	// needs to be before `zip` check
	// assumes signed .xpi from addons.mozilla.org
	if (buf[0] === 0x50 && buf[1] === 0x4B && buf[2] === 0x3 && buf[3] === 0x4 && buf[30] === 0x4D && buf[31] === 0x45 && buf[32] === 0x54 && buf[33] === 0x41 && buf[34] === 0x2D && buf[35] === 0x49 && buf[36] === 0x4E && buf[37] === 0x46 && buf[38] === 0x2F && buf[39] === 0x6D && buf[40] === 0x6F && buf[41] === 0x7A && buf[42] === 0x69 && buf[43] === 0x6C && buf[44] === 0x6C && buf[45] === 0x61 && buf[46] === 0x2E && buf[47] === 0x72 && buf[48] === 0x73 && buf[49] === 0x61) {
		return {
			ext: 'xpi',
			mime: 'application/x-xpinstall'
		};
	}

	if (buf[0] === 0x50 && buf[1] === 0x4B && (buf[2] === 0x3 || buf[2] === 0x5 || buf[2] === 0x7) && (buf[3] === 0x4 || buf[3] === 0x6 || buf[3] === 0x8)) {
		return {
			ext: 'zip',
			mime: 'application/zip'
		};
	}

	if (buf[257] === 0x75 && buf[258] === 0x73 && buf[259] === 0x74 && buf[260] === 0x61 && buf[261] === 0x72) {
		return {
			ext: 'tar',
			mime: 'application/x-tar'
		};
	}

	if (buf[0] === 0x52 && buf[1] === 0x61 && buf[2] === 0x72 && buf[3] === 0x21 && buf[4] === 0x1A && buf[5] === 0x7 && (buf[6] === 0x0 || buf[6] === 0x1)) {
		return {
			ext: 'rar',
			mime: 'application/x-rar-compressed'
		};
	}

	if (buf[0] === 0x1F && buf[1] === 0x8B && buf[2] === 0x8) {
		return {
			ext: 'gz',
			mime: 'application/gzip'
		};
	}

	if (buf[0] === 0x42 && buf[1] === 0x5A && buf[2] === 0x68) {
		return {
			ext: 'bz2',
			mime: 'application/x-bzip2'
		};
	}

	if (buf[0] === 0x37 && buf[1] === 0x7A && buf[2] === 0xBC && buf[3] === 0xAF && buf[4] === 0x27 && buf[5] === 0x1C) {
		return {
			ext: '7z',
			mime: 'application/x-7z-compressed'
		};
	}

	if (buf[0] === 0x78 && buf[1] === 0x01) {
		return {
			ext: 'dmg',
			mime: 'application/x-apple-diskimage'
		};
	}

	if (
		(buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && (buf[3] === 0x18 || buf[3] === 0x20) && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) ||
		(buf[0] === 0x33 && buf[1] === 0x67 && buf[2] === 0x70 && buf[3] === 0x35) ||
		(buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && buf[3] === 0x1C && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 && buf[8] === 0x6D && buf[9] === 0x70 && buf[10] === 0x34 && buf[11] === 0x32 && buf[16] === 0x6D && buf[17] === 0x70 && buf[18] === 0x34 && buf[19] === 0x31 && buf[20] === 0x6D && buf[21] === 0x70 && buf[22] === 0x34 && buf[23] === 0x32 && buf[24] === 0x69 && buf[25] === 0x73 && buf[26] === 0x6F && buf[27] === 0x6D) ||
		(buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && buf[3] === 0x1C && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 && buf[8] === 0x69 && buf[9] === 0x73 && buf[10] === 0x6F && buf[11] === 0x6D) ||
		(buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && buf[3] === 0x1c && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 && buf[8] === 0x6D && buf[9] === 0x70 && buf[10] === 0x34 && buf[11] === 0x32 && buf[12] === 0x0 && buf[13] === 0x0 && buf[14] === 0x0 && buf[15] === 0x0)
	) {
		return {
			ext: 'mp4',
			mime: 'video/mp4'
		};
	}

	if ((buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && buf[3] === 0x1C && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 && buf[8] === 0x4D && buf[9] === 0x34 && buf[10] === 0x56)) {
		return {
			ext: 'm4v',
			mime: 'video/x-m4v'
		};
	}

	if (buf[0] === 0x4D && buf[1] === 0x54 && buf[2] === 0x68 && buf[3] === 0x64) {
		return {
			ext: 'mid',
			mime: 'audio/midi'
		};
	}

	// needs to be before the `webm` check
	if (buf[31] === 0x6D && buf[32] === 0x61 && buf[33] === 0x74 && buf[34] === 0x72 && buf[35] === 0x6f && buf[36] === 0x73 && buf[37] === 0x6B && buf[38] === 0x61) {
		return {
			ext: 'mkv',
			mime: 'video/x-matroska'
		};
	}

	if (buf[0] === 0x1A && buf[1] === 0x45 && buf[2] === 0xDF && buf[3] === 0xA3) {
		return {
			ext: 'webm',
			mime: 'video/webm'
		};
	}

	if (buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x0 && buf[3] === 0x14 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
		return {
			ext: 'mov',
			mime: 'video/quicktime'
		};
	}

	if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x41 && buf[9] === 0x56 && buf[10] === 0x49) {
		return {
			ext: 'avi',
			mime: 'video/x-msvideo'
		};
	}

	if (buf[0] === 0x30 && buf[1] === 0x26 && buf[2] === 0xB2 && buf[3] === 0x75 && buf[4] === 0x8E && buf[5] === 0x66 && buf[6] === 0xCF && buf[7] === 0x11 && buf[8] === 0xA6 && buf[9] === 0xD9) {
		return {
			ext: 'wmv',
			mime: 'video/x-ms-wmv'
		};
	}

	if (buf[0] === 0x0 && buf[1] === 0x0 && buf[2] === 0x1 && buf[3].toString(16)[0] === 'b') {
		return {
			ext: 'mpg',
			mime: 'video/mpeg'
		};
	}

	if ((buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) || (buf[0] === 0xFF && buf[1] === 0xfb)) {
		return {
			ext: 'mp3',
			mime: 'audio/mpeg'
		};
	}

	if ((buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70 && buf[8] === 0x4D && buf[9] === 0x34 && buf[10] === 0x41) || (buf[0] === 0x4D && buf[1] === 0x34 && buf[2] === 0x41 && buf[3] === 0x20)) {
		return {
			ext: 'm4a',
			mime: 'audio/m4a'
		};
	}

	// needs to be before `ogg` check
	if (buf[28] === 0x4F && buf[29] === 0x70 && buf[30] === 0x75 && buf[31] === 0x73 && buf[32] === 0x48 && buf[33] === 0x65 && buf[34] === 0x61 && buf[35] === 0x64) {
		return {
			ext: 'opus',
			mime: 'audio/opus'
		};
	}

	if (buf[0] === 0x4F && buf[1] === 0x67 && buf[2] === 0x67 && buf[3] === 0x53) {
		return {
			ext: 'ogg',
			mime: 'audio/ogg'
		};
	}

	if (buf[0] === 0x66 && buf[1] === 0x4C && buf[2] === 0x61 && buf[3] === 0x43) {
		return {
			ext: 'flac',
			mime: 'audio/x-flac'
		};
	}

	if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x41 && buf[10] === 0x56 && buf[11] === 0x45) {
		return {
			ext: 'wav',
			mime: 'audio/x-wav'
		};
	}

	if (buf[0] === 0x23 && buf[1] === 0x21 && buf[2] === 0x41 && buf[3] === 0x4D && buf[4] === 0x52 && buf[5] === 0x0A) {
		return {
			ext: 'amr',
			mime: 'audio/amr'
		};
	}

	if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
		return {
			ext: 'pdf',
			mime: 'application/pdf'
		};
	}

	if (buf[0] === 0x4D && buf[1] === 0x5A) {
		return {
			ext: 'exe',
			mime: 'application/x-msdownload'
		};
	}

	if ((buf[0] === 0x43 || buf[0] === 0x46) && buf[1] === 0x57 && buf[2] === 0x53) {
		return {
			ext: 'swf',
			mime: 'application/x-shockwave-flash'
		};
	}

	if (buf[0] === 0x7B && buf[1] === 0x5C && buf[2] === 0x72 && buf[3] === 0x74 && buf[4] === 0x66) {
		return {
			ext: 'rtf',
			mime: 'application/rtf'
		};
	}

	if (
		(buf[0] === 0x77 && buf[1] === 0x4F && buf[2] === 0x46 && buf[3] === 0x46) &&
		(
			(buf[4] === 0x00 && buf[5] === 0x01 && buf[6] === 0x00 && buf[7] === 0x00) ||
			(buf[4] === 0x4F && buf[5] === 0x54 && buf[6] === 0x54 && buf[7] === 0x4F)
		)
	) {
		return {
			ext: 'woff',
			mime: 'application/font-woff'
		};
	}

	if (
		(buf[0] === 0x77 && buf[1] === 0x4F && buf[2] === 0x46 && buf[3] === 0x32) &&
		(
			(buf[4] === 0x00 && buf[5] === 0x01 && buf[6] === 0x00 && buf[7] === 0x00) ||
			(buf[4] === 0x4F && buf[5] === 0x54 && buf[6] === 0x54 && buf[7] === 0x4F)
		)
	) {
		return {
			ext: 'woff2',
			mime: 'application/font-woff'
		};
	}

	if (
		(buf[34] === 0x4C && buf[35] === 0x50) &&
		(
			(buf[8] === 0x00 && buf[9] === 0x00 && buf[10] === 0x01) ||
			(buf[8] === 0x01 && buf[9] === 0x00 && buf[10] === 0x02) ||
			(buf[8] === 0x02 && buf[9] === 0x00 && buf[10] === 0x02)
		)
	) {
		return {
			ext: 'eot',
			mime: 'application/octet-stream'
		};
	}

	if (buf[0] === 0x00 && buf[1] === 0x01 && buf[2] === 0x00 && buf[3] === 0x00 && buf[4] === 0x00) {
		return {
			ext: 'ttf',
			mime: 'application/font-sfnt'
		};
	}

	if (buf[0] === 0x4F && buf[1] === 0x54 && buf[2] === 0x54 && buf[3] === 0x4F && buf[4] === 0x00) {
		return {
			ext: 'otf',
			mime: 'application/font-sfnt'
		};
	}

	if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) {
		return {
			ext: 'ico',
			mime: 'image/x-icon'
		};
	}

	if (buf[0] === 0x46 && buf[1] === 0x4C && buf[2] === 0x56 && buf[3] === 0x01) {
		return {
			ext: 'flv',
			mime: 'video/x-flv'
		};
	}

	if (buf[0] === 0x25 && buf[1] === 0x21) {
		return {
			ext: 'ps',
			mime: 'application/postscript'
		};
	}

	if (buf[0] === 0xFD && buf[1] === 0x37 && buf[2] === 0x7A && buf[3] === 0x58 && buf[4] === 0x5A && buf[5] === 0x00) {
		return {
			ext: 'xz',
			mime: 'application/x-xz'
		};
	}

	if (buf[0] === 0x53 && buf[1] === 0x51 && buf[2] === 0x4C && buf[3] === 0x69) {
		return {
			ext: 'sqlite',
			mime: 'application/x-sqlite3'
		};
	}

	if (buf[0] === 0x4E && buf[1] === 0x45 && buf[2] === 0x53 && buf[3] === 0x1A) {
		return {
			ext: 'nes',
			mime: 'application/x-nintendo-nes-rom'
		};
	}

	if (buf[0] === 0x43 && buf[1] === 0x72 && buf[2] === 0x32 && buf[3] === 0x34) {
		return {
			ext: 'crx',
			mime: 'application/x-google-chrome-extension'
		};
	}

	if (
		(buf[0] === 0x4D && buf[1] === 0x53 && buf[2] === 0x43 && buf[3] === 0x46) ||
		(buf[0] === 0x49 && buf[1] === 0x53 && buf[2] === 0x63 && buf[3] === 0x28)
	) {
		return {
			ext: 'cab',
			mime: 'application/vnd.ms-cab-compressed'
		};
	}

	// needs to be before `ar` check
	if (buf[0] === 0x21 && buf[1] === 0x3C && buf[2] === 0x61 && buf[3] === 0x72 && buf[4] === 0x63 && buf[5] === 0x68 && buf[6] === 0x3E && buf[7] === 0x0A && buf[8] === 0x64 && buf[9] === 0x65 && buf[10] === 0x62 && buf[11] === 0x69 && buf[12] === 0x61 && buf[13] === 0x6E && buf[14] === 0x2D && buf[15] === 0x62 && buf[16] === 0x69 && buf[17] === 0x6E && buf[18] === 0x61 && buf[19] === 0x72 && buf[20] === 0x79) {
		return {
			ext: 'deb',
			mime: 'application/x-deb'
		};
	}

	if (buf[0] === 0x21 && buf[1] === 0x3C && buf[2] === 0x61 && buf[3] === 0x72 && buf[4] === 0x63 && buf[5] === 0x68 && buf[6] === 0x3E) {
		return {
			ext: 'ar',
			mime: 'application/x-unix-archive'
		};
	}

	if (buf[0] === 0xED && buf[1] === 0xAB && buf[2] === 0xEE && buf[3] === 0xDB) {
		return {
			ext: 'rpm',
			mime: 'application/x-rpm'
		};
	}

	if (
		(buf[0] === 0x1F && buf[1] === 0xA0) ||
		(buf[0] === 0x1F && buf[1] === 0x9D)
	) {
		return {
			ext: 'Z',
			mime: 'application/x-compress'
		};
	}

	if (buf[0] === 0x4C && buf[1] === 0x5A && buf[2] === 0x49 && buf[3] === 0x50) {
		return {
			ext: 'lz',
			mime: 'application/x-lzip'
		};
	}

	if (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0 && buf[4] === 0xA1 && buf[5] === 0xB1 && buf[6] === 0x1A && buf[7] === 0xE1) {
		return {
			ext: 'msi',
			mime: 'application/x-msi'
		};
	}

	return null;
};


/***/ }),
/* 156 */
/***/ (function(module, exports, __webpack_require__) {

module.exports =  false ? require('./lib-cov/fluent-ffmpeg') : __webpack_require__(159);


/***/ }),
/* 157 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var fs = __webpack_require__(2);
var path = __webpack_require__(0);
var async = __webpack_require__(33);
var utils = __webpack_require__(9);

/*
 *! Capability helpers
 */

var avCodecRegexp = /^\s*([D ])([E ])([VAS])([S ])([D ])([T ]) ([^ ]+) +(.*)$/;
var ffCodecRegexp = /^\s*([D\.])([E\.])([VAS])([I\.])([L\.])([S\.]) ([^ ]+) +(.*)$/;
var ffEncodersRegexp = /\(encoders:([^\)]+)\)/;
var ffDecodersRegexp = /\(decoders:([^\)]+)\)/;
var encodersRegexp = /^\s*([VAS\.])([F\.])([S\.])([X\.])([B\.])([D\.]) ([^ ]+) +(.*)$/;
var formatRegexp = /^\s*([D ])([E ]) ([^ ]+) +(.*)$/;
var lineBreakRegexp = /\r\n|\r|\n/;
var filterRegexp = /^(?: [T\.][S\.][C\.] )?([^ ]+) +(AA?|VV?|\|)->(AA?|VV?|\|) +(.*)$/;

var cache = {};

module.exports = function(proto) {
  /**
   * Manually define the ffmpeg binary full path.
   *
   * @method FfmpegCommand#setFfmpegPath
   *
   * @param {String} ffmpegPath The full path to the ffmpeg binary.
   * @return FfmpegCommand
   */
  proto.setFfmpegPath = function(ffmpegPath) {
    cache.ffmpegPath = ffmpegPath;
    return this;
  };

  /**
   * Manually define the ffprobe binary full path.
   *
   * @method FfmpegCommand#setFfprobePath
   *
   * @param {String} ffprobePath The full path to the ffprobe binary.
   * @return FfmpegCommand
   */
  proto.setFfprobePath = function(ffprobePath) {
    cache.ffprobePath = ffprobePath;
    return this;
  };

  /**
   * Manually define the flvtool2/flvmeta binary full path.
   *
   * @method FfmpegCommand#setFlvtoolPath
   *
   * @param {String} flvtool The full path to the flvtool2 or flvmeta binary.
   * @return FfmpegCommand
   */
  proto.setFlvtoolPath = function(flvtool) {
    cache.flvtoolPath = flvtool;
    return this;
  };

  /**
   * Forget executable paths
   *
   * (only used for testing purposes)
   *
   * @method FfmpegCommand#_forgetPaths
   * @private
   */
  proto._forgetPaths = function() {
    delete cache.ffmpegPath;
    delete cache.ffprobePath;
    delete cache.flvtoolPath;
  };

  /**
   * Check for ffmpeg availability
   *
   * If the FFMPEG_PATH environment variable is set, try to use it.
   * If it is unset or incorrect, try to find ffmpeg in the PATH instead.
   *
   * @method FfmpegCommand#_getFfmpegPath
   * @param {Function} callback callback with signature (err, path)
   * @private
   */
  proto._getFfmpegPath = function(callback) {
    if ('ffmpegPath' in cache) {
      return callback(null, cache.ffmpegPath);
    }

    async.waterfall([
      // Try FFMPEG_PATH
      function(cb) {
        if (process.env.FFMPEG_PATH) {
          fs.exists(process.env.FFMPEG_PATH, function(exists) {
            if (exists) {
              cb(null, process.env.FFMPEG_PATH);
            } else {
              cb(null, '');
            }
          });
        } else {
          cb(null, '');
        }
      },

      // Search in the PATH
      function(ffmpeg, cb) {
        if (ffmpeg.length) {
          return cb(null, ffmpeg);
        }

        utils.which('ffmpeg', function(err, ffmpeg) {
          cb(err, ffmpeg);
        });
      }
    ], function(err, ffmpeg) {
      if (err) {
        callback(err);
      } else {
        callback(null, cache.ffmpegPath = (ffmpeg || ''));
      }
    });
  };


  /**
   * Check for ffprobe availability
   *
   * If the FFPROBE_PATH environment variable is set, try to use it.
   * If it is unset or incorrect, try to find ffprobe in the PATH instead.
   * If this still fails, try to find ffprobe in the same directory as ffmpeg.
   *
   * @method FfmpegCommand#_getFfprobePath
   * @param {Function} callback callback with signature (err, path)
   * @private
   */
  proto._getFfprobePath = function(callback) {
    var self = this;

    if ('ffprobePath' in cache) {
      return callback(null, cache.ffprobePath);
    }

    async.waterfall([
      // Try FFPROBE_PATH
      function(cb) {
        if (process.env.FFPROBE_PATH) {
          fs.exists(process.env.FFPROBE_PATH, function(exists) {
            cb(null, exists ? process.env.FFPROBE_PATH : '');
          });
        } else {
          cb(null, '');
        }
      },

      // Search in the PATH
      function(ffprobe, cb) {
        if (ffprobe.length) {
          return cb(null, ffprobe);
        }

        utils.which('ffprobe', function(err, ffprobe) {
          cb(err, ffprobe);
        });
      },

      // Search in the same directory as ffmpeg
      function(ffprobe, cb) {
        if (ffprobe.length) {
          return cb(null, ffprobe);
        }

        self._getFfmpegPath(function(err, ffmpeg) {
          if (err) {
            cb(err);
          } else if (ffmpeg.length) {
            var name = utils.isWindows ? 'ffprobe.exe' : 'ffprobe';
            var ffprobe = path.join(path.dirname(ffmpeg), name);
            fs.exists(ffprobe, function(exists) {
              cb(null, exists ? ffprobe : '');
            });
          } else {
            cb(null, '');
          }
        });
      }
    ], function(err, ffprobe) {
      if (err) {
        callback(err);
      } else {
        callback(null, cache.ffprobePath = (ffprobe || ''));
      }
    });
  };


  /**
   * Check for flvtool2/flvmeta availability
   *
   * If the FLVTOOL2_PATH or FLVMETA_PATH environment variable are set, try to use them.
   * If both are either unset or incorrect, try to find flvtool2 or flvmeta in the PATH instead.
   *
   * @method FfmpegCommand#_getFlvtoolPath
   * @param {Function} callback callback with signature (err, path)
   * @private
   */
   proto._getFlvtoolPath = function(callback) {
    if ('flvtoolPath' in cache) {
      return callback(null, cache.flvtoolPath);
    }

    async.waterfall([
      // Try FLVMETA_PATH
      function(cb) {
        if (process.env.FLVMETA_PATH) {
          fs.exists(process.env.FLVMETA_PATH, function(exists) {
            cb(null, exists ? process.env.FLVMETA_PATH : '');
          });
        } else {
          cb(null, '');
        }
      },

      // Try FLVTOOL2_PATH
      function(flvtool, cb) {
        if (flvtool.length) {
          return cb(null, flvtool);
        }

        if (process.env.FLVTOOL2_PATH) {
          fs.exists(process.env.FLVTOOL2_PATH, function(exists) {
            cb(null, exists ? process.env.FLVTOOL2_PATH : '');
          });
        } else {
          cb(null, '');
        }
      },

      // Search for flvmeta in the PATH
      function(flvtool, cb) {
        if (flvtool.length) {
          return cb(null, flvtool);
        }

        utils.which('flvmeta', function(err, flvmeta) {
          cb(err, flvmeta);
        });
      },

      // Search for flvtool2 in the PATH
      function(flvtool, cb) {
        if (flvtool.length) {
          return cb(null, flvtool);
        }

        utils.which('flvtool2', function(err, flvtool2) {
          cb(err, flvtool2);
        });
      },
    ], function(err, flvtool) {
      if (err) {
        callback(err);
      } else {
        callback(null, cache.flvtoolPath = (flvtool || ''));
      }
    });
  };


  /**
   * A callback passed to {@link FfmpegCommand#availableFilters}.
   *
   * @callback FfmpegCommand~filterCallback
   * @param {Error|null} err error object or null if no error happened
   * @param {Object} filters filter object with filter names as keys and the following
   *   properties for each filter:
   * @param {String} filters.description filter description
   * @param {String} filters.input input type, one of 'audio', 'video' and 'none'
   * @param {Boolean} filters.multipleInputs whether the filter supports multiple inputs
   * @param {String} filters.output output type, one of 'audio', 'video' and 'none'
   * @param {Boolean} filters.multipleOutputs whether the filter supports multiple outputs
   */

  /**
   * Query ffmpeg for available filters
   *
   * @method FfmpegCommand#availableFilters
   * @category Capabilities
   * @aliases getAvailableFilters
   *
   * @param {FfmpegCommand~filterCallback} callback callback function
   */
  proto.availableFilters =
  proto.getAvailableFilters = function(callback) {
    if ('filters' in cache) {
      return callback(null, cache.filters);
    }

    this._spawnFfmpeg(['-filters'], { captureStdout: true, stdoutLines: 0 }, function (err, stdoutRing) {
      if (err) {
        return callback(err);
      }

      var stdout = stdoutRing.get();
      var lines = stdout.split('\n');
      var data = {};
      var types = { A: 'audio', V: 'video', '|': 'none' };

      lines.forEach(function(line) {
        var match = line.match(filterRegexp);
        if (match) {
          data[match[1]] = {
            description: match[4],
            input: types[match[2].charAt(0)],
            multipleInputs: match[2].length > 1,
            output: types[match[3].charAt(0)],
            multipleOutputs: match[3].length > 1
          };
        }
      });

      callback(null, cache.filters = data);
    });
  };


  /**
   * A callback passed to {@link FfmpegCommand#availableCodecs}.
   *
   * @callback FfmpegCommand~codecCallback
   * @param {Error|null} err error object or null if no error happened
   * @param {Object} codecs codec object with codec names as keys and the following
   *   properties for each codec (more properties may be available depending on the
   *   ffmpeg version used):
   * @param {String} codecs.description codec description
   * @param {Boolean} codecs.canDecode whether the codec is able to decode streams
   * @param {Boolean} codecs.canEncode whether the codec is able to encode streams
   */

  /**
   * Query ffmpeg for available codecs
   *
   * @method FfmpegCommand#availableCodecs
   * @category Capabilities
   * @aliases getAvailableCodecs
   *
   * @param {FfmpegCommand~codecCallback} callback callback function
   */
  proto.availableCodecs =
  proto.getAvailableCodecs = function(callback) {
    if ('codecs' in cache) {
      return callback(null, cache.codecs);
    }

    this._spawnFfmpeg(['-codecs'], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
      if (err) {
        return callback(err);
      }

      var stdout = stdoutRing.get();
      var lines = stdout.split(lineBreakRegexp);
      var data = {};

      lines.forEach(function(line) {
        var match = line.match(avCodecRegexp);
        if (match && match[7] !== '=') {
          data[match[7]] = {
            type: { 'V': 'video', 'A': 'audio', 'S': 'subtitle' }[match[3]],
            description: match[8],
            canDecode: match[1] === 'D',
            canEncode: match[2] === 'E',
            drawHorizBand: match[4] === 'S',
            directRendering: match[5] === 'D',
            weirdFrameTruncation: match[6] === 'T'
          };
        }

        match = line.match(ffCodecRegexp);
        if (match && match[7] !== '=') {
          var codecData = data[match[7]] = {
            type: { 'V': 'video', 'A': 'audio', 'S': 'subtitle' }[match[3]],
            description: match[8],
            canDecode: match[1] === 'D',
            canEncode: match[2] === 'E',
            intraFrameOnly: match[4] === 'I',
            isLossy: match[5] === 'L',
            isLossless: match[6] === 'S'
          };

          var encoders = codecData.description.match(ffEncodersRegexp);
          encoders = encoders ? encoders[1].trim().split(' ') : [];

          var decoders = codecData.description.match(ffDecodersRegexp);
          decoders = decoders ? decoders[1].trim().split(' ') : [];

          if (encoders.length || decoders.length) {
            var coderData = {};
            utils.copy(codecData, coderData);
            delete coderData.canEncode;
            delete coderData.canDecode;

            encoders.forEach(function(name) {
              data[name] = {};
              utils.copy(coderData, data[name]);
              data[name].canEncode = true;
            });

            decoders.forEach(function(name) {
              if (name in data) {
                data[name].canDecode = true;
              } else {
                data[name] = {};
                utils.copy(coderData, data[name]);
                data[name].canDecode = true;
              }
            });
          }
        }
      });

      callback(null, cache.codecs = data);
    });
  };


  /**
   * A callback passed to {@link FfmpegCommand#availableEncoders}.
   *
   * @callback FfmpegCommand~encodersCallback
   * @param {Error|null} err error object or null if no error happened
   * @param {Object} encoders encoders object with encoder names as keys and the following
   *   properties for each encoder:
   * @param {String} encoders.description codec description
   * @param {Boolean} encoders.type "audio", "video" or "subtitle"
   * @param {Boolean} encoders.frameMT whether the encoder is able to do frame-level multithreading
   * @param {Boolean} encoders.sliceMT whether the encoder is able to do slice-level multithreading
   * @param {Boolean} encoders.experimental whether the encoder is experimental
   * @param {Boolean} encoders.drawHorizBand whether the encoder supports draw_horiz_band
   * @param {Boolean} encoders.directRendering whether the encoder supports direct encoding method 1
   */

  /**
   * Query ffmpeg for available encoders
   *
   * @method FfmpegCommand#availableEncoders
   * @category Capabilities
   * @aliases getAvailableEncoders
   *
   * @param {FfmpegCommand~encodersCallback} callback callback function
   */
  proto.availableEncoders =
  proto.getAvailableEncoders = function(callback) {
    if ('encoders' in cache) {
      return callback(null, cache.encoders);
    }

    this._spawnFfmpeg(['-encoders'], { captureStdout: true, stdoutLines: 0 }, function(err, stdoutRing) {
      if (err) {
        return callback(err);
      }

      var stdout = stdoutRing.get();
      var lines = stdout.split(lineBreakRegexp);
      var data = {};

      lines.forEach(function(line) {
        var match = line.match(encodersRegexp);
        if (match && match[7] !== '=') {
          data[match[7]] = {
            type: { 'V': 'video', 'A': 'audio', 'S': 'subtitle' }[match[1]],
            description: match[8],
            frameMT: match[2] === 'F',
            sliceMT: match[3] === 'S',
            experimental: match[4] === 'X',
            drawHorizBand: match[5] === 'B',
            directRendering: match[6] === 'D'
          };
        }
      });

      callback(null, cache.encoders = data);
    });
  };


  /**
   * A callback passed to {@link FfmpegCommand#availableFormats}.
   *
   * @callback FfmpegCommand~formatCallback
   * @param {Error|null} err error object or null if no error happened
   * @param {Object} formats format object with format names as keys and the following
   *   properties for each format:
   * @param {String} formats.description format description
   * @param {Boolean} formats.canDemux whether the format is able to demux streams from an input file
   * @param {Boolean} formats.canMux whether the format is able to mux streams into an output file
   */

  /**
   * Query ffmpeg for available formats
   *
   * @method FfmpegCommand#availableFormats
   * @category Capabilities
   * @aliases getAvailableFormats
   *
   * @param {FfmpegCommand~formatCallback} callback callback function
   */
  proto.availableFormats =
  proto.getAvailableFormats = function(callback) {
    if ('formats' in cache) {
      return callback(null, cache.formats);
    }

    // Run ffmpeg -formats
    this._spawnFfmpeg(['-formats'], { captureStdout: true, stdoutLines: 0 }, function (err, stdoutRing) {
      if (err) {
        return callback(err);
      }

      // Parse output
      var stdout = stdoutRing.get();
      var lines = stdout.split(lineBreakRegexp);
      var data = {};

      lines.forEach(function(line) {
        var match = line.match(formatRegexp);
        if (match) {
          match[3].split(',').forEach(function(format) {
            if (!(format in data)) {
              data[format] = {
                description: match[4],
                canDemux: false,
                canMux: false
              };
            }

            if (match[1] === 'D') {
              data[format].canDemux = true;
            }
            if (match[2] === 'E') {
              data[format].canMux = true;
            }
          });
        }
      });

      callback(null, cache.formats = data);
    });
  };


  /**
   * Check capabilities before executing a command
   *
   * Checks whether all used codecs and formats are indeed available
   *
   * @method FfmpegCommand#_checkCapabilities
   * @param {Function} callback callback with signature (err)
   * @private
   */
  proto._checkCapabilities = function(callback) {
    var self = this;
    async.waterfall([
      // Get available formats
      function(cb) {
        self.availableFormats(cb);
      },

      // Check whether specified formats are available
      function(formats, cb) {
        var unavailable;

        // Output format(s)
        unavailable = self._outputs
          .reduce(function(fmts, output) {
            var format = output.options.find('-f', 1);
            if (format) {
              if (!(format[0] in formats) || !(formats[format[0]].canMux)) {
                fmts.push(format);
              }
            }

            return fmts;
          }, []);

        if (unavailable.length === 1) {
          return cb(new Error('Output format ' + unavailable[0] + ' is not available'));
        } else if (unavailable.length > 1) {
          return cb(new Error('Output formats ' + unavailable.join(', ') + ' are not available'));
        }

        // Input format(s)
        unavailable = self._inputs
          .reduce(function(fmts, input) {
            var format = input.options.find('-f', 1);
            if (format) {
              if (!(format[0] in formats) || !(formats[format[0]].canDemux)) {
                fmts.push(format[0]);
              }
            }

            return fmts;
          }, []);

        if (unavailable.length === 1) {
          return cb(new Error('Input format ' + unavailable[0] + ' is not available'));
        } else if (unavailable.length > 1) {
          return cb(new Error('Input formats ' + unavailable.join(', ') + ' are not available'));
        }

        cb();
      },

      // Get available codecs
      function(cb) {
        self.availableEncoders(cb);
      },

      // Check whether specified codecs are available and add strict experimental options if needed
      function(encoders, cb) {
        var unavailable;

        // Audio codec(s)
        unavailable = self._outputs.reduce(function(cdcs, output) {
          var acodec = output.audio.find('-acodec', 1);
          if (acodec && acodec[0] !== 'copy') {
            if (!(acodec[0] in encoders) || encoders[acodec[0]].type !== 'audio') {
              cdcs.push(acodec[0]);
            }
          }

          return cdcs;
        }, []);

        if (unavailable.length === 1) {
          return cb(new Error('Audio codec ' + unavailable[0] + ' is not available'));
        } else if (unavailable.length > 1) {
          return cb(new Error('Audio codecs ' + unavailable.join(', ') + ' are not available'));
        }

        // Video codec(s)
        unavailable = self._outputs.reduce(function(cdcs, output) {
          var vcodec = output.video.find('-vcodec', 1);
          if (vcodec && vcodec[0] !== 'copy') {
            if (!(vcodec[0] in encoders) || encoders[vcodec[0]].type !== 'video') {
              cdcs.push(vcodec[0]);
            }
          }

          return cdcs;
        }, []);

        if (unavailable.length === 1) {
          return cb(new Error('Video codec ' + unavailable[0] + ' is not available'));
        } else if (unavailable.length > 1) {
          return cb(new Error('Video codecs ' + unavailable.join(', ') + ' are not available'));
        }

        cb();
      }
    ], callback);
  };
};


/***/ }),
/* 158 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true, laxcomma:true*/


var spawn = __webpack_require__(47).spawn;


function legacyTag(key) { return key.match(/^TAG:/); }
function legacyDisposition(key) { return key.match(/^DISPOSITION:/); }

function parseFfprobeOutput(out) {
  var lines = out.split(/\r\n|\r|\n/);

  lines = lines.filter(function (line) {
    return line.length > 0;
  });

  var data = {
    streams: [],
    format: {},
    chapters: []
  };

  function parseBlock(name) {
    var data = {};

    var line = lines.shift();
    while (typeof line !== 'undefined') {
      if (line.toLowerCase() == '[/'+name+']') {
        return data;
      } else if (line.match(/^\[/)) {
        line = lines.shift();
        continue;
      }

      var kv = line.match(/^([^=]+)=(.*)$/);
      if (kv) {
        if (!(kv[1].match(/^TAG:/)) && kv[2].match(/^[0-9]+(\.[0-9]+)?$/)) {
          data[kv[1]] = Number(kv[2]);
        } else {
          data[kv[1]] = kv[2];
        }
      }

      line = lines.shift();
    }

    return data;
  }

  var line = lines.shift();
  while (typeof line !== 'undefined') {
    if (line.match(/^\[stream/i)) {
      var stream = parseBlock('stream');
      data.streams.push(stream);
    } else if (line.match(/^\[chapter/i)) {
      var chapter = parseBlock('chapter');
      data.chapters.push(chapter);
    } else if (line.toLowerCase() === '[format]') {
      data.format = parseBlock('format');
    }

    line = lines.shift();
  }

  return data;
}



module.exports = function(proto) {
  /**
   * A callback passed to the {@link FfmpegCommand#ffprobe} method.
   *
   * @callback FfmpegCommand~ffprobeCallback
   *
   * @param {Error|null} err error object or null if no error happened
   * @param {Object} ffprobeData ffprobe output data; this object
   *   has the same format as what the following command returns:
   *
   *     `ffprobe -print_format json -show_streams -show_format INPUTFILE`
   * @param {Array} ffprobeData.streams stream information
   * @param {Object} ffprobeData.format format information
   */

  /**
   * Run ffprobe on last specified input
   *
   * @method FfmpegCommand#ffprobe
   * @category Metadata
   *
   * @param {?Number} [index] 0-based index of input to probe (defaults to last input)
   * @param {?String[]} [options] array of output options to return
   * @param {FfmpegCommand~ffprobeCallback} callback callback function
   *
   */
  proto.ffprobe = function() {
    var input, index = null, options = [], callback;

    // the last argument should be the callback
    var callback = arguments[arguments.length - 1];

    var ended = false
    function handleCallback(err, data) {
      if (!ended) {
        ended = true;
        callback(err, data);
      }
    };

    // map the arguments to the correct variable names
    switch (arguments.length) {
      case 3:
        index = arguments[0];
        options = arguments[1];
        break;
      case 2:
        if (typeof arguments[0] === 'number') {
          index = arguments[0];
        } else if (Array.isArray(arguments[0])) {
          options = arguments[0];
        }
        break;
    }


    if (index === null) {
      if (!this._currentInput) {
        return handleCallback(new Error('No input specified'));
      }

      input = this._currentInput;
    } else {
      input = this._inputs[index];

      if (!input) {
        return handleCallback(new Error('Invalid input index'));
      }
    }

    // Find ffprobe
    this._getFfprobePath(function(err, path) {
      if (err) {
        return handleCallback(err);
      } else if (!path) {
        return handleCallback(new Error('Cannot find ffprobe'));
      }

      var stdout = '';
      var stdoutClosed = false;
      var stderr = '';
      var stderrClosed = false;

      // Spawn ffprobe
      var src = input.isStream ? 'pipe:0' : input.source;
      var ffprobe = spawn(path, ['-show_streams', '-show_format'].concat(options, src));

      if (input.isStream) {
        // Skip errors on stdin. These get thrown when ffprobe is complete and
        // there seems to be no way hook in and close stdin before it throws.
        ffprobe.stdin.on('error', function(err) {
          if (['ECONNRESET', 'EPIPE'].indexOf(err.code) >= 0) { return; }
          handleCallback(err);
        });

        // Once ffprobe's input stream closes, we need no more data from the
        // input
        ffprobe.stdin.on('close', function() {
            input.source.pause();
            input.source.unpipe(ffprobe.stdin);
        });

        input.source.pipe(ffprobe.stdin);
      }

      ffprobe.on('error', callback);

      // Ensure we wait for captured streams to end before calling callback
      var exitError = null;
      function handleExit(err) {
        if (err) {
          exitError = err;
        }

        if (processExited && stdoutClosed && stderrClosed) {
          if (exitError) {
            if (stderr) {
              exitError.message += '\n' + stderr;
            }

            return handleCallback(exitError);
          }

          // Process output
          var data = parseFfprobeOutput(stdout);

          // Handle legacy output with "TAG:x" and "DISPOSITION:x" keys
          [data.format].concat(data.streams).forEach(function(target) {
            if (target) {
              var legacyTagKeys = Object.keys(target).filter(legacyTag);

              if (legacyTagKeys.length) {
                target.tags = target.tags || {};

                legacyTagKeys.forEach(function(tagKey) {
                  target.tags[tagKey.substr(4)] = target[tagKey];
                  delete target[tagKey];
                });
              }

              var legacyDispositionKeys = Object.keys(target).filter(legacyDisposition);

              if (legacyDispositionKeys.length) {
                target.disposition = target.disposition || {};

                legacyDispositionKeys.forEach(function(dispositionKey) {
                  target.disposition[dispositionKey.substr(12)] = target[dispositionKey];
                  delete target[dispositionKey];
                });
              }
            }
          });

          handleCallback(null, data);
        }
      }

      // Handle ffprobe exit
      var processExited = false;
      ffprobe.on('exit', function(code, signal) {
        processExited = true;

        if (code) {
          handleExit(new Error('ffprobe exited with code ' + code));
        } else if (signal) {
          handleExit(new Error('ffprobe was killed with signal ' + signal));
        } else {
          handleExit();
        }
      });

      // Handle stdout/stderr streams
      ffprobe.stdout.on('data', function(data) {
        stdout += data;
      });

      ffprobe.stdout.on('close', function() {
        stdoutClosed = true;
        handleExit();
      });

      ffprobe.stderr.on('data', function(data) {
        stderr += data;
      });

      ffprobe.stderr.on('close', function() {
        stderrClosed = true;
        handleExit();
      });
    });
  };
};


/***/ }),
/* 159 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(__dirname) {/*jshint node:true*/


var path = __webpack_require__(0);
var util = __webpack_require__(7);
var EventEmitter = __webpack_require__(225).EventEmitter;

var utils = __webpack_require__(9);
var ARGLISTS = ['_global', '_audio', '_audioFilters', '_video', '_videoFilters', '_sizeFilters', '_complexFilters'];


/**
 * Create an ffmpeg command
 *
 * Can be called with or without the 'new' operator, and the 'input' parameter
 * may be specified as 'options.source' instead (or passed later with the
 * addInput method).
 *
 * @constructor
 * @param {String|ReadableStream} [input] input file path or readable stream
 * @param {Object} [options] command options
 * @param {Object} [options.logger=<no logging>] logger object with 'error', 'warning', 'info' and 'debug' methods
 * @param {Number} [options.niceness=0] ffmpeg process niceness, ignored on Windows
 * @param {Number} [options.priority=0] alias for `niceness`
 * @param {String} [options.presets="fluent-ffmpeg/lib/presets"] directory to load presets from
 * @param {String} [options.preset="fluent-ffmpeg/lib/presets"] alias for `presets`
 * @param {String} [options.stdoutLines=100] maximum lines of ffmpeg output to keep in memory, use 0 for unlimited
 * @param {Number} [options.timeout=<no timeout>] ffmpeg processing timeout in seconds
 * @param {String|ReadableStream} [options.source=<no input>] alias for the `input` parameter
 */
function FfmpegCommand(input, options) {
  // Make 'new' optional
  if (!(this instanceof FfmpegCommand)) {
    return new FfmpegCommand(input, options);
  }

  EventEmitter.call(this);

  if (typeof input === 'object' && !('readable' in input)) {
    // Options object passed directly
    options = input;
  } else {
    // Input passed first
    options = options || {};
    options.source = input;
  }

  // Add input if present
  this._inputs = [];
  if (options.source) {
    this.input(options.source);
  }

  // Add target-less output for backwards compatibility
  this._outputs = [];
  this.output();

  // Create argument lists
  var self = this;
  ['_global', '_complexFilters'].forEach(function(prop) {
    self[prop] = utils.args();
  });

  // Set default option values
  options.stdoutLines = 'stdoutLines' in options ? options.stdoutLines : 100;
  options.presets = options.presets || options.preset || path.join(__dirname, 'presets');
  options.niceness = options.niceness || options.priority || 0;

  // Save options
  this.options = options;

  // Setup logger
  this.logger = options.logger || {
    debug: function() {},
    info: function() {},
    warn: function() {},
    error: function() {}
  };
}
util.inherits(FfmpegCommand, EventEmitter);
module.exports = FfmpegCommand;


/**
 * Clone an ffmpeg command
 *
 * This method is useful when you want to process the same input multiple times.
 * It returns a new FfmpegCommand instance with the exact same options.
 *
 * All options set _after_ the clone() call will only be applied to the instance
 * it has been called on.
 *
 * @example
 *   var command = ffmpeg('/path/to/source.avi')
 *     .audioCodec('libfaac')
 *     .videoCodec('libx264')
 *     .format('mp4');
 *
 *   command.clone()
 *     .size('320x200')
 *     .save('/path/to/output-small.mp4');
 *
 *   command.clone()
 *     .size('640x400')
 *     .save('/path/to/output-medium.mp4');
 *
 *   command.save('/path/to/output-original-size.mp4');
 *
 * @method FfmpegCommand#clone
 * @return FfmpegCommand
 */
FfmpegCommand.prototype.clone = function() {
  var clone = new FfmpegCommand();
  var self = this;

  // Clone options and logger
  clone.options = this.options;
  clone.logger = this.logger;

  // Clone inputs
  clone._inputs = this._inputs.map(function(input) {
    return {
      source: input.source,
      options: input.options.clone()
    };
  });

  // Create first output
  if ('target' in this._outputs[0]) {
    // We have outputs set, don't clone them and create first output
    clone._outputs = [];
    clone.output();
  } else {
    // No outputs set, clone first output options
    clone._outputs = [
      clone._currentOutput = {
        flags: {}
      }
    ];

    ['audio', 'audioFilters', 'video', 'videoFilters', 'sizeFilters', 'options'].forEach(function(key) {
      clone._currentOutput[key] = self._currentOutput[key].clone();
    });

    if (this._currentOutput.sizeData) {
      clone._currentOutput.sizeData = {};
      utils.copy(this._currentOutput.sizeData, clone._currentOutput.sizeData);
    }

    utils.copy(this._currentOutput.flags, clone._currentOutput.flags);
  }

  // Clone argument lists
  ['_global', '_complexFilters'].forEach(function(prop) {
    clone[prop] = self[prop].clone();
  });

  return clone;
};


/* Add methods from options submodules */

__webpack_require__(163)(FfmpegCommand.prototype);
__webpack_require__(161)(FfmpegCommand.prototype);
__webpack_require__(166)(FfmpegCommand.prototype);
__webpack_require__(167)(FfmpegCommand.prototype);
__webpack_require__(165)(FfmpegCommand.prototype);
__webpack_require__(162)(FfmpegCommand.prototype);
__webpack_require__(164)(FfmpegCommand.prototype);


/* Add processor methods */

__webpack_require__(168)(FfmpegCommand.prototype);


/* Add capabilities methods */

__webpack_require__(157)(FfmpegCommand.prototype);

FfmpegCommand.setFfmpegPath = function(path) {
  (new FfmpegCommand()).setFfmpegPath(path);
};

FfmpegCommand.setFfprobePath = function(path) {
  (new FfmpegCommand()).setFfprobePath(path);
};

FfmpegCommand.setFlvtoolPath = function(path) {
  (new FfmpegCommand()).setFlvtoolPath(path);
};

FfmpegCommand.availableFilters =
FfmpegCommand.getAvailableFilters = function(callback) {
  (new FfmpegCommand()).availableFilters(callback);
};

FfmpegCommand.availableCodecs =
FfmpegCommand.getAvailableCodecs = function(callback) {
  (new FfmpegCommand()).availableCodecs(callback);
};

FfmpegCommand.availableFormats =
FfmpegCommand.getAvailableFormats = function(callback) {
  (new FfmpegCommand()).availableFormats(callback);
};

FfmpegCommand.availableEncoders =
FfmpegCommand.getAvailableEncoders = function(callback) {
  (new FfmpegCommand()).availableEncoders(callback);
};


/* Add ffprobe methods */

__webpack_require__(158)(FfmpegCommand.prototype);

FfmpegCommand.ffprobe = function(file) {
  var instance = new FfmpegCommand(file);
  instance.ffprobe.apply(instance, Array.prototype.slice.call(arguments, 1));
};

/* Add processing recipes */

__webpack_require__(169)(FfmpegCommand.prototype);

/* WEBPACK VAR INJECTION */}.call(exports, "/"))

/***/ }),
/* 160 */
/***/ (function(module, exports) {

function webpackEmptyContext(req) {
	throw new Error("Cannot find module '" + req + "'.");
}
webpackEmptyContext.keys = function() { return []; };
webpackEmptyContext.resolve = webpackEmptyContext;
module.exports = webpackEmptyContext;
webpackEmptyContext.id = 160;

/***/ }),
/* 161 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var utils = __webpack_require__(9);


/*
 *! Audio-related methods
 */

module.exports = function(proto) {
  /**
   * Disable audio in the output
   *
   * @method FfmpegCommand#noAudio
   * @category Audio
   * @aliases withNoAudio
   * @return FfmpegCommand
   */
  proto.withNoAudio =
  proto.noAudio = function() {
    this._currentOutput.audio.clear();
    this._currentOutput.audioFilters.clear();
    this._currentOutput.audio('-an');

    return this;
  };


  /**
   * Specify audio codec
   *
   * @method FfmpegCommand#audioCodec
   * @category Audio
   * @aliases withAudioCodec
   *
   * @param {String} codec audio codec name
   * @return FfmpegCommand
   */
  proto.withAudioCodec =
  proto.audioCodec = function(codec) {
    this._currentOutput.audio('-acodec', codec);

    return this;
  };


  /**
   * Specify audio bitrate
   *
   * @method FfmpegCommand#audioBitrate
   * @category Audio
   * @aliases withAudioBitrate
   *
   * @param {String|Number} bitrate audio bitrate in kbps (with an optional 'k' suffix)
   * @return FfmpegCommand
   */
  proto.withAudioBitrate =
  proto.audioBitrate = function(bitrate) {
    this._currentOutput.audio('-b:a', ('' + bitrate).replace(/k?$/, 'k'));
    return this;
  };


  /**
   * Specify audio channel count
   *
   * @method FfmpegCommand#audioChannels
   * @category Audio
   * @aliases withAudioChannels
   *
   * @param {Number} channels channel count
   * @return FfmpegCommand
   */
  proto.withAudioChannels =
  proto.audioChannels = function(channels) {
    this._currentOutput.audio('-ac', channels);
    return this;
  };


  /**
   * Specify audio frequency
   *
   * @method FfmpegCommand#audioFrequency
   * @category Audio
   * @aliases withAudioFrequency
   *
   * @param {Number} freq audio frequency in Hz
   * @return FfmpegCommand
   */
  proto.withAudioFrequency =
  proto.audioFrequency = function(freq) {
    this._currentOutput.audio('-ar', freq);
    return this;
  };


  /**
   * Specify audio quality
   *
   * @method FfmpegCommand#audioQuality
   * @category Audio
   * @aliases withAudioQuality
   *
   * @param {Number} quality audio quality factor
   * @return FfmpegCommand
   */
  proto.withAudioQuality =
  proto.audioQuality = function(quality) {
    this._currentOutput.audio('-aq', quality);
    return this;
  };


  /**
   * Specify custom audio filter(s)
   *
   * Can be called both with one or many filters, or a filter array.
   *
   * @example
   * command.audioFilters('filter1');
   *
   * @example
   * command.audioFilters('filter1', 'filter2=param1=value1:param2=value2');
   *
   * @example
   * command.audioFilters(['filter1', 'filter2']);
   *
   * @example
   * command.audioFilters([
   *   {
   *     filter: 'filter1'
   *   },
   *   {
   *     filter: 'filter2',
   *     options: 'param=value:param=value'
   *   }
   * ]);
   *
   * @example
   * command.audioFilters(
   *   {
   *     filter: 'filter1',
   *     options: ['value1', 'value2']
   *   },
   *   {
   *     filter: 'filter2',
   *     options: { param1: 'value1', param2: 'value2' }
   *   }
   * );
   *
   * @method FfmpegCommand#audioFilters
   * @aliases withAudioFilter,withAudioFilters,audioFilter
   * @category Audio
   *
   * @param {...String|String[]|Object[]} filters audio filter strings, string array or
   *   filter specification array, each with the following properties:
   * @param {String} filters.filter filter name
   * @param {String|String[]|Object} [filters.options] filter option string, array, or object
   * @return FfmpegCommand
   */
  proto.withAudioFilter =
  proto.withAudioFilters =
  proto.audioFilter =
  proto.audioFilters = function(filters) {
    if (arguments.length > 1) {
      filters = [].slice.call(arguments);
    }

    if (!Array.isArray(filters)) {
      filters = [filters];
    }

    this._currentOutput.audioFilters(utils.makeFilterStrings(filters));
    return this;
  };
};


/***/ }),
/* 162 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var utils = __webpack_require__(9);


/*
 *! Custom options methods
 */

module.exports = function(proto) {
  /**
   * Add custom input option(s)
   *
   * When passing a single string or an array, each string containing two
   * words is split (eg. inputOptions('-option value') is supported) for
   * compatibility reasons.  This is not the case when passing more than
   * one argument.
   *
   * @example
   * command.inputOptions('option1');
   *
   * @example
   * command.inputOptions('option1', 'option2');
   *
   * @example
   * command.inputOptions(['option1', 'option2']);
   *
   * @method FfmpegCommand#inputOptions
   * @category Custom options
   * @aliases addInputOption,addInputOptions,withInputOption,withInputOptions,inputOption
   *
   * @param {...String} options option string(s) or string array
   * @return FfmpegCommand
   */
  proto.addInputOption =
  proto.addInputOptions =
  proto.withInputOption =
  proto.withInputOptions =
  proto.inputOption =
  proto.inputOptions = function(options) {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    var doSplit = true;

    if (arguments.length > 1) {
      options = [].slice.call(arguments);
      doSplit = false;
    }

    if (!Array.isArray(options)) {
      options = [options];
    }

    this._currentInput.options(options.reduce(function(options, option) {
      var split = String(option).split(' ');

      if (doSplit && split.length === 2) {
        options.push(split[0], split[1]);
      } else {
        options.push(option);
      }

      return options;
    }, []));
    return this;
  };


  /**
   * Add custom output option(s)
   *
   * @example
   * command.outputOptions('option1');
   *
   * @example
   * command.outputOptions('option1', 'option2');
   *
   * @example
   * command.outputOptions(['option1', 'option2']);
   *
   * @method FfmpegCommand#outputOptions
   * @category Custom options
   * @aliases addOutputOption,addOutputOptions,addOption,addOptions,withOutputOption,withOutputOptions,withOption,withOptions,outputOption
   *
   * @param {...String} options option string(s) or string array
   * @return FfmpegCommand
   */
  proto.addOutputOption =
  proto.addOutputOptions =
  proto.addOption =
  proto.addOptions =
  proto.withOutputOption =
  proto.withOutputOptions =
  proto.withOption =
  proto.withOptions =
  proto.outputOption =
  proto.outputOptions = function(options) {
    var doSplit = true;

    if (arguments.length > 1) {
      options = [].slice.call(arguments);
      doSplit = false;
    }

    if (!Array.isArray(options)) {
      options = [options];
    }

    this._currentOutput.options(options.reduce(function(options, option) {
      var split = String(option).split(' ');

      if (doSplit && split.length === 2) {
        options.push(split[0], split[1]);
      } else {
        options.push(option);
      }

      return options;
    }, []));
    return this;
  };


  /**
   * Specify a complex filtergraph
   *
   * Calling this method will override any previously set filtergraph, but you can set
   * as many filters as needed in one call.
   *
   * @example <caption>Overlay an image over a video (using a filtergraph string)</caption>
   *   ffmpeg()
   *     .input('video.avi')
   *     .input('image.png')
   *     .complexFilter('[0:v][1:v]overlay[out]', ['out']);
   *
   * @example <caption>Overlay an image over a video (using a filter array)</caption>
   *   ffmpeg()
   *     .input('video.avi')
   *     .input('image.png')
   *     .complexFilter([{
   *       filter: 'overlay',
   *       inputs: ['0:v', '1:v'],
   *       outputs: ['out']
   *     }], ['out']);
   *
   * @example <caption>Split video into RGB channels and output a 3x1 video with channels side to side</caption>
   *  ffmpeg()
   *    .input('video.avi')
   *    .complexFilter([
   *      // Duplicate video stream 3 times into streams a, b, and c
   *      { filter: 'split', options: '3', outputs: ['a', 'b', 'c'] },
   *
   *      // Create stream 'red' by cancelling green and blue channels from stream 'a'
   *      { filter: 'lutrgb', options: { g: 0, b: 0 }, inputs: 'a', outputs: 'red' },
   *
   *      // Create stream 'green' by cancelling red and blue channels from stream 'b'
   *      { filter: 'lutrgb', options: { r: 0, b: 0 }, inputs: 'b', outputs: 'green' },
   *
   *      // Create stream 'blue' by cancelling red and green channels from stream 'c'
   *      { filter: 'lutrgb', options: { r: 0, g: 0 }, inputs: 'c', outputs: 'blue' },
   *
   *      // Pad stream 'red' to 3x width, keeping the video on the left, and name output 'padded'
   *      { filter: 'pad', options: { w: 'iw*3', h: 'ih' }, inputs: 'red', outputs: 'padded' },
   *
   *      // Overlay 'green' onto 'padded', moving it to the center, and name output 'redgreen'
   *      { filter: 'overlay', options: { x: 'w', y: 0 }, inputs: ['padded', 'green'], outputs: 'redgreen'},
   *
   *      // Overlay 'blue' onto 'redgreen', moving it to the right
   *      { filter: 'overlay', options: { x: '2*w', y: 0 }, inputs: ['redgreen', 'blue']},
   *    ]);
   *
   * @method FfmpegCommand#complexFilter
   * @category Custom options
   * @aliases filterGraph
   *
   * @param {String|Array} spec filtergraph string or array of filter specification
   *   objects, each having the following properties:
   * @param {String} spec.filter filter name
   * @param {String|Array} [spec.inputs] (array of) input stream specifier(s) for the filter,
   *   defaults to ffmpeg automatically choosing the first unused matching streams
   * @param {String|Array} [spec.outputs] (array of) output stream specifier(s) for the filter,
   *   defaults to ffmpeg automatically assigning the output to the output file
   * @param {Object|String|Array} [spec.options] filter options, can be omitted to not set any options
   * @param {Array} [map] (array of) stream specifier(s) from the graph to include in
   *   ffmpeg output, defaults to ffmpeg automatically choosing the first matching streams.
   * @return FfmpegCommand
   */
  proto.filterGraph =
  proto.complexFilter = function(spec, map) {
    this._complexFilters.clear();

    if (!Array.isArray(spec)) {
      spec = [spec];
    }

    this._complexFilters('-filter_complex', utils.makeFilterStrings(spec).join(';'));

    if (Array.isArray(map)) {
      var self = this;
      map.forEach(function(streamSpec) {
        self._complexFilters('-map', streamSpec.replace(utils.streamRegexp, '[$1]'));
      });
    } else if (typeof map === 'string') {
      this._complexFilters('-map', map.replace(utils.streamRegexp, '[$1]'));
    }

    return this;
  };
};


/***/ }),
/* 163 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var utils = __webpack_require__(9);

/*
 *! Input-related methods
 */

module.exports = function(proto) {
  /**
   * Add an input to command
   *
   * Also switches "current input", that is the input that will be affected
   * by subsequent input-related methods.
   *
   * Note: only one stream input is supported for now.
   *
   * @method FfmpegCommand#input
   * @category Input
   * @aliases mergeAdd,addInput
   *
   * @param {String|Readable} source input file path or readable stream
   * @return FfmpegCommand
   */
  proto.mergeAdd =
  proto.addInput =
  proto.input = function(source) {
    var isFile = false;
    var isStream = false;

    if (typeof source !== 'string') {
      if (!('readable' in source) || !(source.readable)) {
        throw new Error('Invalid input');
      }

      var hasInputStream = this._inputs.some(function(input) {
        return input.isStream;
      });

      if (hasInputStream) {
        throw new Error('Only one input stream is supported');
      }

      isStream = true;
      source.pause();
    } else {
      var protocol = source.match(/^([a-z]{2,}):/i);
      isFile = !protocol || protocol[0] === 'file';
    }

    this._inputs.push(this._currentInput = {
      source: source,
      isFile: isFile,
      isStream: isStream,
      options: utils.args()
    });

    return this;
  };


  /**
   * Specify input format for the last specified input
   *
   * @method FfmpegCommand#inputFormat
   * @category Input
   * @aliases withInputFormat,fromFormat
   *
   * @param {String} format input format
   * @return FfmpegCommand
   */
  proto.withInputFormat =
  proto.inputFormat =
  proto.fromFormat = function(format) {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    this._currentInput.options('-f', format);
    return this;
  };


  /**
   * Specify input FPS for the last specified input
   * (only valid for raw video formats)
   *
   * @method FfmpegCommand#inputFps
   * @category Input
   * @aliases withInputFps,withInputFPS,withFpsInput,withFPSInput,inputFPS,inputFps,fpsInput
   *
   * @param {Number} fps input FPS
   * @return FfmpegCommand
   */
  proto.withInputFps =
  proto.withInputFPS =
  proto.withFpsInput =
  proto.withFPSInput =
  proto.inputFPS =
  proto.inputFps =
  proto.fpsInput =
  proto.FPSInput = function(fps) {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    this._currentInput.options('-r', fps);
    return this;
  };


  /**
   * Use native framerate for the last specified input
   *
   * @method FfmpegCommand#native
   * @category Input
   * @aliases nativeFramerate,withNativeFramerate
   *
   * @return FfmmegCommand
   */
  proto.nativeFramerate =
  proto.withNativeFramerate =
  proto.native = function() {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    this._currentInput.options('-re');
    return this;
  };


  /**
   * Specify input seek time for the last specified input
   *
   * @method FfmpegCommand#seekInput
   * @category Input
   * @aliases setStartTime,seekTo
   *
   * @param {String|Number} seek seek time in seconds or as a '[hh:[mm:]]ss[.xxx]' string
   * @return FfmpegCommand
   */
  proto.setStartTime =
  proto.seekInput = function(seek) {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    this._currentInput.options('-ss', seek);

    return this;
  };


  /**
   * Loop over the last specified input
   *
   * @method FfmpegCommand#loop
   * @category Input
   *
   * @param {String|Number} [duration] loop duration in seconds or as a '[[hh:]mm:]ss[.xxx]' string
   * @return FfmpegCommand
   */
  proto.loop = function(duration) {
    if (!this._currentInput) {
      throw new Error('No input specified');
    }

    this._currentInput.options('-loop', '1');

    if (typeof duration !== 'undefined') {
      this.duration(duration);
    }

    return this;
  };
};


/***/ }),
/* 164 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var path = __webpack_require__(0);

/*
 *! Miscellaneous methods
 */

module.exports = function(proto) {
  /**
   * Use preset
   *
   * @method FfmpegCommand#preset
   * @category Miscellaneous
   * @aliases usingPreset
   *
   * @param {String|Function} preset preset name or preset function
   */
  proto.usingPreset =
  proto.preset = function(preset) {
    if (typeof preset === 'function') {
      preset(this);
    } else {
      try {
        var modulePath = path.join(this.options.presets, preset);
        var module = !(function webpackMissingModule() { var e = new Error("Cannot find module \".\""); e.code = 'MODULE_NOT_FOUND'; throw e; }());

        if (typeof module.load === 'function') {
          module.load(this);
        } else {
          throw new Error('preset ' + modulePath + ' has no load() function');
        }
      } catch (err) {
        throw new Error('preset ' + modulePath + ' could not be loaded: ' + err.message);
      }
    }

    return this;
  };
};


/***/ }),
/* 165 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var utils = __webpack_require__(9);


/*
 *! Output-related methods
 */

module.exports = function(proto) {
  /**
   * Add output
   *
   * @method FfmpegCommand#output
   * @category Output
   * @aliases addOutput
   *
   * @param {String|Writable} target target file path or writable stream
   * @param {Object} [pipeopts={}] pipe options (only applies to streams)
   * @return FfmpegCommand
   */
  proto.addOutput =
  proto.output = function(target, pipeopts) {
    var isFile = false;

    if (!target && this._currentOutput) {
      // No target is only allowed when called from constructor
      throw new Error('Invalid output');
    }

    if (target && typeof target !== 'string') {
      if (!('writable' in target) || !(target.writable)) {
        throw new Error('Invalid output');
      }
    } else if (typeof target === 'string') {
      var protocol = target.match(/^([a-z]{2,}):/i);
      isFile = !protocol || protocol[0] === 'file';
    }

    if (target && !('target' in this._currentOutput)) {
      // For backwards compatibility, set target for first output
      this._currentOutput.target = target;
      this._currentOutput.isFile = isFile;
      this._currentOutput.pipeopts = pipeopts || {};
    } else {
      if (target && typeof target !== 'string') {
        var hasOutputStream = this._outputs.some(function(output) {
          return typeof output.target !== 'string';
        });

        if (hasOutputStream) {
          throw new Error('Only one output stream is supported');
        }
      }

      this._outputs.push(this._currentOutput = {
        target: target,
        isFile: isFile,
        flags: {},
        pipeopts: pipeopts || {}
      });

      var self = this;
      ['audio', 'audioFilters', 'video', 'videoFilters', 'sizeFilters', 'options'].forEach(function(key) {
        self._currentOutput[key] = utils.args();
      });

      if (!target) {
        // Call from constructor: remove target key
        delete this._currentOutput.target;
      }
    }

    return this;
  };


  /**
   * Specify output seek time
   *
   * @method FfmpegCommand#seek
   * @category Input
   * @aliases seekOutput
   *
   * @param {String|Number} seek seek time in seconds or as a '[hh:[mm:]]ss[.xxx]' string
   * @return FfmpegCommand
   */
  proto.seekOutput =
  proto.seek = function(seek) {
    this._currentOutput.options('-ss', seek);
    return this;
  };


  /**
   * Set output duration
   *
   * @method FfmpegCommand#duration
   * @category Output
   * @aliases withDuration,setDuration
   *
   * @param {String|Number} duration duration in seconds or as a '[[hh:]mm:]ss[.xxx]' string
   * @return FfmpegCommand
   */
  proto.withDuration =
  proto.setDuration =
  proto.duration = function(duration) {
    this._currentOutput.options('-t', duration);
    return this;
  };


  /**
   * Set output format
   *
   * @method FfmpegCommand#format
   * @category Output
   * @aliases toFormat,withOutputFormat,outputFormat
   *
   * @param {String} format output format name
   * @return FfmpegCommand
   */
  proto.toFormat =
  proto.withOutputFormat =
  proto.outputFormat =
  proto.format = function(format) {
    this._currentOutput.options('-f', format);
    return this;
  };


  /**
   * Add stream mapping to output
   *
   * @method FfmpegCommand#map
   * @category Output
   *
   * @param {String} spec stream specification string, with optional square brackets
   * @return FfmpegCommand
   */
  proto.map = function(spec) {
    this._currentOutput.options('-map', spec.replace(utils.streamRegexp, '[$1]'));
    return this;
  };


  /**
   * Run flvtool2/flvmeta on output
   *
   * @method FfmpegCommand#flvmeta
   * @category Output
   * @aliases updateFlvMetadata
   *
   * @return FfmpegCommand
   */
  proto.updateFlvMetadata =
  proto.flvmeta = function() {
    this._currentOutput.flags.flvmeta = true;
    return this;
  };
};


/***/ }),
/* 166 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var utils = __webpack_require__(9);


/*
 *! Video-related methods
 */

module.exports = function(proto) {
  /**
   * Disable video in the output
   *
   * @method FfmpegCommand#noVideo
   * @category Video
   * @aliases withNoVideo
   *
   * @return FfmpegCommand
   */
  proto.withNoVideo =
  proto.noVideo = function() {
    this._currentOutput.video.clear();
    this._currentOutput.videoFilters.clear();
    this._currentOutput.video('-vn');

    return this;
  };


  /**
   * Specify video codec
   *
   * @method FfmpegCommand#videoCodec
   * @category Video
   * @aliases withVideoCodec
   *
   * @param {String} codec video codec name
   * @return FfmpegCommand
   */
  proto.withVideoCodec =
  proto.videoCodec = function(codec) {
    this._currentOutput.video('-vcodec', codec);
    return this;
  };


  /**
   * Specify video bitrate
   *
   * @method FfmpegCommand#videoBitrate
   * @category Video
   * @aliases withVideoBitrate
   *
   * @param {String|Number} bitrate video bitrate in kbps (with an optional 'k' suffix)
   * @param {Boolean} [constant=false] enforce constant bitrate
   * @return FfmpegCommand
   */
  proto.withVideoBitrate =
  proto.videoBitrate = function(bitrate, constant) {
    bitrate = ('' + bitrate).replace(/k?$/, 'k');

    this._currentOutput.video('-b:v', bitrate);
    if (constant) {
      this._currentOutput.video(
        '-maxrate', bitrate,
        '-minrate', bitrate,
        '-bufsize', '3M'
      );
    }

    return this;
  };


  /**
   * Specify custom video filter(s)
   *
   * Can be called both with one or many filters, or a filter array.
   *
   * @example
   * command.videoFilters('filter1');
   *
   * @example
   * command.videoFilters('filter1', 'filter2=param1=value1:param2=value2');
   *
   * @example
   * command.videoFilters(['filter1', 'filter2']);
   *
   * @example
   * command.videoFilters([
   *   {
   *     filter: 'filter1'
   *   },
   *   {
   *     filter: 'filter2',
   *     options: 'param=value:param=value'
   *   }
   * ]);
   *
   * @example
   * command.videoFilters(
   *   {
   *     filter: 'filter1',
   *     options: ['value1', 'value2']
   *   },
   *   {
   *     filter: 'filter2',
   *     options: { param1: 'value1', param2: 'value2' }
   *   }
   * );
   *
   * @method FfmpegCommand#videoFilters
   * @category Video
   * @aliases withVideoFilter,withVideoFilters,videoFilter
   *
   * @param {...String|String[]|Object[]} filters video filter strings, string array or
   *   filter specification array, each with the following properties:
   * @param {String} filters.filter filter name
   * @param {String|String[]|Object} [filters.options] filter option string, array, or object
   * @return FfmpegCommand
   */
  proto.withVideoFilter =
  proto.withVideoFilters =
  proto.videoFilter =
  proto.videoFilters = function(filters) {
    if (arguments.length > 1) {
      filters = [].slice.call(arguments);
    }

    if (!Array.isArray(filters)) {
      filters = [filters];
    }

    this._currentOutput.videoFilters(utils.makeFilterStrings(filters));

    return this;
  };


  /**
   * Specify output FPS
   *
   * @method FfmpegCommand#fps
   * @category Video
   * @aliases withOutputFps,withOutputFPS,withFpsOutput,withFPSOutput,withFps,withFPS,outputFPS,outputFps,fpsOutput,FPSOutput,FPS
   *
   * @param {Number} fps output FPS
   * @return FfmpegCommand
   */
  proto.withOutputFps =
  proto.withOutputFPS =
  proto.withFpsOutput =
  proto.withFPSOutput =
  proto.withFps =
  proto.withFPS =
  proto.outputFPS =
  proto.outputFps =
  proto.fpsOutput =
  proto.FPSOutput =
  proto.fps =
  proto.FPS = function(fps) {
    this._currentOutput.video('-r', fps);
    return this;
  };


  /**
   * Only transcode a certain number of frames
   *
   * @method FfmpegCommand#frames
   * @category Video
   * @aliases takeFrames,withFrames
   *
   * @param {Number} frames frame count
   * @return FfmpegCommand
   */
  proto.takeFrames =
  proto.withFrames =
  proto.frames = function(frames) {
    this._currentOutput.video('-vframes', frames);
    return this;
  };
};


/***/ }),
/* 167 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


/*
 *! Size helpers
 */


/**
 * Return filters to pad video to width*height,
 *
 * @param {Number} width output width
 * @param {Number} height output height
 * @param {Number} aspect video aspect ratio (without padding)
 * @param {Number} color padding color
 * @return scale/pad filters
 * @private
 */
function getScalePadFilters(width, height, aspect, color) {
  /*
    let a be the input aspect ratio, A be the requested aspect ratio

    if a > A, padding is done on top and bottom
    if a < A, padding is done on left and right
   */

  return [
    /*
      In both cases, we first have to scale the input to match the requested size.
      When using computed width/height, we truncate them to multiples of 2
     */
    {
      filter: 'scale',
      options: {
        w: 'if(gt(a,' + aspect + '),' + width + ',trunc(' + height + '*a/2)*2)',
        h: 'if(lt(a,' + aspect + '),' + height + ',trunc(' + width + '/a/2)*2)'
      }
    },

    /*
      Then we pad the scaled input to match the target size
      (here iw and ih refer to the padding input, i.e the scaled output)
     */

    {
      filter: 'pad',
      options: {
        w: width,
        h: height,
        x: 'if(gt(a,' + aspect + '),0,(' + width + '-iw)/2)',
        y: 'if(lt(a,' + aspect + '),0,(' + height + '-ih)/2)',
        color: color
      }
    }
  ];
}


/**
 * Recompute size filters
 *
 * @param {Object} output
 * @param {String} key newly-added parameter name ('size', 'aspect' or 'pad')
 * @param {String} value newly-added parameter value
 * @return filter string array
 * @private
 */
function createSizeFilters(output, key, value) {
  // Store parameters
  var data = output.sizeData = output.sizeData || {};
  data[key] = value;

  if (!('size' in data)) {
    // No size requested, keep original size
    return [];
  }

  // Try to match the different size string formats
  var fixedSize = data.size.match(/([0-9]+)x([0-9]+)/);
  var fixedWidth = data.size.match(/([0-9]+)x\?/);
  var fixedHeight = data.size.match(/\?x([0-9]+)/);
  var percentRatio = data.size.match(/\b([0-9]{1,3})%/);
  var width, height, aspect;

  if (percentRatio) {
    var ratio = Number(percentRatio[1]) / 100;
    return [{
      filter: 'scale',
      options: {
        w: 'trunc(iw*' + ratio + '/2)*2',
        h: 'trunc(ih*' + ratio + '/2)*2'
      }
    }];
  } else if (fixedSize) {
    // Round target size to multiples of 2
    width = Math.round(Number(fixedSize[1]) / 2) * 2;
    height = Math.round(Number(fixedSize[2]) / 2) * 2;

    aspect = width / height;

    if (data.pad) {
      return getScalePadFilters(width, height, aspect, data.pad);
    } else {
      // No autopad requested, rescale to target size
      return [{ filter: 'scale', options: { w: width, h: height }}];
    }
  } else if (fixedWidth || fixedHeight) {
    if ('aspect' in data) {
      // Specified aspect ratio
      width = fixedWidth ? fixedWidth[1] : Math.round(Number(fixedHeight[1]) * data.aspect);
      height = fixedHeight ? fixedHeight[1] : Math.round(Number(fixedWidth[1]) / data.aspect);

      // Round to multiples of 2
      width = Math.round(width / 2) * 2;
      height = Math.round(height / 2) * 2;

      if (data.pad) {
        return getScalePadFilters(width, height, data.aspect, data.pad);
      } else {
        // No autopad requested, rescale to target size
        return [{ filter: 'scale', options: { w: width, h: height }}];
      }
    } else {
      // Keep input aspect ratio

      if (fixedWidth) {
        return [{
          filter: 'scale',
          options: {
            w: Math.round(Number(fixedWidth[1]) / 2) * 2,
            h: 'trunc(ow/a/2)*2'
          }
        }];
      } else {
        return [{
          filter: 'scale',
          options: {
            w: 'trunc(oh*a/2)*2',
            h: Math.round(Number(fixedHeight[1]) / 2) * 2
          }
        }];
      }
    }
  } else {
    throw new Error('Invalid size specified: ' + data.size);
  }
}


/*
 *! Video size-related methods
 */

module.exports = function(proto) {
  /**
   * Keep display aspect ratio
   *
   * This method is useful when converting an input with non-square pixels to an output format
   * that does not support non-square pixels.  It rescales the input so that the display aspect
   * ratio is the same.
   *
   * @method FfmpegCommand#keepDAR
   * @category Video size
   * @aliases keepPixelAspect,keepDisplayAspect,keepDisplayAspectRatio
   *
   * @return FfmpegCommand
   */
  proto.keepPixelAspect = // Only for compatibility, this is not about keeping _pixel_ aspect ratio
  proto.keepDisplayAspect =
  proto.keepDisplayAspectRatio =
  proto.keepDAR = function() {
    return this.videoFilters([
      {
        filter: 'scale',
        options: {
          w: 'if(gt(sar,1),iw*sar,iw)',
          h: 'if(lt(sar,1),ih/sar,ih)'
        }
      },
      {
        filter: 'setsar',
        options: '1'
      }
    ]);
  };


  /**
   * Set output size
   *
   * The 'size' parameter can have one of 4 forms:
   * - 'X%': rescale to xx % of the original size
   * - 'WxH': specify width and height
   * - 'Wx?': specify width and compute height from input aspect ratio
   * - '?xH': specify height and compute width from input aspect ratio
   *
   * Note: both dimensions will be truncated to multiples of 2.
   *
   * @method FfmpegCommand#size
   * @category Video size
   * @aliases withSize,setSize
   *
   * @param {String} size size string, eg. '33%', '320x240', '320x?', '?x240'
   * @return FfmpegCommand
   */
  proto.withSize =
  proto.setSize =
  proto.size = function(size) {
    var filters = createSizeFilters(this._currentOutput, 'size', size);

    this._currentOutput.sizeFilters.clear();
    this._currentOutput.sizeFilters(filters);

    return this;
  };


  /**
   * Set output aspect ratio
   *
   * @method FfmpegCommand#aspect
   * @category Video size
   * @aliases withAspect,withAspectRatio,setAspect,setAspectRatio,aspectRatio
   *
   * @param {String|Number} aspect aspect ratio (number or 'X:Y' string)
   * @return FfmpegCommand
   */
  proto.withAspect =
  proto.withAspectRatio =
  proto.setAspect =
  proto.setAspectRatio =
  proto.aspect =
  proto.aspectRatio = function(aspect) {
    var a = Number(aspect);
    if (isNaN(a)) {
      var match = aspect.match(/^(\d+):(\d+)$/);
      if (match) {
        a = Number(match[1]) / Number(match[2]);
      } else {
        throw new Error('Invalid aspect ratio: ' + aspect);
      }
    }

    var filters = createSizeFilters(this._currentOutput, 'aspect', a);

    this._currentOutput.sizeFilters.clear();
    this._currentOutput.sizeFilters(filters);

    return this;
  };


  /**
   * Enable auto-padding the output
   *
   * @method FfmpegCommand#autopad
   * @category Video size
   * @aliases applyAutopadding,applyAutoPadding,applyAutopad,applyAutoPad,withAutopadding,withAutoPadding,withAutopad,withAutoPad,autoPad
   *
   * @param {Boolean} [pad=true] enable/disable auto-padding
   * @param {String} [color='black'] pad color
   */
  proto.applyAutopadding =
  proto.applyAutoPadding =
  proto.applyAutopad =
  proto.applyAutoPad =
  proto.withAutopadding =
  proto.withAutoPadding =
  proto.withAutopad =
  proto.withAutoPad =
  proto.autoPad =
  proto.autopad = function(pad, color) {
    // Allow autopad(color)
    if (typeof pad === 'string') {
      color = pad;
      pad = true;
    }

    // Allow autopad() and autopad(undefined, color)
    if (typeof pad === 'undefined') {
      pad = true;
    }

    var filters = createSizeFilters(this._currentOutput, 'pad', pad ? color || 'black' : false);

    this._currentOutput.sizeFilters.clear();
    this._currentOutput.sizeFilters(filters);

    return this;
  };
};


/***/ }),
/* 168 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var spawn = __webpack_require__(47).spawn;
var path = __webpack_require__(0);
var fs = __webpack_require__(2);
var async = __webpack_require__(33);
var utils = __webpack_require__(9);

var nlRegexp = /\r\n|\r|\n/g;

/*
 *! Processor methods
 */


/**
 * Run ffprobe asynchronously and store data in command
 *
 * @param {FfmpegCommand} command
 * @private
 */
function runFfprobe(command) {
  const inputProbeIndex = 0;
  if (command._inputs[inputProbeIndex].isStream) {
    // Don't probe input streams as this will consume them
    return;
  }
  command.ffprobe(inputProbeIndex, function(err, data) {
    command._ffprobeData = data;
  });
}


module.exports = function(proto) {
  /**
   * Emitted just after ffmpeg has been spawned.
   *
   * @event FfmpegCommand#start
   * @param {String} command ffmpeg command line
   */

  /**
   * Emitted when ffmpeg reports progress information
   *
   * @event FfmpegCommand#progress
   * @param {Object} progress progress object
   * @param {Number} progress.frames number of frames transcoded
   * @param {Number} progress.currentFps current processing speed in frames per second
   * @param {Number} progress.currentKbps current output generation speed in kilobytes per second
   * @param {Number} progress.targetSize current output file size
   * @param {String} progress.timemark current video timemark
   * @param {Number} [progress.percent] processing progress (may not be available depending on input)
   */

  /**
   * Emitted when ffmpeg outputs to stderr
   *
   * @event FfmpegCommand#stderr
   * @param {String} line stderr output line
   */

  /**
   * Emitted when ffmpeg reports input codec data
   *
   * @event FfmpegCommand#codecData
   * @param {Object} codecData codec data object
   * @param {String} codecData.format input format name
   * @param {String} codecData.audio input audio codec name
   * @param {String} codecData.audio_details input audio codec parameters
   * @param {String} codecData.video input video codec name
   * @param {String} codecData.video_details input video codec parameters
   */

  /**
   * Emitted when an error happens when preparing or running a command
   *
   * @event FfmpegCommand#error
   * @param {Error} error error object, with optional properties 'inputStreamError' / 'outputStreamError' for errors on their respective streams
   * @param {String|null} stdout ffmpeg stdout, unless outputting to a stream
   * @param {String|null} stderr ffmpeg stderr
   */

  /**
   * Emitted when a command finishes processing
   *
   * @event FfmpegCommand#end
   * @param {Array|String|null} [filenames|stdout] generated filenames when taking screenshots, ffmpeg stdout when not outputting to a stream, null otherwise
   * @param {String|null} stderr ffmpeg stderr
   */


  /**
   * Spawn an ffmpeg process
   *
   * The 'options' argument may contain the following keys:
   * - 'niceness': specify process niceness, ignored on Windows (default: 0)
   * - `cwd`: change working directory
   * - 'captureStdout': capture stdout and pass it to 'endCB' as its 2nd argument (default: false)
   * - 'stdoutLines': override command limit (default: use command limit)
   *
   * The 'processCB' callback, if present, is called as soon as the process is created and
   * receives a nodejs ChildProcess object.  It may not be called at all if an error happens
   * before spawning the process.
   *
   * The 'endCB' callback is called either when an error occurs or when the ffmpeg process finishes.
   *
   * @method FfmpegCommand#_spawnFfmpeg
   * @param {Array} args ffmpeg command line argument list
   * @param {Object} [options] spawn options (see above)
   * @param {Function} [processCB] callback called with process object and stdout/stderr ring buffers when process has been created
   * @param {Function} endCB callback called with error (if applicable) and stdout/stderr ring buffers when process finished
   * @private
   */
  proto._spawnFfmpeg = function(args, options, processCB, endCB) {
    // Enable omitting options
    if (typeof options === 'function') {
      endCB = processCB;
      processCB = options;
      options = {};
    }

    // Enable omitting processCB
    if (typeof endCB === 'undefined') {
      endCB = processCB;
      processCB = function() {};
    }

    var maxLines = 'stdoutLines' in options ? options.stdoutLines : this.options.stdoutLines;

    // Find ffmpeg
    this._getFfmpegPath(function(err, command) {
      if (err) {
        return endCB(err);
      } else if (!command || command.length === 0) {
        return endCB(new Error('Cannot find ffmpeg'));
      }

      // Apply niceness
      if (options.niceness && options.niceness !== 0 && !utils.isWindows) {
        args.unshift('-n', options.niceness, command);
        command = 'nice';
      }

      var stdoutRing = utils.linesRing(maxLines);
      var stdoutClosed = false;

      var stderrRing = utils.linesRing(maxLines);
      var stderrClosed = false;

      // Spawn process
      var ffmpegProc = spawn(command, args, options);

      if (ffmpegProc.stderr) {
        ffmpegProc.stderr.setEncoding('utf8');
      }

      ffmpegProc.on('error', function(err) {
        endCB(err);
      });

      // Ensure we wait for captured streams to end before calling endCB
      var exitError = null;
      function handleExit(err) {
        if (err) {
          exitError = err;
        }

        if (processExited && (stdoutClosed || !options.captureStdout) && stderrClosed) {
          endCB(exitError, stdoutRing, stderrRing);
        }
      }

      // Handle process exit
      var processExited = false;
      ffmpegProc.on('exit', function(code, signal) {
        processExited = true;

        if (signal) {
          handleExit(new Error('ffmpeg was killed with signal ' + signal));
        } else if (code) {
          handleExit(new Error('ffmpeg exited with code ' + code));
        } else {
          handleExit();
        }
      });

      // Capture stdout if specified
      if (options.captureStdout) {
        ffmpegProc.stdout.on('data', function(data) {
          stdoutRing.append(data);
        });

        ffmpegProc.stdout.on('close', function() {
          stdoutRing.close();
          stdoutClosed = true;
          handleExit();
        });
      }

      // Capture stderr if specified
      ffmpegProc.stderr.on('data', function(data) {
        stderrRing.append(data);
      });

      ffmpegProc.stderr.on('close', function() {
        stderrRing.close();
        stderrClosed = true;
        handleExit();
      });

      // Call process callback
      processCB(ffmpegProc, stdoutRing, stderrRing);
    });
  };


  /**
   * Build the argument list for an ffmpeg command
   *
   * @method FfmpegCommand#_getArguments
   * @return argument list
   * @private
   */
  proto._getArguments = function() {
    var complexFilters = this._complexFilters.get();

    var fileOutput = this._outputs.some(function(output) {
      return output.isFile;
    });

    return [].concat(
        // Inputs and input options
        this._inputs.reduce(function(args, input) {
          var source = (typeof input.source === 'string') ? input.source : 'pipe:0';

          // For each input, add input options, then '-i <source>'
          return args.concat(
            input.options.get(),
            ['-i', source]
          );
        }, []),

        // Global options
        this._global.get(),

        // Overwrite if we have file outputs
        fileOutput ? ['-y'] : [],

        // Complex filters
        complexFilters,

        // Outputs, filters and output options
        this._outputs.reduce(function(args, output) {
          var sizeFilters = utils.makeFilterStrings(output.sizeFilters.get());
          var audioFilters = output.audioFilters.get();
          var videoFilters = output.videoFilters.get().concat(sizeFilters);
          var outputArg;

          if (!output.target) {
            outputArg = [];
          } else if (typeof output.target === 'string') {
            outputArg = [output.target];
          } else {
            outputArg = ['pipe:1'];
          }

          return args.concat(
            output.audio.get(),
            audioFilters.length ? ['-filter:a', audioFilters.join(',')] : [],
            output.video.get(),
            videoFilters.length ? ['-filter:v', videoFilters.join(',')] : [],
            output.options.get(),
            outputArg
          );
        }, [])
      );
  };


  /**
   * Prepare execution of an ffmpeg command
   *
   * Checks prerequisites for the execution of the command (codec/format availability, flvtool...),
   * then builds the argument list for ffmpeg and pass them to 'callback'.
   *
   * @method FfmpegCommand#_prepare
   * @param {Function} callback callback with signature (err, args)
   * @param {Boolean} [readMetadata=false] read metadata before processing
   * @private
   */
  proto._prepare = function(callback, readMetadata) {
    var self = this;

    async.waterfall([
      // Check codecs and formats
      function(cb) {
        self._checkCapabilities(cb);
      },

      // Read metadata if required
      function(cb) {
        if (!readMetadata) {
          return cb();
        }

        self.ffprobe(0, function(err, data) {
          if (!err) {
            self._ffprobeData = data;
          }

          cb();
        });
      },

      // Check for flvtool2/flvmeta if necessary
      function(cb) {
        var flvmeta = self._outputs.some(function(output) {
          // Remove flvmeta flag on non-file output
          if (output.flags.flvmeta && !output.isFile) {
            self.logger.warn('Updating flv metadata is only supported for files');
            output.flags.flvmeta = false;
          }

          return output.flags.flvmeta;
        });

        if (flvmeta) {
          self._getFlvtoolPath(function(err) {
            cb(err);
          });
        } else {
          cb();
        }
      },

      // Build argument list
      function(cb) {
        var args;
        try {
          args = self._getArguments();
        } catch(e) {
          return cb(e);
        }

        cb(null, args);
      },

      // Add "-strict experimental" option where needed
      function(args, cb) {
        self.availableEncoders(function(err, encoders) {
          for (var i = 0; i < args.length; i++) {
            if (args[i] === '-acodec' || args[i] === '-vcodec') {
              i++;

              if ((args[i] in encoders) && encoders[args[i]].experimental) {
                args.splice(i + 1, 0, '-strict', 'experimental');
                i += 2;
              }
            }
          }

          cb(null, args);
        });
      }
    ], callback);

    if (!readMetadata) {
      // Read metadata as soon as 'progress' listeners are added

      if (this.listeners('progress').length > 0) {
        // Read metadata in parallel
        runFfprobe(this);
      } else {
        // Read metadata as soon as the first 'progress' listener is added
        this.once('newListener', function(event) {
          if (event === 'progress') {
            runFfprobe(this);
          }
        });
      }
    }
  };


  /**
   * Run ffmpeg command
   *
   * @method FfmpegCommand#run
   * @category Processing
   * @aliases exec,execute
   */
  proto.exec =
  proto.execute =
  proto.run = function() {
    var self = this;

    // Check if at least one output is present
    var outputPresent = this._outputs.some(function(output) {
      return 'target' in output;
    });

    if (!outputPresent) {
      throw new Error('No output specified');
    }

    // Get output stream if any
    var outputStream = this._outputs.filter(function(output) {
      return typeof output.target !== 'string';
    })[0];

    // Get input stream if any
    var inputStream = this._inputs.filter(function(input) {
      return typeof input.source !== 'string';
    })[0];

    // Ensure we send 'end' or 'error' only once
    var ended = false;
    function emitEnd(err, stdout, stderr) {
      if (!ended) {
        ended = true;

        if (err) {
          self.emit('error', err, stdout, stderr);
        } else {
          self.emit('end', stdout, stderr);
        }
      }
    }

    self._prepare(function(err, args) {
      if (err) {
        return emitEnd(err);
      }

      // Run ffmpeg
      self._spawnFfmpeg(
        args,
        {
          captureStdout: !outputStream,
          niceness: self.options.niceness,
          cwd: self.options.cwd
        },

        function processCB(ffmpegProc, stdoutRing, stderrRing) {
          self.ffmpegProc = ffmpegProc;
          self.emit('start', 'ffmpeg ' + args.join(' '));

          // Pipe input stream if any
          if (inputStream) {
            inputStream.source.on('error', function(err) {
              var reportingErr = new Error('Input stream error: ' + err.message);
              reportingErr.inputStreamError = err;
              emitEnd(reportingErr);
              ffmpegProc.kill();
            });

            inputStream.source.resume();
            inputStream.source.pipe(ffmpegProc.stdin);

            // Set stdin error handler on ffmpeg (prevents nodejs catching the error, but
            // ffmpeg will fail anyway, so no need to actually handle anything)
            ffmpegProc.stdin.on('error', function() {});
          }

          // Setup timeout if requested
          var processTimer;
          if (self.options.timeout) {
            processTimer = setTimeout(function() {
              var msg = 'process ran into a timeout (' + self.options.timeout + 's)';

              emitEnd(new Error(msg), stdoutRing.get(), stderrRing.get());
              ffmpegProc.kill();
            }, self.options.timeout * 1000);
          }


          if (outputStream) {
            // Pipe ffmpeg stdout to output stream
            ffmpegProc.stdout.pipe(outputStream.target, outputStream.pipeopts);

            // Handle output stream events
            outputStream.target.on('close', function() {
              self.logger.debug('Output stream closed, scheduling kill for ffmpeg process');

              // Don't kill process yet, to give a chance to ffmpeg to
              // terminate successfully first  This is necessary because
              // under load, the process 'exit' event sometimes happens
              // after the output stream 'close' event.
              setTimeout(function() {
                emitEnd(new Error('Output stream closed'));
                ffmpegProc.kill();
              }, 20);
            });

            outputStream.target.on('error', function(err) {
              self.logger.debug('Output stream error, killing ffmpeg process');
              var reportingErr = new Error('Output stream error: ' + err.message);
              reportingErr.outputStreamError = err;
              emitEnd(reportingErr, stdoutRing.get(), stderrRing.get());
              ffmpegProc.kill('SIGKILL');
            });
          }

          // Setup stderr handling
          if (stderrRing) {

            // 'stderr' event
            if (self.listeners('stderr').length) {
              stderrRing.callback(function(line) {
                self.emit('stderr', line);
              });
            }

            // 'codecData' event
            if (self.listeners('codecData').length) {
              var codecDataSent = false;
              var codecObject = {};

              stderrRing.callback(function(line) {
                if (!codecDataSent)
                  codecDataSent = utils.extractCodecData(self, line, codecObject);
              });
            }

            // 'progress' event
            if (self.listeners('progress').length) {
              stderrRing.callback(function(line) {
                utils.extractProgress(self, line);
              });
            }
          }
        },

        function endCB(err, stdoutRing, stderrRing) {
          delete self.ffmpegProc;

          if (err) {
            if (err.message.match(/ffmpeg exited with code/)) {
              // Add ffmpeg error message
              err.message += ': ' + utils.extractError(stderrRing.get());
            }

            emitEnd(err, stdoutRing.get(), stderrRing.get());
          } else {
            // Find out which outputs need flv metadata
            var flvmeta = self._outputs.filter(function(output) {
              return output.flags.flvmeta;
            });

            if (flvmeta.length) {
              self._getFlvtoolPath(function(err, flvtool) {
                if (err) {
                  return emitEnd(err);
                }

                async.each(
                  flvmeta,
                  function(output, cb) {
                    spawn(flvtool, ['-U', output.target])
                      .on('error', function(err) {
                        cb(new Error('Error running ' + flvtool + ' on ' + output.target + ': ' + err.message));
                      })
                      .on('exit', function(code, signal) {
                        if (code !== 0 || signal) {
                          cb(
                            new Error(flvtool + ' ' +
                              (signal ? 'received signal ' + signal
                                      : 'exited with code ' + code)) +
                              ' when running on ' + output.target
                          );
                        } else {
                          cb();
                        }
                      });
                  },
                  function(err) {
                    if (err) {
                      emitEnd(err);
                    } else {
                      emitEnd(null, stdoutRing.get(), stderrRing.get());
                    }
                  }
                );
              });
            } else {
              emitEnd(null, stdoutRing.get(), stderrRing.get());
            }
          }
        }
      );
    });
  };


  /**
   * Renice current and/or future ffmpeg processes
   *
   * Ignored on Windows platforms.
   *
   * @method FfmpegCommand#renice
   * @category Processing
   *
   * @param {Number} [niceness=0] niceness value between -20 (highest priority) and 20 (lowest priority)
   * @return FfmpegCommand
   */
  proto.renice = function(niceness) {
    if (!utils.isWindows) {
      niceness = niceness || 0;

      if (niceness < -20 || niceness > 20) {
        this.logger.warn('Invalid niceness value: ' + niceness + ', must be between -20 and 20');
      }

      niceness = Math.min(20, Math.max(-20, niceness));
      this.options.niceness = niceness;

      if (this.ffmpegProc) {
        var logger = this.logger;
        var pid = this.ffmpegProc.pid;
        var renice = spawn('renice', [niceness, '-p', pid]);

        renice.on('error', function(err) {
          logger.warn('could not renice process ' + pid + ': ' + err.message);
        });

        renice.on('exit', function(code, signal) {
          if (signal) {
            logger.warn('could not renice process ' + pid + ': renice was killed by signal ' + signal);
          } else if (code) {
            logger.warn('could not renice process ' + pid + ': renice exited with ' + code);
          } else {
            logger.info('successfully reniced process ' + pid + ' to ' + niceness + ' niceness');
          }
        });
      }
    }

    return this;
  };


  /**
   * Kill current ffmpeg process, if any
   *
   * @method FfmpegCommand#kill
   * @category Processing
   *
   * @param {String} [signal=SIGKILL] signal name
   * @return FfmpegCommand
   */
  proto.kill = function(signal) {
    if (!this.ffmpegProc) {
      this.logger.warn('No running ffmpeg process, cannot send signal');
    } else {
      this.ffmpegProc.kill(signal || 'SIGKILL');
    }

    return this;
  };
};


/***/ }),
/* 169 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*jshint node:true*/


var fs = __webpack_require__(2);
var path = __webpack_require__(0);
var PassThrough = __webpack_require__(19).PassThrough;
var async = __webpack_require__(33);
var utils = __webpack_require__(9);


/*
 * Useful recipes for commands
 */

module.exports = function recipes(proto) {
  /**
   * Execute ffmpeg command and save output to a file
   *
   * @method FfmpegCommand#save
   * @category Processing
   * @aliases saveToFile
   *
   * @param {String} output file path
   * @return FfmpegCommand
   */
  proto.saveToFile =
  proto.save = function(output) {
    this.output(output).run();
    return this;
  };


  /**
   * Execute ffmpeg command and save output to a stream
   *
   * If 'stream' is not specified, a PassThrough stream is created and returned.
   * 'options' will be used when piping ffmpeg output to the output stream
   * (@see http://nodejs.org/api/stream.html#stream_readable_pipe_destination_options)
   *
   * @method FfmpegCommand#pipe
   * @category Processing
   * @aliases stream,writeToStream
   *
   * @param {stream.Writable} [stream] output stream
   * @param {Object} [options={}] pipe options
   * @return Output stream
   */
  proto.writeToStream =
  proto.pipe =
  proto.stream = function(stream, options) {
    if (stream && !('writable' in stream)) {
      options = stream;
      stream = undefined;
    }

    if (!stream) {
      if (process.version.match(/v0\.8\./)) {
        throw new Error('PassThrough stream is not supported on node v0.8');
      }

      stream = new PassThrough();
    }

    this.output(stream, options).run();
    return stream;
  };


  /**
   * Generate images from a video
   *
   * Note: this method makes the command emit a 'filenames' event with an array of
   * the generated image filenames.
   *
   * @method FfmpegCommand#screenshots
   * @category Processing
   * @aliases takeScreenshots,thumbnail,thumbnails,screenshot
   *
   * @param {Number|Object} [config=1] screenshot count or configuration object with
   *   the following keys:
   * @param {Number} [config.count] number of screenshots to take; using this option
   *   takes screenshots at regular intervals (eg. count=4 would take screens at 20%, 40%,
   *   60% and 80% of the video length).
   * @param {String} [config.folder='.'] output folder
   * @param {String} [config.filename='tn.png'] output filename pattern, may contain the following
   *   tokens:
   *   - '%s': offset in seconds
   *   - '%w': screenshot width
   *   - '%h': screenshot height
   *   - '%r': screenshot resolution (same as '%wx%h')
   *   - '%f': input filename
   *   - '%b': input basename (filename w/o extension)
   *   - '%i': index of screenshot in timemark array (can be zero-padded by using it like `%000i`)
   * @param {Number[]|String[]} [config.timemarks] array of timemarks to take screenshots
   *   at; each timemark may be a number of seconds, a '[[hh:]mm:]ss[.xxx]' string or a
   *   'XX%' string.  Overrides 'count' if present.
   * @param {Number[]|String[]} [config.timestamps] alias for 'timemarks'
   * @param {Boolean} [config.fastSeek] use fast seek (less accurate)
   * @param {String} [config.size] screenshot size, with the same syntax as {@link FfmpegCommand#size}
   * @param {String} [folder] output folder (legacy alias for 'config.folder')
   * @return FfmpegCommand
   */
  proto.takeScreenshots =
  proto.thumbnail =
  proto.thumbnails =
  proto.screenshot =
  proto.screenshots = function(config, folder) {
    var self = this;
    var source = this._currentInput.source;
    config = config || { count: 1 };

    // Accept a number of screenshots instead of a config object
    if (typeof config === 'number') {
      config = {
        count: config
      };
    }

    // Accept a second 'folder' parameter instead of config.folder
    if (!('folder' in config)) {
      config.folder = folder || '.';
    }

    // Accept 'timestamps' instead of 'timemarks'
    if ('timestamps' in config) {
      config.timemarks = config.timestamps;
    }

    // Compute timemarks from count if not present
    if (!('timemarks' in config)) {
      if (!config.count) {
        throw new Error('Cannot take screenshots: neither a count nor a timemark list are specified');
      }

      var interval = 100 / (1 + config.count);
      config.timemarks = [];
      for (var i = 0; i < config.count; i++) {
        config.timemarks.push((interval * (i + 1)) + '%');
      }
    }

    // Parse size option
    if ('size' in config) {
      var fixedSize = config.size.match(/^(\d+)x(\d+)$/);
      var fixedWidth = config.size.match(/^(\d+)x\?$/);
      var fixedHeight = config.size.match(/^\?x(\d+)$/);
      var percentSize = config.size.match(/^(\d+)%$/);

      if (!fixedSize && !fixedWidth && !fixedHeight && !percentSize) {
        throw new Error('Invalid size parameter: ' + config.size);
      }
    }

    // Metadata helper
    var metadata;
    function getMetadata(cb) {
      if (metadata) {
        cb(null, metadata);
      } else {
        self.ffprobe(function(err, meta) {
          metadata = meta;
          cb(err, meta);
        });
      }
    }

    async.waterfall([
      // Compute percent timemarks if any
      function computeTimemarks(next) {
        if (config.timemarks.some(function(t) { return ('' + t).match(/^[\d.]+%$/); })) {
          if (typeof source !== 'string') {
            return next(new Error('Cannot compute screenshot timemarks with an input stream, please specify fixed timemarks'));
          }

          getMetadata(function(err, meta) {
            if (err) {
              next(err);
            } else {
              // Select video stream with the highest resolution
              var vstream = meta.streams.reduce(function(biggest, stream) {
                if (stream.codec_type === 'video' && stream.width * stream.height > biggest.width * biggest.height) {
                  return stream;
                } else {
                  return biggest;
                }
              }, { width: 0, height: 0 });

              if (vstream.width === 0) {
                return next(new Error('No video stream in input, cannot take screenshots'));
              }

              var duration = Number(vstream.duration);
              if (isNaN(duration)) {
                duration = Number(meta.format.duration);
              }

              if (isNaN(duration)) {
                return next(new Error('Could not get input duration, please specify fixed timemarks'));
              }

              config.timemarks = config.timemarks.map(function(mark) {
                if (('' + mark).match(/^([\d.]+)%$/)) {
                  return duration * parseFloat(mark) / 100;
                } else {
                  return mark;
                }
              });

              next();
            }
          });
        } else {
          next();
        }
      },

      // Turn all timemarks into numbers and sort them
      function normalizeTimemarks(next) {
        config.timemarks = config.timemarks.map(function(mark) {
          return utils.timemarkToSeconds(mark);
        }).sort(function(a, b) { return a - b; });

        next();
      },

      // Add '_%i' to pattern when requesting multiple screenshots and no variable token is present
      function fixPattern(next) {
        var pattern = config.filename || 'tn.png';

        if (pattern.indexOf('.') === -1) {
          pattern += '.png';
        }

        if (config.timemarks.length > 1 && !pattern.match(/%(s|0*i)/)) {
          var ext = path.extname(pattern);
          pattern = path.join(path.dirname(pattern), path.basename(pattern, ext) + '_%i' + ext);
        }

        next(null, pattern);
      },

      // Replace filename tokens (%f, %b) in pattern
      function replaceFilenameTokens(pattern, next) {
        if (pattern.match(/%[bf]/)) {
          if (typeof source !== 'string') {
            return next(new Error('Cannot replace %f or %b when using an input stream'));
          }

          pattern = pattern
            .replace(/%f/g, path.basename(source))
            .replace(/%b/g, path.basename(source, path.extname(source)));
        }

        next(null, pattern);
      },

      // Compute size if needed
      function getSize(pattern, next) {
        if (pattern.match(/%[whr]/)) {
          if (fixedSize) {
            return next(null, pattern, fixedSize[1], fixedSize[2]);
          }

          getMetadata(function(err, meta) {
            if (err) {
              return next(new Error('Could not determine video resolution to replace %w, %h or %r'));
            }

            var vstream = meta.streams.reduce(function(biggest, stream) {
              if (stream.codec_type === 'video' && stream.width * stream.height > biggest.width * biggest.height) {
                return stream;
              } else {
                return biggest;
              }
            }, { width: 0, height: 0 });

            if (vstream.width === 0) {
              return next(new Error('No video stream in input, cannot replace %w, %h or %r'));
            }

            var width = vstream.width;
            var height = vstream.height;

            if (fixedWidth) {
              height = height * Number(fixedWidth[1]) / width;
              width = Number(fixedWidth[1]);
            } else if (fixedHeight) {
              width = width * Number(fixedHeight[1]) / height;
              height = Number(fixedHeight[1]);
            } else if (percentSize) {
              width = width * Number(percentSize[1]) / 100;
              height = height * Number(percentSize[1]) / 100;
            }

            next(null, pattern, Math.round(width / 2) * 2, Math.round(height / 2) * 2);
          });
        } else {
          next(null, pattern, -1, -1);
        }
      },

      // Replace size tokens (%w, %h, %r) in pattern
      function replaceSizeTokens(pattern, width, height, next) {
        pattern = pattern
          .replace(/%r/g, '%wx%h')
          .replace(/%w/g, width)
          .replace(/%h/g, height);

        next(null, pattern);
      },

      // Replace variable tokens in pattern (%s, %i) and generate filename list
      function replaceVariableTokens(pattern, next) {
        var filenames = config.timemarks.map(function(t, i) {
          return pattern
            .replace(/%s/g, utils.timemarkToSeconds(t))
            .replace(/%(0*)i/g, function(match, padding) {
              var idx = '' + (i + 1);
              return padding.substr(0, Math.max(0, padding.length + 1 - idx.length)) + idx;
            });
        });

        self.emit('filenames', filenames);
        next(null, filenames);
      },

      // Create output directory
      function createDirectory(filenames, next) {
        fs.exists(config.folder, function(exists) {
          if (!exists) {
            fs.mkdir(config.folder, function(err) {
              if (err) {
                next(err);
              } else {
                next(null, filenames);
              }
            });
          } else {
            next(null, filenames);
          }
        });
      }
    ], function runCommand(err, filenames) {
      if (err) {
        return self.emit('error', err);
      }

      var count = config.timemarks.length;
      var split;
      var filters = [split = {
        filter: 'split',
        options: count,
        outputs: []
      }];

      if ('size' in config) {
        // Set size to generate size filters
        self.size(config.size);

        // Get size filters and chain them with 'sizeN' stream names
        var sizeFilters =  self._currentOutput.sizeFilters.get().map(function(f, i) {
          if (i > 0) {
            f.inputs = 'size' + (i - 1);
          }

          f.outputs = 'size' + i;

          return f;
        });

        // Input last size filter output into split filter
        split.inputs = 'size' + (sizeFilters.length - 1);

        // Add size filters in front of split filter
        filters = sizeFilters.concat(filters);

        // Remove size filters
        self._currentOutput.sizeFilters.clear();
      }

      var first = 0;
      for (var i = 0; i < count; i++) {
        var stream = 'screen' + i;
        split.outputs.push(stream);

        if (i === 0) {
          first = config.timemarks[i];
          self.seekInput(first);
        }

        self.output(path.join(config.folder, filenames[i]))
          .frames(1)
          .map(stream);

        if (i > 0) {
          self.seek(config.timemarks[i] - first);
        }
      }

      self.complexFilter(filters);
      self.run();
    });

    return this;
  };


  /**
   * Merge (concatenate) inputs to a single file
   *
   * @method FfmpegCommand#concat
   * @category Processing
   * @aliases concatenate,mergeToFile
   *
   * @param {String|Writable} target output file or writable stream
   * @param {Object} [options] pipe options (only used when outputting to a writable stream)
   * @return FfmpegCommand
   */
  proto.mergeToFile =
  proto.concatenate =
  proto.concat = function(target, options) {
    // Find out which streams are present in the first non-stream input
    var fileInput = this._inputs.filter(function(input) {
      return !input.isStream;
    })[0];

    var self = this;
    this.ffprobe(this._inputs.indexOf(fileInput), function(err, data) {
      if (err) {
        return self.emit('error', err);
      }

      var hasAudioStreams = data.streams.some(function(stream) {
        return stream.codec_type === 'audio';
      });

      var hasVideoStreams = data.streams.some(function(stream) {
        return stream.codec_type === 'video';
      });

      // Setup concat filter and start processing
      self.output(target, options)
        .complexFilter({
          filter: 'concat',
          options: {
            n: self._inputs.length,
            v: hasVideoStreams ? 1 : 0,
            a: hasAudioStreams ? 1 : 0
          }
        })
        .run();
    });

    return this;
  };
};


/***/ }),
/* 170 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)

const BUF_LENGTH = 64 * 1024
const _buff = __webpack_require__(85)(BUF_LENGTH)

function copyFileSync (srcFile, destFile, options) {
  const overwrite = options.overwrite
  const errorOnExist = options.errorOnExist
  const preserveTimestamps = options.preserveTimestamps

  if (fs.existsSync(destFile)) {
    if (overwrite) {
      fs.unlinkSync(destFile)
    } else if (errorOnExist) {
      throw new Error(`${destFile} already exists`)
    } else return
  }

  const fdr = fs.openSync(srcFile, 'r')
  const stat = fs.fstatSync(fdr)
  const fdw = fs.openSync(destFile, 'w', stat.mode)
  let bytesRead = 1
  let pos = 0

  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos)
    fs.writeSync(fdw, _buff, 0, bytesRead)
    pos += bytesRead
  }

  if (preserveTimestamps) {
    fs.futimesSync(fdw, stat.atime, stat.mtime)
  }

  fs.closeSync(fdr)
  fs.closeSync(fdw)
}

module.exports = copyFileSync


/***/ }),
/* 171 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const copyFileSync = __webpack_require__(170)
const mkdir = __webpack_require__(6)

function copySync (src, dest, options) {
  if (typeof options === 'function' || options instanceof RegExp) {
    options = {filter: options}
  }

  options = options || {}
  options.recursive = !!options.recursive

  // default to true for now
  options.clobber = 'clobber' in options ? !!options.clobber : true
  // overwrite falls back to clobber
  options.overwrite = 'overwrite' in options ? !!options.overwrite : options.clobber
  options.dereference = 'dereference' in options ? !!options.dereference : false
  options.preserveTimestamps = 'preserveTimestamps' in options ? !!options.preserveTimestamps : false

  options.filter = options.filter || function () { return true }

  // Warn about using preserveTimestamps on 32-bit node:
  if (options.preserveTimestamps && process.arch === 'ia32') {
    console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`)
  }

  const stats = (options.recursive && !options.dereference) ? fs.lstatSync(src) : fs.statSync(src)
  const destFolder = path.dirname(dest)
  const destFolderExists = fs.existsSync(destFolder)
  let performCopy = false

  if (options.filter instanceof RegExp) {
    console.warn('Warning: fs-extra: Passing a RegExp filter is deprecated, use a function')
    performCopy = options.filter.test(src)
  } else if (typeof options.filter === 'function') performCopy = options.filter(src, dest)

  if (stats.isFile() && performCopy) {
    if (!destFolderExists) mkdir.mkdirsSync(destFolder)
    copyFileSync(src, dest, {
      overwrite: options.overwrite,
      errorOnExist: options.errorOnExist,
      preserveTimestamps: options.preserveTimestamps
    })
  } else if (stats.isDirectory() && performCopy) {
    if (!fs.existsSync(dest)) mkdir.mkdirsSync(dest)
    const contents = fs.readdirSync(src)
    contents.forEach(content => {
      const opts = options
      opts.recursive = true
      copySync(path.join(src, content), path.join(dest, content), opts)
    })
  } else if (options.recursive && stats.isSymbolicLink() && performCopy) {
    const srcPath = fs.readlinkSync(src)
    fs.symlinkSync(srcPath, dest)
  }
}

module.exports = copySync


/***/ }),
/* 172 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const ncp = __webpack_require__(81)
const mkdir = __webpack_require__(6)
const pathExists = __webpack_require__(11).pathExists

function copy (src, dest, options, callback) {
  if (typeof options === 'function' && !callback) {
    callback = options
    options = {}
  } else if (typeof options === 'function' || options instanceof RegExp) {
    options = {filter: options}
  }
  callback = callback || function () {}
  options = options || {}

  // Warn about using preserveTimestamps on 32-bit node:
  if (options.preserveTimestamps && process.arch === 'ia32') {
    console.warn(`fs-extra: Using the preserveTimestamps option in 32-bit node is not recommended;\n
    see https://github.com/jprichardson/node-fs-extra/issues/269`)
  }

  // don't allow src and dest to be the same
  const basePath = process.cwd()
  const currentPath = path.resolve(basePath, src)
  const targetPath = path.resolve(basePath, dest)
  if (currentPath === targetPath) return callback(new Error('Source and destination must not be the same.'))

  fs.lstat(src, (err, stats) => {
    if (err) return callback(err)

    let dir = null
    if (stats.isDirectory()) {
      const parts = dest.split(path.sep)
      parts.pop()
      dir = parts.join(path.sep)
    } else {
      dir = path.dirname(dest)
    }

    pathExists(dir, (err, dirExists) => {
      if (err) return callback(err)
      if (dirExists) return ncp(src, dest, options, callback)
      mkdir.mkdirs(dir, err => {
        if (err) return callback(err)
        ncp(src, dest, options, callback)
      })
    })
  })
}

module.exports = copy


/***/ }),
/* 173 */
/***/ (function(module, exports, __webpack_require__) {

const u = __webpack_require__(4).fromCallback
module.exports = {
  copy: u(__webpack_require__(172))
}


/***/ }),
/* 174 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const fs = __webpack_require__(2)
const path = __webpack_require__(0)
const mkdir = __webpack_require__(6)
const remove = __webpack_require__(31)

const emptyDir = u(function emptyDir (dir, callback) {
  callback = callback || function () {}
  fs.readdir(dir, (err, items) => {
    if (err) return mkdir.mkdirs(dir, callback)

    items = items.map(item => path.join(dir, item))

    deleteItem()

    function deleteItem () {
      const item = items.pop()
      if (!item) return callback()
      remove.remove(item, err => {
        if (err) return callback(err)
        deleteItem()
      })
    }
  })
})

function emptyDirSync (dir) {
  let items
  try {
    items = fs.readdirSync(dir)
  } catch (err) {
    return mkdir.mkdirsSync(dir)
  }

  items.forEach(item => {
    item = path.join(dir, item)
    remove.removeSync(item)
  })
}

module.exports = {
  emptyDirSync,
  emptydirSync: emptyDirSync,
  emptyDir,
  emptydir: emptyDir
}


/***/ }),
/* 175 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const path = __webpack_require__(0)
const fs = __webpack_require__(1)
const mkdir = __webpack_require__(6)
const pathExists = __webpack_require__(11).pathExists

function createFile (file, callback) {
  function makeFile () {
    fs.writeFile(file, '', err => {
      if (err) return callback(err)
      callback()
    })
  }

  pathExists(file, (err, fileExists) => {
    if (err) return callback(err)
    if (fileExists) return callback()
    const dir = path.dirname(file)
    pathExists(dir, (err, dirExists) => {
      if (err) return callback(err)
      if (dirExists) return makeFile()
      mkdir.mkdirs(dir, err => {
        if (err) return callback(err)
        makeFile()
      })
    })
  })
}

function createFileSync (file) {
  if (fs.existsSync(file)) return

  const dir = path.dirname(file)
  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir)
  }

  fs.writeFileSync(file, '')
}

module.exports = {
  createFile: u(createFile),
  createFileSync
}


/***/ }),
/* 176 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const file = __webpack_require__(175)
const link = __webpack_require__(177)
const symlink = __webpack_require__(180)

module.exports = {
  // file
  createFile: file.createFile,
  createFileSync: file.createFileSync,
  ensureFile: file.createFile,
  ensureFileSync: file.createFileSync,
  // link
  createLink: link.createLink,
  createLinkSync: link.createLinkSync,
  ensureLink: link.createLink,
  ensureLinkSync: link.createLinkSync,
  // symlink
  createSymlink: symlink.createSymlink,
  createSymlinkSync: symlink.createSymlinkSync,
  ensureSymlink: symlink.createSymlink,
  ensureSymlinkSync: symlink.createSymlinkSync
}


/***/ }),
/* 177 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const path = __webpack_require__(0)
const fs = __webpack_require__(1)
const mkdir = __webpack_require__(6)
const pathExists = __webpack_require__(11).pathExists

function createLink (srcpath, dstpath, callback) {
  function makeLink (srcpath, dstpath) {
    fs.link(srcpath, dstpath, err => {
      if (err) return callback(err)
      callback(null)
    })
  }

  pathExists(dstpath, (err, destinationExists) => {
    if (err) return callback(err)
    if (destinationExists) return callback(null)
    fs.lstat(srcpath, (err, stat) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureLink')
        return callback(err)
      }

      const dir = path.dirname(dstpath)
      pathExists(dir, (err, dirExists) => {
        if (err) return callback(err)
        if (dirExists) return makeLink(srcpath, dstpath)
        mkdir.mkdirs(dir, err => {
          if (err) return callback(err)
          makeLink(srcpath, dstpath)
        })
      })
    })
  })
}

function createLinkSync (srcpath, dstpath, callback) {
  const destinationExists = fs.existsSync(dstpath)
  if (destinationExists) return undefined

  try {
    fs.lstatSync(srcpath)
  } catch (err) {
    err.message = err.message.replace('lstat', 'ensureLink')
    throw err
  }

  const dir = path.dirname(dstpath)
  const dirExists = fs.existsSync(dir)
  if (dirExists) return fs.linkSync(srcpath, dstpath)
  mkdir.mkdirsSync(dir)

  return fs.linkSync(srcpath, dstpath)
}

module.exports = {
  createLink: u(createLink),
  createLinkSync
}


/***/ }),
/* 178 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0)
const fs = __webpack_require__(1)
const pathExists = __webpack_require__(11).pathExists

/**
 * Function that returns two types of paths, one relative to symlink, and one
 * relative to the current working directory. Checks if path is absolute or
 * relative. If the path is relative, this function checks if the path is
 * relative to symlink or relative to current working directory. This is an
 * initiative to find a smarter `srcpath` to supply when building symlinks.
 * This allows you to determine which path to use out of one of three possible
 * types of source paths. The first is an absolute path. This is detected by
 * `path.isAbsolute()`. When an absolute path is provided, it is checked to
 * see if it exists. If it does it's used, if not an error is returned
 * (callback)/ thrown (sync). The other two options for `srcpath` are a
 * relative url. By default Node's `fs.symlink` works by creating a symlink
 * using `dstpath` and expects the `srcpath` to be relative to the newly
 * created symlink. If you provide a `srcpath` that does not exist on the file
 * system it results in a broken symlink. To minimize this, the function
 * checks to see if the 'relative to symlink' source file exists, and if it
 * does it will use it. If it does not, it checks if there's a file that
 * exists that is relative to the current working directory, if does its used.
 * This preserves the expectations of the original fs.symlink spec and adds
 * the ability to pass in `relative to current working direcotry` paths.
 */

function symlinkPaths (srcpath, dstpath, callback) {
  if (path.isAbsolute(srcpath)) {
    return fs.lstat(srcpath, (err, stat) => {
      if (err) {
        err.message = err.message.replace('lstat', 'ensureSymlink')
        return callback(err)
      }
      return callback(null, {
        'toCwd': srcpath,
        'toDst': srcpath
      })
    })
  } else {
    const dstdir = path.dirname(dstpath)
    const relativeToDst = path.join(dstdir, srcpath)
    return pathExists(relativeToDst, (err, exists) => {
      if (err) return callback(err)
      if (exists) {
        return callback(null, {
          'toCwd': relativeToDst,
          'toDst': srcpath
        })
      } else {
        return fs.lstat(srcpath, (err, stat) => {
          if (err) {
            err.message = err.message.replace('lstat', 'ensureSymlink')
            return callback(err)
          }
          return callback(null, {
            'toCwd': srcpath,
            'toDst': path.relative(dstdir, srcpath)
          })
        })
      }
    })
  }
}

function symlinkPathsSync (srcpath, dstpath) {
  let exists
  if (path.isAbsolute(srcpath)) {
    exists = fs.existsSync(srcpath)
    if (!exists) throw new Error('absolute srcpath does not exist')
    return {
      'toCwd': srcpath,
      'toDst': srcpath
    }
  } else {
    const dstdir = path.dirname(dstpath)
    const relativeToDst = path.join(dstdir, srcpath)
    exists = fs.existsSync(relativeToDst)
    if (exists) {
      return {
        'toCwd': relativeToDst,
        'toDst': srcpath
      }
    } else {
      exists = fs.existsSync(srcpath)
      if (!exists) throw new Error('relative srcpath does not exist')
      return {
        'toCwd': srcpath,
        'toDst': path.relative(dstdir, srcpath)
      }
    }
  }
}

module.exports = {
  symlinkPaths,
  symlinkPathsSync
}


/***/ }),
/* 179 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)

function symlinkType (srcpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback
  type = (typeof type === 'function') ? false : type
  if (type) return callback(null, type)
  fs.lstat(srcpath, (err, stats) => {
    if (err) return callback(null, 'file')
    type = (stats && stats.isDirectory()) ? 'dir' : 'file'
    callback(null, type)
  })
}

function symlinkTypeSync (srcpath, type) {
  let stats

  if (type) return type
  try {
    stats = fs.lstatSync(srcpath)
  } catch (e) {
    return 'file'
  }
  return (stats && stats.isDirectory()) ? 'dir' : 'file'
}

module.exports = {
  symlinkType,
  symlinkTypeSync
}


/***/ }),
/* 180 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const path = __webpack_require__(0)
const fs = __webpack_require__(1)
const _mkdirs = __webpack_require__(6)
const mkdirs = _mkdirs.mkdirs
const mkdirsSync = _mkdirs.mkdirsSync

const _symlinkPaths = __webpack_require__(178)
const symlinkPaths = _symlinkPaths.symlinkPaths
const symlinkPathsSync = _symlinkPaths.symlinkPathsSync

const _symlinkType = __webpack_require__(179)
const symlinkType = _symlinkType.symlinkType
const symlinkTypeSync = _symlinkType.symlinkTypeSync

const pathExists = __webpack_require__(11).pathExists

function createSymlink (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback
  type = (typeof type === 'function') ? false : type

  pathExists(dstpath, (err, destinationExists) => {
    if (err) return callback(err)
    if (destinationExists) return callback(null)
    symlinkPaths(srcpath, dstpath, (err, relative) => {
      if (err) return callback(err)
      srcpath = relative.toDst
      symlinkType(relative.toCwd, type, (err, type) => {
        if (err) return callback(err)
        const dir = path.dirname(dstpath)
        pathExists(dir, (err, dirExists) => {
          if (err) return callback(err)
          if (dirExists) return fs.symlink(srcpath, dstpath, type, callback)
          mkdirs(dir, err => {
            if (err) return callback(err)
            fs.symlink(srcpath, dstpath, type, callback)
          })
        })
      })
    })
  })
}

function createSymlinkSync (srcpath, dstpath, type, callback) {
  callback = (typeof type === 'function') ? type : callback
  type = (typeof type === 'function') ? false : type

  const destinationExists = fs.existsSync(dstpath)
  if (destinationExists) return undefined

  const relative = symlinkPathsSync(srcpath, dstpath)
  srcpath = relative.toDst
  type = symlinkTypeSync(relative.toCwd, type)
  const dir = path.dirname(dstpath)
  const exists = fs.existsSync(dir)
  if (exists) return fs.symlinkSync(srcpath, dstpath, type)
  mkdirsSync(dir)
  return fs.symlinkSync(srcpath, dstpath, type)
}

module.exports = {
  createSymlink: u(createSymlink),
  createSymlinkSync
}


/***/ }),
/* 181 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const jsonFile = __webpack_require__(46)

jsonFile.outputJsonSync = __webpack_require__(182)
jsonFile.outputJson = u(__webpack_require__(183))
// aliases
jsonFile.outputJSONSync = jsonFile.outputJSONSync
jsonFile.outputJSON = jsonFile.outputJson
jsonFile.writeJSON = jsonFile.writeJson
jsonFile.writeJSONSync = jsonFile.writeJsonSync
jsonFile.readJSON = jsonFile.readJson
jsonFile.readJSONSync = jsonFile.readJsonSync

module.exports = jsonFile


/***/ }),
/* 182 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const mkdir = __webpack_require__(6)
const jsonFile = __webpack_require__(46)

function outputJsonSync (file, data, options) {
  const dir = path.dirname(file)

  if (!fs.existsSync(dir)) {
    mkdir.mkdirsSync(dir)
  }

  jsonFile.writeJsonSync(file, data, options)
}

module.exports = outputJsonSync


/***/ }),
/* 183 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const path = __webpack_require__(0)
const mkdir = __webpack_require__(6)
const pathExists = __webpack_require__(11).pathExists
const jsonFile = __webpack_require__(46)

function outputJson (file, data, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const dir = path.dirname(file)

  pathExists(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return jsonFile.writeJson(file, data, options, callback)

    mkdir.mkdirs(dir, err => {
      if (err) return callback(err)
      jsonFile.writeJson(file, data, options, callback)
    })
  })
}

module.exports = outputJson


/***/ }),
/* 184 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const invalidWin32Path = __webpack_require__(84).invalidWin32Path

const o777 = parseInt('0777', 8)

function mkdirsSync (p, opts, made) {
  if (!opts || typeof opts !== 'object') {
    opts = { mode: opts }
  }

  let mode = opts.mode
  const xfs = opts.fs || fs

  if (process.platform === 'win32' && invalidWin32Path(p)) {
    const errInval = new Error(p + ' contains invalid WIN32 path characters.')
    errInval.code = 'EINVAL'
    throw errInval
  }

  if (mode === undefined) {
    mode = o777 & (~process.umask())
  }
  if (!made) made = null

  p = path.resolve(p)

  try {
    xfs.mkdirSync(p, mode)
    made = made || p
  } catch (err0) {
    switch (err0.code) {
      case 'ENOENT':
        if (path.dirname(p) === p) throw err0
        made = mkdirsSync(path.dirname(p), opts, made)
        mkdirsSync(p, opts, made)
        break

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        let stat
        try {
          stat = xfs.statSync(p)
        } catch (err1) {
          throw err0
        }
        if (!stat.isDirectory()) throw err0
        break
    }
  }

  return made
}

module.exports = mkdirsSync


/***/ }),
/* 185 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const invalidWin32Path = __webpack_require__(84).invalidWin32Path

const o777 = parseInt('0777', 8)

function mkdirs (p, opts, callback, made) {
  if (typeof opts === 'function') {
    callback = opts
    opts = {}
  } else if (!opts || typeof opts !== 'object') {
    opts = { mode: opts }
  }

  if (process.platform === 'win32' && invalidWin32Path(p)) {
    const errInval = new Error(p + ' contains invalid WIN32 path characters.')
    errInval.code = 'EINVAL'
    return callback(errInval)
  }

  let mode = opts.mode
  const xfs = opts.fs || fs

  if (mode === undefined) {
    mode = o777 & (~process.umask())
  }
  if (!made) made = null

  callback = callback || function () {}
  p = path.resolve(p)

  xfs.mkdir(p, mode, er => {
    if (!er) {
      made = made || p
      return callback(null, made)
    }
    switch (er.code) {
      case 'ENOENT':
        if (path.dirname(p) === p) return callback(er)
        mkdirs(path.dirname(p), opts, (er, made) => {
          if (er) callback(er, made)
          else mkdirs(p, opts, callback, made)
        })
        break

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        xfs.stat(p, (er2, stat) => {
          // if the stat fails, then that's super weird.
          // let the original error be the failure reason.
          if (er2 || !stat.isDirectory()) callback(er, made)
          else callback(null, made)
        })
        break
    }
  })
}

module.exports = mkdirs


/***/ }),
/* 186 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const copySync = __webpack_require__(80).copySync
const removeSync = __webpack_require__(31).removeSync
const mkdirpSync = __webpack_require__(6).mkdirsSync
const buffer = __webpack_require__(85)

function moveSync (src, dest, options) {
  options = options || {}
  const overwrite = options.overwrite || options.clobber || false

  src = path.resolve(src)
  dest = path.resolve(dest)

  if (src === dest) return fs.accessSync(src)

  if (isSrcSubdir(src, dest)) throw new Error(`Cannot move '${src}' into itself '${dest}'.`)

  mkdirpSync(path.dirname(dest))
  tryRenameSync()

  function tryRenameSync () {
    if (overwrite) {
      try {
        return fs.renameSync(src, dest)
      } catch (err) {
        if (err.code === 'ENOTEMPTY' || err.code === 'EEXIST' || err.code === 'EPERM') {
          removeSync(dest)
          options.overwrite = false // just overwriteed it, no need to do it again
          return moveSync(src, dest, options)
        }

        if (err.code !== 'EXDEV') throw err
        return moveSyncAcrossDevice(src, dest, overwrite)
      }
    } else {
      try {
        fs.linkSync(src, dest)
        return fs.unlinkSync(src)
      } catch (err) {
        if (err.code === 'EXDEV' || err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTSUP') {
          return moveSyncAcrossDevice(src, dest, overwrite)
        }
        throw err
      }
    }
  }
}

function moveSyncAcrossDevice (src, dest, overwrite) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    return moveDirSyncAcrossDevice(src, dest, overwrite)
  } else {
    return moveFileSyncAcrossDevice(src, dest, overwrite)
  }
}

function moveFileSyncAcrossDevice (src, dest, overwrite) {
  const BUF_LENGTH = 64 * 1024
  const _buff = buffer(BUF_LENGTH)

  const flags = overwrite ? 'w' : 'wx'

  const fdr = fs.openSync(src, 'r')
  const stat = fs.fstatSync(fdr)
  const fdw = fs.openSync(dest, flags, stat.mode)
  let bytesRead = 1
  let pos = 0

  while (bytesRead > 0) {
    bytesRead = fs.readSync(fdr, _buff, 0, BUF_LENGTH, pos)
    fs.writeSync(fdw, _buff, 0, bytesRead)
    pos += bytesRead
  }

  fs.closeSync(fdr)
  fs.closeSync(fdw)
  return fs.unlinkSync(src)
}

function moveDirSyncAcrossDevice (src, dest, overwrite) {
  const options = {
    overwrite: false
  }

  if (overwrite) {
    removeSync(dest)
    tryCopySync()
  } else {
    tryCopySync()
  }

  function tryCopySync () {
    copySync(src, dest, options)
    return removeSync(src)
  }
}

// return true if dest is a subdir of src, otherwise false.
// extract dest base dir and check if that is the same as src basename
function isSrcSubdir (src, dest) {
  try {
    return fs.statSync(src).isDirectory() &&
           src !== dest &&
           dest.indexOf(src) > -1 &&
           dest.split(path.dirname(src) + path.sep)[1].split(path.sep)[0] === path.basename(src)
  } catch (e) {
    return false
  }
}

module.exports = {
  moveSync
}


/***/ }),
/* 187 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// most of this code was written by Andrew Kelley
// licensed under the BSD license: see
// https://github.com/andrewrk/node-mv/blob/master/package.json

// this needs a cleanup

const u = __webpack_require__(4).fromCallback
const fs = __webpack_require__(1)
const ncp = __webpack_require__(81)
const path = __webpack_require__(0)
const remove = __webpack_require__(31).remove
const mkdirp = __webpack_require__(6).mkdirs

function move (source, dest, options, callback) {
  if (typeof options === 'function') {
    callback = options
    options = {}
  }

  const shouldMkdirp = ('mkdirp' in options) ? options.mkdirp : true
  const overwrite = options.overwrite || options.clobber || false

  if (shouldMkdirp) {
    mkdirs()
  } else {
    doRename()
  }

  function mkdirs () {
    mkdirp(path.dirname(dest), err => {
      if (err) return callback(err)
      doRename()
    })
  }

  function doRename () {
    if (path.resolve(source) === path.resolve(dest)) {
      fs.access(source, callback)
    } else if (overwrite) {
      fs.rename(source, dest, err => {
        if (!err) return callback()

        if (err.code === 'ENOTEMPTY' || err.code === 'EEXIST') {
          remove(dest, err => {
            if (err) return callback(err)
            options.overwrite = false // just overwriteed it, no need to do it again
            move(source, dest, options, callback)
          })
          return
        }

        // weird Windows shit
        if (err.code === 'EPERM') {
          setTimeout(() => {
            remove(dest, err => {
              if (err) return callback(err)
              options.overwrite = false
              move(source, dest, options, callback)
            })
          }, 200)
          return
        }

        if (err.code !== 'EXDEV') return callback(err)
        moveAcrossDevice(source, dest, overwrite, callback)
      })
    } else {
      fs.link(source, dest, err => {
        if (err) {
          if (err.code === 'EXDEV' || err.code === 'EISDIR' || err.code === 'EPERM' || err.code === 'ENOTSUP') {
            moveAcrossDevice(source, dest, overwrite, callback)
            return
          }
          callback(err)
          return
        }
        fs.unlink(source, callback)
      })
    }
  }
}

function moveAcrossDevice (source, dest, overwrite, callback) {
  fs.stat(source, (err, stat) => {
    if (err) {
      callback(err)
      return
    }

    if (stat.isDirectory()) {
      moveDirAcrossDevice(source, dest, overwrite, callback)
    } else {
      moveFileAcrossDevice(source, dest, overwrite, callback)
    }
  })
}

function moveFileAcrossDevice (source, dest, overwrite, callback) {
  const flags = overwrite ? 'w' : 'wx'
  const ins = fs.createReadStream(source)
  const outs = fs.createWriteStream(dest, { flags })

  ins.on('error', err => {
    ins.destroy()
    outs.destroy()
    outs.removeListener('close', onClose)

    // may want to create a directory but `out` line above
    // creates an empty file for us: See #108
    // don't care about error here
    fs.unlink(dest, () => {
      // note: `err` here is from the input stream errror
      if (err.code === 'EISDIR' || err.code === 'EPERM') {
        moveDirAcrossDevice(source, dest, overwrite, callback)
      } else {
        callback(err)
      }
    })
  })

  outs.on('error', err => {
    ins.destroy()
    outs.destroy()
    outs.removeListener('close', onClose)
    callback(err)
  })

  outs.once('close', onClose)
  ins.pipe(outs)

  function onClose () {
    fs.unlink(source, callback)
  }
}

function moveDirAcrossDevice (source, dest, overwrite, callback) {
  const options = {
    overwrite: false
  }

  if (overwrite) {
    remove(dest, err => {
      if (err) return callback(err)
      startNcp()
    })
  } else {
    startNcp()
  }

  function startNcp () {
    ncp(source, dest, options, err => {
      if (err) return callback(err)
      remove(source, callback)
    })
  }
}

module.exports = {
  move: u(move)
}


/***/ }),
/* 188 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const u = __webpack_require__(4).fromCallback
const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const mkdir = __webpack_require__(6)
const pathExists = __webpack_require__(11).pathExists

function outputFile (file, data, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding
    encoding = 'utf8'
  }

  const dir = path.dirname(file)
  pathExists(dir, (err, itDoes) => {
    if (err) return callback(err)
    if (itDoes) return fs.writeFile(file, data, encoding, callback)

    mkdir.mkdirs(dir, err => {
      if (err) return callback(err)

      fs.writeFile(file, data, encoding, callback)
    })
  })
}

function outputFileSync (file, data, encoding) {
  const dir = path.dirname(file)
  if (fs.existsSync(dir)) {
    return fs.writeFileSync.apply(fs, arguments)
  }
  mkdir.mkdirsSync(dir)
  fs.writeFileSync.apply(fs, arguments)
}

module.exports = {
  outputFile: u(outputFile),
  outputFileSync
}


/***/ }),
/* 189 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const path = __webpack_require__(0)
const assert = __webpack_require__(32)

const isWindows = (process.platform === 'win32')

function defaults (options) {
  const methods = [
    'unlink',
    'chmod',
    'stat',
    'lstat',
    'rmdir',
    'readdir'
  ]
  methods.forEach(m => {
    options[m] = options[m] || fs[m]
    m = m + 'Sync'
    options[m] = options[m] || fs[m]
  })

  options.maxBusyTries = options.maxBusyTries || 3
}

function rimraf (p, options, cb) {
  let busyTries = 0

  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  assert(p, 'rimraf: missing path')
  assert.equal(typeof p, 'string', 'rimraf: path should be a string')
  assert.equal(typeof cb, 'function', 'rimraf: callback function required')
  assert(options, 'rimraf: invalid options argument provided')
  assert.equal(typeof options, 'object', 'rimraf: options should be object')

  defaults(options)

  rimraf_(p, options, function CB (er) {
    if (er) {
      if (isWindows && (er.code === 'EBUSY' || er.code === 'ENOTEMPTY' || er.code === 'EPERM') &&
          busyTries < options.maxBusyTries) {
        busyTries++
        let time = busyTries * 100
        // try again, with the same exact callback as this one.
        return setTimeout(() => rimraf_(p, options, CB), time)
      }

      // already gone
      if (er.code === 'ENOENT') er = null
    }

    cb(er)
  })
}

// Two possible strategies.
// 1. Assume it's a file.  unlink it, then do the dir stuff on EPERM or EISDIR
// 2. Assume it's a directory.  readdir, then do the file stuff on ENOTDIR
//
// Both result in an extra syscall when you guess wrong.  However, there
// are likely far more normal files in the world than directories.  This
// is based on the assumption that a the average number of files per
// directory is >= 1.
//
// If anyone ever complains about this, then I guess the strategy could
// be made configurable somehow.  But until then, YAGNI.
function rimraf_ (p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  // sunos lets the root user unlink directories, which is... weird.
  // so we have to lstat here and make sure it's not a dir.
  options.lstat(p, (er, st) => {
    if (er && er.code === 'ENOENT') {
      return cb(null)
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er && er.code === 'EPERM' && isWindows) {
      return fixWinEPERM(p, options, er, cb)
    }

    if (st && st.isDirectory()) {
      return rmdir(p, options, er, cb)
    }

    options.unlink(p, er => {
      if (er) {
        if (er.code === 'ENOENT') {
          return cb(null)
        }
        if (er.code === 'EPERM') {
          return (isWindows)
            ? fixWinEPERM(p, options, er, cb)
            : rmdir(p, options, er, cb)
        }
        if (er.code === 'EISDIR') {
          return rmdir(p, options, er, cb)
        }
      }
      return cb(er)
    })
  })
}

function fixWinEPERM (p, options, er, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')
  if (er) {
    assert(er instanceof Error)
  }

  options.chmod(p, 666, er2 => {
    if (er2) {
      cb(er2.code === 'ENOENT' ? null : er)
    } else {
      options.stat(p, (er3, stats) => {
        if (er3) {
          cb(er3.code === 'ENOENT' ? null : er)
        } else if (stats.isDirectory()) {
          rmdir(p, options, er, cb)
        } else {
          options.unlink(p, cb)
        }
      })
    }
  })
}

function fixWinEPERMSync (p, options, er) {
  let stats

  assert(p)
  assert(options)
  if (er) {
    assert(er instanceof Error)
  }

  try {
    options.chmodSync(p, 666)
  } catch (er2) {
    if (er2.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  try {
    stats = options.statSync(p)
  } catch (er3) {
    if (er3.code === 'ENOENT') {
      return
    } else {
      throw er
    }
  }

  if (stats.isDirectory()) {
    rmdirSync(p, options, er)
  } else {
    options.unlinkSync(p)
  }
}

function rmdir (p, options, originalEr, cb) {
  assert(p)
  assert(options)
  if (originalEr) {
    assert(originalEr instanceof Error)
  }
  assert(typeof cb === 'function')

  // try to rmdir first, and only readdir on ENOTEMPTY or EEXIST (SunOS)
  // if we guessed wrong, and it's not a directory, then
  // raise the original error.
  options.rmdir(p, er => {
    if (er && (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM')) {
      rmkids(p, options, cb)
    } else if (er && er.code === 'ENOTDIR') {
      cb(originalEr)
    } else {
      cb(er)
    }
  })
}

function rmkids (p, options, cb) {
  assert(p)
  assert(options)
  assert(typeof cb === 'function')

  options.readdir(p, (er, files) => {
    if (er) return cb(er)

    let n = files.length
    let errState

    if (n === 0) return options.rmdir(p, cb)

    files.forEach(f => {
      rimraf(path.join(p, f), options, er => {
        if (errState) {
          return
        }
        if (er) return cb(errState = er)
        if (--n === 0) {
          options.rmdir(p, cb)
        }
      })
    })
  })
}

// this looks simpler, and is strictly *faster*, but will
// tie up the JavaScript thread and fail on excessively
// deep directory trees.
function rimrafSync (p, options) {
  let st

  options = options || {}
  defaults(options)

  assert(p, 'rimraf: missing path')
  assert.equal(typeof p, 'string', 'rimraf: path should be a string')
  assert(options, 'rimraf: missing options')
  assert.equal(typeof options, 'object', 'rimraf: options should be object')

  try {
    st = options.lstatSync(p)
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    }

    // Windows can EPERM on stat.  Life is suffering.
    if (er.code === 'EPERM' && isWindows) {
      fixWinEPERMSync(p, options, er)
    }
  }

  try {
    // sunos lets the root user unlink directories, which is... weird.
    if (st && st.isDirectory()) {
      rmdirSync(p, options, null)
    } else {
      options.unlinkSync(p)
    }
  } catch (er) {
    if (er.code === 'ENOENT') {
      return
    } else if (er.code === 'EPERM') {
      return isWindows ? fixWinEPERMSync(p, options, er) : rmdirSync(p, options, er)
    } else if (er.code !== 'EISDIR') {
      throw er
    }
    rmdirSync(p, options, er)
  }
}

function rmdirSync (p, options, originalEr) {
  assert(p)
  assert(options)
  if (originalEr) {
    assert(originalEr instanceof Error)
  }

  try {
    options.rmdirSync(p)
  } catch (er) {
    if (er.code === 'ENOTDIR') {
      throw originalEr
    } else if (er.code === 'ENOTEMPTY' || er.code === 'EEXIST' || er.code === 'EPERM') {
      rmkidsSync(p, options)
    } else if (er.code !== 'ENOENT') {
      throw er
    }
  }
}

function rmkidsSync (p, options) {
  assert(p)
  assert(options)
  options.readdirSync(p).forEach(f => rimrafSync(path.join(p, f), options))
  options.rmdirSync(p, options)
}

module.exports = rimraf
rimraf.sync = rimrafSync


/***/ }),
/* 190 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// simple mutable assign
function assign () {
  const args = [].slice.call(arguments).filter(i => i)
  const dest = args.shift()
  args.forEach(src => {
    Object.keys(src).forEach(key => {
      dest[key] = src[key]
    })
  })

  return dest
}

module.exports = assign


/***/ }),
/* 191 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const fs = __webpack_require__(1)
const os = __webpack_require__(115)
const path = __webpack_require__(0)

// HFS, ext{2,3}, FAT do not, Node.js v0.10 does not
function hasMillisResSync () {
  let tmpfile = path.join('millis-test-sync' + Date.now().toString() + Math.random().toString().slice(2))
  tmpfile = path.join(os.tmpdir(), tmpfile)

  // 550 millis past UNIX epoch
  const d = new Date(1435410243862)
  fs.writeFileSync(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141')
  const fd = fs.openSync(tmpfile, 'r+')
  fs.futimesSync(fd, d, d)
  fs.closeSync(fd)
  return fs.statSync(tmpfile).mtime > 1435410243000
}

function hasMillisRes (callback) {
  let tmpfile = path.join('millis-test' + Date.now().toString() + Math.random().toString().slice(2))
  tmpfile = path.join(os.tmpdir(), tmpfile)

  // 550 millis past UNIX epoch
  const d = new Date(1435410243862)
  fs.writeFile(tmpfile, 'https://github.com/jprichardson/node-fs-extra/pull/141', err => {
    if (err) return callback(err)
    fs.open(tmpfile, 'r+', (err, fd) => {
      if (err) return callback(err)
      fs.futimes(fd, d, d, err => {
        if (err) return callback(err)
        fs.close(fd, err => {
          if (err) return callback(err)
          fs.stat(tmpfile, (err, stats) => {
            if (err) return callback(err)
            callback(null, stats.mtime > 1435410243000)
          })
        })
      })
    })
  })
}

function timeRemoveMillis (timestamp) {
  if (typeof timestamp === 'number') {
    return Math.floor(timestamp / 1000) * 1000
  } else if (timestamp instanceof Date) {
    return new Date(Math.floor(timestamp.getTime() / 1000) * 1000)
  } else {
    throw new Error('fs-extra: timeRemoveMillis() unknown parameter type')
  }
}

function utimesMillis (path, atime, mtime, callback) {
  // if (!HAS_MILLIS_RES) return fs.utimes(path, atime, mtime, callback)
  fs.open(path, 'r+', (err, fd) => {
    if (err) return callback(err)
    fs.futimes(fd, atime, mtime, futimesErr => {
      fs.close(fd, closeErr => {
        if (callback) callback(futimesErr || closeErr)
      })
    })
  })
}

module.exports = {
  hasMillisRes,
  hasMillisResSync,
  timeRemoveMillis,
  utimesMillis
}


/***/ }),
/* 192 */
/***/ (function(module, exports, __webpack_require__) {

var PassThrough = __webpack_require__(19).PassThrough;
var objectAssign = __webpack_require__(101);

module.exports = function (opts) {
	opts = objectAssign({}, opts);

	var array = opts.array;
	var encoding = opts.encoding;

	var buffer = encoding === 'buffer';
	var objectMode = false;

	if (array) {
		objectMode = !(encoding || buffer);
	} else {
		encoding = encoding || 'utf8';
	}

	if (buffer) {
		encoding = null;
	}

	var len = 0;
	var ret = [];

	var stream = new PassThrough({objectMode: objectMode});

	if (encoding) {
		stream.setEncoding(encoding);
	}

	stream.on('data', function (chunk) {
		ret.push(chunk);

		if (objectMode) {
			len = ret.length;
		} else {
			len += chunk.length;
		}
	});

	stream.getBufferedValue = function () {
		if (array) {
			return ret;
		}
		return buffer ? Buffer.concat(ret, len) : ret.join('');
	};

	stream.getBufferedLength = function () {
		return len;
	};

	return stream;
};


/***/ }),
/* 193 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var Promise = __webpack_require__(207);
var objectAssign = __webpack_require__(101);
var bufferStream = __webpack_require__(192);

function getStream(inputStream, opts) {
	if (!inputStream) {
		return Promise.reject(new Error('Expected a stream'));
	}

	opts = objectAssign({maxBuffer: Infinity}, opts);
	var maxBuffer = opts.maxBuffer;
	var stream;
	var clean;

	var p = new Promise(function (resolve, reject) {
		stream = bufferStream(opts);
		inputStream.once('error', error);
		inputStream.pipe(stream);

		stream.on('data', function () {
			if (stream.getBufferedLength() > maxBuffer) {
				reject(new Error('maxBuffer exceeded'));
			}
		});
		stream.once('error', error);
		stream.on('end', resolve);

		clean = function () {
			// some streams doesn't implement the stream.Readable interface correctly
			if (inputStream.unpipe) {
				inputStream.unpipe(stream);
			}
		};

		function error(err) {
			if (err) { // null check
				err.bufferedData = stream.getBufferedValue();
			}
			reject(err);
		}
	});

	p.then(clean, clean);

	return p.then(function () {
		return stream.getBufferedValue();
	});
}

module.exports = getStream;

module.exports.buffer = function (stream, opts) {
	return getStream(stream, objectAssign({}, opts, {encoding: 'buffer'}));
};

module.exports.array = function (stream, opts) {
	return getStream(stream, objectAssign({}, opts, {array: true}));
};


/***/ }),
/* 194 */
/***/ (function(module, exports, __webpack_require__) {

var Stream = __webpack_require__(19).Stream

module.exports = legacy

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    })
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}


/***/ }),
/* 195 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(86)
var constants = __webpack_require__(224)

var origCwd = process.cwd
var cwd = null

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
try {
  process.cwd()
} catch (er) {}

var chdir = process.chdir
process.chdir = function(d) {
  cwd = null
  chdir.call(process, d)
}

module.exports = patch

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs)
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs)
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown)
  fs.fchown = chownFix(fs.fchown)
  fs.lchown = chownFix(fs.lchown)

  fs.chmod = chmodFix(fs.chmod)
  fs.fchmod = chmodFix(fs.fchmod)
  fs.lchmod = chmodFix(fs.lchmod)

  fs.chownSync = chownFixSync(fs.chownSync)
  fs.fchownSync = chownFixSync(fs.fchownSync)
  fs.lchownSync = chownFixSync(fs.lchownSync)

  fs.chmodSync = chmodFixSync(fs.chmodSync)
  fs.fchmodSync = chmodFixSync(fs.fchmodSync)
  fs.lchmodSync = chmodFixSync(fs.lchmodSync)

  fs.stat = statFix(fs.stat)
  fs.fstat = statFix(fs.fstat)
  fs.lstat = statFix(fs.lstat)

  fs.statSync = statFixSync(fs.statSync)
  fs.fstatSync = statFixSync(fs.fstatSync)
  fs.lstatSync = statFixSync(fs.lstatSync)

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchmodSync = function () {}
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchownSync = function () {}
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now()
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er)
            })
          }, backoff)
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er)
      })
    }})(fs.rename)
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) { return function (fd, buffer, offset, length, position, callback_) {
    var callback
    if (callback_ && typeof callback_ === 'function') {
      var eagCounter = 0
      callback = function (er, _, __) {
        if (er && er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          return fs$read.call(fs, fd, buffer, offset, length, position, callback)
        }
        callback_.apply(this, arguments)
      }
    }
    return fs$read.call(fs, fd, buffer, offset, length, position, callback)
  }})(fs.read)

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          continue
        }
        throw er
      }
    }
  }})(fs.readSync)
}

function patchLchmod (fs) {
  fs.lchmod = function (path, mode, callback) {
    fs.open( path
           , constants.O_WRONLY | constants.O_SYMLINK
           , mode
           , function (err, fd) {
      if (err) {
        if (callback) callback(err)
        return
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function(err2) {
          if (callback) callback(err || err2)
        })
      })
    })
  }

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var threw = true
    var ret
    try {
      ret = fs.fchmodSync(fd, mode)
      threw = false
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd)
        } catch (er) {}
      } else {
        fs.closeSync(fd)
      }
    }
    return ret
  }
}

function patchLutimes (fs) {
  if (constants.hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function (er, fd) {
        if (er) {
          if (cb) cb(er)
          return
        }
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            if (cb) cb(er || er2)
          })
        })
      })
    }

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants.O_SYMLINK)
      var ret
      var threw = true
      try {
        ret = fs.futimesSync(fd, at, mt)
        threw = false
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd)
          } catch (er) {}
        } else {
          fs.closeSync(fd)
        }
      }
      return ret
    }

  } else {
    fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
    fs.lutimesSync = function () {}
  }
}

function chmodFix (orig) {
  if (!orig) return orig
  return function (target, mode, cb) {
    return orig.call(fs, target, mode, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chmodFixSync (orig) {
  if (!orig) return orig
  return function (target, mode) {
    try {
      return orig.call(fs, target, mode)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function chownFix (orig) {
  if (!orig) return orig
  return function (target, uid, gid, cb) {
    return orig.call(fs, target, uid, gid, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chownFixSync (orig) {
  if (!orig) return orig
  return function (target, uid, gid) {
    try {
      return orig.call(fs, target, uid, gid)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function statFix (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target, cb) {
    return orig.call(fs, target, function (er, stats) {
      if (!stats) return cb.apply(this, arguments)
      if (stats.uid < 0) stats.uid += 0x100000000
      if (stats.gid < 0) stats.gid += 0x100000000
      if (cb) cb.apply(this, arguments)
    })
  }
}

function statFixSync (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target) {
    var stats = orig.call(fs, target)
    if (stats.uid < 0) stats.uid += 0x100000000
    if (stats.gid < 0) stats.gid += 0x100000000
    return stats;
  }
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk (er) {
  if (!er)
    return true

  if (er.code === "ENOSYS")
    return true

  var nonroot = !process.getuid || process.getuid() !== 0
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM")
      return true
  }

  return false
}


/***/ }),
/* 196 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var typeMap = {};
var types = __webpack_require__(89);

// load all available handlers
types.forEach(function (type) {
  typeMap[type] = __webpack_require__(88)("./" + type).detect;
});

module.exports = function (buffer, filepath) {
  var type, result;
  for (type in typeMap) {
    result = typeMap[type](buffer, filepath);
    if (result) {
      return type;
    }
  }
};


/***/ }),
/* 197 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// Abstract reading multi-byte unsigned integers
function readUInt (buffer, bits, offset, isBigEndian) {
  offset = offset || 0;
  var endian = !!isBigEndian ? 'BE' : 'LE';
  var method = buffer['readUInt' + bits + endian];
  return method.call(buffer, offset);
}

module.exports = readUInt;


/***/ }),
/* 198 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(2)
var core
if (process.platform === 'win32' || global.TESTING_WINDOWS) {
  core = __webpack_require__(200)
} else {
  core = __webpack_require__(199)
}

module.exports = isexe
isexe.sync = sync

function isexe (path, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = {}
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe(path, options || {}, function (er, is) {
        if (er) {
          reject(er)
        } else {
          resolve(is)
        }
      })
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null
        is = false
      }
    }
    cb(er, is)
  })
}

function sync (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}


/***/ }),
/* 199 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = isexe
isexe.sync = sync

var fs = __webpack_require__(2)

function isexe (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat(stat, options))
  })
}

function sync (path, options) {
  return checkStat(fs.statSync(path), options)
}

function checkStat (stat, options) {
  return stat.isFile() && checkMode(stat, options)
}

function checkMode (stat, options) {
  var mod = stat.mode
  var uid = stat.uid
  var gid = stat.gid

  var myUid = options.uid !== undefined ?
    options.uid : process.getuid && process.getuid()
  var myGid = options.gid !== undefined ?
    options.gid : process.getgid && process.getgid()

  var u = parseInt('100', 8)
  var g = parseInt('010', 8)
  var o = parseInt('001', 8)
  var ug = u | g

  var ret = (mod & o) ||
    (mod & g) && gid === myGid ||
    (mod & u) && uid === myUid ||
    (mod & ug) && myUid === 0

  return ret
}


/***/ }),
/* 200 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = isexe
isexe.sync = sync

var fs = __webpack_require__(2)

function checkPathExt (path, options) {
  var pathext = options.pathExt !== undefined ?
    options.pathExt : process.env.PATHEXT

  if (!pathext) {
    return true
  }

  pathext = pathext.split(';')
  if (pathext.indexOf('') !== -1) {
    return true
  }
  for (var i = 0; i < pathext.length; i++) {
    var p = pathext[i].toLowerCase()
    if (p && path.substr(-p.length).toLowerCase() === p) {
      return true
    }
  }
  return false
}

function checkStat (stat, path, options) {
  if (!stat.isSymbolicLink() && !stat.isFile()) {
    return false
  }
  return checkPathExt(path, options)
}

function isexe (path, options, cb) {
  fs.stat(path, function (er, stat) {
    cb(er, er ? false : checkStat(stat, path, options))
  })
}

function sync (path, options) {
  return checkStat(fs.statSync(path), path, options)
}


/***/ }),
/* 201 */
/***/ (function(module, exports) {

// JavaScript Image Resizer (c) 2012 - Grant Galitz
// Released to public domain 29 July 2013: https://github.com/grantgalitz/JS-Image-Resizer/issues/4

function Resize(widthOriginal, heightOriginal, targetWidth, targetHeight, blendAlpha, interpolationPass, resizeCallback) {
    this.widthOriginal = Math.abs(parseInt(widthOriginal) || 0);
    this.heightOriginal = Math.abs(parseInt(heightOriginal) || 0);
    this.targetWidth = Math.abs(parseInt(targetWidth) || 0);
    this.targetHeight = Math.abs(parseInt(targetHeight) || 0);
    this.colorChannels = (!!blendAlpha) ? 4 : 3;
    this.interpolationPass = !!interpolationPass;
    this.resizeCallback = (typeof resizeCallback == "function") ? resizeCallback : function (returnedArray) {};
    this.targetWidthMultipliedByChannels = this.targetWidth * this.colorChannels;
    this.originalWidthMultipliedByChannels = this.widthOriginal * this.colorChannels;
    this.originalHeightMultipliedByChannels = this.heightOriginal * this.colorChannels;
    this.widthPassResultSize = this.targetWidthMultipliedByChannels * this.heightOriginal;
    this.finalResultSize = this.targetWidthMultipliedByChannels * this.targetHeight;
    this.initialize();
}

Resize.prototype.initialize = function () {
    //Perform some checks:
    if (this.widthOriginal > 0 && this.heightOriginal > 0 && this.targetWidth > 0 && this.targetHeight > 0) {
        this.configurePasses();
    } else {
        throw (new Error("Invalid settings specified for the resizer."));
    }
}

Resize.prototype.configurePasses = function () {
    if (this.widthOriginal == this.targetWidth) {
        //Bypass the width resizer pass:
        this.resizeWidth = this.bypassResizer;
    } else {
        //Setup the width resizer pass:
        this.ratioWeightWidthPass = this.widthOriginal / this.targetWidth;
        if (this.ratioWeightWidthPass < 1 && this.interpolationPass) {
            this.initializeFirstPassBuffers(true);
            this.resizeWidth = (this.colorChannels == 4) ? this.resizeWidthInterpolatedRGBA : this.resizeWidthInterpolatedRGB;
        } else {
            this.initializeFirstPassBuffers(false);
            this.resizeWidth = (this.colorChannels == 4) ? this.resizeWidthRGBA : this.resizeWidthRGB;
        }
    }
    if (this.heightOriginal == this.targetHeight) {
        //Bypass the height resizer pass:
        this.resizeHeight = this.bypassResizer;
    } else {
        //Setup the height resizer pass:
        this.ratioWeightHeightPass = this.heightOriginal / this.targetHeight;
        if (this.ratioWeightHeightPass < 1 && this.interpolationPass) {
            this.initializeSecondPassBuffers(true);
            this.resizeHeight = this.resizeHeightInterpolated;
        } else {
            this.initializeSecondPassBuffers(false);
            this.resizeHeight = (this.colorChannels == 4) ? this.resizeHeightRGBA : this.resizeHeightRGB;
        }
    }
}

Resize.prototype._resizeWidthInterpolatedRGBChannels = function (buffer, fourthChannel) {
    var channelsNum = fourthChannel ? 4 : 3;
    var ratioWeight = this.ratioWeightWidthPass;
    var weight = 0;
    var finalOffset = 0;
    var pixelOffset = 0;
    var firstWeight = 0;
    var secondWeight = 0;
    var outputBuffer = this.widthBuffer;
    //Handle for only one interpolation input being valid for start calculation:
    for (var targetPosition = 0; weight < 1 / 3; targetPosition += channelsNum, weight += ratioWeight) {
        for (finalOffset = targetPosition, pixelOffset = 0; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, finalOffset += this.targetWidthMultipliedByChannels) {
            outputBuffer[finalOffset] = buffer[pixelOffset];
            outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1];
            outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2];
            if (!fourthChannel) continue;
            outputBuffer[finalOffset + 3] = buffer[pixelOffset + 3];
        }
    }
    //Adjust for overshoot of the last pass's counter:
    weight -= 1 / 3;
    for (var interpolationWidthSourceReadStop = this.widthOriginal - 1; weight < interpolationWidthSourceReadStop; targetPosition += channelsNum, weight += ratioWeight) {
        //Calculate weightings:
        secondWeight = weight % 1;
        firstWeight = 1 - secondWeight;
        //Interpolate:
        for (finalOffset = targetPosition, pixelOffset = Math.floor(weight) * channelsNum; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, finalOffset += this.targetWidthMultipliedByChannels) {
            outputBuffer[finalOffset] = (buffer[pixelOffset] * firstWeight) + (buffer[pixelOffset + channelsNum] * secondWeight);
            outputBuffer[finalOffset + 1] = (buffer[pixelOffset + 1] * firstWeight) + (buffer[pixelOffset + channelsNum + 1] * secondWeight);
            outputBuffer[finalOffset + 2] = (buffer[pixelOffset + 2] * firstWeight) + (buffer[pixelOffset + channelsNum + 2] * secondWeight);
            if (!fourthChannel) continue;
            outputBuffer[finalOffset + 3] = (buffer[pixelOffset + 3] * firstWeight) + (buffer[pixelOffset + channelsNum + 3] * secondWeight);
        }
    }
    //Handle for only one interpolation input being valid for end calculation:
    for (interpolationWidthSourceReadStop = this.originalWidthMultipliedByChannels - channelsNum; targetPosition < this.targetWidthMultipliedByChannels; targetPosition += channelsNum) {
        for (finalOffset = targetPosition, pixelOffset = interpolationWidthSourceReadStop; finalOffset < this.widthPassResultSize; pixelOffset += this.originalWidthMultipliedByChannels, finalOffset += this.targetWidthMultipliedByChannels) {
            outputBuffer[finalOffset] = buffer[pixelOffset];
            outputBuffer[finalOffset + 1] = buffer[pixelOffset + 1];
            outputBuffer[finalOffset + 2] = buffer[pixelOffset + 2];
            if (!fourthChannel) continue;
            outputBuffer[finalOffset + 3] = buffer[pixelOffset + 3];
        }
    }
    return outputBuffer;
}

Resize.prototype._resizeWidthRGBChannels = function (buffer, fourthChannel) {
    var channelsNum = fourthChannel ? 4 : 3;
    var ratioWeight = this.ratioWeightWidthPass;
    var ratioWeightDivisor = 1 / ratioWeight;
    var weight = 0;
    var amountToNext = 0;
    var actualPosition = 0;
    var currentPosition = 0;
    var line = 0;
    var pixelOffset = 0;
    var outputOffset = 0;
    var nextLineOffsetOriginalWidth = this.originalWidthMultipliedByChannels - channelsNum + 1;
    var nextLineOffsetTargetWidth = this.targetWidthMultipliedByChannels - channelsNum + 1;
    var output = this.outputWidthWorkBench;
    var outputBuffer = this.widthBuffer;
    var trustworthyColorsCount = this.outputWidthWorkBenchOpaquePixelsCount;
    var multiplier = 1;
    var r = 0;
    var g = 0;
    var b = 0;
    var a = 0;
    do {
        for (line = 0; line < this.originalHeightMultipliedByChannels;) {
            output[line++] = 0;
            output[line++] = 0;
            output[line++] = 0;
            if (!fourthChannel) continue;
            output[line++] = 0;
            trustworthyColorsCount[line / channelsNum - 1] = 0;
        }
        weight = ratioWeight;
        do {
            amountToNext = 1 + actualPosition - currentPosition;
            multiplier = Math.min(weight, amountToNext);
            for (line = 0, pixelOffset = actualPosition; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetOriginalWidth) {
                r = buffer[pixelOffset];
                g = buffer[++pixelOffset];
                b = buffer[++pixelOffset];
                a = fourthChannel ? buffer[++pixelOffset] : 255;
                // Ignore RGB values if pixel is completely transparent
                output[line++] += (a ? r : 0) * multiplier;
                output[line++] += (a ? g : 0) * multiplier;
                output[line++] += (a ? b : 0) * multiplier;
                if (!fourthChannel) continue;
                output[line++] += a * multiplier;
                trustworthyColorsCount[line / channelsNum - 1] += (a ? multiplier : 0);
            }
            if (weight >= amountToNext) {
                currentPosition = actualPosition = actualPosition + channelsNum;
                weight -= amountToNext;
            } else {
                currentPosition += weight;
                break;
            }
        } while (weight > 0 && actualPosition < this.originalWidthMultipliedByChannels);
        for (line = 0, pixelOffset = outputOffset; line < this.originalHeightMultipliedByChannels; pixelOffset += nextLineOffsetTargetWidth) {
            weight = fourthChannel ? trustworthyColorsCount[line / channelsNum] : 1;
            multiplier = fourthChannel ? (weight ? 1 / weight : 0) : ratioWeightDivisor;
            outputBuffer[pixelOffset] = output[line++] * multiplier;
            outputBuffer[++pixelOffset] = output[line++] * multiplier;
            outputBuffer[++pixelOffset] = output[line++] * multiplier;
            if (!fourthChannel) continue;
            outputBuffer[++pixelOffset] = output[line++] * ratioWeightDivisor;
        }
        outputOffset += channelsNum;
    } while (outputOffset < this.targetWidthMultipliedByChannels);
    return outputBuffer;
}

Resize.prototype._resizeHeightRGBChannels = function(buffer, fourthChannel) {
    var ratioWeight = this.ratioWeightHeightPass;
    var ratioWeightDivisor = 1 / ratioWeight;
    var weight = 0;
    var amountToNext = 0;
    var actualPosition = 0;
    var currentPosition = 0;
    var pixelOffset = 0;
    var outputOffset = 0;
    var output = this.outputHeightWorkBench;
    var outputBuffer = this.heightBuffer;
    var trustworthyColorsCount = this.outputHeightWorkBenchOpaquePixelsCount;
    var caret = 0;
    var multiplier = 1;
    var r = 0;
    var g = 0;
    var b = 0;
    var a = 0;
    do {
        for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
            output[pixelOffset++] = 0;
            output[pixelOffset++] = 0;
            output[pixelOffset++] = 0;
            if (!fourthChannel) continue;
            output[pixelOffset++] = 0;
            trustworthyColorsCount[pixelOffset / 4 - 1] = 0;
        }
        weight = ratioWeight;
        do {
            amountToNext = 1 + actualPosition - currentPosition;
            multiplier = Math.min(weight, amountToNext);
            caret = actualPosition;
            for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
                r = buffer[caret++];
                g = buffer[caret++];
                b = buffer[caret++];
                a = fourthChannel ? buffer[caret++] : 255;
                // Ignore RGB values if pixel is completely transparent
                output[pixelOffset++] += (a ? r : 0) * multiplier;
                output[pixelOffset++] += (a ? g : 0) * multiplier;
                output[pixelOffset++] += (a ? b : 0) * multiplier;
                if (!fourthChannel) continue;
                output[pixelOffset++] += a * multiplier;
                trustworthyColorsCount[pixelOffset / 4 - 1] += (a ? multiplier : 0);
            }
            if (weight >= amountToNext) {
                currentPosition = actualPosition = caret;
                weight -= amountToNext;
            } else {
                currentPosition += weight;
                break;
            }
        } while (weight > 0 && actualPosition < this.widthPassResultSize);
        for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
            weight = fourthChannel ? trustworthyColorsCount[pixelOffset / 4] : 1;
            multiplier = fourthChannel ? (weight ? 1 / weight : 0) : ratioWeightDivisor;
            outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier);
            outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier);
            outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * multiplier);
            if (!fourthChannel) continue;
            outputBuffer[outputOffset++] = Math.round(output[pixelOffset++] * ratioWeightDivisor);
        }
    } while (outputOffset < this.finalResultSize);
    
    return outputBuffer;
}

Resize.prototype.resizeWidthInterpolatedRGB = function (buffer) {
    return this._resizeWidthInterpolatedRGBChannels(buffer, false);
}

Resize.prototype.resizeWidthInterpolatedRGBA = function (buffer) {
    return this._resizeWidthInterpolatedRGBChannels(buffer, true);
}

Resize.prototype.resizeWidthRGB = function (buffer) {
    return this._resizeWidthRGBChannels(buffer, false);
}

Resize.prototype.resizeWidthRGBA = function (buffer) {
    return this._resizeWidthRGBChannels(buffer, true);
}

Resize.prototype.resizeHeightInterpolated = function (buffer) {
    var ratioWeight = this.ratioWeightHeightPass;
    var weight = 0;
    var finalOffset = 0;
    var pixelOffset = 0;
    var pixelOffsetAccumulated = 0;
    var pixelOffsetAccumulated2 = 0;
    var firstWeight = 0;
    var secondWeight = 0;
    var outputBuffer = this.heightBuffer;
    //Handle for only one interpolation input being valid for start calculation:
    for (; weight < 1 / 3; weight += ratioWeight) {
        for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels;) {
            outputBuffer[finalOffset++] = Math.round(buffer[pixelOffset++]);
        }
    }
    //Adjust for overshoot of the last pass's counter:
    weight -= 1 / 3;
    for (var interpolationHeightSourceReadStop = this.heightOriginal - 1; weight < interpolationHeightSourceReadStop; weight += ratioWeight) {
        //Calculate weightings:
        secondWeight = weight % 1;
        firstWeight = 1 - secondWeight;
        //Interpolate:
        pixelOffsetAccumulated = Math.floor(weight) * this.targetWidthMultipliedByChannels;
        pixelOffsetAccumulated2 = pixelOffsetAccumulated + this.targetWidthMultipliedByChannels;
        for (pixelOffset = 0; pixelOffset < this.targetWidthMultipliedByChannels; ++pixelOffset) {
            outputBuffer[finalOffset++] = Math.round((buffer[pixelOffsetAccumulated++] * firstWeight) + (buffer[pixelOffsetAccumulated2++] * secondWeight));
        }
    }
    //Handle for only one interpolation input being valid for end calculation:
    while (finalOffset < this.finalResultSize) {
        for (pixelOffset = 0, pixelOffsetAccumulated = interpolationHeightSourceReadStop * this.targetWidthMultipliedByChannels; pixelOffset < this.targetWidthMultipliedByChannels; ++pixelOffset) {
            outputBuffer[finalOffset++] = Math.round(buffer[pixelOffsetAccumulated++]);
        }
    }
    return outputBuffer;
}

Resize.prototype.resizeHeightRGB = function (buffer) {
    return this._resizeHeightRGBChannels(buffer, false);
}

Resize.prototype.resizeHeightRGBA = function (buffer) {
    return this._resizeHeightRGBChannels(buffer, true);
}

Resize.prototype.resize = function (buffer) {
    this.resizeCallback(this.resizeHeight(this.resizeWidth(buffer)));
}

Resize.prototype.bypassResizer = function (buffer) {
    //Just return the buffer passsed:
    return buffer;
}

Resize.prototype.initializeFirstPassBuffers = function (BILINEARAlgo) {
    //Initialize the internal width pass buffers:
    this.widthBuffer = this.generateFloatBuffer(this.widthPassResultSize);
    if (!BILINEARAlgo) {
        this.outputWidthWorkBench = this.generateFloatBuffer(this.originalHeightMultipliedByChannels);
        if (this.colorChannels > 3) {
            this.outputWidthWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(this.heightOriginal);
        }
    }
}

Resize.prototype.initializeSecondPassBuffers = function (BILINEARAlgo) {
    //Initialize the internal height pass buffers:
    this.heightBuffer = this.generateUint8Buffer(this.finalResultSize);
    if (!BILINEARAlgo) {
        this.outputHeightWorkBench = this.generateFloatBuffer(this.targetWidthMultipliedByChannels);
        if (this.colorChannels > 3) {
            this.outputHeightWorkBenchOpaquePixelsCount = this.generateFloat64Buffer(this.targetWidth);
        }
    }
}

Resize.prototype.generateFloatBuffer = function (bufferLength) {
    //Generate a float32 typed array buffer:
    try {
        return new Float32Array(bufferLength);
    } catch (error) {
        return [];
    }
}

Resize.prototype.generateFloat64Buffer = function (bufferLength) {
    //Generate a float64 typed array buffer:
    try {
        return new Float64Array(bufferLength);
    } catch (error) {
        return [];
    }
}

Resize.prototype.generateUint8Buffer = function (bufferLength) {
    //Generate a uint8 typed array buffer:
    try {
        return new Uint8Array(bufferLength);
    } catch (error) {
        return [];
    }
}

module.exports = Resize;


/***/ }),
/* 202 */
/***/ (function(module, exports) {

/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- /
/* vim: set shiftwidth=2 tabstop=2 autoindent cindent expandtab: */
/*
   Copyright 2011 notmasteryet

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

// - The JPEG specification can be found in the ITU CCITT Recommendation T.81
//   (www.w3.org/Graphics/JPEG/itu-t81.pdf)
// - The JFIF specification can be found in the JPEG File Interchange Format
//   (www.w3.org/Graphics/JPEG/jfif3.pdf)
// - The Adobe Application-Specific JPEG markers in the Supporting the DCT Filters
//   in PostScript Level 2, Technical Note #5116
//   (partners.adobe.com/public/developer/en/ps/sdk/5116.DCT_Filter.pdf)

var JpegImage = (function jpegImage() {
  "use strict";
  var dctZigZag = new Int32Array([
     0,
     1,  8,
    16,  9,  2,
     3, 10, 17, 24,
    32, 25, 18, 11, 4,
     5, 12, 19, 26, 33, 40,
    48, 41, 34, 27, 20, 13,  6,
     7, 14, 21, 28, 35, 42, 49, 56,
    57, 50, 43, 36, 29, 22, 15,
    23, 30, 37, 44, 51, 58,
    59, 52, 45, 38, 31,
    39, 46, 53, 60,
    61, 54, 47,
    55, 62,
    63
  ]);

  var dctCos1  =  4017   // cos(pi/16)
  var dctSin1  =   799   // sin(pi/16)
  var dctCos3  =  3406   // cos(3*pi/16)
  var dctSin3  =  2276   // sin(3*pi/16)
  var dctCos6  =  1567   // cos(6*pi/16)
  var dctSin6  =  3784   // sin(6*pi/16)
  var dctSqrt2 =  5793   // sqrt(2)
  var dctSqrt1d2 = 2896  // sqrt(2) / 2

  function constructor() {
  }

  function buildHuffmanTable(codeLengths, values) {
    var k = 0, code = [], i, j, length = 16;
    while (length > 0 && !codeLengths[length - 1])
      length--;
    code.push({children: [], index: 0});
    var p = code[0], q;
    for (i = 0; i < length; i++) {
      for (j = 0; j < codeLengths[i]; j++) {
        p = code.pop();
        p.children[p.index] = values[k];
        while (p.index > 0) {
          p = code.pop();
        }
        p.index++;
        code.push(p);
        while (code.length <= i) {
          code.push(q = {children: [], index: 0});
          p.children[p.index] = q.children;
          p = q;
        }
        k++;
      }
      if (i + 1 < length) {
        // p here points to last code
        code.push(q = {children: [], index: 0});
        p.children[p.index] = q.children;
        p = q;
      }
    }
    return code[0].children;
  }

  function decodeScan(data, offset,
                      frame, components, resetInterval,
                      spectralStart, spectralEnd,
                      successivePrev, successive) {
    var precision = frame.precision;
    var samplesPerLine = frame.samplesPerLine;
    var scanLines = frame.scanLines;
    var mcusPerLine = frame.mcusPerLine;
    var progressive = frame.progressive;
    var maxH = frame.maxH, maxV = frame.maxV;

    var startOffset = offset, bitsData = 0, bitsCount = 0;
    function readBit() {
      if (bitsCount > 0) {
        bitsCount--;
        return (bitsData >> bitsCount) & 1;
      }
      bitsData = data[offset++];
      if (bitsData == 0xFF) {
        var nextByte = data[offset++];
        if (nextByte) {
          throw "unexpected marker: " + ((bitsData << 8) | nextByte).toString(16);
        }
        // unstuff 0
      }
      bitsCount = 7;
      return bitsData >>> 7;
    }
    function decodeHuffman(tree) {
      var node = tree, bit;
      while ((bit = readBit()) !== null) {
        node = node[bit];
        if (typeof node === 'number')
          return node;
        if (typeof node !== 'object')
          throw "invalid huffman sequence";
      }
      return null;
    }
    function receive(length) {
      var n = 0;
      while (length > 0) {
        var bit = readBit();
        if (bit === null) return;
        n = (n << 1) | bit;
        length--;
      }
      return n;
    }
    function receiveAndExtend(length) {
      var n = receive(length);
      if (n >= 1 << (length - 1))
        return n;
      return n + (-1 << length) + 1;
    }
    function decodeBaseline(component, zz) {
      var t = decodeHuffman(component.huffmanTableDC);
      var diff = t === 0 ? 0 : receiveAndExtend(t);
      zz[0]= (component.pred += diff);
      var k = 1;
      while (k < 64) {
        var rs = decodeHuffman(component.huffmanTableAC);
        var s = rs & 15, r = rs >> 4;
        if (s === 0) {
          if (r < 15)
            break;
          k += 16;
          continue;
        }
        k += r;
        var z = dctZigZag[k];
        zz[z] = receiveAndExtend(s);
        k++;
      }
    }
    function decodeDCFirst(component, zz) {
      var t = decodeHuffman(component.huffmanTableDC);
      var diff = t === 0 ? 0 : (receiveAndExtend(t) << successive);
      zz[0] = (component.pred += diff);
    }
    function decodeDCSuccessive(component, zz) {
      zz[0] |= readBit() << successive;
    }
    var eobrun = 0;
    function decodeACFirst(component, zz) {
      if (eobrun > 0) {
        eobrun--;
        return;
      }
      var k = spectralStart, e = spectralEnd;
      while (k <= e) {
        var rs = decodeHuffman(component.huffmanTableAC);
        var s = rs & 15, r = rs >> 4;
        if (s === 0) {
          if (r < 15) {
            eobrun = receive(r) + (1 << r) - 1;
            break;
          }
          k += 16;
          continue;
        }
        k += r;
        var z = dctZigZag[k];
        zz[z] = receiveAndExtend(s) * (1 << successive);
        k++;
      }
    }
    var successiveACState = 0, successiveACNextValue;
    function decodeACSuccessive(component, zz) {
      var k = spectralStart, e = spectralEnd, r = 0;
      while (k <= e) {
        var z = dctZigZag[k];
        switch (successiveACState) {
        case 0: // initial state
          var rs = decodeHuffman(component.huffmanTableAC);
          var s = rs & 15, r = rs >> 4;
          if (s === 0) {
            if (r < 15) {
              eobrun = receive(r) + (1 << r);
              successiveACState = 4;
            } else {
              r = 16;
              successiveACState = 1;
            }
          } else {
            if (s !== 1)
              throw "invalid ACn encoding";
            successiveACNextValue = receiveAndExtend(s);
            successiveACState = r ? 2 : 3;
          }
          continue;
        case 1: // skipping r zero items
        case 2:
          if (zz[z])
            zz[z] += (readBit() << successive);
          else {
            r--;
            if (r === 0)
              successiveACState = successiveACState == 2 ? 3 : 0;
          }
          break;
        case 3: // set value for a zero item
          if (zz[z])
            zz[z] += (readBit() << successive);
          else {
            zz[z] = successiveACNextValue << successive;
            successiveACState = 0;
          }
          break;
        case 4: // eob
          if (zz[z])
            zz[z] += (readBit() << successive);
          break;
        }
        k++;
      }
      if (successiveACState === 4) {
        eobrun--;
        if (eobrun === 0)
          successiveACState = 0;
      }
    }
    function decodeMcu(component, decode, mcu, row, col) {
      var mcuRow = (mcu / mcusPerLine) | 0;
      var mcuCol = mcu % mcusPerLine;
      var blockRow = mcuRow * component.v + row;
      var blockCol = mcuCol * component.h + col;
      decode(component, component.blocks[blockRow][blockCol]);
    }
    function decodeBlock(component, decode, mcu) {
      var blockRow = (mcu / component.blocksPerLine) | 0;
      var blockCol = mcu % component.blocksPerLine;
      decode(component, component.blocks[blockRow][blockCol]);
    }

    var componentsLength = components.length;
    var component, i, j, k, n;
    var decodeFn;
    if (progressive) {
      if (spectralStart === 0)
        decodeFn = successivePrev === 0 ? decodeDCFirst : decodeDCSuccessive;
      else
        decodeFn = successivePrev === 0 ? decodeACFirst : decodeACSuccessive;
    } else {
      decodeFn = decodeBaseline;
    }

    var mcu = 0, marker;
    var mcuExpected;
    if (componentsLength == 1) {
      mcuExpected = components[0].blocksPerLine * components[0].blocksPerColumn;
    } else {
      mcuExpected = mcusPerLine * frame.mcusPerColumn;
    }
    if (!resetInterval) resetInterval = mcuExpected;

    var h, v;
    while (mcu < mcuExpected) {
      // reset interval stuff
      for (i = 0; i < componentsLength; i++)
        components[i].pred = 0;
      eobrun = 0;

      if (componentsLength == 1) {
        component = components[0];
        for (n = 0; n < resetInterval; n++) {
          decodeBlock(component, decodeFn, mcu);
          mcu++;
        }
      } else {
        for (n = 0; n < resetInterval; n++) {
          for (i = 0; i < componentsLength; i++) {
            component = components[i];
            h = component.h;
            v = component.v;
            for (j = 0; j < v; j++) {
              for (k = 0; k < h; k++) {
                decodeMcu(component, decodeFn, mcu, j, k);
              }
            }
          }
          mcu++;

          // If we've reached our expected MCU's, stop decoding
          if (mcu === mcuExpected) break;
        }
      }

      // find marker
      bitsCount = 0;
      marker = (data[offset] << 8) | data[offset + 1];
      if (marker < 0xFF00) {
        throw "marker was not found";
      }

      if (marker >= 0xFFD0 && marker <= 0xFFD7) { // RSTx
        offset += 2;
      }
      else
        break;
    }

    return offset - startOffset;
  }

  function buildComponentData(frame, component) {
    var lines = [];
    var blocksPerLine = component.blocksPerLine;
    var blocksPerColumn = component.blocksPerColumn;
    var samplesPerLine = blocksPerLine << 3;
    var R = new Int32Array(64), r = new Uint8Array(64);

    // A port of poppler's IDCT method which in turn is taken from:
    //   Christoph Loeffler, Adriaan Ligtenberg, George S. Moschytz,
    //   "Practical Fast 1-D DCT Algorithms with 11 Multiplications",
    //   IEEE Intl. Conf. on Acoustics, Speech & Signal Processing, 1989,
    //   988-991.
    function quantizeAndInverse(zz, dataOut, dataIn) {
      var qt = component.quantizationTable;
      var v0, v1, v2, v3, v4, v5, v6, v7, t;
      var p = dataIn;
      var i;

      // dequant
      for (i = 0; i < 64; i++)
        p[i] = zz[i] * qt[i];

      // inverse DCT on rows
      for (i = 0; i < 8; ++i) {
        var row = 8 * i;

        // check for all-zero AC coefficients
        if (p[1 + row] == 0 && p[2 + row] == 0 && p[3 + row] == 0 &&
            p[4 + row] == 0 && p[5 + row] == 0 && p[6 + row] == 0 &&
            p[7 + row] == 0) {
          t = (dctSqrt2 * p[0 + row] + 512) >> 10;
          p[0 + row] = t;
          p[1 + row] = t;
          p[2 + row] = t;
          p[3 + row] = t;
          p[4 + row] = t;
          p[5 + row] = t;
          p[6 + row] = t;
          p[7 + row] = t;
          continue;
        }

        // stage 4
        v0 = (dctSqrt2 * p[0 + row] + 128) >> 8;
        v1 = (dctSqrt2 * p[4 + row] + 128) >> 8;
        v2 = p[2 + row];
        v3 = p[6 + row];
        v4 = (dctSqrt1d2 * (p[1 + row] - p[7 + row]) + 128) >> 8;
        v7 = (dctSqrt1d2 * (p[1 + row] + p[7 + row]) + 128) >> 8;
        v5 = p[3 + row] << 4;
        v6 = p[5 + row] << 4;

        // stage 3
        t = (v0 - v1+ 1) >> 1;
        v0 = (v0 + v1 + 1) >> 1;
        v1 = t;
        t = (v2 * dctSin6 + v3 * dctCos6 + 128) >> 8;
        v2 = (v2 * dctCos6 - v3 * dctSin6 + 128) >> 8;
        v3 = t;
        t = (v4 - v6 + 1) >> 1;
        v4 = (v4 + v6 + 1) >> 1;
        v6 = t;
        t = (v7 + v5 + 1) >> 1;
        v5 = (v7 - v5 + 1) >> 1;
        v7 = t;

        // stage 2
        t = (v0 - v3 + 1) >> 1;
        v0 = (v0 + v3 + 1) >> 1;
        v3 = t;
        t = (v1 - v2 + 1) >> 1;
        v1 = (v1 + v2 + 1) >> 1;
        v2 = t;
        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
        v7 = t;
        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
        v6 = t;

        // stage 1
        p[0 + row] = v0 + v7;
        p[7 + row] = v0 - v7;
        p[1 + row] = v1 + v6;
        p[6 + row] = v1 - v6;
        p[2 + row] = v2 + v5;
        p[5 + row] = v2 - v5;
        p[3 + row] = v3 + v4;
        p[4 + row] = v3 - v4;
      }

      // inverse DCT on columns
      for (i = 0; i < 8; ++i) {
        var col = i;

        // check for all-zero AC coefficients
        if (p[1*8 + col] == 0 && p[2*8 + col] == 0 && p[3*8 + col] == 0 &&
            p[4*8 + col] == 0 && p[5*8 + col] == 0 && p[6*8 + col] == 0 &&
            p[7*8 + col] == 0) {
          t = (dctSqrt2 * dataIn[i+0] + 8192) >> 14;
          p[0*8 + col] = t;
          p[1*8 + col] = t;
          p[2*8 + col] = t;
          p[3*8 + col] = t;
          p[4*8 + col] = t;
          p[5*8 + col] = t;
          p[6*8 + col] = t;
          p[7*8 + col] = t;
          continue;
        }

        // stage 4
        v0 = (dctSqrt2 * p[0*8 + col] + 2048) >> 12;
        v1 = (dctSqrt2 * p[4*8 + col] + 2048) >> 12;
        v2 = p[2*8 + col];
        v3 = p[6*8 + col];
        v4 = (dctSqrt1d2 * (p[1*8 + col] - p[7*8 + col]) + 2048) >> 12;
        v7 = (dctSqrt1d2 * (p[1*8 + col] + p[7*8 + col]) + 2048) >> 12;
        v5 = p[3*8 + col];
        v6 = p[5*8 + col];

        // stage 3
        t = (v0 - v1 + 1) >> 1;
        v0 = (v0 + v1 + 1) >> 1;
        v1 = t;
        t = (v2 * dctSin6 + v3 * dctCos6 + 2048) >> 12;
        v2 = (v2 * dctCos6 - v3 * dctSin6 + 2048) >> 12;
        v3 = t;
        t = (v4 - v6 + 1) >> 1;
        v4 = (v4 + v6 + 1) >> 1;
        v6 = t;
        t = (v7 + v5 + 1) >> 1;
        v5 = (v7 - v5 + 1) >> 1;
        v7 = t;

        // stage 2
        t = (v0 - v3 + 1) >> 1;
        v0 = (v0 + v3 + 1) >> 1;
        v3 = t;
        t = (v1 - v2 + 1) >> 1;
        v1 = (v1 + v2 + 1) >> 1;
        v2 = t;
        t = (v4 * dctSin3 + v7 * dctCos3 + 2048) >> 12;
        v4 = (v4 * dctCos3 - v7 * dctSin3 + 2048) >> 12;
        v7 = t;
        t = (v5 * dctSin1 + v6 * dctCos1 + 2048) >> 12;
        v5 = (v5 * dctCos1 - v6 * dctSin1 + 2048) >> 12;
        v6 = t;

        // stage 1
        p[0*8 + col] = v0 + v7;
        p[7*8 + col] = v0 - v7;
        p[1*8 + col] = v1 + v6;
        p[6*8 + col] = v1 - v6;
        p[2*8 + col] = v2 + v5;
        p[5*8 + col] = v2 - v5;
        p[3*8 + col] = v3 + v4;
        p[4*8 + col] = v3 - v4;
      }

      // convert to 8-bit integers
      for (i = 0; i < 64; ++i) {
        var sample = 128 + ((p[i] + 8) >> 4);
        dataOut[i] = sample < 0 ? 0 : sample > 0xFF ? 0xFF : sample;
      }
    }

    var i, j;
    for (var blockRow = 0; blockRow < blocksPerColumn; blockRow++) {
      var scanLine = blockRow << 3;
      for (i = 0; i < 8; i++)
        lines.push(new Uint8Array(samplesPerLine));
      for (var blockCol = 0; blockCol < blocksPerLine; blockCol++) {
        quantizeAndInverse(component.blocks[blockRow][blockCol], r, R);

        var offset = 0, sample = blockCol << 3;
        for (j = 0; j < 8; j++) {
          var line = lines[scanLine + j];
          for (i = 0; i < 8; i++)
            line[sample + i] = r[offset++];
        }
      }
    }
    return lines;
  }

  function clampTo8bit(a) {
    return a < 0 ? 0 : a > 255 ? 255 : a;
  }

  constructor.prototype = {
    load: function load(path) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", path, true);
      xhr.responseType = "arraybuffer";
      xhr.onload = (function() {
        // TODO catch parse error
        var data = new Uint8Array(xhr.response || xhr.mozResponseArrayBuffer);
        this.parse(data);
        if (this.onload)
          this.onload();
      }).bind(this);
      xhr.send(null);
    },
    parse: function parse(data) {
      var offset = 0, length = data.length;
      function readUint16() {
        var value = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        return value;
      }
      function readDataBlock() {
        var length = readUint16();
        var array = data.subarray(offset, offset + length - 2);
        offset += array.length;
        return array;
      }
      function prepareComponents(frame) {
        var maxH = 0, maxV = 0;
        var component, componentId;
        for (componentId in frame.components) {
          if (frame.components.hasOwnProperty(componentId)) {
            component = frame.components[componentId];
            if (maxH < component.h) maxH = component.h;
            if (maxV < component.v) maxV = component.v;
          }
        }
        var mcusPerLine = Math.ceil(frame.samplesPerLine / 8 / maxH);
        var mcusPerColumn = Math.ceil(frame.scanLines / 8 / maxV);
        for (componentId in frame.components) {
          if (frame.components.hasOwnProperty(componentId)) {
            component = frame.components[componentId];
            var blocksPerLine = Math.ceil(Math.ceil(frame.samplesPerLine / 8) * component.h / maxH);
            var blocksPerColumn = Math.ceil(Math.ceil(frame.scanLines  / 8) * component.v / maxV);
            var blocksPerLineForMcu = mcusPerLine * component.h;
            var blocksPerColumnForMcu = mcusPerColumn * component.v;
            var blocks = [];
            for (var i = 0; i < blocksPerColumnForMcu; i++) {
              var row = [];
              for (var j = 0; j < blocksPerLineForMcu; j++)
                row.push(new Int32Array(64));
              blocks.push(row);
            }
            component.blocksPerLine = blocksPerLine;
            component.blocksPerColumn = blocksPerColumn;
            component.blocks = blocks;
          }
        }
        frame.maxH = maxH;
        frame.maxV = maxV;
        frame.mcusPerLine = mcusPerLine;
        frame.mcusPerColumn = mcusPerColumn;
      }
      var jfif = null;
      var adobe = null;
      var pixels = null;
      var frame, resetInterval;
      var quantizationTables = [], frames = [];
      var huffmanTablesAC = [], huffmanTablesDC = [];
      var fileMarker = readUint16();
      if (fileMarker != 0xFFD8) { // SOI (Start of Image)
        throw "SOI not found";
      }

      fileMarker = readUint16();
      while (fileMarker != 0xFFD9) { // EOI (End of image)
        var i, j, l;
        switch(fileMarker) {
          case 0xFF00: break;
          case 0xFFE0: // APP0 (Application Specific)
          case 0xFFE1: // APP1
          case 0xFFE2: // APP2
          case 0xFFE3: // APP3
          case 0xFFE4: // APP4
          case 0xFFE5: // APP5
          case 0xFFE6: // APP6
          case 0xFFE7: // APP7
          case 0xFFE8: // APP8
          case 0xFFE9: // APP9
          case 0xFFEA: // APP10
          case 0xFFEB: // APP11
          case 0xFFEC: // APP12
          case 0xFFED: // APP13
          case 0xFFEE: // APP14
          case 0xFFEF: // APP15
          case 0xFFFE: // COM (Comment)
            var appData = readDataBlock();

            if (fileMarker === 0xFFE0) {
              if (appData[0] === 0x4A && appData[1] === 0x46 && appData[2] === 0x49 &&
                appData[3] === 0x46 && appData[4] === 0) { // 'JFIF\x00'
                jfif = {
                  version: { major: appData[5], minor: appData[6] },
                  densityUnits: appData[7],
                  xDensity: (appData[8] << 8) | appData[9],
                  yDensity: (appData[10] << 8) | appData[11],
                  thumbWidth: appData[12],
                  thumbHeight: appData[13],
                  thumbData: appData.subarray(14, 14 + 3 * appData[12] * appData[13])
                };
              }
            }
            // TODO APP1 - Exif
            if (fileMarker === 0xFFEE) {
              if (appData[0] === 0x41 && appData[1] === 0x64 && appData[2] === 0x6F &&
                appData[3] === 0x62 && appData[4] === 0x65 && appData[5] === 0) { // 'Adobe\x00'
                adobe = {
                  version: appData[6],
                  flags0: (appData[7] << 8) | appData[8],
                  flags1: (appData[9] << 8) | appData[10],
                  transformCode: appData[11]
                };
              }
            }
            break;

          case 0xFFDB: // DQT (Define Quantization Tables)
            var quantizationTablesLength = readUint16();
            var quantizationTablesEnd = quantizationTablesLength + offset - 2;
            while (offset < quantizationTablesEnd) {
              var quantizationTableSpec = data[offset++];
              var tableData = new Int32Array(64);
              if ((quantizationTableSpec >> 4) === 0) { // 8 bit values
                for (j = 0; j < 64; j++) {
                  var z = dctZigZag[j];
                  tableData[z] = data[offset++];
                }
              } else if ((quantizationTableSpec >> 4) === 1) { //16 bit
                for (j = 0; j < 64; j++) {
                  var z = dctZigZag[j];
                  tableData[z] = readUint16();
                }
              } else
                throw "DQT: invalid table spec";
              quantizationTables[quantizationTableSpec & 15] = tableData;
            }
            break;

          case 0xFFC0: // SOF0 (Start of Frame, Baseline DCT)
          case 0xFFC1: // SOF1 (Start of Frame, Extended DCT)
          case 0xFFC2: // SOF2 (Start of Frame, Progressive DCT)
            readUint16(); // skip data length
            frame = {};
            frame.extended = (fileMarker === 0xFFC1);
            frame.progressive = (fileMarker === 0xFFC2);
            frame.precision = data[offset++];
            frame.scanLines = readUint16();
            frame.samplesPerLine = readUint16();
            frame.components = {};
            frame.componentsOrder = [];
            var componentsCount = data[offset++], componentId;
            var maxH = 0, maxV = 0;
            for (i = 0; i < componentsCount; i++) {
              componentId = data[offset];
              var h = data[offset + 1] >> 4;
              var v = data[offset + 1] & 15;
              var qId = data[offset + 2];
              frame.componentsOrder.push(componentId);
              frame.components[componentId] = {
                h: h,
                v: v,
                quantizationIdx: qId
              };
              offset += 3;
            }
            prepareComponents(frame);
            frames.push(frame);
            break;

          case 0xFFC4: // DHT (Define Huffman Tables)
            var huffmanLength = readUint16();
            for (i = 2; i < huffmanLength;) {
              var huffmanTableSpec = data[offset++];
              var codeLengths = new Uint8Array(16);
              var codeLengthSum = 0;
              for (j = 0; j < 16; j++, offset++)
                codeLengthSum += (codeLengths[j] = data[offset]);
              var huffmanValues = new Uint8Array(codeLengthSum);
              for (j = 0; j < codeLengthSum; j++, offset++)
                huffmanValues[j] = data[offset];
              i += 17 + codeLengthSum;

              ((huffmanTableSpec >> 4) === 0 ? 
                huffmanTablesDC : huffmanTablesAC)[huffmanTableSpec & 15] =
                buildHuffmanTable(codeLengths, huffmanValues);
            }
            break;

          case 0xFFDD: // DRI (Define Restart Interval)
            readUint16(); // skip data length
            resetInterval = readUint16();
            break;

          case 0xFFDA: // SOS (Start of Scan)
            var scanLength = readUint16();
            var selectorsCount = data[offset++];
            var components = [], component;
            for (i = 0; i < selectorsCount; i++) {
              component = frame.components[data[offset++]];
              var tableSpec = data[offset++];
              component.huffmanTableDC = huffmanTablesDC[tableSpec >> 4];
              component.huffmanTableAC = huffmanTablesAC[tableSpec & 15];
              components.push(component);
            }
            var spectralStart = data[offset++];
            var spectralEnd = data[offset++];
            var successiveApproximation = data[offset++];
            var processed = decodeScan(data, offset,
              frame, components, resetInterval,
              spectralStart, spectralEnd,
              successiveApproximation >> 4, successiveApproximation & 15);
            offset += processed;
            break;
          default:
            if (data[offset - 3] == 0xFF &&
                data[offset - 2] >= 0xC0 && data[offset - 2] <= 0xFE) {
              // could be incorrect encoding -- last 0xFF byte of the previous
              // block was eaten by the encoder
              offset -= 3;
              break;
            }
            throw "unknown JPEG marker " + fileMarker.toString(16);
        }
        fileMarker = readUint16();
      }
      if (frames.length != 1)
        throw "only single frame JPEGs supported";

      // set each frame's components quantization table
      for (var i = 0; i < frames.length; i++) {
        var cp = frames[i].components;
        for (var j in cp) {
          cp[j].quantizationTable = quantizationTables[cp[j].quantizationIdx];
          delete cp[j].quantizationIdx;
        }
      }

      this.width = frame.samplesPerLine;
      this.height = frame.scanLines;
      this.jfif = jfif;
      this.adobe = adobe;
      this.components = [];
      for (var i = 0; i < frame.componentsOrder.length; i++) {
        var component = frame.components[frame.componentsOrder[i]];
        this.components.push({
          lines: buildComponentData(frame, component),
          scaleX: component.h / frame.maxH,
          scaleY: component.v / frame.maxV
        });
      }
    },
    getData: function getData(width, height) {
      var scaleX = this.width / width, scaleY = this.height / height;

      var component1, component2, component3, component4;
      var component1Line, component2Line, component3Line, component4Line;
      var x, y;
      var offset = 0;
      var Y, Cb, Cr, K, C, M, Ye, R, G, B;
      var colorTransform;
      var dataLength = width * height * this.components.length;
      var data = new Uint8Array(dataLength);
      switch (this.components.length) {
        case 1:
          component1 = this.components[0];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];

              data[offset++] = Y;
            }
          }
          break;
        case 2:
          // PDF might compress two component data in custom colorspace
          component1 = this.components[0];
          component2 = this.components[1];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              Y = component1Line[0 | (x * component1.scaleX * scaleX)];
              data[offset++] = Y;
              Y = component2Line[0 | (x * component2.scaleX * scaleX)];
              data[offset++] = Y;
            }
          }
          break;
        case 3:
          // The default transform for three components is true
          colorTransform = true;
          // The adobe transform marker overrides any previous setting
          if (this.adobe && this.adobe.transformCode)
            colorTransform = true;
          else if (typeof this.colorTransform !== 'undefined')
            colorTransform = !!this.colorTransform;

          component1 = this.components[0];
          component2 = this.components[1];
          component3 = this.components[2];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              if (!colorTransform) {
                R = component1Line[0 | (x * component1.scaleX * scaleX)];
                G = component2Line[0 | (x * component2.scaleX * scaleX)];
                B = component3Line[0 | (x * component3.scaleX * scaleX)];
              } else {
                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];

                R = clampTo8bit(Y + 1.402 * (Cr - 128));
                G = clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                B = clampTo8bit(Y + 1.772 * (Cb - 128));
              }

              data[offset++] = R;
              data[offset++] = G;
              data[offset++] = B;
            }
          }
          break;
        case 4:
          if (!this.adobe)
            throw 'Unsupported color mode (4 components)';
          // The default transform for four components is false
          colorTransform = false;
          // The adobe transform marker overrides any previous setting
          if (this.adobe && this.adobe.transformCode)
            colorTransform = true;
          else if (typeof this.colorTransform !== 'undefined')
            colorTransform = !!this.colorTransform;

          component1 = this.components[0];
          component2 = this.components[1];
          component3 = this.components[2];
          component4 = this.components[3];
          for (y = 0; y < height; y++) {
            component1Line = component1.lines[0 | (y * component1.scaleY * scaleY)];
            component2Line = component2.lines[0 | (y * component2.scaleY * scaleY)];
            component3Line = component3.lines[0 | (y * component3.scaleY * scaleY)];
            component4Line = component4.lines[0 | (y * component4.scaleY * scaleY)];
            for (x = 0; x < width; x++) {
              if (!colorTransform) {
                C = component1Line[0 | (x * component1.scaleX * scaleX)];
                M = component2Line[0 | (x * component2.scaleX * scaleX)];
                Ye = component3Line[0 | (x * component3.scaleX * scaleX)];
                K = component4Line[0 | (x * component4.scaleX * scaleX)];
              } else {
                Y = component1Line[0 | (x * component1.scaleX * scaleX)];
                Cb = component2Line[0 | (x * component2.scaleX * scaleX)];
                Cr = component3Line[0 | (x * component3.scaleX * scaleX)];
                K = component4Line[0 | (x * component4.scaleX * scaleX)];

                C = 255 - clampTo8bit(Y + 1.402 * (Cr - 128));
                M = 255 - clampTo8bit(Y - 0.3441363 * (Cb - 128) - 0.71413636 * (Cr - 128));
                Ye = 255 - clampTo8bit(Y + 1.772 * (Cb - 128));
              }
              data[offset++] = 255-C;
              data[offset++] = 255-M;
              data[offset++] = 255-Ye;
              data[offset++] = 255-K;
            }
          }
          break;
        default:
          throw 'Unsupported color mode';
      }
      return data;
    },
    copyToImageData: function copyToImageData(imageData) {
      var width = imageData.width, height = imageData.height;
      var imageDataArray = imageData.data;
      var data = this.getData(width, height);
      var i = 0, j = 0, x, y;
      var Y, K, C, M, R, G, B;
      switch (this.components.length) {
        case 1:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              Y = data[i++];

              imageDataArray[j++] = Y;
              imageDataArray[j++] = Y;
              imageDataArray[j++] = Y;
              imageDataArray[j++] = 255;
            }
          }
          break;
        case 3:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              R = data[i++];
              G = data[i++];
              B = data[i++];

              imageDataArray[j++] = R;
              imageDataArray[j++] = G;
              imageDataArray[j++] = B;
              imageDataArray[j++] = 255;
            }
          }
          break;
        case 4:
          for (y = 0; y < height; y++) {
            for (x = 0; x < width; x++) {
              C = data[i++];
              M = data[i++];
              Y = data[i++];
              K = data[i++];

              R = 255 - clampTo8bit(C * (1 - K / 255) + K);
              G = 255 - clampTo8bit(M * (1 - K / 255) + K);
              B = 255 - clampTo8bit(Y * (1 - K / 255) + K);

              imageDataArray[j++] = R;
              imageDataArray[j++] = G;
              imageDataArray[j++] = B;
              imageDataArray[j++] = 255;
            }
          }
          break;
        default:
          throw 'Unsupported color mode';
      }
    }
  };

  return constructor;
})();
module.exports = decode;

function decode(jpegData) {
  var arr = new Uint8Array(jpegData);
  var decoder = new JpegImage();
  decoder.parse(arr);

  var image = {
    width: decoder.width,
    height: decoder.height,
    data: new Buffer(decoder.width * decoder.height * 4)
  };
  
  decoder.copyToImageData(image);
  
  return image;
}


/***/ }),
/* 203 */
/***/ (function(module, exports) {

/*
  Copyright (c) 2008, Adobe Systems Incorporated
  All rights reserved.

  Redistribution and use in source and binary forms, with or without 
  modification, are permitted provided that the following conditions are
  met:

  * Redistributions of source code must retain the above copyright notice, 
    this list of conditions and the following disclaimer.
  
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the 
    documentation and/or other materials provided with the distribution.
  
  * Neither the name of Adobe Systems Incorporated nor the names of its 
    contributors may be used to endorse or promote products derived from 
    this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
  THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
  PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR 
  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
/*
JPEG encoder ported to JavaScript and optimized by Andreas Ritter, www.bytestrom.eu, 11/2009

Basic GUI blocking jpeg encoder
*/

var btoa = btoa || function(buf) {
  return new Buffer(buf).toString('base64');
};

function JPEGEncoder(quality) {
  var self = this;
	var fround = Math.round;
	var ffloor = Math.floor;
	var YTable = new Array(64);
	var UVTable = new Array(64);
	var fdtbl_Y = new Array(64);
	var fdtbl_UV = new Array(64);
	var YDC_HT;
	var UVDC_HT;
	var YAC_HT;
	var UVAC_HT;
	
	var bitcode = new Array(65535);
	var category = new Array(65535);
	var outputfDCTQuant = new Array(64);
	var DU = new Array(64);
	var byteout = [];
	var bytenew = 0;
	var bytepos = 7;
	
	var YDU = new Array(64);
	var UDU = new Array(64);
	var VDU = new Array(64);
	var clt = new Array(256);
	var RGB_YUV_TABLE = new Array(2048);
	var currentQuality;
	
	var ZigZag = [
			 0, 1, 5, 6,14,15,27,28,
			 2, 4, 7,13,16,26,29,42,
			 3, 8,12,17,25,30,41,43,
			 9,11,18,24,31,40,44,53,
			10,19,23,32,39,45,52,54,
			20,22,33,38,46,51,55,60,
			21,34,37,47,50,56,59,61,
			35,36,48,49,57,58,62,63
		];
	
	var std_dc_luminance_nrcodes = [0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0];
	var std_dc_luminance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
	var std_ac_luminance_nrcodes = [0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,0x7d];
	var std_ac_luminance_values = [
			0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,
			0x21,0x31,0x41,0x06,0x13,0x51,0x61,0x07,
			0x22,0x71,0x14,0x32,0x81,0x91,0xa1,0x08,
			0x23,0x42,0xb1,0xc1,0x15,0x52,0xd1,0xf0,
			0x24,0x33,0x62,0x72,0x82,0x09,0x0a,0x16,
			0x17,0x18,0x19,0x1a,0x25,0x26,0x27,0x28,
			0x29,0x2a,0x34,0x35,0x36,0x37,0x38,0x39,
			0x3a,0x43,0x44,0x45,0x46,0x47,0x48,0x49,
			0x4a,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
			0x5a,0x63,0x64,0x65,0x66,0x67,0x68,0x69,
			0x6a,0x73,0x74,0x75,0x76,0x77,0x78,0x79,
			0x7a,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
			0x8a,0x92,0x93,0x94,0x95,0x96,0x97,0x98,
			0x99,0x9a,0xa2,0xa3,0xa4,0xa5,0xa6,0xa7,
			0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,0xb5,0xb6,
			0xb7,0xb8,0xb9,0xba,0xc2,0xc3,0xc4,0xc5,
			0xc6,0xc7,0xc8,0xc9,0xca,0xd2,0xd3,0xd4,
			0xd5,0xd6,0xd7,0xd8,0xd9,0xda,0xe1,0xe2,
			0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,0xea,
			0xf1,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
			0xf9,0xfa
		];
	
	var std_dc_chrominance_nrcodes = [0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0];
	var std_dc_chrominance_values = [0,1,2,3,4,5,6,7,8,9,10,11];
	var std_ac_chrominance_nrcodes = [0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,0x77];
	var std_ac_chrominance_values = [
			0x00,0x01,0x02,0x03,0x11,0x04,0x05,0x21,
			0x31,0x06,0x12,0x41,0x51,0x07,0x61,0x71,
			0x13,0x22,0x32,0x81,0x08,0x14,0x42,0x91,
			0xa1,0xb1,0xc1,0x09,0x23,0x33,0x52,0xf0,
			0x15,0x62,0x72,0xd1,0x0a,0x16,0x24,0x34,
			0xe1,0x25,0xf1,0x17,0x18,0x19,0x1a,0x26,
			0x27,0x28,0x29,0x2a,0x35,0x36,0x37,0x38,
			0x39,0x3a,0x43,0x44,0x45,0x46,0x47,0x48,
			0x49,0x4a,0x53,0x54,0x55,0x56,0x57,0x58,
			0x59,0x5a,0x63,0x64,0x65,0x66,0x67,0x68,
			0x69,0x6a,0x73,0x74,0x75,0x76,0x77,0x78,
			0x79,0x7a,0x82,0x83,0x84,0x85,0x86,0x87,
			0x88,0x89,0x8a,0x92,0x93,0x94,0x95,0x96,
			0x97,0x98,0x99,0x9a,0xa2,0xa3,0xa4,0xa5,
			0xa6,0xa7,0xa8,0xa9,0xaa,0xb2,0xb3,0xb4,
			0xb5,0xb6,0xb7,0xb8,0xb9,0xba,0xc2,0xc3,
			0xc4,0xc5,0xc6,0xc7,0xc8,0xc9,0xca,0xd2,
			0xd3,0xd4,0xd5,0xd6,0xd7,0xd8,0xd9,0xda,
			0xe2,0xe3,0xe4,0xe5,0xe6,0xe7,0xe8,0xe9,
			0xea,0xf2,0xf3,0xf4,0xf5,0xf6,0xf7,0xf8,
			0xf9,0xfa
		];
	
	function initQuantTables(sf){
			var YQT = [
				16, 11, 10, 16, 24, 40, 51, 61,
				12, 12, 14, 19, 26, 58, 60, 55,
				14, 13, 16, 24, 40, 57, 69, 56,
				14, 17, 22, 29, 51, 87, 80, 62,
				18, 22, 37, 56, 68,109,103, 77,
				24, 35, 55, 64, 81,104,113, 92,
				49, 64, 78, 87,103,121,120,101,
				72, 92, 95, 98,112,100,103, 99
			];
			
			for (var i = 0; i < 64; i++) {
				var t = ffloor((YQT[i]*sf+50)/100);
				if (t < 1) {
					t = 1;
				} else if (t > 255) {
					t = 255;
				}
				YTable[ZigZag[i]] = t;
			}
			var UVQT = [
				17, 18, 24, 47, 99, 99, 99, 99,
				18, 21, 26, 66, 99, 99, 99, 99,
				24, 26, 56, 99, 99, 99, 99, 99,
				47, 66, 99, 99, 99, 99, 99, 99,
				99, 99, 99, 99, 99, 99, 99, 99,
				99, 99, 99, 99, 99, 99, 99, 99,
				99, 99, 99, 99, 99, 99, 99, 99,
				99, 99, 99, 99, 99, 99, 99, 99
			];
			for (var j = 0; j < 64; j++) {
				var u = ffloor((UVQT[j]*sf+50)/100);
				if (u < 1) {
					u = 1;
				} else if (u > 255) {
					u = 255;
				}
				UVTable[ZigZag[j]] = u;
			}
			var aasf = [
				1.0, 1.387039845, 1.306562965, 1.175875602,
				1.0, 0.785694958, 0.541196100, 0.275899379
			];
			var k = 0;
			for (var row = 0; row < 8; row++)
			{
				for (var col = 0; col < 8; col++)
				{
					fdtbl_Y[k]  = (1.0 / (YTable [ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
					fdtbl_UV[k] = (1.0 / (UVTable[ZigZag[k]] * aasf[row] * aasf[col] * 8.0));
					k++;
				}
			}
		}
		
		function computeHuffmanTbl(nrcodes, std_table){
			var codevalue = 0;
			var pos_in_table = 0;
			var HT = new Array();
			for (var k = 1; k <= 16; k++) {
				for (var j = 1; j <= nrcodes[k]; j++) {
					HT[std_table[pos_in_table]] = [];
					HT[std_table[pos_in_table]][0] = codevalue;
					HT[std_table[pos_in_table]][1] = k;
					pos_in_table++;
					codevalue++;
				}
				codevalue*=2;
			}
			return HT;
		}
		
		function initHuffmanTbl()
		{
			YDC_HT = computeHuffmanTbl(std_dc_luminance_nrcodes,std_dc_luminance_values);
			UVDC_HT = computeHuffmanTbl(std_dc_chrominance_nrcodes,std_dc_chrominance_values);
			YAC_HT = computeHuffmanTbl(std_ac_luminance_nrcodes,std_ac_luminance_values);
			UVAC_HT = computeHuffmanTbl(std_ac_chrominance_nrcodes,std_ac_chrominance_values);
		}
	
		function initCategoryNumber()
		{
			var nrlower = 1;
			var nrupper = 2;
			for (var cat = 1; cat <= 15; cat++) {
				//Positive numbers
				for (var nr = nrlower; nr<nrupper; nr++) {
					category[32767+nr] = cat;
					bitcode[32767+nr] = [];
					bitcode[32767+nr][1] = cat;
					bitcode[32767+nr][0] = nr;
				}
				//Negative numbers
				for (var nrneg =-(nrupper-1); nrneg<=-nrlower; nrneg++) {
					category[32767+nrneg] = cat;
					bitcode[32767+nrneg] = [];
					bitcode[32767+nrneg][1] = cat;
					bitcode[32767+nrneg][0] = nrupper-1+nrneg;
				}
				nrlower <<= 1;
				nrupper <<= 1;
			}
		}
		
		function initRGBYUVTable() {
			for(var i = 0; i < 256;i++) {
				RGB_YUV_TABLE[i]      		=  19595 * i;
				RGB_YUV_TABLE[(i+ 256)>>0] 	=  38470 * i;
				RGB_YUV_TABLE[(i+ 512)>>0] 	=   7471 * i + 0x8000;
				RGB_YUV_TABLE[(i+ 768)>>0] 	= -11059 * i;
				RGB_YUV_TABLE[(i+1024)>>0] 	= -21709 * i;
				RGB_YUV_TABLE[(i+1280)>>0] 	=  32768 * i + 0x807FFF;
				RGB_YUV_TABLE[(i+1536)>>0] 	= -27439 * i;
				RGB_YUV_TABLE[(i+1792)>>0] 	= - 5329 * i;
			}
		}
		
		// IO functions
		function writeBits(bs)
		{
			var value = bs[0];
			var posval = bs[1]-1;
			while ( posval >= 0 ) {
				if (value & (1 << posval) ) {
					bytenew |= (1 << bytepos);
				}
				posval--;
				bytepos--;
				if (bytepos < 0) {
					if (bytenew == 0xFF) {
						writeByte(0xFF);
						writeByte(0);
					}
					else {
						writeByte(bytenew);
					}
					bytepos=7;
					bytenew=0;
				}
			}
		}
	
		function writeByte(value)
		{
			//byteout.push(clt[value]); // write char directly instead of converting later
      byteout.push(value);
		}
	
		function writeWord(value)
		{
			writeByte((value>>8)&0xFF);
			writeByte((value   )&0xFF);
		}
		
		// DCT & quantization core
		function fDCTQuant(data, fdtbl)
		{
			var d0, d1, d2, d3, d4, d5, d6, d7;
			/* Pass 1: process rows. */
			var dataOff=0;
			var i;
			const I8 = 8;
			const I64 = 64;
			for (i=0; i<I8; ++i)
			{
				d0 = data[dataOff];
				d1 = data[dataOff+1];
				d2 = data[dataOff+2];
				d3 = data[dataOff+3];
				d4 = data[dataOff+4];
				d5 = data[dataOff+5];
				d6 = data[dataOff+6];
				d7 = data[dataOff+7];
				
				var tmp0 = d0 + d7;
				var tmp7 = d0 - d7;
				var tmp1 = d1 + d6;
				var tmp6 = d1 - d6;
				var tmp2 = d2 + d5;
				var tmp5 = d2 - d5;
				var tmp3 = d3 + d4;
				var tmp4 = d3 - d4;
	
				/* Even part */
				var tmp10 = tmp0 + tmp3;	/* phase 2 */
				var tmp13 = tmp0 - tmp3;
				var tmp11 = tmp1 + tmp2;
				var tmp12 = tmp1 - tmp2;
	
				data[dataOff] = tmp10 + tmp11; /* phase 3 */
				data[dataOff+4] = tmp10 - tmp11;
	
				var z1 = (tmp12 + tmp13) * 0.707106781; /* c4 */
				data[dataOff+2] = tmp13 + z1; /* phase 5 */
				data[dataOff+6] = tmp13 - z1;
	
				/* Odd part */
				tmp10 = tmp4 + tmp5; /* phase 2 */
				tmp11 = tmp5 + tmp6;
				tmp12 = tmp6 + tmp7;
	
				/* The rotator is modified from fig 4-8 to avoid extra negations. */
				var z5 = (tmp10 - tmp12) * 0.382683433; /* c6 */
				var z2 = 0.541196100 * tmp10 + z5; /* c2-c6 */
				var z4 = 1.306562965 * tmp12 + z5; /* c2+c6 */
				var z3 = tmp11 * 0.707106781; /* c4 */
	
				var z11 = tmp7 + z3;	/* phase 5 */
				var z13 = tmp7 - z3;
	
				data[dataOff+5] = z13 + z2;	/* phase 6 */
				data[dataOff+3] = z13 - z2;
				data[dataOff+1] = z11 + z4;
				data[dataOff+7] = z11 - z4;
	
				dataOff += 8; /* advance pointer to next row */
			}
	
			/* Pass 2: process columns. */
			dataOff = 0;
			for (i=0; i<I8; ++i)
			{
				d0 = data[dataOff];
				d1 = data[dataOff + 8];
				d2 = data[dataOff + 16];
				d3 = data[dataOff + 24];
				d4 = data[dataOff + 32];
				d5 = data[dataOff + 40];
				d6 = data[dataOff + 48];
				d7 = data[dataOff + 56];
				
				var tmp0p2 = d0 + d7;
				var tmp7p2 = d0 - d7;
				var tmp1p2 = d1 + d6;
				var tmp6p2 = d1 - d6;
				var tmp2p2 = d2 + d5;
				var tmp5p2 = d2 - d5;
				var tmp3p2 = d3 + d4;
				var tmp4p2 = d3 - d4;
	
				/* Even part */
				var tmp10p2 = tmp0p2 + tmp3p2;	/* phase 2 */
				var tmp13p2 = tmp0p2 - tmp3p2;
				var tmp11p2 = tmp1p2 + tmp2p2;
				var tmp12p2 = tmp1p2 - tmp2p2;
	
				data[dataOff] = tmp10p2 + tmp11p2; /* phase 3 */
				data[dataOff+32] = tmp10p2 - tmp11p2;
	
				var z1p2 = (tmp12p2 + tmp13p2) * 0.707106781; /* c4 */
				data[dataOff+16] = tmp13p2 + z1p2; /* phase 5 */
				data[dataOff+48] = tmp13p2 - z1p2;
	
				/* Odd part */
				tmp10p2 = tmp4p2 + tmp5p2; /* phase 2 */
				tmp11p2 = tmp5p2 + tmp6p2;
				tmp12p2 = tmp6p2 + tmp7p2;
	
				/* The rotator is modified from fig 4-8 to avoid extra negations. */
				var z5p2 = (tmp10p2 - tmp12p2) * 0.382683433; /* c6 */
				var z2p2 = 0.541196100 * tmp10p2 + z5p2; /* c2-c6 */
				var z4p2 = 1.306562965 * tmp12p2 + z5p2; /* c2+c6 */
				var z3p2 = tmp11p2 * 0.707106781; /* c4 */
	
				var z11p2 = tmp7p2 + z3p2;	/* phase 5 */
				var z13p2 = tmp7p2 - z3p2;
	
				data[dataOff+40] = z13p2 + z2p2; /* phase 6 */
				data[dataOff+24] = z13p2 - z2p2;
				data[dataOff+ 8] = z11p2 + z4p2;
				data[dataOff+56] = z11p2 - z4p2;
	
				dataOff++; /* advance pointer to next column */
			}
	
			// Quantize/descale the coefficients
			var fDCTQuant;
			for (i=0; i<I64; ++i)
			{
				// Apply the quantization and scaling factor & Round to nearest integer
				fDCTQuant = data[i]*fdtbl[i];
				outputfDCTQuant[i] = (fDCTQuant > 0.0) ? ((fDCTQuant + 0.5)|0) : ((fDCTQuant - 0.5)|0);
				//outputfDCTQuant[i] = fround(fDCTQuant);

			}
			return outputfDCTQuant;
		}
		
		function writeAPP0()
		{
			writeWord(0xFFE0); // marker
			writeWord(16); // length
			writeByte(0x4A); // J
			writeByte(0x46); // F
			writeByte(0x49); // I
			writeByte(0x46); // F
			writeByte(0); // = "JFIF",'\0'
			writeByte(1); // versionhi
			writeByte(1); // versionlo
			writeByte(0); // xyunits
			writeWord(1); // xdensity
			writeWord(1); // ydensity
			writeByte(0); // thumbnwidth
			writeByte(0); // thumbnheight
		}
	
		function writeSOF0(width, height)
		{
			writeWord(0xFFC0); // marker
			writeWord(17);   // length, truecolor YUV JPG
			writeByte(8);    // precision
			writeWord(height);
			writeWord(width);
			writeByte(3);    // nrofcomponents
			writeByte(1);    // IdY
			writeByte(0x11); // HVY
			writeByte(0);    // QTY
			writeByte(2);    // IdU
			writeByte(0x11); // HVU
			writeByte(1);    // QTU
			writeByte(3);    // IdV
			writeByte(0x11); // HVV
			writeByte(1);    // QTV
		}
	
		function writeDQT()
		{
			writeWord(0xFFDB); // marker
			writeWord(132);	   // length
			writeByte(0);
			for (var i=0; i<64; i++) {
				writeByte(YTable[i]);
			}
			writeByte(1);
			for (var j=0; j<64; j++) {
				writeByte(UVTable[j]);
			}
		}
	
		function writeDHT()
		{
			writeWord(0xFFC4); // marker
			writeWord(0x01A2); // length
	
			writeByte(0); // HTYDCinfo
			for (var i=0; i<16; i++) {
				writeByte(std_dc_luminance_nrcodes[i+1]);
			}
			for (var j=0; j<=11; j++) {
				writeByte(std_dc_luminance_values[j]);
			}
	
			writeByte(0x10); // HTYACinfo
			for (var k=0; k<16; k++) {
				writeByte(std_ac_luminance_nrcodes[k+1]);
			}
			for (var l=0; l<=161; l++) {
				writeByte(std_ac_luminance_values[l]);
			}
	
			writeByte(1); // HTUDCinfo
			for (var m=0; m<16; m++) {
				writeByte(std_dc_chrominance_nrcodes[m+1]);
			}
			for (var n=0; n<=11; n++) {
				writeByte(std_dc_chrominance_values[n]);
			}
	
			writeByte(0x11); // HTUACinfo
			for (var o=0; o<16; o++) {
				writeByte(std_ac_chrominance_nrcodes[o+1]);
			}
			for (var p=0; p<=161; p++) {
				writeByte(std_ac_chrominance_values[p]);
			}
		}
	
		function writeSOS()
		{
			writeWord(0xFFDA); // marker
			writeWord(12); // length
			writeByte(3); // nrofcomponents
			writeByte(1); // IdY
			writeByte(0); // HTY
			writeByte(2); // IdU
			writeByte(0x11); // HTU
			writeByte(3); // IdV
			writeByte(0x11); // HTV
			writeByte(0); // Ss
			writeByte(0x3f); // Se
			writeByte(0); // Bf
		}
		
		function processDU(CDU, fdtbl, DC, HTDC, HTAC){
			var EOB = HTAC[0x00];
			var M16zeroes = HTAC[0xF0];
			var pos;
			const I16 = 16;
			const I63 = 63;
			const I64 = 64;
			var DU_DCT = fDCTQuant(CDU, fdtbl);
			//ZigZag reorder
			for (var j=0;j<I64;++j) {
				DU[ZigZag[j]]=DU_DCT[j];
			}
			var Diff = DU[0] - DC; DC = DU[0];
			//Encode DC
			if (Diff==0) {
				writeBits(HTDC[0]); // Diff might be 0
			} else {
				pos = 32767+Diff;
				writeBits(HTDC[category[pos]]);
				writeBits(bitcode[pos]);
			}
			//Encode ACs
			var end0pos = 63; // was const... which is crazy
			for (; (end0pos>0)&&(DU[end0pos]==0); end0pos--) {};
			//end0pos = first element in reverse order !=0
			if ( end0pos == 0) {
				writeBits(EOB);
				return DC;
			}
			var i = 1;
			var lng;
			while ( i <= end0pos ) {
				var startpos = i;
				for (; (DU[i]==0) && (i<=end0pos); ++i) {}
				var nrzeroes = i-startpos;
				if ( nrzeroes >= I16 ) {
					lng = nrzeroes>>4;
					for (var nrmarker=1; nrmarker <= lng; ++nrmarker)
						writeBits(M16zeroes);
					nrzeroes = nrzeroes&0xF;
				}
				pos = 32767+DU[i];
				writeBits(HTAC[(nrzeroes<<4)+category[pos]]);
				writeBits(bitcode[pos]);
				i++;
			}
			if ( end0pos != I63 ) {
				writeBits(EOB);
			}
			return DC;
		}

		function initCharLookupTable(){
			var sfcc = String.fromCharCode;
			for(var i=0; i < 256; i++){ ///// ACHTUNG // 255
				clt[i] = sfcc(i);
			}
		}
		
		this.encode = function(image,quality) // image data object
		{
			var time_start = new Date().getTime();
			
			if(quality) setQuality(quality);
			
			// Initialize bit writer
			byteout = new Array();
			bytenew=0;
			bytepos=7;
	
			// Add JPEG headers
			writeWord(0xFFD8); // SOI
			writeAPP0();
			writeDQT();
			writeSOF0(image.width,image.height);
			writeDHT();
			writeSOS();

	
			// Encode 8x8 macroblocks
			var DCY=0;
			var DCU=0;
			var DCV=0;
			
			bytenew=0;
			bytepos=7;
			
			
			this.encode.displayName = "_encode_";

			var imageData = image.data;
			var width = image.width;
			var height = image.height;

			var quadWidth = width*4;
			var tripleWidth = width*3;
			
			var x, y = 0;
			var r, g, b;
			var start,p, col,row,pos;
			while(y < height){
				x = 0;
				while(x < quadWidth){
				start = quadWidth * y + x;
				p = start;
				col = -1;
				row = 0;
				
				for(pos=0; pos < 64; pos++){
					row = pos >> 3;// /8
					col = ( pos & 7 ) * 4; // %8
					p = start + ( row * quadWidth ) + col;		
					
					if(y+row >= height){ // padding bottom
						p-= (quadWidth*(y+1+row-height));
					}

					if(x+col >= quadWidth){ // padding right	
						p-= ((x+col) - quadWidth +4)
					}
					
					r = imageData[ p++ ];
					g = imageData[ p++ ];
					b = imageData[ p++ ];
					
					
					/* // calculate YUV values dynamically
					YDU[pos]=((( 0.29900)*r+( 0.58700)*g+( 0.11400)*b))-128; //-0x80
					UDU[pos]=(((-0.16874)*r+(-0.33126)*g+( 0.50000)*b));
					VDU[pos]=((( 0.50000)*r+(-0.41869)*g+(-0.08131)*b));
					*/
					
					// use lookup table (slightly faster)
					YDU[pos] = ((RGB_YUV_TABLE[r]             + RGB_YUV_TABLE[(g +  256)>>0] + RGB_YUV_TABLE[(b +  512)>>0]) >> 16)-128;
					UDU[pos] = ((RGB_YUV_TABLE[(r +  768)>>0] + RGB_YUV_TABLE[(g + 1024)>>0] + RGB_YUV_TABLE[(b + 1280)>>0]) >> 16)-128;
					VDU[pos] = ((RGB_YUV_TABLE[(r + 1280)>>0] + RGB_YUV_TABLE[(g + 1536)>>0] + RGB_YUV_TABLE[(b + 1792)>>0]) >> 16)-128;

				}
				
				DCY = processDU(YDU, fdtbl_Y, DCY, YDC_HT, YAC_HT);
				DCU = processDU(UDU, fdtbl_UV, DCU, UVDC_HT, UVAC_HT);
				DCV = processDU(VDU, fdtbl_UV, DCV, UVDC_HT, UVAC_HT);
				x+=32;
				}
				y+=8;
			}
			
			
			////////////////////////////////////////////////////////////////
	
			// Do the bit alignment of the EOI marker
			if ( bytepos >= 0 ) {
				var fillbits = [];
				fillbits[1] = bytepos+1;
				fillbits[0] = (1<<(bytepos+1))-1;
				writeBits(fillbits);
			}
	
			writeWord(0xFFD9); //EOI

      //return new Uint8Array(byteout);
      return new Buffer(byteout);

			var jpegDataUri = 'data:image/jpeg;base64,' + btoa(byteout.join(''));
			
			byteout = [];
			
			// benchmarking
			var duration = new Date().getTime() - time_start;
    		//console.log('Encoding time: '+ duration + 'ms');
    		//
			
			return jpegDataUri			
	}
	
	function setQuality(quality){
		if (quality <= 0) {
			quality = 1;
		}
		if (quality > 100) {
			quality = 100;
		}
		
		if(currentQuality == quality) return // don't recalc if unchanged
		
		var sf = 0;
		if (quality < 50) {
			sf = Math.floor(5000 / quality);
		} else {
			sf = Math.floor(200 - quality*2);
		}
		
		initQuantTables(sf);
		currentQuality = quality;
		//console.log('Quality set to: '+quality +'%');
	}
	
	function init(){
		var time_start = new Date().getTime();
		if(!quality) quality = 50;
		// Create tables
		initCharLookupTable()
		initHuffmanTbl();
		initCategoryNumber();
		initRGBYUVTable();
		
		setQuality(quality);
		var duration = new Date().getTime() - time_start;
    	//console.log('Initialization '+ duration + 'ms');
	}
	
	init();
	
};
module.exports = encode;

function encode(imgData, qu) {
  if (typeof qu === 'undefined') qu = 50;
  var encoder = new JPEGEncoder(qu);
	var data = encoder.encode(imgData, qu);
  return {
    data: data,
    width: imgData.width,
    height: imgData.height
  };
}

// helper function to get the imageData of an existing image on the current page.
function getImageDataFromImage(idOrElement){
	var theImg = (typeof(idOrElement)=='string')? document.getElementById(idOrElement):idOrElement;
	var cvs = document.createElement('canvas');
	cvs.width = theImg.width;
	cvs.height = theImg.height;
	var ctx = cvs.getContext("2d");
	ctx.drawImage(theImg,0,0);
	
	return (ctx.getImageData(0, 0, cvs.width, cvs.height));
}


/***/ }),
/* 204 */
/***/ (function(module, exports, __webpack_require__) {

var _fs
try {
  _fs = __webpack_require__(1)
} catch (_) {
  _fs = __webpack_require__(2)
}

function readFile (file, options, callback) {
  if (callback == null) {
    callback = options
    options = {}
  }

  if (typeof options === 'string') {
    options = {encoding: options}
  }

  options = options || {}
  var fs = options.fs || _fs

  var shouldThrow = true
  // DO NOT USE 'passParsingErrors' THE NAME WILL CHANGE!!!, use 'throws' instead
  if ('passParsingErrors' in options) {
    shouldThrow = options.passParsingErrors
  } else if ('throws' in options) {
    shouldThrow = options.throws
  }

  fs.readFile(file, options, function (err, data) {
    if (err) return callback(err)

    data = stripBom(data)

    var obj
    try {
      obj = JSON.parse(data, options ? options.reviver : null)
    } catch (err2) {
      if (shouldThrow) {
        err2.message = file + ': ' + err2.message
        return callback(err2)
      } else {
        return callback(null, null)
      }
    }

    callback(null, obj)
  })
}

function readFileSync (file, options) {
  options = options || {}
  if (typeof options === 'string') {
    options = {encoding: options}
  }

  var fs = options.fs || _fs

  var shouldThrow = true
  // DO NOT USE 'passParsingErrors' THE NAME WILL CHANGE!!!, use 'throws' instead
  if ('passParsingErrors' in options) {
    shouldThrow = options.passParsingErrors
  } else if ('throws' in options) {
    shouldThrow = options.throws
  }

  try {
    var content = fs.readFileSync(file, options)
    content = stripBom(content)
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = file + ': ' + err.message
      throw err
    } else {
      return null
    }
  }
}

function writeFile (file, obj, options, callback) {
  if (callback == null) {
    callback = options
    options = {}
  }
  options = options || {}
  var fs = options.fs || _fs

  var spaces = typeof options === 'object' && options !== null
    ? 'spaces' in options
    ? options.spaces : this.spaces
    : this.spaces

  var str = ''
  try {
    str = JSON.stringify(obj, options ? options.replacer : null, spaces) + '\n'
  } catch (err) {
    // Need to return whether a callback was passed or not
    if (callback) callback(err, null)
    return
  }

  fs.writeFile(file, str, options, callback)
}

function writeFileSync (file, obj, options) {
  options = options || {}
  var fs = options.fs || _fs

  var spaces = typeof options === 'object' && options !== null
    ? 'spaces' in options
    ? options.spaces : this.spaces
    : this.spaces

  var str = JSON.stringify(obj, options.replacer, spaces) + '\n'
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

function stripBom (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  content = content.replace(/^\uFEFF/, '')
  return content
}

var jsonfile = {
  spaces: null,
  readFile: readFile,
  readFileSync: readFileSync,
  writeFile: writeFile,
  writeFileSync: writeFileSync
}

module.exports = jsonfile


/***/ }),
/* 205 */
/***/ (function(module, exports) {

/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}


/***/ }),
/* 206 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var isWindows = process.platform === 'win32';
var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;

// https://github.com/nodejs/node/blob/3e7a14381497a3b73dda68d05b5130563cdab420/lib/os.js#L25-L43
module.exports = function () {
	var path;

	if (isWindows) {
		path = process.env.TEMP ||
			process.env.TMP ||
			(process.env.SystemRoot || process.env.windir) + '\\temp';
	} else {
		path = process.env.TMPDIR ||
			process.env.TMP ||
			process.env.TEMP ||
			'/tmp';
	}

	if (trailingSlashRe.test(path)) {
		path = path.slice(0, -1);
	}

	return path;
};


/***/ }),
/* 207 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = typeof Promise === 'function' ? Promise : __webpack_require__(208);


/***/ }),
/* 208 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var PENDING = 'pending';
var SETTLED = 'settled';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var NOOP = function () {};
var isNode = typeof global !== 'undefined' && typeof global.process !== 'undefined' && typeof global.process.emit === 'function';

var asyncSetTimer = typeof setImmediate === 'undefined' ? setTimeout : setImmediate;
var asyncQueue = [];
var asyncTimer;

function asyncFlush() {
	// run promise callbacks
	for (var i = 0; i < asyncQueue.length; i++) {
		asyncQueue[i][0](asyncQueue[i][1]);
	}

	// reset async asyncQueue
	asyncQueue = [];
	asyncTimer = false;
}

function asyncCall(callback, arg) {
	asyncQueue.push([callback, arg]);

	if (!asyncTimer) {
		asyncTimer = true;
		asyncSetTimer(asyncFlush, 0);
	}
}

function invokeResolver(resolver, promise) {
	function resolvePromise(value) {
		resolve(promise, value);
	}

	function rejectPromise(reason) {
		reject(promise, reason);
	}

	try {
		resolver(resolvePromise, rejectPromise);
	} catch (e) {
		rejectPromise(e);
	}
}

function invokeCallback(subscriber) {
	var owner = subscriber.owner;
	var settled = owner._state;
	var value = owner._data;
	var callback = subscriber[settled];
	var promise = subscriber.then;

	if (typeof callback === 'function') {
		settled = FULFILLED;
		try {
			value = callback(value);
		} catch (e) {
			reject(promise, e);
		}
	}

	if (!handleThenable(promise, value)) {
		if (settled === FULFILLED) {
			resolve(promise, value);
		}

		if (settled === REJECTED) {
			reject(promise, value);
		}
	}
}

function handleThenable(promise, value) {
	var resolved;

	try {
		if (promise === value) {
			throw new TypeError('A promises callback cannot return that same promise.');
		}

		if (value && (typeof value === 'function' || typeof value === 'object')) {
			// then should be retrieved only once
			var then = value.then;

			if (typeof then === 'function') {
				then.call(value, function (val) {
					if (!resolved) {
						resolved = true;

						if (value === val) {
							fulfill(promise, val);
						} else {
							resolve(promise, val);
						}
					}
				}, function (reason) {
					if (!resolved) {
						resolved = true;

						reject(promise, reason);
					}
				});

				return true;
			}
		}
	} catch (e) {
		if (!resolved) {
			reject(promise, e);
		}

		return true;
	}

	return false;
}

function resolve(promise, value) {
	if (promise === value || !handleThenable(promise, value)) {
		fulfill(promise, value);
	}
}

function fulfill(promise, value) {
	if (promise._state === PENDING) {
		promise._state = SETTLED;
		promise._data = value;

		asyncCall(publishFulfillment, promise);
	}
}

function reject(promise, reason) {
	if (promise._state === PENDING) {
		promise._state = SETTLED;
		promise._data = reason;

		asyncCall(publishRejection, promise);
	}
}

function publish(promise) {
	promise._then = promise._then.forEach(invokeCallback);
}

function publishFulfillment(promise) {
	promise._state = FULFILLED;
	publish(promise);
}

function publishRejection(promise) {
	promise._state = REJECTED;
	publish(promise);
	if (!promise._handled && isNode) {
		global.process.emit('unhandledRejection', promise._data, promise);
	}
}

function notifyRejectionHandled(promise) {
	global.process.emit('rejectionHandled', promise);
}

/**
 * @class
 */
function Promise(resolver) {
	if (typeof resolver !== 'function') {
		throw new TypeError('Promise resolver ' + resolver + ' is not a function');
	}

	if (this instanceof Promise === false) {
		throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');
	}

	this._then = [];

	invokeResolver(resolver, this);
}

Promise.prototype = {
	constructor: Promise,

	_state: PENDING,
	_then: null,
	_data: undefined,
	_handled: false,

	then: function (onFulfillment, onRejection) {
		var subscriber = {
			owner: this,
			then: new this.constructor(NOOP),
			fulfilled: onFulfillment,
			rejected: onRejection
		};

		if ((onRejection || onFulfillment) && !this._handled) {
			this._handled = true;
			if (this._state === REJECTED && isNode) {
				asyncCall(notifyRejectionHandled, this);
			}
		}

		if (this._state === FULFILLED || this._state === REJECTED) {
			// already resolved, call callback async
			asyncCall(invokeCallback, subscriber);
		} else {
			// subscribe
			this._then.push(subscriber);
		}

		return subscriber.then;
	},

	catch: function (onRejection) {
		return this.then(null, onRejection);
	}
};

Promise.all = function (promises) {
	if (!Array.isArray(promises)) {
		throw new TypeError('You must pass an array to Promise.all().');
	}

	return new Promise(function (resolve, reject) {
		var results = [];
		var remaining = 0;

		function resolver(index) {
			remaining++;
			return function (value) {
				results[index] = value;
				if (!--remaining) {
					resolve(results);
				}
			};
		}

		for (var i = 0, promise; i < promises.length; i++) {
			promise = promises[i];

			if (promise && typeof promise.then === 'function') {
				promise.then(resolver(i), reject);
			} else {
				results[i] = promise;
			}
		}

		if (!remaining) {
			resolve(results);
		}
	});
};

Promise.race = function (promises) {
	if (!Array.isArray(promises)) {
		throw new TypeError('You must pass an array to Promise.race().');
	}

	return new Promise(function (resolve, reject) {
		for (var i = 0, promise; i < promises.length; i++) {
			promise = promises[i];

			if (promise && typeof promise.then === 'function') {
				promise.then(resolve, reject);
			} else {
				resolve(promise);
			}
		}
	});
};

Promise.resolve = function (value) {
	if (value && typeof value === 'object' && value.constructor === Promise) {
		return value;
	}

	return new Promise(function (resolve) {
		resolve(value);
	});
};

Promise.reject = function (reason) {
	return new Promise(function (resolve, reject) {
		reject(reason);
	});
};

module.exports = Promise;


/***/ }),
/* 209 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var constants = __webpack_require__(21);

module.exports = function(dataIn, width, height, options) {
  var outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(options.colorType) !== -1;
  if (options.colorType === options.inputColorType) {
    var bigEndian = (function() {
      var buffer = new ArrayBuffer(2);
      new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
      // Int16Array uses the platform's endianness.
      return new Int16Array(buffer)[0] !== 256;
    })();
    // If no need to convert to grayscale and alpha is present/absent in both, take a fast route
     if (options.bitDepth === 8 || (options.bitDepth === 16 && bigEndian)){
         return dataIn;
    }
  }

  // map to a UInt16 array if data is 16bit, fix endianness below
  var data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);

  var maxValue = 255;
  var inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
  var outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
  if (options.bitDepth === 16) {
    maxValue = 65535;
    outBpp *= 2;
  }
  var outData = new Buffer(width * height * outBpp);

  var inIndex = 0;
  var outIndex = 0;

  var bgColor = options.bgColor || {};
  if (bgColor.red === undefined) {
    bgColor.red = maxValue;
  }
  if (bgColor.green === undefined) {
    bgColor.green = maxValue;
  }
  if (bgColor.blue === undefined) {
    bgColor.blue = maxValue;
  }

  function getRGBA(data, inIndex) {
    var red, green, blue, alpha = maxValue;
    switch (options.inputColorType) {
      case constants.COLORTYPE_COLOR_ALPHA:
        alpha = data[inIndex + 3];
        red = data[inIndex];
        green = data[inIndex+1];
        blue = data[inIndex+2];
        break;
      case constants.COLORTYPE_COLOR:
        red = data[inIndex];
        green = data[inIndex+1];
        blue = data[inIndex+2];
        break;
      case constants.COLORTYPE_ALPHA:
        alpha = data[inIndex + 1];
        red = data[inIndex];
        green = red;
        blue = red;
        break;
      case constants.COLORTYPE_GRAYSCALE:
        red = data[inIndex];
        green = red;
        blue = red;
        break;
      default:
        throw new Error('input color type:' + options.inputColorType + ' is not supported at present');
    }

    if (options.inputHasAlpha) {
      if (!outHasAlpha) {
        alpha /= maxValue;
        red = Math.min(Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red), 0), maxValue);
        green = Math.min(Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green), 0), maxValue);
        blue = Math.min(Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0), maxValue);
      }
    }
    return {red, green, blue, alpha};
  }

  for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
      var rgba = getRGBA(data, inIndex);

      switch (options.colorType) {
        case constants.COLORTYPE_COLOR_ALPHA:
        case constants.COLORTYPE_COLOR:
          if (options.bitDepth === 8) {
            outData[outIndex] = rgba.red;
            outData[outIndex + 1] = rgba.green;
            outData[outIndex + 2] = rgba.blue;
            if (outHasAlpha) {
              outData[outIndex + 3] = rgba.alpha;
            }
          } else {
            outData.writeUInt16BE(rgba.red, outIndex);
            outData.writeUInt16BE(rgba.green, outIndex + 2);
            outData.writeUInt16BE(rgba.blue, outIndex + 4);
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 6);
            }
          }
          break;
        case constants.COLORTYPE_ALPHA:
        case constants.COLORTYPE_GRAYSCALE:
          // Convert to grayscale and alpha
          var grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
          if (options.bitDepth === 8) {
            outData[outIndex] = grayscale;
            if (outHasAlpha) {
              outData[outIndex + 1] = rgba.alpha;
            }
          } else {
            outData.writeUInt16BE(grayscale, outIndex);
            if (outHasAlpha) {
              outData.writeUInt16BE(rgba.alpha, outIndex + 2);
            }
          }
          break;
      }

      inIndex += inBpp;
      outIndex += outBpp;
    }
  }

  return outData;
};


/***/ }),
/* 210 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var paethPredictor = __webpack_require__(110);

function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
  pxData.copy(rawData, rawPos, pxPos, pxPos + byteWidth);
}

function filterSumNone(pxData, pxPos, byteWidth) {

  var sum = 0;
  var length = pxPos + byteWidth;

  for (var i = pxPos; i < length; i++) {
    sum += Math.abs(pxData[i]);
  }
  return sum;
}

function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var val = pxData[pxPos + x] - left;

    rawData[rawPos + x] = val;
  }
}

function filterSumSub(pxData, pxPos, byteWidth, bpp) {

  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var val = pxData[pxPos + x] - left;

    sum += Math.abs(val);
  }

  return sum;
}

function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {

  for (var x = 0; x < byteWidth; x++) {

    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - up;

    rawData[rawPos + x] = val;
  }
}

function filterSumUp(pxData, pxPos, byteWidth) {

  var sum = 0;
  var length = pxPos + byteWidth;
  for (var x = pxPos; x < length; x++) {

    var up = pxPos > 0 ? pxData[x - byteWidth] : 0;
    var val = pxData[x] - up;

    sum += Math.abs(val);
  }

  return sum;
}

function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - ((left + up) >> 1);

    rawData[rawPos + x] = val;
  }
}

function filterSumAvg(pxData, pxPos, byteWidth, bpp) {

  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var val = pxData[pxPos + x] - ((left + up) >> 1);

    sum += Math.abs(val);
  }

  return sum;
}

function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {

  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

    rawData[rawPos + x] = val;
  }
}

function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
  var sum = 0;
  for (var x = 0; x < byteWidth; x++) {

    var left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
    var up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
    var upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
    var val = pxData[pxPos + x] - paethPredictor(left, up, upleft);

    sum += Math.abs(val);
  }

  return sum;
}

var filters = {
  0: filterNone,
  1: filterSub,
  2: filterUp,
  3: filterAvg,
  4: filterPaeth
};

var filterSums = {
  0: filterSumNone,
  1: filterSumSub,
  2: filterSumUp,
  3: filterSumAvg,
  4: filterSumPaeth
};

module.exports = function(pxData, width, height, options, bpp) {

  var filterTypes;
  if (!('filterType' in options) || options.filterType === -1) {
    filterTypes = [0, 1, 2, 3, 4];
  }
  else if (typeof options.filterType === 'number') {
    filterTypes = [options.filterType];
  }
  else {
    throw new Error('unrecognised filter types');
  }

  if (options.bitDepth === 16) bpp *= 2;
  var byteWidth = width * bpp;
  var rawPos = 0;
  var pxPos = 0;
  var rawData = new Buffer((byteWidth + 1) * height);

  var sel = filterTypes[0];

  for (var y = 0; y < height; y++) {

    if (filterTypes.length > 1) {
      // find best filter for this line (with lowest sum of values)
      var min = Infinity;

      for (var i = 0; i < filterTypes.length; i++) {
        var sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
        if (sum < min) {
          sel = filterTypes[i];
          min = sum;
        }
      }
    }

    rawData[rawPos] = sel;
    rawPos++;
    filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
    rawPos += byteWidth;
    pxPos += byteWidth;
  }
  return rawData;
};


/***/ }),
/* 211 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(7);
var ChunkStream = __webpack_require__(104);
var Filter = __webpack_require__(106);


var FilterAsync = module.exports = function(bitmapInfo) {
  ChunkStream.call(this);

  var buffers = [];
  var that = this;
  this._filter = new Filter(bitmapInfo, {
    read: this.read.bind(this),
    write: function(buffer) {
      buffers.push(buffer);
    },
    complete: function() {
      that.emit('complete', Buffer.concat(buffers));
    }
  });

  this._filter.start();
};
util.inherits(FilterAsync, ChunkStream);


/***/ }),
/* 212 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var SyncReader = __webpack_require__(113);
var Filter = __webpack_require__(106);


exports.process = function(inBuffer, bitmapInfo) {

  var outBuffers = [];
  var reader = new SyncReader(inBuffer);
  var filter = new Filter(bitmapInfo, {
    read: reader.read.bind(reader),
    write: function(bufferPart) {
      outBuffers.push(bufferPart);
    },
    complete: function() {
    }
  });

  filter.start();
  reader.process();

  return Buffer.concat(outBuffers);
};

/***/ }),
/* 213 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(7);
var Stream = __webpack_require__(19);
var constants = __webpack_require__(21);
var Packer = __webpack_require__(109);

var PackerAsync = module.exports = function(opt) {
  Stream.call(this);

  var options = opt || {};

  this._packer = new Packer(options);
  this._deflate = this._packer.createDeflate();

  this.readable = true;
};
util.inherits(PackerAsync, Stream);


PackerAsync.prototype.pack = function(data, width, height, gamma) {
  // Signature
  this.emit('data', new Buffer(constants.PNG_SIGNATURE));
  this.emit('data', this._packer.packIHDR(width, height));

  if (gamma) {
    this.emit('data', this._packer.packGAMA(gamma));
  }

  var filteredData = this._packer.filterData(data, width, height);

  // compress it
  this._deflate.on('error', this.emit.bind(this, 'error'));

  this._deflate.on('data', function(compressedData) {
    this.emit('data', this._packer.packIDAT(compressedData));
  }.bind(this));

  this._deflate.on('end', function() {
    this.emit('data', this._packer.packIEND());
    this.emit('end');
  }.bind(this));

  this._deflate.end(filteredData);
};


/***/ }),
/* 214 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasSyncZlib = true;
var zlib = __webpack_require__(22);
var constants = __webpack_require__(21);
var Packer = __webpack_require__(109);

module.exports = function(metaData, opt) {

  if (!hasSyncZlib) {
    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
  }

  var options = opt || {};

  var packer = new Packer(options);

  var chunks = [];

  // Signature
  chunks.push(new Buffer(constants.PNG_SIGNATURE));

  // Header
  chunks.push(packer.packIHDR(metaData.width, metaData.height));

  if (metaData.gamma) {
    chunks.push(packer.packGAMA(metaData.gamma));
  }

  var filteredData = packer.filterData(metaData.data, metaData.width, metaData.height);

  // compress it
  var compressedData = zlib.deflateSync(filteredData, packer.getDeflateOptions());
  filteredData = null;

  if (!compressedData || !compressedData.length) {
    throw new Error('bad png - invalid compressed data response');
  }
  chunks.push(packer.packIDAT(compressedData));

  // End
  chunks.push(packer.packIEND());

  return Buffer.concat(chunks);
};


/***/ }),
/* 215 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var util = __webpack_require__(7);
var zlib = __webpack_require__(22);
var ChunkStream = __webpack_require__(104);
var FilterAsync = __webpack_require__(211);
var Parser = __webpack_require__(111);
var bitmapper = __webpack_require__(103);
var formatNormaliser = __webpack_require__(107);

var ParserAsync = module.exports = function(options) {
  ChunkStream.call(this);

  this._parser = new Parser(options, {
    read: this.read.bind(this),
    error: this._handleError.bind(this),
    metadata: this._handleMetaData.bind(this),
    gamma: this.emit.bind(this, 'gamma'),
    palette: this._handlePalette.bind(this),
    transColor: this._handleTransColor.bind(this),
    finished: this._finished.bind(this),
    inflateData: this._inflateData.bind(this)
  });
  this._options = options;
  this.writable = true;

  this._parser.start();
};
util.inherits(ParserAsync, ChunkStream);


ParserAsync.prototype._handleError = function(err) {

  this.emit('error', err);

  this.writable = false;

  this.destroy();

  if (this._inflate && this._inflate.destroy) {
    this._inflate.destroy();
  }

  this.errord = true;
};

ParserAsync.prototype._inflateData = function(data) {
  if (!this._inflate) {
    if (this._bitmapInfo.interlace) {
      this._inflate = zlib.createInflate();

      this._inflate.on('error', this.emit.bind(this, 'error'));
      this._filter.on('complete', this._complete.bind(this));

      this._inflate.pipe(this._filter);
    } else {
      var rowSize = ((this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7) >> 3) + 1;
      var imageSize = rowSize * this._bitmapInfo.height;
      var chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
      
      this._inflate = zlib.createInflate({ chunkSize: chunkSize });
      var leftToInflate = imageSize;

      var emitError = this.emit.bind(this, 'error');
      this._inflate.on('error', function(err) {
        if (!leftToInflate) {
          return;
        }

        emitError(err);
      });
      this._filter.on('complete', this._complete.bind(this));

      var filterWrite = this._filter.write.bind(this._filter);
      this._inflate.on('data', function(chunk) {
        if (!leftToInflate) {
          return;
        }

        if (chunk.length > leftToInflate) {
          chunk = chunk.slice(0, leftToInflate);
        }

        leftToInflate -= chunk.length;

        filterWrite(chunk);
      });

      this._inflate.on('end', this._filter.end.bind(this._filter));
    }
  }
  this._inflate.write(data);
};

ParserAsync.prototype._handleMetaData = function(metaData) {

  this.emit('metadata', metaData);

  this._bitmapInfo = Object.create(metaData);

  this._filter = new FilterAsync(this._bitmapInfo);
};

ParserAsync.prototype._handleTransColor = function(transColor) {
  this._bitmapInfo.transColor = transColor;
};

ParserAsync.prototype._handlePalette = function(palette) {
  this._bitmapInfo.palette = palette;
};


ParserAsync.prototype._finished = function() {
  if (this.errord) {
    return;
  }

  if (!this._inflate) {
    this.emit('error', 'No Inflate block');
  }
  else {
    // no more data to inflate
    this._inflate.end();
  }
  this.destroySoon();
};

ParserAsync.prototype._complete = function(filteredData) {

  if (this.errord) {
    return;
  }

  try {
    var bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);

    var normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
    bitmapData = null;
  }
  catch (ex) {
    this._handleError(ex);
    return;
  }

  this.emit('parsed', normalisedBitmapData);
};


/***/ }),
/* 216 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var hasSyncZlib = true;
var zlib = __webpack_require__(22);
var inflateSync = __webpack_require__(218);
var SyncReader = __webpack_require__(113);
var FilterSync = __webpack_require__(212);
var Parser = __webpack_require__(111);
var bitmapper = __webpack_require__(103);
var formatNormaliser = __webpack_require__(107);


module.exports = function(buffer, options) {

  if (!hasSyncZlib) {
    throw new Error('To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0');
  }

  var err;
  function handleError(_err_) {
    err = _err_;
  }

  var metaData;
  function handleMetaData(_metaData_) {
    metaData = _metaData_;
  }

  function handleTransColor(transColor) {
    metaData.transColor = transColor;
  }

  function handlePalette(palette) {
    metaData.palette = palette;
  }

  var gamma;
  function handleGamma(_gamma_) {
    gamma = _gamma_;
  }

  var inflateDataList = [];
  function handleInflateData(inflatedData) {
    inflateDataList.push(inflatedData);
  }

  var reader = new SyncReader(buffer);

  var parser = new Parser(options, {
    read: reader.read.bind(reader),
    error: handleError,
    metadata: handleMetaData,
    gamma: handleGamma,
    palette: handlePalette,
    transColor: handleTransColor,
    inflateData: handleInflateData
  });

  parser.start();
  reader.process();

  if (err) {
    throw err;
  }

  //join together the inflate datas
  var inflateData = Buffer.concat(inflateDataList);
  inflateDataList.length = 0;

  var inflatedData;
  if (metaData.interlace) {
    inflatedData = zlib.inflateSync(inflateData);
  } else {
    var rowSize = ((metaData.width * metaData.bpp * metaData.depth + 7) >> 3) + 1;
    var imageSize = rowSize * metaData.height;
    inflatedData = inflateSync(inflateData, { chunkSize: imageSize, maxLength: imageSize });
  }
  inflateData = null;

  if (!inflatedData || !inflatedData.length) {
    throw new Error('bad png - invalid inflate data response');
  }

  var unfilteredData = FilterSync.process(inflatedData, metaData);
  inflateData = null;

  var bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
  unfilteredData = null;

  var normalisedBitmapData = formatNormaliser(bitmapData, metaData);

  metaData.data = normalisedBitmapData;
  metaData.gamma = gamma || 0;

  return metaData;
};


/***/ }),
/* 217 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";



var parse = __webpack_require__(216);
var pack = __webpack_require__(214);


exports.read = function(buffer, options) {

  return parse(buffer, options || {});
};

exports.write = function(png, options) {

  return pack(png, options);
};


/***/ }),
/* 218 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var assert = __webpack_require__(32).ok;
var zlib = __webpack_require__(22);
var util = __webpack_require__(7);

var kMaxLength = __webpack_require__(223).kMaxLength;

function Inflate(opts) {
  if (!(this instanceof Inflate)) {
    return new Inflate(opts);
  }

  if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
    opts.chunkSize = zlib.Z_MIN_CHUNK;
  }

  zlib.Inflate.call(this, opts);

  if (opts && opts.maxLength != null) {
    this._maxLength = opts.maxLength;
  }
}

function createInflate(opts) {
  return new Inflate(opts);
}

function _close(engine, callback) {
  if (callback) {
    process.nextTick(callback);
  }

  // Caller may invoke .close after a zlib error (which will null _handle).
  if (!engine._handle) {
    return;
  }

  engine._handle.close();
  engine._handle = null;
}

Inflate.prototype._processChunk = function(chunk, flushFlag, asyncCb) {
  if (typeof asyncCb === 'function') {
    return zlib.Inflate._processChunk.call(this, chunk, flushFlag, asyncCb);
  }

  var self = this;

  var availInBefore = chunk && chunk.length;
  var availOutBefore = this._chunkSize - this._offset;
  var leftToInflate = this._maxLength;
  var inOff = 0;

  var buffers = [];
  var nread = 0;

  var error;
  this.on('error', function(err) {
    error = err;
  });

  function handleChunk(availInAfter, availOutAfter) {
    if (self._hadError) {
      return;
    }

    var have = availOutBefore - availOutAfter;
    assert(have >= 0, 'have should not go down');

    if (have > 0) {
      var out = self._buffer.slice(self._offset, self._offset + have);
      self._offset += have;

      if (out.length > leftToInflate) {
        out = out.slice(0, leftToInflate);
      }

      buffers.push(out);
      nread += out.length;
      leftToInflate -= out.length;

      if (leftToInflate === 0) {
        return false;
      }
    }

    if (availOutAfter === 0 || self._offset >= self._chunkSize) {
      availOutBefore = self._chunkSize;
      self._offset = 0;
      self._buffer = Buffer.allocUnsafe(self._chunkSize);
    }

    if (availOutAfter === 0) {
      inOff += (availInBefore - availInAfter);
      availInBefore = availInAfter;

      return true;
    }

    return false;
  }

  assert(this._handle, 'zlib binding closed');
  do {
    var res = this._handle.writeSync(flushFlag,
                                     chunk, // in
                                     inOff, // in_off
                                     availInBefore, // in_len
                                     this._buffer, // out
                                     this._offset, //out_off
                                     availOutBefore); // out_len
  } while (!this._hadError && handleChunk(res[0], res[1]));

  if (this._hadError) {
    throw error;
  }

  if (nread >= kMaxLength) {
    _close(this);
    throw new RangeError('Cannot create final Buffer. It would be larger than 0x' + kMaxLength.toString(16) + ' bytes');
  }

  var buf = Buffer.concat(buffers, nread);
  _close(this);

  return buf;
};

util.inherits(Inflate, zlib.Inflate);

function zlibBufferSync(engine, buffer) {
  if (typeof buffer === 'string') {
    buffer = Buffer.from(buffer);
  }
  if (!(buffer instanceof Buffer)) {
    throw new TypeError('Not a string or buffer');
  }

  var flushFlag = engine._finishFlushFlag;
  if (flushFlag == null) {
    flushFlag = zlib.Z_FINISH;
  }

  return engine._processChunk(buffer, flushFlag);
}

function inflateSync(buffer, opts) {
  return zlibBufferSync(new Inflate(opts), buffer);
}

module.exports = exports = inflateSync;
exports.Inflate = Inflate;
exports.createInflate = createInflate;
exports.inflateSync = inflateSync;


/***/ }),
/* 219 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const bmp = __webpack_require__(120);
const fileType = __webpack_require__(155);
const getStream = __webpack_require__(193);
const jpeg = __webpack_require__(100);
const parsePng = __webpack_require__(102);
const PNG = __webpack_require__(112).PNG;
const Resize = __webpack_require__(201);

const resize = (img, opts) => {
	if (typeof opts.width !== 'number') {
		opts.width = Math.trunc(img.width * (opts.height / img.height));
	}

	if (typeof opts.height !== 'number') {
		opts.height = Math.trunc(img.height * (opts.width / img.width));
	}

	return new Promise(resolve => {
		const resize = new Resize(img.width, img.height, opts.width, opts.height, true, true, buf => resolve(buf));
		resize.resize(img.data);
	});
};

module.exports = (buf, opts) => {
	if (!Buffer.isBuffer(buf)) {
		return Promise.reject(new TypeError('Expected a buffer'));
	}

	const type = fileType(buf);

	if (!type || (type.ext !== 'bmp' && type.ext !== 'jpg' && type.ext !== 'png')) {
		return Promise.reject(new Error('Image format not supported'));
	}

	opts = Object.assign({}, opts);

	if (typeof opts.width !== 'number' && typeof opts.height !== 'number') {
		return Promise.reject(new Error('You need to set either width or height'));
	}

	const encodeJpeg = (buf, opts) => {
		return jpeg.encode({
			width: opts.width,
			height: opts.height,
			data: buf
		}).data;
	};

	const encodePng = (buf, opts) => {
		const png = new PNG({width: opts.width, height: opts.height, filterType: -1});
		png.data = buf;
		return getStream.buffer(png.pack());
	};

	const encodeBmp = (buf, opts) => {
		return bmp.encode({
			width: opts.width,
			height: opts.height,
			data: buf
		}).data;
	};

	if (type.ext === 'bmp') {
		const img = bmp.decode(buf);

		return resize(img, opts).then(buf => {
			if (opts.out === 'jpg') {
				return encodeJpeg(buf, opts);
			} else if (opts.out === 'png') {
				return encodePng(buf, opts);
			}
			return encodeBmp(buf, opts);
		});
	}

	if (type.ext === 'jpg') {
		const img = jpeg.decode(buf);

		return resize(img, opts).then(buf => {
			if (opts.out === 'png') {
				return encodePng(buf, opts);
			} else if (opts.out === 'bmp') {
				return encodeBmp(buf, opts);
			}
			return encodeJpeg(buf, opts);
		});
	}

	return parsePng(buf).then(img => resize(img, opts).then(buf => {
		if (opts.out === 'jpg') {
			return encodeJpeg(buf, opts);
		} else if (opts.out === 'bmp') {
			return encodeBmp(buf, opts);
		}
		img.width = opts.width;
		img.height = opts.height;
		img.data = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
		return getStream.buffer(img.pack());
	}));
};


/***/ }),
/* 220 */
/***/ (function(module, exports, __webpack_require__) {

/*!
 * Tmp
 *
 * Copyright (c) 2011-2015 KARASZI Istvan <github@spam.raszi.hu>
 *
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
var
  fs     = __webpack_require__(2),
  path   = __webpack_require__(0),
  crypto = __webpack_require__(114),
  tmpDir = __webpack_require__(206),
  _c     = process.binding('constants');


/**
 * The working inner variables.
 */
var
  // store the actual TMP directory
  _TMP = tmpDir(),

  // the random characters to choose from
  RANDOM_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',

  TEMPLATE_PATTERN = /XXXXXX/,

  DEFAULT_TRIES = 3,

  CREATE_FLAGS = (_c.O_CREAT || _c.fs.O_CREAT) | (_c.O_EXCL || _c.fs.O_EXCL) | (_c.O_RDWR || _c.fs.O_RDWR),

  EBADF = _c.EBADF || _c.os.errno.EBADF,
  ENOENT = _c.ENOENT || _c.os.errno.ENOENT,

  DIR_MODE = 448 /* 0700 */,
  FILE_MODE = 384 /* 0600 */,

  // this will hold the objects need to be removed on exit
  _removeObjects = [],

  _gracefulCleanup = false,
  _uncaughtException = false;

/**
 * Random name generator based on crypto.
 * Adapted from http://blog.tompawlak.org/how-to-generate-random-values-nodejs-javascript
 *
 * @param {Number} howMany
 * @return {String}
 * @api private
 */
function _randomChars(howMany) {
  var
    value = [],
    rnd = null;

  // make sure that we do not fail because we ran out of entropy
  try {
    rnd = crypto.randomBytes(howMany);
  } catch (e) {
    rnd = crypto.pseudoRandomBytes(howMany);
  }

  for (var i = 0; i < howMany; i++) {
    value.push(RANDOM_CHARS[rnd[i] % RANDOM_CHARS.length]);
  }

  return value.join('');
}

/**
 * Checks whether the `obj` parameter is defined or not.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */
function _isUndefined(obj) {
  return typeof obj === 'undefined';
}

/**
 * Parses the function arguments.
 *
 * This function helps to have optional arguments.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api private
 */
function _parseArguments(options, callback) {
  if (typeof options == 'function') {
    var
      tmp = options,
      options = callback || {},
      callback = tmp;
  } else if (typeof options == 'undefined') {
    options = {};
  }

  return [options, callback];
}

/**
 * Generates a new temporary name.
 *
 * @param {Object} opts
 * @returns {String}
 * @api private
 */
function _generateTmpName(opts) {
  if (opts.name) {
    return path.join(opts.dir || _TMP, opts.name);
  }

  // mkstemps like template
  if (opts.template) {
    return opts.template.replace(TEMPLATE_PATTERN, _randomChars(6));
  }

  // prefix and postfix
  var name = [
    opts.prefix || 'tmp-',
    process.pid,
    _randomChars(12),
    opts.postfix || ''
  ].join('');

  return path.join(opts.dir || _TMP, name);
}

/**
 * Gets a temporary file name.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api private
 */
function _getTmpName(options, callback) {
  var
    args = _parseArguments(options, callback),
    opts = args[0],
    cb = args[1],
    tries = opts.tries || DEFAULT_TRIES;

  if (isNaN(tries) || tries < 0)
    return cb(new Error('Invalid tries'));

  if (opts.template && !opts.template.match(TEMPLATE_PATTERN))
    return cb(new Error('Invalid template provided'));

  (function _getUniqueName() {
    var name = _generateTmpName(opts);

    // check whether the path exists then retry if needed
    fs.stat(name, function (err) {
      if (!err) {
        if (tries-- > 0) return _getUniqueName();

        return cb(new Error('Could not get a unique tmp filename, max tries reached ' + name));
      }

      cb(null, name);
    });
  }());
}

/**
 * Synchronous version of _getTmpName.
 *
 * @param {Object} options
 * @returns {String}
 * @api private
 */
function _getTmpNameSync(options) {
  var
    args = _parseArguments(options),
    opts = args[0],
    tries = opts.tries || DEFAULT_TRIES;

  if (isNaN(tries) || tries < 0)
    throw new Error('Invalid tries');

  if (opts.template && !opts.template.match(TEMPLATE_PATTERN))
    throw new Error('Invalid template provided');

  do {
    var name = _generateTmpName(opts);
    try {
      fs.statSync(name);
    } catch (e) {
      return name;
    }
  } while (tries-- > 0);

  throw new Error('Could not get a unique tmp filename, max tries reached');
}

/**
 * Creates and opens a temporary file.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
function _createTmpFile(options, callback) {
  var
    args = _parseArguments(options, callback),
    opts = args[0],
    cb = args[1];

  opts.postfix = (_isUndefined(opts.postfix)) ? '.tmp' : opts.postfix;

  // gets a temporary filename
  _getTmpName(opts, function _tmpNameCreated(err, name) {
    if (err) return cb(err);

    // create and open the file
    fs.open(name, CREATE_FLAGS, opts.mode || FILE_MODE, function _fileCreated(err, fd) {
      if (err) return cb(err);

      if (opts.discardDescriptor) {
        return fs.close(fd, function _discardCallback(err) {
          if (err) {
            // Low probability, and the file exists, so this could be
            // ignored.  If it isn't we certainly need to unlink the
            // file, and if that fails too its error is more
            // important.
            try {
              fs.unlinkSync(name);
            } catch (e) {
              err = e;
            }
            return cb(err);
          }
          cb(null, name, undefined, _prepareTmpFileRemoveCallback(name, -1, opts));
        });
      }
      if (opts.detachDescriptor) {
        return cb(null, name, fd, _prepareTmpFileRemoveCallback(name, -1, opts));
      }
      cb(null, name, fd, _prepareTmpFileRemoveCallback(name, fd, opts));
    });
  });
}

/**
 * Synchronous version of _createTmpFile.
 *
 * @param {Object} options
 * @returns {Object} object consists of name, fd and removeCallback
 * @api private
 */
function _createTmpFileSync(options) {
  var
    args = _parseArguments(options),
    opts = args[0];

  opts.postfix = opts.postfix || '.tmp';

  var name = _getTmpNameSync(opts);
  var fd = fs.openSync(name, CREATE_FLAGS, opts.mode || FILE_MODE);

  return {
    name : name,
    fd : fd,
    removeCallback : _prepareTmpFileRemoveCallback(name, fd, opts)
  };
}

/**
 * Removes files and folders in a directory recursively.
 *
 * @param {String} root
 * @api private
 */
function _rmdirRecursiveSync(root) {
  var dirs = [root];

  do {
    var
      dir = dirs.pop(),
      deferred = false,
      files = fs.readdirSync(dir);

    for (var i = 0, length = files.length; i < length; i++) {
      var
        file = path.join(dir, files[i]),
        stat = fs.lstatSync(file); // lstat so we don't recurse into symlinked directories

      if (stat.isDirectory()) {
        if (!deferred) {
          deferred = true;
          dirs.push(dir);
        }
        dirs.push(file);
      } else {
        fs.unlinkSync(file);
      }
    }

    if (!deferred) {
      fs.rmdirSync(dir);
    }
  } while (dirs.length !== 0);
}

/**
 * Creates a temporary directory.
 *
 * @param {Object} options
 * @param {Function} callback
 * @api public
 */
function _createTmpDir(options, callback) {
  var
    args = _parseArguments(options, callback),
    opts = args[0],
    cb = args[1];

  // gets a temporary filename
  _getTmpName(opts, function _tmpNameCreated(err, name) {
    if (err) return cb(err);

    // create the directory
    fs.mkdir(name, opts.mode || DIR_MODE, function _dirCreated(err) {
      if (err) return cb(err);

      cb(null, name, _prepareTmpDirRemoveCallback(name, opts));
    });
  });
}

/**
 * Synchronous version of _createTmpDir.
 *
 * @param {Object} options
 * @returns {Object} object consists of name and removeCallback
 * @api private
 */
function _createTmpDirSync(options) {
  var
    args = _parseArguments(options),
    opts = args[0];

  var name = _getTmpNameSync(opts);
  fs.mkdirSync(name, opts.mode || DIR_MODE);

  return {
    name : name,
    removeCallback : _prepareTmpDirRemoveCallback(name, opts)
  };
}

/**
 * Prepares the callback for removal of the temporary file.
 *
 * @param {String} name
 * @param {int} fd
 * @param {Object} opts
 * @api private
 * @returns {Function} the callback
 */
function _prepareTmpFileRemoveCallback(name, fd, opts) {
  var removeCallback = _prepareRemoveCallback(function _removeCallback(fdPath) {
    try {
      if (0 <= fdPath[0]) {
        fs.closeSync(fdPath[0]);
      }
    }
    catch (e) {
      // under some node/windows related circumstances, a temporary file
      // may have not be created as expected or the file was already closed
      // by the user, in which case we will simply ignore the error
      if (e.errno != -EBADF && e.errno != -ENOENT) {
        // reraise any unanticipated error
        throw e;
      }
    }
    fs.unlinkSync(fdPath[1]);
  }, [fd, name]);

  if (!opts.keep) {
    _removeObjects.unshift(removeCallback);
  }

  return removeCallback;
}

/**
 * Prepares the callback for removal of the temporary directory.
 *
 * @param {String} name
 * @param {Object} opts
 * @returns {Function} the callback
 * @api private
 */
function _prepareTmpDirRemoveCallback(name, opts) {
  var removeFunction = opts.unsafeCleanup ? _rmdirRecursiveSync : fs.rmdirSync.bind(fs);
  var removeCallback = _prepareRemoveCallback(removeFunction, name);

  if (!opts.keep) {
    _removeObjects.unshift(removeCallback);
  }

  return removeCallback;
}

/**
 * Creates a guarded function wrapping the removeFunction call.
 *
 * @param {Function} removeFunction
 * @param {Object} arg
 * @returns {Function}
 * @api private
 */
function _prepareRemoveCallback(removeFunction, arg) {
  var called = false;

  return function _cleanupCallback(next) {
    if (!called) {
        var index = _removeObjects.indexOf(_cleanupCallback);
        if (index >= 0) {
          _removeObjects.splice(index, 1);
        }

        called = true;
        removeFunction(arg);
    }
    if (next) next(null);
  };
}

/**
 * The garbage collector.
 *
 * @api private
 */
function _garbageCollector() {
  if (_uncaughtException && !_gracefulCleanup) {
    return;
  }

  // the function being called removes itself from _removeObjects,
  // loop until _removeObjects is empty
  while (_removeObjects.length) {
    try {
      _removeObjects[0].call(null);
    } catch (e) {
      // already removed?
    }
  }
}

function _setGracefulCleanup() {
  _gracefulCleanup = true;
}

var version = process.versions.node.split('.').map(function (value) {
  return parseInt(value, 10);
});

if (version[0] === 0 && (version[1] < 9 || version[1] === 9 && version[2] < 5)) {
  process.addListener('uncaughtException', function _uncaughtExceptionThrown(err) {
    _uncaughtException = true;
    _garbageCollector();

    throw err;
  });
}

process.addListener('exit', function _exit(code) {
  if (code) _uncaughtException = true;
  _garbageCollector();
});

// exporting all the needed methods
module.exports.tmpdir = _TMP;
module.exports.dir = _createTmpDir;
module.exports.dirSync = _createTmpDirSync;
module.exports.file = _createTmpFile;
module.exports.fileSync = _createTmpFileSync;
module.exports.tmpName = _getTmpName;
module.exports.tmpNameSync = _getTmpNameSync;
module.exports.setGracefulCleanup = _setGracefulCleanup;


/***/ }),
/* 221 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = which
which.sync = whichSync

var isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys'

var path = __webpack_require__(0)
var COLON = isWindows ? ';' : ':'
var isexe = __webpack_require__(198)

function getNotFoundError (cmd) {
  var er = new Error('not found: ' + cmd)
  er.code = 'ENOENT'

  return er
}

function getPathInfo (cmd, opt) {
  var colon = opt.colon || COLON
  var pathEnv = opt.path || process.env.PATH || ''
  var pathExt = ['']

  pathEnv = pathEnv.split(colon)

  var pathExtExe = ''
  if (isWindows) {
    pathEnv.unshift(process.cwd())
    pathExtExe = (opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM')
    pathExt = pathExtExe.split(colon)


    // Always test the cmd itself first.  isexe will check to make sure
    // it's found in the pathExt set.
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('')
  }

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  if (cmd.match(/\//) || isWindows && cmd.match(/\\/))
    pathEnv = ['']

  return {
    env: pathEnv,
    ext: pathExt,
    extExe: pathExtExe
  }
}

function which (cmd, opt, cb) {
  if (typeof opt === 'function') {
    cb = opt
    opt = {}
  }

  var info = getPathInfo(cmd, opt)
  var pathEnv = info.env
  var pathExt = info.ext
  var pathExtExe = info.extExe
  var found = []

  ;(function F (i, l) {
    if (i === l) {
      if (opt.all && found.length)
        return cb(null, found)
      else
        return cb(getNotFoundError(cmd))
    }

    var pathPart = pathEnv[i]
    if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
      pathPart = pathPart.slice(1, -1)

    var p = path.join(pathPart, cmd)
    if (!pathPart && (/^\.[\\\/]/).test(cmd)) {
      p = cmd.slice(0, 2) + p
    }
    ;(function E (ii, ll) {
      if (ii === ll) return F(i + 1, l)
      var ext = pathExt[ii]
      isexe(p + ext, { pathExt: pathExtExe }, function (er, is) {
        if (!er && is) {
          if (opt.all)
            found.push(p + ext)
          else
            return cb(null, p + ext)
        }
        return E(ii + 1, ll)
      })
    })(0, pathExt.length)
  })(0, pathEnv.length)
}

function whichSync (cmd, opt) {
  opt = opt || {}

  var info = getPathInfo(cmd, opt)
  var pathEnv = info.env
  var pathExt = info.ext
  var pathExtExe = info.extExe
  var found = []

  for (var i = 0, l = pathEnv.length; i < l; i ++) {
    var pathPart = pathEnv[i]
    if (pathPart.charAt(0) === '"' && pathPart.slice(-1) === '"')
      pathPart = pathPart.slice(1, -1)

    var p = path.join(pathPart, cmd)
    if (!pathPart && /^\.[\\\/]/.test(cmd)) {
      p = cmd.slice(0, 2) + p
    }
    for (var j = 0, ll = pathExt.length; j < ll; j ++) {
      var cur = p + pathExt[j]
      var is
      try {
        is = isexe.sync(cur, { pathExt: pathExtExe })
        if (is) {
          if (opt.all)
            found.push(cur)
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
}


/***/ }),
/* 222 */
/***/ (function(module, exports) {

module.exports = function(module) {
	if(!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if(!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),
/* 223 */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),
/* 224 */
/***/ (function(module, exports) {

module.exports = require("constants");

/***/ }),
/* 225 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 226 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 227 */
/***/ (function(module, exports) {

module.exports = require("tty");

/***/ })
/******/ ]);
});
//# sourceMappingURL=fsmetadata.js.map