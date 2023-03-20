import Vinyl from 'vinyl';
import querystring from 'node:querystring';
import sizeOf from 'image-size';
import {fileTypeFromFile as fileType} from 'file-type';
import fs from 'node:fs';

export default class AssetusModel {

  config = {}

  /**
   * @type {AssetusList}
   */
  list = null;

  constructor(list, str) {
    if (str && str.indexOf('?') !== false) {
      str = str.replace(/\?(.+)$/ig, (...args) => {
        this.config = querystring.parse(args[1]);
        return '';
      });
    }

    this.list = list;
    this.str = str;

    this.init();
  }

  init() {
    this.path = this.str.indexOf('/') === 0 ? this.str : this.list.assetus.rootPath + this.str;

    this.buffer = null;
    this.resultInline = null;
    this.resultWidth = null;
    this.resultHeight = null;
    this.mime = null;
    this.isSaveImage = false;

    const result = this.str.match(/\/([^\/]+?)\.?([a-z]*)$/i);
    this.name = 'name' in this.config ? this.config['name'] : result[1];
    this.ext = result[2] ? result[2] : null;
    this.basename = this.name + '.' + this.ext;
  }

  run(callback) {
    fs.readFile(this.path, this.handler.bind(this, callback));
  }

  handler(callback, err, result) {
    this.buffer = result;

    fileType(this.path).then((ftype) => {
      this.mime = ftype.mime;
      if (!this.ext) {
        this.ext = ftype.ext;
      }

      var dimensions = sizeOf(result);
      this.resultWidth = dimensions.width;
      this.resultHeight = dimensions.height;

      if (!this.isSaveImage && this.list.assetus.config.withImagemin) {
        this.list.assetus.processingImagemin('base64:' + this.path, this.buffer, (data) => {
          this.list.incrementComplete();
          this.buffer = data;
          callback(null);
        });
        return;
      }

      let imgFile = null;
      if (this.isSaveImage) {
        imgFile = new Vinyl({
          path: this.basename,
          contents: result
        });
      }

      this.list.incrementComplete();
      callback(imgFile);
    });
  }

  setIsSaveImage() {
    this.isSaveImage = true;
  };

  url() {
    return 'url("' + this.list.assetus.config.imageDirCSS + this.basename + '")';
  };

  height() {
    return this.resultHeight + 'px';
  };

  width() {
    return this.resultWidth + 'px';
  };

  size() {
    return this.resultWidth + 'px ' + this.resultHeight + 'px';
  };

  inline() {
    if (!this.resultInline) {
      this.resultInline = this.buffer.toString('base64');
    }

    return 'url(data:' + this.mime + ';base64,' + this.resultInline + ')';
  };
}