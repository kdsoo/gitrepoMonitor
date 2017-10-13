var fs = require('fs');
var path = require('path');
var readline = require('readline');
var config = require('config');
var root = config.get("rootpath") || path.join(__dirname, "..", "..");
var spawn = require('child_process').spawn;

var cleanrepo = [];
var dirtyrepo = [];
var untrackedrepo = [];
var notrepo = [];

function scanRoot(path, cb) {
	console.log("Start scanning repository root directory: " + path);
	fs.readdir(path, function(err, ret) {
		if (err) {
			cb(err, null);
		} else {
			console.log(ret);
			cb(null, ret);
		}
	});
}

function isGitRepo(path, repo, cb) {
	var repo = path + "/" + repo;
	fs.readdir(repo, function(err, ret) {
		if (err) {
			cb(null, false);
		} else {
			var isrepo = false;
			if (ret.indexOf(".git") > -1)
				isrepo = true;
			cb(null, isrepo);
		}
	});
}

function isGitrepoSync(path, repo) {
	var repo = path + "/" + repo;
	var isrepo = false;
	if (fs.statSync(repo).isFile())
		return isrepo;
	var dir = fs.readdirSync(repo);
	if (dir.indexOf(".git") > -1)
		isrepo = true;
	return isrepo;
}

function parseGit(statusline) {
	var ret = false;
	if (typeof(statusline) !== "object")
		return ret;
	switch (statusline[0]) {
		case "M":
			ret = "modified";
			break;
		case "??":
			ret = "untracked";
			break;
		default:
			break;
	}

	return ret;
}

// returns {modified: val, untracked: val}
function checkGitRepo(path, repo, cb) {
	var repo = path + "/" + repo;
	var gitdir = "--git-dir=" + repo + "/.git";
	var worktree = "--work-tree=" + repo;
	var check = spawn('git', [gitdir, worktree, "status", "-s"]);
	var modified = 0;
	var untracked = 0;
	check.stderr.on('data', function(data) {
	});
	check.stdout.on('data', function(data) {
	});
	var rl = readline.createInterface({input: check.stdout});
	rl.on('line', function(line) {
		var lineArr = line.split(" ").filter(Boolean);
		if (parseGit(lineArr) == "modified") ++modified;
		if (parseGit(lineArr) == "untracked") ++ untracked;
	});
	check.stdout.on('end', function() {
		cb({modified: modified, untracked: untracked});
	});
}

function showStatus() {
	console.log("[" + cleanrepo.length + "] clean repo: " + cleanrepo);
	console.log("[" + dirtyrepo.length + "] dirty repo: " + dirtyrepo);
	console.log("[" + untrackedrepo.length + "] untracked repo: " + untrackedrepo);
	console.log("[" + notrepo.length + "] not repo: " + notrepo);
}

function addToArr(arr, name) {
	if (arr.indexOf(name) < 0) arr.push(name);
}

function checkGitRepoList(path, arr, cb) {
	var checktask = [];
	var promises = [];
	for (var i = 0; i < arr.length; i++) {
		(function(i) {
			var repo = arr[i];
			checktask[i] = new Promise(function(resolve, reject) {
				isGitRepo(path, repo, function(err, ret) {
					if (err) {
						//console.error(err);
					} else {
						if (ret == true) {
							checkGitRepo(path, repo, function(ret) {
								if (ret.modified > 0) addToArr(dirtyrepo, repo);
								if (ret.untracked > 0) addToArr(untrackedrepo, repo);
								if (!ret.modified && !ret.untracked) addToArr(cleanrepo, repo);
								resolve();
							});
						} else {
							if (fs.statSync(path + "/" + repo).isDirectory()) {
								addToArr(notrepo, repo);
							}
							resolve();
						}
					}
				});
			});
			promises.push(checktask[i]);
		})(i);
	}
	Promise.all(promises).then(function(ret) {
		cb({cleanrepo: cleanrepo, dirtyrepo: dirtyrepo, untrackedrepo: untrackedrepo, notrepo: notrepo});
	}).catch(function(err) {
		console.error(err);
	});
}

function getTimestamp(path, cb) {
	var repo = root + "/" + path;
	fs.stat(repo, function(err, ret) {
		if (err) {
			console.error(err);
			cb(err, null);
		} else {
			cb(null, ret);
		}
	});
}
module.exports.getTimestamp = getTimestamp;

function checkStatus(cb) {
	scanRoot(root, function(err, ret) {
		var path = root;
		checkGitRepoList(path, ret, function(ret) {
			showStatus();
			cb(ret);
		});
	});

}
module.exports.checkStatus = checkStatus;
