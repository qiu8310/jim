var core = require('../core.js'),
  _ = require('lodash'),
  H = require('../lib/Helper.js'),
  def = require('elegant.def'),
  moment = require('moment');


var exec = core.exec;


var _idPools = {}; // for type.id


var toIntJSDate = function(key, relative, otherwise) {
  if (_.isUndefined(key)) { return otherwise; }

  key = String(key);

  // 1410715640.579, 1410715640, 1410715640579
  if (/^(\d{10})\.?(\d{1,3})$/.test(key)) {
    var s = RegExp.$1, ms = RegExp.$2 || 0;
    return (s - 0) * 1000 + (ms - 0);
  } else if (/^-?[\d.]+$/.test(key)) {
    var float = parseFloat(key);
    return _.isNaN(float) ? otherwise : relative + float * 1000;
  } else {
    var m = moment(key);
    if (m.isValid()) {
      return m.valueOf();
    }
    return otherwise;
  }
};


module.exports = {
  opt: {},
  alias: {
    boolean:    'bool',
    integer:    'int',
    character:  ['char', 'letter'],
    string:     'str',
    float:      'double',
    objectId:   'oid',
    id:         ['increment', 'inc']
  },
  type: {

    boolean: def(function(self) {
      /**
       * @rule ([number probability = 0.5]) -> bool
       * @rule (string percentage) -> bool
       */
      return H.prob(self.percentage || self.probability);
    }),

    integer: def(function(self) {
      /**
       * @rule ([[int min = 0, ] int max = 100000]) -> int
       */
      return _.random(self.min, self.max);
    }),

    /**
     * @Date()    => 过去10年的随机 timestamp
     * @Date(0)   => 过去10年到未来10年之间的一个 timestamp
     * @Date(-2)  => 过去两年的随机 timestamp
     * @Date(3)   => 将来三年的随机 timestamp
     * @Date(-1, 3600)  => 过去一小时的随机 timestamp
     * @Date("3600", "7200")  => 将来两小时的随机 timestamp
     * @Date("2011-1-1", "2011-12-31 23:59:59") => 2011-1-1 00:00:00 到 2011-12-31 23:59:59 之间的随机数据
     *
     * 另外可以在上面所有的方法的参数首位加上 format 参数来指定返回的格式（默认是返回 10 位的 timestamp)，如
     * @Date('YYYY-MM-DD HH:mm:ss', -2)
     *
     * 格式字符串参考：http://momentjs.com/docs/#/parsing/string-format/
     *
     */
    date: def(function(self) {
      /**
       *
       * @defaults {format: timestamp}
       *
       * @rule ([string format,] [int flag = -10, [nature range]]) -> string
       * @rule ([string from, [string to]]) -> string
       * @rule ([string format,] string from, string to) -> string
       *
       */
      var from, to, now = new Date().getTime(), oneYearMs = 3600000 * 24 * 365;

      if ('flag' in self) {
        var flag = self.flag;
        var range = ('range' in self) ? self.range * 1000 : Math.abs(flag || 10) * oneYearMs;

        from = flag > 0 ? now : now - range;
        to = flag < 0 ? now : now + range;
      } else {
        from = toIntJSDate(self.from, now, now - oneYearMs);
        to = toIntJSDate(self.to, now, now + oneYearMs);
      }

      var random = _.random(from, to);
      if (self.format === 'timestamp') {
        return Math.round(random / 1000);
      } else if (self.format === 'jsTimestamp') {
        return Math.round(random);
      } else {
        return moment(random).format(self.format);
      }

    }),

    /**
     * NOTE 返回的是一个 string， 因为小数不好保留具体的位数（要返回 float 将第一个参数设置为 true)
     */
    float: def(function(self) {
      /**
       * @defaults {min: 0, max: 1, toFloat: false}
       *
       * @rule ([bool toFloat,] [string format = '1-3']) -> string
       * @rule ([bool toFloat,] [string format = '1-3',] number max) -> string
       * @rule ([bool toFloat,] [string format = '1-3',] number min, number max) -> string
       */
      var result = _.random(self.min, self.max, true);

      // 如果 format 设置不规范，就使用 1-10 模式，设置 '-5' => '1-5', '5-' => '5-10', '5' => '5-5'
      var dMin = 1, dMax = 10;
      var format = self.format.split('-').slice(0, 2);
      if (format.length < 2) format.unshift(format[0]);

      format = _.map(format, function(n, i) {
        var r = parseInt(n, 10);
        return _.isNaN(r) ? (i ? dMax : dMin) : r;
      });

      result = result.toFixed(_.random(format[0], format[1]));
      return self.toFloat ? parseFloat(result) : result;
    }),

    character: def(function(self) {
      /**
       * @rule ([string pool = 'alpha', bool usePreDefined = true]) -> string
       * @rule (string pool) -> string
       */
      var pools = this.pools, pool = self.pool;

      var letters = (self.usePreDefined && (pool in pools)) ? pools[pool] : pool;

      return letters.charAt(_.random(0, letters.length - 1));
    }),

    string: def(function(self) {
      /**
       * @defaults {min: 2, max: 12}
       *
       * @rule ([string pool = 'alpha' ] ) -> string
       * @rule ([string pool = 'alpha' ,] int length) -> string
       * @rule ([string pool = 'alpha' ,] int min, int max) -> string
       */
      var count = ('length' in self) ? self.length : _.random(self.min, self.max);

      return exec('@Char("' + self.pool + '", true).repeat(' + count + ', "")')
    }),
    objectId: def(function() {
      /**
       * @rule () -> string
       */
      return exec('@Str(0123456789abcdef, 24)');
    }),
    guid: def(function() {
      /**
       * @format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
       *    x is replaced with a random hexadecimal digit from 0 to f
       *    y is replaced with a random hexadecimal digit from 8 to b
       *
       * @rule () -> string
       *
       * @reference http://zh.wikipedia.org/wiki/%E5%85%A8%E5%B1%80%E5%94%AF%E4%B8%80%E6%A0%87%E8%AF%86%E7%AC%A6
       *
       */
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }),
    id: def(function(self) {
      /**
       * @rule ([string pool = 'default']) -> int
       */
      var pool = self.pool;
      if (!(pool in _idPools)) { _idPools[pool] = 1; }
      return _idPools[pool]++;
    }),

    range: def(function(self) {
      /**
       * @defaults {start: 0, step: 1}
       *
       * @rule (int stop) -> array
       * @rule (int start, int stop) -> array
       * @rule (int start, int stop, int step) -> array
       */

      return _.range(self.start, self.stop, self.step);
    })
  }
};







