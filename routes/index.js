var express = require('express');
var router = express.Router();
var gitmonitor = require('../services/gitmonitor');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Git repository check service' });
});

router.get('/status', function(req, res, next) {
	gitmonitor.checkStatus(function(ret) {
		res.json(ret);
	});
});
module.exports = router;
