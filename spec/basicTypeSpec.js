/* global describe, it, expect, require */

var _ = require('lodash'),
  JIM = require('../src/jim.js');

var exec = JIM.exec;
var repeat = function(fn, times) { _.times(times || 3, fn); };


describe('BasicType', function() {

  describe('@Boolean', function() {
    it('should return only true or false', function() {
      repeat(function() {
        expect([true, false].indexOf(exec('@Boolean')) >= 0).toBe(true);
      });
    });

    it('should support set return true\'s percentage', function() {
      repeat(function() {
        expect(exec('@Boolean("100%")')).toBe(true);
        expect(exec('@Boolean("0%")')).toBe(false);
        expect([true, false].indexOf(exec('@Boolean(50%)')) >= 0).toBe(true);
      })
    });

    it('should support set return true\'s probability', function() {
      repeat(function() {
        expect(exec('@Boolean(1)')).toBe(true);
        expect(exec('@Boolean(100)')).toBe(true);
        expect(exec('@Boolean(0)')).toBe(false);
        expect([true, false].indexOf(exec('@Boolean(50)')) >= 0).toBe(true);
        expect([true, false].indexOf(exec('@Boolean(0.5)')) >= 0).toBe(true);
      });
    });

    it('should has alias Bool', function() {
      expect(JIM.isTypeExists('Bool')).toBe(true);
      expect(exec('@Bool(1)')).toBe(true);
      expect(exec('@Bool(0)')).toBe(false);
    });

  });

  describe('@Integer', function() {

    function isInt(w) { return (typeof w === 'number') && String(w).indexOf('.') === -1; }

    it('should return integer', function() {
      repeat(function() {
        expect(isInt(exec('@Integer()'))).toBe(true);
      });
    });

    it('should return integer less than a number', function() {
      repeat(function() {
        expect(isInt(exec('@Integer(10)'))).toBe(true);
        expect(exec('@Integer(10)')).toBeLessThan(11);
        expect(exec('@Integer(0)')).toBe(0);
      });
    });

    it('should return integer between min and max', function() {
      repeat(function() {
        expect(isInt(exec('@Integer(1, 2)'))).toBe(true);
        expect(exec('@Integer(1, 2)')).toBeLessThan(3);
        expect(exec('@Integer(1, 2)')).toBeGreaterThan(0);

        expect(exec('@Integer(-2, 0)')).toBeLessThan(1);
        expect(exec('@Integer(-2, 0)')).toBeGreaterThan(-3);
      });
    });

    it('should has alias Int', function() {
      expect(JIM.isTypeExists('Int')).toBe(true);
    });
  });

  describe('@Float', function() {
    it('should default return string', function() {
      expect(typeof exec('@Float')).toBe('string');
    });

    it('should between 0 and 1', function() {
       repeat(function() {
         var f = exec('@Float');
         expect(f >= 0).toBe(true);
         expect(f <= 1).toBe(true);
       });
    });

    it('should return number when specify first argument to true', function() {
      expect(typeof exec('@Float(true)')).toBe('number');
    });

    it('should return fixed floating length string', function() {
      repeat(function() {
        expect(exec('@Float("5").length')).toBe(7);
        expect(exec('@Float("1-2").length') <= 4).toBe(true);
      })
    });

    it('should support specify max float number', function() {
      repeat(function() {
        expect(exec('@Float(true, 0.5)') <= 0.5).toBe(true);
      });
    });

    it('should support specify min and max float number', function() {
      repeat(function() {
        expect(exec('@Float(true, 0.1, 0.5)') >= 0.1).toBe(true);
        expect(exec('@Float(true, 0.1, 0.5)') <= 0.5).toBe(true);
        expect(exec('@Float(true, 0, 10)') <= 10).toBe(true);
        expect(exec('@Float(true, 0, 10)') >= 0).toBe(true);
        expect(exec('@Float(true, 20, 30)') >= 20).toBe(true);
      });
    });

    it('should has alias Double', function() {
      expect(JIM.isTypeExists('Double')).toBe(true);
    });
  });

  describe('@Date', function() {
    it('should return timestamp', function() {
      var t = exec('@Date');
      expect(typeof t).toBe('number');
      expect(String(t).length).toBe(10);
    });

    it('should return last one year timestamp', function() {
      repeat(function() {
        var t = exec('@Date(-1)') * 1000, now = (new Date()).getTime() + 1, last = now - 3600000 * 24 * 365 - 2;
        expect(t < now && t > last).toBe(true);
      }, 10);
    });

    it('should return future one hour', function () {
      repeat(function() {
        var t = exec('@Date(1, 3600)') * 1000, now = (new Date()).getTime() - 1, future = now + 3600000 + 2;
        expect(t > now && t < future).toBe(true);
      }, 10);
    });

    it('should return future one hour to future two hour', function() {
      repeat(function() {
        var now = (new Date()).getTime();
        var t = exec('@Date("3600", "7200")') * 1000,
          fOne = now + 3600000 - 10000, fTwo = fOne + 3600000 + 20000;
        expect(t > fOne && t < fTwo).toBe(true);
      }, 10);
    });

  });

  describe('@Character', function() {
    it('should return one char', function() {
      expect(exec('@Character').length).toBe(1);
    });

    it('should support specify pool', function() {
      expect(exec('@Character(a)')).toBe('a');
      expect(exec('@Character(a)')).toBe('a');
      expect(exec('@Character(b)')).toBe('b');
      expect(exec('@Character(b)')).toBe('b');
      expect('ab'.indexOf(exec('@Character(ab)')) >= 0).toBe(true);
      expect('ab'.indexOf(exec('@Character(ab)')) >= 0).toBe(true);
    });

    it('should has alias Char and Letter', function() {
      expect(JIM.isTypeExists('Char')).toBe(true);
      expect(JIM.isTypeExists('Letter')).toBe(true);
    });
  });

  describe('@String', function() {
    it('返回固定长度的字符串', function() {
      repeat(function(){
        expect(exec('@String(0)')).toBe('');
        expect(exec('@String(1)').length).toBe(1);
        expect(exec('@String(1).length')).toBe(1);
        expect(exec('@String(10).length')).toBe(10);
      });
    });

    it('支持设置返回的字符串的最小和最大的长度', function() {
      repeat(function() {
        expect(exec('@String(2, 4).length') < 5).toBe(true);
        expect(exec('@String(2, 4).length') > 1).toBe(true);
      });
    });

    it('支持设置返回的字符串所包含的字符', function() {
      repeat(function() {
        expect(_.all(exec('@String(abc).split("")'), function(c) { return ['a', 'b', 'c'].indexOf(c) >= 0 })).toBe(true);
        expect(_.all(exec('@String(abc).split("")'), function(c) { return ['a', 'b', 'c'].indexOf(c) >= 0 })).toBe(true);
        expect(_.all(exec('@String(abc).split("")'), function(c) { return ['a', 'b', 'c'].indexOf(c) >= 0 })).toBe(true);
      });
    });

    it('should has alias Str', function() {
      expect(JIM.isTypeExists('Str')).toBe(true);
    });
  });

  describe('@ObjectId', function() {
    var chars = '0123456789abcdef'.split(''), len = 24;

    it('should be a string contains 0-9a-f, and with length 24', function() {
      expect(exec('@ObjectId').length).toBe(24);
      expect(exec('@ObjectId').length).toBe(24);
      expect(_.all(exec('@ObjectId').split(''), function(c) { return _.include(chars, c); })).toBe(true);
      expect(_.all(exec('@ObjectId').split(''), function(c) { return _.include(chars, c); })).toBe(true);
    });

    it('should has alias oid', function() {
      expect(JIM.isTypeExists('Oid')).toBe(true);
      expect(exec('@Oid').length).toBe(24);
    });
  });

  describe('@Guid', function() {
    var tpl = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

    it('should match guid length', function() {
      expect(exec('@Guid').length).toBe(tpl.length);
    });
  });

  describe('@Id', function() {
    it('should auto increment from 1', function() {
      expect(_.isNumber(exec('@Id'))).toBe(true);

      expect(exec('@Id(basicTest)')).toBe(1);
      expect(exec('@Id(basicTest)')).toBe(2);
      expect(exec('@Id(basicTest)')).toBe(3);
    });

    it('should support pool to set another auto increment id', function() {
      expect(exec('@Id(anotherTest)')).toBe(1);
      expect(exec('@Id(anotherTest)')).toBe(2);
      expect(exec('@Id(basicTest)')).toBe(4);
      expect(exec('@Id(anotherTest)')).toBe(3);
    });

    it('should has alias Increment and Inc', function() {
      expect(JIM.isTypeExists('Inc')).toBe(true);
      expect(JIM.isTypeExists('Increment')).toBe(true);
    });

  });

});
