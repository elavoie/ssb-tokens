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

function isOp (op) {
  return isCreate(op) || isGive(op) || isBurn(op)
}

function tokenProperties (ssb, tokenHash, cb) {
  pull(
    ssb.query.read({ 
      query: { "$filter": { value: { content: { type: createType, "token-hash": tokenHash } } } },
      limit: 1
    }),
    pull.collect( (err, ary) => {
      if (err) cb(err)
      else {
        var tok = ary[0].value.content
        cb(null, { 
          currency: tok.currency,
          description: tok.description,
          "smallest-unit": tok["smallest-unit"],
          "token-hash": tok["token-hash"]
        })
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
  log(token)
  log(source)
  source.sort((a,b) => {
    if (a.id && !b.id) return -1
    else if (!a.id && b.id) return 1
    else return 0
  })
  var filledSource = []
  for (var i = 0; i < source.length; ++i) {
    var s = source[i]
    if (s.id) {
      if (typeof s.amount === "number" && 
          token.all[s.id].unspent >= s.amount) {
        token.all[s.id].unspent -= s.amount
        filledSource.push(s)
      } else if (s.amount === null) {
        var amount = token.all[s.id].unspent
        token.all[s.id].unspent -= amount
        filledSource.push({ id: s.id, amount: amount })
      }
    } else if (s['token-hash']) {
      // TODO: Implement
      return cb(new Error('Unimplemented token-hash amount computation'))
    } else {
      return cb(new Error('Insufficient unspent funds remaining to give ' + JSON.stringify(source)))
    }
  }

  cb(null, filledSource)
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
    log('tokens.give validate')
    var tokenHash = null
    var smallestUnit = null
    whoami().then((logId) => { owner = owner || logId })
    .then(() => consistentTokenHashesP(source)) // Prop 1
    .then((_tokenHash) => tokenPropertiesP(tokenHash = _tokenHash))
    .then((props) => sourceIsMultipleP(props["smallest-unit"], source)) // Prop 2
    .then(() => list({ owner: owner, "token-hash": tokenHash })) // Prop 3
    .then((tokens) => sourceEnoughUnspentP(tokens[0], source) )
    .then((source) => {
      cb(null, {
        type: giveType,
        "token-hash": tokenHash,
        source: source,
        amount: source.map((s) => s.amount).reduce(sum),
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

    function checkObject(obj) {
      if (typeof s === 'object') {
        if (typeof s.amount !== 'number') {
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
      } else return null
    }

    // Type and Syntactic Validation
    cb = cb || options
    if (typeof cb !== 'function') {
      throw new Error("tokens.give: Invalid callback of type '" + (typeof cb) + "'.")
    }
    if (typeof source === 'string') {
      if (!ref.isMsgId(source)) {
        return cb(new Error("tokens.give: Invalid tokens reference, expected SSB Message ID instead of '" + tokens 
                            + "'."))   
      }
      sources = [ { amount: null, id: source } ] // 'null' will be replaced the amount remaining during validation
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
                      tokenList.forEach((token) => {
                        log(token)
                        token.created = Object.values(token.created)
                        token.received = Object.values(token.received)
                        token.given = Object.values(token.given)
                        token.burnt = Object.values(token.burnt)
                        updateUnspent(ops, token)
                      })
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
    function done (err, msg) {
      if (err) return cb(err)
      var op = msg.value.content
      op.id = msg.key
      op.author = msg.author
      return cb(null, op)
    }
    
    if (typeof source === "string" && ref.isMsgId(source)) {
      source = [ source ]
    }

    log(source)

    var tokenHash = null
    var amount = 0
    var sourceIds = {}
    source.forEach((s) => sourceIds[s] = true)
    whoami().then((logId) => { options.owner = options.owner || logId })
    consistentTokenHashesP(source.map((s) => ({ amount: null, id: s }) ))
    .then((_tokenHash) => list({ owner: options.owner, "token-hash": tokenHash=_tokenHash }))
    .then((tokens) => {
      log(sourceIds)
      log(source)
      amount=tokens[0].created.concat(tokens[0].received)
            .filter((op) => sourceIds.hasOwnProperty(op.id))
            .map((op) => op.amount)
            .reduce(sum) 
    })
    // TODO check that tokens from all operation ids have not been partially given already
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
    api['create'] = create(ssb,api)
    api['list'] = list(ssb,api) 
    api['give'] = give(ssb,api)
    api['burn'] = burn(ssb,api) 

    api['flag'] = function (cb) { return cb(null)  }
    api['help'] = function () { return { description: 'Tokens for community economics.', commands: {} } } 
    api['trace'] = function (cb) { return cb(null)  }
    api['unflag'] = function (cb) { return cb(null)  }
    api['validate'] = function (cb) { return cb(null)  }
    return api
  }
}

var createType = 'tokens/' + meta['api-version'] + '/create'
var giveType = 'tokens/' + meta['api-version'] + '/give'
var burnType = 'tokens/' + meta['api-version'] + '/burn'

module.exports = meta
