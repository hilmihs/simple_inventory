var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {
  /* GET home page. */
  router.get('/', function (req, res) {
    db.query(`SELECT * FROM varian`, (err, rows) => {
      if (err) console.log(err)
      const varian = rows.rows
      db.query(`SELECT beli.*, bdetail.*, sup.nama_supplier, gud.nama_gudang, bar.nama_barang FROM pembelian beli 
      LEFT JOIN pembelian_detail bdetail ON beli.id_transaksi_beli = bdetail.id_detail
      LEFT JOIN supplier sup ON sup.id_supplier = beli.id_supplier
      LEFT JOIN gudang gud ON gud.id_gudang = beli.id_gudang
      LEFT JOIN barang bar ON bar.id_barang = bdetail.id_varian`, (err, rows) => {
        if (err) console.log(err)

        res.render('index', { rows: rows.rows, varian, 
           moment, url: req.url,
           currentDir: 'home', current: '' });
      })
    })
  });

  router.get('/showbeli', function (req, res) {
    db.query(`SELECT beli.*, bdetail.*, sup.nama_supplier, gud.nama_gudang, bar.nama_barang FROM pembelian beli 
    LEFT JOIN pembelian_detail bdetail ON beli.id_transaksi_beli = bdetail.id_detail
    LEFT JOIN supplier sup ON sup.id_supplier = beli.id_supplier
    LEFT JOIN gudang gud ON gud.id_gudang = beli.id_gudang
    LEFT JOIN barang bar ON bar.id_barang = bdetail.id_varian`, (err, rows) => {
      if (err) console.log(err)
      res.json(rows.rows);
    })
  });
  router.get('/showjual', function (req, res) {
    db.query(`SELECT jual.*, bdetail.*, sup.nama_supplier, gud.nama_gudang, bar.nama_barang FROM penjualan jual 
    LEFT JOIN pembelian_detail bdetail ON jual.id_transaksi_beli = bdetail.id_detail
    LEFT JOIN supplier sup ON sup.id_supplier = jual.id_supplier
    LEFT JOIN gudang gud ON gud.id_gudang = jual.id_gudang
    LEFT JOIN barang bar ON bar.id_barang = bdetail.id_varian`, (err, rows) => {
      if (err) console.log(err)
      res.json(rows.rows);
    })
  });
  router.get('/showvarian', function (req, res) {
    db.query(`SELECT * FROM varian`, (err, rows) => {
      if (err) console.log(err)
      res.json(rows.rows);
    })
  });
  return router;
}