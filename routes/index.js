var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {
  /* GET home page. */
  router.get('/', function (req, res) {
    db.query('select * from simple_inventory', (err, rows) => {
      if (err) console.log(err)
      res.render('sidebars', { rows: rows.rows, moment });
    })

  });
  router.get('/suppliers', function (req, res) {
    db.query('select * from supplier', (err, rows) => {
      if (err) console.log(err)
      res.render('supplier', { rows: rows.rows });
    })
  })

  router.post('/suppliers', function (req, res) { 
    const { id_supplier, nama_supplier } = req.body
    let search = []
    if (id_supplier) {
      
    }
    db.query('select * from supplier', (err, rows) => {
      if (err) console.log(err)
      res.render('supplier', { rows: rows.rows });
    })
  })

  router.get('/suppliers/info/:id', (req, res) => {
    console.log(req.params.id)
    db.query('SELECT * FROM supplier WHERE id_supplier = $1 ORDER BY id_supplier', [req.params.id], (err, rows) => {
      if (err) {
        res.status(500).json({ message: "error ambil data", error: `${err}` })
        console.log(err)
      }
      const data = rows.rows
      res.status(200).json(data)
    })
  })

  router.get('/add_supplier', function (req, res) {
    res.render('add_supplier');
  })

  router.post('/add_supplier', function (req, res) {
    db.query(`INSERT INTO supplier(id_supplier, nama_supplier, alamat_supplier, telepon, email) 
    VALUES ($1, $2, $3, $4, $5)`, [req.body.id, req.body.nama, req.body.alamat, req.body.telepon, req.body.email], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/suppliers')
    })
  })

  router.get('/suppliers/edit/:id', (req, res) => {
    console.log(req.params.id)
    db.query('SELECT * FROM supplier WHERE id_supplier = $1', [req.params.id], (err, rows) => {
      console.log(rows.rows, req.params.id)
      if (err) {
        return console.error(err.message);
      }
      res.render('edit_supplier', { rows: rows.rows });
    })
  })

  router.post('/suppliers/edit/:id', function (req, res) {
    db.query(`UPDATE supplier set 
    nama_supplier = $1, alamat_supplier = $2, telepon = $3, email = $4 
    WHERE id_supplier = $5`, [req.body.nama, req.body.alamat, req.body.telepon, req.body.email, req.body.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/suppliers')
    })
  })

  router.get('/suppliers/delete/:id', (req, res) => {
    console.log(req.params.id)
    db.query('DELETE FROM supplier WHERE id_supplier = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/suppliers')
    })
  })


  return router;
}