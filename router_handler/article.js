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
    // pic_url: 'http://127.0.0.1:3007/uploads/' + req.file.filename,
    pic_url: 'http://120.46.168.254:3007/uploads/' + req.file.filename,
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
      pic_url: 'http://120.46.168.254/uploads/' + req.file.filename,
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
  const sql = `delete a,l,r,c,m from article a
    left join likes l
    on a.id = l.article_id
    left join reply r
    on r.article_id = a.id
    left join comment c
    on c.article_id = a.id
    left join message m
    on (m.time = c.time or m.time = r.time)
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
  if (req.query.id) {
    //根据id查询文章列表数据
    var sql = `select a.*,u.nickname from article a left join user u on u.id = a.author_id where author_id = ${parseInt(req.query.id)} order by id desc limit ?, ? `
    var count_sql = `select count(*) from article where author_id = ${parseInt(req.query.id)}`
  } else if (req.query.key) {
    //根据关键字标签查询文章列表数据
    var sql = `select a.*,u.nickname from article a left join user u on u.id = a.author_id where category = '${req.query.key}' order by id desc limit ?, ? `
    var count_sql = `select count(*) from article where category = '${req.query.key}'`
  } else {
    //定义查询全部文章列表数据的 SQL 语句
    var sql = `select a.*,u.nickname from article a left join user u on u.id = a.author_id order by a.id desc limit ?, ?`
    var count_sql = `select count(*) from article`
  }
  const start_index = req.query.curPage * req.query.pageSize - req.query.pageSize
  new Promise((resolve, reject) => {
    db.query(sql, [start_index, parseInt(req.query.pageSize)], (err, results) => {
      if (err) return reject(err)
      resolve(results)
    })
  })
    .then((data) => {
      db.query(count_sql, (err, results) => {
        if (err) return res.cc(err)
        res.send({
          status: 0,
          message: '获取文章列表数据成功！',
          count: results[0]['count(*)'],
          data: data
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}

// 获取文章详情的处理函数
exports.getArticleDetail = (req, res) => {
  //定义查询文章列表数据的 SQL 语句
  const sql = `select a.*,u.username,u.nickname from article a,user u  where a.id = ? and  a.author_id  = u.id`
  db.query(sql, parseInt(req.query.id), (err, results) => {
    if (err) return res.cc(err)
    if (results.length !== 1) return res.cc('获取文章详情失败！')
    res.send({
      status: 0,
      message: '获取文章详情页成功!',
      data: results
    })
  })
}

// 搜索文章列表的处理函数（完成）
exports.searchArticle = async (req, res) => {
  try {
    const start_index = req.query.curPage * req.query.pageSize - req.query.pageSize
    const queryStr = '%' + req.query.key + '%'

    // 定义查询文章列表数据的 SQL 语句
    const sql = `SELECT * FROM article where (title like '${queryStr}' or content like '${queryStr}') order by id desc limit ? , ?`
    const count_sql = `select count(*) from article where (title like '${queryStr}' or content like '${queryStr}')`

    // 使用 promise 封装查询
    const queryPromise = (sql, values) => {
      return new Promise((resolve, reject) => {
        db.query(sql, values, (err, results) => {
          if (err) {
            reject(err)
          } else {
            resolve(results)
          }
        })
      })
    }

    // 执行查询
    const data = await queryPromise(sql, [start_index, parseInt(req.query.pageSize)])
    const countResults = await queryPromise(count_sql)

    res.send({
      status: 0,
      message: '搜索文章列表成功测试！',
      count: countResults[0]['count(*)'],
      data: data
    })
  } catch (err) {
    res.cc(err)
  }
};

// 文章点赞处理函数
exports.likeArticle = (req, res) => {
  const sql = `update article set like_count = like_count + 1 where id = ?`
  const article_liker_sql = `insert likes(article_id, liker_id, time) values(?, ?, ?)`
  // console.log(req.query)
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
        // console.log(1)
        if (err) return res.cc(err)
        // console.log(2)
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
// 文章评论
exports.commentArticle = (req, res) => {
  const sql = `insert into comment set ?`
  const sql2 = `insert into message set ?`
  var flag = false
  const time = new Date()
  // 评论信息
  const commentInfo = {
    article_id: parseInt(req.body.article_id),
    from_id: parseInt(req.body.from_id),
    time: time,
    content: req.body.content
  }
  // console.log()
  new Promise((resolve, reject) => {
    // 添加评论
    db.query(sql, commentInfo, (err, result) => {
      if (err) return reject(err)
      if (result.affectedRows === 1) flag = true
      resolve(result)
    })
  })
    .then((result) => {
      // 消息信息
      const messageInfo = {
        type: 1,
        time: time,
        message_id: result.insertId,
        status: 0,
        to_id: parseInt(req.body.to_id)
      }
      // 新增消息
      db.query(sql2, messageInfo, (err, results) => {
        if (err) return res.cc(err)
        if (flag) {
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
// 获取文章评论
exports.getArticleComment = (req, res) => {
  // const sql = `select * from comment where article_id = ?`
  // const sql = `SELECT c.article_id, c.content,u.avatar,u.nickname,u.username, c.from_id,c.id comment_id,c.time,r.content reply,r.time reply_time FROM comment c LEFT JOIN reply r ON c.id = r.comment_id and c.article_id = ? LEFT JOIN user u ON c.from_id = u.id `
  const sql = `SELECT c.article_id, c.content,u.avatar,u.nickname,u.username, c.from_id,c.id comment_id,c.time,r.content reply,r.time reply_time FROM comment c LEFT JOIN reply r ON c.id = r.comment_id LEFT JOIN user u ON c.from_id = u.id WHERE c.article_id = ?`
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
      if (result.length === 0) return reject('你没有权限删除此评论!')
      resolve(result)
    })
  })
    .then(() => {
      const deleteSql = `delete m from reply r left join message m on (r.id = m.message_id and m.type=2) where r.comment_id = ?`
      // var flag = false
      const sql = `DELETE c,r,m FROM comment c LEFT JOIN reply r ON r.comment_id = c.id LEFT JOIN message m ON (m.message_id = c.id and m.type=1) WHERE c.id = ?`
      db.query(deleteSql, parseInt(req.body.comment_id), (err, result) => {
        if (err) return res.cc(err)
        else {
          db.query(sql, parseInt(req.body.comment_id), (err, result) => {
            if (err) return res.cc(err)
            // if (result.affectedRows === 0) res.cc('删除评论失败!')
            res.send({
              status: 0,
              message: '删除评论成功!'
            })
          })
        }
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}
// 回复文章评论
exports.replyToComment = (req, res) => {
  var flag = false
  const time = new Date()
  new Promise((resolve, reject) => {
    const sql = `insert into reply set ?`
    // console.log(1)
    const replyInfo = {
      // ...req.body,
      time: time,
      comment_id: parseInt(req.body.comment_id),
      article_id: parseInt(req.body.article_id),
      content: req.body.content
    }
    // console.log(replyInfo)
    db.query(sql, replyInfo, (err, result) => {
      if (err) return reject(err)
      flag = true
      resolve(result)
    })
  })
    .then((result) => {
      // console.log(result.insertId)
      const sql2 = `insert into message set ?`
      // 消息信息
      const messageInfo = {
        type: 2,
        time: time,
        message_id: result.insertId,
        status: 0,
        to_id: parseInt(req.body.to_id)
      }
      db.query(sql2, messageInfo, (err, result) => {
        if (err) return res.cc(err)
        if (flag) {
          res.send({
            status: 0,
            message: '回复评论成功！'
          })
        } else {
          res.send({
            status: 1,
            message: '回复评论失败！'
          })
        }
      })
    })
    .catch((err) => {
      res.cc(err)
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
      data: 'http://120.46.168.254:3007/imgupload/' + filename
    })
  })
}
// 获取消息
exports.getMessage = (req, res) => {
  if (req.query.type == '1') {
    // 获取评论相关的消息列表
    var sql = `select m.*,c.content,u.username,u.nickname,a.title,a.id article_id from message m left join comment c on m.message_id = c.id left join user u on c.from_id = u.id left join article a on a.id = c.article_id where m.type = ? and m.to_id = ? order by m.id`
    var count_sql = `select count(*) from message where to_id = ? and status = 0 and type = ?`
    new Promise((resolve, reject) => {
      db.query(sql, [parseInt(req.query.type), parseInt(req.query.id)], (err, results) => {
        if (err) return reject(err)
        // if (results.affectedRows === 0) return res.cc('发布新文章失败！')
        resolve(results)
      })
    })
      .then((data) => {
        db.query(count_sql, [parseInt(req.query.id), parseInt(req.query.type)], (err, results) => {
          if (err) return res.cc(err)
          res.send({
            status: 0,
            message: '获取评论消息列表成功！',
            count: results[0]['count(*)'],
            data: data
          })
        })
      })
      .catch((err) => {
        res.cc(err)
      })
  } else {
    // 获取回复相关的消息列表
    var sql = `select m.*,r.content,a.title,a.id article_id from reply r left join message m on m.message_id = r.id left join article a on a.id = r.article_id where m.type = ? and m.to_id = ? order by m.id`
    var count_sql = `select count(*) from message where to_id = ? and status = 0 and type = ?`
    new Promise((resolve, reject) => {
      db.query(sql, [parseInt(req.query.type), parseInt(req.query.id)], (err, results) => {
        if (err) return reject(err)
        // if (results.affectedRows === 0) return res.cc('发布新文章失败！')
        resolve(results)
      })
    })
      .then((data) => {
        db.query(count_sql, [parseInt(req.query.id), parseInt(req.query.type)], (err, results) => {
          if (err) return res.cc(err)
          res.send({
            status: 0,
            message: '获取回复评论消息列表成功！',
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
exports.changeMessageStatus = (req, res) => {
  const sql = `update message set status = 1 where id = ?`
  db.query(sql, req.query.id, (err, result) => {
    if (err) return res.cc(err)
    // console.log(result)
    if (result.affectedRows == 1) {
      res.send({
        status: 0,
        message: '修改消息状态成功！'
      })
    }
  })
}
exports.getLikeMessage = (req, res) => {
  var sql = `select a.id article_id, a.title article_title,u.username liker_name,u.nickname liker_nickname,l.time  from likes l left join article a on l.article_id = a.id  left join user u on u.id = l.liker_id  where a.author_id = ? order by l.id`
  var count_sql = `select count(*) from likes l left join article a on (l.article_id = a.id and l.status = 0) left join user u on u.id = l.liker_id  where a.author_id = ? order by l.id`

  new Promise((resolve, reject) => {
    db.query(sql, req.query.id, (err, results) => {
      if (err) return reject(err)
      // if (results.affectedRows === 0) return res.cc('发布新文章失败！')
      resolve(results)
    })
  })
    .then((data) => {
      db.query(count_sql, [parseInt(req.query.id), parseInt(req.query.type)], (err, results) => {
        if (err) return res.cc(err)
        res.send({
          status: 0,
          message: '获取点赞消息成功！',
          count: results[0]['count(*)'],
          data: data
        })
      })
    })
    .catch((err) => {
      res.cc(err)
    })
}
exports.changeLikeStatus = (req, res) => {
  var sql = `update article a left join likes l  on l.article_id = a.id set l.status = 1 where a.author_id = ?`
  // console.log(sql)
  db.query(sql, req.query.id, (err, result) => {
    if (err) return res.cc(err)
    res.send({
      status: 0,
      message: '更新点赞状态成功！'
    })
  })
}
