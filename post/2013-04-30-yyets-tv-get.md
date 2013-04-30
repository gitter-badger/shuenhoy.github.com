title: 美剧播出时间表取得JSON代码
category: 一些代码
---
好吧这是[Sen](http://sl088.com)给出的挑战,然后好像是获得美剧播出时间表的= =放在Chrome的console里运行

<!--more-->

```javascript
function taketime(str, month) { //格式化月份
	var daystr = str.match(/(\d+)号/)[1];
	if(typeof(month) == "number") {
		month = month.toString()
	};
	var result = ((month.length == 1) ? "0" + month : month) + ((daystr.length == 1) ? "0" + daystr : daystr);
	return result;
}

function get_show(ddall) { //获得单个节目
	var ddme = $(ddall);
	if(ddme.text() == "今日无节目") {
		return {
			"name": "今日 无节目"
		};
	}
	//可能返回的只是一堆空白
	var name = ddme.find("font:first").text() + " " + ddme.find("font:last").text(); //获得文字
	var url = ddme.find("a").attr("href");
	return {
		"name": name,
		"url": url
	};
}

function get_allshow(dtparent) { //获得所有节目
	var result = []; //声明数组结构
	dtparent.find("dd").each(function(a, b) {
		result[a] = get_show(b);
	}); //获得每个节目
	return result; //返回数组结果
}
//获取所有月份，赋值月份


function get_monthshow(month) {
	var result = new Object();
	$(".playTime_tv dt").each(function(index, theday) {
		//得到每个月的所有玩意
		result[taketime($(theday).text(), month)] = get_allshow($(theday).parent());
	});
	return result;
}
//取得本页是几月的


function askmonth() {
	var result = $(".itemTit2:first h2").text().match(/(\d+)月美剧/)[1];
	return result;
}
//返回JSON字符串


function get_tv_json(month) {
	return get_monthshow(month || askmonth()); //没有给予月份的时候赋予
}
//返回截断的Json



function just_get_tv (year,start,end) {
	var m={};
	for(var i=start;i<=end;i++){
		var html=$.ajax({url:'http://www.yyets.com/tv/schedule/index/year/'+year+'/month/'+(i>=10?i:"0"+i),async:false}).responseText;
		var s=html.match(/<body>[\s\S]*?<\/body>/)[0];
		document.write(s);
		m[i]=get_tv_json(i);
	}
	document.write(html);
	return JSON.stringify(m);
}
console.log("耶哈！开始获得吧！");
console.log(just_get_tv(2013,5,6));
console.log("就这些了！拿去吧！请加以致谢yyets维护时间表的人！");

```