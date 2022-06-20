# JSON-TO-MODEL README

<br>json数据转模型，flutter开发支持将json转dart class

# 功能

<br>1、下划线转驼峰重命名，快捷键：comd + . 
<br>2、json数据转模型类，快捷键：comd + 3
<br>3、支持模型类内添加自定方法：设置-搜索-json转模型

<br>使用方法：
<br>1、新建模型文件
<br>2、粘贴json数据到文件，右键选择转换

<pre>
example1： 
data_list -> dataList</pre>
<pre>
example2：
{  "code":0,
    "message":"successful",
    "data":{
        "name":"张三",
        "age":18
    }
}

转换后:

class DemoModel {
  int code = 0;
  
  String message = '';

  DataModel data = DataModel();

  DemoModel();

  DemoModel.fromJson(Map json) {
    code = safety(code, json['code']);
    message = safety(message, json['message']);
    data = DataModel.fromJson(safety(<String, dynamic>{}, json['data']));

  }

  T safety<T>(dynamic oldValue, dynamic newValue) {
    if (oldValue.runtimeType == newValue.runtimeType) { 
      return newValue;
    }
    return oldValue; 
  }
}

class DataModel {
  String name = '';

  int age = 0;

  DataModel();

  DataModel.fromJson(Map json) {
    name = safety(name, json['name']);
    age = safety(age, json['age']);

  }

  T safety<T>(dynamic oldValue, dynamic newValue) {
    if (oldValue.runtimeType == newValue.runtimeType) { 
      return newValue;
    }
    return oldValue; 
  }

}
</pre>

# 演示

![feature X](/assets/example.gif)


# 提示

如果项目中添加了如下全局方法，可在设置关闭自动添加安全取值方法
<pre>  T safe<T>(dynamic oldValue, dynamic newValue) {
    if (oldValue.runtimeType == newValue.runtimeType) {
      return newValue;
    }
    return oldValue;
  }</pre>
![feature X](/assets/example.png)