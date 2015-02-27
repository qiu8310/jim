/*
 *
 * http://github.com/qiu8310/elegant.string.range
 *
 * Copyright (c) 2014 Zhonglei Qiu
 * Licensed under the MIT license.
 *
 *
 *
 * var rc = new RangedContent()
 * rc.addRange(...)
 * rc.addRange(...)
 *
 * rc.replace(fn)
 *
 */

(function() {

  function RangeOverlapError(start, end, range) {
    this.name = 'TagsOverlapError';
    this.message = 'Start end index [' + start + '-' + end + '] overlap with Range[' + range.start + '-' + range.end +']';
  }
  RangeOverlapError.prototype = new Error();
  RangeOverlapError.prototype.constructor = RangeOverlapError;


  /**
   *
   * @param start {integer} start index of your content
   * @param end {integer} end index of your content
   * @param data {*} [optional] this is for yourself
   * @constructor
   */
  function Range(start, end, data) {
    this.start = start;
    this.end = end;
    this.data = data;
  }


  function RangedContent(content) {
    this.content = content;
    this.ranges = [];
  }

  RangedContent.prototype = {
    /**
     * 添加一个 Range 到 RangedContent 内
     *
     * @memberOf RangedContent
     * @param start {integer}
     * @param end {integer}
     * @param data {*}
     *
     * @throws RangeOverlapError
     *
     * @returns RangedContent
     *
     */
    addRange: function(start, end, data) {
      var overlapRange = this.getOverlapTag(start, end),
        index = this.ranges.length;
      if (!overlapRange) {
        this.each(function(r, i) {
          if (end <= r.start) {
            index = i;
            return false;
          }
        });
        this.ranges.splice(index, 0, new Range(start, end, data));
      } else {
        throw new RangeOverlapError(start, end, overlapRange);
      }
      return this;
    },

    /**
     *
     * 遍历它内部的 ranges
     *
     * @memberOf RangedContent
     * @param fn {function} 迭代的函数，传给它的参数是 (range, index, rangedContent)
     * @returns {boolean} 遍历的时候 fn 返回了 false，则此函数就返回 false，否则返回 true
     */
    each: function(fn) {
      var i, l = this.ranges.length, tag;
      for (i = 0; i < l; i++) {
        tag = this.ranges[i];
        if (false === fn(tag, i, this)) {
          return false;
        }
      }
      return true;
    },

    /**
     * 得到和指定的 start, end 重叠的 range，没有找到则返回 false
     * @param start {integer}
     * @param end {integer}
     * @returns {Range|boolean}
     */
    getOverlapTag: function(start, end) {
      var result = false;
      this.each(function(range) {
        if (!(end <= range.start || start >= range.end)) {
          result = range;
          return false;
        }
      });
      return result;
    },


    /**
     * 判断是否能够添加某个 str 做为 tag，主要是为了避免两个 tag 之间有 overlap
     *
     * @memberOf RangedContent
     * @param start {integer}  Range 的起始位置
     * @param end {integer} Range 的结束位置
     * @returns {boolean}
     */
    canAddTag: function(start, end) {
      return !this.getOverlapTag(start, end);
    },

    /**
     * 将所有 content 中所有 range 相关的区域替换成 fn 中所返回的内容
     * @param fn
     * @returns {string}
     */
    replace: function(fn) {
      var rtn = [],
        start = 0,
        content = this.content;
      this.each(function(range, i, ref) {
        rtn.push(content.substring(start, range.start));
        rtn.push(fn(range, i, ref));
        start = range.end;
      });

      rtn.push(content.substr(start));
      return rtn.join('');
    }
  };

  RangedContent.Range = Range;
  RangedContent.RangeOverlapError = RangeOverlapError;


  if ( typeof module === 'object' && typeof module.exports === 'object' ) {
    module.exports = RangedContent;
  } else {
    (typeof window !== 'undefined' ? window : this).RangedContent = RangedContent;
  }


})();
