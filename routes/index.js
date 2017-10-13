var express = require('express');
var path = require('path');
var router = express.Router();
var gitmonitor = require('../services/gitmonitor');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Git repository check service' });
});

router.get('/admin', function(req, res, next) {
	res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'));
});

router.get('/status', function(req, res, next) {
	gitmonitor.checkStatus(function(ret) {
		res.json(ret);
	});
});

router.get('/status/:repo', function(req, res, next) {
	var repo = req.params.repo;
	gitmonitor.getTimestamp(repo, function(err, ret) {
		if (err) {
			res.status(503);
			res.send(err);
		} else {
			res.json(ret);
		}
	});
});

module.exports = router;
