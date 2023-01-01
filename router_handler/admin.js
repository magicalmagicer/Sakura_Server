// 导入数据库操作模块
const db = require('../db/index')
// 导入处理密码的模块
const bcrypt = require('bcryptjs')
// 导入读写模块
const fs = require('fs')
const path = require('path')
const { SSL_OP_NO_TLSv1_1 } = require('constants')
// 获取用户基本信息的处理函数
exports.getUsersInfo = (req, res) => {
  if (req.query.query) {
    var sql = `select id,nickname,username,power from user where username like '%${req.query.query}%' order by power desc ,id limit ?, ? `
    const start_index = req.query.pagenum * req.query.pagesize - req.query.pagesize
    var count_sql = `select count(*) from user where username like '%${req.query.query}%' order by power desc ,id`
    new Promise((resolve, reject) => {
      db.query(sql, [start_index, parseInt(req.query.pagesize)], (err, results) => {
        if (err) return reject(err)
        resolve(results)
      })
    })
      .then((data) => {
        db.query(count_sql, (err, results) => {
          if (err) return res.cc(err)
          res.send({
            status: 0,
            message: '获取用户信息成功！',
            count: results[0]['count(*)'],
            data: data
          })
        })
      })
      .catch((err) => {
        console.log(err)
        res.cc(err)
      })
  } else {
    var sql = `select id,nickname,username,power from user order by power desc,id limit ?, ? `
    const start_index = req.query.pagenum * req.query.pagesize - req.query.pagesize
    var count_sql = `select count(*) from user`
    console.log(start_index, parseInt(req.query.pagesize))
    new Promise((resolve, reject) => {
      db.query(sql, [start_index, parseInt(req.query.pagesize)], (err, results) => {
        if (err) return reject(err)
        resolve(results)
      })
    })
      .then((data) => {
        db.query(count_sql, (err, results) => {
          if (err) return res.cc(err)
          res.send({
            status: 0,
            message: '获取用户信息成功！',
            count: results[0]['count(*)'],
            data: data
          })
        })
      })
      .catch((err) => {
        res.cc(err)
      })
  }
}

// 删除用户的处理函数
exports.deleteUser = (req, res) => {
  new Promise((resolve, reject) => {
    const querySql = `select power from user where id = ?`
    db.query(querySql, parseInt(req.body.id), (err, result) => {
      if (err) return reject(err)
      if (req.body.power < 2 || result[0].power >= req.body.power) {
        return res.send({
          status: 1,
          message: '你没有权限删除该用户!'
        })
      }
      resolve(result)
    })
  })
    .then(() => {
      sql = `delete a,c,u,m,l,r from user u
      left join article a
      on u.id = a.author_id
      left join message m
      on m.to_id = u.id
      left join comment c
      on (c.from_id = u.id or c.article_id = a.id)
      left join reply r
      on r.article_id = a.id
      left join likes l
      on (l.article_id = a.id or l.liker_id = u.id)
      where u.id = ?`
      db.query(sql, req.body.id, (err, result) => {
        if (err) return res.cc(err)
        res.send({
          status: 0,
          message: '删除用户成功！'
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}
exports.assignpermissions = (req, res) => {
  if (req.body.role_power >= req.body.power) return res.cc('你的权限不足！')
  const sql = `update user set power = ? where id = ?`
  db.query(sql, [req.body.role_power, req.body.id], (err, result) => {
    if (err) return res.cc(err)
    if (result.affectedRows === 1) {
      res.send({
        status: 0,
        message: '分配权限成功！'
      })
    }
  })
}
exports.resetPassword = (req, res) => {
  if (req.body.role_power >= req.body.power) return res.cc('你的权限不足！')
  // 根据 id 查询用户的信息
  const sql = `select * from user where id=?`
  const password = '123456'
  // 执行根据 id 查询用户的信息的 SQL 语句
  db.query(sql, req.body.id, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err)
    // 判断结果是否存在
    if (results.length !== 1) return res.cc('用户不存在！')
    // 定义更新密码的 SQL 语句
    const sql = `update user set password=? where id=?`
    // 对新密码进行加密处理
    const newPwd = bcrypt.hashSync(password, 10)
    // 调用 db.query() 执行 SQL 语句
    db.query(sql, [newPwd, req.body.id], (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // 成功
      res.cc('重置密码成功', 0)
    })
  })
}
//获取用户登录信息
exports.getUsersLoginInfo = (req, res) => {
  // 根据 id 查询用户的信息
  const sql = `select * from user where id=?`
  // 执行根据 id 查询用户的信息的 SQL 语句
  db.query(sql, req.query.id, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err)
    // 判断结果是否存在
    if (results.length !== 1) return res.cc('用户不存在！')
    if (results.power < 2) return res.cc('权限不足')
    let year = req.query.year
    let yearData = new Array(12).fill(0)
    for (let i = 1; i < 13; i++) {
      let day = i >= 10 ? i : '0' + i
      let date = year + '-' + day
      const time_sql = `SELECT
                            l.id,l.time,l.city,u.nickname,u.username
                            FROM
                            login l
                            LEFT JOIN user u
                            on l.user_id = u.id
                            WHERE 
                            date_format(time, "%Y-%m")="${date}"
                            order by time
                            `
      // 调用 db.query() 执行 SQL 语句
      db.query(time_sql, (err, data) => {
        // 执行 SQL 语句失败
        if (err) {
          console.log('出错' + i)
          yearData[i - 1] = []
        } else {
          yearData[i - 1] = data
          if (i >= 12) {
            res.send({
              status: 0,
              data: yearData,
              message: '获取用户登录数据成功！'
            })
          }
        }
      })
    }
  })
}
// 文章分类
exports.editCategory = (req, res) => {
  let query = req.body
  // console.log(query)
  if (query.operation == 'edit') {
    const sql = `update category set name=? where id=?`
    // 执行根据 id 查询用户的信息的 SQL 语句
    db.query(sql, [query.name, query.id], (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // 判断结果是否存在
      if (results.affectedRows == 1) {
        return res.send({
          status: 0,
          message: '更新文章分类名称成功！'
        })
      }
    })
  } else if (query.operation == 'add') {
    const sql = `insert into category set name='${query.name}'`
    // 执行根据 id 查询用户的信息的 SQL 语句
    db.query(sql, (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // 判断结果是否存在
      if (results.affectedRows == 1) {
        return res.send({
          status: 0,
          message: '新增文章分类名称成功！'
        })
      }
    })
  } else {
    const sql = `delete from category where id = ?`
    // 执行根据 id 查询用户的信息的 SQL 语句
    db.query(sql, query.id, (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // 判断结果是否存在
      if (results.affectedRows == 1) {
        return res.send({
          status: 0,
          message: '删除文章分类名称成功！'
        })
      }
    })
  }
}
