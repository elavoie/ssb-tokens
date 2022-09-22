var path = require('path')
var fs = require('fs')
var pull = require('pull-stream')

module.exports = function (ssb, args, cb) {
  if (args.help) {
    var help = path.join(__dirname, '../../help/identities/list.txt')
    process.stdout.write(fs.readFileSync(help))
    return cb(null)
  }

  args['alias-prefix'] = args['alias-prefix'] || ''
  
  var opts = {
    own: args.own,
    tokenType: args.tt || args['token-type'],
    used: args.used
  }

  args.alias = args.alias !== false

  ssb.tokens.identities.list(opts, function (err, ids) {
    if (args.alias || args['alias-prefix']) {
      if (typeof args['alias-prefix'] !== "string")
        return cb(new Error("Invalid alias-prefix " + args["alias-prefix"] +
                            ", expected a string"))

      list = pull(
        pull.values(ids),
        pull.asyncMap(function (id, cb) {
          ssb.about.socialValue(
            { key: 'name', dest: id }, 
            (err, value) => {
              if (err) return cb(err)
              else if (!value) 
                return cb(null, { id: id, name: value })
              else if (args['alias-prefix'] && !value.startsWith(args['alias-prefix']))
                return cb(null, null)
              else return cb(null, { id: id, name: value })
            })
        }),
        pull.filter((obj) => obj !== null)
      )
    } else {
      list = pull(pull.values(ids), pull.map((id) => ({ id: id })))
    }

    var print = null
    if (args['only-id']) {
      print = pull.drain((obj) => console.log(obj.id), cb) 
    } else if (args.csv) {
      print = pull.drain((obj) => console.log((obj.name ? [obj.id, obj.name] : [obj.id]).join(',')), cb)
    } else if (typeof args.json === "undefined" || args.json) {
      print = pull.drain((obj) => console.log(JSON.stringify(obj)), cb) 
    } else {
      return cb(new Error("Invalid printing option"))
    }

    pull(list, print)
  })
}
