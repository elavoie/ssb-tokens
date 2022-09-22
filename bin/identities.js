var fs = require('fs')
var path = require('path')

module.exports = function (ssb, args, cb) {
  if (args._.length < 4 || args._[3] === "help" || 
      (args._.length === 3 && args.help)) {
    var help = path.join(__dirname, '../help/identities.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var cmd = args._[3]

  var supported = {
    alias: true,
    create: true,
    follow: true,
    list: true
  }

  if (!supported[cmd]) {
    return cb(new Error("ssb-tokens identities: invalid command '" + cmd + "'"))
  } else {
    require('./identities/' + cmd)(ssb, args, function (err) {
      if (err) return cb(err)
      return cb(null)
    })
  } 
}
