const vscode = require('vscode');

// 代码入口
module.exports = {
	activate,
	deactivate
}

// 插件激活时触发
function activate(context) {
	console.log(`${vscode}: JSON转Dart模型插件激活！`);
	require('./json-to-model')(context);// json转模型文件
	require('./hump-named')(context);// 下划线转驼峰
}

// 插件释放时触发
function deactivate() {
	console.log(`${vscode}: JSON转Dart模型插件释放！`)
}
