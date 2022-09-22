var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var binUtil = require('../util')
var pull = require('pull-stream')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../../help/identities/alias.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var options = {
    name: args.name || args._[4],
    id: args.id  || args._[5],
    author: args.author
  }

  pull(
    pull.values([options.author]),
    pull.asyncMap(function (author, cb) {
      if (!author) 
        return ssb.whoami(function (err, main) {
          if (err) return cb(err)
          else return cb(null, main.id)
        })
      else return cb(null, author)
    }),
    pull.asyncMap(function (author, cb) {
      var authorName = author
      if (authorName[0] !== '@')
        authorName = "@" + authorName

      binUtil(ssb).getLogId(author, function (err, logId) {

        options.author = logId || author

        ssb.tokens.identities.alias(options, function (err, msg) {
          if (err) return cb(err)

          var author = args.author === msg.value.author ?
                      msg.value.author :
                      authorName
          
          console.log('author ' + authorName + 
                      ' associated name ' + msg.value.content.name + 
                      ' to id ' + msg.value.content.about)
          return cb(null)
        })
      })
    }),
    pull.onEnd(cb)
  )
}
