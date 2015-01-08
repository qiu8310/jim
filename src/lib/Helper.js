
var _ = require('lodash'),
  C = require('../config'),
  Helper;


var _probArray = _.shuffle(_.range(100)),
  _probSample = function() { return _.sample(_probArray); };

/*
 prob( 0.2 )     // 0.2  的概率返回 true 或 第二个参数，否则返回 false 或 第三个参数
 prob( '30%' )   // 30%  的概率返回 true 或 第二个参数，否则返回 false 或 第三个参数
 prob( 30 )      // 30%  的概率返回 true 或 第二个参数，否则返回 false 或 第三个参数
 prob( 2 )       // 100% 的概率返回 true 或 第二个参数，否则返回 false 或 第三个参数
 prob( 0 )       // 0%   的概率返回 true 或 第二个参数，否则返回 false 或 第三个参数
*/
function prob(rate, hit, otherwise) {
  hit = _.isUndefined(hit) ? true : hit;
  otherwise = _.isUndefined(otherwise) ? false : otherwise;


  if (/^[\d\.]+%?$/.test(rate)) {
    rate = parseFloat(rate);
    rate = Math.round(rate <= 1 ? rate * 100 : rate) % 101; // 保证 0 <= rate <= 100
  } else {
    rate = 50;  // 默认 50%
  }

  return _probSample() < rate ? hit : otherwise;
}


function format(str, args) {
  args = [].slice.call(arguments, 1);
  return str.replace(/%s/g, function(raw) {
    return args.length ? args.shift() : raw;
  });
}




function isCharQuote(char) { return ['"', '\''].indexOf(char) >= 0; }
function strCanParseToObjectPart(str) {
  return str.indexOf(':') > 0 && !Helper.isWrapInQuote(str);
}

// 注意：替换后的字符串不能出现替换前的字符
var replacer = {
  ',':  '!@#(*_*&l_*)&^%',
  ':':  '!@#(*_as__*)&^%',
  '\'': '!@#(*_#$k_*)&^%',
  '"':  '!@#(*_k%a_*)&^%'
};
function recoverStrInQuote(str) {
  _.each(replacer, function(rep, ori) {
    while(str.indexOf(rep) >= 0) { str = str.replace(rep, ori); }
  });
  return str;
}

/**
 * 将 两个引号之间的【, : ' "】换成其它特殊字符 (, : 需要用来分界的，单引号中可以含有双引号， 双引号中可以含有单引号)
 */
function replaceStrInQuote(str) {
  var quote = false, replacedStr = '';
  _.each(str.split(''), function(char) {
    // 引号的始末位置
    if (isCharQuote(char) && (!quote || quote === char)) {
      if (!quote) {   // 起
        quote = char;
      } else {        // 末
        quote = false;
      }
      replacedStr += char;
    } else {
      if (quote && (char in replacer)) {
        replacedStr += replacer[char];
      } else {
        replacedStr += char;
      }
    }
  });
  return replacedStr;
}



// (): parentheses 圆括号，复数形式 单个括弧则是 parenthesis
// []: square brackets 中括号(或方括号)
// <>: angle brackets 尖括号
// {}: braces  大括号

Helper = {
  /**
   * 根据第一个参数指定的概率随机返回第二个参数或第三个参数
   *
   * prob(40, 'a', 'b')   =>  'b'
   */
  prob: prob,

  /**
   * 格式化字符串
   *
   * format('are you ok, %s', 'mora')  => are you ok, mora
   */
  format: format,

  /**
   * 判断 str 在首尾是否分别是 start 和 end
   *
   * wrapIn('<yes!>', '<', '!>')  => 'yes'
   * wrapIn('<yes!>', '<', '!')  => false
   */
  wrapIn: function(str, start, end) {
    var strLen = str.length, startLen = start.length, endLen = end.length;
    if (str.indexOf(start) === 0 && str.substr(strLen - endLen) === end) {
      return str.substr(startLen, strLen - startLen - endLen);
    }
    return false;
  },

  /**
   * 判断 str 首尾有成对的引号
   */
  isWrapInQuote: function(str) {
    var len = str.length;
    return isCharQuote(str[0]) && str[0] === str[len - 1];
  },

  isWrapInParentheses:    function(str) { return !!Helper.wrapIn(str, '(', ')'); },
  isWrapInSquareBrackets: function(str) { return !!Helper.wrapIn(str, '[', ']'); },
  isWrapInAngleBrackets:  function(str) { return !!Helper.wrapIn(str, '<', '>'); },
  isWrapInBraces:         function(str) { return !!Helper.wrapIn(str, '{', '}'); },

  /**
   * 去除字符串两端的成对的单引号或双引号
   *
   * unquote('"abc"') => 'abc'
   * unquote('"abc\'') => '"abc\''
   */
  unquote: function(str) {
    if (Helper.isWrapInQuote(str)) {
      return str.substr(1, str.length - 2);
    }
    return str;
  },

  /**
   *  确保返回的数一定是个整数
   *
   *  makeSureIsInt(123)      => 123
   *  makeSureIsInt('12ab')   => 12
   *  makeSureIsInt('ab')     => 0
   *  makeSureIsInt('ab', 3)  => 3
   */
  makeSureIsInt: function(param, otherwise) {
    param = parseInt(param, 10);
    if (_.isNaN(param)) {
      if (!otherwise) {
        param = 0;
      } else {
        param = _.isNumber(otherwise) ? otherwise : Helper.makeSureIsInt(otherwise);
      }
    }
    return param;
  },


  /**
   * 将一些简单的字符串解析成 JavaScript 基本类型
   *
   * "'abc'"  => 'abc'
   * "12"     => 12
   * "false"  => false
   * "'false'"  => 'false'
   * "12.345"   => 12.345
   */
  parseStrToPrimitiveJsType: function(str) {
    if (str === '') {
      return str;
    }

    // 保留的关键字，大小写不敏感
    var keywords = {
      'null': null,
      'false': false,
      'true': true
    };

    var key = str.toLowerCase();

    // 有引号，则一定是个字符串
    if (Helper.isWrapInQuote(str)) {
      return Helper.unquote(str);
    } else if (key in keywords) {
      return keywords[key];
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

    return str;
  },

  /**
   * str 首尾最好要是 [ 和 ]
   */
  parseStrToArray: function(str) {
    if (Helper.isWrapInSquareBrackets(str)) {
      str = str.substr(1, str.length - 1);
    }
    return Helper.parseStrToArgs(str);
  },

  /**
   * 解析字符串成一个参数数组（注意：不会解析字符串中的 []）
   *
   * "a: 123, b: '34', c: true, d: 'false'"  =>  [{a: 123, b: '34', c: true, d: 'false'}]
   * "123, '34', true, 'false'"              =>  [123, '34', true, 'false']
   * ""               => []
   * "a: 123, '34'"   => [{a: 123}, '34']
   * ",,"             => [null, null, null]
   * "{ }, '{}',       => [{}, '{}', null]
   */
  parseStrToArgs: function(str) {
    var result = [];

    str = str && str.toString().trim();

    if (!str) { return result; }

    var primitive = Helper.parseStrToPrimitiveJsType(str);
    if (primitive !== str) { // 不相当表明基本类型解析成功，则不用继续解析
      result.push(primitive);
      return result;
    }

    var isObjectParts = [], regEmptyBraces = /^\{\s*\}$/, parsedObj = {},
      list = replaceStrInQuote(str).split(',').map( function(part) { return part.trim(); });

    // 初始化 isPartsObject
    _.each(list, function(item, index) {
      isObjectParts[index] = strCanParseToObjectPart(item);
    });

    _.each(list, function(item, index) {

      if (item === '') { result.push(null) }
      else if (regEmptyBraces.test(item)) { result.push({}); }
      else {

        var isObjectPart = isObjectParts[index],
          isNextObjectPart = isObjectParts[index+1],
          key, val, arg;

        if (isObjectPart) {
          arg = item.split(':');
          key = Helper.unquote(recoverStrInQuote(arg.shift().trim()));
          val = Helper.parseStrToPrimitiveJsType(recoverStrInQuote(arg.join(':').trim()));
        } else {
          arg = Helper.parseStrToPrimitiveJsType(recoverStrInQuote(item));
        }

        if (isObjectPart) {
          parsedObj[key] = val;
          if (!isNextObjectPart) {
            result.push(parsedObj);
            parsedObj = {};
          }

        } else {
          result.push(arg);
        }
      }

    });

    return result;
  }

};



//var r = Helper.parseStrToArgs("a: 123, b: '34', c: true, d: 'false', {}, ");
//
//console.log(r);




module.exports = Helper;