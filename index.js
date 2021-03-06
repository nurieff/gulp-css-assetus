var
  AssetusList = require('./src/list')
  , AssetusCssReplacer = require('./src/css-replacer')
  , imagemin = require('imagemin')
  , through = require('through2').obj
  , mkdirp = require('mkdirp')
  , fs = require('fs')
  , pathPlugin = require('path')
  , prettyBytes = require('pretty-bytes')
  , imageminPngquant = require('imagemin-pngquant')
  ;

function Assetus(config) {

  this.config = {
    searchPrefix: 'assetus',
    saveImage: true,
    withImagemin: true,
    withImageminPlugins: null,
    imageDirCSS: '../images/',
    imageDirSave: 'public/images/'
  };

  /**
   * @type {Buffer}
   */
  this.css = null;

  /**
   * @type {String}
   */
  this.strCSS = null;

  this.imgStream = through();
  this.cssStream = through();
  this.retStream = null;

  /**
   * @type {Function}
   */
  this.endCallback = null;

  /**
   * @type {Array}
   */
  this.imgFiles = [];

  /**
   * @type {AssetusList}
   */
  this.AssetusList = null;

  this.rootPath = process.cwd() + '/';

  if (config) {
    for (var key in config) {
      if (!config.hasOwnProperty(key)) continue;

      if (key in this.config) {
        this.config[key] = config[key];
      }
    }
  }
}

Assetus.prototype.onData = function (file, encoding, cb) {
  this.css = file;
  cb();
};

Assetus.prototype.onEnd = function (cb) {

  if (!this.css) {
    this.imgStream.push(null);
    this.cssStream.push(null);
    return cb();
  }

  this.endCallback = cb;

  this.strCSS = this.css.contents.toString();
  this.AssetusList = new AssetusList(this);
  var self = this;

  var find = false;
  this.strCSS.replace(new RegExp(this.config.searchPrefix + "[\\-\\:]{1}([^\\(]+)\\(\\\"([^\\\"]+)\\\"(\\)|,\\s*?\\\"([^\\)\\\"]*)\\\")", 'ig'), function (str) {
    var sprtie = arguments[2];
    var method = arguments[1];
    var arg = arguments[4] ? arguments[4] : null;
    /**
     * @type {AssetusModel}
     */
    var sModel = self.AssetusList.push(sprtie);

    if (method.indexOf('url') !== -1 || method.indexOf('ihv') !== -1) {
      sModel.isSaveImage();
    }

    find = true;
    return str;
  });

  if (!find) {
    this.imgStream.push(null);
    this.cssStream.push(this.css);
    this.retStream.push(this.css);
    return cb();
  }

  this.AssetusList.run(this.runHandler.bind(this));
};

Assetus.prototype._saveFile = function (file, path, fromImagemin) {
  var filepath = path + file.path;

  var dirPath = pathPlugin.dirname(filepath);

  mkdirp(dirPath, function (err) {
    fs.unlink(filepath, function (err) {
      if (err) {}

      fs.writeFile(filepath, file.contents, function (err) {
        if (err) throw err;

        if (!fromImagemin) {
          console.log('assetus[save file]: ' + path + file.path);
        }
      });
    });
  });
};

Assetus.prototype.processingImagemin = function (name, buffer, callback) {
  imagemin.buffer(buffer, {
    plugins: this.config.withImageminPlugins ? this.config.withImageminPlugins : [
        imageminPngquant({
          quality: '60-70',
          speed: 1
        })
      ]
  })
    .then(function (data) {

      var originalSize = buffer.length;
      var optimizedSize = data.length;
      var saved = originalSize - optimizedSize;
      var percent = (originalSize > 0 ? (saved / originalSize) * 100 : 0).toFixed(1).replace(/\.0$/, '');
      var msg = saved > 0 ? '- saved ' + prettyBytes(saved) + ' (' + percent + '%)' : ' -';
      console.log('assetus[imagemin]: ' + name + ' ' + msg);

      callback(data);
    })
    .catch(function (err) {
      console.log('imagemin: ' + name + ' Error');
      console.log(err);
    });
};

Assetus.prototype._saveImagemin = function (file, path) {

  var self = this;

  imagemin.buffer(file.contents, {
    plugins: this.config.withImageminPlugins ? this.config.withImageminPlugins : [
      imageminPngquant({
        quality: '60-70',
        speed: 1
      })
    ]
  })
    .then(function (data) {

      var originalSize = file.contents.length;
      var optimizedSize = data.length;
      var saved = originalSize - optimizedSize;
      var percent = (originalSize > 0 ? (saved / originalSize) * 100 : 0).toFixed(1).replace(/\.0$/, '');
      var msg = saved > 0 ? '- saved ' + prettyBytes(saved) + ' (' + percent + '%)' : ' -';
      console.log('assetus[imagemin]: ' + path + file.path + ' ' + msg);

      file.contents = data;

      self._saveFile(file, path, true);
    })
    .catch(function (err) {
      console.log('imagemin: ' + file.path + ' Error');
      console.log(err);
    });
};

Assetus.prototype.runHandler = function (imgFile) {

  if (imgFile) {
    this.imgFiles.push(imgFile);
  }

  if (!this.AssetusList.isComplete()) return;

  this.strCSS = AssetusCssReplacer.makeCSS(this.strCSS, this.AssetusList, this.config.searchPrefix);

  var i, l, path;

  if (!this.config.saveImage) {
    for (i = 0, l = this.imgFiles.length; i < l; ++i) {
      this.imgStream.push(this.imgFiles[i]);
    }
  } else {
    path = this.config.imageDirSave.indexOf('/') === 0 ? this.config.imageDirSave : this.rootPath + this.config.imageDirSave;
    var self = this;
    mkdirp(path, function (err) {
      if (err) {
        console.log(err);
        return;
      }

      var i, l;
      if (!self.config.withImagemin) {
        for (i = 0, l = self.imgFiles.length; i < l; ++i) {
          self._saveFile(self.imgFiles[i], path);
        }
      } else {
        for (i = 0, l = self.imgFiles.length; i < l; ++i) {
          self._saveImagemin(self.imgFiles[i], path);
        }
      }

    });


  }

  this.css.contents = Buffer.from(this.strCSS);

  this.imgStream.push(null);
  this.cssStream.push(this.css);

  this.retStream.push(this.css);
  this.endCallback();
};

module.exports = function (config) {

  var S = new Assetus(config);

  S.retStream = through(S.onData.bind(S), S.onEnd.bind(S));
  S.retStream.css = S.cssStream;
  S.retStream.img = S.imgStream;

  return S.retStream;
};