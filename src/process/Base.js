var createProcess = require('../lib/core').createProcess,
  _ = require('lodash');


createProcess('title', function(result) {
  if (_.isString(result)) {
    return result.replace(/\b\w/g, function(raw) { return raw.toUpperCase(); });
  }
});


createProcess('cap', function(result) {
  if (_.isString(result)) {
    return result.charAt(0).toUpperCase() + result.substr(1);
  }
});


createProcess('upper', function(result) {
  if (_.isString(result)) {
    return result.toUpperCase();
  }
});


createProcess('lower', function(result) {
  if (_.isString(result)) {
    return result.toLowerCase();
  }
});