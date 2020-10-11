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

    if (n.kind !== ts.SyntaxKind.Decorator) {
      if (start <= position && end >= position) {
        lastMatchingNode = n;
      }

      n.getChildren().forEach(findChildFunc);
    }
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

/**
 * // TODO: comment findNonVoidReturnInCurrentScope
 * Finds non void return in current scope
 * @param node
 * @returns
 */
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

/**
 * // TODO: comment findVisibleChildrenOfKind
 * Finds visible children of kind
 * @param node
 * @param [kinds]
 * @returns
 */
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
