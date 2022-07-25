var ref = require('ssb-ref')
var pull = require('pull-stream')
var util = require('util')
var crypto = require('crypto')
var pull = require('pull-stream')
var debug = require('debug')
var ref = require('ssb-ref')

var log = debug('ssb-tokens')

var sum = (a,b) => a+b

function isCreate (op) {
  return op.type === createType 
}

function isGive (op) {
  return op.type === giveType 
}

function isBurn (op) {
  return op.type === burnType
}

function isFlag (op) {
  return op.type === flagType
}

function isUnflag (op) {
  return op.type === unflagType
}

function isOp (op) {
  return isCreate(op) || isGive(op) || isBurn(op)
}

// **************************** formatOp (msg) ***************************
// Check that `msg` correctly follows the expected operation format for each
// operation type, synchronously. If format is incorrect, returns an
// error with the first format check failed. If format is correct, returns
// null.

function formatCreate (msg) {
  var op = msg.value.content 

  if (typeof op.amount !== "number") 
    return new Error("Invalid amount '" + op.amount + "', should be a number")

  if (typeof op.currency !== "string") 
    return new Error("Invalid currency '" + op.currency + "', should be a string")

  if (typeof op.description !== "string" && op.description !== null)
    return new Error("Invalid description '" + op.description + "', should be an SSB_MSG_ID or null")

  if (typeof op["smallest-unit"] !== "number")
    return new Error("Invalid smallest-unit '" + op["smallest-unit"] + "', should be a number")

  if (typeof op["token-hash"] !== "string")
    return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

  return null
}

function formatGive (msg) {
  var op = msg.value.content
  
  if (typeof op["token-hash"] !== "string")
    return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

  if (!Array.prototype.isPrototypeOf(op.source))
    return new Error("Invalid source '" + JSON.stringify(op.source) + "', should be an array")

  //  The sum of the amounts of give.source.source(s) is equal
  //  to the give.source.amount
  var total = 0
  for (var i = 0; i < op.source.length; ++i) {
    var s = op.source[i]
    if (typeof s !== "object") 
      return new Error("Invalid source[" + i + "]: '" + JSON.stringify(s) + "', should be an object")

    if (typeof s.amount !== "number")
      return new Error("Invalid source[" + i + "].amount '" + s.amount + "', should be a number")

    if (!ref.isMsgId(s.id))
      return new Error("Invalid source[" + i + "].id '" + s.id + "', should be an SSB_MSG_ID")

    total += s.amount
  }
  if (op.amount !== total) 
    return new Error("Invalid amount " + op.amount + ", inconsistent with total from sources (" + total + ")")

  if (!ref.isFeed(s.recipient))
    return new Error("Invalid recipient " + op.recipient + ", should be an SSB_LOG_ID")

  return null
}

function formatBurn (msg) {
  var op = msg.value.content

  if (typeof op["token-hash"] !== "string")
    return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

  if (!Array.prototype.isPrototypeOf(op.source))
    return new Error("Invalid source '" + JSON.stringify(op.source) + "', should be an array")

  for (var i = 0; i < op.source.length; ++i) {
    var s = op.source[i]
    if (typeof s !== "string") 
      return new Error("Invalid source[" + i + "]: '" + JSON.stringify(s) + "', should be a string")
  }

  return null
}

function formatFlag (msg) {
  throw new Error("Unimplemented")
}

function formatUnflag (msg) {
  throw new Error("Unimplemented")
}

function format (ssb, api) {
  function checkFormat (msg) {
    var op = msg.value.content
    if (isCreate(op)) return formatCreate(msg)
    else if (isGive(op)) return formatGive(msg)
    else if (isBurn(op)) return formatBurn(msg)
    else if (isFlag(op)) return formatFlag(msg)
    else if (isUnflag(op)) return formatUnflag(msg)
    else new Error("Invalid ssb-tokens operation with type '" + op.type + "')")
  }

  checkFormat.create = formatCreate
  checkFormat.give = formatGive
  checkFormat.burn = formatBurn
  checkFormat.flag = formatFlag
  checkFormat.unflag = formatUnflag

  return checkFormat
}


function requirements (ssb, api) {

  // **************************** reqCreate (msg, cb(err, msg)) ****************
  // Check that `msg` requirements for <op> are satisfied, asynchronously. If 
  // all requirements are satisfied, invoke `cb(null, msg)`. Otherwise, invoke
  // `cb(err, msg)` where `err` is the first requirement error encountered.

  function reqCreate (msg, cb) {

  }

  function reqGive (msg, cb) {

  }

  function reqBurn (msg, cb) {

  }

  function reqFlag (msg, cb) {

  }

  function reqUnflag (msg, cb) {

  }

  function checkReq (msg, cb) {
    var op = msg.value.content

    if (isCreate(op)) return reqCreate(msg, cb)
    else if (isGive(op)) return reqGive(msg, cb)
    else if (isBurn(op)) return reqBurn(msg, cb)
    else if (isFlag(op)) return reqFlag(msg, cb)
    else if (isUnflag(op)) return reqUnflag(msg, cb)
    else return cb(new Error("Requirements: Invalid ssb-tokens operation " + 
                             "with type '" + op.type + "'"))
  }

  checkReq.create = reqCreate 
  checkReq.give = reqGive 
  checkReq.burn = reqBurn 
  checkReq.flag = reqFlag 
  checkReq.unflag = reqUnflag 

  return checkReq
}




function tokenProperties (ssb, tokenHash, cb) {
  pull(
    ssb.query.read({ 
      query: [{ "$filter": { value: { content: { type: createType, "token-hash": tokenHash } } } }],
      limit: 1
    }),
    pull.collect( (err, ary) => {
      if (err) cb(err)
      else {
        if (ary.length < 1) {
          cb(new Error("Token hash '" + tokenHash + "' not found."))
        } else {
          var tok = ary[0].value.content
          cb(null, { 
            currency: tok.currency,
            description: tok.description,
            "smallest-unit": tok["smallest-unit"],
            "token-hash": tok["token-hash"]
          })
        }
      }
    } )
  )
}

function consistentTokenHashes (ssb, source, cb) {
  log('consistentTokenHashes')
  var hashes = { }
  pull(
    pull.values(source),
    pull.asyncMap((s, cb) => {
      if (s.id) ssb.get({ id: s.id, meta: true }, (err, msg) => {
        if (err) cb(err)
        else if (!isOp(msg.value.content)) cb(new Error("Invalid ssb-tokens operation id " + msg.key))
        else cb(null, { hash: msg.value.content['token-hash'], value: 'id: ' + msg.key })
      }) 
      else cb(!s['token-hash'], { hash: s['token-hash'], value: 'token-hash: ' + s['token-hash'] })
    }),
    pull.reduce(
      (acc,x) => { 
        if (typeof x === 'object') {
          hashes[x.hash] = x.value
        }

        if (typeof acc === 'undefined') return x.hash
        else if (acc === x.hash) return acc
        else return null
      },
      undefined,
      (err, acc) => {
        if (err) cb(new Error("Inconsistent properties between sources " + Object.values(hashes)))
        else cb(null,acc)
      }
    )
  )
}

function sourceIsMultiple (smallestUnit, source, cb) {
  log('sourceIsMultiple')
  for (var i = 0; i < source.length; ++i) {
    var amount = source.amount
    if (typeof amount === 'number' &&
        (Math.round(amount / smallestUnit) * smallestUnit !== amount)) {
      return cb(new Error("Source amount '" + amount + "' is not a multiple of '" + smallestUnit + "'"))
    }
  } 
  return cb(null)
}

function sourceEnoughUnspent (token, source, cb) {
  log('sourceEnoughUnspent')

  var cIdx = token.created.length > 0 ? -1 : 0
  var rIdx = token.received.length > 0 ? -1 : 0
  function next () {
    if (cIdx < token.created.length - 1) 
      return token.created[cIdx += 1]
    if (rIdx < token.received.length - 1) 
      return token.received[rIdx += 1]
    return null
  }
  // 4. Replace 'null' in sources by the unspent tokens of
  //    of the corresponding operation
  var filledSource = []
  for (var i = 0; i < source.length; ++i) {
    var s = source[i]
    if (s.id) {
      if (typeof s.amount === "number" && 
          token.all[s.id].unspent >= s.amount) {
        token.all[s.id].unspent -= s.amount
        token.balance -= s.amount
        filledSource.push(s)
      } else if (s.amount === null || 
                 (typeof s.amount === 'undefined')) {
        var amount = token.all[s.id].unspent
        token.all[s.id].unspent -= amount
        token.balance -= amount
        filledSource.push({ amount: amount, id: s.id })
      }
    } else if (s['token-hash']) {
      if (source.length > 1) {
        return cb(new Error('Invalid source, "token-hash" can only be used on a single source.'))
      } else if ((typeof s.amount === "number" &&
          token.balance < s.amount) ||
          token.balance === 0) {
        return cb(new Error('Insufficient unspent funds from owner ' + token.owner + 
                            ' to give ' + JSON.stringify(s)))
      }

      var amount = ((typeof s.amount === 'undefined') || 
                     s.amount === null) ? token.balance : s.amount
      while (amount > 0) {
        var op = next()
        if (op === null) {
          return cb(new Error('Internal error: no operation left to create a source'))
        } else if (op.unspent > 0) {
          var a = Math.min(op.unspent, amount)
          op.unspent -= a
          token.balance -= a
          amount -= a
          filledSource.push({ amount: a, id: op.id }) 
        }
      }
    } else {
        return cb(new Error('Internal error, source ' + JSON.stringify(s) + 
                            ' has no id or token-hash.'))
    }
  }

  cb(null, filledSource)
}

function isCorrectSchema (op) { 
  if (isCreate(op)) {
    if (typeof op.amount !== "number") 
      return new Error("Invalid amount '" + op.amount + "', should be a number")

    if (typeof op.currency !== "string") 
      return new Error("Invalid currency '" + op.currency + "', should be a string")

    if (typeof op.description !== "string" && op.description !== null)
      return new Error("Invalid description '" + op.description + "', should be an SSB_MSG_ID or null")

    if (typeof op["smallest-unit"] !== "number")
      return new Error("Invalid smallest-unit '" + op["smallest-unit"] + "', should be a number")

    if (typeof op["token-hash"] !== "string")
      return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

  } else if (isGive(op)) {
    if (typeof op["token-hash"] !== "string")
      return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

    if (!Array.prototype.isPrototypeOf(op.source))
      return new Error("Invalid source '" + JSON.stringify(op.source) + "', should be an array")

    //  The sum of the amounts of give.source.source(s) is equal
    //  to the give.source.amount
    var total = 0
    for (var i = 0; i < op.source.length; ++i) {
      var s = op.source[i]
      if (typeof s !== "object") 
        return new Error("Invalid source[" + i + "]: '" + JSON.stringify(s) + "', should be an object")

      if (typeof s.amount !== "number")
        return new Error("Invalid source[" + i + "].amount '" + s.amount + "', should be a number")

      if (!ref.isMsgId(s.id))
        return new Error("Invalid source[" + i + "].id '" + s.id + "', should be an SSB_MSG_ID")

      total += s.amount
    }
    if (op.amount !== total) 
      return new Error("Invalid amount " + op.amount + ", inconsistent with total from sources (" + total + ")")

    if (!ref.isFeed(s.recipient))
      return new Error("Invalid recipient " + op.recipient + ", should be an SSB_LOG_ID")

  } else if (isBurn(op)) {
    if (typeof op["token-hash"] !== "string")
      return new Error("Invalid token-hash '" + op["token-hash"] + "', should be a string")

    if (!Array.prototype.isPrototypeOf(op.source))
      return new Error("Invalid source '" + JSON.stringify(op.source) + "', should be an array")

    for (var i = 0; i < op.source.length; ++i) {
      var s = op.source[i]
      if (typeof s !== "string") 
        return new Error("Invalid source[" + i + "]: '" + JSON.stringify(s) + "', should be a string")
    }

  } else {
    return new Error("Invalid type " + op.type)
  }
}

// Return the "tangle", i.e. directed acyclic graph of sources from operation 'id' to 
// the roots, as a dictionary { id: { src1: true, ... }, ... }
function tangle (ssb, ids, cb) {
  var sources = { }
  var queue = [ ]
  var count = 0

  ids.forEach(function (id) {
    sources[id] = {}
    queue.push(id)
  })
  
  function next () {
    var id = queue.pop()
    ssb.get(id, { meta: true }, function (err, msg) {
      if (err) return cb(err)
      count += 1

      var op = msg.value.content 
      if (!isOp(op)) return cb(new Error("Invalid operation " + JSON.stringify(op)))
      if (op.source) {
        op.source.forEach(function (s) {
          var sId = (typeof sId === "string") ? sId : s.id
          if (!sources[sId]) {
            sources[sId] = {}
            queue.push(sId)
          }

          sources[id][sId] = true
        })
      }

      if (queue.length > 0)
        next()
      else if (count === Object.keys(sources).length)
        return cb(null, sources)
    })
  }
}

// Returns a pull source that streams the ancestors of operation id in reverse
// topological order, i.e. from roots to the immediate ancestors of id such
// that all the immediate ancestors of an operation are returned before that
// operation.
function ancestors (ssb, ids) {
  var ancestors = null

  return function source (done, cb) {
    if (ancestors === null) {
      tangle(ssb, ids, function (err, sources) {
        if (err) return cb(err)

        ancestors = Object.keys(sources)
        if (ancestors.length === 0) 
          return cb(new Error("Invalid sources " + JSON.stringify(sources)))

        // Equivalent to Scuttlesort
        ancestors.sort(function (a,b) {
          if (sources[a].hasOwnProperty(b)) {
            return -1
          } else if (sources[b].hasOwnProperty(a)) {
            return 1
          } else {
            return b.localeCompare(a)
          }
        })

        return cb(null, ancestors.pop()) 
      })
    } else if (ancestors.length > 0) {
      return cb(null, ancestors.pop()) 
    } else {
      return cb(true)
    }
  }
}


// All functions that implement the [API](../doc/api.md) are of the form:
//
//   constructor (ssb, state) -> op(args..., cb)
//
// A "constructor" function wraps the state
// required to communicate with an SSB server,
// as well as any state shared between operations,
// and returns a function that implements the API.


function create (ssb, api)  {
  return function create (amount, currency, options, cb) {
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
    if (typeof amount !== 'number') {
      return cb(new Error("tokens.create: Invalid amount of tokens '" + amount + "'"))
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
    if (options.description && !ref.isMsgId(options.description)) {
      return cb(new Error("tokens.create: Invalid description, expected SSB Message ID instead of '" + options.description + "'.")) 
    }

    options['smallest-unit'] = options['smallest-unit'] || 1
    var result = amount/options['smallest-unit']
    if (result !== Math.round(result)) {
      return cb(new Error("tokens.create: Invalid amount and smallest-unit combination, amount '" + amount + "' should be a multiple of '" + options['smallest-unit']) + "'")
    }

    var tokenHash = String(crypto.createHash('sha256')
        .update(currency)
        .update(String(options.description))
        .update(String(options['smallest-unit']))
        .digest('hex').slice(0,16))

    var msg = {
      type: createType,
      amount: amount,
      currency: currency,
      description: options.description,
      'smallest-unit': options['smallest-unit'],
      'token-hash': tokenHash 
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

function give (ssb,api)  {

  // See [ssb.tokens.give](./doc/api.md) pre-conditions
  //
  // 1. All sources have the same properties (token-hash) 
  // 2. Each source amount is a multiple of smallest-unit
  // 3. Owner really owns the token
  // 4. Unspent tokens are greater than numbers given from each source
  // 5. Replaces 'null' with the unspent number of tokens
  function validate (owner, source, recipient, cb) {
    var tokenHash = null
    var smallestUnit = null
    whoami().then((log) => { owner = owner || log.id })
    .then(() => consistentTokenHashesP(source)) // Prop 1
    .then((_tokenHash) => tokenPropertiesP(tokenHash = _tokenHash))
    .then((props) => sourceIsMultipleP(props["smallest-unit"], source)) // Prop 2
    .then(() => list({ owner: owner, "token-hash": tokenHash })) // Prop 3
    //.then((tokens) => { console.log(tokenHash); console.log(owner); console.log(tokens); return tokens })
    .then((tokens) => { 
      if (tokens.length > 0) return sourceEnoughUnspentP(tokens[0], source) 
      else throw new Error("No token found for owner " + owner + 
                            " with source " + JSON.stringify(source))
    })
    .then((source) => {
      cb(null, {
        type: giveType,
        "token-hash": tokenHash,
        source: source,
        amount: source.map((s) => s.amount).reduce(sum, 0),
        recipient: recipient
      })
    })
    .catch(cb)
  }

  var whoami = util.promisify(ssb.whoami)
  var get = util.promisify(ssb.get)
  var list = util.promisify(api.list)
  var consistentTokenHashesP = util.promisify((source,cb) => consistentTokenHashes(ssb,source,cb))
  var tokenPropertiesP = util.promisify((tokenHash,cb) => tokenProperties(ssb,tokenHash,cb))
  var sourceIsMultipleP = util.promisify(sourceIsMultiple)
  var sourceEnoughUnspentP = util.promisify(sourceEnoughUnspent)

  return function give (source, recipient, options, cb) {
    function done (err, ssbMsg) {
      if (err) return cb(err)
      var msg = ssbMsg.value.content
      msg.id = ssbMsg.key
      msg.owner = ssbMsg.value.author 
      cb(null, msg)
    }

    function checkObject(s) {
      if (typeof s === 'object') {
        if (typeof s.amount !== 'undefined' && 
            typeof s.amount !== 'number' &&
            typeof s.amount !== 'null') {
          return new Error("tokens.give: Invalid source amount, expected number instead of '" + 
                            typeof s.amount + "'.")
        }

        if (s.hasOwnProperty('id') &&
            (typeof s.id !== 'string' ||
            !ref.isMsgId(s.id))) {
          return new Error("tokens.give: Invalid source id, expected SSB_MESSAGE_ID " +
                           "instead of " + JSON.stringify(s.id) + ".")
        } 

        if (s.hasOwnProperty('token-hash') &&
            (typeof s['token-hash'] !== 'string')) {
          return new Error("tokens.give: Invalid source 'token-hash' expected string " +
                            "instead of " + JSON.stringify(s['token-hash']) + ".")
        }

        if (!s.hasOwnProperty('id') &&
            !s.hasOwnProperty('token-hash')) {
          return new Error("tokens.give: Invalid source, expected either property 'id' or 'token-hash'.")
        }
        return null
      } else return new Error("tokens.give: Invalid source, expected object instead of " + 
                               typeof source + ".")
    }

    // Type and Syntactic Validation
    cb = cb || options
    if (typeof cb !== 'function') {
      throw new Error("tokens.give: Invalid callback of type '" + (typeof cb) + "'.")
    }
    if (typeof source === 'string') {
      if (!ref.isMsgId(source)) {
        return cb(new Error("tokens.give: Invalid tokens reference, " + 
                            "expected SSB Message ID instead of '" + source + "'."))   
      }
      source = [ { amount: null, id: source } ] // 'null' will be replaced the amount remaining during validation
    } else if (Array.prototype.isPrototypeOf(source) && source.length > 0) {
      for (var i = 0; i < source.length; ++i) {
        var s = source[i]
        var err = checkObject(s)
        if (err !== null) return cb(err)
      }
    } else {
      var err = checkObject(source)
      if (err !== null) return cb(err)
      source = [ source ]
    }

    if (typeof recipient !== 'string' && !ref.isFeed(recipient)) {
      return cb(new Error("tokens.give: Invalid recipient, expected a SSB Log ID "
                          + " instead of '" + JSON.stringify(recipient) + "'."))
    }

    if (typeof options === 'function') {
      options = {}
    }
    
    if (typeof options !== 'object' ) {
      return cb(new Error("tokens.give: Invalid options, expected an {} instead of '" + 
                           JSON.stringify(options) + "'."))
    }

    options.owner = options.owner || null
    if (options.owner) {
      if (!ref.isFeed(options.owner)) {
        return cb(new Error("tokens.give: Invalid options.owner, expected SSB Log ID instead of '" + 
                             options.owner + "'."))
      }
      if (!ssb.identities) {
        return cb(new Error('Install ssb.identities (https://github.com/ssbc/ssb-identities) in ssb-server to specify another owner.'))
      }
    }

    validate(options.owner, source, recipient, function publish (err, msg) {
      if (err) return cb(err)

      if (!options.owner) {
        ssb.publish(msg, done)
      } else {
        ssb.identities.publishAs({ 
          id: options.owner,
          content: msg,
          private: false
        }, done)
      }
    })
  }
}

function trace (ssb) { 
  function validate (opId, cb) {
    // Traces

    // 1. Check that owner really owns the tokens
    // Create: Operation in owner's log
    // Give: Operation lists owner as recipient
    operations.forEach(function (pair) {
      var number = pair[0]
      var opId = pair[1]

    })

    
    // 2. Ensure unspent number is sufficient, 
    //    i.e. greater or equal to the number to spend


    // 3. Roots have the same 'currency', 'description', and 'smallest-unit'

    // 4. Validate all ancestor operations
    //
  }

  return function trace (tokens, options, cb) {

  }
}

function list (ssb,api) {

  // TODO: Add validation of messages

  function toOp (opCache, id, msg) {
    if (!opCache.hasOwnProperty(id)) {
      var content = msg.content
      var op = {}
      opCache[id] = op
      for (p in content) {
        op[p] = content[p]  
      }
      op["id"] = id
      op["author"] = msg.author
      if (isCreate(content) || isGive(content)) {
        op["unspent"] = op["amount"]
      } else {
        op["unspent"] = 0
      }
    }
    return opCache[id]
  }

  function tokenHash(owner, op) {
    return owner + op['token-hash']
  }

  function updateSource(opCache, op) {
    op.source.forEach( (s) => {
      var opId = ref.isMsgId(s) ? s : s.id
      if (opCache[opId]) {
        var op = opCache[opId]
        op["unspent"] -= s.amount || op.amount // give or burn source
      }
    })
  }

  function updateUnspent(opCache, token) {
    token.given.forEach((op) => updateSource(opCache, op)) 
    token.burnt.forEach((op) => updateSource(opCache, op)) 
  }

  function toToken(tokenCache, opCache, owner, op, options) {
    var token = null
    var hash = tokenHash(owner,op)
    if (!tokenCache.hasOwnProperty(hash)) {
      token = {
        owner: owner,
        currency: undefined,
        description: undefined,
        "smallest-unit": undefined,
        "token-hash": op["token-hash"],
        balance: 0,
        created: {},
        received: {},
        given: {},
        burnt: {},
        all: {}
      }
      tokenCache[hash] = token
    }
    token = tokenCache[hash]

    if (options.stateless) 
      return token

    if (isCreate(op) && !token.created[op.id]) {
      token.balance += op["amount"] 
      token.created[op.id] = op
    } else if (isGive(op)) {
      if (op.recipient === owner &&
          !token.received[op.id]) {
        token.balance += op["amount"]
        token.received[op.id] = op
      } else if (op.author === owner &&
                 !token.given[op.id]) {
        token.balance -= op["amount"]  
        token.given[op.id] = op
      }
    } else if (isBurn(op) &&
               !token.burnt[op.id]) {
      token.balance -= op["amount"]
      token.burnt[op.id]  = op
    }
    token.all[op.id] = op
  
    return token
  }

  function collect(filter, options, cb) {
    var tokens = {}
    var ops = {}
    var done = {
      "created": null,
      "received": null,
      "given": !filter.owner || null, // Skip if filter.owner not specified
      "burnt": null
    }
    var errs = []

    var allDone = () => {
      return done["created"] && 
      done["received"] && 
      done["given"] && 
      done["burnt"]
    }
    var errors = () => {
      if (errs.length > 0) {
        var e = new Error("Errors in tokens.list, check err.errs")
        e.errs = errs
        return e
      } else return null
    }

    // Find all possible tokens matching criterias (including from other owners)
    var tokenHashes = {}
    var tokenHashQ = { type: createType } 
    if (filter.currency)         tokenHashQ.currency = filter.currency
    if (filter.description)      tokenHashQ.description = filter.description
    if (filter["smallest-unit"]) tokenHashQ["smallest-unit"] = filter["smallest-unit"]
    if (filter["token-hash"])    tokenHashQ["token-hash"] = filter["token-hash"]

    pull( ssb.query.read({ query: [{ "$filter": { value: { content: tokenHashQ } } }] }),
      pull.drain(
        (res) => { 
          var hash = res.value.content["token-hash"]
          tokenHashes[hash] = toOp(ops, res.key, res.value)
        },
        (err) => {
          if (err) return cb(errors())

          queries = [
            { done: "created",  value: { content: { type: createType } } },
            { done: "received", value: { content: { type: giveType } } },
            { done: "given",    value: { content: { type: giveType } } },
            { done: "burnt",    value: { content: { type: burnType } } },
          ]

          if (filter.owner) {
            var owner = filter.owner
            queries[0].value.author = owner
            queries[1].value.content.recipient = owner
            queries[2].value.author = owner
            queries[3].value.author = owner
          } else {
            // If the owner is unspecified, only query give
            // operations once
            queries = [ queries[0], queries[1], queries[3]]
          }

          queries.forEach( (q) => {
            pull( ssb.query.read({ query: [{ "$filter": { value: q.value } }] }),
              pull.drain(
                (res) => { 
                  log("found msg for query " + q.done +  ": ")
                  log(res)
                  var id = res.key
                  var msg = res.value

                  var props = null
                  if (props = tokenHashes[msg.content["token-hash"]]) {
                    var op = toOp(ops, id, msg)

                    var owned = null
                    var received = null
                    if (filter.owner) {
                      if (filter.owner === msg.author)
                        owned = toToken(tokens, ops, msg.author, op, options) 
                      if (isGive(op) && filter.owner === op.recipient)
                        received = toToken(tokens, ops, op.recipient, op, options) 
                    } else {
                      // Add give operation both to giver and givee tokens
                      owned = toToken(tokens, ops, msg.author, op, options) 
                      if (isGive(op))
                        received = toToken(tokens, ops, op.recipient, op, options) 
                    }
                    
                    // Add missing properties
                    if (owned) {
                      owned.currency = props.currency
                      owned.description = props.description
                      owned["smallest-unit"] = props["smallest-unit"]
                    } 

                    if (received) {
                      received.currency = props.currency
                      received.description = props.description
                      received["smallest-unit"] = props["smallest-unit"]
                    }
                  }
                },
                (err) => {
                  done[q.done] = true
                  if (err) errs.push(err)
                  if (allDone()) {
                    var tokenList = Object.values(tokens)
                    if (options.stateless) {
                      // Ignore tokens from different owners with the
                      // same "token-hash"
                      var tokenHashes = {}
                      tokenList.forEach((token) => {
                        if (!tokenHashes[token["token-hash"]]) {
                          tokenHashes[token["token-hash"]] = {
                            currency: token.currency,
                            description: token.description,
                            "smallest-unit": token["smallest-unit"],
                            "token-hash": token["token-hash"]
                          }
                        }
                      })
                      tokenList = Object.values(tokenHashes)
                    } else {
                      // Check invariants and adjust format
                      for (var i = 0; i < tokenList.length; ++i) {
                        var token = tokenList[i]

                        var _created = token.created
                        var _received = token.received

                        token.created = Object.values(token.created)
                        token.received = Object.values(token.received)
                        token.given = Object.values(token.given)
                        token.burnt = Object.values(token.burnt)
                        updateUnspent(ops, token)

                        var unspent = token.created.concat(token.received)
                                      .map( (op) => op.unspent ).reduce(sum, 0)
                        if (unspent !== token.balance) {
                          return cb(new Error("Sum of unspent tokens is " + unspent + 
                                              " but should be equal to " + token.balance))
                        }
                        var balance = token.created.concat(token.received)
                                      .map( (op) => op.amount ).reduce(sum, 0) +
                                      token.given.concat(token.burnt)
                                      .map( (op) => -op.amount).reduce(sum, 0)

                        if (balance !== token.balance) {
                          return cb(new Error("Sum of amounts is " + balance +
                                              " but should be equal to " + token.balance))
                        }
                        var sourced = token.given.reduce(
                                        (acc, op) => op.source.reduce( 
                                            (acc, s) => acc && ((s.id in _created) || (s.id in _received)),
                                            acc),
                                        true) &&
                                      token.burnt.reduce(
                                        (acc, op) => op.source.reduce(
                                            (acc, s) => acc && ((s in _created) || (s in _received)),
                                            acc),
                                        true)
                        if (!sourced) {
                          return cb(new Error("Some operations in token.given and token.burnt " +
                                              "are not in token.created and token.received."))
                        }
                      }
                    }
                    cb(errors(), tokenList)
                  }
              })
            )
          })
      })
    )
  }

  return function list (filter, options, cb) {
    cb = cb || options || filter
    if (typeof cb !== 'function') {
      throw new Error("tokens.list: Invalid callback of type '" + (typeof cb) + "'")
    }

    if (typeof options === 'function' || typeof options === 'undefined') {
      options = { }
    }

    if (typeof filter !== 'function' && typeof filter !== 'object') {
      return cb(new Error("tokens.list: Invalid filter of type '" + (typeof filter) + "'"))
    }

    if (typeof filter === 'function') {
      filter = { }
    } 

    if (typeof options !== 'object' ) {
      return cb(new Error("tokens.list: Invalid options, expected an {} instead of '" + options + "'."))
    }

    if (typeof options.owner !== 'undefined' && (typeof options.owner !== 'string' || !ref.isFeed(options.owner))) {
      return cb(new Error("tokens.list: Invalid owner '" + options.owner + "', expected an SSB ID")) 
    }

    if (typeof filter.currency !== 'undefined' && typeof filter.currency !== 'string') {
      return cb(new Error("tokens.list: Invalid currency '" + filter.currency + "'"))
    }

    if (typeof filter.description !== 'undefined' && (typeof filter.description !== 'string' || !ref.isMsgId(filter.description))) {
      return cb(new Error("tokens.list: Invalid description '" + filter.description + "'"))
    }

    if (typeof filter["smallest-unit"] !== 'undefined' && typeof filter["smallest-unit"] !== 'number') {
      return cb(new Error("tokens.list: Invalid smallest-unit '" + filter["smallest-unit"] + "'"))
    }

    if (typeof filter["token-hash"] !== 'undefined' && typeof filter["token-hash"] !== 'string') {
      return cb(new Error("tokens.list: Invalid token-hash '" + filter["token-hash"] + "'"))
    }

    collect(filter, options, cb) 
  }
}

function burn (ssb,api)  {
  var consistentTokenHashesP = util.promisify((source,cb) => consistentTokenHashes(ssb,source,cb))
  var whoami = util.promisify(ssb.whoami)
  var list = util.promisify(api.list)

  return function (source, options, cb) {
    cb = cb || options

    function done (err, msg) {
      if (err) return cb(err)
      var op = msg.value.content
      op.id = msg.key
      op.author = msg.author
      return cb(null, op)
    }
    
    if (typeof source === "string" && ref.isMsgId(source)) {
      source = [ source ]
    } else if (Array.prototype.isPrototypeOf(source)) {
      if (source.length < 1) {
        return cb(new Error("Empty source, expected an array " +
                            "of operation ids (SSB Message IDs)."))
      }
      for (var i = 0; i < source.length; ++i) {
        if (typeof source[i] !== "string" || 
            !ref.isMsgId(source[i])) {
          return cb(new Error("Invalid operation id, expected an SSB Message ID, " +
                              " of a create or give operation."))
        }
      }
    } else {
      return cb(new Error("Invalid source, expected one, or an array of, operation id " +
                          "(SSB Message ID) of create or give operation."))
    }

    if (typeof options === "function") {
      options = {}   
    }

    var tokenHash = null
    var amount = 0
    var sourceIds = {}
    function inSourceIds (op) {
      var source = op.source
      for (var i = 0; i < source.length; ++i) {
        if (source[i] in sourceIds || 
            source[i].id in sourceIds)
          return true
      }
      return false
    }

    source.forEach((s) => sourceIds[s] = true)
    whoami().then((log) => { options.owner = options.owner || log.id })
    consistentTokenHashesP(source.map((s) => ({ amount: null, id: s }) ))
    .then((_tokenHash) => list({ owner: options.owner, "token-hash": tokenHash=_tokenHash }))
    .then((tokens) => {
      if (tokens.length < 1) {
        throw new Error("Invalid source(s) '" + JSON.stringify(source) + 
                        "', inexistant or not owned by " + options.owner + ".")
      }
      amount=tokens[0].created.concat(tokens[0].received)
            .filter((op) => sourceIds.hasOwnProperty(op.id))
            .map((op) => op.amount)
            .reduce(sum, 0) 

      var tok = tokens[0]
      source.forEach((s) => {
        var nonVirgin = null 
        if ((nonVirgin=tok.given.filter(inSourceIds)).length > 0) {
          throw new Error("Invalid source(s) " + JSON.stringify(s) + 
                          ", already partially or completely given.")
        }
        
        if ((nonVirgin=tok.burnt.filter(inSourceIds)).length > 0) {
          throw new Error("Invalid source(s) " + JSON.stringify(s) + 
                          ", already burnt.")
        }
      })
    })
    .then(() => {
      var msg = {
        type: burnType,
        "token-hash": tokenHash,
        source: source,
        amount: amount
      }
      log('publishing msg')
      log(msg)

      ssb.identities.publishAs({ 
        id: options.owner,
        content: msg,
        private: false
      }, done)
    })
    .catch(cb)
  }
}

function validate (ssb, api) {

  
  return function validate (source, options, cb) {
    function checkType (source) {
      var err = null
      if (typeof source === "string" &&
          !ref.isMsgId(source)) {
        return new Error("Invalid source string, expected an SSB Message ID instead of '" + source + "'.")
      } else if (Array.prototype.isPrototypeOf(source)) {
        for (var i = 0; i < source.length; ++i) {
          if (err=checkType(source[i])) return err
        }
        return err
      } else if (typeof source === "object") {
        if (!source.id) return new Error("Invalid source '" + JSON.stringify(source) + 
                                         "', expected 'id' with operation-id.")
        if (typeof source.id !== "string" ||
            !ref.isMsgId(source.id))
          return new Error("Invalid source.id '" + source.id + "', expected SSB MSG ID.")

        if (source.amount && typeof source.amount !== "number") 
          return new Error("Invalid source.amount '" + source.amount + 
                           "', expected number.")
      } else {
        return null
      }
    }

    cb = cb || options    

    if (typeof options === "function") {
      options = {}
    }

    var err = null
    if (err=checkType(source)) return cb(err)
    else if (typeof source === "string") source = [ source ]
    else if (typeof source === "object" && !Array.prototype.isPrototypeOf(source))
      source = [ source.id ]
    else 
      source = source.map(function (s) { return typeof s === "string" ? s : s.id })

    var invalid = {}
    var amounts = {}
    var recipient = {}
    var proofs = {}

    pull(
      ancestors(ssb, source),
      pull.drain( (op) => {
        if (!isCorrectSchema(op)) {
          invalid[op.id] = { op: op, error: new Error("Incorrect schema") }
          return
        }
        
        if (!amounts[op.id]) {
          amounts[op.id] = 0
          proofs[op.id] = []
        }
        
        if (isCreate(op)) {
          // TODO: Check consistency of token hash

          amounts[op.id] += op.amount
          receiver[op.id] = op.owner
          proofs[op.id].push(op)

        } else if (isGive(op)) {
          // TODO: Check consistency of token hash
          
          var wrong = false
          var total = 0
          op.source.forEach(function (s) {
            // TODO: Check that s.id exists
            //
            if (amounts[s.id] < s.amount) {
              invalid[s.id] = { op: op, source: s.id, proof: proofs[s.id], error: new Error("Insufficient funds available") }
              wrong = true
            } else if (receiver[s.id] !== op.owner) {
              invalid[s.id] = { op: op, source: s.id, proof: proofs[s.id], error: new Error("Inconsistent owner between the author of the give and the sources used") }
              wrong = true
            } else {
              amounts[s.id] -= s.amount
              total += s.amount
              proofs[s.id].push(op)
              wrong = wrong || false
            }
          })

          if (total !== op.amount) {
            wrong = true
            invalid[op.id] = { 
              op: op, source: op.id, total: total, 
              error: new Error("Inconsistency between total amount of sources and operation amount") 
            }
          }

          if (!wrong)
            amounts[op.id] += op.amount
        } else if (isBurn(op)) {
          // TODO: Check consistency of token hash
          //
          // TODO: Check that s.id exists
          //
          
          op.source.forEach(function (id) {
            if (amounts[id] === 0) 
              invalid[id] = { op: op, source: id, proof: proofs[id], error: new Error("Burning unavailable tokens") }
            else 
              amounts[id] = 0
          })
        }
      }, (err) => {
        if (err) return cb(err)
        
        if (Object.keys(invalid).length > 0) {
          var err = new Error("Invalid source")
          err.invalid = Object.values(invalid)
          return cb(err)
        } else 
          return cb(null)
      })
    )

    // Check sufficient funds available:
    // 1. Funds from create are always available
    // 2. Funds from a give.source are valid iff:
    //   2.1 There exist no other give from the same author such that
    //       the sum of amounts in all give from the same source is 
    //       is greater than the amount available from that source.
    //   2.2 The receiver of the source is indeed the author of the give.
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
    unflag: 'async',
    validate: 'async'
  },
  init: function (ssb, config) {
    if (!ssb.query) throw new Error('ssb.query (https://github.com/ssbc/ssb-query) is required on ssb-server.')

    // Set properties first to preserve lexicographic order
    var api = {
      burn: null,
      create: null,
      flag: null,
      give: null,
      help: null,
      list: null,
      trace: null,
      unflag: null,
      validate: null
    }
    api['list'] = list(ssb,api) 
    api['create'] = create(ssb,api)
    api['give'] = give(ssb,api)
    api['burn'] = burn(ssb,api) 
    api['validate'] = validate(ssb,api)
    api['validate'].format = format(ssb,api)
    api['validate'].requirements = requirements(ssb,api)

    api['flag'] = function (cb) { return cb(null)  }
    api['help'] = function () { return { description: 'Tokens for community economics.', commands: {} } } 
    api['trace'] = function (cb) { return cb(null)  }
    api['unflag'] = function (cb) { return cb(null)  }
    return api
  }
}

var createType = 'tokens/' + meta['api-version'] + '/create'
var giveType = 'tokens/' + meta['api-version'] + '/give'
var burnType = 'tokens/' + meta['api-version'] + '/burn'
var flagType = 'tokens/' + meta['api-version'] + '/flag'
var unflagType = 'tokens/' + meta['api-version'] + '/unflag'

module.exports = meta
