function ArgumentsError(msg) {
  this.name = 'ArgumentsError';
  this.message = msg || 'Arguments error';
}
ArgumentsError.prototype = new Error();
ArgumentsError.prototype.constructor = ArgumentsError;

module.exports = ArgumentsError;