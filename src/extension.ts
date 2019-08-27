import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

let proc: ChildProcess | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Welcome to Live2d');

	const chan = vscode.window.createOutputChannel('Live2d');
	context.subscriptions.push(chan);
	chan.show();
	chan.appendLine('Welcome to Live2d');

	// const item = new vscode.CompletionItem('love.graphics2.print3');
	// item.detail = 'how are you';
	// item.documentation = 'this is the docstring';
	// item.kind = vscode.CompletionItemKind.Function;

	// vscode.languages.registerCompletionItemProvider('lua', {
	// 	provideCompletionItems(document, position, token, context) {
	// 		return [
	// 			item,
	// 		];
	// 		return [];
	// 	}
	// });

	// vscode.languages.registerDocumentFormattingEditProvider('lua', {
	// 	provideDocumentFormattingEdits(document, options, token) {
	// 		const out = [];
	// 		let starts: vscode.Position | undefined;
	// 		const str = document.getText();
	// 		for (let i = 0; i < str.length; i++) {
	// 			const c = str.charAt(i);
	// 			if (c === ' ') {
	// 				if (!starts) {
	// 					starts = document.positionAt(i);
	// 				}
	// 			}
	// 			else {
	// 				if (starts) {
	// 					if (document.offsetAt(starts) + 2 < i) {
	// 						const ends = document.positionAt(i - 1);
	// 						out.push(vscode.TextEdit.delete(new vscode.Range(starts, ends)));
	// 					}
	// 					starts = undefined;
	// 				}
	// 			}
	// 		}
	// 		return out;
	// 	}
	// });

	function runLove2d() {
		if (proc) return;
		vscode.window.showInformationMessage('Starting Love2d');
		chan.appendLine('Starting Love2d');
		chan.appendLine(vscode.workspace.workspaceFolders![0].uri.fsPath);
		proc = spawn('love', [vscode.workspace.workspaceFolders![0].uri.fsPath], {
			env: {
				...process.env,
				LUA_PATH: context.extensionPath + '.\\?.lua;;'
			},
		});
		proc.unref();
		proc.on('exit', () => {
			chan.appendLine('Love2d exited.');
			proc = null;
		});
		let buf = ''
		proc.stdout.on('data', (chunk: Buffer) => {
			buf += chunk.toString();
			const groups = buf.split('\0');
			while (groups.length > 1) {
				let str = groups.shift()!;
				const isErr = str.charAt(0) === '1';
				str = str.slice(1);
				if (isErr) {
					vscode.window.showErrorMessage(str);
				}
				else {
					chan.append(`[${new Date().toISOString().slice(11, -1)}] ${str}`);
				}
			}
			buf = groups[0];
		});
		evalAllFiles();
	}

	function evalStringInLua(str: string) {
		proc!.stdin.write(str + '\0');
	}

	vscode.workspace.onDidSaveTextDocument(doc => {
		if (!proc) return;
		if (doc.languageId !== 'lua') return;
		if (vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave')) {
			evalStringInLua(doc.getText());
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalSelectionOrFile', evalSelectionOrFile));
	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalCurrentLine', evalCurrentLine));
	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalPromptedString', evalPromptedString));
	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalAllFiles', evalAllFiles));
	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalOpenFiles', evalOpenFiles));
	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.runLove2d', runLove2d));

	function evalPromptedString() {
		if (!proc) return warnAboutNoProcess();
		vscode.window.showInputBox({
			prompt: 'Code to eval:',
			ignoreFocusOut: true,
		}).then(str => {
			if (str) evalStringInLua(str);
		});
	}

	function evalCurrentLine() {
		if (!proc) return warnAboutNoProcess();

		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'lua') return;

		const line = editor.document.lineAt(editor.selection.start.line);
		evalStringInLua(line.text);
	}

	function evalSelectionOrFile() {
		if (!proc) return warnAboutNoProcess();

		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.document.languageId !== 'lua') return;

		if (editor.selections.length === 1 && editor.selection.isEmpty) {
			evalStringInLua(editor.document.getText());
		}
		else {
			editor.selections.forEach(sel => {
				evalStringInLua(editor.document.getText(sel));
			});
		}
	}

	function evalOpenFiles() {
		if (!proc) return warnAboutNoProcess();
		vscode.workspace.textDocuments
			.filter(doc => doc.languageId === 'lua')
			.forEach(doc => {
				evalStringInLua(doc.getText());
			});
	}

	function evalAllFiles() {
		if (!proc) return warnAboutNoProcess();
		vscode.workspace.findFiles('**/*.lua').then(uris => {
			uris.forEach((uri) => {
				evalStringInLua(fs.readFileSync(uri.fsPath, 'utf-8'));
			});
		});
	}

	function warnAboutNoProcess() {
		vscode.window.showErrorMessage("But Love2d isn't running.");
	}
}

export function deactivate() {
	if (proc) {
		proc.kill();
	}
}
