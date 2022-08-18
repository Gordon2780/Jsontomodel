const { close } = require('inspector');
const vscode = require('vscode');

var methodName = 'safe'
const configuration = vscode.workspace.getConfiguration();
var method = ''
const enableSafe = configuration.get('JSONToModel.safe')
const enalbePrint = configuration.get('JSONToModel.print')


module.exports = function(context) {

    // 设置用户配置
    setUserConfig()

    // 注册并实现json-to-model命令回调
    let command = vscode.commands.registerCommand('extension.json-to-model', () => {
        /// 获取当前编辑窗口
        vscode.window.activeTextEditor.edit(editBuilder => {
           /// 开始JSON转模型
            starJsonToModel(editBuilder);
        });
    })
    
    // 订阅json-to-model命令
    context.subscriptions.push(command);
};



/// 配置用户方法
function setUserConfig(){

    let methodString = configuration.get('JSONToModel.method-string')
    if (methodString.length > 0) {
        method = methodString
    }else {
        let usrMethodObj = configuration.get('JSONToModel.method-obj');
        let usrMethodName = usrMethodObj['name']
        if(usrMethodName != "my_func" && methodName.length> 0) {
            var ret = usrMethodObj['return']
            if (ret.length == 0 || ret == '') {
                ret = 'void'
            }
            let mName = namedHumpProperty(usrMethodObj['name'])
            
            method = `\n  ${ret} ${mName}(${usrMethodObj['params'].join(',')}) {\n    ${usrMethodObj['imp']} \n  }\n\n`
        }
    }
}

/// 开始JSON转模型
/**
 * @param {vscode.TextEditorEdit} editBuilder
 */
function starJsonToModel(editBuilder){
    
    const fileName = getFileName();
    const jsonText = vscode.window.activeTextEditor.document.getText();
    try {
        var jsonBbject = JSON.parse(jsonText);
    } catch(e) {
        vscode.window.showInformationMessage(`JSON转模型文件：json格式错误 ${e}`);
    }
    var result =  parseObject(jsonBbject,fileName);
    // console.log("转换结果：" + result );
    // 从开始到结束，全量替换
    const end = new vscode.Position(vscode.window.activeTextEditor.document.lineCount + 1, 0);
    editBuilder.replace(new vscode.Range(new vscode.Position(0, 0), end), result);
    vscode.window.showInformationMessage('JSON转模型文件已完成');
}

/// 获取根文件名字
function getFileName(){
    const fileNames = vscode.window.activeTextEditor.document.fileName.split('/');
    if (fileNames.length > 0 && fileNames[fileNames.length-1].length > 0) {
        const fileName = fileNames[fileNames.length-1].split('.')[0];
        if (fileName.indexOf("_") != -1) {
            let name = '';
            var arr = fileName.split('_');
            for (var word of arr) {
                name += firstUpperWord(word);
            }
        return name;
        }else if (!isFirstLetterUpperCase(fileName)){
            return firstUpperWord(fileName)
        }
        return fileName
    }
    return 'ReplaceMe'
}

/// 解析对象
/**
 * @param {any} value
 * @param {string} fileName
 */
function parseObject(value,fileName){
    var attString = '';
    attString += createClass(fileName,true);
    attString += createProperty(fileName,value) ;
    return attString + '}\n';
}

///创建类
/**
 * @param {string} className 类名
 * @param {boolean} [isRoot] 是否根类
 */
function createClass(className,isRoot) {
    var attString = isRoot ? '': "}\n";
    attString += `\nclass ${className} {\n`
    return attString ;
}

/// 创建方法
/**
 * @param {any} keyName
 * @param {{ [s: string]: any; } | ArrayLike<any>} object
 */
function createMethod(keyName,object){
    var attString = `\n  ${keyName}();\n\n  ${keyName}.fromJson(Map json) {\n`
    var keys = Object.keys(object);
    var values = Object.values(object);

    var printStr = '{'    
    for (let index = 0; index < values.length; index++) {
        const value = values[index]
        const key = keys[index]
        const last = (index == values.length - 1)
        
        let namedHump = namedHumpProperty(key);

        if (isArray(value)) {
            let propertyName = firstLowerWord(namedHump);
            var modelName = firstUpperWord(key)
                attString += `    List ${propertyName}Items = json['${key}'] ?? [];\n`
                attString += `    for (var item in ${propertyName}Items) {\n`
            if (isAllEqual(value) && arrayIsObject(value)) {
                printStr += createFormattedPrint(propertyName,value,last)
                attString += `      ${propertyName}.add(${namedHumpProperty(modelName)}Model.fromJson(${methodName}(<String, dynamic>{}, item)));\n    }\n`
            }else{
                printStr += createFormattedPrint(propertyName,value,last)
                attString += `      ///my code... \n        ${propertyName}.add(item);\n    }\n`
            }
        }else if (isObject(value)) {
            
            let propertyName = namedHump;
            let className = namedHump;
            if (isFirstLetterUpperCase(namedHump)) {
                propertyName = firstLowerWord(namedHump)
                className = `${namedHump}Model`
            }else {
                propertyName = namedHump
                className = `${firstUpperWord(namedHump)}Model`
            }
            printStr += createFormattedPrint(propertyName,'obj',last)
            attString += `    ${propertyName} = ${className}.fromJson(${methodName}(<String, dynamic>{}, json['${key}']));\n`
        }else{
            let propertyName = firstLowerWord(namedHump);
            printStr += createFormattedPrint(propertyName,value,last)
            attString += `    ${propertyName} = ${methodName}(${propertyName}, json['${key}']);\n`
        }
    }
    attString += '\n  }\n';
    if (enableSafe) {
        attString += `\n  T ${methodName}<T>(dynamic oldValue, dynamic newValue) {\n    if (oldValue.runtimeType == newValue.runtimeType || (oldValue is Map && newValue is Map) || oldValue == null) { \n      return newValue;\n    } else if ((oldValue is double) && (newValue is int)) { \n      return (newValue.toDouble() as T); \n    } \n    return oldValue; \n  }\n\n` 
    }

    if (enalbePrint) {
        printStr += '\\n}'
        attString += `  @override\n  String toString() {\n    super.toString();\n    return '${printStr}';\n  }\n`
        // attString += `  @override\n  String toString() {\n    final rawString = super.toString();\n    return rawString + '${printStr}';\n  }\n`
    }


    if (method.length > 0) {
        attString += method
    }
    return attString
}

/// 格式打印
function createFormattedPrint(property,value,isLast){
    if (enalbePrint) {
        let printString =  `\\n    \\"${property}\\" : $${property}`;
        if (value == 'obj') {
            printString = `\\n    \\"${property}\\" : $\{${property}.toString()\}`;
        }else if (isString(value)){
            printString =  `\\n    \\"${property}\\" : \\"$${property}\\"`; 
        }else if (isNumber(value)){
            printString =  `\\n    \\"${property}\\" : $${property}`; 
        }
        if (!isLast) {
            printString += ","
        }
        return  printString
    }
}

// 创建属性
/**
 * @param {string} fileName
 * @param {{ [s: string]: any; }} object
 */
function createProperty(fileName,object){
        var attString = '';
        // var className = fileName ;
        var keys = Object.keys(object);
        var values = Object.values(object);

        if (keys.length == 0) {
            attString += '\n  /// note: this JSON object has no keys \n'
        }

        var waitAddClassDict = new Array();
        var waitAddObjcDict = new Array();
        for (let index = 0; index < keys.length; index++) {
            var keyName = keys[index];
            var value = values[index];
            
            //添加属性
            attString += createPropertyString(keyName,value);  
            
            //添加方法
            if (index == keys.length -1) {
                attString += createMethod(fileName,object)
            }
            // 储存对象
            if (isObject(value)) {
                waitAddObjcDict[keyName] = value
            }
            // 存储数组嵌套模型
            if (isArray(value) && value.length > 0) {
                waitAddClassDict[keyName] = value
            }
        }

        /// 添加类
        let objKeys = Object.keys(waitAddObjcDict)
        if (objKeys.length > 0) {
            let objValues = Object.values(waitAddObjcDict)
            for (let index = 0; index < objKeys.length; index++) {
                let key = objKeys[index];
                let value = objValues[index];
                attString += addClass(value,key)
            }
        }

        /// 添加数组内的类
        let arrayObjKeys = Object.keys(waitAddClassDict)
        if (arrayObjKeys.length > 0) {
            let arrayValues = Object.values(waitAddClassDict)
            for (let index = 0; index < arrayObjKeys.length; index++) {
                let key = arrayObjKeys[index];
                let value = arrayValues[index]
                attString += addArrayClass(value,key)
            }
        }
    
    return attString;
}


/**
 * @param {{ [s: string]: any; }} value
 * @param {string} keyName
 */
function addClass(value,keyName){
    var attString = ''
    var modelName = namedHumpProperty(keyName)
    if (!isFirstLetterUpperCase(modelName)) {
        modelName = firstUpperWord(modelName)
    }
    let className = `${modelName}Model`
    attString += createClass(className);
    attString += createProperty(className,value);
    return attString
}

/// 添加数组内模型类
/**
 * @param {string | any[]} value
 * @param {string} keyName
 */
function addArrayClass(value,keyName){
    var attString = ''
    var className = ''
    var modelName = ''
    if (isArray(value) && value.length > 0) {
        if (isAllEqual(value)) {
            var firstObject = value[0]
            if (isObject(firstObject)) {
                modelName = namedHumpProperty(firstUpperWord(keyName))
                className = `${modelName}Model`
                attString += createClass(className)
                attString += createProperty(className,firstObject);
                } 
        }else{
            for (let index = 0; index < value.length; index++) {
                const element = value[index];
                if (isObject(element)) {
                    modelName = namedHumpProperty(firstUpperWord(keyName))
                    className = `${modelName}Model${index}`
                    attString += createClass(className)
                    attString += createProperty(className,element);
                    } 
                }
            }
        }
    return attString
}


// 创建属性字符串
function createPropertyString(key,value){
    var attString = '\n';
    let namedHump = namedHumpProperty(key);
    let propertyName = firstLowerWord(namedHump);

    if (isBool(value)) {
        attString += `  bool ${propertyName} = false;\n`;
    }else if(isNumber(value)){
        if (value.toString().indexOf(".") != -1) {
            attString += `  double ${propertyName} = 0;\n`;
        }else {
            attString += `  int ${propertyName} = 0;\n`; 
        }
    }else if (isString(value)) {
        attString += `  String ${propertyName} = '';\n`;
    }else if ( isArray(value)){
        if (isAllEqual(value) && arrayIsObject(value)) {
            var className = firstUpperWord(key)
            var classNameModel = `${namedHumpProperty(className)}Model`;
            attString += `  List ${propertyName} = <${classNameModel}>[];\n`
        }else{
            attString += `  List ${propertyName} = [];\n`
        }
    }else if (isObject(value)){
        let className = key;
        if (isFirstLetterUpperCase(namedHump)) {
            propertyName = firstLowerWord(namedHump)
            className = `${namedHump}Model`
        }else {
            propertyName = namedHump
            className = `${firstUpperWord(namedHump)}Model`
        }
        attString += `  ${className} ${propertyName} = ${className}();\n`;
    }else if (isNull(value)){
        attString += `  /// note: json value is null \n  dynamic ${propertyName};\n`;
    }else{
        attString += `  var ${propertyName} = ${value};\n`;
    }
    return attString;
}

/// 数组内元素是否相等
/**
 * @param {string | any[]} array
 */
function isAllEqual(array){
    var bool = true
    if (array.length > 1) {
        let firstObject = array[0]
        for (let index = 1; index < array.length; index++) {
            const nexObject  = array[index];
            if (isObject(nexObject)) {
                if (!objSame(nexObject,firstObject)) {
                    bool = false
                    break;
                }
            }else if (isArray(nexObject)) {
                if (!arrSame(nexObject,firstObject)) {
                    bool = false
                    break;
                }
            }
        }
    }
    return bool
}

/// 验证两个object 是否相同
/**
 * @param {{ [x: string]: any; }} obj
 * @param {{ [x: string]: any; }} newObj
 */
function objSame (obj,newObj) {
    let bol = true;
    if (Object.keys(obj).length != Object.keys(newObj).length) {
        return false;
    }
    for(let key in obj) {
        if ( isObject(obj[key])) {
            bol = objSame(obj[key],newObj[key]);
            if (!bol) {
                break;
            }
        } else if ( isArray(obj[key])) {
            bol = arrSame(obj[key],newObj[key])
            if (!bol) {
                break;
            }
        } 
        
        // else if (obj[key] != newObj[key]) {
        //         // 比较两个key是否相同
        //     let objKeys = Object.keys(obj)
        //     let newObjKeys = Object.keys(newObj)
        //     for (let index = 0; index < objKeys.length; index++) {
        //         if (objKeys[index] != newObjKeys[index]) {
        //             bol =  false;  
        //             break;
        //         } 
        //     }
        // }
    }
    return bol
}

/// 验证两个数组是否相同
/**
 * @param {string | any[]} oldArr
 * @param {string | any[]} newArr
 */
function arrSame (oldArr,newArr) {
    let bol = true;
    let count = oldArr.length > newArr.length ? newArr.length:oldArr.length;
    for (let i = 0, n = count;i < n; i++) {
        if (isArray(oldArr[i])) {
            bol = arrSame(oldArr[i],newArr[i])
            if (!bol) {
                break;
            }
        } else if (isObject(oldArr[i])) {
            bol = objSame(oldArr[i],newArr[i])
            if (!bol) {
                break;
            }
        }
        // else if (arr[i] != newArr[i]) {
        //     bol = false;
        //     break;
        // }
    }

    return bol;
}

/// 数组内部元素类型非对象或数组
function arrayIsObject(array){
    let isObjectOrArray = false;
    for (let index = 0; index < array.length; index++) {
        const element = array[index];
        if (isArray(element) || isObject(element)) {
            isObjectOrArray = true
        }
    }
    return isObjectOrArray
}

/// 属性命名转换下划线转驼峰
/**
 * @param {string} word
 */
function namedHumpProperty(word){
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
/**
 * @param {string} word
 */
function firstUpperWord(word){
    if (!isFirstLetterUpperCase(word)) {
        return word.replace(word.charAt(0),word.charAt(0).toUpperCase()); 
    }
    // var lowerWord = word.toLowerCase();
    return word
}

///首字母小写
function firstLowerWord(word){
    if (isFirstLetterUpperCase(word)) {
        return word.replace(word.charAt(0),word.charAt(0).toLowerCase());
    }
    return word
}

/// 首字母是否大写
function isFirstLetterUpperCase(word){
    return (word.charAt(0) >= 'A' && word.charAt(0) <= 'Z')
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
    if (isNull(value)) {
        return false
    }
    return value.constructor.toString().indexOf("Object")>-1;
}

function isNull(value){
    return value === null;
}



