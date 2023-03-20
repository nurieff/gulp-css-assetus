import AssetusList from "./src/list.js";
import AssetusCssReplacer from "./src/css-replacer.js";
import imagemin from "imagemin";
import through2 from "through2";
import { mkdirp } from 'mkdirp'
import fs from "node:fs";
import pathPlugin from "node:path";
import prettyBytes from "pretty-bytes";
import imageminPngquant from "imagemin-pngquant";

const through = through2.obj;

class Assetus {
  constructor(config) {
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
      for (let key in config) {
        if (!config.hasOwnProperty(key)) continue;

        if (key in this.config) {
          this.config[key] = config[key];
        }
      }
    }
  }

  onData(file, encoding, cb) {
    this.css = file;
    cb();
  }

  onEnd(cb) {
    if (!this.css) {
      this.imgStream.push(null);
      this.cssStream.push(null);
      return cb();
    }

    this.endCallback = cb;

    this.strCSS = this.css.contents.toString();
    this.AssetusList = new AssetusList(this);

    let find = false;
    this.strCSS.replace(new RegExp(this.config.searchPrefix + "[\\-\\:]{1}([^\\(]+)\\(\\\"([^\\\"]+)\\\"(\\)|,\\s*?\\\"([^\\)\\\"]*)\\\")", 'ig'), (str, ...args) => {
      const sprtie = args[1];
      const method = args[0];
      const arg = args[3] ? args[3] : null;
      /**
       * @type {AssetusModel}
       */
      const sModel = this.AssetusList.push(sprtie);

      if (method.indexOf('url') !== -1 || method.indexOf('ihv') !== -1) {
        sModel.setIsSaveImage();
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
  }

  saveFile(file, path, fromImagemin) {
    const filepath = path + file.path;
    const dirPath = pathPlugin.dirname(filepath);

    mkdirp(dirPath)
      .then(() => {
        fs.unlink(filepath, (err) => {
          if (err) {}

          fs.writeFile(filepath, file.contents, (err) => {
            if (err) throw err;

            if (!fromImagemin) {
              console.log('assetus[save file]: ' + path + file.path);
            }
          });
        });
      });
  }

  processingImagemin(name, buffer, callback) {
    imagemin.buffer(buffer, {
      plugins: this.config.withImageminPlugins ? this.config.withImageminPlugins : [
        imageminPngquant({
          quality: [.6, .7],
          speed: 1
        })
      ]
    })
      .then((data) => {
        const originalSize = buffer.length;
        const optimizedSize = data.length;
        const saved = originalSize - optimizedSize;
        const percent = (originalSize > 0 ? (saved / originalSize) * 100 : 0).toFixed(1).replace(/\.0$/, '');
        const msg = saved > 0 ? '- saved ' + prettyBytes(saved) + ' (' + percent + '%)' : ' -';
        console.log('assetus[imagemin]: ' + name + ' ' + msg);

        callback(data);
      })
      .catch((err) => {
        console.log('imagemin: ' + name + ' Error');
        console.log(err);
      });
  }

  saveImagemin(file, path) {
    imagemin.buffer(file.contents, {
      plugins: this.config.withImageminPlugins ? this.config.withImageminPlugins : [
        imageminPngquant({
          quality: [.6, .7],
          speed: 1
        })
      ]
    })
      .then((data) => {
        const originalSize = file.contents.length;
        const optimizedSize = data.length;
        const saved = originalSize - optimizedSize;
        const percent = (originalSize > 0 ? (saved / originalSize) * 100 : 0).toFixed(1).replace(/\.0$/, '');
        const msg = saved > 0 ? '- saved ' + prettyBytes(saved) + ' (' + percent + '%)' : ' -';
        console.log('assetus[imagemin]: ' + path + file.path + ' ' + msg);

        file.contents = data;

        this.saveFile(file, path, true);
      })
      .catch((err) => {
        console.log('imagemin: ' + file.path + ' Error');
        console.log(err);
      });
  }

  runHandler(imgFile) {
    if (imgFile) {
      this.imgFiles.push(imgFile);
    }

    if (!this.AssetusList.isComplete()) return;

    this.strCSS = AssetusCssReplacer.makeCSS(this.strCSS, this.AssetusList, this.config.searchPrefix);

    if (!this.config.saveImage) {
      for (let i = 0, l = this.imgFiles.length; i < l; ++i) {
        this.imgStream.push(this.imgFiles[i]);
      }
    } else {
      const path = this.config.imageDirSave.indexOf('/') === 0 ? this.config.imageDirSave : this.rootPath + this.config.imageDirSave;
      mkdirp(path)
        .then(() => {
          if (!this.config.withImagemin) {
            for (let i = 0, l = this.imgFiles.length; i < l; ++i) {
              this.saveFile(this.imgFiles[i], path);
            }
          } else {
            for (let i = 0, l = this.imgFiles.length; i < l; ++i) {
              this.saveImagemin(this.imgFiles[i], path);
            }
          }
        });
    }

    this.css.contents = Buffer.from(this.strCSS);

    this.imgStream.push(null);
    this.cssStream.push(this.css);

    this.retStream.push(this.css);
    this.endCallback();
  }
}

export default function (config) {
  const S = new Assetus(config);

  S.retStream = through(S.onData.bind(S), S.onEnd.bind(S));
  S.retStream.css = S.cssStream;
  S.retStream.img = S.imgStream;

  return S.retStream;
}