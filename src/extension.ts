import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';

let proc: ChildProcess | null;

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting love2d thing');

	vscode.window.showInformationMessage('Running Love2d...');
	const rootDir = vscode.workspace.rootPath!;

	function setupProc() {
		proc = spawn('love', [rootDir]);
		proc.unref();
		proc.on('exit', () => {
			proc = null;
		});
	}
	setupProc();

	vscode.workspace.onDidSaveTextDocument(doc => {
		// if (!proc) return;

		// console.log('got save');
		// if (vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave')) {
		// 	evalSelectionOrFile();
		// }
	});

	function evalSelectionOrFile() {
		if (!proc) return;

		console.log('maybe evaling');
		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document.languageId === 'lua') {
			let str = editor.document.getText();
			if (!editor.selection.isEmpty) {
				str = editor.document.getText(editor.selection);
			}
			proc.stdin.write(str + '\0');
		}
	}

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.eval', () => {
			if (!proc) return;
			evalSelectionOrFile();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalAll', () => {
			if (!proc) return;

			evalAllFilesInProject();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.evalAllOpen', () => {
			// if (!proc) return;

			// vscode.window.showInputBox({ prompt: 'testing' })
			vscode.window.createTerminal('bla')

			const chan = vscode.window.createOutputChannel('love2d output');
			context.subscriptions.push(chan);
			chan.show();
			chan.appendLine('hey guys');
			chan.appendLine('hows it going');

			vscode.workspace.textDocuments.filter(doc => doc.languageId === 'lua').forEach(doc => {
				console.log('found file', doc.fileName);
			});

			// evalAllFilesInProject();
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand(
		'degutis.live2d.run', () => {
			if (!proc) {
				setupProc();
			}
		})
	);

	function evalAllFilesInProject() {
		vscode.workspace.findFiles('**/*.lua').then(uris => {
			uris.forEach((uri) => {
				proc!.stdin.write(fs.readFileSync(uri.fsPath, 'utf-8') + '\0');
			});
		});
	}
}

export function deactivate() {
	if (proc) {
		proc.kill();
	}
}
