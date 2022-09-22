var fs = require('fs')
var path = require('path')

module.exports = function create (ssb, args, cb) {
  if (args._.length < 5 || args.help) {
    var help = path.join(__dirname, '../help/create.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var options = {
    author: args.author, 
    description: args.description,
    decimals: args.decimals,
    name: args._[4],
    unit: args.unit
  }

  var binUtil = require('./util')(ssb)
  binUtil.getLogId(options.author, function (err, author) {
    if (err) return cb(err)
    
    options.author = author

    ssb.tokens.create(args._[3], options, function (err, msg) {
      if (err) return cb(err) 

      if (args['only-id']) {
        console.log(msg.key)
        return cb(null)
      } else if (args.json) {
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
