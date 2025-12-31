#!/usr/bin/env node
'use strict';

var require$$0 = require('path');
var util = require('util');
var EventEmitter = require('events');
var net = require('net');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var optimist$1 = {exports: {}};

var minimist;
var hasRequiredMinimist;

function requireMinimist () {
	if (hasRequiredMinimist) return minimist;
	hasRequiredMinimist = 1;
	minimist = function (args, opts) {
	    if (!opts) opts = {};
	    
	    var flags = { bools : {}, strings : {} };
	    
	    [].concat(opts['boolean']).filter(Boolean).forEach(function (key) {
	        flags.bools[key] = true;
	    });
	    
	    var aliases = {};
	    Object.keys(opts.alias || {}).forEach(function (key) {
	        aliases[key] = [].concat(opts.alias[key]);
	        aliases[key].forEach(function (x) {
	            aliases[x] = [key].concat(aliases[key].filter(function (y) {
	                return x !== y;
	            }));
	        });
	    });

	    [].concat(opts.string).filter(Boolean).forEach(function (key) {
	        flags.strings[key] = true;
	        if (aliases[key]) {
	            flags.strings[aliases[key]] = true;
	        }
	     });

	    var defaults = opts['default'] || {};
	    
	    var argv = { _ : [] };
	    Object.keys(flags.bools).forEach(function (key) {
	        setArg(key, defaults[key] === undefined ? false : defaults[key]);
	    });
	    
	    var notFlags = [];

	    if (args.indexOf('--') !== -1) {
	        notFlags = args.slice(args.indexOf('--')+1);
	        args = args.slice(0, args.indexOf('--'));
	    }

	    function setArg (key, val) {
	        var value = !flags.strings[key] && isNumber(val)
	            ? Number(val) : val
	        ;
	        setKey(argv, key.split('.'), value);
	        
	        (aliases[key] || []).forEach(function (x) {
	            setKey(argv, x.split('.'), value);
	        });
	    }
	    
	    for (var i = 0; i < args.length; i++) {
	        var arg = args[i];
	        
	        if (/^--.+=/.test(arg)) {
	            // Using [\s\S] instead of . because js doesn't support the
	            // 'dotall' regex modifier. See:
	            // http://stackoverflow.com/a/1068308/13216
	            var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
	            setArg(m[1], m[2]);
	        }
	        else if (/^--no-.+/.test(arg)) {
	            var key = arg.match(/^--no-(.+)/)[1];
	            setArg(key, false);
	        }
	        else if (/^--.+/.test(arg)) {
	            var key = arg.match(/^--(.+)/)[1];
	            var next = args[i + 1];
	            if (next !== undefined && !/^-/.test(next)
	            && !flags.bools[key]
	            && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
	                setArg(key, next);
	                i++;
	            }
	            else if (/^(true|false)$/.test(next)) {
	                setArg(key, next === 'true');
	                i++;
	            }
	            else {
	                setArg(key, flags.strings[key] ? '' : true);
	            }
	        }
	        else if (/^-[^-]+/.test(arg)) {
	            var letters = arg.slice(1,-1).split('');
	            
	            var broken = false;
	            for (var j = 0; j < letters.length; j++) {
	                var next = arg.slice(j+2);
	                
	                if (next === '-') {
	                    setArg(letters[j], next);
	                    continue;
	                }
	                
	                if (/[A-Za-z]/.test(letters[j])
	                && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
	                    setArg(letters[j], next);
	                    broken = true;
	                    break;
	                }
	                
	                if (letters[j+1] && letters[j+1].match(/\W/)) {
	                    setArg(letters[j], arg.slice(j+2));
	                    broken = true;
	                    break;
	                }
	                else {
	                    setArg(letters[j], flags.strings[letters[j]] ? '' : true);
	                }
	            }
	            
	            var key = arg.slice(-1)[0];
	            if (!broken && key !== '-') {
	                if (args[i+1] && !/^(-|--)[^-]/.test(args[i+1])
	                && !flags.bools[key]
	                && (aliases[key] ? !flags.bools[aliases[key]] : true)) {
	                    setArg(key, args[i+1]);
	                    i++;
	                }
	                else if (args[i+1] && /true|false/.test(args[i+1])) {
	                    setArg(key, args[i+1] === 'true');
	                    i++;
	                }
	                else {
	                    setArg(key, flags.strings[key] ? '' : true);
	                }
	            }
	        }
	        else {
	            argv._.push(
	                flags.strings['_'] || !isNumber(arg) ? arg : Number(arg)
	            );
	        }
	    }
	    
	    Object.keys(defaults).forEach(function (key) {
	        if (!hasKey(argv, key.split('.'))) {
	            setKey(argv, key.split('.'), defaults[key]);
	            
	            (aliases[key] || []).forEach(function (x) {
	                setKey(argv, x.split('.'), defaults[key]);
	            });
	        }
	    });
	    
	    notFlags.forEach(function(key) {
	        argv._.push(key);
	    });

	    return argv;
	};

	function hasKey (obj, keys) {
	    var o = obj;
	    keys.slice(0,-1).forEach(function (key) {
	        o = (o[key] || {});
	    });

	    var key = keys[keys.length - 1];
	    return key in o;
	}

	function setKey (obj, keys, value) {
	    var o = obj;
	    keys.slice(0,-1).forEach(function (key) {
	        if (o[key] === undefined) o[key] = {};
	        o = o[key];
	    });
	    
	    var key = keys[keys.length - 1];
	    if (o[key] === undefined || typeof o[key] === 'boolean') {
	        o[key] = value;
	    }
	    else if (Array.isArray(o[key])) {
	        o[key].push(value);
	    }
	    else {
	        o[key] = [ o[key], value ];
	    }
	}

	function isNumber (x) {
	    if (typeof x === 'number') return true;
	    if (/^0x[0-9a-f]+$/i.test(x)) return true;
	    return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
	}
	return minimist;
}

var wordwrap = {exports: {}};

var hasRequiredWordwrap;

function requireWordwrap () {
	if (hasRequiredWordwrap) return wordwrap.exports;
	hasRequiredWordwrap = 1;
	var wordwrap$1 = wordwrap.exports = function (start, stop, params) {
	    if (typeof start === 'object') {
	        params = start;
	        start = params.start;
	        stop = params.stop;
	    }
	    
	    if (typeof stop === 'object') {
	        params = stop;
	        start = start || params.start;
	        stop = undefined;
	    }
	    
	    if (!stop) {
	        stop = start;
	        start = 0;
	    }
	    
	    if (!params) params = {};
	    var mode = params.mode || 'soft';
	    var re = mode === 'hard' ? /\b/ : /(\S+\s+)/;
	    
	    return function (text) {
	        var chunks = text.toString()
	            .split(re)
	            .reduce(function (acc, x) {
	                if (mode === 'hard') {
	                    for (var i = 0; i < x.length; i += stop - start) {
	                        acc.push(x.slice(i, i + stop - start));
	                    }
	                }
	                else acc.push(x);
	                return acc;
	            }, [])
	        ;
	        
	        return chunks.reduce(function (lines, rawChunk) {
	            if (rawChunk === '') return lines;
	            
	            var chunk = rawChunk.replace(/\t/g, '    ');
	            
	            var i = lines.length - 1;
	            if (lines[i].length + chunk.length > stop) {
	                lines[i] = lines[i].replace(/\s+$/, '');
	                
	                chunk.split(/\n/).forEach(function (c) {
	                    lines.push(
	                        new Array(start + 1).join(' ')
	                        + c.replace(/^\s+/, '')
	                    );
	                });
	            }
	            else if (chunk.match(/\n/)) {
	                var xs = chunk.split(/\n/);
	                lines[i] += xs.shift();
	                xs.forEach(function (c) {
	                    lines.push(
	                        new Array(start + 1).join(' ')
	                        + c.replace(/^\s+/, '')
	                    );
	                });
	            }
	            else {
	                lines[i] += chunk;
	            }
	            
	            return lines;
	        }, [ new Array(start + 1).join(' ') ]).join('\n');
	    };
	};

	wordwrap$1.soft = wordwrap$1;

	wordwrap$1.hard = function (start, stop) {
	    return wordwrap$1(start, stop, { mode : 'hard' });
	};
	return wordwrap.exports;
}

var hasRequiredOptimist;

function requireOptimist () {
	if (hasRequiredOptimist) return optimist$1.exports;
	hasRequiredOptimist = 1;
	var path = require$$0;
	var minimist = requireMinimist();
	var wordwrap = requireWordwrap();

	/*  Hack an instance of Argv with process.argv into Argv
	    so people can do
	        require('optimist')(['--beeble=1','-z','zizzle']).argv
	    to parse a list of args and
	        require('optimist').argv
	    to get a parsed version of process.argv.
	*/

	var inst = Argv(process.argv.slice(2));
	Object.keys(inst).forEach(function (key) {
	    Argv[key] = typeof inst[key] == 'function'
	        ? inst[key].bind(inst)
	        : inst[key];
	});

	var exports$1 = optimist$1.exports = Argv;
	function Argv (processArgs, cwd) {
	    var self = {};
	    if (!cwd) cwd = process.cwd();
	    
	    self.$0 = process.argv
	        .slice(0,2)
	        .map(function (x) {
	            var b = rebase(cwd, x);
	            return x.match(/^\//) && b.length < x.length
	                ? b : x
	        })
	        .join(' ')
	    ;
	    
	    if (process.env._ != undefined && process.argv[1] == process.env._) {
	        self.$0 = process.env._.replace(
	            path.dirname(process.execPath) + '/', ''
	        );
	    }
	    
	    var options = {
	        boolean: [],
	        string: [],
	        alias: {},
	        default: []
	    };
	    
	    self.boolean = function (bools) {
	        options.boolean.push.apply(options.boolean, [].concat(bools));
	        return self;
	    };
	    
	    self.string = function (strings) {
	        options.string.push.apply(options.string, [].concat(strings));
	        return self;
	    };
	    
	    self.default = function (key, value) {
	        if (typeof key === 'object') {
	            Object.keys(key).forEach(function (k) {
	                self.default(k, key[k]);
	            });
	        }
	        else {
	            options.default[key] = value;
	        }
	        return self;
	    };
	    
	    self.alias = function (x, y) {
	        if (typeof x === 'object') {
	            Object.keys(x).forEach(function (key) {
	                self.alias(key, x[key]);
	            });
	        }
	        else {
	            options.alias[x] = (options.alias[x] || []).concat(y);
	        }
	        return self;
	    };
	    
	    var demanded = {};
	    self.demand = function (keys) {
	        if (typeof keys == 'number') {
	            if (!demanded._) demanded._ = 0;
	            demanded._ += keys;
	        }
	        else if (Array.isArray(keys)) {
	            keys.forEach(function (key) {
	                self.demand(key);
	            });
	        }
	        else {
	            demanded[keys] = true;
	        }
	        
	        return self;
	    };
	    
	    var usage;
	    self.usage = function (msg, opts) {
	        if (!opts && typeof msg === 'object') {
	            opts = msg;
	            msg = null;
	        }
	        
	        usage = msg;
	        
	        if (opts) self.options(opts);
	        
	        return self;
	    };
	    
	    function fail (msg) {
	        self.showHelp();
	        if (msg) console.error(msg);
	        process.exit(1);
	    }
	    
	    var checks = [];
	    self.check = function (f) {
	        checks.push(f);
	        return self;
	    };
	    
	    var descriptions = {};
	    self.describe = function (key, desc) {
	        if (typeof key === 'object') {
	            Object.keys(key).forEach(function (k) {
	                self.describe(k, key[k]);
	            });
	        }
	        else {
	            descriptions[key] = desc;
	        }
	        return self;
	    };
	    
	    self.parse = function (args) {
	        return parseArgs(args);
	    };
	    
	    self.option = self.options = function (key, opt) {
	        if (typeof key === 'object') {
	            Object.keys(key).forEach(function (k) {
	                self.options(k, key[k]);
	            });
	        }
	        else {
	            if (opt.alias) self.alias(key, opt.alias);
	            if (opt.demand) self.demand(key);
	            if (typeof opt.default !== 'undefined') {
	                self.default(key, opt.default);
	            }
	            
	            if (opt.boolean || opt.type === 'boolean') {
	                self.boolean(key);
	            }
	            if (opt.string || opt.type === 'string') {
	                self.string(key);
	            }
	            
	            var desc = opt.describe || opt.description || opt.desc;
	            if (desc) {
	                self.describe(key, desc);
	            }
	        }
	        
	        return self;
	    };
	    
	    var wrap = null;
	    self.wrap = function (cols) {
	        wrap = cols;
	        return self;
	    };
	    
	    self.showHelp = function (fn) {
	        if (!fn) fn = console.error;
	        fn(self.help());
	    };
	    
	    self.help = function () {
	        var keys = Object.keys(
	            Object.keys(descriptions)
	            .concat(Object.keys(demanded))
	            .concat(Object.keys(options.default))
	            .reduce(function (acc, key) {
	                if (key !== '_') acc[key] = true;
	                return acc;
	            }, {})
	        );
	        
	        var help = keys.length ? [ 'Options:' ] : [];
	        
	        if (usage) {
	            help.unshift(usage.replace(/\$0/g, self.$0), '');
	        }
	        
	        var switches = keys.reduce(function (acc, key) {
	            acc[key] = [ key ].concat(options.alias[key] || [])
	                .map(function (sw) {
	                    return (sw.length > 1 ? '--' : '-') + sw
	                })
	                .join(', ')
	            ;
	            return acc;
	        }, {});
	        
	        var switchlen = longest(Object.keys(switches).map(function (s) {
	            return switches[s] || '';
	        }));
	        
	        var desclen = longest(Object.keys(descriptions).map(function (d) { 
	            return descriptions[d] || '';
	        }));
	        
	        keys.forEach(function (key) {
	            var kswitch = switches[key];
	            var desc = descriptions[key] || '';
	            
	            if (wrap) {
	                desc = wordwrap(switchlen + 4, wrap)(desc)
	                    .slice(switchlen + 4)
	                ;
	            }
	            
	            var spadding = new Array(
	                Math.max(switchlen - kswitch.length + 3, 0)
	            ).join(' ');
	            
	            var dpadding = new Array(
	                Math.max(desclen - desc.length + 1, 0)
	            ).join(' ');
	            
	            var type = null;
	            
	            if (options.boolean[key]) type = '[boolean]';
	            if (options.string[key]) type = '[string]';
	            
	            if (!wrap && dpadding.length > 0) {
	                desc += dpadding;
	            }
	            
	            var prelude = '  ' + kswitch + spadding;
	            var extra = [
	                type,
	                demanded[key]
	                    ? '[required]'
	                    : null
	                ,
	                options.default[key] !== undefined
	                    ? '[default: ' + JSON.stringify(options.default[key]) + ']'
	                    : null
	                ,
	            ].filter(Boolean).join('  ');
	            
	            var body = [ desc, extra ].filter(Boolean).join('  ');
	            
	            if (wrap) {
	                var dlines = desc.split('\n');
	                var dlen = dlines.slice(-1)[0].length
	                    + (dlines.length === 1 ? prelude.length : 0);
	                
	                body = desc + (dlen + extra.length > wrap - 2
	                    ? '\n'
	                        + new Array(wrap - extra.length + 1).join(' ')
	                        + extra
	                    : new Array(wrap - extra.length - dlen + 1).join(' ')
	                        + extra
	                );
	            }
	            
	            help.push(prelude + body);
	        });
	        
	        help.push('');
	        return help.join('\n');
	    };
	    
	    Object.defineProperty(self, 'argv', {
	        get : function () { return parseArgs(processArgs) },
	        enumerable : true,
	    });
	    
	    function parseArgs (args) {
	        var argv = minimist(args, options);
	        argv.$0 = self.$0;
	        
	        if (demanded._ && argv._.length < demanded._) {
	            fail('Not enough non-option arguments: got '
	                + argv._.length + ', need at least ' + demanded._
	            );
	        }
	        
	        var missing = [];
	        Object.keys(demanded).forEach(function (key) {
	            if (!argv[key]) missing.push(key);
	        });
	        
	        if (missing.length) {
	            fail('Missing required arguments: ' + missing.join(', '));
	        }
	        
	        checks.forEach(function (f) {
	            try {
	                if (f(argv) === false) {
	                    fail('Argument check failed: ' + f.toString());
	                }
	            }
	            catch (err) {
	                fail(err);
	            }
	        });
	        
	        return argv;
	    }
	    
	    function longest (xs) {
	        return Math.max.apply(
	            null,
	            xs.map(function (x) { return x.length })
	        );
	    }
	    
	    return self;
	}
	// rebase an absolute path to a relative one with respect to a base directory
	// exported for tests
	exports$1.rebase = rebase;
	function rebase (base, dir) {
	    var ds = path.normalize(dir).split('/').slice(1);
	    var bs = path.normalize(base).split('/').slice(1);
	    
	    for (var i = 0; ds[i] && ds[i] == bs[i]; i++);
	    ds.splice(0, i); bs.splice(0, i);
	    
	    var p = path.normalize(
	        bs.map(function () { return '..' }).concat(ds).join('/')
	    ).replace(/\/$/,'').replace(/^$/, '.');
	    return p.match(/^[.\/]/) ? p : './' + p;
	}	return optimist$1.exports;
}

var optimistExports = requireOptimist();
var optimist = /*@__PURE__*/getDefaultExportFromCjs(optimistExports);

const d$2 = util.debug("@app/options");
function getUsage(cmd) {
  return `${cmd} [--retry_interval <number>] [--retry_times <number>] <[source_addr:]source_port> <target_url>`;
}
async function getOptions() {
  const argv = optimist.argv;
  const [source = "", target = ""] = argv._.map((x) => "" + x);
  if (source === "") {
    throw new ArgumentsError("The source endpoint is not specified.");
  }
  const i = source.indexOf(":");
  const [source_addr, source_port] = i >= 0 ? [source.slice(0, i), parseInt(source.slice(i + 1), 10)] : ["", parseInt(source, 10)];
  if (isNaN(source_port)) {
    throw new ArgumentsError("Invalid source endpoint: " + source);
  }
  if (target === "") {
    throw new ArgumentsError("The target websocket url is not specified.");
  }
  const target_url = /^(wss?|https?):\/\//.test(target) ? target : `ws://${target}`;
  const { retry_interval, retry_times } = argv;
  const result = {
    source_addr,
    source_port,
    target_url,
    retry_interval: typeof retry_interval === "number" ? retry_interval : 5,
    retry_times: typeof retry_times === "number" ? retry_times : 5
  };
  d$2("resolved options: %o", result);
  return result;
}
class ArgumentsError extends Error {
}

async function delay(ms, abort) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(), ms);
    abort?.addEventListener("abort", () => {
      clearTimeout(timer);
      const { reason } = abort;
      reason instanceof Error ? reject(reason) : resolve();
    });
  });
}
async function timeout(promise, ms) {
  const ctrl = new AbortController();
  return Promise.race([
    promise.then((res) => {
      ctrl.abort();
      return res;
    }),
    delay(ms, ctrl.signal).then(() => {
      throw new TimeoutError(ms);
    })
  ]);
}
class TimeoutError extends Error {
  constructor(ms) {
    super(`Timeout elapsed: ${ms}ms`);
  }
}

const d$1 = util.debug("@app/client");
class Client {
  constructor(socket, desc) {
    this.socket = socket;
    this.desc = desc;
  }
  async forward(url, retry_interval, retry_times) {
    let ws;
    while (true) {
      try {
        ws = await connect(url, 2e3);
        break;
      } catch (err) {
        if (--retry_times > 0) {
          d$1(
            "[%s] connecting failed: %s, retrying in %d seconds",
            url,
            err.message ?? err,
            retry_interval
          );
          await delay(retry_interval * 1e3);
          continue;
        }
        throw new Error("Failed to connect: " + url + ` (${err.message ?? err})`);
      }
    }
    const { socket } = this;
    socket.on("close", (err) => {
      d$1("[%s] closed: %s", this.desc, err ? socket.errored?.message : "-");
      ws.close();
    });
    socket.on("data", (data) => {
      d$1("[%s] => [%s]: %d bytes", this.desc, url, data.length);
      ws.send(data);
    });
    socket.on("error", (err) => {
      console.error(err);
      socket.destroy();
    });
    ws.addEventListener("close", (e) => {
      d$1("[%s] closed: %s", url, e.reason ?? "-");
      socket.destroy();
    });
    ws.addEventListener("message", async (e) => {
      const { data } = e;
      const buffer = isBlob(data) ? await data.arrayBuffer() : data;
      d$1("[%s] <= [%s]: %d bytes", this.desc, url, buffer.byteLength);
      socket.write(Buffer.from(buffer));
    });
    ws.addEventListener("error", (e) => {
      console.error(e.error);
      ws.close();
    });
    return this;
  }
  close(err) {
    this.socket.destroy(err);
  }
}
async function connect(url, timeoutMs) {
  return timeout(
    new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener("open", () => resolve(ws));
      ws.addEventListener("error", (e) => reject(e.error));
    }),
    timeoutMs
  );
}
function isBlob(x) {
  return x != null && typeof x.stream === "function";
}

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
const d = util.debug("@app/server");
class Server extends EventEmitter {
  constructor(port, addr) {
    super({
      captureRejections: true
    });
    this.port = port;
    __publicField(this, "desc");
    __publicField(this, "addr");
    __publicField(this, "server");
    addr = addr || "0.0.0.0";
    this.addr = addr;
    this.desc = `tcp://${addr}:${port}`;
  }
  async start() {
    const server = net.createServer((socket) => {
      const desc = `${socket.remoteAddress}:${socket.remotePort}`;
      d("[%s] connected.", desc);
      socket.on("close", () => {
        d("[%s] disconnected.", desc);
      });
      const client = new Client(socket, desc);
      this.emit("connect", client);
    });
    await new Promise((resolve, reject) => {
      const { addr, port } = this;
      server.once("error", (err) => {
        reject(err);
      });
      server.listen(port, addr, () => {
        d("[%s] listening...", this.desc);
        resolve();
      });
    });
    this.server = server;
    return this;
  }
  async stop() {
    const { desc, server } = this;
    if (server != null) {
      const close = util.promisify(server.close).bind(server);
      await close();
      d("[%s] stopping...", desc);
    }
  }
}

async function main() {
  const options = await getOptions().catch((err) => {
    console.error(
      "Error:",
      err.message,
      "\n\nUsage:",
      getUsage(
        // replacing in compile time
        "de-websockify.js"
      ),
      "\n"
    );
    process.exit(1);
  });
  const {
    source_addr: addr,
    source_port: port,
    target_url: url,
    retry_interval,
    retry_times
  } = options;
  const server = new Server(port, addr);
  server.on("connect", (client) => {
    client.forward(url, retry_interval, retry_times).catch((err) => {
      console.error("Error:", err.message ?? err);
      client.close();
    });
  });
  server.start().catch((err) => {
    console.error("Error:", err.message ?? err);
    process.exit(1);
  });
  let stopping = false;
  process.on("SIGINT", () => {
    if (stopping) {
      process.exit(1);
    }
    stopping = true;
    server.stop();
  });
}
main();
