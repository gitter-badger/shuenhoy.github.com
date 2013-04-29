function loadSync(url, that) {

	if(url == null || typeof(url) != 'string') return;

	var xmlHttp = getHttpRequest();
	xmlHttp.open('GET', url, false);
	xmlHttp.send(null);
	if(xmlHttp.readyState == 4) {
		if(xmlHttp.status == 200 || xmlHttp.status == 304) {

			if(!that) {
				return eval(xmlHttp.responseText);
			} else {

				return eval('(function(){' + xmlHttp.responseText + '})').bind(that)();
			}

		} else {
			alert('XML request error: ' + xmlHttp.statusText + ' (' + xmlHttp.status + ')');
		}
	}
}

function loadAsync(url, callback) {

	if(url == null || typeof(url) != 'string') return;
	var js = document.createElement('script');
	if(js.readyState) { //IE
		js.onreadystatechange = function() {
			if(js.readyState == "loaded" || js.readyState == "complete") {
				js.onreadystatechange = null;
				callback();
			}
		};
	} else { //Others
		js.onload = function() {
			callback();
		};
	}
	js.type = 'text/javascript';
	js.charset = 'utf-8';
	js.src = url;

	document.getElementsByTagName('head')[0].appendChild(js);

}

function loadCallback(urls, i, callback) {
	if(!urls[i]) return callback();
	loadAsync(urls[i], function() {
		loadCallback(urls, i + 1, callback);
	});
}

function load(urls, callback) {
	loadCallback(urls, 0, callback);
}
//javascript / google - code - prettify / prettify.js

function getHttpRequest() {
	if(window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else if(window.ActiveXObject) {
		return new ActiveXObject('MsXml2.XMLHTTP');
	}
}

function getSync(url) {
	return $.ajax({
		url: url,
		async: false
	}).responseText;
}



load(['javascript/highlight.pack.js', 'javascript/jquery-1.9.1.min.js', 'javascript/sammy-latest.min.js', 'javascript/template.min.js', 'javascript/template-syntax.js', 'javascript/jsyaml.mini.js', 'javascript/showdown.js', 'javascript/showdown-ext/github.js', 'javascript/showdown-ext/table.js', 'javascript/showdown-ext/prettify.js'], function() {
	hljs.initHighlightingOnLoad();

	// initialize the application
	var app = Sammy(function() {
		var that = this;

		localStorage = localStorage || {}; //兼容
		var config = jsyaml.load(getSync('config.yml'));

		var database = localStorage.database ? JSON.parse(localStorage.database) : {
			posts: []
		};
		var main_content = $("#content"); //['github','table','prettify']
		var converter = new Showdown.converter({
			extensions: ['github', 'table', 'prettify']
		});
		var manages = {};
		if(config.duoshuo_id) {
			window.duoshuoQuery = {
				short_name: config.duoshuo_id
			};

			(function() {
				var ds = document.createElement('script');
				ds.type = 'text/javascript';
				ds.async = true;
				ds.src = 'http://static.duoshuo.com/embed.js';
				ds.charset = 'UTF-8';
				(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(ds);
			})();
		}
		loadSync('app/manages.js', manages);
		template.helper('post_url', function(v) {
			return '#!/post/' + v.name;
		});
		template.helper('more', function(text) {
			return text.split(/<!--more-->/)[0];
		});
		template.helper('database', database);
		template.helper('config', config);


		function readPostInfo(text, name) {
			var ret = text.match(/([\s\S]*?)----*([\s\S]*)/);
			var head = jsyaml.load(ret[1]);
			var body = converter.makeHtml(ret[2]);
			head.name = name;
			head.body = body;
			return head;
		}

		function getPost(postList, index, callback) {
			if(!postList[index]) return callback();

			$.get('post/' + postList[index][1], function(data) {

				database.posts[index] = readPostInfo(data, postList[index][0]);
				getPost(postList, index + 1, callback);
			});
		}


		function update(callback) {

			var newVersion = manages[config.manage.type].needUpdateTest(config, database);


			if( !! newVersion) {
				database.version = newVersion;
				var postList = manages[config.manage.type].getlist(config);
				for(var i in postList) {
					postList[i] = [postList[i].replace(/^([0-9]*-[0-9]*-[0-9]*-)/, '').replace(/\.md$/, ''), postList[i].replace(/\.md/g, '.md')];
				}
				getPost(postList, 0, function() {
					localStorage.database = JSON.stringify(database);
					callback();
				});

			} else {
				callback();
			}

		}

		function setTmpl(id, context) {
			var html = template.render(id, context);
			main_content.html(html);
		}
		this.notFound = function() {
			setTmpl('404-tmpl', database);

			return false;
		}
		this.get('#!/', function() {
			//setTmpl('404-tmpl');
			update(function() {
				setTmpl('index-tmpl', database);
				$("title").text("Home | " + config.title);
			});
		});


		this.get(config.routes.post, function() {
			//this.params['year']
			//this.params['month']
			//this.params['day']
			var post;
			var name = this.params['name'];
			var html = template.render('loading-tmpl', config);
			main_content.html(html);
			for(var i in database.posts) {
				if(database.posts[i].name == name) {
					post = database.posts[i];
					setTmpl('post-tmpl', post);
					$('pre code').each(function(i, e) {
						hljs.highlightBlock(e)
					});
					$("title").text(post.title + " | " + config.title);
					if(config.duoshuo_id)
						DUOSHUO.initView();
					return true;
				}
			}
			this.notFound();


		});
		this.get(config.routes.page, function() {
			var post;
			var name = this.params['name'];
			var html = template.render('loading-tmpl', config);
			main_content.html(html);
			$.get('page/' + name + '.md', function(data) {
				var page = readPostInfo(data, name);
				setTmpl('page-tmpl', page);
				$("title").text(page.title + " | " + config.title);
				$('pre code').each(function(i, e) {
					hljs.highlightBlock(e)
				});
				if(config.duoshuo_id)
						DUOSHUO.initView();

			}).fail(function() {
				this.notFound();
			});



			//this.params['year']
			//this.params['month']
			//this.params['day']
			//this.params['name']
		});
	});



	// start the application
	app.run('#!/');
});