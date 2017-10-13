var searchParams = new URLSearchParams(window.location.search);

$(document).ready(function(){
	var category = searchParams.get("cat");
	if (category == "dirty") {
		getRepos("dirtyrepo");
	} else if (category == "clean") {
		getRepos("cleanrepo");
	} else if (category == "untracked") {
		getRepos("untrackedrepo");
	}
});

function createTable(cat) {
	var list = document.getElementById("repolist");
	var header = document.createElement("div");
	header.className = "row";
	list.appendChild(header);
	var col1 = document.createElement("div");
	col1.className = "col-xs-1";
	col1.style.padding = "5px 5px 5px 5px";
	col1.innerHTML = cat;
	var col2 = document.createElement("div");
	col2.className = "col-xs-1";
	col2.style.padding = "5px 5px 5px 5px";
	col2.innerHTML = "repository";
	var col3 = document.createElement("div");
	col3.className = "col-xs-1";
	col3.style.padding = "5px 5px 5px 5px";
	col3.innerHTML = "timestamp";

	header.appendChild(col1);
	header.appendChild(col2);
	header.appendChild(col3);
}

function getRepos(cat) {
	$.get("status", function(repos, status){
		console.log(repos);
		createTable(cat);
		var list = document.getElementById("repolist");
		var repolist = repos[cat];
		console.log(cat);
		console.log(repolist);
		for (var i = 0; i < repolist.length; i++) {
			console.log(repolist[i]);
			var repo = document.createElement("div");
			repo.className = "row";
			var type = document.createElement("div");
			type.className = "col-xs-1";
			type.style.padding = "5px 5px 5px 5px";
			type.innerHTML = cat;
			repo.appendChild(type);
			var reponame = document.createElement("div");
			reponame.className = "col-xs-3";
			reponame.style.padding = "5px 5px 5px 5px";
			reponame.innerHTML = repolist[i];
			reponame.style.fontWeight = "900";
			repo.appendChild(reponame);
			var timestamp = document.createElement("div");
			timestamp.className = "col-xs-3";
			timestamp.style.padding = "5px 5px 5px 5px";
			timestamp.id = "timestamp-" + repolist[i];
			repo.appendChild(timestamp);

			(function(i) {
				$.get("status/" + repolist[i], function(stat, status){
					document.getElementById("timestamp-"+repolist[i]).innerHTML = stat.mtime;
				});
			})(i);

			list.appendChild(repo);
		}
	});
}

function secondsToString(seconds) {
	var numdays = Math.floor(seconds / 86400);
	var numhours = Math.floor((seconds % 86400) / 3600);
	var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
	var numseconds = ((seconds % 86400) % 3600) % 60;
	return numdays + " days " + numhours + " hours " + numminutes + " minutes " + numseconds + " seconds";
}

