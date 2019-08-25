import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

let proc: ChildProcess | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting Live2d');

	const chan = vscode.window.createOutputChannel('Live2d');
	context.subscriptions.push(chan);
	chan.show();
	chan.appendLine('Starting Live2d');

	function runLove2d() {
		if (proc) return;
		vscode.window.showInformationMessage('Starting Love2d');
		chan.appendLine('Starting Love2d');
		proc = spawn('love', [context.extensionPath], {
			cwd: vscode.workspace.workspaceFolders![0].uri.fsPath,
		});
		proc.unref();
		proc.on('exit', () => { proc = null });
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
					chan.append(str);
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
		console.log(vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave'), JSON.stringify(doc.getText()));
		if (vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave')) {
			evalStringInLua(doc.getText());
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('degutis.live2d.evalSelectionOrFile', evalSelectionOrFile));
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

	function evalSelectionOrFile() {
		if (!proc) return warnAboutNoProcess();
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'lua') {
			if (editor.selections.length === 1 && editor.selection.isEmpty) {
				evalStringInLua(editor.document.getText());
			}
			else {
				editor.selections.forEach(sel => {
					evalStringInLua(editor.document.getText(sel));
				});
			}
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
