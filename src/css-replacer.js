/**
 * @param {String} css
 * @param {AssetusList} AssetusList
 * @param {String} searchPrefix
 * @constructor
 */
function AssetusCssReplacer(css, AssetusList, searchPrefix) {
  /**
   * @type {String}
   */
  this.css = css;

  this._searchPrefix = searchPrefix;

  /**
   * @type {AssetusList}
   */
  this.AssetusList = AssetusList;
}

AssetusCssReplacer.prototype._reg = function (mod, dopArgs) {

  var r = [];
  r.push(this._searchPrefix);
  if (mod) {
    if (Array.isArray(mod)) {
      r.push("\\-(" + mod.join('|') + ')');
    } else {
      r.push("\\-" + mod);
    }
  }

  if (dopArgs) {
    r.push("\\(\\\"([^\\)\\\"]+)\\\"");
    r.push(",?\\s*?\\\"?([^\\)\\\"]*)\\\"?\\)");
  } else {
    r.push("\\(\\\"([^\\)\\\"]+)\\\"\\)");
  }

  return new RegExp(r.join(''), 'ig');
};

AssetusCssReplacer.prototype._regAsProperty = function (mod, dopArgs) {

  var r = [];
  r.push(this._searchPrefix + '\\:\\s*?');

  if (Array.isArray(mod)) {
    r.push("(" + mod.join('|') + ')');
  } else {
    r.push(mod);
  }


  if (dopArgs) {
    r.push("\\(\\\"([^\\)\\\"]+)\\\"");
    r.push(",?\\s*?\\\"?([^\\)\\\"]*)\\\"?\\)");
  } else {
    r.push("\\(\\\"([^\\)\\\"]+)\\\"\\)");
  }

  return new RegExp(r.join(''), 'ig');
};

AssetusCssReplacer.prototype._common = function () {

  var allow = ['width','height'];
  var self = this;
  this.css = this.css.replace(this._reg(allow, true), function () {
    var propertiy = arguments[1];
    var str = arguments[2];

    if (!self.AssetusList.get(str)) {
      if (['height','width'].indexOf(propertiy) !== -1) {
        return 'auto';
      }

      return '';
    }

    return self.AssetusList.get(str)[propertiy]();
  });

  return this;
};

AssetusCssReplacer.prototype._forParent = function () {
  var allow = ['url','size','inline'];
  var self = this;
  this.css = this.css.replace(this._reg(allow), function () {
    var propertiy = arguments[1];
    var str = arguments[2];

    if (!self.AssetusList.get(str)) {
      if (propertiy === 'size') {
        return '';
      }

      return '';
    }

    return self.AssetusList.get(str)[propertiy]();
  });

  return this;
};

AssetusCssReplacer.prototype._ihw = function () {
  var self = this;
  this.css = this.css.replace(this._regAsProperty('ihw', true), function () {
    var str = arguments[1];
    var img = arguments[2];

    if (!img || !self.AssetusList.get(str)) {
      return '';
    }

    return [
      'background-image: ' + self.AssetusList.get(str).position(),
      'height: ' + self.AssetusList.get(str).height(),
      'width: ' + self.AssetusList.get(str).width()
    ].join(';');
  });

  return this;
};

/**
 * @returns {AssetusCssReplacer}
 */
AssetusCssReplacer.prototype.run = function () {
    this._forParent()
    ._common()
    ._ihw()
  ;

  return this;
};

/**
 * @returns {String}
 */
AssetusCssReplacer.prototype.getCss = function () {
  return this.css;
};

/**
 * @param {String} css
 * @param {AssetusList} AssetusList
 * @param {String} searchPrefix
 * @returns {String}
 */
AssetusCssReplacer.makeCSS = function (css, AssetusList, searchPrefix) {
  var R = new AssetusCssReplacer(css, AssetusList, searchPrefix);
  return R.run().getCss();
};

module.exports = AssetusCssReplacer;