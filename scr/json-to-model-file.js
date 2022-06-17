// @ts-nocheck
const vscode = require('vscode');

var methodName = 'safety'
const configuration = vscode.workspace.getConfiguration();
var method = ''


module.exports = function(context) {

    configMethod()
    
    // 注册json-to-model-file命令
    context.subscriptions.push(vscode.commands.registerCommand('extension.json-to-model-file', () => {
        vscode.window.activeTextEditor.edit(editBuilder => {
            starJsonToModel(editBuilder);
        });
    }));
};



/// 配置用户方法
function configMethod(){

    let methodString = configuration.get('JSONToModel.method-string')
    if (methodString.length > 0) {
        method = methodString
    }else {
        let methodObj = configuration.get('JSONToModel.method-obj');
        let methodName = methodObj['name']
        if(methodName != "myfunc" && methodName.length> 0) {
            var ret = methodObj['return']
            if (ret.length == 0 || ret == '') {
                ret = 'void'
            }
            let mName = replacePropertyName(methodObj['name'])
            
            method = `\n  ${ret} ${mName}(${methodObj['params'].join(',')}) {\n    ${methodObj['imp']} \n  }\n\n`
        }
    }
}


function starJsonToModel(editBuilder){
    
    if (!configuration.get('JSONToModel.safe')) {
        methodName = 'safe'
    }

    const fileName = getFileName();
    const jsonText = vscode.window.activeTextEditor.document.getText();
    try {
        var jsonBbject = JSON.parse(jsonText);
    } catch(e) {
        vscode.window.showInformationMessage(`Json转模型文件：json格式错误 ${e}`); // error in the above string (in this case, yes)!
    }
    var result =  parseObject(jsonBbject,fileName);
    console.log("转换结果：" + result );
    // 从开始到结束，全量替换
    const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
    editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), result);
    vscode.window.showInformationMessage('Json转模型文件');
}

/// 获取根文件名字
function getFileName(){
    const fileNames = vscode.window.activeTextEditor.document.fileName.split('/');
    if (fileNames.length > 0 && fileNames[fileNames.length-1].length > 0) {
        const fileName = fileNames[fileNames.length-1].split('.')[0];
        var name = '';
        if (fileName.concat('_')) {
            var arr = fileName.split('_');
            for (var word of arr) {
                name += firstUpperWord(word);
            }
        return name;
        }
    }
    return 'ReplaceMe'
}

/// 解析对象
function parseObject(value,fileName){
    var attString = '';
    attString += createClass(fileName,true);
    attString += createProperty(fileName,value) ;
    return attString + '}\n';
}

///创建类
function createClass(className,isRoot) {
    var attString = isRoot ? '': "}\n";
    attString += `\nclass ${className} {`
    return attString ;
}

/// 创建方法
function createMethod(keyName,object){
    var attString = `\n  ${keyName}();\n\n  ${keyName}.fromJson(Map json) {\n`
    var keys = Object.keys(object);
    var values = Object.values(object);
    
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        const key = keys[index]
        if (isArray(value)) {
            let propertyName = replacePropertyName(key)
            var modelName = firstUpperWord(key)
                attString += `    List items = json['${key}'] ?? [];\n`
                attString += `    for (var item in items) {\n`
            if (isAllEqual(value) && arrayIsObject(value)) {
                attString += `      ${propertyName}.add(${modelName}Model.fromJson(${methodName}(<String, dynamic>{}, item)));\n    }\n`
            }else{
                attString += `      ///my code... \n        ${propertyName}.add(item);\n    }\n`
            }
        }else if (isObject(value)) {
            var modelName = firstUpperWord(key)
            let propertyName = replacePropertyName(key)
            let reModelName = replacePropertyName(modelName)
            attString += `    ${propertyName} = ${reModelName}Model.fromJson(${methodName}(<String, dynamic>{}, json['${key}']));\n`
        }else{
            let propertyName = replacePropertyName(key)
            attString += `    ${propertyName} = ${methodName}(${propertyName}, json['${key}']);\n`
        }
    }
    attString += '\n  }\n';
    if ( methodName == 'safety') {
        attString+= `\n  T safety<T>(dynamic oldValue, dynamic newValue) {\n    if (oldValue.runtimeType == newValue.runtimeType) { \n      return newValue;\n    }\n    return oldValue; \n  }\n\n` 
    }

    
    if (method.length > 0) {
        attString += method
    }
    return attString
}

// 创建属性
function createProperty(fileName,object){
        var attString = '';
        var className = fileName ;
        var keys = Object.keys(object);
        var values = Object.values(object);
        for (let index = 0; index < keys.length; index++) {
            var keyName = keys[index];
            var value = values[index];
            
            var modelName = firstUpperWord(keyName)
            className = `${modelName}Model`
            
            //添加属性
            attString += createPropertyString(keyName,value);  
            
            //添加方法
            if (index == keys.length -1) {
                attString += createMethod(fileName,object)
            }
            // 添加类
            if (isObject(value)) {
                className = replacePropertyName(modelName)
                className = `${className}Model`
                attString += createClass(className);
                attString += createProperty(className,value);
            }

            // 添加数组模型
            if (isArray(value) && value.length > 0) {
                if (isAllEqual(value)) {
                    var firstObject = value[0]
                    if (isObject(firstObject)) {
                        modelName = replacePropertyName(keyName)
                        className = `${modelName}Model`
                        attString += createClass(className)
                        attString += createProperty(className,firstObject);
                        } 
                }else{
                    for (let index = 0; index < value.length; index++) {
                        const element = value[index];
                        if (isObject(element)) {
                            let reModelName = replacePropertyName(modelName)
                            className = `${reModelName}Model${index}`
                            attString += createClass(className)
                            attString += createProperty(className,element);
                            } 
                        }
                    }
                }
        }
    return attString;
}

// 创建属性字符串
function createPropertyString(key,value){
    var attString = '\n';
    let propertyName = replacePropertyName(key)
    if (isBool(value)) {
        attString += `  bool ${propertyName} = false;\n`;
    }else if(isNumber(value)){
        attString += `  int ${propertyName} = 0;\n`;
    }else if (isString(value)) {
        attString += `  String ${propertyName} = '';\n`;
    }else if ( isArray(value)){
        if (isAllEqual(value) && arrayIsObject(value)) {
            var className = firstUpperWord(key)
            var classNameModel = `${className}Model`;
            attString += `  List<${classNameModel}> ${propertyName} = [];\n`
        }else{
            attString += `  List ${propertyName} = [];\n`
        }
    }else if (isObject(value)){
        let className = firstUpperWord(key)
        let classNameModel = replacePropertyName(className)
        attString += `  ${classNameModel}Model ${propertyName} = ${classNameModel}Model();\n`;
    }else {
        attString += `  var ${propertyName} = ${value};\n`;
    }
    return attString ;
}

/// 数组内元素是否相等
function isAllEqual(array){
    var bool = true
    if (array.length > 0) {
        let firstObject = array[0]
        for (const item of array) {
            if (isObject(item)) {
                if (!objSame(item,firstObject)) {
                    bool = false
                    break;
                }
            }else if (isArray(item)) {
                bool = arrSame(item,firstObject)
                if (!bool) {
                    break;
                }
            }else {
                bool = item !== firstObject;
            }
        }
        return bool
    }
    return bool
}

/// 验证两个object 是否相同
function objSame (obj,newObj) {
    let bol = true;
    if (Object.keys(obj).length != Object.keys(newObj).length) {
        return false;
    }
    for(let key in obj) {
        if ( obj[key] instanceof Object) {
            bol = objSame(obj[key],newObj[key]);
            if (!bol) {
                break;
            }
        } else if ( obj[key] instanceof Array) {
            bol = arrSame(obj[key],newObj[key])
            if (!bol) {
                break;
            }
        } else if (obj[key] != newObj[key]) {
                // 比较两个key是否相同
            let objKeys = Object.keys(obj)
            let newObjKeys = Object.keys(newObj)
            for (let index = 0; index < objKeys.length; index++) {
                if (objKeys[index] != newObjKeys[index]) {
                    bol =  false;  
                    break;
                } 
            }
        }
    }
    return bol
}

/// 验证两个数组是否相同
function arrSame (arr,newArr) {
    let bol = true;
    if (arr.length != newArr.length) {
        return false;
    }
    for (let i = 0, n = arr.length;i < n; i++) {
        if (arr[i] instanceof Array) {
            bol = arrSame(arr[i],newArr[i])
            if (!bol) {
                break;
            }
        } else if (arr[i] instanceof Object) {
            bol = objSame(arr[i],newArr[i])
            if (!bol) {
                break;
            }
        }else if (arr[i] != newArr[i]) {
            bol = false;
            break;
        }
    }

    return bol;
}

/// 数组内部元素类型非对象或数组
function arrayIsObject(array){
    for(let item in array) {
        if (isArray(item)) {
            return true
        }else if (isObject(item)){
            return true
        }else{
            return false
        }
    }
}

/// 属性命名转换下划线转驼峰
function replacePropertyName(word){
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
    var lowerWord = word.toLowerCase();
    return lowerWord.replace(lowerWord.charAt(0),lowerWord.charAt(0).toUpperCase());
}


function isBool(value){
    return typeof value === 'boolean';
}

function isNumber(value) {
    return typeof value === 'number';
}

function isString(value){
    return (typeof value=='string')&&(value.constructor==String);
}

function isArray(value){
    return value instanceof Array;
}

function isObject(value){
    return value.constructor.toString().indexOf("Object")>-1;
}



