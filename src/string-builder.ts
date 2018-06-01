export class StringBuilder {
  private _text = '';

  append(text = '') {
    this._text += text.toString();
  }

  /**
   * // TODO: comment appendLine
   * Appends line
   * @param [text] test x
   */
  appendLine(text = '') {
    this._text += text.toString() + '\n';
  }

  /**
   * // TODO: comment toString
   * To string
   * @returns string
   */
  toString(): string {
    return this._text;
  }
}
