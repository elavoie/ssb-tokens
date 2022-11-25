var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')
var binUtil = require('./util')
var Decimal = require('decimal.js')

module.exports = function (ssb, args, cb) {
  if (args.help ||
      (args._.length < 4 &&
       !args['tt'] &&
       !args['token-type'] &&
       !args['ow'] &&
       !args['owner'])) {
    var help = path.join(__dirname, '../help/unspent.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var tokenTypes = []
  var owners = []
  var msgId = null

  if (args._.length >= 4)
    var msgId = args._[3] 

  if (args['token-type'] || args['tt'])
    tokenTypes = tokenTypes
      .concat(args['token-type'] || [])
      .concat(args['tt'] || [])

  if (args['owner'] || args['ow'])
    owners = owners
      .concat(args['owner'] || [])
      .concat(args['ow'] || [])

  if (args.help ||
      (tokenTypes.length === 0 &&
       owners.length === 0 &&
       !msgId)) {
    var help = path.join(__dirname, '../help/unspent.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var util = binUtil(ssb)

  function authorName(logId, cb) {
    ssb.about.socialValue({ key: 'name', dest: logId}, cb)
  }

  function format (bal, cb) {
    if (args.json) {
      console.log(JSON.stringify(bal, null, 2))
      console.log()
      return cb(null)
    } else if (args.jsonlines) {
      console.log(JSON.stringify(bal))
      return cb(null)
    } else {
      ssb.tokens.types({ match: { tokenType: bal.tokenType } }, function (err, types) {
        if (err) return cb(err)

        authorName(bal.owner, function (err, ownerName) {
          if (err) return cb(err) 

          var tokName = (Object.values(types)[0] || {}).name
          console.log('@' + ownerName + ' has ' + bal.amount + ' ' + 
                      tokName + ' remaining (tokenType: ' + bal.tokenType + ')')

          if (args.messages) {
            Object.values(bal.unspent).forEach(function (unspent) {
              console.log('  ' + unspent.amount + ' from ' + unspent.id) 
            })
            console.log()
            return cb(null)
          } else if (args.authors) {
            var authors = Object.values(bal.unspent).reduce(function (authors, unspent) {
              var msgValue = bal.all[unspent.id].value
              var amount = unspent.amount
              var author = msgValue.author

              if (!authors[author])
                authors[author] = 0

              authors[author] += amount
              return authors
            }, {})

            pull(
              pull.values(Object.keys(authors)),
              pull.asyncMap(function (logId, cb) { 
                authorName(logId, function (err, name) {
                  if (err) return cb(err) 

                  console.log('  ' + authors[logId] + ' from @' + name)
                  return cb(null)
                })
              }),
              pull.onEnd(function (err) {
                if (err) return cb(err)

                console.log()
                return cb(null)
              })
            )
          } else {
            return cb(null)
          }
        })
      })
    }
  }

  if (msgId) {
    ssb.tokens.owner(msgId, function (err, owner) {
      if (err) return cb(err)

      ssb.tokens.unspent(msgId, owner, function (err, unspent, msg) {
        if (err) return cb(err)

        var op = msg.value.content
        ssb.tokens.types({ match: { tokenType: op.tokenType } }, 
          function (err, types) {
          if (err) return cb(err)

          authorName(owner, function (err, ownerName) {
            if (err) return cb(err) 

            var tokName = (Object.values(types)[0] || {}).name
            console.log('@' + ownerName + ' has ' + unspent.toString() + ' ' + 
                        tokName + ' remaining from ' + msgId.slice(0,5) +
                        '... (tokenType: ' + op.tokenType + ')')

            cb(null)
          })
        })
      })
    })
  } else if (tokenTypes.length === 0) {
    return cb(new Error("Unimplemented listing of all token types for a given owner"))
  } else if (owners.length === 0) {
    pull(
      pull.values(tokenTypes),
      pull.asyncMap(function (tt,cb) { 
        ssb.tokens.identities.list({ tokenType: tt}, function (err, owners) {
          if (err) return cb(err)

          pull(
            pull.values(owners),
            pull.asyncMap(util.getLogId),
            pull.asyncMap(function (owner, cb) {
              ssb.tokens.balance(tt, owner, cb)
            }),
            pull.asyncMap(format),
            pull.onEnd(cb)
          )
        })
      }),
      pull.onEnd(cb)
    )
  } else { 
    pull(
      pull.values(owners),
      pull.asyncMap(util.getLogId),
      pull.asyncMap(function (owner, cb) {
        pull(
          pull.values(tokenTypes),
          pull.asyncMap(function (tt, cb) {
            ssb.tokens.balance(tt, owner, cb) 
          }),
          pull.asyncMap(format),
          pull.onEnd(cb)
        )
      }),
      pull.onEnd(cb)
    )
  }
}
