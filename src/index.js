var ref = require('ssb-ref')

// All functions that implement the [API](../doc/api.md) are of the form:
//
//   constructor (ssb, state) -> op(args..., cb)
//
// A "constructor" function wraps the state
// required to communicate with an SSB server,
// as well as any state shared between operations,
// and returns a function that implements the API.


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

    if (typeof options !== 'object' ) {
      return cb(new Error("tokens.create: Invalid options, expected an {} instead of '" + options + "'."))
    }

    // Options and defaults
    options.owner = options.owner || null
    if (options.owner) {
      if (!ref.isFeed(options.owner)) {
        return cb(new Error("tokens.give: Invalid options.owner, expected SSB Log ID instead of '" + options.owner + "'."))
      }
      if (!ssb.identities) {
        return cb(new Error('Install ssb.identities (https://github.com/ssbc/ssb-identities) in ssb-server to specify another owner.'))
      }
    }

    options.description = options.description || null
    if (options.description && !ref.isLink(options.description)) {
      return cb(new Error("tokens.create: Invalid description, expected SSB Message ID instead of '" + options.description + "'.")) 
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

function give (ssb)  {
  return function give (tokens, recipient, options, cb) {
    function done (err, ssbMsg) {
      if (err) return cb(err)
      var msg = ssbMsg.value.content
      msg.id = ssbMsg.key
      msg.owner = ssbMsg.value.author 
      cb(null, msg)
    }

    cb = cb || options
    if (typeof cb !== 'function') {
      throw new Error("tokens.give: Invalid callback of type '" + (typeof cb) + "'.")
    }
    // Type and Syntactic Validation
    if (typeof tokens === 'string') {
      if (!ref.isLink(tokens)) {
        return cb(new Error("tokens.give: Invalid tokens reference, expected SSB Message ID instead of '" + tokens 
                            + "'."))   
      }
    } else if (Array.prototype.isPrototypeOf(tokens) && tokens.length > 0) {
      var list = tokens
      for (var i = 0; i < list.length; ++i) {
        var pair = list[0]
        if (!Array.prototype.isPrototypeOf(pair) ||
             pair.length !== 2 ||
             typeof pair[0] !== 'number' ||
             typeof pair[1] !== 'string' ||
             !ref.isLink(pair[1])) {
          return cb(new Error("tokens.give: Invalid pair, expected [number, SSB_MESSAGE_ID] instead of '" 
                              + pair + "'."))   
        }
      }
    } else if (typeof tokens !== 'number' && tokens !== null) {
      return cb(new Error("tokens.give: Invalid tokens '" + tokens + "'. See API for a list of valid types."))
    }

    if (typeof recipient !== 'string' && !ref.isFeed(recipient)) {
      return cb(new Error("tokens.give: Invalid recipient, expected a SSB Log ID instead of '" + recipient + "'."))
    }

    if (typeof options === 'function') {
      options = {}
    }
    
    if (typeof options !== 'object' ) {
      return cb(new Error("tokens.give: Invalid options, expected an {} instead of '" + options + "'."))
    }

    options.owner = options.owner || null
    if (options.owner) {
      if (!ref.isFeed(options.owner)) {
        return cb(new Error("tokens.give: Invalid options.owner, expected SSB Log ID instead of '" + options.owner + "'."))
      }
      if (!ssb.identities) {
        return cb(new Error('Install ssb.identities (https://github.com/ssbc/ssb-identities) in ssb-server to specify another owner.'))
      }
    }

    options.currency = options.currency || null
    if (options.currency && typeof options.currency !== 'string') {
      return cb(new Error("tokens.give: Invalid options.currency, expected string instead of '" + options.currency + "'.")) 
    }

    options['root-description'] = options['root-description'] || null
    if (options['root-description'] && !ref.isLink(options['root-description'])) {
      return cb(new Error("tokens.give: Invalid options['root-description'], expected SSB Message ID instead of '" + options['root-description'] + "'.")) 
    }

    // Automatically Matching Previous Operations

    // Semantic Validation

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
