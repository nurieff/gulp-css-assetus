class AssetusCssReplacer {
  /**
   * @param {String} css
   * @param {AssetusList} AssetusList
   * @param {String} searchPrefix
   * @constructor
   */
  constructor(css, AssetusList, searchPrefix) {
    /**
     * @type {String}
     */
    this.css = css;

    this.searchPrefix = searchPrefix;

    /**
     * @type {AssetusList}
     */
    this.AssetusList = AssetusList;
  }

  reg(mod, dopArgs) {
    const r = [];
    r.push(this.searchPrefix);
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
  }

  regAsProperty(mod, dopArgs) {
    const r = [];
    r.push(this.searchPrefix + '\\:\\s*?');

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
  }

  common() {
    const allow = ['width','height'];
    this.css = this.css.replace(this.reg(allow, true), (...args) => {
      const propertiy = args[1];
      const str = args[2];

      if (!this.AssetusList.get(str)) {
        if (allow.includes(propertiy)) {
          return 'auto';
        }

        return '';
      }

      return this.AssetusList.get(str)[propertiy]();
    });

    return this;
  }

  forParent() {
    const allow = ['url', 'size', 'inline'];
    this.css = this.css.replace(this.reg(allow), (...args) => {
      const propertiy = args[1];
      const str = args[2];

      if (!this.AssetusList.get(str)) {
        if (propertiy === 'size') {
          return '';
        }

        return '';
      }

      return this.AssetusList.get(str)[propertiy]();
    });

    return this;
  }

  ihw() {
    this.css = this.css.replace(this.regAsProperty('ihw', true), (...args) => {
      const str = args[1];
      const img = args[2];

      if (!img || !this.AssetusList.get(str)) {
        return '';
      }

      return [
        'background-image: ' + this.AssetusList.get(str).position(),
        'height: ' + this.AssetusList.get(str).height(),
        'width: ' + this.AssetusList.get(str).width()
      ].join(';');
    });

    return this;
  }

  run() {
    this.forParent()
      .common()
      .ihw()
    ;

    return this;
  }

  getCss() {
    return this.css;
  }
}

/**
 * @param {String} css
 * @param {AssetusList} AssetusList
 * @param {String} searchPrefix
 * @returns {String}
 */
AssetusCssReplacer.makeCSS = function (css, AssetusList, searchPrefix) {
  const R = new AssetusCssReplacer(css, AssetusList, searchPrefix);
  return R.run().getCss();
};

export default AssetusCssReplacer;