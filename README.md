# JSON-TO-MODEL README

<br>json数据转模型，flutter开发支持将json转dart class
<br> 如您遇到任问题，可在<a href="https://marketplace.visualstudio.com/items?itemName=qinkuan.jsontomodel&ssr=false#review-details">留言板</a>告诉我，我会及时修复。


# 功能

<br>1、下划线转驼峰重命名，快捷键：shift+cmd+, 
<br>2、json数据转模型类，快捷键：comd + 3
<br>3、支持模型类内添加自定方法：设置-搜索-json转模型

<br>使用方法：
<br>功能1、粘贴json数据到文件，右键选择转换
<br>功能2、选中需要重命名的关键字，右键选择转换

<pre>
<span style="color:#D17378">example1：</span>
<span style="color:#04107B">data_list -> dataList</span>
  

<span style="color:#D17378">example2：</span>
{  <span style="color:#87308A">"code"</span>:<span style="color:#3D7CA3">0</span>,
    <span style="color:#87308A">"message"</span>:<span style="color:#60B257">"successful"</span>,
    <span style="color:#87308A">"data"</span>:{
        <span style="color:#87308A">"name"</span>:<span style="color:#60B257">"张三"</span>,
        <span style="color:#87308A">"age"</span>:<span style="color:#3D7CA3">18</span>
    }
}
</pre>
# 演示

![feature X](/assets/example.gif)


# 提示

<p style="color:red;"><strong>如果项目中添加了如下全局方法，可在设置关闭自动添加安全取值方法</strong></p>
<pre>  <span style="color:#417D97">T</span> <span style="color:#733B1E">safe</span><T><span style="color:#733B1E">(</span><span style="color:#417D97">dynamic</span> <span style="color:#04107B">oldValue</span>, <span style="color:#417D97">dynamic</span> <span style="color:#04107B">newValue</span><span style="color:#733B1E">)</span> <span style="color:#733B1E">{</span>
    if <span style="color:#733B1E">(</span><span style="color:#04107B">oldValue.runtimeType == newValue.runtimeType</span><span style="color:#733B1E">)</span> <span style="color:#733B1E">{</span>
      <span style="color:#A123D4">return</span> <span style="color:#04107B">newValue</span>;
    <span style="color:#733B1E">}</span> <span style="color:#A123D4">else if</span> <span style="color:#733B1E">(</span><span style="color:#733B1E">(</span><span style="color:#04107B">oldValue</span> <span style="color:#3938F5">is</span> <span style="color:#417D97">double</span>) && (<span style="color:#04107B">newValue</span> <span style="color:#3938F5">is</span> <span style="color:#417D97">int</span><span style="color:#733B1E">)</span><span style="color:#733B1E">)</span> <span style="color:#733B1E">{</span> 
      <span style="color:#A123D4">return</span> <span style="color:#733B1E">(</span><span style="color:#04107B">newValue</span>.<span style="color:#733B1E">toDouble()</span> <span style="color:#3938F5">as</span> <span style="color:#417D97">T</span><span style="color:#733B1E">)</span>; 
    <span style="color:#733B1E">}</span>
    <span style="color:#A123D4">return</span> <span style="color:#04107B">oldValue</span>;
  <span style="color:#733B1E">}</span> </pre>
![feature X](/assets/example.png)