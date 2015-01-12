/* global describe, it, expect, require */

var H = require('../src/lib/helper'),
  _ = require('lodash');



describe('Helper test suit', function() {

  describe('Helper.format(str, args...)', function() {
    var str = 'are you ok, %s';
    it('不提供 args 时原样输入原字符串', function() {
      expect(H.format(str)).toBe(str);
    });

    it('按顺序用 args 替换 str 中的 %s 字符', function() {
      expect(H.format(str, 'mora')).toBe('are you ok, mora');
    });

    it('如果 args 比 str 中的 %s 个数多的话，则忽略多余的', function() {
      expect(H.format(str, 'mora', 'ignored argument')).toBe('are you ok, mora');
    });
  });

  describe('Helper.prob', function() {
    var booleans = [true, false], others = [1, 'x'];

    it('默认返回随机的 Boolean 值', function() {
      expect(_.include(booleans, H.prob()));
    });

    it('可以指定随机返回的两个值及返回的概率', function() {
      expect(_.include(others, H.prob(50, others[0], others[1])));
    });

    it('第一个参数支持使用小数', function() {
      expect(H.prob(1.0)).toBe(true);
      expect(_.include(booleans, H.prob(0.6))).toBe(true);
      expect(H.prob(0)).toBe(false);
    });

    it('第一个参数支持使用带百分号的字符串', function() {
      expect(H.prob('100%', 1, 0)).toBe(1);
      expect(H.prob('0%', 1, 0)).toBe(0);
    });
  });

  describe('Helper.wrapIn', function() {
    it('判断字符串的首尾是否是指定的字符串，如果是并返回内部的字符串，否则返回 false', function() {
      expect(H.wrapIn('[abc]', '[', 'c')).toBe(false);
      expect(H.wrapIn('[abc]', '[', ']')).toBe('abc');
      expect(H.wrapIn('[abc]', '[a', 'c]')).toBe('b');
    });
  });

  describe('Helper.makeSureIsInt', function() {
    it('调用 parseInt 将参数转化成整数', function() {
      expect(H.makeSureIsInt('123')).toBe(123);
      expect(H.makeSureIsInt('123ab')).toBe(123);
      expect(H.makeSureIsInt('0123ab')).toBe(123);
    });



    it('转化失败默认返回指定的第二个参数，否则返回0', function() {
      expect(H.makeSureIsInt('abc')).toBe(0);
      expect(H.makeSureIsInt('abc', 2)).toBe(2);
      expect(H.makeSureIsInt('abc2', 2)).toBe(2);
    });
  });


  describe('Helper.parseStrToArgs', function() {
    it('解析空字符串或无参数成空数组', function() {
      var parsedEmptyStr = H.parseStrToArgs(''),
        parsedNoArgs = H.parseStrToArgs();

      expect(parsedEmptyStr.length).toBe(0);
      expect(parsedNoArgs.length).toBe(0);
    });

    it('解析空数组及空对象', function() {
      expect(H.parseStrToArgs('{}, []')).toEqual([{}, []]);
    });

    it('解析多个基本类型', function() {
      expect(H.parseStrToArgs("123, '34', trUe, 'false'")).toEqual([123, '34', true, 'false']);
    });

    it('解析单个对像', function() {
      expect(H.parseStrToArgs("a: 123, b: '34', c: True, d: 'False'")).toEqual(
        [{a: 123, b: '34', c: true, d: 'False'}]
      );
    });

    it('解析对象与基本类型的组合', function() {
      expect(H.parseStrToArgs('a: 123, aa, b: true, c: 23.23, bb, cc ')).toEqual(
        [{a: 123}, 'aa', {b: true, c: 23.23}, 'bb', 'cc']
      );
    });

    it('解析特殊字符串', function() {
      expect(H.parseStrToArgs(',,')).toEqual(['', '', '']);
      expect(H.parseStrToArgs('{ }, "{}", ')).toEqual([{}, '{}', '']);
    });
  });
});