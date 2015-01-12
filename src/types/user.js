var JIM = require('../lib/Core'),
  _ = require('lodash'),
  C = require('../config');


var createType = JIM.createType,
  Types = JIM.Types;



/**
 * lang: zh/en  默认：en
 */
createType('Gender', 'Sex', function(opts) {
  return _.sample(opts.lang === 'zh' ? ['男', '女'] : ['male', 'female']);
}, {lang: 'en'});


/**
 * gender: 指定性别 male, female，默认从所有性别中随机选择一个名字
 */
createType('FirstName', function(opts) {
  var names = C.firstNames;
  names = (opts.gender in names) ? names[opts.gender] : names.male.concat(names.female)
  return _.sample(names);
});

createType('MiddleName', function() {
  return _.sample(C.middleNames);
});

createType('Surname', ['LastName', 'FamilyName'], function() {
  return _.sample(C.lastNames);
});

/**
 * showMiddleName:  是否显示中间名字，默认不显示
 * gender:          透传给 FirstName
 */
createType('Username', function(opts) {
  var result = [Types.FirstName({gender: opts.gender}).result()];
  if (opts.showMiddleName) {
    result.push(Types.MiddleName().result());
  }
  result.push(Types.Surname().result());
  return result.join(' ');
});