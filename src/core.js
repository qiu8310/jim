var _ = require('lodash'),
  EOL = require('os').EOL,
  C = require('./config/config.js'),
  H = require('./lib/Helper'),
  ArgumentsError = require('./lib/ArgumentsError'),
  format = H.format;


var JIM = {},
  FilterHooks = ['postResult', 'preGenerate'],

  Types = {},     // type => {fn: function, ctx: context, key: key, ns: namespace, aliases: aliases}
  Filters = {};   // filter => {fn: function, ctx: context, key: key, ns: namespace, aliases: aliases}

// 1. 要以 struct XX { 开头，并要独占一行;
// 2. 同时还要以 } 结尾，也要独占一行.
//

// 用到的正则
var R = {
  globalSelfDependKey: /@Self\.(\w+(?:\.\w+)*)/g, // 匹配 @Self.someKey.fooKey 的字符串

  /*
     RegExp.$1 => 指定的 type
     RegExp.$2 => 结构体中的每个字段组成的行

     Example:
       struct User {
         firstName:  <FirstName> (gender: @Self.gender)
         gender:     <Gender> (lang: en)
         hello:      Hello @Username, my name is {@Self.fullName}
       }
   */
  globalJimStructDefine: /(?:^|[\r\n]+)struct\s+(\w+)\s*\{([\s\S]*?)[\r\n]+\}/g,   // JIM 文件中的 Struct 定义
  jimStructKeyDefine: /^(\w+)\s*:\s*(.*)$/,  // JIM 文件中的 Struct 中的 key 的定义
  /*
     RegExp.$1 => 指定的 type
     RegExp.$2 => 剩下的

     Example:
      type Fruit  [apple, pear, orange, banana]
      type Word   <String> (min: 4, max: 10)
   */
  globalJimTypeDefine: /^type\s+(\w+)\s*(.*)$/gm, // JIM 文件中 Type 的定义格式
  globalJimComment: /#.*$/gm,   // JIM 文件中的注释
  eol: /[\r\n]+/     // 换行符
};


function JIMGenerate(fn, args, ctx) {
  this.filterRefs = [];
  this.fn = fn;
  this.ctx = ctx;
  this.fnArgs = _.isArray(args) ? args : [];
}


JIMGenerate.prototype = {
  // 生成数据
  _call: function() {
    return this.fn.apply(this.ctx, this.fnArgs);
  },
  _isPreGenerate: function(key) { return (key in Filters) && Filters[key].ctx.hook === 'preGenerate'; },

  result: function() {
    var self = this;

    var genFn = function() { return self._call(); };
    var reGenFn = function(filters) {
      var _genFn = genFn;
      genFn = function() {
        var result = _genFn(), tmp, nsFn, filter;
        _.each(filters, function(ref) {
          filter = Filters[ref.key];
          if (filter) {
            nsFn = filter.ns && _['is' + filter.ns];
            if (!nsFn || nsFn.call(_, result)) {
              result = filter.fn.apply(filter.ctx, [result].concat(ref.args));
            }
          } else {
            tmp = H.callNativeJs(result, ref.key, ref.args);
            if (tmp) { result = tmp.result; }
          }
        });
        return result;
      };
    };
    var reGenPreGenerateFn = function(ref) {
      var _genFn = genFn;
      genFn = function() {
        filter = Filters[ref.key];
        return filter.fn.apply(filter.ctx, [_genFn].concat(ref.args));
      };
    };

    var result, filter;
    _.each(self.filterRefs, function(item) {
      // 是一组 postResult filter (同时包括 nativeJS)
      if (_.isArray(item)) { reGenFn(item); }

      // 是一个 preGenerate filter
      else { reGenPreGenerateFn(item); }
    });
    return genFn();
  },

  applyFilter: function(key, args) {
    // 将 preGenerate 类型的 filter 专门分成一组
    var last, len = this.filterRefs.length,
      item = {key: key, args: _.isArray(args) ? args : []};

    if (this._isPreGenerate(key)) {
      this.filterRefs.push(item);
    } else {
      last = len && this.filterRefs[len-1];

      if (!last || !_.isArray(last)) {
        this.filterRefs.push([item]);
      } else {
        last.push(item);
      }
    }
  }
};


function _isExists(category, key) {
  var ref = category === 'type' ? Types : Filters;
  return key in ref;
}
function _create(category, key /*, alias_1, alias_2, ..., fn, ctx*/) {
  var ref = category === 'type' ? Types : Filters,
    args = [].slice.call(arguments, 2),
    ctx = _.isPlainObject(args[args.length - 1]) ? args.pop() : {},
    fn = args.pop(),
    aliases = _.filter(_.union.apply(_, args), function(arg) { return _.isString(arg); });

  if (!_.isString(key) || !_.isFunction(fn)) {
    console.error('ERROR: Create', [].slice.call(arguments));
    throw new ArgumentsError;
  }

  // 支持 namespace，用在 filter 中， 定义的 key 中也不应该出现 . 符号
  var namespace = false,
    parts = key.split('.');

  key = parts.pop();
  if (parts.length > 0) { namespace = parts.join('.'); }

  if (key in ref) {
    console.warn(format('WARN: Created %s %s already exists', category, key));
  }

  ctx = _.assign({}, config(category + '.' + key), ctx);

  var result = {
    fn: fn,
    ns: namespace,
    key: key,
    ctx: ctx,
    aliases: aliases
  };

  _.each([key].concat(aliases), function(k) { ref[k] = result; });
  return result;
}

function isFilterExists(filter) { return _isExists('filter', filter); }
function isTypeExists(type) { return _isExists('type', type); }
function createFilter() {
  var filter = _create.apply(null, ['filter'].concat([].slice.call(arguments)));
  if (!_.include(FilterHooks, filter.ctx.hook)) {
    filter.ctx.hook = FilterHooks[0];
  }
  return filter;
}
function createType() {
  var type = _create.apply(null, ['type'].concat([].slice.call(arguments)));
  var spy = type.fn;

  type.fn = function() {
    var ctx = this;
    return new JIMGenerate(spy, [].slice.call(arguments), ctx); };

  return type;
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
      if (_.isUndefined(val)) {
        return ref[key];
      } else {
        ref[key] = val;
        return val;
      }
    }
    return null;

  } else if (_.isPlainObject(key)) {
    _.each(key, function(v, k) {
      config(k, v);
    });
  }
}



function call(type, typeArgs, filterRefs) {
  if (isTypeExists(type)) {
    type = Types[type];

    var generator = type.fn.apply(type.ctx, typeArgs);
    _.each(filterRefs, function(filter) {
      generator.applyFilter(filter.key, filter.args);
    });
    return generator.result();
  } else {
    throw new Error(format('ERROR: Type `%s` is not exist, can not be called', type));
  }
}




// 主要检查带  @Self.someKey.fooKey 的字符串
function _getSelfDepends(str) {
  var result = [];
  if (_.isString(str)) {
    str.replace(R.globalSelfDependKey, function(raw, key) {
      result.push(key.split('.').shift());
    });
  }
  return result;
}

// 格式化配置
function _structCfgFormat(cfg) {
  _.each(cfg, function(val, key) {
    cfg[key] = {
      value: val,
      selfDepends: _getSelfDepends(val)
    }
  });
}


// 深度遍历检查是否有循环依赖
function _structCfgDependsResolve(cfg) {
  var checkObj = {};

  _.each(cfg, function(obj, key) {
    checkObj[key] = obj.selfDepends;
  });

  var resolve = function(dependKeys, result) {
    result = result || [];

    var push = function(key) {
      if (_.include(result, key)) {
        throw new Error(format('ERROR: Cycle depend detected: %s', result.reverse().concat(key).join(' -> ')));
      } else {
        result.unshift(key);
      }
    };

    _.each([].concat(dependKeys), function(key) {
      push(key);
      if (checkObj[key]) {
        resolve(checkObj[key], result);
      }
    });
    return result;
  };

  _.each(checkObj, function(selfDepends, key) {
    cfg[key].orderedSelfDepends = resolve(selfDepends);
  });
}



/**
 * cfg:
 * {
 *
 *  value:                可以 exec 的字符串
 *
 *  // 保留字段
 *  selfDepends:           依赖的所有当前对象的 keys
 *  orderedSelfDepends:    需要预先获取的字段
 *  resolved:              预先获取的是否都获取了
 * }
 *
 * 只有 value、values 和 options 中可以配置 @Self 或调用其它 Type
 */
function createStruct(type, cfg) {
  _structCfgFormat(cfg);
  _structCfgDependsResolve(cfg);

  var orderedKeyList = [];

  // 根据 resolve 获取关键字的解析顺序
  _.each(cfg, function(typeOpts, cfgKey) {
    _.each(typeOpts.orderedSelfDepends.concat(cfgKey), function(key) {
      if (cfg[key] && !cfg[key].resolved) {
        orderedKeyList.push(key);
        cfg[key].resolved = true;
      }
    });
  });

  createType(type, function() {
    var result = {};

    // 保证生成对象中的key的顺序和定义的顺序一致
    _.each(cfg, function(obj, key) {
      result[key] = null;
    });

    _.each(orderedKeyList, function(key) {
      result[key] = exec(cfg[key].value, result);
    });

    return result;

  });
}


/**
 * 从匿名的结构体中得到结果
 */
var _anonymousStructIndex = 1;
function getResultFromAnonymousStruct(cfg) {
  var key = '_anonymous_' + _anonymousStructIndex++;
  createStruct(key, cfg);
  return call(key);
}

/**
 * 解析 str 中带有的特殊字符串
 *
 * self 是当前所依赖的对像，如果 str 中没有 @Self，则就用不着这个字段
 *
 * @example
 *
 * '@Self.foo'              => 返回当前对应所对应的键名为 foo 的值
 * '@String.cap'            => 执行 Types.String().cap().result()
 * '@Self.foo is good'      => 字符串
 * '{@Self.foo}bar'         => 字符串
 * '@Self.foo @String.cap'  => 字符串
 *
 *  <FirstName> (gender: @Self.gender)
 *  @Self.firstName @MiddleName @Self.lastName
 *  @Config.foo.bar
 *  @String(min: 5, max: 10).upper()
 *  [apple, @String, orange, banana]
 *
 *  另外还要解析匿名结构体
 */
function exec(str, self) {
  // 非字符串表示已经解析好了
  if (!_.isString(str)) { return str; }

  // 如果是字面量，也直接返回
  var literalValue = H.parseStrToLiteralValue(str);
  if (literalValue !== str) { return literalValue; }

  // <FirstName> (gender: @Self.gender)  // 通过 call 调用的直接返回
  if (/^\s*<\s*(\w+)\s*>\s*(?:\(([^\)]*)\))?\s*$/.test(str) && isTypeExists(RegExp.$1)) {
    var squareStyleType = RegExp.$1,
      squareStyleArgs = H.parseStrToArgs(RegExp.$2);
    return call(squareStyleType, _execFunctionArgs(squareStyleArgs, self));  // 继续解析函数的参数，可能调用了其它 Type
  }

  // [apple, pear, orange, banana]
  if (H.isWrapInSquareBrackets(str)) {
    return _replaceAtSign(_.sample(H.parseStrToArray(str))); // 还有待继续解析 可能存在的 @ 符号
  }

  // 匿名结构体形式： {a: xxx, b: xxx;}，此时不可能为空对象，为空在 parseStrToLiteralValue 时就处理了
  // {a: xxx \n b: xxx}
  if (H.isWrapInBraces(str)) {
    var anonymous;
    if (str.indexOf(EOL) > 0) {
      anonymous = H.wrapIn(str, '{' + EOL, EOL + '}').split(EOL).join(', ');
    } else {
      anonymous = H.wrapIn(str, '{', '}');
    }
    if (anonymous) {
      anonymous = H.parseStrToArgs(anonymous);
      if (anonymous.length === 1 && _.isPlainObject(anonymous[0])) {
        return getResultFromAnonymousStruct(anonymous[0]);
      }
    }
  }

  return _replaceAtSign(str, self);
}

function _replaceAtSign(str, self) {
  // 非字符串表示已经解析好了
  if (!_.isString(str)) { return str; }

  // 其它形式： @String(min: 5, max: 10).upper();  @Config.foo.bar;  @Self.firstName @MiddleName @Self.lastName
  // 注意可以使用大括号来避免混淆：{@Self.foo}bar
  // RegExp.$1 => Type
  // RegExp.$2 => TypeArgs
  var reg = /(?:\{\s*)?@(\w+)(?:\(([^\)]*)\))?(?:\.\w+(?:\([^\)]*\))?)*(?:\s*\})?/g,
    matches = str.match(reg),
    matchLen = matches && matches.length;

  // 一、不含特殊字符
  if (!matchLen) {
    return str;
  }
  // 二、只含有一类特殊字符，并且保证 str 两边要么同时包含在 {} 内，要么两端没有 {}
  else if (matchLen === 1 && matches[0] === str && !(str[0] === '{' ^ str[str.length - 1] === '}')) {
    return _execCallStr(str, self);
  }
  // 三、含有多类特殊字符或字符串，则结果都要 toString
  else {
    return str.replace(reg, function(raw, type, typeArgs) {
      // 去除 raw 两端的 { }
      var left = '', right = '';
      if (H.isWrapInBraces(raw)) { raw = H.wrapIn(raw, '{', '}'); }
      else if (raw[0] === '{') { left = '{'; raw = raw.substr(1); }
      else if (raw[raw.length - 1] === '}') { right = '}'; raw = raw.substr(0, raw.length - 1); }

      return left + _execCallStr(raw, self).toString() + right;
    });
  }
}


// 解析由函数 H.parseStrToArgs 返回的函数的参数(参数里可能还包含有 @ 的调用）
// 因为参数里可能还带有引用
function _execFunctionArgs(args, self) {
  return _.map(args, function(arg) {
    if (_.isPlainObject(arg)) {
      var result = {};
      _.each(arg, function(k, v) {
        result[_replaceAtSign(k, self).toString()] = _replaceAtSign(v, self);
      });
    } else {
      return _replaceAtSign(arg, self);
    }
  });
}

/**
 * 执行类似下面的字符串
 * '@Self.foo.toString'
 * '@String.cap.split(' ').join(,)'
 * '@Self.foo'
 * '@Config.a.b'
 */
function _execCallStr(str, self) {
  var original = str;

  str = str.substr(1); // 去掉 @ 字符
  var filters = [], types, type, typeArgs,
    reg = /(\w+)(?:\(([^\)]*)\))?/g;

  while(reg.exec(str)) {
    filters.push({key: RegExp.$1, args: H.parseStrToArgs(RegExp.$2)});
  }

  // 对括号中的参数还要再解析下
  _.each(filters, function(filter) {
    filter.args = _execFunctionArgs(filter.args, self);
  });

  types = filters.shift();
  type = types.key;
  typeArgs = types.args;

  if (type === 'Self' || type === 'Config') {
    var ref = type === 'Self' ? self : C;

    _.each(filters, function(filter) {
      var rtn = H.callNativeJs(ref, filter.key, filter.args);
      // 不存在的 filter 则忽略
      if (rtn) {
        ref = rtn.result;
      }
    });

    return ref;
  }
  return isTypeExists(type) ? call(type, typeArgs, filters) : original;
}



/**
 *
 * 对 JIM 文件格式化处理，主要进行下面的步骤
 *
 * 1、去除以 # 开头的注释 ( shell 脚本风格）
 * 2、换行符转义：以 \ + 换行 的地方全部替换成空字符串
 * 3、去除空行，及对每行进行 trim 操作，同时把换行符换成统一的系统相关的换行符
 */
function _formatContent(content) {
  // 去除注释
  content = content.replace(R.globalJimComment, '');

  // 以 \ 结尾表示对换行符转义，去除换行符
  content = content.replace(/\\\s*[\r\n]+/g, '');


  // 去除空行 及 单行首尾的空格
  content = _.chain(content.trim().split(R.eol))
    .map(function(line) { return line.trim(); })
    .filter(function(line) { return line; })
    .value().join(EOL);


  return content;
}

/**
 * 从 JIM 文件中解析 Type 及 Struct 的定义
 * 同时会把解析成功的字符串替换成空字符串，所以最后返回的是一些没能解析的字符串
 *
 * Type 的定义：
 *  type Keyword ...  // 只能写在一行中，如果非要写成多行，请用 \ 转义换行符
 *
 * example:
 *  type Fruit  [apple, pear, orange, banana]
 *  type Word   <String> (min: 4, max: 10)
 *  type Foo    @String(min: 4, max: 10)
 *
 *
 * Struct 的定义
 *  struct Keyword {
 *    key: ...
 *  }
 *
 *  首行一定是 struct Keyword { 的形式
 *  最后的 } 一定要另起一行
 *
 *
 *
 * NOTE: 由于是解析文件，所以时刻要注意对字符串 trim
 */
function loadTypesFromContent(content) {

  content = _formatContent(content);


  // 解析定义的 type
  content = content.replace(R.globalJimTypeDefine, function(raw, key, rest) {
    createType(key, function() {
      return exec(rest.trim());
    });
    return ''; // 用空字符串替代，表示此行已经处理完了，避免被再次处理
  });


  // 解析定义的 struct
  content = content.replace(R.globalJimStructDefine, function(raw, key, lines) {
    var cfg = {};
    _.chain(lines.trim().split(EOL))
      .filter(function(line) { return line.trim(); }) // 去除空行
      .each(function(line) {
        line.replace(R.jimStructKeyDefine, function(raw, structKey, rest) {
          cfg[structKey] = rest.trim(); // rest 会带有 @Self 的引用，所以先不忙执行
        });
      });
    createStruct(key, cfg);
    return '';
  });

  return content.trim();
}



JIM.config = config;

JIM.isTypeExists = isTypeExists;
JIM.createType = createType;
JIM.createStruct = createStruct;    // 高级的 Type

JIM.isFilterExists = isFilterExists;
JIM.createFilter = createFilter;  // 输出结果的处理程序

JIM.exec = exec;
JIM.loadTypesFromContent = loadTypesFromContent;


module.exports = JIM;