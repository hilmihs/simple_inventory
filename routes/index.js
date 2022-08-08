var express = require('express');
var router = express.Router();
var moment = require('moment')
var { currencyFormatter } = require('../helpers/util')
module.exports = function (db) {

  router.get('/', function (req, res) {

 // Pagination preparation
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


    const { cari_id, cari_tanggal_awal, cari_tanggal_akhir } = req.query
    let show = req.query.show || 'beli'
    let search = []
    let count = 1
    let syntax = []
   
    let sql_count = `SELECT count(beli.no_invoice_beli) AS total 
    FROM pembelian beli`
    let sql = `SELECT * FROM pembelian beli`
    let sql_total = `SELECT sum(beli.total_harga_beli) AS total_beli 
    FROM pembelian beli`
    let sql_profit = ``
    let profit = 0
    let total = 0
    if (show == 'jual') {
      sql = `SELECT * FROM penjualan jual`
      sql_count = `SELECT count(jual.no_invoice_jual) AS total 
      FROM penjualan jual` 
      sql_total = `SELECT sum(total_harga_jual) AS total_jual 
    FROM penjualan`
      sql_profit = `SELECT sum(jd.qty * (var.harga_jual - var.harga_varian)) AS profit, sum(jd.total_harga) AS total_jual FROM penjualan_detail jd
      LEFT JOIN varian var ON var.id_barang = jd.id_varian  
      LEFT JOIN penjualan jual ON jd.no_invoice = jual.no_invoice_jual`
    }
    if (cari_id) {
      sql += ' WHERE '
      sql_count += ' WHERE '
      sql_total += ' WHERE '
      sql_profit += ' WHERE '
      search.push(`%${cari_id}%`)
      syntax.push(`no_invoice_${show} ILIKE $${count}`)
      count++
    }
    if (cari_tanggal_awal && cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
        sql_total += ' WHERE'
      sql_profit += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}`)
      search.push(`${cari_tanggal_akhir}`)
      syntax.push(` tanggal_${show == 'beli' ? 'pembelian' : 'penjualan'} >= $${count} AND tanggal_${show == 'beli' ? 'pembelian' : 'penjualan'} < $${count + 1}`)
      count++
      count++
    } else if (cari_tanggal_awal) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
        sql_total += ' WHERE'
      sql_profit += ' WHERE'
      }
      search.push(`${cari_tanggal_awal}`)
      syntax.push(` ${show}.tanggal_${show == 'beli' ? 'pembelian' : 'penjualan'} >= $${count}`)
      count++
    } else if (cari_tanggal_akhir) {
      if (!sql.includes(' WHERE ')) {
        sql += ' WHERE'
        sql_count += ' WHERE'
        sql_total += ' WHERE'
      sql_profit += ' WHERE'
      }
      search.push(`${cari_tanggal_akhir}`)
      syntax.push(` ${show}.tanggal_${show == 'beli' ? 'pembelian' : 'penjualan'} <= $${count}`)
      count++
    }
    if (syntax.length > 0) {
      sql += syntax.join(' AND ')
      sql += ` ORDER BY ${show}.no_invoice_${show} ASC`
      sql += ` LIMIT 5 OFFSET ${offset}`
      sql_count += syntax.join(' AND ')
      sql_count += `  GROUP BY ${show}.no_invoice_${show}`
      sql_count += ` ORDER BY ${show}.no_invoice_${show} ASC`
      sql_total += syntax.join(' AND ')
      sql_total += `  GROUP BY ${show}.no_invoice_${show}`
      sql_total += ` ORDER BY ${show}.no_invoice_${show} ASC`
      sql_profit += syntax.join(' AND ')
      sql_profit += `  GROUP BY ${show}.no_invoice_${show}`
      sql_profit += ` ORDER BY ${show}.no_invoice_${show} ASC`
    }
    const input = show == 'jual' ? sql_profit : sql_total
        db.query(`SELECT * FROM varian`, (err, rows) => {
          if (err) console.log(err)
          const varian = rows.rows  
          console.log(input)
          db.query(input, search, (err, rows) => {
            if (err) console.log(`input err ${err}`)
            const detail_result = rows.rows
            if (detail_result[0].total_jual) {
              detail_result.forEach(item => {
                profit += JSON.parse(item.profit)
                total += JSON.parse(item.total_jual)
                
              })
            }
            if (detail_result[0].total_beli) {
              detail_result.forEach(item => {
                total += JSON.parse(item.total_beli)
              })
            }
            db.query(sql_count, search, (err, data) => {
              if (err) console.log('test count', err)
              totalPage = Math.ceil(data.rows[0].total / limit)
              db.query(sql, search, (err, rows) => {
                if (err) console.log('test sql', err)
            res.render('index', {
              rows: rows.rows, varian, page: totalPage, currentPage: pageInput, currentUrl: currentLink,
              moment, link: req.url, detail_result, profit, total,
              currentDir: 'home', current: '', currencyFormatter, show, query: req.query,
            });
        })
      })
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