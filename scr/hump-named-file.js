const vscode = require('vscode');

module.exports = function(context) {
    
    let  command = vscode.commands.registerTextEditorCommand('extension.hump-named-file',function(textEditor,edit){
        const text = textEditor.document.getText(textEditor.selection);
        textEditor.revealRange
        console.log(`选中的文本是：${text}`);
        const repText = replacePropertyName(text)
        edit.replace(textEditor.selection.constructor( textEditor.selection.anchor,  textEditor.selection.active),repText)

    })
    // 注册hump-named-file命令
    context.subscriptions.push(command);
};

/// 属性命名转换下划线转驼峰
function replacePropertyName(word){
    if (!word) { return }
    if (word.indexOf("_") != -1) {
        let array = word.split('_');
        if (array.length > 1) {
        var name = array[0]
        for (let index = 1; index < array.length; index++) {
            const element = array[index];
            name += firstUpperWord(element);
            }
            return name 
        }
    }
    return word;
}

/// 首字母大写
function firstUpperWord(word){
    if (!word) { return }
    var lowerWord = word.toLowerCase();
    return lowerWord.replace(lowerWord.charAt(0),lowerWord.charAt(0).toUpperCase());
}