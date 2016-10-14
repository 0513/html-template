$.extend({
	login : function(){
		//request : function ([url, header={}, data={}, callback, method="GET", dataType="JSON"]){
		let header = $.dataToJson($("#login-form").serialize());
		$.request(["/v1/auth/login", header, , function(data){
			let token = data.data.token;
			sessionStorage.setItem("user", JSON.stringify(data.data));
			sessionStorage.setItem("token", token);
			document.location.reload();
		},"POST"]);
	},
	logout : function(){
		sessionStorage.removeItem("user");
		sessionStorage.removeItem("token");
		let href = location.href;
		location.href=href.substring(0,href.indexOf("?"));

		// $.request(["/v1/auth/logout", , , function(data){
		// 	sessionStorage.removeItem("user");
		// 	sessionStorage.removeItem("token");
		// 	let href = location.href;
		// 	alert(href.substring(0,href.indexOf("?")))
		// 	location.href=href.substring(0,href.indexOf("?"));
		// },"GET"]);
	}
});