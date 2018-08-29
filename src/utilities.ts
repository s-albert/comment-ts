import * as path from 'path';
import * as ts from 'typescript';
import * as vs from 'vscode';

const supportedNodeKinds = [
  ts.SyntaxKind.ClassDeclaration,
  ts.SyntaxKind.PropertyDeclaration,
  ts.SyntaxKind.GetAccessor,
  ts.SyntaxKind.SetAccessor,
  ts.SyntaxKind.InterfaceDeclaration,
  ts.SyntaxKind.EnumDeclaration,
  ts.SyntaxKind.EnumMember,
  ts.SyntaxKind.FunctionDeclaration,
  ts.SyntaxKind.ArrowFunction,
  ts.SyntaxKind.MethodDeclaration,
  ts.SyntaxKind.MethodSignature,
  ts.SyntaxKind.PropertySignature,
  ts.SyntaxKind.Constructor,
  ts.SyntaxKind.FunctionExpression,
  ts.SyntaxKind.VariableDeclaration
];

export function indexOfBlank(s: string, pos = 0): number {
  return s.substr(pos).search(/\s/g);
}

/**
 * @description Adds to map
 * @author S.Albert
 * @param tag
 * @param lineText
 * @param map
 * @returns true if to map
 */
function addToMap(tag: string, lineText: string, map: Map<string, string>): boolean {
  const index = lineText.indexOf(tag);
  if (index > 0) {
    let parse = lineText.substring(index + tag.length);
    map.set(tag, parse.trim());
    return true;
  } else {
    return false;
  }
}
/**
 * // TODO: comment createMap
 * @description Creates map
 * @author S.Albert
 * @param editor
 * @param selection
 * @returns map
 */
export function createMap(editor: vs.TextEditor, selection: vs.Selection): Map<string, string> {
  const startLine = selection.start.line;
  const endLine = selection.end.line;

  const map = new Map<string, string>();

  for (let currentLine = startLine; currentLine <= endLine; currentLine++) {
    const line = editor.document.lineAt(currentLine);
    const firstChar = line.firstNonWhitespaceCharacterIndex;
    const lineText = line.text;
    if (lineText.substr(firstChar, 2) === '* ') {
      const param = lineText.indexOf('@param');
      if (param > 0) {
        let parse = lineText.substring(param + '@param'.length);
        parse = parse.trim();
        const blank = indexOfBlank(parse);
        if (blank > 0) {
          map.set(parse.substring(0, blank).trim(), parse.substring(blank).trim());
        }
        continue;
      } else if (addToMap('@returns', lineText, map)) {
        continue;
      } else if (addToMap('@description', lineText, map)) {
        continue;
      } else if (addToMap('@author', lineText, map)) {
        continue;
      } else if (addToMap('@template', lineText, map)) {
        continue;
      } else if (addToMap('// TODO:', lineText, map)) {
        continue;
      } else {
        const parse = lineText.substring(firstChar + 2).trim();
        if (parse.length > 0) {
          if (map.has('@description')) {
            const currentText = map.get('@description');
            map.set('@description', `${currentText}\n${parse}`);
          } else {
            map.set('@description', parse);
          }
        }
      }
    }
  }

  return map;
}

export function emptyArray(arr: any[]) {
  while (arr.length > 0) {
    arr.pop();
  }
}

export function getDocumentFileName(document: vs.TextDocument) {
  // Fix directory delimiters
  const fileName = fixWinPath(document.fileName);

  // Determine if this is a TypeScript document
  const isTypeScript = document.languageId === 'typescript' || document.languageId === 'typescriptreact';

  // Append ".js" if this is not a TypeScript document, but the extension is not ".js"
  // TypeScript's file resolution for allowJs seems to ignore documents if they're missing the extension
  const adjustedFileName = !isTypeScript && path.extname(fileName) !== 'js' ? fileName + '.js' : fileName;
  return ts.sys.useCaseSensitiveFileNames ? adjustedFileName.toLowerCase() : adjustedFileName;
}

export function fixWinPath(filePath: string) {
  if (path.sep === '\\') {
    return filePath.replace(/\\/g, '/');
  }

  return filePath;
}

/**
 * Joins from
 * @param str
 * @param [from]
 * @returns
 */
export function joinFrom(str: string[], from = 0): string {
  if (str && str.length >= from) {
    const newArray = str.slice(from);
    return newArray.join(' ');
  } else {
    return '';
  }
}

/**
 * Separates camelcase string
 * @param str
 * @param [separation]
 * @returns
 */
export function separateCamelcaseString(str: string, separation = ' '): string {
  str = trimUnderscores(str.trim());
  const regex = /[\s_]+|([a-z0-9])(?=[A-Z])/g;
  const result = str.replace(regex, '$1' + separation).toLowerCase();
  return result;
}

/**
 * Separates camelcase noun string
 * @param str
 * @returns
 */
export function separateCamelcaseNounString(str: string): string {
  str = separateCamelcaseString(str);
  if (str) {
    const i = str.indexOf(' ');
    if (i > 0) {
      str = str.substring(i + 1);
    }
  }
  return str;
}

/**
 * Trims underscores
 * @param str
 * @returns
 */
export function trimUnderscores(str: string): string {
  const result = str.replace(/^_/, '');
  return result;
}
/**
 * Separates camelcase string
 * @param str
 * @param [cut]
 * @returns
 */
export function separateCamelcase(str: string, cut: number = 0): string[] {
  const x = separateCamelcaseString(str, ';');
  let result = x.split(';');
  if (cut > 0) {
    result.splice(0, cut);
  }
  return result;
}

/**
 * Capitalizes first letter
 * @param str
 * @returns
 */
export function capitalizeFirstLetter(str: string): string {
  if (str && str !== '') {
    return str.charAt(0).toUpperCase() + str.slice(1);
  } else {
    return str;
  }
}

export function findChildForPosition(node: ts.Node, position: number): ts.Node {
  let lastMatchingNode: ts.Node;

  const findChildFunc = (n: ts.Node) => {
    const start = n.pos;
    const end = n.end;

    if (start > position) {
      return;
    }

    if (start <= position && end >= position) {
      lastMatchingNode = n;
    }

    n.getChildren().forEach(findChildFunc);
  };

  findChildFunc(node);

  return lastMatchingNode;
}

export function findFirstChildOfKindDepthFirst(node: ts.Node, kinds = supportedNodeKinds): ts.Node {
  let children = node.getChildren();
  for (let c of children) {
    if (nodeIsOfKind(c, kinds)) {
      return c;
    }

    const matching = findFirstChildOfKindDepthFirst(c, kinds);
    if (matching) {
      return matching;
    }
  }

  return null;
}

export function findChildrenOfKind(node: ts.Node, kinds = supportedNodeKinds) {
  let children: ts.Node[] = [];

  node.getChildren().forEach((c) => {
    if (nodeIsOfKind(c, kinds)) {
      children.push(c);
    }

    children = children.concat(findChildrenOfKind(c, kinds));
  });

  return children;
}

export function findNonVoidReturnInCurrentScope(node: ts.Node) {
  let returnNode: ts.ReturnStatement;

  const children = node.getChildren();

  returnNode = <ts.ReturnStatement>children.find((n) => n.kind === ts.SyntaxKind.ReturnStatement);

  if (returnNode) {
    if (returnNode.getChildren().length > 1) {
      return returnNode;
    }
  }

  for (let child of children) {
    if (
      child.kind === ts.SyntaxKind.FunctionDeclaration ||
      child.kind === ts.SyntaxKind.FunctionExpression ||
      child.kind === ts.SyntaxKind.ArrowFunction
    ) {
      continue;
    }

    returnNode = findNonVoidReturnInCurrentScope(child);
    if (returnNode) {
      return returnNode;
    }
  }

  return returnNode;
}

export function findVisibleChildrenOfKind(node: ts.Node, kinds = supportedNodeKinds) {
  let children = findChildrenOfKind(node, kinds);

  return children.filter((child) => {
    if (child.modifiers && child.modifiers.find((m) => m.kind === ts.SyntaxKind.PrivateKeyword)) {
      return false;
    }

    if (
      child.kind === ts.SyntaxKind.ClassDeclaration ||
      child.kind === ts.SyntaxKind.InterfaceDeclaration ||
      child.kind === ts.SyntaxKind.FunctionDeclaration
    ) {
      if (!child.modifiers || !child.modifiers.find((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
        return false;
      }
    }

    return true;
  });
}

export function nodeIsOfKind(node: ts.Node, kinds = supportedNodeKinds) {
  return !!node && !!kinds.find((k) => node.kind === k);
}

export function findFirstParent(node: ts.Node, kinds = supportedNodeKinds) {
  let parent = node.parent;
  while (parent) {
    if (nodeIsOfKind(parent, kinds)) {
      return parent;
    }

    parent = parent.parent;
  }

  return null;
}

export function formatTypeName(typeName: string) {
  typeName = typeName.trim();

  if (typeName === '') {
    return null;
  }

  if (typeName === 'any') {
    return '{*}';
  }

  if (typeName.indexOf('|') !== -1 || typeName.indexOf('&') !== -1) {
    typeName = '(' + typeName + ')';
  }

  return '{' + typeName + '}';
}

export enum EType {
  GETTER,
  SETTER,
  BOTH,
  CONSTRUCTOR
}

interface IVar {
  name: string;
  figure: string;
  typeName: string;
}

interface IClass {
  name: string;
  startPos: vs.Position;
  endPos?: vs.Position;
  vars: IVar[];
  getters: string[];
  setters: string[];
}

const matchers = {
  className: /class\s([a-zA-Z]+)/,
  privateDef: /[\s]*private[\s]*([a-zA-Z_$][0-9a-zA-Z_$]*)[\s]?\:[\s]?([\.\<\>\{\}\[\]a-zA-Z_$\s<>,]+)[\=|\;]/,
  getMethod: /public[\s]get[\s]?([a-zA-Z_$][0-9a-zA-Z_$]*)[\(\)]+/,
  setMethod: /public[\s]set[\s]?([a-zA-Z_$][0-9a-zA-Z_$]*)[\(]+[a-zA-Z_$][0-9a-zA-Z_$]*[\s\:]+/
};

// scan the current active text window and construct an IClass array
export function generateClassesList(type: EType): IClass[] {
  let classes: IClass[] = [];
  let brackets = {
    name: null,
    within: false,
    open: 0,
    closed: 0
  };
  const currentPos = vs.window.activeTextEditor.selection.active;
  const lineCount = vs.window.activeTextEditor.document.lineCount;
  // these are settings which can be adjusted for personal taste
  const scoped = vs.workspace.getConfiguration('genGetSet').get('scoped');
  const filter = vs.workspace.getConfiguration('genGetSet').get('filter');
  for (let i = 0; i < lineCount; i++) {
    const line = vs.window.activeTextEditor.document.lineAt(i);
    // check if we are outside a class (brackets) and a new class definition pops-up
    // when it does we are now within a class def and we can start checking for private variables
    if (!brackets.within && line.text.indexOf('class') !== -1) {
      brackets.within = true;
      let matches = line.text.match(matchers.className);
      if (matches) {
        brackets.name = matches[1];
      }
      brackets.open = 0;
      brackets.closed = 0;
      classes.push({
        name: brackets.name,
        startPos: new vs.Position(i, 0),
        vars: [],
        getters: [],
        setters: []
      });
    }
    // within brackets start matching each line for a private variable
    // and add them to the corresponding IClass
    if (brackets.within) {
      let _class = getClass(classes, brackets.name);
      const matches = {
        privateDef: line.text.match(matchers.privateDef),
        getMethod: line.text.match(matchers.getMethod),
        setMethod: line.text.match(matchers.setMethod)
      };
      if (_class && (matches.getMethod || matches.privateDef || matches.setMethod)) {
        // push the found items into the approriate containers
        if (matches.privateDef) {
          _class.vars.push({
            name: matches.privateDef[1],
            figure: publicName(matches.privateDef[1]),
            typeName: matches.privateDef[2]
          });
        }
        if (matches.getMethod) {
          _class.getters.push(matches.getMethod[1]);
        }
        if (matches.setMethod) {
          _class.setters.push(matches.setMethod[1]);
        }
      }
      if (line.text.indexOf('{') !== -1) {
        brackets.open++;
      }
      if (line.text.indexOf('}') !== -1) {
        brackets.closed++;
      }
      // if the brackets match up we are (maybe) leaving a class definition
      if (brackets.closed !== 0 && brackets.open !== 0 && brackets.closed === brackets.open) {
        brackets.within = false;
        // no maybe - we were actually within a class
        // check scoped setting: remove all found items if they are not
        // found within the class where the cursor is positioned
        if (_class) {
          _class.endPos = new vs.Position(i, 0);
          if (scoped && (currentPos.isBefore(_class.startPos) || currentPos.isAfter(_class.endPos))) {
            _class.vars = [];
          }
          // if filter is enabled: there is also no need to show already added
          // getters and setters methods in the list
          if (filter) {
            for (let i = _class.vars.length - 1; i >= 0; i--) {
              if (type === EType.GETTER || type === EType.BOTH) {
                for (let j = 0; j < _class.getters.length; j++) {
                  // console.log(_class.vars[i].figure, _class.getters[j]);
                  if (_class.vars[i].figure.toLowerCase() === _class.getters[j].toLowerCase()) {
                    _class.vars.splice(i, 1);
                    break;
                  }
                }
              }
              if (type === EType.SETTER || type === EType.BOTH) {
                for (let j = 0; j < _class.setters.length; j++) {
                  if (_class.vars[i].figure.toLowerCase() === _class.setters[j].toLowerCase()) {
                    _class.vars.splice(i, 1);
                    break;
                  }
                }
              }
            }
          }
        }
        // done analyzing a class, up to the next
      }
    }
  }
  return classes;
}

function getClass(items: IClass[], name: string): IClass {
  for (let i = 0; i < items.length; i++) {
    if (items[i].name === name) {
      return items[i];
    }
  }
  return null;
}

// convert the private name to a public name
// based on the 'classic' setting, see README.md
function publicName(fname: string) {
  const classic = vs.workspace.getConfiguration('genGetSet').get('classic');
  if (classic) {
    return fname;
  }
  if (fname.startsWith('_')) {
    return fname.substring(1);
  }
  return '$' + fname;
}

// generate code lines into the current active window based on EType
export function generateCode(classes: IClass[], type: EType, pickedItem?: vs.QuickPickItem) {
  const currentPos = new vs.Position(vs.window.activeTextEditor.selection.active.line, 0);
  if (type !== EType.CONSTRUCTOR && pickedItem) {
    const _class = getClass(classes, pickedItem.description);
    if (_class) {
      for (let i = 0; i < _class.vars.length; i++) {
        let item = _class.vars[i];
        if (item && pickedItem.label === item.name) {
          vs.window.activeTextEditor.edit((builder) => {
            // add template code blocks before the cursor position's line number
            if (type === EType.GETTER || type === EType.BOTH) {
              builder.insert(currentPos, createGetter(item));
            }
            if (type === EType.SETTER || type === EType.BOTH) {
              builder.insert(currentPos, createSetter(item));
            }
          });
        }
      }
    }
  } else if (type === EType.CONSTRUCTOR) {
    vs.window.activeTextEditor.edit((builder) => {
      for (let i = 0; i < classes.length; i++) {
        if (currentPos.isAfterOrEqual(classes[i].startPos) || currentPos.isBeforeOrEqual(classes[i].endPos)) {
          builder.insert(currentPos, createConstructor(classes[i].vars));
          return;
        }
      }
    });
  }
}

function createConstructor(items: IVar[]) {
  let c = '\n\tconstructor(';
  let b = false;
  for (let i = 0; i < items.length; i++) {
    if (b) {
      c += ', ';
    }
    c += items[i].figure + ': ' + items[i].typeName;
    if (!b) {
      b = true;
    }
  }
  c += ') {';
  b = false;
  for (let i = 0; i < items.length; i++) {
    c += '\n\t\tthis.' + items[i].name + ' = ' + items[i].figure + ';';
  }
  c += '\n\t}\n';
  return c;
}

function createGetter(item: IVar) {
  const classic = vs.workspace.getConfiguration('genGetSet').get('classic');
  if (classic) {
    return (
      '\n    /**\n     * Getter ' +
      item.figure +
      '\n     * @return {' +
      item.typeName +
      '}\n     */\n\tpublic get' +
      item.name.charAt(0).toUpperCase() +
      item.name.substring(1) +
      '(): ' +
      item.typeName +
      ' {\n' +
      '\t\treturn this.' +
      item.name +
      ';\n' +
      '\t}\n'
    );
  } else {
    return (
      '\n    /**\n     * Getter ' +
      item.figure +
      '\n     * @return {' +
      item.typeName +
      '}\n     */\n\tpublic get ' +
      item.figure +
      '(): ' +
      item.typeName +
      ' {\n' +
      '\t\treturn this.' +
      item.name +
      ';\n' +
      '\t}\n'
    );
  }
}

function createSetter(item: IVar) {
  const classic = vs.workspace.getConfiguration('genGetSet').get('classic');
  if (classic) {
    return (
      '\n    /**\n     * Setter ' +
      item.figure +
      '\n     * @param {' +
      item.typeName +
      '} value\n     */\n\tpublic set' +
      item.name.charAt(0).toUpperCase() +
      item.name.substring(1) +
      '(value: ' +
      item.typeName +
      ') {\n' +
      '\t\tthis.' +
      item.name +
      ' = value;\n' +
      '\t}\n'
    );
  } else {
    return (
      '\n    /**\n     * Setter ' +
      item.figure +
      '\n     * @param {' +
      item.typeName +
      '} value\n     */\n\tpublic set ' +
      item.figure +
      '(value: ' +
      item.typeName +
      ') {\n' +
      '\t\tthis.' +
      item.name +
      ' = value;\n' +
      '\t}\n'
    );
  }
}
