var fs = require('fs')
var path = require('path')

module.exports = function (ssb, args, cb) {
  if (args._.length < 4 || args.help) {
    var help = path.join(__dirname, '../help/show.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var msgId = args._[3]
  var options = {
    "alias": args.alias,
    "cache": args.cache,
    "json": args.json,
    "ssb-message": args["ssb-message"],
    "ssb-message-value": args["ssb-message-value"],
    "validate": args.validate
  }

  require('./util')(ssb).stringify(msgId, options, function (err, str) {
    if (err) return cb(err)
    console.log(str)
    return cb(null)
  })
}
