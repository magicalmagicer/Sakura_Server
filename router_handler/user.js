// 导入数据库操作模块
const db = require('../db/index');
// 导入 bcryptjs 这个包
const bcrypt = require('bcryptjs');
// 导入生成 Token 的包
const jwt = require('jsonwebtoken');
// 导入全局的配置文件
const config = require('../config');
const axios = require('axios');
const nodemailer = require('nodemailer');
var moment = require('moment');
// require 方式
require('moment/locale/zh-cn');
moment.locale('zh-cn');

// 注册新用户的处理函数
exports.regUser = (req, res) => {
  // 获取客户端提交到服务器的用户信息
  const userinfo = req.body;
  // console.log(userinfo);
  // 定义 SQL 语句，查询用户名是否被占用
  const sqlStr = 'select * from user where username=? or email=?';
  db.query(sqlStr, [userinfo.username, userinfo.email], (err, results) => {
    // 执行 SQL 语句失败
    if (err) {
      console.log(err);
      return res.cc(err);
    }
    // 判断用户名是否被占用
    if (results.length > 0) {
      return res.cc('用户名或邮箱被占用，请更换！');
    }

    // 验证码核验
    const codeSql = 'select * from email where email=?';
    // 调用 db.query() 执行 SQL 语句
    db.query(codeSql, userinfo.email, (err, results) => {
      // 判断 SQL 语句是否执行成功
      if (err) return res.cc(err);
      console.log(results[0]);
      console.log(typeof  results[0]);
      if (userinfo.code !== results[0].code) return res.cc('验证码错误！');
      if (moment(results[0].expire).valueOf() < moment().valueOf()) return res.cc('验证码失效！');

      // 调用 bcrypt.hashSync() 对密码进行加密
      userinfo.password = bcrypt.hashSync(userinfo.password, 10);
      // 定义插入新用户的 SQL 语句
      const sql = 'insert into user set ?';
      // 调用 db.query() 执行 SQL 语句
      db.query(sql, { username: userinfo.username, password: userinfo.password, nickname: userinfo.nickname, email: userinfo.email }, (err, results) => {
        // 判断 SQL 语句是否执行成功
        if (err) return res.cc(err);
        if (results.affectedRows !== 1) return res.cc('注册用户失败，请稍后再试！');
        // 注册用户成功
        res.cc('注册成功！', 0);
      });
    });
  });
};

// 登录的处理函数(完成)
exports.login = (req, res) => {
  // 接收表单的数据
  const userinfo = req.body;
  // 定义 SQL 语句
  const sql = `select * from user where username = ?`;
  // 执行 SQL 语句，根据用户名查询用户的信息
  db.query(sql, userinfo.username, (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err);
    // 执行 SQL 语句成功，但是获取到的数据条数不等于 1
    if (results.length !== 1) return res.cc('登录失败！');
    // 获取登录城市
    let ip = req.connection.remoteAddress || req.socket.remoteAddress || '::ffff:127.0.0.1';
    let city = '';
    console.log(ip);
    ip = ip.split('ffff:')[1];
    axios
      .get(`https://restapi.amap.com/v3/ip?ip=${ip}&output=json&key=0b000d8c5439bb0c68baf852a91b6b04`)
      .then((result) => {
        const data = result.data;
        if (data.info == 'OK' && (data.province.length > 0 || data.province.length > 0)) {
          city = data.province == data.city ? data.city : data.province + data.city;
          console.log(data.province, data.city);
          console.log(city);
        }
        // TODO：通过compareSync判断密码是否正确
        const compareResult = bcrypt.compareSync(userinfo.password, results[0].password);
        if (!compareResult) return res.cc('密码错误！');

        // TODO：在服务器端生成 Token 的字符串
        const user = { ...results[0], password: '', avatar: '' };
        // 对用户的信息进行加密，生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn });
        // 调用 res.send() 将 Token 响应给客户端
        let time_sql = `insert into login set ?`;
        let loginInfo = {
          ip: ip,
          user_id: results[0].id,
          time: new Date(Date.now() + 8 * 60 * 60 * 1000),
          city: city,
        };
        console.log(loginInfo);
        db.query(time_sql, loginInfo, (err, results) => {
          console.log(results);
          if (err) {
            console.log(err);
            console.log('插入登录信息失败！');
          }
        });
        res.send({
          status: 0,
          message: '登录成功！',
          token: 'Bearer ' + tokenStr,
          username: userinfo.username,
          id: results[0].id,
          nickname: results[0].nickname,
          power: results[0].power,
        });
      })
      .catch((err) => {
        console.log('Error: ', err.message);
      });
  });
};

// 获取验证码
exports.getCode = (req, res) => {
  // 接收表单的数据
  const email = req.body.email;
  const type = req.body.type;
  console.log(req.body);
  // 邮箱配置
  let code = Math.floor(Math.random() * 900000 + 100000);
  // 建立一个smtp连接
  let transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    secureConnection: true, // 这个属性为true 可以使邮件更安全
    port: 465, // 端口默认465
    auth: {
      user: '3263047330@qq.com', // 邮箱账号
      pass: 'iytbzdvitbpsdbcb', // 可理解为是密码，从邮箱上获取的
    },
  });
  // 配置相关参数--注册
  let options = {
    from: '3263047330@qq.com',
    to: email + ',3263047330@qq.com', // 发到哪里去  加上自己的邮箱可以不被qq 拦截
    subject: '博客网站账号注册验证', // 邮件标题
    html: `<div style="width:600px;margin:30px auto"><h1 style="text-align:center;">邮箱验证码</h1><p style="font-size:20px">请填写以下验证码完成邮箱验证：</p><strong style="font-size:20px;display:block;text-align:center;color:red">${code}</strong><p>验证码十分钟内有效，请及时输入</p><i style="color:#00bfff">此邮件为系统自动发送，请勿回复！若您没有进行注册请忽略。</i><p style="text-align:right">--邮箱助手</p></div>`,
  };
  // 配置相关参数--修改密码
  let options1 = {
    from: '3263047330@qq.com',
    to: email + ',3263047330@qq.com', // 发到哪里去  加上自己的邮箱可以不被qq 拦截
    subject: '博客网站密码修改验证', // 邮件标题
    html: `<div style="width:600px;margin:30px auto"><h1 style="text-align:center;">邮箱验证码</h1><p style="font-size:20px">请填写以下验证码完成邮箱验证：</p><strong style="font-size:20px;display:block;text-align:center;color:red">${code}</strong><p>验证码十分钟内有效，请及时输入</p><i style="color:#00bfff">此邮件为系统自动发送，请勿回复！若您没有进行注册请忽略。</i><p style="text-align:right">--邮箱助手</p></div>`,
  };
  if (type === '1') {
    // 注册验证码
    const sql = `select * from user where email=?`;
    db.query(sql, email, (err, results) => {
      if (err) {
        return res.cc(err);
      }
      // 判断邮箱是否被占用
      if (results.length > 0) {
        return res.cc('邮箱已被注册，请更换其他邮箱！');
      }

      transporter.sendMail(options, (err, msg) => {
        if (err) {
          console.log('发送失败', err);
          res.cc('验证码发送失败！');
        } else {
          // console.log(new Date());
          const time = moment(moment().valueOf() + 1000 * 60 * 10).format();
          const sql = `insert into email (email,code,expire) values ('${email}',${code},'${time}') on duplicate key update code=${code},expire='${time}';`;
          db.query(sql, (err, results) => {
            console.log(err);
            if (err) return res.cc('验证码发送失败！');
            if (results.affectedRows === 0) return res.cc('验证码发送失败，请稍后再试！');
            console.log('发送成功！ ', code);
            res.cc('验证码发送成功！', 0);
          });
        }
        transporter.close();
      });
    });
  } else if (type === '2') {
    //修改密码验证码
    const sql = `select * from user where email=?`;
    db.query(sql, email, (err, results) => {
      if (err) {
        return res.cc(err);
      }
      transporter.sendMail(options1, (err, msg) => {
        if (err) {
          console.log('修改密码验证码发送失败', err);
          res.cc('验证码发送失败！');
        } else {
          const sql = `update user set code = ?, expire = ? where email = ?`;
          const time = moment(moment().valueOf() + 1000 * 60 * 10).format();
          db.query(sql, [code, time, email], (err, results) => {
            if (err) {
              console.log(err);
              return res.cc('验证码发送失败！');
            }
            if (results.affectedRows !== 1) return res.cc('验证码发送失败，请稍后再试！');
            console.log('发送成功！ ', code);
            res.cc('验证码发送成功！', 0);
          });
        }
        transporter.close();
      });
    });
  } else {
    res.cc('参数错误！');
  }
};
