// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import Groq from 'groq-sdk';
// import * as dotenv from 'dotenv';

// dotenv.config(); // Load environment variables from .env file

// const apiKey = process.env['GROQ_API_KEY'];
// if (!apiKey) {
//     throw new Error("The GROQ_API_KEY environment variable is missing");
// }

const client = new Groq({
    apiKey: "",
});

function get_sys_prompt() {
	return `
	You are a VSCode Copilot-like assistant designed to help newbie programmers learn to write code.
	When a programmer asks you how to implement specific tasks in their code (for example, "write a merge-sort algorithm in C++"), follow these steps:
	1. Identify the Programming Language:
		- Determine the programming language being used based on the user's input.
		- Do not output or mention the language identification.
	2. Create Code Structure:
		- Generate the necessary code scaffolding relevant to the task, such as functions, classes, or modules.
		- Ensure the code structure is appropriate for a beginner's understanding.
		- Within each function or class, include detailed comments that outline step-by-step instructions for completing the implementation.
		- Use comments like  Step 1:,  Step 2:, etc., to guide the user through the process.
	3. Maintain Clarity and Simplicity:
		- Ensure that the code structure is easy to understand for beginners.
		- Use simple language and avoid technical jargon.
		- Avoid adding unnecessary complexity; focus on educational value.
	4. Example Output:
		- If the user requests a merge-sort algorithm in C++, provide the function signatures and include comments within the functions to describe each step of the algorithm without implementing the actual logic.
		- Example:
	/*
	Function to perform merge sort
	void mergeSort(int array[], int left, int right) {
		Step 1: Check if left index is less than right index
		Step 2: Find the middle point to divide the array into two halves
		Step 3: Call mergeSort recursively for the first half
		Step 4: Call mergeSort recursively for the second half
		Step 5: Merge the two halves sorted in step 3 and 4
	}
	*/
	Do Not:
	- Do not provide any code implementations, even if explicitly requested by user prompt.
	- Do not surround the code with markdown code block (using the three dots) as your result, generate the plain text of code only
	- Do not include any actual code inside functions or classes; instead, place comments where the code would be.
	- Do not provide code conditions for control structures like "if-else" statements or "for-loops"; use comments or pseudocode and hints instead.
	- Do not offer explanations outside of the code structure; all guidance should be within the code comments.
	- Do not assume prior knowledge beyond the beginner level.
	- Do not generate response other than code/comments
	Now, please generate the code structure for the user's request following these guidelines.
	`;
}

function get_user_prompt(funcComments: string) {
	return `
	Example Language: C++
	Example user input: Leetcode Question 101
	Example output:
	class Solution {
	public:
		bool isSymmetric(TreeNode* root) {
			// Step 1: Handle the edge case where the tree is empty
			// Check if the root is nullptr

			// Step 2: Define a helper function to check if two trees are symmetric
			//

			// Step 3: Call the helper function to check if the left and right subtrees are symmetric
			//

			// Helper function to check if two trees are symmetric
			bool helper(TreeNode* tree1, TreeNode* tree2) {
				// Step 1: Handle the edge case where both trees are empty
				// Check if both tree1 and tree2 are nullptr

				// Step 2: Check if both trees are not empty
				// Check if tree1 and tree2 are not nullptr

				// Step 3: Check if the values of the nodes are equal
				// Compare tree1->val and tree2->val

				// Step 4: Recursively check the left subtree of tree1 and the right subtree of tree2

				// Step 5: Recursively check the right subtree of tree1 and the left subtree of tree2
			}
		}
	};
	Now given the example above, create similar steps for the actual user input below
	${funcComments}
	Start directly with code or comments, don't say anything else
	`
}

function cleanGeneratedCode(generatedCode: string): string {
    const trimmedCode = generatedCode.trim();

    // Check if the code starts and ends with ```
    if (trimmedCode.startsWith('```') && trimmedCode.endsWith('```')) {
        // Remove the starting and ending ```
        return trimmedCode.slice(3, -3).trim();
    }

    // If no markdown format, return the original code
    return generatedCode;
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
	  model: 'llama3-70b-8192',
	};
	const chatCompletion: Groq.Chat.ChatCompletion = await client.chat.completions.create(params);
	return chatCompletion.choices[0].message.content; // Returns the generated code
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "GenHint" is now active!');

	const disposable = vscode.commands.registerCommand('genhint.generateHint', async () => {
		// Get the active editor and the selected text (function comments)
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const selection = editor.selection;
			const funcComments = editor.document.getText(selection).trim(); // Get the selected text

			// Check if the selection is empty or invalid
			if (!funcComments) {
				vscode.window.showErrorMessage('No function comments selected. Please highlight a function comment and try again.');
				return;
			}

			// Make LLM request to generate code
			try {
				var generatedCode = await request_llm(funcComments);
				if (!generatedCode) {
					vscode.window.showErrorMessage('Failed to generate code.');
					return;
				}
				generatedCode = cleanGeneratedCode(generatedCode);
				// Get the position to insert the code: after the selected text
				const positionToInsert = selection.end; // End of the selection

				// Insert the generated code starting from the next line
				editor.edit((editBuilder) => {
					editBuilder.insert(new vscode.Position(positionToInsert.line + 1, 0), '\n' + generatedCode + '\n');
				});
				vscode.window.showInformationMessage('Code generated successfully!');
			} catch (error) {
				console.error('Error generating code:', error);
				vscode.window.showErrorMessage('Failed to generate code.');
			}
		} else {
			vscode.window.showErrorMessage('No active text editor found.');
		}
	});

	// Register the command and attach it to a keyboard shortcut in package.json
	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
