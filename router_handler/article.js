// 文章的处理函数模块
const fs = require('fs')
const path = require('path')
const db = require('../db/index')

// 发布文章的处理函数
exports.addArticle = (req, res) => {
  // console.log(req.file)
  // console.log(req.body)
  // console.log(req.file)
  if (!req.file || req.file.fieldname !== 'file') return res.cc('文章封面是必选参数！')

  // TODO：证明数据都是合法的，可以进行后续业务逻辑的处理
  // 处理文章的信息对象
  const articleInfo = {
    // 标题、内容、所属分类的Id、作者
    ...req.body,
    author_id: Number(req.body.author_id),

    // 文章封面的存放路径
    pic_url: 'http://127.0.0.1:3007/uploads/' + req.file.filename,
    // 文章的发布时间
    time: new Date(),
    like_count: 0
    // category_id: req.cagegoryId
    // // 文章作者的Id
    // author_id: req.user.id
  }
  // console.log(articleInfo)
  // console.log(articleInfo)
  const sql = `insert into article set ?`
  db.query(sql, articleInfo, (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows !== 1) return res.cc('发布新文章失败！')
    res.cc('发布文章成功！', 0)
  })
}

// 修改/编辑文章的处理函数
exports.editArticle = (req, res) => {
  if (req.file) {
    // console.log(req.body)
    // 处理文章的信息对象
    var articleInfo = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      // 文章封面的存放路径
      pic_url: 'http://127.0.0.1:3007/uploads/' + req.file.filename,
      // 文章的发布时间
      time: new Date()
    }
    fs.unlink(path.join(__dirname, '../uploads/', req.body.oldUrl), (err, data) => {
      if (err) {
        res.cc(err)
      } else {
        const sql = `update article set ? where id =${parseInt(req.body.article_id)}`
        db.query(sql, articleInfo, (err, results) => {
          if (err) return res.cc(err)
          if (results.affectedRows !== 1) return res.cc('修改文章失败！')
          res.cc('修改文章成功！', 0)
        })
      }
    })
    // console.log(req.body.oldUrl)
  } else {
    var articleInfo = {
      title: req.body.title,
      category: req.body.category,
      content: req.body.content,
      // 文章的发布时间
      time: new Date()
    }
    const sql = `update article set ? where id =${parseInt(req.body.article_id)}`
    db.query(sql, articleInfo, (err, results) => {
      if (err) return res.cc(err)
      if (results.affectedRows !== 1) return res.cc('修改新文章失败！')
      res.cc('修改文章成功！', 0)
    })
  }
}

// 删除文章处理函数
exports.deleteArticle = (req, res) => {
  const sql = `delete a,l,r,c from article a
    left join likes l
    on a.id = l.article_id
    left join reply r
    on r.article_id = a.id
    left join comment c
    on c.article_id = a.id
    where a.id = ?`
  db.query(sql, parseInt(req.query.id), (err, results) => {
    if (err) return res.cc(err)
    if (results.affectedRows < 1) return res.cc('删除文章失败！')
    res.send({
      status: 0,
      message: '删除文章成功！'
    })
  })
}

// 获取文章列表的处理函数（完成）
exports.getArticle = (req, res) => {
  // console.log(req.query)
  if (req.query.id) {
    //根据id查询文章列表数据
    var sql = `select * from article where author_id = ${parseInt(req.query.id)} order by id desc limit ?, ? `
    var count_sql = `select count(*) from article where author_id = ${parseInt(req.query.id)}`
  } else if (req.query.key) {
    //根据关键字标签查询文章列表数据
    // console.log(2)
    // console.log(typeof req.query.key)
    var sql = `select * from article where category = '${req.query.key}' order by id desc limit ?, ? `
    // console.log(sql)
    var count_sql = `select count(*) from article where category = '${req.query.key}'`
  } else {
    //定义查询全部文章列表数据的 SQL 语句
    var sql = `select * from article order by id desc limit ?, ?`
    var count_sql = `select count(*) from article`
  }
  const start_index = req.query.curPage * req.query.pageSize - req.query.pageSize
  // const params =
  new Promise((resolve, reject) => {
    db.query(sql, [start_index, parseInt(req.query.pageSize)], (err, results) => {
      if (err) return reject(err)
      // console.log(1)
      // if (results.affectedRows === 0) return res.cc('发布新文章失败！')
      resolve(results)
    })
  })
    .then((data) => {
      db.query(count_sql, (err, results) => {
        if (err) return res.cc(err)
        // console.log(2)
        res.send({
          status: 0,
          message: '获取文章列表数据成功！',
          count: results[0]['count(*)'],
          data: data
        })
      })
    })
    .catch((err) => {
      // console.log(3)
      res.cc(err)
    })
}

// 获取文章详情的处理函数
exports.getArticleDetail = (req, res) => {
  // console.log(req.query)
  //定义查询文章列表数据的 SQL 语句
  const sql = `select a.*,u.username,u.nickname from article a,user u  where a.id = ? and  a.author_id  = u.id`
  // const count_sql = `select count(*) from article`
  // console.log(req.query.id)
  db.query(sql, parseInt(req.query.id), (err, results) => {
    if (err) return res.cc(err)
    // console.log(affectedRows)
    // console.log(results.length)
    // console.log(results)
    if (results.length !== 1) return res.cc('获取文章详情失败！')
    res.send({
      status: 0,
      message: '获取文章详情页成功!',
      data: results
    })
  })
}

// 搜索文章列表的处理函数（完成）
exports.searchArticle = (req, res) => {
  //定义查询文章列表数据的 SQL 语句
  const sql = `SELECT * FROM article where title like ? order by id desc limit ? , ?`
  const count_sql = `select count(*) from article where title like ?`
  const start_index = req.query.curPage * req.query.pageSize - req.query.pageSize
  const queryStr = '%' + req.query.key + '%'
  // console.log(req.query, queryStr)
  new Promise((resolve, reject) => {
    db.query(sql, [queryStr, start_index, parseInt(req.query.pageSize)], (err, results) => {
      if (err) return reject(err)
      // if (results.affectedRows === 0) return res.cc('发布新文章失败！')
      resolve(results)
    })
  })
    .then((data) => {
      db.query(count_sql, queryStr, (err, results) => {
        if (err) return res.cc(err)
        res.send({
          status: 0,
          message: '搜索文章列表成功！',
          count: results[0]['count(*)'],
          data: data
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}

// 文章点赞处理函数
exports.likeArticle = (req, res) => {
  const sql = `update article set like_count = like_count + 1 where id = ?`
  const article_liker_sql = `insert likes(article_id, liker_id, time) values(?, ?, ?)`
  const nowTime = new Date()
  // console.log(parseInt(req.query.id), parseInt(req.query.liker_id), nowTime)
  new Promise((resolve, reject) => {
    db.query(sql, parseInt(req.query.id), (err, results) => {
      if (err) return reject(err)
      resolve(results)
    })
  })
    .then((data) => {
      db.query(article_liker_sql, [parseInt(req.query.id), parseInt(req.query.liker_id), nowTime], (err, results) => {
        if (err) return res.cc(err)
        res.send({
          status: 0,
          message: '点赞成功！'
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}

// 文章访问量处理函数
exports.visitArticle = (req, res) => {
  const sql = `update article set visited_count = visited_count + 1 where id = ?`
  // console.log(req.query)
  db.query(sql, parseInt(req.query.id), (err, results) => {
    if (err) return res.cc(err)
    res.send({
      status: 0,
      message: '成功！'
    })
  })
}

// 文章点赞状态
exports.likeStatus = (req, res) => {
  const sql = `select * from likes where article_id = ? and liker_id = ?`
  db.query(sql, [parseInt(req.query.id), parseInt(req.query.liker_id)], (err, results) => {
    if (err) return res.cc(err)
    if (results.length === 1) {
      res.send({
        status: 0,
        message: '已点赞',
        like_status: true
      })
    } else {
      res.send({
        status: 0,
        message: '未点赞',
        like_status: false
      })
    }
  })
}

exports.commentArticle = (req, res) => {
  const sql = `insert into comment set ?`
  const sql2 = `select avatar,nickname from user where id = ?`

  new Promise((resolve, reject) => {
    db.query(sql2, parseInt(req.body.from_id), (err, results) => {
      if (err) return reject(err)
      // console.log(results)
      resolve(results)
    })
  })
    .then((data) => {
      // console.log(data[0].avatar)
      const commentInfo = {
        ...req.body,
        article_id: parseInt(req.body.article_id),
        from_id: parseInt(req.body.from_id),
        time: new Date()
      }
      // 添加评论
      db.query(sql, commentInfo, (err, result) => {
        if (err) return res.cc(err)
        if (result.affectedRows === 1) {
          res.send({
            status: 0,
            message: '评论成功！'
          })
        } else {
          res.send({
            status: 1,
            message: '评论失败！'
          })
        }
      })
    })
    .catch((err) => {
      res.cc(err)
    })

  // console.log(commentInfo)
}
exports.getArticleComment = (req, res) => {
  // const sql = `select * from comment where article_id = ?`
  const sql = `SELECT c.article_id, c.content,u.avatar,u.nickname,u.username, c.from_id,c.id comment_id,c.time,r.content reply,r.time reply_time FROM comment c LEFT JOIN reply r ON c.id = r.comment_id and c.article_id = ? LEFT JOIN user u ON c.from_id = u.id `
  db.query(sql, parseInt(req.query.article_id), (err, result) => {
    if (err) return res.cc('获取文章评论失败！')
    res.send({
      status: 0,
      message: '获取文章评论成功！',
      data: result
    })
  })
}
// 删除文章评论
exports.deleteComment = (req, res) => {
  new Promise((resolve, reject) => {
    const querySql = `select * from article where id = ? and author_id =?`
    db.query(querySql, [parseInt(req.body.article_id), parseInt(req.body.visitor_id)], (err, result) => {
      if (err) return reject(err)
      if (result.length === 0) return reject('你没有权限删除此文章!')
      resolve(result)
    })
  })
    .then(() => {
      const sql = `DELETE c,r FROM comment c LEFT JOIN reply r ON r.comment_id = c.id WHERE c.id = ?`
      db.query(sql, parseInt(req.body.comment_id), (err, result) => {
        if (err) return res.cc(err)
        // if (result.affectedRows === 0) res.cc('删除评论失败!')
        res.send({
          status: 0,
          message: '删除评论成功!'
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}
exports.replyToComment = (req, res) => {
  const sql = `insert into reply set ?`

  const replyInfo = {
    ...req.body,
    time: new Date(),
    comment_id: parseInt(req.body.comment_id),
    article_id: parseInt(req.body.article_id)
  }
  // console.log(replyInfo)
  db.query(sql, replyInfo, (err, result) => {
    if (err) return res.cc(err)
    res.send({
      status: 0,
      message: '回复评论成功！'
    })
  })
}
// 上传文章图片的处理函数
exports.uploadImg = (req, res) => {
  const filenameArr = req.file.originalname.split('.')
  const filename = Date.now() + '.' + filenameArr[filenameArr.length - 1]
  fs.writeFile(path.join(__dirname, '../imgupload/', filename), req.file.buffer, (err) => {
    if (err) res.cc('上传图片失败！')
    res.send({
      status: 0,
      message: '上传图片成功！',
      data: 'http://127.0.0.1:3007/imgupload/' + filename
    })
  })
}
