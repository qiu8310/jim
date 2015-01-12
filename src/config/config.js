var langText = require('./text.js');


var chars = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  number: '0123456789',
  symbol: '!@#$%^&*()[]'
};
chars.alpha = chars.lower + chars.upper + chars.upper;
chars.all = chars.alpha + chars.symbol;




module.exports = {
  // 元数据
  meta: {

  },

  type: {
    Character: {
      pools: chars
    },
    Word: {
      langs: langText
    }

  }


};