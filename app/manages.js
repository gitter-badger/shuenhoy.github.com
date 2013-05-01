this.github = {
	update: function(config, database, callback) {

		var bu = 'https://api.github.com/repos/' + config.manage.user + '/' + config.manage.repo + '/branches';
		var num = 2;
		var ver, list = [];

		$.get(bu, function(info) {


			if (database.version != info[0].commit.sha) {
				ver = info[0].commit.sha;
			} else {
				ver = false;
			}
			if (--num == 0) {
				console.log(1)
				callback(ver, list);
			}
		});

		var lu = 'https://api.github.com/repos/' + config.manage.user + '/' + config.manage.repo + '/contents/post';
		$.get(lu, function(tlist) {
			for (var i = tlist.length - 1; i >= 0; i--) {
				list.push(tlist[i].name);
			}
			if (--num == 0) {
				
				callback(ver, list);
			}
		});

	},
	getlist: function(config) {
		var list = JSON.parse(getSync('https://api.github.com/repos/' + config.manage.user + '/' + config.manage.repo + '/contents/post'));

		var tlist = [];
		for (var i = list.length - 1; i >= 0; i--) {

			tlist.push(list[i].name);
		}

		return tlist;
	}
};
this.manul = {
	needUpdateTest: function(config, database) {
		if (database.version !== config.manage.version || config.manage.always) {
			return config.version || config.manage.always;
		} else {
			return false;
		}
	},
	getlist: function() {
		return jsyaml.load(getSync('list.yml'));
	}
};
