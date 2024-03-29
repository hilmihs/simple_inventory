var express = require('express');
var router = express.Router();
var moment = require('moment');
var path = require('path');
const { isLoggedIn } = require('../helpers/util')

module.exports = function (db) {

  router.get('/', isLoggedIn, function (req, res) {
    let limit = 5
    let currentOffset;
    let totalPage;
    let currentLink;
    let pageInput = parseInt(req.query.page)
  
  
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
    let sql_count = `SELECT count(var.id_varian) AS total FROM varian var
        INNER JOIN barang bar ON bar.id_barang = var.id_barang`
    let sql = `SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      var.harga_jual,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang`
    if (cari_id) {
      sql += ' WHERE '
      sql_count += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`id_varian ILIKE $${count}`)
      count++
    }
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE '
      }
      search.push(`%${cari_nama}%`)
      syntax.push(` nama_varian ILIKE $${count}`)
      count++
    }

    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_varian ASC`
     
      sql_count += syntax.join(' AND ')
      sql_count += `GROUP BY var.id_varian ORDER BY id_varian ASC`
    }
    sql += ` LIMIT 5 OFFSET ${offset}`
    console.log(sql_count, search)
    db.query(sql_count, search, (err, data) => {
      if (err) console.log(err)

    totalPage = Math.ceil(data.rows[0].total / limit)
      db.query(sql, search, (err, rows) => {

        if (err) console.log(err)
        res.render('varian', { rows: rows.rows, currentDir: 'varian',
         current: '', page: totalPage, currentPage: pageInput, currentUrl: currentLink,
         link: req.url, query: req.query });
      })
    })
  })

  router.get('/api', isLoggedIn, (req, res) => {

    db.query(`SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      var.harga_jual,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang`, (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found" })
      }
      const data = rows.rows
      data['currentDir'] = 'varian'
      data['current'] = ''
      res.status(200).json(data)
    })
  })

  router.get('/api/:id', isLoggedIn, (req, res) => {

    db.query(`SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      var.harga_jual,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang WHERE var.id_barang = $1`, [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found" })
      }
      const data = rows.rows
      data['currentDir'] = 'varian'
      data['current'] = ''
      res.status(200).json(data)
    })
  })

  router.get('/info/:id', isLoggedIn, (req, res) => {

    db.query(`SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      var.harga_jual,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang WHERE id_varian = $1;`, [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found" })
      }
      const data = rows.rows[0]
      data['currentDir'] = 'varian'
      data['current'] = ''
      res.status(200).json(data)
    })
  })

  router.get('/add', isLoggedIn, function (req, res) {
    db.query('SELECT * FROM barang', (err, rowsB) => {
      if (err) console.log(err)
      db.query('SELECT * FROM satuan', (err, rowsS) => {
        if (err) console.log(err)
        db.query('SELECT * FROM gudang', (err, rowsG) => {
          if (err) console.log(err)
          const barang = rowsB.rows
          const satuan = rowsS.rows
          const gudang = rowsG.rows
          res.render('varian_add', { currentDir: 'varian', current: '', barang, satuan, gudang, moment});
        })
      })
    })
  })

  router.post('/add', function (req, res) {
    let gambar;
    let uploadPath;
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }
    // The name of the input field (i.e. "gambar") is used to retrieve the uploaded file
    gambar = req.files.gambar;
    const filename = `A${Date.now()}-${gambar.name}`
    uploadPath = path.join(__dirname, '/../public', 'gambar', filename);
    // Use the mv() method to place the file somewhere on your server
    gambar.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);
      const { generate, custom_input, nama, barang, stok, harga, satuan, gudang, harga_jual } = req.body
      if (generate == 'on') {
        db.query('SELECT * FROM barcode_varian()', (err, rows) => {
          if (err) console.log(err)
          let barcode = rows.rows[0].barcode_varian
          db.query(`INSERT INTO varian(id_varian, nama_varian, id_barang,
                stok_varian, harga_varian, id_satuan,
                 id_gudang, gambar_varian, harga_jual) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [barcode, nama, barang, stok, harga, satuan, gudang, filename, harga_jual], (err) => {
            if (err) {
              return console.error(err.message);
            }
            res.redirect('/varian')
          })
        })
      }
      if (generate == 'off') {
        let barcode = custom_input
        db.query(`INSERT INTO varian(id_varian, nama_varian, id_barang,
        stok_varian, harga_varian, id_satuan,
         id_gudang, gambar_varian, harga_jual) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [barcode, nama, barang, stok, harga, satuan, gudang, filename, harga_jual], (err) => {
          if (err) {
            return console.error(err.message);
          }
          res.redirect('/varian')
        })
      }
    });


  })

  router.get('/edit/:id', isLoggedIn, (req, res) => {
    db.query('SELECT * FROM barang', (err, rowsB) => {
      if (err) console.log(err)
      db.query('SELECT * FROM satuan', (err, rowsS) => {
        if (err) console.log(err)
        db.query('SELECT * FROM gudang', (err, rowsG) => {
          if (err) console.log(err)
          const barang = rowsB.rows
          const satuan = rowsS.rows
          const gudang = rowsG.rows
          db.query(`SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      var.harga_jual,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang WHERE id_varian = $1;`, [req.params.id], (err, rows) => {
            if (err) {
              return console.error(err.message);
            }
            res.render('varian_edit', { rows: rows.rows, currentDir: 'varian', current: '', barang, satuan, gudang });
          })
        })
      })
    })
  })

  router.post('/edit/:id', function (req, res) {
    const { custom_input, nama, barang, stok, harga, satuan, gudang, saved_gambar, harga_jual } = req.body
    let gambar;
    let uploadPath;
    if (!req.files || Object.keys(req.files).length === 0) {
      db.query(`UPDATE varian set 
     nama_varian = $1,
      id_barang = $2,
       stok_varian = $3,
        harga_varian = $4,
         id_satuan = $5,
        id_gudang = $6,
         gambar_varian = $7,
         harga_jual = $8
    WHERE id_varian = $9`, [nama, barang, stok, harga, satuan, gudang, saved_gambar, harga_jual, custom_input], (err) => {
        if (err) {
          return console.error(err.message);
        }
        res.redirect('/varian')
      })
    } else {
      // The name of the input field (i.e. "gambar") is used to retrieve the uploaded file
      gambar = req.files.gambar;
      const filename = `A${Date.now()}-${gambar.name}`
      uploadPath = path.join(__dirname, '/../public', 'gambar', filename);
      // Use the mv() method to place the file somewhere on your server
      gambar.mv(uploadPath, function (err) {
        if (err)
          return res.status(500).send(err);
        //  const {custom_input, nama, barang, stok, harga, satuan, gudang } = req.body

        db.query(`UPDATE varian set 
     nama_varian = $1,
      id_barang = $2,
       stok_varian = $3,
        harga_varian = $4,
         id_satuan = $5,
        id_gudang = $6,
         gambar_varian = $7,
         harga_jual = $8
    WHERE id_varian = $9`, [nama, id_barang, stok, harga, id_satuan, id_gudang, filename, harga_jual, custom_input], (err) => {
          if (err) {
            return console.error(err.message);
          }
          res.redirect('/varian')
        })
      })
    }
  })
  router.get('/delete/:id', isLoggedIn, (req, res) => {

    db.query('DELETE FROM varian WHERE id_varian = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })


  return router;
}