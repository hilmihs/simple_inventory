var express = require('express');
var router = express.Router();
var moment = require('moment')
const { isLoggedIn } = require('../helpers/util')

module.exports = function (db) {

    router.get('/', isLoggedIn, function (req, res) {
        const { cari_id, cari_nama } = req.query
        let search = []
        let count = 1
        let syntax = []
        let sql = 'select * from supplier'
        if (cari_id) {
            sql += ' WHERE '
            search.push(`%${cari_id}%`)
            syntax.push(`id_supplier ILIKE $${count}`)
            count++
        }
        if (cari_nama) {
            if (!sql.includes(' WHERE ')) {
                sql += ' WHERE'
            }
            search.push(`%${cari_nama}%`)
            syntax.push(` nama_supplier ILIKE $${count}`)
            count++
        }

        if (syntax.length > 0) {
            sql += syntax.join(' AND ')
            sql += ` ORDER BY id_supplier ASC`
        }
        console.log(sql)
        db.query(sql, search, (err, rows) => {
            if (err) console.log(err)
            console.log(req.url)
            res.render('supplier', { rows: rows.rows, currentDir: 'suppliers', current: '' });
        })
    })

    router.get('/info/:id', isLoggedIn, (req, res) => {

        db.query('SELECT * FROM supplier WHERE id_supplier = $1', [req.params.id], (err, rows) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ message: "error ambil data", error: `${err}` })
            }
            if (rows.rows.length == 0) {
                return res.status(500).json({ message: "data not found" })
            }
            const data = rows.rows[0]
            data['currentDir'] = 'suppliers'
            data['current'] = ''
            res.status(200).json(data)
        })
    })

    router.get('/add', isLoggedIn, function (req, res) {
        res.render('supplier_add', { currentDir: 'suppliers', current: ''});
    })

    router.post('/add', function (req, res) {

        db.query(`INSERT INTO supplier(id_supplier, nama_supplier, alamat_supplier, telepon, email) 
    VALUES ($1, $2, $3, $4, $5)`, [req.body.id, req.body.nama, req.body.alamat, req.body.telepon, req.body.email], (err) => {
            if (err) {
                return console.error(err.message);
            }
            res.redirect('/suppliers')
        })
    })

    router.get('/edit/:id', isLoggedIn, (req, res) => {

        db.query('SELECT * FROM supplier WHERE id_supplier = $1', [req.params.id], (err, rows) => {

            if (err) {
                return console.error(err.message);
            }
            res.render('supplier_edit', { rows: rows.rows, currentDir: 'suppliers', current: '' });
        })
    })

    router.post('/edit/:id', function (req, res) {
        db.query(`UPDATE supplier set 
    nama_supplier = $1, alamat_supplier = $2, telepon = $3, email = $4 
    WHERE id_supplier = $5`, [req.body.nama, req.body.alamat, req.body.telepon, req.body.email, req.body.id], (err) => {
            if (err) {
                return console.error(err.message);
            }
            res.redirect('/suppliers')
        })
    })

    router.get('/delete/:id', isLoggedIn, (req, res) => {

        db.query('DELETE FROM supplier WHERE id_supplier = $1', [req.params.id], (err) => {
            if (err) {
                return console.error(err.message);
            }
            res.redirect('/suppliers')
        })
    })


    return router;
}