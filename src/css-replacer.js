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

  var allow = ['width','height','position'];
  var self = this;
  this.css = this.css.replace(this._reg(allow, true), function () {
    var propertiy = arguments[1];
    var str = arguments[2];
    var img = arguments[3];

    if (!self.AssetusList.get(str)) {
      if (['height','width'].indexOf(propertiy) !== -1) {
        return 'auto';
      }

      return '0px 0px';
    }

    if (!img) {
      if (propertiy === 'position') {
        return 'auto';
      }
    }

    return self.AssetusList.get(str)[propertiy](img);
  });

  return this;
};

AssetusCssReplacer.prototype._forParent = function () {
  var allow = ['url','size'];
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

AssetusCssReplacer.prototype._phw = function () {
  var self = this;
  this.css = this.css.replace(this._regAsProperty('phw', true), function () {
    var str = arguments[1];
    var img = arguments[2];

    if (!img || !self.AssetusList.get(str)) {
      return '';
    }

    return [
      'background-position: ' + self.AssetusList.get(str).position(img),
      'height: ' + self.AssetusList.get(str).height(img),
      'width: ' + self.AssetusList.get(str).width(img)
    ].join(';');
  });

  return this;
};

AssetusCssReplacer.prototype._each = function () {
  var self = this;

  var r = [];
  r.push('([^\\s\\{]+)\\s*?\\{');
  r.push('([^\\}]+|\\n+)?');
  r.push(this._searchPrefix + '\\:\\s*?');
  r.push('each');
  r.push("\\(\\\"([^\\)\\\"]+)\\\"\\);?");
  r.push('([^\\}]+|\\n+)?');
  r.push('\\}');

  this.css = this.css.replace(new RegExp(r.join(''), 'gi'), function () {

    var prefix = arguments[1];
    var before = arguments[2];
    var str = arguments[3];
    var after = arguments[4];

    if (prefix.indexOf('.') === -1) {
      prefix = prefix + '.';
    }

    if (!self.AssetusList.get(str)) {
      return '';
    }

    var css = [];

    var nodes = self.AssetusList.get(str).all();
    var n;

    for (var key in nodes) {
      if (!nodes.hasOwnProperty(key)) continue;
      n = [];
      n.push(prefix.trim() + '-' + key);
      n.push('{');
      n.push(before);
      n.push([
        "background-position:" + nodes[key].position,
        "height:" + nodes[key].height,
        "width:" + nodes[key].width,
        ''
      ].join("; "));
      n.push(after);
      n.push('}');

      css.push(n.join(' '));
    }

    return css.join("\n");
  });

  return this;
};

/**
 * @returns {AssetusCssReplacer}
 */
AssetusCssReplacer.prototype.run = function () {
    this._forParent()
    ._common()
    ._phw()
    ._each()
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