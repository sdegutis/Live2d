import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';

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
		if (!proc) return setupProc();
		console.log('got save');
		if (vscode.workspace.getConfiguration().get('degutis.live2d.evalOnSave')) {
			evalSelectionOrFile();
		}
	});

	function evalSelectionOrFile() {
		if (!proc) return setupProc();

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

	let disposable = vscode.commands.registerCommand('degutis.live2d.eval', () => {
		if (!proc) return setupProc();

		evalSelectionOrFile();

		vscode.workspace.findFiles('**/*.lua').then(values => {
			values.forEach((value) => {
				proc!.stdin.write(readFileSync(value.fsPath, 'utf-8') + '\0');
			});
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	if (proc) {
		process.kill(0);
	}
}
