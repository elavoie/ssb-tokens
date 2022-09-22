var path = require('path')
var fs = require('fs')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../../help/identities/create.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  if (args.alias && typeof args.alias !== "string")
    return cb(new Error("Invalid alias " + args.alias + 
                        ", expected a string"))

  ssb.tokens.identities.create(args, function (err, author) {
    if (err) return cb(err)

    console.log('created identity ' + author.id + ' ' + 
                (author.name ? ' with alias ' + author.name : ''))

    return cb(null, author)
  })
}
