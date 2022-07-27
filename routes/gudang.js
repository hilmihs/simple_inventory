var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {

  router.get('/', function (req, res) { 
    const { cari_id, cari_nama } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql = 'select * from gudang'
    if (cari_id) {
      sql += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`id_gudang ILIKE $${count}`)
      count++
    } 
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`%${cari_nama}%`)
      syntax.push(` nama_gudang ILIKE $${count}`)
      count++
    }
    
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_gudang ASC`
    }
    db.query(sql, search, (err, rows) => {
      if (err) console.log(err)
      res.render('gudang', { rows: rows.rows, currentDir: 'settingdata', current: 'gudang' });
    })
  })

  router.get('/info/:id', (req, res) => {
  
    db.query('SELECT * FROM gudang WHERE id_gudang = $1', [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found"})
      }
      const data = rows.rows[0]
      data['currentDir'] = 'settingdata'
      data['current'] = 'gudang'
      res.status(200).json(data)
    })
  })

  router.get('/add', function (req, res) {
    res.render('gudang_add', { currentDir: 'settingdata', current: 'gudang' });
  })

  router.post('/add', function (req, res) {
    db.query(`INSERT INTO gudang(id_gudang, nama_gudang, alamat) 
    VALUES ($1, $2, $3)`, [req.body.id, req.body.nama, req.body.alamat], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/gudang')
    })
  })

  router.get('/edit/:id', (req, res) => {
   
    db.query('SELECT * FROM gudang WHERE id_gudang = $1', [req.params.id], (err, rows) => {
   
      if (err) {
        return console.error(err.message);
      }
      res.render('gudang_edit', { rows: rows.rows, currentDir: 'settingdata', current: 'gudang' });
    })
  })

  router.post('/edit/:id', function (req, res) {
    db.query(`UPDATE gudang set 
    nama_gudang = $1,
    alamat = $2
    WHERE id_gudang = $3`, [req.body.nama, req.body.alamat, req.body.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })

  router.get('/delete/:id', (req, res) => {
  
    db.query('DELETE FROM gudang WHERE id_gudang = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })


  return router;
}