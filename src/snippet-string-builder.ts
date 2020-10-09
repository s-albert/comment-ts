import { StringBuilder } from './string-builder';
import * as vs from 'vscode';

export class SnippetStringBuilder {
  private readonly _snippet = new vs.SnippetString();

  append(value: string): this {
    this._snippet.appendText(value.toString());

    return this;
  }

  appendLine(value = ''): this {
    this.append(value.toString() + '\n');
    return this;
  }

  appendSnippetTabstop(index?: number): this {
    this._snippet.appendTabstop(index);

    return this;
  }

  appendSnippetPlaceholder(value: string | ((snippet: vs.SnippetString) => this), index?: number): this {
    this._snippet.appendPlaceholder(value, index);

    return this;
  }

  appendSnippetVariable(name: string, defaultValue: string | ((snippet: vs.SnippetString) => this)): this {
    this._snippet.appendVariable(name, defaultValue);

    return this;
  }

  toCommentValue(): vs.SnippetString {
    const sb = new StringBuilder();

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
