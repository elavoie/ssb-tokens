var path = require('path')
var fs = require('fs')
var ref = require('ssb-ref')
var pull = require('pull-stream')
var binUtil = require('./util')
var Decimal = require('decimal.js')
var ZEROD = Decimal(0)

function sum (a,b) {
  return a+b
}

function sumd (a,b) {
  return Decimal(a).add(Decimal(b))
}

function unique (s, x) {
  s[x[0]] = (s[x[0]] || ZEROD).add(x[1])
  return s
}

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

  if (args['token-type'] || args['tt'])
    tokenTypes = tokenTypes
      .concat(args['token-type'] || [])
      .concat(args['tt'] || [])

  if (args['owner'] || args['ow'])
    owners = owners
      .concat(args['owner'] || [])
      .concat(args['ow'] || [])


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
          console.log('@' + ownerName + ' owns ' + bal.amount.toString() + ' ' + tokName + ' (tokenType: ' + bal.tokenType + ')')
          
          var amount = function (id) { return bal.all[id].value.content.amount }
          var giver = function (id) { 
            return [bal.all[id].value.author, amount(id)] 
          }
          var receiver = function (id) { 
            return [bal.all[id].value.content.receiver, amount(id)] 
          }

          var created = bal.created.map(amount).reduce(sumd,ZEROD)
          var burnt = bal.burnt.map(amount).reduce(sumd,ZEROD)

          var givers = bal.received.map(giver).reduce(unique, {})
          var receivers = bal.given.map(receiver).reduce(unique, {})

          var names = {}

          pull(
            pull.values(Object.keys(givers).concat(Object.keys(receivers))),
            pull.unique(),
            pull.asyncMap(function (id, cb) {
              authorName(id, function (err, name) {
                if (err) cb(err)
                names[id] = name || id
                return cb(null)
              })
            }),
            pull.onEnd(function (err) {
              if (err) return cb(err)

              givers = Object.keys(givers).map((id) => ['@' + names[id], givers[id]])
              receivers = Object.keys(receivers).map((id) => ['@' + names[id], receivers[id]])

              console.log('    created ' + created.toString())
              console.log('    received ' +
                               (givers.length ? 
                                 givers.map((x) => x[1].toString() + ' from ' + x[0]).join(', ') : 
                                 '0'))
              console.log('    gave ' + 
                               (receivers.length ? 
                                 receivers.map((x) => x[1].toString() + ' to ' + x[0]).join(', ') :
                                 '0'))
              console.log('    burnt ' + burnt.toString())
              console.log()
              
              return cb(null)
            })
          )
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
