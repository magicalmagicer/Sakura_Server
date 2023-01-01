// 导入定义验证规则的包
const joi = require('@hapi/joi')

// 定义用户名和密码的验证规则
const username = joi.string().alphanum().min(3).max(12).required()
// const nickname = joi.string().alphanum().min(0).max(12)
const password = joi
  .string()
  .pattern(/^[\S]{5,15}$/)
  .required()

const ip = joi
  .string()
  .pattern(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/)
  .required()
// 定义 id, nickname, email 的验证规则
const id = joi.number().integer().min(1).required()
const nickname = joi.string().required()
const city = joi.string().allow('').required()
const user_email = joi.string().email().required()

// 定义验证 avatar 头像的验证规则
const avatar = joi.string().dataUri().required()

// 定义验证注册和登录表单数据的规则对象
exports.reg_login_schema = {
  body: {
    username,
    password
  }
}
exports.reg_register_schema = {
  body: {
    username,
    password,
    nickname
  }
}
// 验证规则对象 - 更新用户基本信息
exports.update_userinfo_schema = {
  // 需要对 req.body 里面的数据进行验证
  body: {
    id,
    nickname,
    email: user_email
  }
}

// 验证规则对象 - 更新密码
exports.update_password_schema = {
  body: {
    id,
    oldPwd: password,
    newPwd: joi.not(joi.ref('oldPwd')).concat(password)
  }
}

// 验证规则对象 - 更新头像
exports.update_avatar_schema = {
  body: {
    avatar
  }
}
