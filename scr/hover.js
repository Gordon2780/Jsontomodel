const vscode = require('vscode');

const { activeTextEditor, onDidChangeActiveTextEditor } = vscode.window;
let active = activeTextEditor;
onDidChangeActiveTextEditor((textEditor) => {
    console.log('activeEditor改变了');
  //更换打开的编辑器对象
    if (textEditor) {
        active = textEditor;
    }
})
module.exports = function(context) {
    // 注册鼠标悬停提示
    console.log('注册鼠标悬停提示方法');
    // let languages = vscode.languages.registerHoverProvider('*', {
    //         provideHover(document, position, token) {
    //         const selected = document.getText(active.selection);
    //         console.log('选中内容:' + selected);
            
    //         if (selected.length > 0 && RegExp(`^[a-zA-Z0-9_]*$`).test(selected) && selected.indexOf("_") != -1 ) {
    //             console.log('选中结果: treu' );
    //             return new vscode.Hover(" 使用‘command + .’可驼峰命名格式化"); 
    //         }else {
    //             console.log('选中结果: false' );
    //         }
    //     }
    // })
    // context.subscriptions.push(languages);
};
