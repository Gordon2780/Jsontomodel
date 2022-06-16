// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * 插件被激活时触发，所有代码总入口
 * @param {*} context 插件上下文
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-plugin:json to model" is now active! 扩展“vscode-plugin: json to model”已激活！');
	console.log(vscode);

	// @ts-ignore
	require('./json-to-model-file')(context);// json转模型文件
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
}


/**
 * 插件被释放时触发
 */
function deactivate() {
	 // @ts-ignore
	console.log('扩展“vscode-plugin: json to model”已被释放！')
}

module.exports = {
	// @ts-ignore
	activate,
	deactivate
}
