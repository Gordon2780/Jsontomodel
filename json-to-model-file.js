// @ts-nocheck
const vscode = require('vscode');

module.exports = function(context) {
    // 注册HelloWord命令
    context.subscriptions.push(vscode.commands.registerCommand('extension.json-to-model-file', () => {

        vscode.window.showInformationMessage('Json转模型文件');

        vscode.window.activeTextEditor.edit(editBuilder => {
            const fileName = getFileName();
            const jsonText = vscode.window.activeTextEditor.document.getText();
            try {
                var jsonBbject = JSON.parse(jsonText);
            } catch(e) {
                vscode.window.showInformationMessage(`Json转模型文件：json格式错误 ${e}`); // error in the above string (in this case, yes)!
            }
            var result =  parseObject(jsonBbject,fileName);
            console.log("结果：" + result );
            // 从开始到结束，全量替换
            const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
            editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), result);
        });
    }));

};

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

/// 创建初始化方法
function createMethod(keyName,object){
    var attString = `\n  ${keyName}();\n\n  ${keyName}.fromJson(Map json) {\n`
    var keys = Object.keys(object);
    var values = Object.values(object);
    let methodName = 'safety'
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        const key = keys[index]
        if (isArray(value)) {
            var modelName = firstUpperWord(key)
                attString += `    List items = json['${key}'] ?? [];\n`
                attString += `    for (var item in items) {\n`
            if (isAllEqual(value) && arrayIsObject(value)) {
                attString += `      ${key}.add(${modelName}Model.fromJson(${methodName}(<String, dynamic>{}, item)));\n    }\n`
            }else{
                attString += `      ///my code... \n        ${key}.add(item);\n    }\n`
            }
        }else if (isObject(value)) {
            var modelName = firstUpperWord(key)
            attString += `    ${key} = ${modelName}Model.fromJson(${methodName}(<String, dynamic>{}, json['${key}']));\n`
        }else{
            attString += `    ${key} = ${methodName}(${key}, json['${key}']);\n`
        }
    }
    attString += '\n  }\n';
    attString+= `\n  dynamic safety(dynamic oldValue, dynamic newValue) {\n    if (oldValue.runtimeType == newValue.runtimeType) { \n      return newValue;\n    }\n    return oldValue; \n  }\n\n`
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
                attString += createClass(className);
                attString += createProperty(className,value);
            }

            // 添加数组模型
            if (isArray(value) && value.length > 0) {
                if (isAllEqual(value)) {
                    var firstObject = value[0]
                    if (isObject(firstObject)) {
                        attString += createClass(className)
                        attString += createProperty(className,firstObject);
                        } 
                }else{
                    for (let index = 0; index < value.length; index++) {
                        const element = value[index];
                        if (isObject(element)) {
                            className = `${modelName}Model${index}`
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
    if (isBool(value)) {
        let str = [' ','bool',key,'=','false;','\n'].join(' ')
        attString += str;
    }else if(isNumber(value)){
        let str = [' ','int',key,'=','0;','\n'].join(' ')
        attString += str;
    }else if (isString(value)) {
        let str = [' ','String',key,'=',"'';",'\n'].join(' ')
        attString += str;
    }else if ( isArray(value)){
        if (isAllEqual(value) && arrayIsObject(value)) {
            var className = firstUpperWord(key)
            var classNameModel = `${className}Model`;
            attString += `  List<${classNameModel}> ${key} = [];\n`
        }else{
            attString += `  List ${key} = [];\n`
        }
    }else if (isObject(value)){
        let className = firstUpperWord(key)
        let classNameModel = `${className}Model`;
        let str = [' ',classNameModel,key,'=',`${classNameModel}();`,'\n'].join(' ')
        attString += str;
    }else {
        let str = [' ','var',key,'=',value,';','\n'].join(' ')
        attString += str;
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



