import { StringBuilder } from './string-builder';
import * as vs from 'vscode';

export class SnippetStringBuilder {
  private readonly _snippet = new vs.SnippetString();

  append(value: string) {
    this._snippet.appendText(value.toString());

    return this;
  }

  appendLine(value: string = '') {
    this.append(value.toString() + '\n');
    return this;
  }

  appendSnippetTabstop(index?: number) {
    this._snippet.appendTabstop(index);

    return this;
  }

  appendSnippetPlaceholder(value: string | ((snippet: vs.SnippetString) => any), index?: number) {
    this._snippet.appendPlaceholder(value, index);

    return this;
  }

  appendSnippetVariable(name: string, defaultValue: string | ((snippet: vs.SnippetString) => any)) {
    this._snippet.appendVariable(name, defaultValue);

    return this;
  }

  toCommentValue(updateWithMap = false) {
    let sb = new StringBuilder();

    if (!updateWithMap) {
      sb.appendLine();
    }
    sb.appendLine('/**');

    const lines = this._snippet.value.split('\n');
    lines.forEach((line, i) => {
      if (line === '' && i === lines.length - 1) {
        return;
      }

      sb.append(' * ');
      sb.appendLine(line);
    });

    sb.appendLine(' */');

    return new vs.SnippetString(sb.toString());
  }
}
