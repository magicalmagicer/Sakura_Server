const mysql = require('mysql')

const db = mysql.createPool({
  host: '43.138.252.149',
  user: 'root',
  password: 'newmysqlpwd',
  database: 'bili_blog',
  port: '3306',
  timezone: '08:00',
});

module.exports = db
