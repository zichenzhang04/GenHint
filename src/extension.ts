// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Groq from 'groq-sdk';

const client = new Groq({
	apiKey: process.env['GROQ_API_KEY'], // This is the default and can be omitted
});

function get_sys_prompt() {
	return "You are a coding assistant";
}

function get_user_prompt(funcComments: string) {
	return funcComments;
}

// Function to request code generation from LLM
async function request_llm(funcComments: string) {
	var system_prompt = get_sys_prompt();
	var user_prompt = get_user_prompt(funcComments);

	const params: any = {
	  messages: [
		{ role: 'system', content: system_prompt },
		{ role: 'user', content: user_prompt },
	  ],
	  model: 'llama3-8b-8192', // You can modify this to match the model you're using
	};
	const chatCompletion: Groq.Chat.ChatCompletion = await client.chat.completions.create(params);
	return chatCompletion.choices[0].message.content; // Returns the generated code
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "GenHint" is now active!');

	const disposable = vscode.commands.registerCommand('GenHint.generateCode', async () => {
		// Prompt the user to enter their function comment
		const funcComments = await vscode.window.showInputBox({
			placeHolder: 'Enter function comments to generate code',
			prompt: 'Describe what the function should do.',
		});

		// Check if the user canceled the input (funcComments will be null if canceled)
		if (!funcComments) {
			vscode.window.showErrorMessage('No function comments provided.');
			return; // Exit early if the input was null
		} else {
			// Make LLM request to generate code
			try {
				const generatedCode = await request_llm(funcComments);

				// Get the active text editor
				const editor = vscode.window.activeTextEditor;
				if (editor) {
					// Insert the generated code at the current cursor position
					editor.edit((editBuilder) => {
						editBuilder.insert(editor.selection.active, generatedCode);
					});
					vscode.window.showInformationMessage('Code generated successfully!');
				} else {
					vscode.window.showErrorMessage('No active text editor found.');
				}
			} catch (error) {
				console.error('Error generating code:', error);
				vscode.window.showErrorMessage('Failed to generate code.');
			}
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
