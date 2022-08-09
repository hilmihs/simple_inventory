var express = require('express');
var router = express.Router();
var moment = require('moment')
const { isLoggedIn } = require('../helpers/util')
const { currencyFormatter } = require('../helpers/util')

module.exports = function (db) {

  router.get('/', isLoggedIn, function (req, res) {
// Pagination preparation
let limit = 5
let currentOffset;
let totalPage;
let currentLink;
let pageInput = parseInt(req.query.page)
let totalData = 0

if (!req.query.page) {
  currentOffset = 1;
  pageInput = 1;
} else {
  currentOffset = parseInt(req.query.page);
}
const offset = (limit * currentOffset) - limit;


if (req.url === '/') {
  currentLink = '/?page=1'
} else {
  if (req.url.includes('/?page')) {
    currentLink = req.url
  } else {
    if (req.url.includes('&page=')) {
      currentLink = req.url
    } else {
      if (req.url.includes('&page=')) {
      } else {
        currentLink = req.url + `&page=${pageInput}`
      }
    }
  }
}

    const { cari_id, cari_nama } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql_count = 'SELECT count(*) AS total FROM barang'
    let sql = 'SELECT * FROM barang'
    if (cari_id) {
      sql += ' WHERE'
      sql_count += ' WHERE'
      search.push(`%${cari_id}%`)
      syntax.push(`id_barang ILIKE $${count}`)
      count++
    } 
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
      }
      search.push(`%${cari_nama}%`)
      syntax.push(` nama_barang ILIKE $${count}`)
      count++
    }
    
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_barang ASC`
      sql_count += syntax.join(' AND ')
      sql_count += ` GROUP BY id_barang`
      sql_count += ` ORDER BY id_barang ASC`
    }

    db.query(sql_count, search, (err, data) => {
      if (err) console.log (err)
      totalData = data.rows[0].total
      if (syntax.length > 0) {
        data.rows.forEach((item) => {
          totalData = parseInt(totalData) + parseInt(item.total)
          if (totalData > parseInt(data.rows.length)) {
            totalData -= 1
          }
        })
      }
      totalPage = Math.ceil(totalData / limit)
    db.query(sql, search, (err, rows) => {
      if (err) console.log(err)
      res.render('barang', { rows: rows.rows, currentDir: 'settingdata', current: 'barang', page: totalPage, currentPage: pageInput, currencyFormatter,
      currentUrl: currentLink, offset,
     link: req.url, query: req.query, currencyFormatter  });
    })
  })
  })

  router.get('/info/:id', isLoggedIn,  (req, res) => {
  
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

  router.get('/add', isLoggedIn, function (req, res) {
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

  router.get('/edit/:id', isLoggedIn, (req, res) => {
   
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
      res.redirect('/barang')
    })
  })

  router.get('/delete/:id', isLoggedIn, (req, res) => {
  
    db.query('DELETE FROM barang WHERE id_barang = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/barang')
    })
  })


  return router;
}