var express = require('express');
var router = express.Router();
const { isLoggedIn } = require('../helpers/util');
const bcrypt = require('bcrypt');
const saltRounds = 10;
module.exports = function (pool) {
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/login', (req, res) => {
    
  res.render('login', { info: req.flash('info')})
})
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const { rows } = await pool.query('select * from users where email = $1', [email])

    if (rows.length == 0) {
      throw 'email tidak terdaftar'
    }

    const match = await bcrypt.compare(password, rows[0].password);

    if (!match) {
      throw 'password salah'
    }

    req.session.user = rows[0]

    res.redirect('/')
  } catch (err) {
    req.flash('info', err)
    res.redirect('/users/login')
  }
})

router.get('/register', (req, res) => {
  res.render('register', { info: req.flash('info'), success: req.flash('success') })
})

router.post('/register', async (req, res) => {
  try {
    const { email, name, password, repassword } = req.body
    if (password != repassword) {
      throw 'password tidak sama'
    }
    const { rows } = await pool.query('select * from users where email = $1', [email])

    if (rows.length > 0) {
      throw 'email telah digunakan'
    }
    const hash = bcrypt.hashSync(password, saltRounds);
    const createUser = await pool.query('insert into users values($1, $2, $3)', [email, name, hash])
    req.flash('success', 'selamat akun anda telah dibuat silahkan login')
    res.redirect('/users/register')
  } catch (err) {
    req.flash('info', err)
    res.redirect('/users/register')
  }
}
)
router.get('/logout', (req, res) => {
  req.session.destroy(function (err) {
    res.redirect('/users/login')
  })
})
return router;
}