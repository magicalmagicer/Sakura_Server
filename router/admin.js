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
    // console.log(req, res)
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
const usersinfo_handler = require('../router_handler/admin')

// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { update_userinfo_schema, update_password_schema, update_avatar_schema } = require('../schema/user')

// 获取用户基本信息的路由
router.get('/users', usersinfo_handler.getUsersInfo)
// 删除用户的路由
router.post('/deleteuser', usersinfo_handler.deleteUser)
// 分配用户权限的路由
router.post('/rights', usersinfo_handler.assignpermissions)
// 重置用户密码的路由
router.post('/reset', usersinfo_handler.resetPassword)
// 获取用户登录信息的路由
router.get('/logininfo', usersinfo_handler.getUsersLoginInfo)
// 修改文章分类的路由
router.post('/category', usersinfo_handler.editCategory)

module.exports = router
