var fs = require('fs');
var path = require('path');
var readline = require('readline');
var root = path.join(__dirname, "..", "..");
var spawn = require('child_process').spawn;

var cleanrepo = [];
var dirtyrepo = [];
var untrackedrepo = [];
var notrepo = [];

function scanRoot(path, cb) {
	console.log("Start scanning repository root directory: " + root);
	fs.readdir(path, function(err, ret) {
		if (err) {
			cb(err, null);
		} else {
			cb(null, ret);
		}
	});
}

function isGitRepo(path, cb) {
	var repo = root + "/" + path;
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

function isGitrepoSync(path) {
	var repo = root + "/" + path;
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
function checkGitRepo(path, cb) {
	var repo = root + "/" + path;
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

function checkGitRepoList(arr, cb) {
	var checktask = [];
	var promises = [];
	for (var i = 0; i < arr.length; i++) {
		(function(i) {
			var repo = arr[i];
			checktask[i] = new Promise(function(resolve, reject) {
				isGitRepo(repo, function(err, ret) {
					if (err) {
						//console.error(err);
					} else {
						if (ret == true) {
							checkGitRepo(repo, function(ret) {
								if (ret.modified > 0) dirtyrepo.push(repo);
								if (ret.untracked > 0) untrackedrepo.push(repo);
								if (!ret.modified && !ret.untracked) cleanrepo.push(repo);
								resolve();
							});
						} else {
							if (fs.statSync(root + "/" + repo).isDirectory())
								notrepo.push(repo);
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

scanRoot(root, function(err, ret) {
	checkGitRepoList(ret, function(ret) {
		showStatus();
	});
});
