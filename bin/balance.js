var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')
var binUtil = require('./util')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../help/balance.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  var tokenTypes = []
  var owners = []

  if (args._.length >= 4)
    tokenTypes.push(args._[3])

  if (args._.length >= 5)
    owners.push(args._[4])

  if (args['token-type'])
    tokenTypes = tokenTypes.concat(args['token-type'])

  if (args['owner'])
    owners = owners.concat(args['owner'])


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
          console.log('@' + ownerName + ' owns ' + bal.amount + ' ' + tokName + ' (tokenType: ' + bal.tokenType + ')')

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

  if (tokenTypes.length === 0) {
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
