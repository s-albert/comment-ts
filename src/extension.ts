import * as vs from 'vscode';
import { CancellationToken, CompletionItem, CompletionItemKind, Position, Range, TextDocument } from 'vscode';
import { Documenter } from './documenter';
import { generateClassesList, EType, generateCode, quickPickItemListFrom, generateAllGetterAndSetter } from './codegen';

const languages = ['typescript', 'typescriptreact'];

let documenter: Documenter;

function lazyInitializeDocumenter() {
  if (!documenter) {
    documenter = new Documenter();
  }
}

function languageIsSupported(document: vs.TextDocument) {
  return languages.findIndex((l) => document.languageId === l) !== -1;
}

function verifyLanguageSupport(document: vs.TextDocument, commandName: string) {
  if (!languageIsSupported(document)) {
    vs.window.showWarningMessage(`Sorry! '${commandName}' only supports TypeScript.`);
    return false;
  }

  return true;
}

function runCommand(commandName: string, document: vs.TextDocument, implFunc: () => void) {
  if (!verifyLanguageSupport(document, commandName)) {
    return;
  }

  try {
    lazyInitializeDocumenter();
    implFunc();
  } catch (e) {
    debugger;
    console.error(e);
  }
}

// Thanks, @mjbvz!
class DocThisCompletionItem extends CompletionItem {
  constructor(document: TextDocument, position: Position) {
    super('/** Comment... */', CompletionItemKind.Snippet);
    this.insertText = '';
    this.sortText = '\0';

    const line = document.lineAt(position.line).text;
    const prefix = line.slice(0, position.character).match(/\/\**\s*$/);
    const suffix = line.slice(position.character).match(/^\s*\**\//);
    const start = position.translate(0, prefix ? -prefix[0].length : 0);
    this.range = new Range(start, position.translate(0, suffix ? suffix[0].length : 0));

    this.command = {
      title: 'Comment...',
      command: 'comment-ts.documentThis',
      arguments: [true]
    };
  }
}

export function activate(context: vs.ExtensionContext): void {
  context.subscriptions.push(
    vs.languages.registerCompletionItemProvider(
      languages,
      {
        provideCompletionItems: (document: TextDocument, position: Position, token: CancellationToken) => {
          const line = document.lineAt(position.line).text;
          const prefix = line.slice(0, position.character);

          if (prefix.match(/^\s*$|\/\*\*\s*$|^\s*\/\*\*+\s*$/)) {
            return [new DocThisCompletionItem(document, position)];
          }

          return;
        }
      },
      '/',
      '*'
    )
  );

  const classesListBoth = generateClassesList(EType.BOTH);
  const classesListGetter = generateClassesList(EType.GETTER);
  const classesListSetter = generateClassesList(EType.SETTER);

  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.constructor', () => {
      generateCode(classesListBoth, EType.CONSTRUCTOR);
    })
  );

  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.interface', () => {
      generateCode(classesListBoth, EType.INTERFACE);
    })
  );

  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.documentThis', (forCompletion: boolean) => {
      const commandName = 'Comment...';

      runCommand(commandName, vs.window.activeTextEditor.document, () => {
        documenter.documentThis(vs.window.activeTextEditor, commandName, forCompletion);
      });
    })
  );

  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.getter', function() {
      vs.window.showQuickPick(quickPickItemListFrom(classesListGetter, EType.GETTER)).then((pickedItem) => {
        generateCode(classesListGetter, EType.GETTER, pickedItem);
      });
    })
  );
  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.setter', function() {
      vs.window.showQuickPick(quickPickItemListFrom(classesListSetter, EType.SETTER)).then((pickedItem) => {
        generateCode(classesListSetter, EType.SETTER, pickedItem);
      });
    })
  );
  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.allGetterAndSetter', function() {
      generateAllGetterAndSetter(classesListGetter, classesListSetter);
    })
  );
  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.getterAndSetter', function() {
      vs.window.showQuickPick(quickPickItemListFrom(classesListBoth, EType.BOTH)).then((pickedItem) => {
        generateCode(classesListBoth, EType.BOTH, pickedItem);
      });
    })
  );

  context.subscriptions.push(
    vs.commands.registerCommand('comment-ts.traceTypeScriptSyntaxNode', () => {
      const commandName = 'Trace Typescript Syntax Node';

      runCommand(commandName, vs.window.activeTextEditor.document, () => {
        documenter.traceNode(vs.window.activeTextEditor);
      });
    })
  );
}
