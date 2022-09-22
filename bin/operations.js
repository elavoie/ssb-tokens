var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')
var humane = require('./humane')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../help/types.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var options = {
    match: {

    }
  }


  // Matching
  if (args.au || args.author) 
    options.match.author = args.au || args.author
  if (args.pt || args.participant) 
    options.match.participant = args.pt || args.participant
  if (args.rc || args.receiver)
    options.match.receiver = args.rc || args.receiver
  if (args.tt || args['token-type'])
    options.match.tokenType = args.tt || args['token-type']

  if (args.ot || args['operation-type']) {
    operations = { }
    var ot = args.ot || args['operation-type']
    var types = { 
      create: true,
      give: true,
      burn: true
    }
    if (Array.prototype.isPrototypeOf(ot)) {
      for (var i = 0; i < ot.length; ++i) {
        var t = ot[i]
        if (!types[t]) return cb(new Error("Invalid operation-type " + t +
                                           ", expected one of " + Object.keys(types)))
        operations[t] = true
      }
    } else {
      var t = ot
      if (!types[t]) return cb(new Error("Invalid operation-type " + t +
                                          ", expected one of " + Object.keys(types)))
      operations[t] = true
    }

    options.match.operations = operations
  }

  options.valid = args.valid !== false
  options.invalid = !!args.invalid
  options.live = !!args.live
  options.old = args.old !== false
  options.debug = args.debug

  var binUtil = require('./util')(ssb)
  var done = false
  var authorDone = false
  var receiverDone = false
  var participantDone = false

  var format = null
  if (args.json) {
    format = pull.collect(function (err, _msgs) {
      if (err) return cb(err)
      var msgs = {}
      _msgs.forEach(function (msg) {
        msgs[msg.key] = msg
      })
      console.log(JSON.stringify(msgs, null, 2))
      return cb(null, msgs)
    })
  } else if (args['only-id']) {
    format = pull(
      pull.map((msg) => msg.key),
      pull.drain(console.log, cb)
    )
  } else if (args.jsonlines) {
    format = pull(
      pull.map((msg) => JSON.stringify(msg)),
      pull.drain(console.log, cb)
    )
  } else {
    format = pull(
      pull.asyncMap(function (msg, cb) {
        humane(ssb, msg, {}, function (err, s) {
          if (err) return cb(err)
          return cb(null, msg.key + ": " + s)
        })  
      }),
      pull.drain(console.log, cb)
    )
  }

  function ready () {
    if (authorDone && receiverDone && participantDone)
      pull(
        ssb.tokens.operations(options, null),
        format
      )
  }

  pull(
    pull.values([].concat(options.match.author || [])),
    pull.asyncMap(binUtil.getLogId),
    pull.collect(function (err, authors) {
      if (!done && err) return cb(done=err)
      if (options.match.author) options.match.author = authors
      authorDone = true
      ready()
    })
  )

  pull(
    pull.values([].concat(options.match.receiver || [])),
    pull.asyncMap(binUtil.getLogId),
    pull.collect(function (err, receivers) {
      if (!done && err) return cb(done=err)
      if (options.match.receiver) options.match.receiver = receivers
      receiverDone = true
      ready()
    })
  )

  pull(
    pull.values([].concat(options.match.participant || [])),
    pull.asyncMap(binUtil.getLogId),
    pull.collect(function (err, participants) {
      if (!done && err) return cb(done=err)
      if (options.match.participant) options.match.participant = participants
      participantDone = true
      ready()
    })
  )
}

