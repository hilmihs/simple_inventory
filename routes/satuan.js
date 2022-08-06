var express = require('express');
var router = express.Router();
var moment = require('moment')
module.exports = function (db) {

  router.get('/', function (req, res) { 
    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit
    const { cari_id, cari_nama } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql_count = 'SELECT count(*) AS total FROM satuan'
    let sql = 'select * from satuan'
    if (cari_id) {
      sql += ' WHERE '
      sql_count += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`id_satuan ILIKE $${count}`)
      count++
    } 
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE '
        sql_count += ' WHERE '
      }
      search.push(`%${cari_nama}%`)
      syntax.push(` nama_satuan ILIKE $${count}`)
      count++
    }
    
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_satuan ASC`
      sql_count += syntax.join(' AND ')
      sql_count += ` GROUP BY id_satuan`
      sql_count += ` ORDER BY id_satuan ASC`
    }
    console.log(sql, sql_count, search)
    db.query(sql_count, search, (err, data) => {
      if (err) console.log (err)
      const pages = Math.ceil(data.rows[0].total / limit)
    db.query(sql, search, (err, rows) => {
      if (err) console.log(err)
      res.render('satuan', { rows: rows.rows, currentDir: 'settingdata', current: 'satuan' });
    })
  })
})

  router.get('/info/:id', (req, res) => {
  
    db.query('SELECT * FROM satuan WHERE id_satuan = $1', [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found"})
      }
      const data = rows.rows[0]
      data['currentDir'] = 'settingdata'
      data['current'] = 'satuan'
      res.status(200).json(data)
    })
  })

  router.get('/add', function (req, res) {
    res.render('satuan_add', { currentDir: 'settingdata', current: 'satuan' });
  })

  router.post('/add', function (req, res) {
    db.query(`INSERT INTO satuan(id_satuan, nama_satuan, keterangan) 
    VALUES ($1, $2, $3)`, [req.body.id, req.body.nama, req.body.keterangan], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/satuan')
    })
  })

  router.get('/edit/:id', (req, res) => {
   
    db.query('SELECT * FROM satuan WHERE id_satuan = $1', [req.params.id], (err, rows) => {
   
      if (err) {
        return console.error(err.message);
      }
      res.render('satuan_edit', { rows: rows.rows, currentDir: 'settingdata', current: 'satuan' });
    })
  })

  router.post('/edit/:id', function (req, res) {
    db.query(`UPDATE satuan set 
    nama_satuan = $1,
    keterangan = $2
    WHERE id_satuan = $3`, [req.body.nama, req.body.keterangan, req.body.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/satuan')
    })
  })

  router.get('/delete/:id', (req, res) => {
  
    db.query('DELETE FROM satuan WHERE id_satuan = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/satuan')
    })
  })


  return router;
}