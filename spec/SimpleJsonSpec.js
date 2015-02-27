/* global describe, it, expect, require */


describe('SimpleJson', function() {

  // TODO
  var parse = function() {};

  describe('Basic Parser', function() {

    it('Should parse literal boolean', function() {
      expect(parse('true')).toBe(true);
      expect(parse('True')).toBe(true);
      expect(parse('TRUE')).toBe(true);
      expect(parse('false')).toBe(false);
      expect(parse('False')).toBe(false);
      expect(parse('FALSE')).toBe(false);

      // opposite
      expect(parse('TRuE')).not.toBe(true);
      expect(parse('FAlSE')).not.toBe(false);
    });

    it('Should parse literal null', function() {
      expect(parse('null')).toBe(null);
      expect(parse('Null')).toBe(null);
      expect(parse('NULL')).toBe(null);

      // opposite
      expect(parse('NUlL')).not.toBe(null);
    });

    it('Should parse literal number', function() {
      expect(parse('0')).toBe(0);
      expect(parse('1')).toBe(1);
      expect(parse('-1')).toBe(-1);
      expect(parse('12')).toBe(12);
      expect(parse('1.2')).toBe(1.2);
      expect(parse('1.2e2')).toBe(120);
      expect(parse('1.2e+2')).toBe(120);
      expect(parse('1.2e-2')).toBe(0.012);
      expect(parse('-1.2e-2')).toBe(-0.012);

    });

    it('Should parse literal string', function() {
      expect(parse('"string"')).toBe("string");
      expect(parse('"true"')).toBe("true");
      expect(parse('"false"')).toBe("false");
      expect(parse('"null"')).toBe("null");
      expect(parse('"2"')).toBe("2");
      expect(parse('"0"')).toBe("0");
      expect(parse('""')).toBe("");
    });

  });

  describe('Object Parser', function() {
    it('Should parse empty object', function() {
      expect(parse('{}')).toEqual({});
      expect(parse('{ }')).toEqual({});
    });
  });

  describe('Array Parser', function() {
    it('Should parse empty array', function() {
      expect(parse('[]')).toEqual([]);
      expect(parse('[ ]')).toEqual([]);
    });
  });

  describe('Escape Parser', function() {});




});