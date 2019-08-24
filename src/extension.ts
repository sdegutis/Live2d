import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	console.log('Starting love2d thing');

	vscode.window.showInformationMessage('Running Love2d...');
	const rootDir = vscode.workspace.rootPath!;
	let proc: ChildProcess;

	function setupProc() {
		proc = spawn('love', [rootDir]);
		proc.unref();
		proc.on('exit', setupProc);
	}
	setupProc();

	vscode.workspace.onDidSaveTextDocument(doc => {
		evalSelectionOrFile();
		// console.log('got save');
	});

	function evalSelectionOrFile() {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			let str = editor.document.getText();
			if (!editor.selection.isEmpty) {
				str = editor.document.getText(editor.selection);
			}
			proc.stdin.write(str + '\0');
		}
	}

	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		evalSelectionOrFile();
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {

}
