var AssetusModel = require('./model');

/**
 * @param {Assetus} assetus
 * @constructor
 */
var AssetusList = function (assetus) {

  /**
   * @type {Assetus}
   */
  this.assetus = assetus;
  this.length = 0;
  this.amountComplete = 0;

  /**
   * @type {Object.<String,AssetusModel>}
   */
  this.list = {};
};

/**
 * @param str
 * @return {AssetusModel}
 */
AssetusList.prototype.push = function (str) {
  if (str in this.list) {
    return this.list[str];
  }

  this.length += 1;

  return this.list[str] = new AssetusModel(this, str);
};

/**
 * @param str
 * @return {AssetusModel|null}
 */
AssetusList.prototype.get = function (str) {
  if (str in this.list) {
    return this.list[str];
  }

  return null;
};

AssetusList.prototype.incrementComplete = function () {
  ++this.amountComplete;
};

AssetusList.prototype.isComplete = function () {
  return this.length == this.amountComplete;
};

AssetusList.prototype.each = function (cb) {
  for (var str in this.list) {
    if (!this.list.hasOwnProperty(str)) continue;

    cb.call(null, this.list[str]);
  }
};

AssetusList.prototype.run = function (cb) {
  this.each(function (_assetus) {
    _assetus.run(cb)
  });
};

module.exports = AssetusList;