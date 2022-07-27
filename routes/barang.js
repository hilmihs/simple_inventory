var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {

  router.get('/', function (req, res) { 
    const { cari_id, cari_nama } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql = 'select * from barang'
    if (cari_id) {
      sql += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`id_barang ILIKE $${count}`)
      count++
    } 
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`%${cari_nama}%`)
      syntax.push(` nama_barang ILIKE $${count}`)
      count++
    }
    
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_barang ASC`
    }
    db.query(sql, search, (err, rows) => {
      if (err) console.log(err)
      res.render('barang', { rows: rows.rows, currentDir: 'settingdata', current: 'barang' });
    })
  })

  router.get('/info/:id', (req, res) => {
  
    db.query('SELECT * FROM barang WHERE id_barang = $1', [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found"})
      }
      const data = rows.rows[0]
      data['currentDir'] = 'settingdata'
      data['current'] = 'barang'
      res.status(200).json(data)
    })
  })

  router.get('/add', function (req, res) {
    res.render('barang_add', { currentDir: 'settingdata', current: 'barang' });
  })

  router.post('/add', function (req, res) {
    db.query(`INSERT INTO barang(id_barang, nama_barang) 
    VALUES ($1, $2)`, [req.body.id, req.body.nama], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/barang')
    })
  })

  router.get('/edit/:id', (req, res) => {
   
    db.query('SELECT * FROM barang WHERE id_barang = $1', [req.params.id], (err, rows) => {
   
      if (err) {
        return console.error(err.message);
      }
      res.render('barang_edit', { rows: rows.rows, currentDir: 'settingdata', current: 'barang' });
    })
  })

  router.post('/edit/:id', function (req, res) {
    db.query(`UPDATE barang set 
    nama_barang = $1
    WHERE id_barang = $2`, [req.body.nama, req.body.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })

  router.get('/delete/:id', (req, res) => {
  
    db.query('DELETE FROM barang WHERE id_barang = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })


  return router;
}