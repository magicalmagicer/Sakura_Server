const mysql = require('mysql')

const db = mysql.createPool({
  host: '110.41.42.88',
  user: 'root',
  password: 'newmysqlpwd',
  database: 'sakura_database',
  timezone: '08:00'
})

module.exports = db
