var path = require('path')
var fs = require('fs')

module.exports = function (ssb, args, cb) {
  if (args._.length < 5 || args.help) {
    var help = path.join(__dirname, '../../help/identities/follow.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var author = args.author
  var followee = args._[4]

  var binUtil = require('../util')(ssb)
  binUtil.getLogId(author, function (err, author) {
    if (err) return cb(err)

    binUtil.getLogId(followee, function (err, followee) {
      if (err) return cb(err)

      content = {
        type: 'contact',
        contact: followee,
        following: true
      }

      function print (err, msg) {
        if (err) return cb(err)

        console.log(JSON.stringify(msg, null, 2))
        return cb(null)
      }

      if (author) 
        ssb.identities.publishAs({
          id: author,
          content: content,
          private: false
        }, print)
      else 
        ssb.publish(content, print)
    })
  })
}
