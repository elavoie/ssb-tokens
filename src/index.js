var ref = require('ssb-ref')

function create (ssb)  {
  return function create (number, currency, options, cb) {
    function done (err, ssbMsg) {
      if (err) return cb(err)
      var msg = ssbMsg.value.content
      msg.id = ssbMsg.key
      msg.owner = ssbMsg.value.author 
      cb(null, msg)
    }

    cb = cb || options
    if (typeof cb !== 'function') {
      throw new Error("tokens.create: Invalid callback of type '" + (typeof cb) + "'")
    }
    if (typeof number !== 'number') {
      return cb(new Error("tokens.create: Invalid number of tokens '" + number + "'"))
    }
    if (typeof currency !== 'string') {
      return cb(new Error("tokens.create: Invalid currency string '" + currency + "'"))
    }
    if (currency.length > 30) {
      return cb(new Error("tokens.create: Currency should be at most 30 characters long"))
    }

    if (typeof options === 'function') {
      options = {}
    }

    // Options and defaults
    options.owner = options.owner || null
    if (options.owner && !ssb.identities) {
      return cb(new Error('Install ssb.identities (https://github.com/ssbc/ssb-identities) in ssb-server to specify another owner.'))
    }

    options.description = options.description || null
    if (options.description && !ref.isLink(options.description)) {
      return cb(new Error("tokens.create: Invalid description, expected SSB Message ID instead of '" + options.description + "'")) 
    }

    options['smallest-unit'] = options['smallest-unit'] || 0.01
    var result = number/options['smallest-unit']
    if (result !== Math.round(result)) {
      return cb(new Error("tokens.create: Invalid number and smallest-unit combination, number '" + number + "' should be exactly divisible by '" + options['smallest-unit']) + "'")
    }

    var msg = {
      type: 'tokens/' + meta['api-version'] + '/create',
      number: number,
      currency: currency,
      description: options.description,
      'smallest-unit': options['smallest-unit']
    }

    if (!options.owner) {
      ssb.publish(msg, done)
    } else {
      ssb.identities.publishAs({ 
        id: options.owner,
        content: msg,
        private: false
      }, done)
    }
  }
}

var meta = {
  name: "tokens",
  version: "0.1.0",
  "api-version": "J9oN",
  manifest: {
    burn: 'async',
    create: 'async', 
    flag: 'async',
    give: 'async',
    help: 'sync',
    list: 'async',
    trace: 'async',
    unflag: 'async'
  },
  init: function (ssb, config) {
    return {
      burn: function (cb) { return cb(null)  },
      create: create(ssb),
      flag: function (cb) { return cb(null)  },
      give: function (cb) { return cb(null)  },
      help: function () { return { description: 'Tokens for community economics.', commands: {} } }, 
      list: function (cb) { return cb(null)  },
      trace: function (cb) { return cb(null)  },
      unflag: function (cb) { return cb(null)  }
    }
  }
}


module.exports = meta
