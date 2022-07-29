var express = require('express');
var router = express.Router();
var moment = require('moment');
var path = require('path');
var moment = require('moment')

module.exports = function (db) {

  router.get('/', function (req, res) {
    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit


    const { cari_id, cari_nama, cari_tanggal_awal, cari_tanggal_akhir } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql_count = `SELECT count(beli.no_invoice_beli) AS total 
    FROM pembelian beli GROUP BY beli.no_invoice_beli`
    let sql = `SELECT beli.no_invoice_beli,
    beli.tanggal_pembelian,
    beli.total_harga_beli,
    gud.id_gudang,
    gud.nama_gudang,
    sup.id_supplier,
    sup.nama_supplier,
    bdetail.id_detail,
    bdetail.qty,
    bdetail.id_varian,
    var.nama_varian
    FROM pembelian beli
    INNER JOIN gudang gud ON gud.id_gudang = beli.id_gudang
    INNER JOIN supplier sup ON sup.id_supplier = beli.id_supplier
    INNER JOIN pembelian_detail bdetail ON bdetail.id_detail = beli.id_transaksi_beli
    INNER JOIN varian var ON bdetail.id_varian = var.id_varian`
    if (cari_id) {
      sql += ' WHERE '

      search.push(`%${cari_id}%`)
      syntax.push(`id_transaksi_beli ILIKE $${count}`)
      count++
    }
    if (cari_nama) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`%${cari_nama}%`)
      syntax.push(`nama_varian ILIKE $${count}`)
      count++
    }
    if (cari_tanggal_awal && cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}::date`)
      search.push(`${cari_tanggal_akhir}::date`)
      syntax.push(` tanggal_pembelian >= $${count} AND tanggal_pembelian < ${count + 1}`)
      count++
      count++
    } else if (cari_tanggal_awal) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}::date`)
      syntax.push(` tanggal_pembelian >= $${count}`)
      count++
    } else if (cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
      }
      search.push(`${cari_tanggal_akhir}::date`)
    }
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY id_varian ASC`
    }
   
    db.query(sql_count, search, (err, data) => {
      if (err) console.log(err)
      const pages = Math.ceil(data.rows[0].total / limit)
      db.query(sql, search, (err, rows) => {
        if (err) console.log(err)
        console.log(rows.rows)
        res.render('barang_masuk', { rows: rows.rows, currentDir: 'barang_masuk', current: '', pages, page, moment });
      })
    })
  })

  router.get('/info/:id', (req, res) => {
    db.query(`SELECT beli.no_invoice_beli,
    beli.tanggal_pembelian,
    beli.total_harga_beli,
    gud.id_gudang,
    gud.nama_gudang,
    sup.id_supplier,
    sup.nama_supplier,
    bdetail.id_detail,
    bdetail.qty,
    bdetail.id_varian,
    var.nama_varian
    FROM pembelian beli
    INNER JOIN gudang gud ON gud.id_gudang = beli.id_gudang
    INNER JOIN supplier sup ON sup.id_supplier = beli.id_supplier
    INNER JOIN pembelian_detail bdetail ON bdetail.id_detail = beli.id_transaksi_beli 
    INNER JOIN varian var ON bdetail.id_varian = var.id_varian WHERE no_invoice_beli = $1;`, [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found" })
      }
      const data = rows.rows[0]
      console.log(data)
      data['currentDir'] = 'barang_masuk'
      data['current'] = ''
      res.status(200).json(data)
    })
  })

  router.get('/add', function (req, res) {
    db.query('SELECT * FROM barang', (err, rowsB) => {
      db.query('SELECT * FROM satuan', (err, rowsS) => {
        db.query('SELECT * FROM gudang', (err, rowsG) => {
          db.query('SELECT * FROM barcode_varian()', (err, rowsC) => {
            if (err) console.log(err)
            const barang = rowsB.rows
            const satuan = rowsS.rows
            const gudang = rowsG.rows
            const barcode = rowsC.rows[0].barcode_varian
            res.render('barang_masuk_add', { currentDir: 'baran_masuk', current: '', barang, satuan, gudang, barcode });
          })
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

      const { generate, custom_input, nama, barang, stok, harga, satuan, gudang } = req.body

      if (generate == 'on') {
        db.query('SELECT * FROM barcode_varian()', (err, rows) => {
          if (err) console.log(err)
          let barcode = rows.rows[0].barcode_varian
          db.query(`INSERT INTO pembelian(id_varian, nama_varian, id_barang,
                stok_varian, harga_varian, id_satuan,
                 id_gudang, gambar_varian) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [barcode, nama, barang, stok, harga, satuan, gudang, filename], (err) => {
            if (err) {
              return console.error(err.message);
            }
            res.redirect('/barang_masuk')
          })
        })
      }
      if (generate == 'off') {
        let barcode = custom_input
        db.query(`INSERT INTO pembelian(id_varian, nama_varian, id_barang,
        stok_varian, harga_varian, id_satuan,
         id_gudang, gambar_varian) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [barcode, nama, barang, stok, harga, satuan, gudang, gambar], (err) => {
          if (err) {
            return console.error(err.message);
          }
          res.redirect('/barang_masuk')
        })
      }
    });


  })

  router.get('/edit/:id', (req, res) => {

    db.query('SELECT * FROM pembelian WHERE id_varian = $1', [req.params.id], (err, rows) => {

      if (err) {
        return console.error(err.message);
      }
      res.render('barang_masuk_edit', { rows: rows.rows, currentDir: 'pembelian', current: '' });
    })
  })

  router.post('/edit/:id', function (req, res) {
    const { id_varian, nama, id_barang, stok, harga, id_satuan, id_gudang, gambar } = req.body
    db.query(`UPDATE pembelian set 
     nama_varian = $1,
      id_barang = $2,
       stok_varian = $3,
        harga_varian = $4,
         id_satuan = $5,
        id_gudang = $6,
         gambar_varian = $7
    WHERE id_varian = $8`, [nama, id_barang, stok, harga, id_satuan, id_gudang, gambar, id_varian], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/pembelian')
    })
  })

  router.get('/delete/:id', (req, res) => {

    db.query('DELETE FROM pembelian WHERE id_varian = $1', [req.params.id], (err) => {
      if (err) {
        return console.error(err.message);
      }
      res.redirect('/')
    })
  })


  return router;
}