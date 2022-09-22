var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')

module.exports = function (ssb, args, cb) {
  if (args._.length < 3 || args.help) {
    var help = path.join(__dirname, '../help/types.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var options = {
    match: {

    }
  }
  if (args._.length >= 3)
    options.match.name = args._[3]

  // Matching
  if (args.au || args.author) 
    options.match.author = args.au || args.author
  if (args.dm || args.decimals) 
    options.match.decimals = args.dm || args.decimals
  if (args.dp || args.description) 
    options.match.description = args.dp || args.description
  if (args.nm || args.name) 
    options.match.name = args.nm || args.name
  if (args.un || args.unit) 
    options.match.unit = args.un || args.unit
  if (args.tt || args['token-type'])
    options.match.tokenType = args.tt || args['token-type']

  // Output
  args.single = args.s || args.single
  args.properties = !args.t && args.properties

  var binUtil = require('./util')(ssb)

  binUtil.getLogId(options.match.author, function (err, logId) {
    if (err) return cb(err)

    if (logId)
      options.match.author = logId

    ssb.tokens.types(options, function (err, types) {
      if (err) return cb(err)

      if (args.single && Object.keys(types).length !== 1)
        return cb(new Error("Non-unique match, found " +
                            Object.keys(types).length + 
                            " results"))

      pull(
        pull.values(types),
        pull.asyncMap(function (tok, cb) {
          ssb.about.socialValue(
            { key: 'name', dest: tok.author}, function (err, name) {
              tok.author = { 
                id: tok.author
              }

              if (err || !name) return cb(null, tok)

              tok.author.name = name
              return cb(null, tok)
            }
          )
        }),
        pull.onEnd(function (err) {
          if (typeof args.properties !== "undefined" && !args.properties)
            console.log(Object.keys(types).join("\n"))
          else if (args.csv) {
            if (typeof args['csv-header'] === "undefined" || 
                args['csv-header'])
              console.log('tokenType,author-id,author-name,decimals,description,name,unit')
            Object.keys(types).forEach((tokenType) => {
              var tok = types[tokenType]
              console.log([
                tokenType,
                tok.author.id,
                tok.author.name,
                tok.decimals,
                tok.description,
                tok.name,
                tok.unit
              ].join(","))
            })
          } else if (args['only-type'] ||
            (typeof args.properties !== "undefined" && !args.properties))
            console.log(Object.keys(types).join("\n"))
          else
            console.log(types)
          return cb(null)

        })
      )
    })
  })
}
