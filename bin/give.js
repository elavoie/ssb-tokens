var fs = require('fs')
var path = require('path')
var ref = require('ssb-ref')
var pull = require('pull-stream')

module.exports = function give (ssb, args, cb) {
  if (args._.length < 5 || args.help) {
    var help = path.join(__dirname, '../help/give.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var params = args._.slice(3)
  var receiver = params.pop()

  if (params.length % 2 !== 0)
    return cb(new Error("Insufficient number of arguments" +
                        ", expected multiples of <number> <tokens>"))

  var sources = []
  for (var i = 0; i < params.length; i=i+2) {
    sources.push({
      amount: params[i],
      token: params[i+1]
    })
  }

  pull(
    pull.values(sources),
    pull.asyncMap((s, cb) => {
      if (ref.isMsgId(s.token)) {
        s.id = s.token
        return cb(null, s)
      } else {
        ssb.tokens.types({ match: { tokenType: s.token } }, function (err, types) {
          if (err) return cb(err)

          var keys = Object.keys(types)
          if (keys.length === 1) {
            s.tokenType = keys[0]
            return cb(null, s)
          } else if (keys.length > 1) {
            return cb(new Error("Internal error, should not match more than one token type"))
          } else {
            ssb.tokens.types({ match: { name: s.token } }, function (err, types) {
              var keys = Object.keys(types)
              if (keys.length === 1) {
                s.tokenType = keys[0]
                return cb(null, s)
              } else if (keys.length > 1) {
                return cb(new Error("Ambiguous name " + JSON.stringify(s.token) + 
                                    ", matches more than one token type: " + keys))
              } else {
                return cb(new Error("No token type found for name " + s.token))
              }
            })
          }
        })
      }
    }),
    pull.collect((err, sources) => {
      if (err) return cb(err)

      var options = {
        author: args.author, 
        sources: sources,
        receiver: receiver,
        publish: typeof args.publish === "boolean" ? args.publish : true
      }

      var binUtil = require('./util')(ssb)

      binUtil.getLogId(options.author, function (err, author) {
        if (err) return cb(err)

        options.author = author

        binUtil.getLogId(receiver, function (err, receiver) {
          if (err) return cb(err)

          ssb.tokens.give(sources, receiver, options, function (err, msg) {
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
      })
    })
  )
}
