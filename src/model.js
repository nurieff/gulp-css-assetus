var
  glob = require('glob')
  , Vinyl = require('vinyl')
  , querystring = require('querystring')
  , sizeOf = require('image-size')
  , fileType = require('file-type')
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
  this._inline = null;
  this._width = null;
  this._height = null;
  this._mime = null;

  this._isSaveImage = false;

  var result = str.match(/\/([^\/]+?)\.?([a-z]*)$/i);
  this._name = 'name' in config ? config['name'] : result[1];
  this._ext = result[2] ? result[2] : null;
  this._basename = this._name + '.' + this._ext;
}

AssetusModel.prototype.run = function (callback) {
  fs.readFile(this._path, this._spriteHandler.bind(this, callback));
};

AssetusModel.prototype._spriteHandler = function (callback, err, result) {

  this._buffer = result;

  var ftype = fileType(result);

  this._mime = ftype.mime;
  if (!this._ext) {
    this._ext = ftype.ext;
  }

  var dimensions = sizeOf(result);
  this._width = dimensions.width;
  this._height = dimensions.height;

  if (!this._isSaveImage && this.list.assetus.config.withImagemin) {
    var self = this;
    this.list.assetus.processingImagemin('base64:' + this._path, this._buffer, function (data) {
      self.list.incrementComplete();
      self._buffer = data;
      callback(null);
    });
    return;
  }

  var imgFile = null;
  if (this._isSaveImage) {
    imgFile = new Vinyl({
      path: this._basename,
      contents: result
    });
  }

  this.list.incrementComplete();
  callback(imgFile);


};

AssetusModel.prototype.isSaveImage = function () {
  this._isSaveImage = true;
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

AssetusModel.prototype.inline = function () {

  if (!this._inline) {
    this._inline = this._buffer.toString('base64');
  }

  return 'url(data:' + this._mime + ';base64,' + this._inline + ')';
};

module.exports = AssetusModel;