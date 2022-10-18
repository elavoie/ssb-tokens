var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var binUtil = require('./util')
var home = require('os-homedir')
var keys = require('ssb-keys')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../help/init.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var ssbTokensPath = args._[3] || path.join(home(), '.ssb-tokens')
  if (fs.existsSync(ssbTokensPath)) {
    console.log(ssbTokensPath + " already exists.")
    return cb(null)
  }

  keys.loadOrCreateSync(path.join(ssbTokensPath, 'secret'))
  console.log('created local database in ' + ssbTokensPath)

  return cb(null)
}
