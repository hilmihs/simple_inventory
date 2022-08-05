var express = require('express');
var router = express.Router();
var moment = require('moment');
var path = require('path');
var moment = require('moment');
const e = require('express');
const { currencyFormatter } = require('../helpers/util')

module.exports = function (db) {

  router.get('/', function (req, res) {
    const page = req.query.page || 1
    const limit = 3
    const offset = (page - 1) * limit

    const { cari_id, cari_nama, cari_tanggal_awal, cari_tanggal_akhir } = req.query
    let search = []
    let count = 1
    let syntax = []
    let sql_count = `SELECT count(jual.no_invoice_jual) AS total 
    FROM penjualan jual`
    let sql = `SELECT * FROM penjualan jual`
    if (cari_id) {
      sql += ' WHERE '
      sql_count += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`no_invoice_jual ILIKE $${count}`)
      count++
    }
    if (cari_tanggal_awal && cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}`)
      search.push(`${cari_tanggal_akhir}`)
      syntax.push(` tanggal_penjualan >= $${count} AND tanggal_penjualan < $${count + 1}`)
      count++
      count++
    } else if (cari_tanggal_awal) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}`)
      syntax.push(` tanggal_penjualan >= $${count}`)
      count++
    } else if (cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
      }
      search.push(`${cari_tanggal_akhir}`)
      syntax.push(` tanggal_penjualan <= $${count}`)
      count++
    }
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY jual.no_invoice_jual ASC`
      sql_count += syntax.join(' AND ')
      sql_count += `  GROUP BY jual.no_invoice_jual`
      sql_count += ` ORDER BY jual.no_invoice_jual ASC`
    }
    console.log(sql_count)
    db.query(sql_count, search, (err, data) => {
      if (err) console.log('test count', err)
      const pages = Math.ceil(data.rows[0].total / limit)
      db.query(sql, search, (err, rows) => {
        console.log(sql)
        if (err) console.log('test sql', err)
        res.render('barang_keluar', { rows: rows.rows, currentDir: 'barang_keluar', current: '', pages, page, moment, currencyFormatter });
      })
    })
  })


  router.get('/info/:id', (req, res) => {
    db.query(`SELECT jual.no_invoice_jual,
    jual.tanggal_penjualan,
    jual.total_harga_jual,
    jual.id_transaksi_jual,
    gud.id_gudang,
    gud.nama_gudang,
    sup.id_supplier,
    sup.nama_supplier,
    pdetail.id_detail,
    pdetail.qty,
    pdetail.id_varian,
    var.nama_varian,
    var.stok_varian
    FROM penjualan jual
    INNER JOIN gudang gud ON gud.id_gudang = jual.id_gudang
    INNER JOIN supplier sup ON sup.id_supplier = jual.id_supplier
    INNER JOIN penjualan_detail pdetail ON pdetail.id_detail = jual.id_transaksi_jual 
    INNER JOIN varian var ON pdetail.id_varian = var.id_barang WHERE jual.no_invoice_jual = $1;`, [req.params.id], (err, rows) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ message: "error ambil data", error: `${err}` })
      }
      if (rows.rows.length == 0) {
        return res.status(500).json({ message: "data not found" })
      }
      const data = rows.rows[0]

      data['currentDir'] = 'barang_keluar'
      data['current'] = ''
      res.status(200).json(data)
    })
  })

  router.get('/add', function (req, res) {
    db.query('SELECT * FROM satuan', (err, rowsS) => {
      if (err) console.log(err)
      db.query('SELECT * FROM gudang', (err, rowsG) => {
        if (err) console.log(err)
        db.query(`SELECT * FROM varian`, (err, rowsV) => {
          if (err) console.log(err)
          db.query('SELECT * FROM supplier', (err, rowsSup) => {
            if (err) console.log(err)
            const satuan = rowsS.rows
            const gudang = rowsG.rows
            const varian = rowsV.rows
            const supplier = rowsSup.rows
            res.render('barang_keluar_add', { currentDir: 'barang_keluar', current: '', satuan, gudang, varian, supplier, moment });
          })
        })
      })
    })
  })
  router.post('/add', function (req, res) {
    let date;
    const { generate, custom_date, custom_input, tanggal, supplier, barang, kurang_stok } = req.body
  //   db.query(`SELECT var.id_varian,
  //     var.nama_varian,
  //       bar.id_barang,
  //     bar.nama_barang,
  //       var.stok_varian,
  //       var.harga_varian,
  //       var.harga_jual,
  //       sat.id_satuan,
  //       sat.nama_satuan,
  //       gud.id_gudang,
  //       gud.nama_gudang,
  //       var.gambar_varian
  // FROM varian var
  // INNER JOIN barang bar ON bar.id_barang = var.id_barang
  // INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
  // INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang WHERE bar.id_barang = $1;`, [barang], (err, rows) => {
  //     if (err) console.log(err)
  //     const { stok_varian, harga_varian, id_gudang, harga_jual } = rows.rows[0]
  //     let total = stok_varian - parseInt(kurang_stok) 
  //     let total_harga = parseInt(kurang_stok) * harga_varian
      if (tanggal == 'off') {
        date = custom_date;
      } else {
        date = new Date(Date.now())
      }
      if (generate == 'on') {
        db.query('SELECT * FROM testing_invoice()', (err, rows) => {
          if (err) console.log(err)
          let invoice = rows.rows[0].testing_invoice
          // db.query(`INSERT INTO penjualan_detail(id_varian, qty, no_invoice) 
          //   VALUES ($1, $2, $3)`, [barang, kurang_stok, invoice], (err) => {
          //   if (err) {
          //     return console.error(err.message);
          //   }
            db.query(`INSERT INTO penjualan(no_invoice_jual, tanggal_penjualan) 
             VALUES ($1, $2)`, [invoice, date], (err) => {
              if (err) {
                return console.error(err.message);
              }
            // })
            res.redirect(`/barang_keluar/show/${invoice}`)
          })
        })

      }
      if (generate == 'off') {
        let invoice = custom_input
        db.query(`INSERT INTO penjualan(no_invoice_jual, tanggal_penjualan) 
          VALUES ($1, $2)`, [invoice, date], (err) => {
          if (err) {
            return console.error(err.message);
          }
          // db.query(`INSERT INTO penjualan_detail(id_varian, qty) 
          //  VALUES ($1, $2)`, [barang, kurang_stok], (err) => {
          //   if (err) {
          //     return console.error(err.message);
          //   }
          res.redirect(`/barang_keluar/show/${invoice}`)
          })
        // })
      }
    // })
  })

  router.get('/show/:no_invoice', (req, res) => {
    const no_invoice_jual = req.params.no_invoice
    db.query(`SELECT * FROM penjualan WHERE no_invoice_jual = $1`, [no_invoice_jual], (err, rows) => {
      const penjualan = rows.rows[0];
      db.query('SELECT * FROM satuan', (err, rowsS) => {
        if (err) console.log(err)
        db.query('SELECT * FROM gudang', (err, rowsG) => {
          if (err) console.log(err)
          db.query(`SELECT * FROM varian`, (err, rowsV) => {
            if (err) console.log(err)
            db.query('SELECT * FROM supplier', (err, rowsSup) => {
              if (err) console.log(err)
              const satuan = rowsS.rows
              const gudang = rowsG.rows
              const varian = rowsV.rows
              const supplier = rowsSup.rows
              res.render('barang_keluar_show', { currentDir: 'barang_keluar', current: '', penjualan, satuan, gudang, varian, supplier, moment, currencyFormatter });
            })
          })
        })
      })
    })
  })

  router.post('/additem', (req, res) => {
    const { no_invoice, kode_barang, qty } = req.body
    db.query(`INSERT INTO penjualan_detail(no_invoice, id_varian, qty) 
    VALUES ($1, $2, $3)`, [no_invoice, kode_barang, qty], (err) => {
      if (err) console.log(err)
      db.query(`SELECT * FROM penjualan WHERE no_invoice_jual = $1`, [no_invoice], (err, rows) => {
        if (err) console.log(err)
        res.json(rows.rows[0])
      })
    })
  })

  router.post('/edititem', (req, res) => {
    const { id_detail, kode_barang, qty } = req.body
    db.query(`UPDATE penjualan_detail SET id_varian = $1, qty = $2 
    WHERE id_detail = $3 RETURNING *`, [kode_barang, qty, id_detail], (err, rows) => {
      if (err) console.log(err)
      const no_invoice_jual = rows.rows[0].no_invoice
      db.query(`SELECT * FROM penjualan WHERE no_invoice_jual = $1`, [no_invoice_jual], (err, rows) => {
        if (err) console.log(err)
        res.json(rows.rows[0])
      })
    })
  })

  router.get('/details/:no_invoice', (req, res) => {
db.query(`SELECT dp.*, b.nama_barang, p.* FROM penjualan_detail as dp 
LEFT JOIN barang as b ON dp.id_varian = b.id_barang
LEFT JOIN penjualan as p ON dp.no_invoice= p.no_invoice_jual WHERE dp.no_invoice = $1
ORDER BY dp.id_detail;`, [req.params.no_invoice], (err, rows) => {
          if (err) console.log(err)
          res.json(rows.rows)
        })
        
})
router.get('/edit_detail/:id_detail', (req, res) => {
  db.query(`SELECT dp.*, b.*, v.*, p.*, g.*, s.* FROM penjualan_detail as dp 
  LEFT JOIN barang as b ON dp.id_varian = b.id_barang
  LEFT JOIN varian as v ON b.id_barang = v.id_barang
  LEFT JOIN penjualan as p ON dp.no_invoice = p.no_invoice_jual
  LEFT JOIN satuan as s ON v.id_satuan = s.id_satuan
  LEFT JOIN gudang as g ON g.id_gudang = p.id_gudang WHERE dp.id_detail = $1
  ORDER BY dp.id_detail;`, [req.params.id_detail], (err, rows) => {
            if (err) console.log(err)
            res.json(rows.rows[0])
          })
          
  })

  router.get('/edit/:id', (req, res) => {
    db.query('SELECT * FROM satuan', (err, rowsS) => {
      if (err) console.log(err)
      db.query('SELECT * FROM gudang', (err, rowsG) => {
        if (err) console.log(err)
        db.query(`SELECT * FROM varian`, (err, rowsV) => {
          if (err) console.log(err)
          db.query('SELECT * FROM supplier', (err, rowsSup) => {
            if (err) console.log(err)
            const satuan = rowsS.rows
            const gudang = rowsG.rows
            const varian = rowsV.rows
            const supplier = rowsSup.rows
            db.query(`SELECT jual.*,
            gud.*,
            sup.*,
            pdetail.*,
            var.*,
            sat.*
            FROM penjualan jual
            INNER JOIN gudang gud ON gud.id_gudang = jual.id_gudang
            INNER JOIN supplier sup ON sup.id_supplier = jual.id_supplier
            INNER JOIN penjualan_detail pdetail ON pdetail.no_invoice = jual.no_invoice_jual 
            INNER JOIN varian var ON pdetail.id_varian = var.id_barang 
            INNER JOIN satuan sat ON var.id_satuan = sat.id_satuan 
            WHERE jual.no_invoice_jual = $1`, [req.params.id], (err, rows_beli) => {
              if (err) {
                return console.error(err.message);
              }
              console.log(rows_beli.rows[0])
              res.render('barang_keluar_edit', { rows: rows_beli.rows[0], currentDir: 'barang_keluar', current: '', satuan, gudang, varian, supplier, moment });
            })
          })
        })
      })
    })
  })
  router.post('/edit/:id', function (req, res) {
    const { custom_input, custom_date, default_input, default_date, id, supplier, barang, kurang_stok, change } = req.body

    let invoice;
    let date;
    let sql_detail = ``
    let params = []

    if (custom_date != default_date) {
      date += custom_date;
    } else {

      db.query('SELECT CURRENT_DATE', (err, rows) => {
        if (err) {
          return console.error(err.message);
        }
        date = rows.rows[0].current_date
      })
    }
        db.query(`SELECT var.id_varian,
    var.nama_varian,
      bar.id_barang,
    bar.nama_barang,
      var.stok_varian,
      var.harga_varian,
      pdetail.qty,
      pdetail.id_varian,
      sat.id_satuan,
      sat.nama_satuan,
      gud.id_gudang,
      gud.nama_gudang,
      var.gambar_varian
FROM varian var
INNER JOIN barang bar ON bar.id_barang = var.id_barang
INNER JOIN satuan sat ON sat.id_satuan = var.id_satuan
INNER JOIN penjualan_detail pdetail ON pdetail.id_varian = var.id_barang
INNER JOIN gudang gud ON gud.id_gudang = var.id_gudang WHERE bar.id_barang = $1;`, [barang], (err, rows) => {
          if (err) {
            return console.error(err.message, `ini select`);
          }
          const { stok_varian, harga_varian, id_gudang, qty } = rows.rows[0]
          let total = parseInt(stok_varian) + parseInt(qty) - parseInt(kurang_stok)
          let total_harga = parseInt(kurang_stok) * parseInt(harga_varian)
          if (change == 'on') {
            sql_detail += `UPDATE penjualan_detail 
            set id_varian = $1 WHERE id_detail = $2`
            params.push(barang)
            params.push(id)

          }
          if (change == 'off') {
            sql_detail += `UPDATE penjualan_detail 
            set id_varian = $1, qty = $2 WHERE id_detail = $3`
            params.push(barang, kurang_stok, id)
          }

          if (custom_input != default_input) {
            invoice = custom_input
          }
          if (custom_input == default_input) {
            invoice = default_input
          }
          db.query(sql_detail, params, (err) => {
            if (err) {
              return console.error(err.message, `ini penjualan detail`);
            }
            db.query(`UPDATE penjualan set 
    no_invoice_jual = $1,
    tanggal_penjualan = $2,
    total_harga_jual = $3,
    id_gudang = $4,
    id_supplier = $5 WHERE id_transaksi_jual = $6`, [invoice, date, total_harga, id_gudang, supplier, id], (err) => {
              if (err) {
                return console.error(err.message, `ini penjualan`);
              }      
              res.redirect('/barang_keluar')
            })
          })
        })
      
  })
  router.get('/delete/:id', (req, res) => {
        db.query('DELETE FROM penjualan WHERE no_invoice_jual = $1', [req.params.id], (err) => {
          if (err) {
            return console.error(err.message);
          }
            res.redirect('/barang_keluar')
          })
        })
  return router;
}