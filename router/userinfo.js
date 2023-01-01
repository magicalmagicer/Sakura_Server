const express = require('express')
const router = express.Router()
// 导入 multer 和 path
const multer = require('multer')
const path = require('path')

// 创建 multer 的实例
// const uploads_edit = multer({ dest: path.join(__dirname, '../uploads') })
const storage = multer.diskStorage({
  destination(req, res, cb) {
    cb(null, path.join(__dirname, '../avatar'))
  },
  filename(req, file, cb) {
    const filenameArr = file.originalname.split('.')
    // console.log(req.body)
    cb(null, Date.now() + '.' + filenameArr[filenameArr.length - 1])
  }
})
const uploads = multer({ storage })
// 挂载路由

// 导入路由处理函数模块
const userinfo_handler = require('../router_handler/userinfo')

// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { update_userinfo_schema, update_password_schema, update_avatar_schema } = require('../schema/user')

// 获取用户基本信息的路由
router.get('/userinfo', userinfo_handler.getUserInfo)
// 获取用户权限的路由
router.get('/power', userinfo_handler.getUserPower)
// 更新用户信息的路由
router.post('/userinfo', uploads.single('file'), userinfo_handler.updateUserInfo)
// 更新密码的路由
router.post('/updatepwd', expressJoi(update_password_schema), userinfo_handler.updatePassword)

module.exports = router
