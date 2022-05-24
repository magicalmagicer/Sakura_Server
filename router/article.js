// 文章的路由模块

const express = require('express')
const router = express.Router()

// 导入需要的处理函数模块
const article_handler = require('../router_handler/article')

// 导入 multer 和 path
const multer = require('multer')
const path = require('path')

// 创建 multer 的实例
// const uploads_edit = multer({ dest: path.join(__dirname, '../uploads') })
const storage = multer.diskStorage({
  destination(req, res, cb) {
    cb(null, path.join(__dirname, '../uploads'))
    // console.log(req, res)
  },
  filename(req, file, cb) {
    const filenameArr = file.originalname.split('.')
    // console.log(req.body)
    cb(null, Date.now() + '.' + filenameArr[filenameArr.length - 1])
  }
})

const storage2 = multer.diskStorage({
  destination(req, res, cb) {
    cb(null, path.join(__dirname, '../imgupload'))
    // console.log(req, res)
  },
  fieldname(req, file, cb) {
    const filenameArr = file.originalname.split('.')
    // console.log(req.body)
    cb(null, Date.now() + '.' + filenameArr[filenameArr.length - 1])
  }
})

const uploads = multer({ storage })
const uploads2 = multer({ storage2 })
// 导入验证数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const { add_article_schema } = require('../schema/article')

// 发布文章的路由  upload.single()是一个局部生效的中间件，用来解析FormData格式的表单数据
router.post('/add', uploads.single('file'), article_handler.addArticle)
//编辑文章的路由
router.post('/edit', uploads.single('file'), article_handler.editArticle)
//获取文章列表路由
router.get('/get', article_handler.getArticle)
// 获取文章详情路由
router.get('/details', article_handler.getArticleDetail)
//上传文章内容中的图片的路由
router.post('/imgupload', uploads2.single('file'), article_handler.uploadImg)
// 删除文章路由
router.get('/delete', article_handler.deleteArticle)
//搜索文章列表路由
router.get('/search', article_handler.searchArticle)
//文章点赞
router.get('/like', article_handler.likeArticle)
//获取文章点赞状态
router.get('/likeStatus', article_handler.likeStatus)
//文章访问
router.get('/visit', article_handler.visitArticle)
//文章评论
router.post('/comment', article_handler.commentArticle)
//回复文章评论
router.post('/replycomment', article_handler.replyToComment)
//获取文章评论
router.get('/getcomment', article_handler.getArticleComment)
//获取我的消息
router.get('/getmessage', article_handler.getMessage)
//修改消息状态
router.get('/messagestatus', article_handler.changeMessageStatus)
//修改消息状态
router.get('/changelike', article_handler.changeLikeStatus)
// 文章点赞消息
router.get('/getlike', article_handler.getLikeMessage)
//删除文章评论
router.post('/deletecomment', article_handler.deleteComment)
module.exports = router
