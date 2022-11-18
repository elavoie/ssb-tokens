var fs = require('fs')
var path = require('path')
var ref = require('ssb-ref')
var pull = require('pull-stream')

module.exports = function give (ssb, args, cb) {
  if (args._.length < 4 || args.help) {
    var help = path.join(__dirname, '../help/burn.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var options = {
    author: args.author,
    description: args.description,
    publish: typeof args.publish === "boolean" ? args.publish : true
  }

  var params = args._.slice(3)
  var sources = params.map(function (p) { return { id: p } })

  var binUtil = require('./util')(ssb)
  binUtil.getLogId(options.author, function (err, author) {
    if (err) return cb(err)

    options.author = author

    ssb.tokens.burn(sources, options, function (err, msg) {
      if (err) return cb(err) 

      if (args['only-id']) {
        console.log(msg.key)
        return cb(null)
      } else if (args.json || !options.publish) {
        console.log(JSON.stringify(msg, null, 2))
        return cb(null)
      } else {
        binUtil.stringify(msg.key, { alias: true }, function (err, str) {
          if (err) return cb(err) 

          console.log(msg.key + ": ")
          console.log(str)
          return cb(null)
        })
      }
    })
  })
}
