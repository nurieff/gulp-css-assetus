var
  glob = require('glob')
  , gutil = require('gulp-util')
  , querystring = require('querystring')
  , sizeOf = require('image-size')
  , fs = require('fs')
  ;

/**
 * @param {AssetusList} list
 * @param {String} str
 * @constructor
 */
function AssetusModel(list, str) {

  var config = {};
  if (str.indexOf('?') !== false) {
    str = str.replace(/\?(.+)$/ig, function (s) {
      config = querystring.parse(arguments[1]);
      return '';
    });
  }

  /**
   * @type {AssetusList}
   */
  this.list = list;

  /**
   * @type {String}
   * @private
   */
  this._str = str;
  this._path = str.indexOf('/') === 0 ? str : this.list.assetus.rootPath + str;

  this._buffer = null;
  this._width = null;
  this._height = null;

  var result = str.match(/\/([^\/]+?)\.([a-z]{2,})$/i);
  this._name = 'name' in config ? config['name'] : result[1];
  this._ext = result[2];
  this._basename = this._name + '.' + this._ext;
}

AssetusModel.prototype.run = function (callback) {
  fs.readFile(this._path, this._spriteHandler.bind(this, callback));
};

AssetusModel.prototype._spriteHandler = function (callback, err, result) {

  this._buffer = result;

  var dimensions = sizeOf(result);
  this._width = dimensions.width;
  this._height = dimensions.height;

  var imgFile = new gutil.File({
    path: this._basename,
    contents: result
  });

  this.list.incrementComplete();
  callback(imgFile);
};

AssetusModel.prototype.url = function () {
  return 'url("' + this.list.assetus.config.imageDirCSS + this._basename + '")';
};

AssetusModel.prototype.height = function () {

  return this._height + 'px';
};

AssetusModel.prototype.width = function (spriteName) {

  return this._width + 'px';
};

AssetusModel.prototype.size = function () {
  return this._width + 'px ' + this._height + 'px';
};

module.exports = AssetusModel;