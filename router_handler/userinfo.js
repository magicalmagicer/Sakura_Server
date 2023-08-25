// 导入数据库操作模块
const db = require('../db/index');
// 导入处理密码的模块
const bcrypt = require('bcryptjs');
const { log } = require('console');
// 导入读写模块
const fs = require('fs');
const path = require('path');
var moment = require('moment');
// require 方式
require('moment/locale/zh-cn');
moment.locale('zh-cn');

// 获取用户基本信息的处理函数
exports.getUserInfo = (req, res) => {
  // 定义查询用户信息的 SQL 语句
  const sql = `select id,avatar,nickname,username,email from user where id=?`;
  // 调用 db.query() 执行 SQL 语句
  db.query(sql, req.query.id, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err);
    // 执行 SQL 语句成功，但是查询的结果可能为空
    if (results.length !== 1) return res.cc('获取用户信息失败！');
    // 用户信息获取成功
    res.send({
      status: 0,
      message: '获取用户信息成功！',
      data: results[0],
    });
  });
};

// 获取用户权限的处理函数
exports.getUserPower = (req, res) => {
  // 定义查询权限用户信息的 SQL 语句
  const sql = `select power from user where id=?`;
  // 调用 db.query() 执行 SQL 语句
  db.query(sql, req.query.id, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err);
    // 执行 SQL 语句成功，但是查询的结果可能为空
    if (results.length !== 1) return res.cc('获取用户权限失败！');
    // 用户权限信息获取成功
    res.send({
      status: 0,
      message: '获取用户权限成功！',
      data: results[0],
      // data: { power: 2 }
    });
  });
};

// 更新用户基本信息的处理函数
exports.updateUserInfo = (req, res) => {
  if (req.file) {
    // 上传新头像
    var userInfo = {
      nickname: req.body.nickname,
      // 文章封面的存放路径
      avatar: 'http://127.0.0.1:3007/avatar/' + req.file.filename,
    };
    if (req.body.oldavatar) {
      console.log('存在老头像');
      // console.log(11)
      fs.unlink(path.join(__dirname, '../avatar/', req.body.oldavatar), (err, results) => {
        if (err) res.cc(err);
        const sql = `update user set ? where username ='${req.body.username}'`;
        db.query(sql, userInfo, (err, results) => {
          if (err) return res.cc(err);
          res.cc('修改用户信息成功！', 0);
        });
      });
    } else {
      console.log('首次上传头像');
      const sql = `update user set ? where username ='${req.body.username}'`;
      db.query(sql, userInfo, (err, results) => {
        if (err) return res.cc(err);
        res.cc('修改用户信息成功！', 0);
      });
    }
  } else {
    // 未上传新头像
    console.log('未上传新头像');
    var userInfo = {
      nickname: req.body.nickname,
    };
    const sql = `update user set ? where username ='${req.body.username}'`;
    db.query(sql, userInfo, (err, results) => {
      if (err) return res.cc(err);
      console.log(results.affectedRows);
      if (results.affectedRows !== 1) return res.cc('修改用户信息失败！');
      return res.cc('修改用户信息成功！', 0);
    });
  }
};

// 更新用户密码的处理函数
exports.updatePassword = (req, res) => {
  let id = req.user.id;
  let email = req.body.email;
  let code = req.body.code;
  // 根据 id 查询用户的信息
  const sql = `select * from user where id=? and email=?`;
  // 执行根据 id 查询用户的信息的 SQL 语句
  db.query(sql, [id, email], (err, results) => {
    if (err) return res.cc(err);
    if (results.length !== 1) return res.cc('用户不存在！');
    if (results[0].code !== code) {
      return res.cc('验证码错误！');
    }
    if (moment(results[0].expire).valueOf() < moment().valueOf()) {
      return res.cc('验证码失效！');
    }

    const sql = `update user set password=? where id=?`;
    // 对新密码进行加密处理
    const newPwd = bcrypt.hashSync(req.body.newPwd, 10);
    // 调用 db.query() 执行 SQL 语句
    db.query(sql, [newPwd, id], (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err);
      // 判断影响的行数
      if (results.affectedRows !== 1) return res.cc('修改密码失败！');
      // 成功
      res.cc('修改密码成功', 0);
    });
  });
};

// 获取用户活跃度的处理函数
exports.getActivity = (req, res) => {
  let date = req.query.date;
  // date = '2022-12'
  // 1. 定义更新头像的 SQL 语句
  const sql = `select a.id,a.times,u.nickname from (select *,count(time) times from login where date_format(time, "%Y-%m")="${date}"  group by user_id order by times desc) a left join user u on u.id = a.user_id limit 5;`;
  // 2. 调用 db.query() 执行 SQL 语句
  db.query(sql, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err);
    // 成功
    res.send({
      status: 0,
      data: results,
    });
  });
};

// 更新用户绑定邮箱的处理函数
exports.updateEmail = (req, res) => {
  const { new_code, old_code, new_email, old_email,id } = req.body;
  const currentTime = moment().valueOf();
  if (old_email) {
    // 根据 id 查询用户的信息
    const sql = `select u.code as old_code, u.expire AS old_expire ,e.code as new_code,e.expire AS new_expire FROM user u inner join email e where u.email =? and e.email =?`;
    // 执行根据 id 查询用户的信息的 SQL 语句
    db.query(sql, [old_email, new_email], (err, results) => {
      if (err) return res.cc(err);
      // console.log(results.length);
      console.log(results[0]);
      if (results.length !== 1) return res.cc('请先发送验证码！');
      if (results[0].old_code !== old_code) {
        return res.cc('原始邮箱验证码错误！');
      }
      
      if (moment(results[0].old_expire).valueOf() < currentTime) {
        return res.cc('原始邮箱验证码失效！');
      }
      if (results[0].new_code !== new_code) {
        return res.cc('新绑定邮箱验证码错误！');
      }
      if (moment(results[0].new_expire).valueOf() < currentTime) {
        return res.cc('新绑定邮箱验证码失效！');
      }

      const sql = `update user set email=?,code=null,expire=null where email=?`;
      // 调用 db.query() 执行 SQL 语句
      db.query(sql, [new_email, old_email], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err);
        // 判断影响的行数
        if (results.affectedRows !== 1) return res.cc('邮箱绑定失败！');
        // 成功
        res.cc('邮箱绑定成功！', 0);
      });
    });
  }else {
    // 根据 id 查询用户的信息
    const sql = `select code,expire from email where email=?`;
    // 执行根据 id 查询用户的信息的 SQL 语句
    db.query(sql,new_email, (err, results) => {
      if (err) return res.cc(err);
      if (results.length !== 1) return res.cc('请先发送验证码！');

      if (results[0].code !== new_code) {
        return res.cc('新绑定邮箱验证码错误！');
      }
      if (moment(results[0].expire).valueOf() < currentTime) {
        return res.cc('新绑定邮箱验证码失效！');
      }

      const sql = `update user set email=?,code=null,expire=null where id=?`;
      // 调用 db.query() 执行 SQL 语句
      db.query(sql, [new_email, id], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err);
        // 判断影响的行数
        if (results.affectedRows !== 1) return res.cc('邮箱绑定失败！');
        // 成功
        res.cc('邮箱绑定成功！', 0);
      });
    });
  }
};
