[![Build Status](https://travis-ci.org/joelday/vscode-docthis.svg?branch=master)](https://travis-ci.org/salbert/comment-ts) [![Paypal Donations](https://www.paypalobjects.com/en_US/i/btn/btn_donate_SM.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amp;business=7YU9WH4ANAB4Q&amp;lc=US&amp;item_name=Document%20This&amp;item_number=vscode-docthis%20extension&amp;currency_code=USD&amp;bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)

# Comment TS
"Comment TS" is a Visual Studio Code extension that automatically generates a template for JSDoc comments. It is adapted for TypeScript files. Typescript comes with a lot of language annotations, which should not be dublicated to the comments.

# Tags
Supports JSDoc and Closure Compiler tags: @description, @param, @returns, @template.

# Commands
## Comment TS
`Ctrl+Alt+C` and again `Ctrl+Alt+C`

Generates comments for whatever the caret is on or inside of.

## Settings
* "comment-ts.includeDescriptionTag": Adds @descriptions before your comments
* "comment-ts.includeAuthorTag": Adds an @author tag to your comments.
* "comment-ts.authorName": The text behind the @author tag.
* "comment-ts.parseNames": Parses the names so as to generate comments. GetAccessor will produce "gets <name> ". SetAccessor will produce "sets <name> ". Much more could be done....

## Trace TypeScript Syntax Node
Prints info about the node ancestry at a given caret position.

## The original codebase is from Document This. Thanks to the contributors!
