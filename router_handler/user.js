// 导入数据库操作模块
const db = require('../db/index')
// 导入 bcryptjs 这个包
const bcrypt = require('bcryptjs')
// 导入生成 Token 的包
const jwt = require('jsonwebtoken')
// 导入全局的配置文件
const config = require('../config')
const axios = require('axios')

// 注册新用户的处理函数
exports.regUser = (req, res) => {
  // 获取客户端提交到服务器的用户信息
  const userinfo = req.body

  // 定义 SQL 语句，查询用户名是否被占用
  const sqlStr = 'select * from user where username=?'
  db.query(sqlStr, userinfo.username, (err, results) => {
    // 执行 SQL 语句失败
    if (err) {
      // return res.send({ status: 1, message: err.message })
      return res.cc(err)
    }
    // 判断用户名是否被占用
    if (results.length > 0) {
      // return res.send({ status: 1, message: '用户名被占用，请更换其他用户名！' })
      return res.cc('用户名被占用，请更换其他用户名！')
    }
    // 调用 bcrypt.hashSync() 对密码进行加密
    userinfo.password = bcrypt.hashSync(userinfo.password, 10)
    // 定义插入新用户的 SQL 语句
    const sql = 'insert into user set ?'
    // 调用 db.query() 执行 SQL 语句
    db.query(sql, { username: userinfo.username, password: userinfo.password, nickname: userinfo.nickname }, (err, results) => {
      // 判断 SQL 语句是否执行成功
      if (err) return res.cc(err)
      if (results.affectedRows !== 1) return res.cc('注册用户失败，请稍后再试！')
      // 注册用户成功
      res.cc('注册成功！', 0)
    })
  })
}

// 登录的处理函数(完成)
exports.login = (req, res) => {
  // 接收表单的数据
  const userinfo = req.body
  // 定义 SQL 语句
  const sql = `select * from user where username = ?`
  // 执行 SQL 语句，根据用户名查询用户的信息
  db.query(sql, userinfo.username, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err)
    // 执行 SQL 语句成功，但是获取到的数据条数不等于 1
    if (results.length !== 1) return res.cc('登录失败！')
    // 获取登录城市
    let ip = req.connection.remoteAddress || req.socket.remoteAddress || '::ffff:127.0.0.1'
    let city = ''
    console.log(ip)
    ip = ip.split('ffff:')[1]
    axios
      .get(`https://restapi.amap.com/v3/ip?ip=${ip}&output=json&key=0b000d8c5439bb0c68baf852a91b6b04`)
      .then((result) => {
        const data = result.data
        if (data.info == 'OK' && (data.province.length > 0 || data.province.length > 0)) {
          city = data.province == data.city ? data.city : data.province + data.city
          console.log(data.province, data.city)
          console.log(city)
        }
        // TODO：通过compareSync判断密码是否正确
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
        if (!compareResult) return res.cc('密码错误！')
        // if (userinfo.password !== results[0].password) return res.cc('登录失败！')

        // TODO：在服务器端生成 Token 的字符串
        const user = { ...results[0], password: '', avatar: '' }
        // 对用户的信息进行加密，生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn })
        // 调用 res.send() 将 Token 响应给客户端
        let time_sql = `insert into login set ?`
        let loginInfo = {
          ip: ip,
          user_id: results[0].id,
          time: new Date(Date.now() + 8 * 60 * 60 * 1000),
          city: city
        }
        console.log(loginInfo)
        db.query(time_sql, loginInfo, (err, results) => {
          console.log(results)
          if (err) {
            console.log(err)
            console.log('插入登录信息失败！')
          }
        })
        res.send({
          status: 0,
          message: '登录成功！',
          token: 'Bearer ' + tokenStr,
          username: userinfo.username,
          id: results[0].id,
          nickname: results[0].nickname,
          power: results[0].power
        })
      })
      .catch((err) => {
        console.log('Error: ', err.message)
      })
  })
}
