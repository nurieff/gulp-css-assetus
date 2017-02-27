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

  var result = str.match(/\/([^\/]+)\/\*\.([a-z]{2,})$/i);
  this._name = 'name' in config ? config['name'] : result[1];
  this._ext = result[2];
  this._basename = this._name + '.' + this._ext;
}

AssetusModel.prototype.run = function (callback) {
  fs.readFile(this._path, this._spriteHandler.bind(this, callback));
};

AssetusModel.prototype._spriteHandler = function (callback, err, result) {

  this._buffer = result;

  console.log(result);

  var imgFile = new gutil.File({
    path: this._basename,
    contents: result
  });

  this.list.incrementComplete();
  callback(imgFile);
};

AssetusModel.prototype.isFull = function () {
  this._isFull = true;
};

AssetusModel.prototype.used = function (u) {
  if (this._used.indexOf(u) === -1) {
    this._used.push(u);
  }
};

AssetusModel.prototype.url = function () {
  return 'url("' + this.list.assetus.config.imageDirCSS + this._basename + '")';
};

AssetusModel.prototype.height = function (spriteName) {

  if (!spriteName) {
    return this._spriteHeight + 'px';
  }

  return this._spriteImages[spriteName].height + 'px';
};

AssetusModel.prototype.width = function (spriteName) {

  if (!spriteName) {
    return this._spriteWidth + 'px';
  }

  return this._spriteImages[spriteName].width + 'px';
};

AssetusModel.prototype.size = function () {
  return this._spriteWidth + 'px ' + this._spriteHeight + 'px';
};

module.exports = AssetusModel;