$.extend({
	//请求后台
	request : function ([url, header={}, data={}, callback, method="GET", dataType="JSON", ContentType="application/json"]){
		let token = sessionStorage.getItem("token");
		let isHtml = dataType.toUpperCase() === "HTML";
		//传string时，表示为form表单的ID，其他时候需要传json格式
		let postData;
		if(method.toUpperCase() === "GET"){
			postData = null;
		}else{
			postData = typeof(data)==="string"? $.dataToJsonStr($("#"+data).serialize()):JSON.stringify(data);
		}
		postData = decodeURIComponent(postData, true);
		//不符合情况时刷新页面，页面在无token时会自动加载登录页
		//条件：没有token，且不是登录页面，也不是登录请求
		if(!token && (isHtml && !/login.html/.test(url) || !isHtml && !/auth\/login/.test(url))){
			document.location.reload();
			return;
		}
		$(".ajax-loading").show();
		$.ajax({
			url:(isHtml ? htmlRemote:remote) + url,
			method:method,
			dataType:dataType,
			data:postData,
			beforeSend:function(xhr){ //设置header
				for(let param in header){
					xhr.setRequestHeader(param, header[param]);
				}
				xhr.setRequestHeader("X-Auth-Token", token);
				xhr.setRequestHeader("Content-Type", ContentType);
			},
			success:function(data){
				$(".ajax-loading").hide();
				if(data.code == "0" || isHtml){
					if(callback){
						callback(data);
					}
				}else{
					alert(data.message);
				}
			},
			error:function(xhr,textStatus,errorThrown){
				$(".ajax-loading").hide();
				if (xhr.status == 401 && !/auth\/login/.test(url)) {
					sessionStorage.removeItem("token");
					sessionStorage.removeItem("username");
					document.location.reload();
				}
			}
		})
	},
	//加载html并弹出
	//当url不为空时，加载页面，并以页面的title及body填充弹出框
	//当url为空时，以content.title及content.body填充，content.body可直接为DOM
	modal:function([url="", content={title:'',body:''} ,buttons]){
		buttons = buttons || [{
			value : "关闭",
			callback:function(){
				$('#modal').modal("hide");
			},
			css:"btn-default"
		}];
		//增加button
		let $footer = $("#modal .modal-footer").html("");
		for(let button of buttons){
			let $button = $("<button type='button' class='btn'></button>");
			$button.html(button.value);
			$button.addClass(button.css);
			$button.click(button.callback);
			$footer.append($button);
		}

		if(url){
			$.request([url, , , function(data){
				let html = $.parseHTML(data,true);
				let $body = $("#modal .modal-body").html("");

				for(let node of html) {
					if (node.nodeType == "1" && node.tagName == "TITLE") {
						$("#modal .modal-title").html(node.innerHTML);
					} else if (node.nodeType == "1" && node.tagName != "META") {
						$body.append(node);
					}
				}
				$('#modal').modal();
			},,"HTML"])
		}else{
			$("#modal .modal-title").html(content.title);
			$("#modal .modal-body").html(content.body);
			$('#modal').modal();
		}
	},
	//a=a&b=b => {a:"a",b:"b"}
	dataToJson:function (data){
		if(!data){
			return {};
		}
		let json = {};
		let params = data.split("&");
		for(let param of params){
			let keyValue = param.split("=");
			json[keyValue[0]] = keyValue[1];
		}
		return json;
	},
	dataToJsonStr:function(data){
		return JSON.stringify($.dataToJson(data));
	},
	jsonToData:function(json){
		throw new RegExp();
	},
	//给表格加排序号
	markSort:function([id, i=1]){
		$tds = $("#"+id+" tr:visible td:first-child");
		for(let j = 0; j < $tds.length; j++){
			$tds.eq(j).html(i+j);
		}
	},
	//填充表单
	fillForm:function(formId, data){
		let $form = $("#"+formId);
		for(let key in data){
			$form.find("input[type=text][name=key], textarea[name=key], select[name=key]".replace(/key/g,key)).val(data[key]);
			$radios = $("input[type=radio][name="+key+"]");
			if($radios[0]){
				$form.find("input[type=radio][name="+key+"][value="+data[key]+"]").attr("checked","checked");
			}
			
			//TODO:照片   复选框
		}
	},
	//填充表格
	//具体使用可参考records.js
	fillTable:function(config, data, formId){
		let $table = $("#"+formId).html("");
		//创建表头
		let $thead = $("<thead><tr></tr></thead>");
		for(let column of config.columns){
			$th = $("<th>"+column.name+"</th>");
			$thead.find("tr").append($th);
		}
		$table.append($thead);
		let $tbody = $("<tbody></tbody>");
		$table.append($tbody);
		//创建行
		for(let row of data){
			let $tr = $("<tr></tr>");
			//为tr添加属性
			for(let key in config.rows){
				let v = row;
				let keys = config.rows[key].split(".");
				for(let key1 of keys){
					v = v[key1];
				}
				$tr.attr(key, v);
			}
			//填充td
			for(let column of config.columns){
				let value = column.value;
				let type = typeof(value);
				let $td = $("<td></td>");
				try{
					if(type=="function" || type=="object"){//如果是function
						$td.html(value(row));
					} else if(column.type === "const"){//如果是常量
						$td.html(value);
					} else if(type === "string"){//如果是属性名
						let v = row;
						let keys = value.split(".");
						for(let key of keys){
							v = v[key];
						}
						$td.html(v);
					}

				} catch(e){ //值链中有可能为null
					console.log(e)
				}
				$tr.append($td);
			}
			$tbody.append($tr);
		}
	},
	//分页
	//data：列表后端返回值的data属性
	//callback：回调方法，在callback中调用$.fillTable
	//queryStr：query参数
	nav:function(data, parent, callback, queryStr){
		let totalPage = data.totalPages; //总页数
		let current = data.number + 1; //当前页, 之前写demo的时候，分页从1开始计!!!
		let size = data.size; //每页条数
		let first = data.first; //是不是第一页
		let last = data.last; //是不是最后一页
		parent.html("<ul class='pagination'></ul>");
		parent = parent.find("ul");
		//上一页
		if(first){
			parent.append("<li class='not-allowed'><a href='javascript:void(0)' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
		}else{
			let $li = $("<li><a href='javascript:void(0)' aria-label='Previous'><span aria-hidden='true'>&laquo;</span></a></li>");
			$li.click(function(){
				callback(current-2, size, queryStr);
			});
			parent.append($li);
		}
		//方法：添加某个跳转链接
		function appendPageTo(to){
			let $li = $("<li><a href='javascript:void(0)'>"+to+"</a></li>");
			$li.click(function(){
				callback(to-1, size, queryStr);
			});
			parent.append($li);
		}
		if(current > 4 && totalPage > 6){
			appendPageTo(1);
			parent.append($("<li><a href='javascript:void(0)'>...</a></li>"));
		}
		if(current == 6 && totalPage == 6){
			appendPageTo(1);
		}
		if(current == totalPage && current-4 > 0 || current == 5 && totalPage <= 6){
			appendPageTo(current-4);
		}
		if(current >= totalPage-1 && current-3 > 0 || current==4){
			appendPageTo(current-3);
		}
		if(current-2 > 0){
			appendPageTo(current-2);
		}
		if(current-1 > 0){
			appendPageTo(current-1);
		}
		parent.append($("<li><a href='javascript:void(0)'style='color:red' class='not-allowed'>"+current+"</a></li>"));
		if(current+1 <= totalPage){
			appendPageTo(current+1);
		}
		if(current+2 <= totalPage){
			appendPageTo(current+2);
		}
		if(current+3 <= totalPage && current <= 2 || current == totalPage-3){
			appendPageTo(current+3);
		}
		if(current+4 <= totalPage && current == 1 || current == totalPage -4 && totalPage == 6){
			appendPageTo(current+4);
		}
		if(current == 1 && totalPage == 6){
			appendPageTo(current+6);
		}
		if(totalPage >= 7 && current < totalPage - 3){
			parent.append($("<li><a href='javascript:void(0)'>...</a></li>"));
			appendPageTo(totalPage);
		}
		//下一页
		if(last){
			parent.append("<li class='not-allowed'><a href='javascript:void(0)' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>");
		}else{
			let $li = $("<li><a href='javascript:void(0)' aria-label='Next'><span aria-hidden='true'>&raquo;</span></a></li>");
			$li.click(function(){
				callback(current, size, queryStr);
			});
			parent.append($li);
		}

	},
	print:function(id){
		//目前只支持iframe
		let iframeWindow=window.frames[id].window;
		iframeWindow.print();
	},
	//根据文本内容选出dom
	selectDomByText:function(text, $document){
		let $nodes = [];
		let $doms = $("*", $document);
		$doms.each(function(i, n){
			let $n = $(n);
			if($n.text().indexOf(text) != -1){
				$nodes.push($n);
			}
		});
		return $nodes;
	},
	replaceText:function(text, value, $document){
		let $nodes = $.selectDomByText("#{"+text+"}", $document);
		for($node of $nodes){
			var b = eval("/"+("#{"+text+"}").replace(/\./g,"\\.")+"/g");
			$node.html($node.html().replace(b, value));
		}
	},
	//将form转化为query的格式，只取有值的
	formToQuery : function(id){
		let queryStr = $("#"+id).serialize();
		let querys = queryStr.split("&");
		let result = "";
		for(let query of querys){
			let param = query.split("=");
			if(param.length == 2 && param[1]){
				result = result + " and " + param[0] + "==" + param[1];
			}
		}
		result = result.replace(/^ and /, "");
		if(result){
			return "query="+result;
		}else{
			return "";
		}
	}
})

{
	let marks = [];
	let paramPage = getQueryString("page");
	if(!paramPage){
		marks = getQueryString("mark")?getQueryString("mark").split("`"):[];
	}
	//导航ul li点击变色
	$("body").on("click", ".nav-pills li", function(){
		$(this).siblings().removeClass("active");
		$(this).addClass("active");
	});
	$("body").on("click", ".ajax-load", function(){
		let $this = $(this);
		let target, href;
		let isDirect = $this.is(".direct");
		if(isDirect){
			target = "content";
		}else{
			target = $(this).data("target");
		}
		href = $this.data("href");
		let doLoad = function(data){
			let html = $.parseHTML(data,true);
			let $content = $("#"+target).html("");

			for(let node of html) {
				if (node.nodeType == "1" && node.tagName == "TITLE") {
					document.title = node.innerHTML;
				} else if (node.nodeType == "1" && node.tagName != "META") {
					$content.append(node);
				}
			}
			//初始化日期控件
			$(".form_datetime").datetimepicker({format: 'yyyy-mm-dd',minView:2,language:"zh-CN",autoclose:true });

			if(isDirect){
				var newHref=changeURLPar(location.href, "page", href);
				var stateObject = {};
				history.pushState(stateObject,null,newHref);
			}else{
				//为每个新加载的ajax-load赋予标识，data-pre-mark为当前点击的元素，类似链表结构
				$("#"+target+" .ajax-load").each(function(i, n){
					$(n).attr("data-pre-mark", $this.attr("data-mark"));
					$(n).attr("data-mark", $this.attr("data-mark")+i);
				});
				//生成url里mark参数
				var markParam = $this.data("mark");
				var point = $this;
				while(true){
					if(point.is("[data-pre-mark]")){
						point = $(".ajax-load[data-mark="+point.data("pre-mark")+"]");
						markParam = markParam + "`"+point.data("mark");
					}else{
						break;
					}
				}

				var newHref=changeURLPar(location.href, "mark", markParam);
				newHref = changeURLPar(newHref, "page", "");
				var stateObject = {};
				history.pushState(stateObject,null,newHref);

				//若还有mark为执行，则重复调用
				if(marks.length > 0 && sessionStorage.getItem("token")){
					let mark = marks.pop();
					$(".ajax-load[data-mark="+mark+"]").trigger("click");
				}
			}
		}
		$.request([href, , , doLoad, ,"HTML"]);
		//如果是导航菜单，则处理变色
		let parentLi = $this.closest(".nav-pills li");
		if(parentLi[0]){
			parentLi.siblings().removeClass("active");
			parentLi.addClass("active");
		}
		return false;
	});
	/**
	 * 对权限的控制如下：
	 * 如果没有token，则直接跳转到login页面
	 * 登录成功后，刷新页面，并保存用户及token信息
	 * 如果有token，则可正常访问，但ajax请求若返回401，则删除token及用户信息，并刷新页面（此时会自动加载login页面）
	*/	
	//如果没有token信息，则加载login页面，否则显示退出按钮
	if(!sessionStorage.getItem("token")){
		$("#to-login").trigger("click");
	}else{
		$("#logout").html("退出");
	}

	$(".ajax-load").each(function(i, n){
		var html = $(n).get(0).outerHTML;
		$(n).attr("data-mark", "mark"+i);
	});
	if(marks.length > 0){
		let mark = marks.pop();
		var markNode = $(".ajax-load[data-mark="+mark+"]");
		if(!markNode.is("#to-login") && sessionStorage.getItem("token")){//当不是登录页时，且已登录时，触发第一个，以后会在ajax回调中顺序触发
			markNode.trigger("click");
		}
	}
	if(paramPage && sessionStorage.getItem("token")){
		$("#direct-default").attr("data-href", paramPage).trigger("click");
	}
	//是否显示欢迎页
	if((location.href.indexOf("?") == -1 || location.href.indexOf("mark=mark3") != -1) && sessionStorage.getItem("token")){
		$("#welcome").removeClass("none");
	}else{
		$("#welcome").addClass("none");
	}
	//日期
	$.fn.datetimepicker.dates['zh-CN'] = {
		days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
		daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
		daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
		months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		today: "今天",
		suffix: [],
		meridiem: ["上午", "下午"]
	};

	/**获取url参数*/
	function getQueryString(name){
		var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if(r!=null)return  unescape(r[2]); return null;
	}
	/**设置url参数*/
	function changeURLPar(destiny, par, par_value){
		var pattern = par+'=([^&]*)';
		var replaceText = par+'='+par_value;
		if (destiny.match(pattern)){
			var tmp = '/\\'+par+'=[^&]*/';
			tmp = destiny.replace(eval(tmp), replaceText);
			return (tmp);
		}
		else{
			if (destiny.match('[\?]')){
				return destiny+'&'+ replaceText;
			}
			else{
				return destiny+'?'+replaceText;
			}
		}
		return destiny+'\n'+par+'\n'+par_value;
	}
}
