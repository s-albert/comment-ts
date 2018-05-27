export class StringBuilder {
  private _text = '';

  append(text = '') {
    this._text += text.toString();
  }

  appendLine(text = '') {
    this._text += text.toString() + '\n';
  }

  toString() {
    return this._text;
  }
}
