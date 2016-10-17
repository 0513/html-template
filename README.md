##简介
页面模板引擎可简化、规范页面代码，但其多为服务器端解释，一方面增大服务器压力，另一方面也不能纯粹地实现前后端分离，很好地应用restful风格。
此项目只用前端技术（html、js）来实现页面模板引擎功能，并实现一定页面引擎的功能
##功能列表
* 基础功能：ajax加载页面到指定区域（即可实现页面固定模板）
* 其他功能：
    * 根据数据`填充表单`、集成日期控件
    * `列表`、分页、查询功能
    * 弹出内容（可以是页面内元素，也可以是某一指定页面）
    * 权限控制（根据http status code)
    
##原理
* 对.ajax-load的页面元素，采用ajax的方式来加载其data-href属性，并将获取的元素加载到指定的data-content区域
* 获取到元素后：更改title，将元素插入到指定区域，更改url（以便刷新页面时，可还原到目前状态）
* url生成规则：对每个.ajax-load元素，若没有ID属性，则生成。点击后，url中记录此id，当刷新页面时，后根据url重新依次加载内容。

##用法
* 加载页面有2种方式：
    * 第一种方式支持循环调用，即需加载的内容里还有可点击的.ajax-load
        
        ```
        <a class="ajax-load" data-href="/page/login.html" data-target="content" id="to-login"></a>
        ```
    * 第二种方式直接将data-href属性加载到id为content的元素中，并忽略加载到的内容里的.ajax-load，此种方式更直观，效率更高，且多数情况下够用
        
        ```
        <a class="ajax-load direct" data-href="/page/aaa.html" id="direct-default"></a>
        ```
* 封装的ajax使用：由于使用了es6的析构表达式赋值，所以最简单及最复杂的方式分别如下：
    ```javascript
    //simple
    $.request(["aaa.html"]);
    
    //complex
    $.request(["aaa.html", {"X-Auth-Token":"1234"}, {"user":"1234"}, function(data){
        //这里是回调方法，data为返回的内容
    }, "GET", "JSON", "application/json"]);
    ```
* 列表、分页、查询
    
    ```
    <!--查询表单-->
    <form id="records-query"><input type="text" name="code"></form>
    <!--表格-->
    <table class="table table-hover" id="recordsTable"></table>
    <!--分页-->
    <div id="records-nav" class="center"></div>
    ```
    ```javascript
    fillRecordTable : function(page, size, queryStr){
       $.request(["/v1/childs?page=1&size=10&queryStr="+queryStr, , , function(data){
           let config = {
               rows:{ //为tr添加属性
                    id:"code"
               },
               columns:[
                   {name:"序号",value:1}, //name表示列名，value为列值
                   {name:"卡号",value:"code"}, //value=code表示取当前行的数据的code属性，支持多级选择，如value=user.name，若为常量加type=const属性
                   {name:"选中",value:function(d){ //d为当前行的数据
                        return "<input type='checkbox'>";
                   }}
               ]
           };
           $.fillTable(config, data.data.content, "recordsTable"); //生成表格
           $.markSort(["recordsTable"]); //为表格第一列增加序号
           $.nav(data.data, $("#records-nav"), $.fillRecordTable, $.formToQuery("records-query")); //生成分页
       }]);
    }
    ```
* 表单填充
    
    ```javascript
    $.fillForm("form-id", data); //data属性名及form表单的name匹配
    ```
* 弹出框
    ```javascript
    //弹出页面
    $.modal(["aaa.html"]);
    
    //弹出自定义内容
    $.modal([, {"title":"提醒","content":"今天晚上要加载"}]);
    
    //弹出页面元素
    $.modal([, {"title":"提醒","content":$("#aaa").clone()}]);
    
    //定义button，未定义默认有“取消”按钮
    $.modal(["aaa.html",,[ 
       {
           value : "查看",
           callback:function(){
               //点击回调函数
           },
           css:"btn-default"
       }
    ]]);
    ```
##参考资料
待补充
##不完善
* 最大的问题：从之前做的项目里剥离，还未调试，所以现在还不能用……
* 用了npm、babel等来使用es6的语法，但对于第三方库，比如jQuery、bootstrap并未使用npm依赖，因为比如require('jquery')，那么它会将此js文件至少打包成上百K的文件
* 由于上条，未使用module来导出组件，所以所有功能都挂在jQuery上发布