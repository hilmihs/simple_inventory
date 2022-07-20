var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {
  /* GET home page. */
  router.get('/', function (req, res, next) {
    db.query('select * from simple_inventory', (err, rows) => {
      if (err) console.log(err)
      console.log(rows.rows[0])
      res.render('sidebars', { rows: rows.rows, moment });
    })
    
  });
  router.get('/', function (req, res, next) {
    db.query('select * from simple_inventory', (err, rows) => {
      if (err) console.log(err)
      console.log(rows.rows[0])
      res.render('sidebars', { rows: rows.rows, moment });
    })
    
  })

  return router;
}