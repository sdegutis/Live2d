import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

let proc: ChildProcess | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting Live2d');

	const chan = vscode.window.createOutputChannel('love2d output');
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
		// evalAllFilesInProject();
	}

	function evalString(str: string) {
		proc!.stdin.write(str + '\0');
	}

	// vscode.workspace.onDidSaveTextDocument(doc => {
	// 	// if (!proc) return warnAboutNoProcess();

	// 	// console.log('got save');
	// 	// if (vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave')) {
	// 	// 	evalSelectionOrFile();
	// 	// }
	// });

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalSelectionOrFile', () => {
			evalSelectionOrFile();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalString', () => {
			evalStringFromUser();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalProjectFiles', () => {
			evalAllFilesInProject();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalOpenFiles', () => {
			evalOpenFiles();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.run', () => {
			runLove2d();
		})
	);

	function evalStringFromUser() {
		if (!proc) return warnAboutNoProcess();
		vscode.window.showInputBox({
			prompt: 'Code to eval:',
			ignoreFocusOut: true,
		}).then(str => {
			if (str) evalString(str);
		});
	}

	function evalSelectionOrFile() {
		if (!proc) return warnAboutNoProcess();
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'lua') {
			let str = editor.document.getText();
			if (!editor.selection.isEmpty) {
				str = editor.document.getText(editor.selection);
			}
			evalString(str);
		}
	}

	function evalOpenFiles() {
		if (!proc) return warnAboutNoProcess();
		vscode.workspace.textDocuments
			.filter(doc => doc.languageId === 'lua')
			.forEach(doc => {
				evalString(doc.getText());
			});
	}

	function evalAllFilesInProject() {
		if (!proc) return warnAboutNoProcess();
		vscode.workspace.findFiles('**/*.lua').then(uris => {
			uris.forEach((uri) => {
				evalString(fs.readFileSync(uri.fsPath, 'utf-8'));
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
