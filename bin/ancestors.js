var path = require('path')
var fs = require('fs')
var pull = require('pull-stream')

module.exports = function (ssb, args, cb) {
  if (args._.length < 4 || args.help) {
    var help = path.join(__dirname, '../help/ancestors.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var msgId = args._[3]
  var options = {
    json: typeof args.json === 'undefined' ? true : args.json,
    jsonlines: args.jsonlines,
    dot: args.dot
  }
  var prefixSize = Number(args['prefix-size']) || 5

  ssb.tokens.ancestors([ { id: msgId } ], function (err, tangle) {
    var missing = null
    if (err) {
      if (!err.notFound) return cb(err)
      else missing = err.sources 
    }

    if (missing) console.error("Locally missing sources " + JSON.stringify(missing))

    // Topological sort of keys
    var keys = Object.keys(tangle)
    keys.sort(function (k1, k2) {
      if (tangle[k1][k2]) return 1
      else if (tangle[k2][k1]) return -1
      else return 0
    })

    var sorted = {}
    keys.forEach(function (k) {
      sorted[k] = tangle[k]
    })

    function prefix(key) {
      if (!args['full-id'] &&  prefixSize < (key.length + 1))
        return key.slice(0,prefixSize+1)
      else
        return key
    }

    var util = require('./util')(ssb)

    if (args['graph-easy']) {
      pull(
        pull.values(keys),
        pull.drain(function (k) {
          if (Object.keys(tangle[k]).length > 0) 
            Object.keys(tangle[k]).forEach(function (k2) {
              var label = tangle[k][k2] || 'source'
              console.log("[" + prefix(k) + "] - " + label + " -> " + "[ " + prefix(k2) + "]")
            })
        }, cb)
      )
    } else if (args['json-tangle']) {
      var output = {}
      keys.forEach(function (k) {
        if (Object.keys(tangle[k]).length > 0)
          output[k] = tangle[k]
      })
      console.log(output)
    } else if (args.json) {
      pull(
        pull.values(keys),
        pull.asyncMap((msgId,cb) => ssb.get({ id: msgId, meta: true}, cb)),
        pull.collect(function (err, msgs) {
          var output = {}
          msgs.forEach(function (msg) {
            output[msg.key] = msg
          })
          console.log(JSON.stringify(output, null, 2))
        })
      )
    } else if (args.jsonlines) {
      pull(
        pull.values(keys),
        pull.asyncMap((msgId,cb) => ssb.get({ id: msgId, meta: true}, cb)),
        pull.drain((msg) => console.log(JSON.stringify(msg)), cb)
      )
    } else {
      pull(
        pull.values(keys),
        pull.asyncMap((k, cb) => util.stringify(k, (err, str) => {
          if (err) cb(err)
          else cb(null, prefix(k) + ": " + str) 
        }) ),
        pull.drain(console.log, cb)
      )
    }
  })
}
