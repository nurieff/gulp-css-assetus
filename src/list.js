import AssetusModel from "./model.js";

export default class AssetusList {

  /**
   * @type {Assetus}
   */
  assetus = null;

  constructor(assetus) {
    this.assetus = assetus;
    this.length = 0;
    this.amountComplete = 0;

    /**
     * @type {Object.<String,AssetusModel>}
     */
    this.list = {};
  }

  push(str) {
    if (str in this.list) {
      return this.list[str];
    }

    this.length += 1;

    return this.list[str] = new AssetusModel(this, str);
  }

  get(str) {
    if (str in this.list) {
      return this.list[str];
    }

    return null;
  }

  incrementComplete() {
    ++this.amountComplete;
  }

  isComplete() {
    return this.length === this.amountComplete;
  }

  each(cb) {
    for (let str in this.list) {
      if (!this.list.hasOwnProperty(str)) continue;

      cb.call(null, this.list[str]);
    }
  }

  run(cb) {
    this.each((assetus) => {
      assetus.run(cb)
    });
  }
}