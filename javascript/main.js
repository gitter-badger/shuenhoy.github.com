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
	if(callback) {
		if(js.readyState) { //IE
			js.onreadystatechange = function() {
				if(js.readyState == "loaded" || js.readyState == "complete") {
					js.onreadystatechange = null;
					callback(url);
				}
			};
		} else { //Others
			js.onload = function() {
				callback(url);
			};
		}
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

function loadList(urls, callback) {

	var nums = urls.length
	for(var i = 0; i < urls.length; i++) {
		loadAsync(urls[i], function(url) {
			if(--nums == 0) {
				callback();
			}
		});
	};
	//loadCallback(urls, 0, callback);
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

loadList(['http://ajax.microsoft.com/ajax/jquery/jquery-1.9.1.min.js', 'javascript/showdown.js','javascript/marked.js', 'javascript/template.min.js', 'javascript/jsyaml.mini.js', 'javascript/highlight.pack.js'], function() {
marked.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  langPrefix: 'language-',
  highlight: function(code, lang) {
    if (lang === 'js') {
      return highlighter.javascript(code);
    }
    return code;
  }
});
	loadList(['javascript/sammy-latest.min.js', 'javascript/showdown-ext/github.js', 'javascript/showdown-ext/table.js', 'javascript/template-syntax.js'], function() {
		loadAsync('http://tajs.qq.com/stats?sId=16049737');
		hljs.initHighlightingOnLoad();

		var app = Sammy(function() {

			// initialize the application
			var that = this;
			var main_content = $("#content");
			var config = jsyaml.load(getSync('config.yml'));
			localStorage = localStorage || {}; //兼容
			var database = localStorage.database ? JSON.parse(localStorage.database) : {
				posts: []
			};
			//['github','table','prettify']
			var converter = new Showdown.converter({
				extensions: ['github', 'table']
			});
      converter.makeHtml= marked;
			template.helper('post_url', function(v) {
				return '#!/post/' + v.name;
			});
			template.helper('more', function(text) {
				return text.split(/<!--more-->/)[0];
			});
			template.helper('config', config);

			function setTmpl(id, context) {
				if(context) {
					var html = template.render(id, context);
				} else {
					var html = template.render(id);
				}

				main_content.html(html, config);
			}
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

			template.helper('database', database);



			function readPostInfo(text, name) {
				var ret = text.match(/([\s\S]*?)----*([\s\S]*)/);
				var head = jsyaml.load(ret[1]);
				var body = converter.makeHtml(ret[2]);
				head.name = name;
				head.body = body;
				return head;
			}

			function getPost(postList, callback) {
				var num = postList.length;

				for(var i = 0; i < postList.length; i++) {
					(function(j) {
						$.get('post/' + postList[i][1], function(data) {

							database.posts[j] = readPostInfo(data, postList[j][0]);
							if(--num == 0) {

								callback();
							}
						});
					})(i);
				};


			}

/*if( !! newVersion) {
					database.version = newVersion;
					var postList = manages[config.manage.type].getlist(config);
					for(var i in postList) {
						postList[i] = [postList[i].replace(/^([0-9]*-[0-9]*-[0-9]*-)/, '').replace(/\.md$/, ''), postList[i].replace(/\.md/g, '.md')];
					}
					getPost(postList, function() {
						localStorage.database = JSON.stringify(database);
						callback();
					});

				} else {
					callback();
				}*/
			function update(callback) {

				manages[config.manage.type].update(config, database, function(newVersion, list) {
					if( !! newVersion) {
						database.version = newVersion;
						var postList = list;
						for(var i in postList) {
							postList[i] = [postList[i].replace(/^([0-9]*-[0-9]*-[0-9]*-)/, '').replace(/\.md$/, ''), postList[i].replace(/\.md/g, '.md')];
						}
						getPost(postList, function() {
							localStorage.database = JSON.stringify(database);
							callback();
						});

					} else {
						callback();
					}
				});



			}


			this.notFound = function() {
				setTmpl('404-tmpl', database);

				return false;
			}

			this.get('#!/', function() {
				setTmpl('loading-tmpl', config);
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
						if(config.duoshuo_id) DUOSHUO.initView();
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
					if(config.duoshuo_id) DUOSHUO.initView();

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

});