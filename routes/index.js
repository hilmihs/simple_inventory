var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {
  /* GET home page. */
  router.get('/', function (req, res) {
    db.query('select * from simple_inventory', (err, rows) => {
      if (err) console.log(err)
      res.render('index', { rows: rows.rows, moment, url: req.url, currentDir: 'home', current: '' });
    })

  });

  return router;
}