var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

hexo.on('new', function(target){
  exec('start ' + target);
});