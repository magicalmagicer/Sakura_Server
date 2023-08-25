const mysql = require('mysql')

const db = mysql.createPool({
  host: '121.5.233.175',
  user: 'root',
  password: 'CasualKeyL.',
  database: 'bili_blog',
  timezone: '08:00',
});

module.exports = db
