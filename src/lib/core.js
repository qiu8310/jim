/**
 *
 *
 */
var _ = require('lodash'),
  os = require('os'),
  C = require('../config'),
  H = require('./Helper'),
  ArgumentsError = require('./ArgumentsError'),
  format = H.format;


var JIM = {},
  Types = {},
  Processes = {};



function JIMGenerate(fn, args, context) {
  this.attrs = {};

  if (!_.isUndefined(args)) { args = []; }

  this.gen = function() {
    var result = fn.apply(context, [].concat(args));

    var self = this;
    _.each(_.keys(Processes), function(processKey) {
      if (self.attrs[processKey]) {
        var rtn = Processes[processKey].apply(context, [result].concat(self.attrs[processKey]));
        if (!_.isUndefined(rtn)) {
          result = rtn;
        }
      }
    });

    return result;
  };

}


JIMGenerate.prototype = {
  result: function() {
    var self = this;

    if (this.attrs.repeat) {
      var args = this.attrs.repeat, count;
      count = args.length === 1 ? args[0] :
        _.random(H.makeSureIsInt(args[0], C.defaultRepeatMin), H.makeSureIsInt(args[1], C.defaultRepeatMax));
      return _.times(count, function() {
        return self.gen();
      })
    } else {
      return this.gen();
    }
  },

  applyProcess: function(key, args) {
    if (key in this) {
      this[key].apply(this, args);
    } else {
      throw new Error(format('ERROR: Process `%s` is not exists, can not be executed', key));
    }
  },

  // 生成数组
  repeat: function(min, max) {
    this.attrs.repeat = [].slice.call(arguments, 0, 2);
    return this;
  }
};


function createType(name, aliases, genFn, genSysOpts) {
  if (_.isFunction(aliases)) {
    genSysOpts = genFn;
    genFn = aliases;
    aliases = [];
  }

  if (_.isString(name) && _.isFunction(genFn)) {

    var register = function(name, aliasFor) {
      if (name in Types) { console.warn(format('WARN: JIM type `%s` exists', name)); }
      if (!aliasFor) {
        Types[name] = function(genUserOpts) {
          return new JIMGenerate(genFn, genUserOpts, genSysOpts);
        };
      } else {
        Types[name] = Types[aliasFor];
      }
    };

    register(name);

    _.each([].concat(aliases), function (alias) {
      register(alias, name);
    });

  } else {
    throw new ArgumentsError;
  }
}

function isTypeExists(type){ return (type in Types); }

function call(type, opts, processes) {
  if (isTypeExists(type)) {
    var generator = Types[type](opts);
    _.each(processes, function(processArgs, processKey) {
      if (processArgs) {
        processArgs = processArgs === true ? [] : [].concat(processArgs);
        generator.applyProcess(processKey, processArgs);
      }
    });
    return generator.result();
  } else {
    throw new Error(format('ERROR: Type `%s` is not exist, can not be called', type));
  }
}

function createProcess(key, fn) {
  var exists = _.keys(Processes).concat('result', 'repeat');
  if (_.include(exists, key)) {
    console.warn(format('WARN: process `%s` exists', key));
  }

  Processes[key] = fn;
  JIMGenerate.prototype[key] = function() {
    this.attrs[key] = [].slice.call(arguments);
    return this;
  };
}

function config(key, val) {
  if (_.isString(key)) {
    var ref = C,
      keys = key.split('.');
    key = keys.pop();
    _.each(keys, function(k) {
      if (ref && (k in ref)) {
        ref = ref[k];
      } else {
        ref = null;
      }
    });


    if (ref && (key in ref)) {
      if (!_.isUndefined(val)) {
        ref[key] = val;
        return val;
      } else {
        return ref[key];
      }
    }
    return null;

  } else if (_.isObject(key)) {
    _.each(key, function(v, k) {
      config(k, v);
    });
  }
}



// 格式化配置
function _structCfgFormat(cfg) {
  _.each(cfg, function(val, key) {
    if (_.isString(val)) {
      cfg[key] = {
        type: false,
        value: val
      };
    } else if (_.isArray(val)) {
      cfg[key] = {
        type: false,
        values: val
      };
    }
  });
}

// 主要检查带  @Self.someKey 的字符串
function _getSelfDepends(str) {
  var result = [], reg = /@Self\.\w+/g;
  if (_.isString(str)) {
    _.each(str.match(reg), function(matcher) {
      result.push(matcher.replace('@Self.', ''));
    });
  }
  return result;
}

// 找出配置中的依赖
function _structCfgDepends(cfg) {
  var dependExist = function(key) { return (key in cfg)};

  _.each(cfg, function(obj, key) {
    var depends = [],
      checkList = [];

    if (obj.type) {
      if (obj.options) {    // 检查 options 中是否有依赖
        checkList = checkList.concat(_.values(obj.options));
      }
    } else {
      if (_.isArray(obj.values)) {     // 检查 values 中是否有依赖
        checkList = checkList.concat(obj.values);
      } else if (obj.value) { // 检查 value 中是否有依赖
        checkList.push(obj.value);
      }
    }

    _.each(checkList, function(checkStr) {
      depends = depends.concat(_getSelfDepends(checkStr));
    });

    depends = _.filter(depends, dependExist);
    obj.depends = depends.length > 0 ? depends : false;
  });
}

// 深度遍历检查是否有循环依赖
function _structCfgDependsResolve(cfg) {
  var checkObj = {};

  _.each(cfg, function(obj, key) {
    checkObj[key] = obj.depends || [];
  });

  var resolve = function(dependKeys, result) {
    result = result || [];

    var push = function(keys) {
      _.each([].concat(keys), function(key) {
        if (_.include(result, key)) {
          throw new Error(format('ERROR: Cycle depend detected: %s', result.reverse().concat(key).join(' -> ')));
        } else {
          result.unshift(key);
        }
      });
    };

    _.each([].concat(dependKeys), function(key) {
      push(key);
      if (checkObj[key]) {
        resolve(checkObj[key], result);
      }
    });
    return result;
  };

  _.each(checkObj, function(depends, key) {
    cfg[key].resolve = resolve(depends);
  });
}


/**
 *  解析像下面的这种类型的字符串（用在 Type 及 Struct 定义中）
 *  <FirstName> (gender: @Self.gender)
 *  @Self.firstName @MiddleName @Self.lastName
 *  @Config.foo.bar
 *  @String(min: 5, max: 10).upper()
 *  [apple, pear, orange, banana]
 *
 *  返回（其中的 value、values、typeArgs 还需要进一步解析
 *  {
 *    type:
 *    typeArgs:
 *    values:
 *    value:
 *    processes:
 *    selfDepends:
 *  }
 */
function _parseStrToCfg(str) {
  var result;
  str = str.trim();

  // 形式一、 [apple, pear, orange, banana]
  if (H.isWrapInSquareBrackets(str)) {
    result = {
      type: false,
      values: H.parseStrToArray(str)};
  }

  // 形式二、 <FirstName> (gender: @Self.gender)
  else if (/^<\s*(\w+)\s*>\s*(?:\(([^\)]*)\))?/.test(str)) {
    var type = RegExp.$1, args = H.parseStrToArgs(RegExp.$2);
    result = {
      type: type,
      typeArgs: args};
  }

  // 其它形式、@String(min: 5, max: 10).upper();  @Config.foo.bar;  @Self.firstName @MiddleName @Self.lastName
  else {
    result = {
      type: false,
      value: str}
  }

  result.selfDepends = _getSelfDepends(str);
  if (result.selfDepends.length === 0) {
    result.selfDepends = false;
  }

  return result;
}

function _turnCfgToGenerator(cfg, resolveSelfObj) {

}


/**
 *
 * {
 *  type:
 *  options:
 *  values:     Array, 如果没有设置 type，则从 values 中随机先一个值
 *  value:      如果没有 type，并且没有设置 values，则取此项配置的值
 *  processes:  处理器
 *  depends:    依赖的所有当前对象的 keys
 *
 *  // 保留字段
 *  resolve:    需要预先获取的字段
 *  resolved:   预先获取的是否都获取了
 * }
 *
 * 只有 value、values 和 options 中可以配置 @Self 或调用其它 Type
 */
function createStruct(key, cfg) {
  _structCfgFormat(cfg);
  _structCfgDepends(cfg);
  _structCfgDependsResolve(cfg);

  var keyOrderList = [];

  // 根据 resolve 获取关键字的解析顺序
  _.each(cfg, function(typeOpts, resultKey) {
    _.each(typeOpts.resolve.concat(resultKey), function(key) {
      if (!cfg[key].resolved) {
        keyOrderList.push(key);
        cfg[key].resolved = true;
      }
    });
  });


  createType(key, function() {
    var result = {};

    // 保证生成对象中的key的顺序和定义的顺序一致
    _.each(cfg, function(obj, key) {
      result[key] = null;
    });

    _.each(keyOrderList, function(resultKey) {
      var typeOpts = cfg[resultKey],
        type = typeOpts.type,
        val = typeOpts.value,
        opts = typeOpts.options,
        processes = typeOpts.processes;

      // opts 中可能也有依赖
      _.each(opts, function(optVal, optKey) {
        opts[optKey] = exec(optVal, result);
      });

      if (type) {
        val = call(type, opts, processes);
      } else if (_.isArray(typeOpts.values)) {
        val = _.sample(typeOpts.values);
      }

      result[resultKey] = exec(val, result);
    });

    return result;

  });
}



/**
 * 解析函数调用时的参数
 *
 *  只支持下面两种形式，其它不支持
 *    a: 'aaa', b: 43  => {a: 'aaa', b: 43}
 *    aaa, '43'        => ['aaa', '43']
 */
function _parseCallArguments(str) {
  var result = [], parsed;
  str = str.trim();

  parsed = _parseCallArgumentsHelper(str);

  if (parsed !== str) {
    result.push(parsed);
  } else {

    // TODO 先做一个简版的解析，以后再加强
    var parts = str.split(/\s*,\s*/),
      isObject = false;
    if (_.every(parts, function(part) { return part.indexOf(':') > 0; })) {
      isObject = true;
      result = {};
    }

    _.each(parts, function(part) {
      if (isObject) {
        var t = part.split(':');
        result[t.shift().trim()] = _parseCallArgumentsHelper(t.join(':').trim());
      } else {
        result.push(_parseCallArgumentsHelper(part));
      }
    });
  }

  return result;
}
var _helperKeywords = {
  'null': null,
  'false': false,
  'true': true
};
function _parseCallArgumentsHelper(str) {
  var len, keyword;

  len = str.length;
  keyword = str.toLowerCase();

  if (str[0] === str[len-1] && _.include(['"', '\''], str[0])) {
    return str.substr(1, len - 2);
  } else if (keyword in _helperKeywords) {
    return _helperKeywords[keyword];
  } else {
    // 是否是整数
    if (str === '0' || /^-?[1-9]\d*$/.test(str)) {
      return parseInt(str, 10);
    }

    // 是否是浮点数
    else if (/^-?[1-9]\d*\.\d*$/.test(str) || /^-?0?\.\d*[1-9]\d*$/.test(str)) {
      return parseFloat(str);
    }
  }

  // 无计可施
  return str;
}


/**
 * 解析函数调用
 *
 * 如果是数字（整数、浮点数），则优先以数字形式显示，如果非要字符串，则请在其上加上引号
 * null, false, true (大小与不敏感)的处理方式与数字类似
 *
 * @String                           => @Types.String().result()
 * @String(pool: alpha)              => @Types.String({pool: 'alpha'}).result()
 * @String(max: 20).cap(something)   => @Types.max({max: 20}).cap('something').result()
 */
function _parseCall(str) {
  var original = str;
  str = str.substr(1); // 去掉 @ 字符
  var type, typeArgs, processes = {}, args, parsed = [],
    reg = /(\w+)(?:\(([^\)]*)\))?/g;

  while(reg.exec(str)) {
    parsed.push([RegExp.$1, RegExp.$2]);
  }

  _.each(parsed, function(obj) {
    var key = obj[0],
      args = obj[1] && _parseCallArguments(obj[1]);

    if (!type) {
      type = key;
      typeArgs = args;
    } else {
      processes[key] = args || [];
    }
  });
  return isTypeExists(type) ? call(type, typeArgs, processes) : original;
}


/**
 * 解析 value 中带有的特殊字符串
 *
 * @example
 *
 * '@Self.foo'              => 返回当前对应所对应的键名为 foo 的值
 * '@String.cap'            => 执行 Types.String().cap().result()
 * '@Self.foo is good'      => 字符串
 * '{@Self.foo}bar'         => 字符串
 * '@Self.foo @String.cap'  => 字符串
 *
 */
function exec(str, self) {
  if (!_.isString(str)) { return str; }

  // 如果 str 在引号（包括单引号、又引号）内，则直接返回引号内的内容
  if (_.include(['\'', '"'], str.charAt(0)) && str.charAt(0) === str.charAt(str.length - 1)) {
    return str.substr(1, str.length - 2);
  }

  // Match string links: @String(max: 20).cap(something)
  var reg = /(?:\{\s*)?@\w+(?:\([^\)]*\))?(?:\.\w+(?:\([^\)]*\))?)*(?:\s*\})?/g,
    matches = str.match(reg),
    matchLen = matches && matches.length;


  // NOTE 邮箱也符合上面的正则
  var parseValue = function(str) {
    var selfKey = '@Self.', len = str.length, key;

    if (str[0] === '{' && str[len-1] === '}') {
      str = str.substr(1, len - 2).trim();
    } else if (str[0] === '{' || str[len-1] === '}') {
      return str;
    }

    if (str.indexOf(selfKey) === 0) {
      key = str.substr(selfKey.length);
      return (self && (key in self)) ? self[key] : str;
    } else {
      return _parseCall(str);
    }
  };

  // 一、不含特殊字符
  if (!matchLen) {
    return str;
  }
  // 二、只含有一类特殊字符
  else if (matchLen === 1 && matches[0] === str) {
    return parseValue(str);
  }
  // 三、含有多类特殊字符或字符串，则只返回字符串
  else {
    return str.replace(reg, function(raw) {
      return parseValue(raw).toString();
    });
  }

}







// 由于是解析文件，所以时刻要注意对字符串 trim
JIM.parseContent = function(content) {
  // 去除注释
  content = content.replace(/#.*$/gm, '');

  // 去除空行 及 单行首尾的空格
  content = _.chain(content.trim().split(/[\r\n]+/))
    .map(function(line) { return line.trim(); })
    .filter(function(line) { return line; })
    .value().join(os.EOL);

  // 定义在数组("[]")内的字符串可以使用多行写法，分行处可以不带逗号(",")
  //content = content.replace(/\[([^\]]*)\]/g, function(raw, items) {
  //  console.log('[' + items.split(/\s*[,\s\n]+\s*/).join(',') + ']');
  //  return '[' + items.split(/\s*,\s*/).join(',') + ']';
  //});


  // 解析定义的 type
  // 1. 只能写在一行内，不能是多行.
  //
  // RegExp.$1 => 指定的 type
  // RegExp.$2 => type 所属的类型
  // RegExp.$3 => 执行 type 所需要的配置
  // RegExp.$4 => 剩下的
  var regType = /^type\s+(\w+)\s*(?:<\s*(\w+)\s*>)?\s*(?:\(([^\)]*)\))?(.*)$/gm;
  content = content.replace(regType, function(raw, key, type, opts, rest) {
    createType(key, function() {
      if (type) {
        return call(type, opts ? _parseCallArguments(opts) : {});
      } else if (rest) {
        rest = rest.trim();
        var args = H.wrapIn(rest, '[', ']');
        if (args) {
          args = _.map(args.split(','), function(arg) {
            return exec(arg.trim());
          });
          return _.sample(args);
        } else {
          return rest;
        }
      }
      return null;
    });

    return ''; // 用空字符串替代，表示此行已经处理完了，避免被再次处理
  });


  // 解析定义的 struct
  // 1. 要以 struct XX { 开头，并要独占一行;
  // 2. 同时还要以 } 结尾，也要独占一行.
  //
  // RegExp.$1 => 指定的 type
  // RegExp.$2 => 结构体中的每个字段组成的行
  var regStruct = /(?:^|\r?\n)struct\s+(\w+)\s*\{([\s\S]*?)\r?\n\}/g;


  // RegExp.$1 => structKey
  // RegExp.$2 => structKey Type
  // RegExp.$3 => 执行 structKey Type 的配置
  // RegExp.$4 => 剩下的
  var regStructKey = /^(\w+)\s*:\s*(?:<\s*(\w+)\s*>)?\s*(?:\(([^\)]*)\))?(.*)$/;

  content = content.replace(regStruct, function(raw, key, lines) {
    var cfg = {};
    _.chain(lines.trim().split(os.EOL))
      .filter(function(line) { return line; }) // 去除空行
      .each(function(line) {
        line.replace(regStructKey, function(raw, structKey, structType, typeOpts, rest) {
          if (structType) {
            cfg[structKey] = {
              type: structType,
              options: typeOpts ? _parseCallArguments(typeOpts) : {}
            }
          } else if (rest) {
            rest = rest.trim();
            var args = H.wrapIn(rest, '[', ']');
            if (args) {
              cfg[structKey] = _parseCallArguments(args);
            } else {
              cfg[structKey] = rest ? rest : 'null';
            }

          }
        });
      });

    createStruct(key, cfg);
    return '';
  });

  return content.trim();
};


JIM.createStruct = createStruct; // 高级的 Type
JIM.createType = createType;

JIM.isTypeExists = isTypeExists;
JIM.createProcess = createProcess;  // 输出结果的处理程序

JIM.Types = Types;  // 所有的 Types
JIM.exec = exec;



JIM.config = config;


module.exports = JIM;