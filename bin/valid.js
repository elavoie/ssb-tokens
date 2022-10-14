var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')
var binUtil = require('./util')

module.exports = function (ssb, args, cb) {
  if (args.help || args._.length < 4) {
    var help = path.join(__dirname, '../help/valid.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var msgId = args._[3]

  if (!ref.isMsgId(msgId)) 
    return cb(new Error("Invalid message ID " + JSON.stringify(msgId)))

  ssb.get({ id: msgId, meta: true}, function (err, msg) {
    if (err) return cb(err)

    ssb.tokens.valid(msg, function (err, msg) {
      if (err) return cb(err)

      console.log('valid')
      return cb(null)
    })
  })
}
