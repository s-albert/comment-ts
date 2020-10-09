export class StringBuilder {
  private _text = '';

  append(text = ''): void {
    this._text += text.toString();
  }

  /**
   * TODO: comment appendLine
   * Appends line
   * @param [text]
   */
  appendLine(text = ''): void {
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
