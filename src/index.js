var ref = require('ssb-ref')
var pull = require('pull-stream')
var many = require('pull-many')
var pull = require('pull-stream')
var defer = require('pull-defer')
var sortedMerge = require('pull-sorted-merge')
var crypto = require('crypto')
var debug = require('debug')
var ref = require('ssb-ref')
var ssbKeys = require('ssb-keys')
var util = require('./util')

var log = debug('ssb-tokens')
var ALLOWEDCHARS =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-"
var TOKENTYPELENGTH = 16
var NAMELENGTH = 30
var UNITLENGTH = 10
var sum = (a,b) => a+b

function flatten(ary) {
  var flat = []

  function recurse (v) {
    if (!Array.prototype.isPrototypeOf(v))
      flat.push(v)
    else 
      v.forEach(recurse)
  }
  recurse(ary)
  return flat
}

// Save calling context to more easily find
// where the API was called from in case of errors
function wrap (cb, cbLen, args) {
  if (typeof cb !== 'function') 
    throw new Error("Invalid callback " + cb)

  // Do not wrap multiple times, to preserve only
  // the first entry point into the API
  // and ignore API calls made from within
  if (cb.wrapped === true) return cb

  // Save calling context, to know what
  // code triggered an error
  var caller = new Error('Caller context:').stack

  // Wrap the callback with the proper number of arguments
  // to make function calls faster
  if (cbLen === 1) {
    function wrapped (err) {
      if (err) {
        err.caller = caller
        err.args = args
      }
      cb(err)
    }
  } else if (cbLen === 2) {
    function wrapped (err, a1) {
      if (err) {
        err.caller = caller
        err.args = args
      }
      cb(err, a1)
    }
  } else if (cbLen === 3) {
    function wrapped (err, a1, a2) {
      if (err) {
        err.caller = caller
        err.args = args
      }
      cb(err, a1, a2)
    }
  } else if (cbLen === 4) {
    function wrapped (err, a1, a2, a3) {
      if (err) {
        err.caller = caller
        err.args = args
      }
      cb(err, a1, a2, a3)
    }
  // The API does not expect callbacks with more than 4
  // arguments
  } else {
    throw new Error("Unsupported arguments number for " +
                    "callback")
  }

  wrapped.wrapped = true
  return wrapped
}

function causes (reasons, err) {
  if (typeof reasons === "string") 
    err[reasons] = true
  else 
    reasons.forEach((r) => err[r] = true)
  return err
}

// **************************** formatOp (op) ***************************
// Check that `op` correctly follows the expected operation format for each
// operation type, synchronously. If format is incorrect, returns an
// error with the first format check failed. If format is correct, returns
// null.

function formatCreate (op) {
  if (op.type !== util.createType)
    return causes('type',
             new Error("Invalid type '" + op.type + "' for operation " + 
                       JSON.stringify(op) + ", should be '" + 
                       util.createType + "'"))

  if (typeof op.amount !== "number") 
    return causes('amount', 
             new Error("Invalid amount '" + op.amount + "', for operation " +
                       JSON.stringify(op) + ", should be a number"))

  if (typeof op.name !== "string") 
    return causes('name', 
             new Error("Invalid name '" + op.name + "', for operation " + 
                      JSON.stringify(op) + ", should be a string"))

  if (op.name.length > NAMELENGTH) 
    return causes('name',
             new Error("Invalid name of length " + op.name.length + 
                     " for operation " + JSON.stringify(op) + 
                     ", should be less or equal to " + NAMELENGTH))

  if (typeof op.unit !== "string") 
    return causes('unit',
             new Error("Invalid unit '" + op.unit + "' for operation " + 
                     JSON.stringify(op) + ", should be a string"))

  if (op.unit.length > UNITLENGTH) 
    return causes('unit',
             new Error("Invalid unit of length " + op.unit.length + 
                     " for operation " + JSON.stringify(op) +
                     ", should be less or equal to " + UNITLENGTH))

  if (!ref.isMsgId(op.description)  && op.description !== null)
    return causes('description',
             new Error("Invalid description '" + op.description + 
                     " for operation " + JSON.stringify(op) +
                     ", should be an SSB_MSG_ID or null"))

  if (typeof op.decimals !== "number")
    return causes('decimals',
             new Error("Invalid decimals '" + op.decimals + "' " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be a number"))

  if (op.decimals === Infinity || op.decimals === -Infinity)
    return causes('decimals',
             new Error("Invalid decimals '" + op.decimals + "' " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be finite"))

  if (Math.round(op.decimals) !== op.decimals)
    return causes('decimals',
             new Error("Invalid decimals '" + op.decimals + "' " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be an integer"))

  if (op.decimals < 0 || op.decimals > 32)
    return causes('decimals',
             new Error("Invalid decimals '" + op.decimals + "' " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be an integer between 0 and 32 inclusive"))

  if (typeof op.tokenType !== "string")
    return causes('tokenType',
             new Error("Invalid tokenType " + op.tokenType + 
                     " for operation " + JSON.stringify(op) + 
                     ", should be a string"))

  if (op.tokenType.length > TOKENTYPELENGTH)
    return causes('tokenType',
             new Error("Invalid tokenType of length " + op.tokenType.length + 
                     " for operation " + JSON.stringify(op) +
                     ", should be less or equal to " + TOKENTYPELENGTH))

  if (!(op.amount > 0))
    return causes('amount',
             new Error("Invalid amount '" + op.amount + "', " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be positive"))

  for (var i = 0; i < op.name.length; ++i) {
    var c = op.name[i]
    if (ALLOWEDCHARS.indexOf(c) < 0)
      return causes('name', 
               new Error("Invalid character '" + c + "' in name " +
                       " for operation " + JSON.stringify(op) + 
                       ", expected only characters within '" + 
                       ALLOWEDCHARS + "'"))
  }

  for (var i = 0; i < op.unit.length; ++i) {
    var c = op.unit[i]
    if (ALLOWEDCHARS.indexOf(c) < 0)
      return causes('unit',
               new Error("Invalid character '" + c + "' in unit," +
                       " for operation " + JSON.stringify(op) + 
                       ", expected only characters within '" + 
                       ALLOWEDCHARS + "'"))
  }

  var shifted = Math.pow(10,op.decimals)*op.amount
  if (Math.trunc(shifted) !== shifted)
    return causes(['amount', 'decimals'],
               new Error("Invalid (amount,decimals) combination (" +
                     JSON.stringify(op.amount) + "," + 
                     JSON.stringify(op.decimals) + ") " + 
                     " for operation " + JSON.stringify(op) + 
                     ", more decimals in amount than supported"))

  return null
}

// Format checks common to formatGive and formatBurn
function formatTransfer (op) {
  if (typeof op.tokenType !== "string")
    return new Error("Invalid tokenType '" + op.tokenType + "' " +
                     " for operation " + JSON.stringify(op) + 
                     ", should be a string")

  if (op.tokenType.length > TOKENTYPELENGTH)
    return new Error("Invalid tokenType of length " + op.tokenType.length + 
                     " for operation " + JSON.stringify(op) +  
                     ", should be less or equal to " + TOKENTYPELENGTH)

  if (typeof op.amount !== "number")
    return new Error("Invalid amount " + JSON.stringify(op.amount) + 
                     " for operation " + JSON.stringify(op) +
                     ", should be a number")

  if (!Array.prototype.isPrototypeOf(op.sources))
    return new Error("Invalid sources '" + JSON.stringify(op.sources) + "' " +
                     " for operation " + JSON.stringify(op) +
                     ", should be an array")

  // Bounded
  if (op.sources.length > 10)
    return new Error("Too many sources for operation " + JSON.stringify(op) +
                      ", expected 10 sources maximum")

  // Check sources, while computing total amount from sources
  var total = 0
  for (var i = 0; i < op.sources.length; ++i) {
    var s = op.sources[i]
    if (typeof s !== "object") 
      return new Error("Invalid sources[" + i + "]: '" + JSON.stringify(s) + 
                       "' for operation " + JSON.stringify(op) + 
                       ", should be an object")

    if (typeof s.amount !== "number")
      return new Error("Invalid sources[" + i + "].amount '" + s.amount + 
                       "' for operation " + JSON.stringify(op) +
                       ", should be a number")

    if (s.amount <= 0)
      return new Error("Invalid sources[" + i + "].amount '" + s.amount + 
                       "' for operation " + JSON.stringify(op) +
                       ", should be strictly positive")

    if (!ref.isMsgId(s.id))
      return new Error("Invalid sources[" + i + "].id '" + s.id + "' " + 
                       " for operation " + JSON.stringify(op) +
                       ", should be an SSB_MSG_ID")

    if (Object.keys(s).length > 2) 
      return new Error("Invalid sources[" + i + "]: " + JSON.stringify(s) +
                       " for operation " + JSON.stringify(op) +
                       ", only 'id' and 'amount' properties should be present")

    total += s.amount
  }

  // Consistent Amount
  if (op.amount !== total) 
    return new Error("Invalid amount " + op.amount + 
                     " for operation " + JSON.stringify(op) +
                     ", inconsistent with total from sources (" + total + ")")

  // Unique
  sources = {}
  op.sources.forEach(function (s) {
    sources[s.id] = s.amount
  })
  if (Object.keys(sources).length < op.sources.length)
    return new Error("Multiple sources with same id " +
                        " for operation " + JSON.stringify(op) + 
                        ", each should be unique")

  if (!ref.isMsgId(op.description)  && op.description !== null)
    return new Error("Invalid description '" + op.description + 
                     " for operation " + JSON.stringify(op) +
                     ", should be an SSB_MSG_ID or null")

  return null
}

function formatGive (op) {
  if (op.type !== util.giveType)
    return new Error("Invalid type '" + op.type + "' " + 
                     " for operation " + JSON.stringify(op) + 
                     ", should be '" + util.giveType + "'") 

  if (!ref.isFeed(op.receiver))
    return new Error("Invalid receiver " + op.receiver + 
                     " for operation " + JSON.stringify(op) +
                     ", should be an SSB_LOG_ID")

  return formatTransfer(op)
}

function formatBurn (op) {
  if (op.type !== util.burnType)
    return new Error("Invalid type '" + op.type + "' " + 
                     " for operation " + JSON.stringify(op) + 
                     ", should be '" + util.burnType + "'") 

  return formatTransfer(op)
}

function formatFlag (op) {
  throw new Error("Unimplemented")
}

function formatUnflag (op) {
  throw new Error("Unimplemented")
}

function format (ssb, api) {
  function checkFormat (op, opts) {
    if (typeof opts === 'undefined')
      opts = {}

    if (util.isCreate(op)) return formatCreate(op, opts)
    else if (util.isGive(op)) return formatGive(op, opts)
    else if (util.isBurn(op)) return formatBurn(op, opts)
    else if (util.isFlag(op)) return formatFlag(op, opts)
    else if (util.isUnflag(op)) return formatUnflag(op, opts)
    else return new Error("Invalid ssb-tokens operation with type '" + op.type + "'")
  }

  checkFormat.create = formatCreate
  checkFormat.give = formatGive
  checkFormat.burn = formatBurn
  checkFormat.flag = formatFlag
  checkFormat.unflag = formatUnflag

  return checkFormat
}

function reqMsg(msgValue) {
  if (!msgValue.author || !ref.isFeed(msgValue.author))
    return new Error("Invalid msgValue.author '" + msgValue.author + "'" + 
                        " for message " + JSON.stringify(msgValue) +
                        ", expected SSB Log ID")

  if (!msgValue.content || typeof msgValue.content !== "object")
    return new Error("Invalid msgValue.content '" + msgValue.content + "'" +
                      " for message " + JSON.stringify(msgValue) +   
                      ", expected object")

  return null
}


function requirements (ssb, api) {

  // *********** reqCreate (msgValue, opts, cb(err, msgValue)) ****************
  // Check that `msgValue` requirements for <op> are satisfied, asynchronously.
  // If all requirements are satisfied, invoke `cb(null, msgValue)`. Otherwise,
  // invoke `cb(err, msgValue)` where `err` is the first requirement error
  // encountered. `msgValue` is the same as input.

  function reqCreate (msgValue, opts, cb) {
    cb = cb || opts
    if (api._debugFlag)
      cb = wrap(cb, 2, [msgValue, opts])
    if (typeof opts === 'function')
      opts = {}

    var err = reqMsg(msgValue) 
    if (err) return cb(err)
    
    var op = msgValue.content
    var err = api.validate.format.create(op)
    if (err) return cb(err)

    // Unique unforgeable tokenType
    var expected = ssb.tokens.tokenType(msgValue.author, op)
    if (op.tokenType !== expected)
      return cb(new Error("Invalid token type '" + op.tokenType + 
                          "', expected '" + expected + "'"))

    return cb(null, msgValue)
  }

  function reqTransfer (msgValue, opts, cb) {
    var op = msgValue.content

    function get (src, cb) {
      ssb.get({id: src.id, meta: true},
        function (err, msg) {
          if (err && err.notFound) {
            // Compute all missing sources now that
            // we know there is at least one not found
            return api.ancestors(op.sources, cb) 
          }

          return cb(err, { 
            id: src.id, 
            amount: src.amount, 
            msg: msg 
          })
        }
      )
    }

    // Get and check all sources
    pull(
      pull.values(op.sources),
      pull.asyncMap(get),
      pull.asyncMap((src, cb) => {
        var sId = src.msg.key
        var sOp = src.msg.value.content

        // Valid
        if (!util.isCreate(sOp) && !util.isGive(sOp)) 
          return cb(new Error("Invalid source " + sId + 
                              " for message " + JSON.stringify(msgValue) + 
                              ", expected a create or give operation"))

        api.valid(src.msg, opts, 
          (err, msg) => {
            if (err) return cb(err)
            else return cb(null, src)
          }
        )
      }),
      pull.asyncMap((src, cb) => {
        var sId = src.msg.key
        var sOp = src.msg.value.content
        var sAuthor = src.msg.value.author 

        // Consistent TokenType
        if (sOp.tokenType !== op.tokenType)
          return cb(new Error("Invalid source " + sId + " for message " +
            JSON.stringify(msgValue) + ", expected token type consistent with " 
            + op.tokenType))

        // Consistent receiver
        if (util.isGive(sOp) && sOp.receiver !== msgValue.author)
          return cb(new Error("Invalid 'give' source " + sId + " for message " +
            JSON.stringify(msgValue) + ", expected receiver to be " +
            msgValue.author))

        // Consistent Creator 
        if (util.isCreate(sOp) && sAuthor !== msgValue.author) 
          return cb(new Error("Invalid 'create' source " + sId + " for message " +
            JSON.stringify(msgValue) + ", expected author to be " +
            msgValue.author))

        return cb(null, src)
      }),
      pull.onEnd(function (err) {
        if (err) return cb(err)
        else cb(null, msgValue)
      })
    )
  }

  function reqGive (msgValue, opts, cb) {
    cb = cb || opts
    if (api._debugFlag)
      cb = wrap(cb, 2, [msgValue, opts])
    if (typeof opts === 'function')
      opts = {}

    var err = reqMsg(msgValue) 
    if (err) return cb(err)
    
    var err = api.validate.format.give(msgValue.content)
    if (err) return cb(err)

    reqTransfer(msgValue, opts, function (err, msgValue) {
      if (err) return cb(err)

      pull(
        pull.values(msgValue.content.sources),
        pull.asyncMap(function (s, cb) {
          var seqno = msgValue.sequence || Infinity
          var owner = msgValue.author
          api.unspent(s.id, owner, seqno, function (err, unspent, msg) {
            if (err) 
              return cb(new Error("Error retrieving unspent for source " +
                                   JSON.stringify(s) + " in message value " +
                                   JSON.stringify(msgValue, null, 2) + ":\n" +
                                   err.message))

            if (unspent < s.amount)
              return cb(new Error("Insufficient unspent value of " + unspent + 
                                  " for owner " + owner + " at sequence no " + 
                                  seqno + " to supply source " + 
                                  JSON.stringify(s) + " in message value " + 
                                  JSON.stringify(msgValue, null, 2)))

            return cb(null, s)
          })
        }),
        pull.onEnd(function (err) {
          cb(err, msgValue)
        })
      )
    })
  }

  function reqBurn (msgValue, opts, cb) {
    cb = cb || opts
    if (api._debugFlag)
      cb = wrap(cb, 2, [msgValue, opts])
    if (typeof opts === 'function')
      opts = {}
    
    var err = reqMsg(msgValue) 
    if (err) return cb(err)

    var err = api.validate.format.burn(msgValue.content)
    if (err) return cb(err)

    reqTransfer(msgValue, opts, function (err, msgValue) {
      if (err) return cb(err)

      pull(
        pull.values(msgValue.content.sources),
        pull.asyncMap(function (s, cb) {
          var seqno = msgValue.sequence || Infinity
          var owner = msgValue.author
          api.unspent(s.id, owner, seqno, function (err, unspent, msg) {
            if (err) 
              return cb(new Error("Error retrieving unspent for source " +
                                   JSON.stringify(s) + " in message value " +
                                   JSON.stringify(msgValue, null, 2) + ":\n" +
                                   err.message))

            var adjective = (unspent === 0) ? "Completely" : "Partially"
            if (unspent !== s.amount)
              return cb(new Error(adjective + " spent source " +
                                  JSON.stringify(s) +
                                  " for owner " + owner + " at sequence no " + 
                                  seqno + " in message value " + 
                                  JSON.stringify(msgValue, null, 2)))

            return cb(null, s)
          })
        }),
        pull.onEnd(function (err) {
          cb(err, msgValue)
        })
      )
    })
  }

  function reqFlag (msgValue, opts, cb) {
    cb = cb || opts
    if (api._debugFlag)
      cb = wrap(cb, 2, [msgValue, opts])
    if (typeof opts === 'function')
      opts = {}
    
    var err = reqMsg(msgValue) 
    if (err) return cb(err)

    var err = api.validate.format.flag(msgValue.content)
    if (err) return cb(err)

    // TODO: Requirements

    return cb(null, msgValue)
  }

  function reqUnflag (msgValue, opts, cb) {
    cb = cb || opts
    if (api._debugFlag)
      cb = wrap(cb, 2, [msgValue, opts])
    if (typeof opts === 'function')
      opts = {}

    var err = reqMsg(msgValue) 
    if (err) return cb(err)

    var err = api.validate.format.unflag(msgValue.content)
    if (err) return cb(err)

    // TODO: Requirements

    return cb(null, msgValue)
  }

  function checkReq (msgValue, opts, cb) {
    var cb = cb || opts
    if (typeof opts === 'function')
      opts = {}

    var op = msgValue.content

    if (util.isCreate(op)) return reqCreate(msgValue, opts, cb)
    else if (util.isGive(op)) return reqGive(msgValue, opts, cb)
    else if (util.isBurn(op)) return reqBurn(msgValue, opts, cb)
    else if (util.isFlag(op)) return reqFlag(msgValue, opts, cb)
    else if (util.isUnflag(op)) return reqUnflag(msgValue, opts, cb)
    else return cb(new Error("Invalid ssb-tokens operation " + 
                             "with type '" + op.type + "'"))
  }

  checkReq.create = reqCreate 
  checkReq.give = reqGive 
  checkReq.burn = reqBurn 
  checkReq.flag = reqFlag 
  checkReq.unflag = reqUnflag 

  return checkReq
}

function tokenType (author, props) {
  props = props || author
  if (typeof author !== "string") {
    author = props.author
  }
  return String(crypto.createHash('sha256')
        .update(String(author))
        .update(String(props.name))
        .update(String(props.unit))
        .update(String(props.decimals))
        .update(String(props.description))
        .digest('hex').slice(0,16))
}

function types (ssb, api) {
  return function types (options, cb) {
    cb = cb || options
    if (typeof options === "function")
      options = { match: {} }

    if (typeof cb !== "function")
      throw new Error("types: Invalid callback " + cb +
                      ", expected a function with signature " +
                      "cb(err, types)")

    if (api._debugFlag)
      cb = wrap(cb, 2, [options])

    if (typeof options !== "object")
      return cb(new Error("types: Invalid options " + JSON.stringify(options) +
                          ", expected an object"))
    
    if (typeof options.validate === "undefined")
        options.validate = true

    if (options.match) {
      if (typeof options.match !== "object") 
        return cb(new Error("types: Invalid options.match " + 
                            JSON.stringify(options.match) +
                            ", expected an object"))

      if (options.match.author && !ref.isFeed(options.match.author))
        return cb(new Error("types: Invalid options.match.author " + 
                            JSON.stringify(options.match.author) +
                            ", expected valid SSB Log ID"))

      if (options.match.tokenType && 
          typeof options.match.tokenType !== "string")
        return cb(new Error("types: Invalid options.match.tokenType " +
                             JSON.stringify(options.match.tokenType) +
                            ", expected a string"))

      var createMsg = { 
        type: util.createType,
        amount: 1,
        decimals: options.match.decimals || 0,
        description: options.match.description || null,
        name: options.match.name || '',
        unit: options.match.unit || ''
      }

      if (options.match.tokenType)
        createMsg.tokenType = options.match.tokenType
      else
        createMsg.tokenType = ssb.tokens.tokenType(null, createMsg)

      var err = ssb.tokens.validate.format(createMsg)
      if (err) {
        if (err.decimals) 
          return cb(causes('decimals',
                      new Error("types: Invalid options.match.decimals " + 
                              JSON.stringify(options.match.decimals) + 
                              ", expected an integer between 0 and 32 inclusive")))

        if (err.description)
          return cb(causes('description',
                      new Error("types: Invalid options.match.description " +
                              JSON.stringify(options.match.description) +
                              ", expected a SSB Msg ID")))

        if (err.name)
          return cb(causes('name',
                      new Error("types: Invalid options.match.name " +
                              JSON.stringify(options.match.name) +
                              ", expected a string with " + NAMELENGTH + 
                              " characters or less within " + ALLOWEDCHARS)))

        if (err.unit)
          return cb(cause('unit',
                      new Error("types: Invalid options.match.unit " + 
                              JSON.stringify(options.match.unit) + 
                              ", expected a string with " + UNITLENGTH +
                              " characters or less within " + ALLOWEDCHARS)))
      }
    }

    var types = {}
    var q = { value: { content: { type: util.createType } } }
    if (options.match.author)
      q.value.author = options.match.author

    if (options.match.decimals)
      q.value.content.decimals = options.match.decimals

    if (options.match.description)
      q.value.content.description = options.match.description

    if (options.match.name)
      q.value.content.name = options.match.name

    if (options.match.unit)
      q.value.content.unit = options.match.unit

    if (options.match.tokenType)
      q.value.content.tokenType = options.match.tokenType 

    pull(
      ssb.query.read({ query: [{ "$filter": q }] }),
      pull.asyncMap(function (msg_, cb) {
        if (!options.validate) 
          return cb(null, msg_.value)

        api.valid(msg_, function (err, msg_) {
          if (err) return cb(null, null)
          return cb(null, msg_.value)
        })
      }),
      pull.filter( (x) => x !== null ),
      pull.drain(function (msgValue) {
        var author = msgValue.author
        var op = msgValue.content
        var tokenType = op.tokenType

        if (tokenType && !types[tokenType])
          types[tokenType] = {
            author: author,
            decimals: op.decimals,
            description: op.description,
            name: op.name,
            unit: op.unit,
            tokenType: tokenType
          }
      }, function (err) {
        if (err) return cb(err)
        else return cb(null, types)
      })
    )
  }
}

function unspent (ssb, api) {
  return function unspent (msgId, owner, seqno, cb) {
    cb = cb || seqno
    if (typeof seqno === "function") {
      seqno = Infinity
    }

    if (typeof cb !== "function")
      throw new Error("unspent: Invalid callback " + cb +
                      ", expected a function with signature " +
                      "cb(err, amount, msg)")

    if (api._debugFlag)
      cb = wrap(cb, 3, [msgId, owner, seqno])

    if (!ref.isMsgId(msgId))
      return cb(new Error("unspent: Invalid message identifier " + msgId +
                      ", expected a valid SSB Message ID"))

    if (!ref.isFeed(owner))
      return cb(Error("unspent: Invalid owner " + owner + 
                      ", expected valid SSB Log ID"))


    if (typeof seqno !== "number" || seqno < 1) {
      return cb(Error("unspent: Invalid seqno value " + seqno +
                      ", expected value between 1 and Infinity"))
    }

    ssb.get({ id: msgId, meta: true }, function (err, msg) {
      if (err) return cb(err)

      var id = msg.key
      var op = msg.value.content
      var author = msg.value.author
      if (!util.isCreate(op) && !util.isGive(op))
        return cb(new Error("unspent: Invalid message " + JSON.stringify(msg) + 
                            ", expected content with create or give " +
                            "operation"))

      if (util.isCreate(op) && author !== owner)
        return cb(new Error("unspent: Inconsistent owner " + owner + 
                            ", for create operation in " + 
                            JSON.stringify(msg, null, 2) +
                            ", owner is expected to be the same as author"))

      if (util.isGive(op) && op.receiver !== owner)
        return cb(new Error("unspent: Inconsistent owner " + owner +
                            ", for give operation in " + 
                            JSON.stringify(msg, null, 2) +
                            ", owner is expected to be the same as receiver"))

      api.valid(msg, function (err, msg) {
        if (err) return cb(err)

        pull(
          ssb.query.read({ 
            query: [{
              "$filter": {
                value: {
                  author: owner,
                  sequence: { $lt: seqno },
                  content: {
                    type: { $in: [ util.giveType, util.burnType ] },
                    tokenType: op.tokenType
                  } } } }] }),
          pull.asyncMap(function (msg_, cb) {
            api.valid(msg_, function (err, msg_) {
              if (err) return cb(null, null)

              var op_ = msg_.value.content
              for (var i = 0; i < op_.sources.length; ++i) {
                var s_ = op_.sources[i]
                if (s_.id === id) {
                  // Exploit the property that s_.id are unique,
                  // and return before checking the other sources
                  return cb(null, s_)
                }
              } 
              return cb(null, null)
            })
          }),
          pull.filter( (x) => x !== null ),
          pull.reduce(
            (unspent, s_) => unspent - s_.amount,
            op.amount, 
            function (err, unspent) {
              if (err) return cb(err)
              return cb(null, unspent, msg)
            }
          )
        )
      })
    })
  }
}

function balance (ssb, api) {
  return function balance (tokenType, owner, cb) {
    if (typeof cb !== "function")
      throw new Error("Invalid callback " + cb + 
                      ", expected callback cb(err, bal)")

    if (api._debugFlag)
      cb = wrap(cb, 2, [tokenType, owner])

    if (typeof tokenType !== "string" || 
        tokenType.length !== TOKENTYPELENGTH)
      return cb(new Error("Invalid tokenType " + tokenType +
                      ", expected string with " + TOKENTYPELENGTH + 
                      " chars"))

    if (!ref.isFeed(owner))
      return cb(new Error("Invalid owner " + owner +
                      ", expected SSB Log ID"))

    var bal = {
      type: 'tokens/' + meta['api-version'] + '/balance',
      tokenType: tokenType,
      owner: owner,
      amount: 0,
      created: [],
      received: [],
      given: [],
      burnt: [],
      unspent: {},
      missing: {
        operations: [],
        sources: {}
      },
      all: {}
    }

    pull(
      many([
        ssb.query.read({ 
          query: [{
            "$filter": {
              value: {
                author: owner,
                content: {
                  type: { $in: [ util.createType, util.giveType, util.burnType ] },
                  tokenType: tokenType
                } } } }] }),
        ssb.query.read({ 
          query: [{
            "$filter": {
              value: {
                content: {
                  type: util.giveType,
                  receiver: owner,
                  tokenType: tokenType
                } } } }] }),
      ]),
      pull.asyncMap(function (msg_, cb) {
        api.valid(msg_, function (err, msg_) {
          if (err) {
            if (err.notFound) {
              msg_.missingSources = true
              if (err.sources)  msg_.sources = err.sources
              return cb(null, msg_)
            } else return cb(null, null)
          } else return cb(null, msg_)
        })
      }),
      pull.filter( (x) => x !== null ),
      pull.drain(
        function (msg_) {
          var id_ = msg_.key
          var author_ = msg_.value.author
          var op_ = msg_.value.content
          if (msg_.missingSources) {
            if (msg_.sources) {
              for (var i = 0; i < msg_.sources.length; ++i) {
                var id = msg_.sources[i]
                bal.missing.sources[id] = true
              }
            }
            bal.missing.operations.push(id_)
          } else if (util.isCreate(op_)) {
            bal.amount += op_.amount
            bal.created.push(id_)
          } else if (util.isGive(op_)) {
            if (author_ === owner && !bal.all[id_]) {
              bal.amount -= op_.amount
              bal.given.push(id_)
            }

            if (op_.receiver === owner && !bal.all[id_]) {
              bal.amount += op_.amount
              bal.received.push(id_)
            }
          } else if (util.isBurn(op_)) {
            bal.amount -= op_.amount
            bal.burnt.push(id_)
          }
          bal.all[id_] = msg_
        },
        function (err) {
          if (err) return cb(err, bal)

          if (bal.amount === 0) return cb(null, bal)

          var positive = bal.created.concat(bal.received)
          var negative = bal.given.concat(bal.burnt)
          for (var i = 0; i < positive.length; ++i) {
            var id = positive[i]
            var msg = bal.all[id]
            var op = msg.value.content
            bal.unspent[id] = {
              id: id,
              amount: op.amount,
              tokenType: tokenType,
              timestamp: msg.timestamp 
            }
          }
          for (var i = 0; i < negative.length; ++i) {
            var id = negative[i]
            var op = bal.all[id].value.content
            for (var j = 0; j < op.sources.length; ++j) {
              var s = op.sources[j]

              if (!bal.unspent[s.id]) {
                var err = new Error("balance internal error: " +
                                    " Missing source " + s.id + 
                                    " spent by " + id)
                err.notFound = true
                return cb(err)
              }

              bal.unspent[s.id].amount -= s.amount
              if (bal.unspent[s.id].amount === 0) 
                delete bal.unspent[s.id]
            }
          }

          var sorted =  Object.values(bal.unspent)
                          .sort((s1,s2) => s1.timestamp - s2.timestamp)
          bal.unspent = {} // Put all values in order of timestamp
          sorted.forEach((s) => bal.unspent[s.id] = s)
          return cb(null, bal)
        }
      )
    )
  }
}

function operations (ssb, api) {

  return function operations (options) {
    options = options || {}

    if (typeof options !== 'object')
      throw new Error("operations: invalid options " + JSON.stringify(options + 
                          ", expected an object"))

    if (!options.match) {
      options.match = {
        operations: {
          create: true,
          give: true,
          burn: true
        }
      }
    } else if (options.match) {
      if (typeof options.match !== "object")
        throw new Error("operations: Invalid options.match " +
                            JSON.stringify(options.match) +
                            ", expected an object")

      if (options.match.author) {
        if (Array.prototype.isPrototypeOf(options.match.author)) {
          var authors = options.match.author
          for (var i = 0; i < authors.length; ++i) {
            if (!ref.isFeed(authors[i]))
              throw new Error("operations: Invalid options.match.author[" + i + "] " + 
                                  JSON.stringify(authors[i]) +
                                  ", expected valid SSB Log ID")
          }
        } else if (ref.isFeed(options.match.author)) {
          options.match.author = [ options.match.author ]
        } else {
          throw new Error("operations: Invalid options.match.author " + 
                              JSON.stringify(options.match.author) +
                              ", expected valid SSB Log ID or Array of SSB Log IDs")
        }
      }

      if (options.match.receiver) {
        if (Array.prototype.isPrototypeOf(options.match.receiver)) {
          var receivers = options.match.receiver
          for (var i = 0; i < receivers.length; ++i) {
            if (!ref.isFeed(receivers[i]))
              throw new Error("operations: Invalid options.match.receiver[" + i + "] " + 
                                  JSON.stringify(receivers[i]) +
                                  ", expected valid SSB Log ID")
          }
        } else if (ref.isFeed(options.match.receiver)) {
          options.match.receiver = [ options.match.receiver ]
        } else {
          throw new Error("operations: Invalid options.match.receiver " + 
                              JSON.stringify(options.match.receiver) +
                              ", expected valid SSB Log ID or Array of SSB Log IDs")
        }
      }

      if (options.match.participant) {
        if (options.match.author || options.match.receiver)
          throw new Error("operations: Invalid use of options.match.participant"+
                              " at the same time as options.match.author or " +
                              " options.match.receiver, only one or the others " +
                              " should be used.")

        if (Array.prototype.isPrototypeOf(options.match.participant)) {
          var participants = options.match.participant
          for (var i = 0; i < participants.length; ++i) {
            if (!ref.isFeed(participants[i]))
              throw new Error("operations: Invalid options.match.participant[" + i + "] " + 
                                  JSON.stringify(participants[i]) +
                                  ", expected valid SSB Log ID")
          }
        } else if (ref.isFeed(options.match.participant)) {
          options.match.participant = [ options.match.participant ]
        } else {
          throw new Error("operations: Invalid options.match.participant " + 
                              JSON.stringify(options.match.participant) +
                              ", expected valid SSB Log ID or Array of SSB Log IDs")
        }
      }

      if (options.match.operations) {
        if (typeof options.match.operations !== "object")
          throw new Error("operations: Invalid options.match.operations " +  
                              JSON.stringify(options.match.operations) +
                              ", expected an object")

        if (options.match.operations.hasOwnProperty('create') &&
            !!options.match.operations.create !== options.match.operations.create)
          throw new Error("operations: Invalid options.match.operations.create " +
                              JSON.stringify(options.match.operations.create) +
                              ", expected a boolean")

        if (options.match.operations.hasOwnProperty('give') &&
            !!options.match.operations.give !== options.match.operations.give)
          throw new Error("operations: Invalid options.match.operations.give " +
                              JSON.stringify(options.match.operations.give) +
                              ", expected a boolean")

        if (options.match.operations.hasOwnProperty('burn') &&
            !!options.match.operations.burn !== options.match.operations.burn)
          throw new Error("operations: Invalid options.match.operations.burn " +
                              JSON.stringify(options.match.operations.burn) +
                              ", expected a boolean")

        options.match.operations = { 
          create: !!options.match.operations.create,
          give: !!options.match.operations.give,
          burn: !!options.match.operations.burn
        }
      } else {
        options.match.operations = {
          create: true,
          give: true,
          burn: true
        }
      }


      if (options.match.tokenType && 
          typeof options.match.tokenType !== "string")
        throw new Error("operations: Invalid options.match.tokenType " +
                             JSON.stringify(options.match.tokenType) +
                            ", expected a string")
    } 

    options.valid = options.hasOwnProperty('valid') ? options.valid : true
    options.invalid = options.hasOwnProperty('invalid') ? options.invalid : false

    if (typeof options.valid !== "boolean")
      throw new Error("operations: Invalid options.valid " + 
                          JSON.stringify(options.valid) +
                          ", expected a boolean")

    if (typeof options.invalid !== "boolean")
      throw new Error("operations: Invalid options.invalid " + 
                          JSON.stringify(options.invalid) +
                          ", expected a boolean")

    if (!options.valid && !options.invalid)
      throw new Error("operations: options.valid and options.invalid are false, " + 
                      "no messages to return")

    options.old = options.hasOwnProperty('old') ? options.old : true
    options.live = options.hasOwnProperty('live') ? options.live : false

    if (typeof options.old !== "boolean")
      throw new Error("operations: Invalid options.old " + 
                          JSON.stringify(options.old) +
                          ", expected a boolean")

    if (typeof options.live !== "boolean")
      throw new Error("operations: Invalid options.live " +
                          JSON.stringify(options.live) +
                          ", expected a boolean")

    options.sync = options.hasOwnProperty('sync') ? options.sync : false

    if (options.sync && ! options.live)
      throw new Error("operations: If options.sync is true, options.live " +
                      " should be true as well.")

    var types = []
    if (options.match.operations.create)
      types.push(util.createType)
    if (options.match.operations.give)
      types.push(util.giveType)
    if (options.match.operations.burn)
      types.push(util.burnType)

    var f1 = { value: { content: { type: { $in: types } } } }
    var f2 = null

    if (options.match.participant) {
      // Add participants to matching authors
      options.match.author = (options.match.author || [])
                             .concat(options.match.participant)

      if (options.match.operations.give) {
        // Separately test for receivers (a participant is either
        // an author OR a receiver)
        var f2 = { value: { content: { type: util.giveType } } }

        f2.value.content.receiver = { $in: options.match.participant }
      }     
    }

    if (options.match.author)
      f1.value.author = { $in: options.match.author }

    if (options.match.receiver)
      f1.value.content.receiver = { $in: options.match.receiver }

    // Add participant filtering to remove duplicates matches
    var authors = {}
    if (options.match.author)
      options.match.author
        .forEach((author) => authors[author] = true)
    var participants = {}
    if (options.match.participant)
      options.match.participant
        .forEach((participant) => participants[participant] = true)

    if (options.match.tokenType) {
      f1.value.content.tokenType = { $in: options.match.tokenType }

      if (f2) f2.value.content.tokenType = { $in: options.match.tokenType } 
    }


    // Optimizations for faster matching
    function matchOne (prop) {
      if(prop["$in"].length === 1)
        return prop["$in"][0]
      else
        return prop
    }

    if (f1.value.author)
      f1.value.author = matchOne(f1.value.author)
    if (f2 && f2.value.content.receiver) 
      f2.value.content.receiver = matchOne(f2.value.content.receiver)
    if (f1.value.content.tokenType)
      f1.value.content.tokenType = matchOne(f1.value.content.tokenType)
    if (f2 && f2.value.content.tokenType) 
      f2.value.content.tokentType = matchOne(f2.value.content.tokenType)

    var q1 = { 
      query: [
        { $filter: f1 }
      ], 
      live: options.live, 
      old: options.old,
      sync: options.sync
    }
    var q2 = f2 && { 
      query: [
        { $filter: f2 }
      ], 
      live: options.live, 
      old: options.old,
      sync: options.sync
    }

    if (options.debug) {
      ssb.query.explain(q1, function (err, s) { 
        if (err) {
          console.error("ssb.query.explain error: ")
          console.error(err)
        } else {
          console.error("Author/Receiver Main Query:")
          console.error(s)
        }
      })
      ssb.query.explain(q2, function (err, s) { 
        if (err) {
          console.error("ssb.query.explain error: ")
          console.error(err)
        } else {
          console.error("Participant Secondary Query:")
          console.error(s)
        }
      })
    }

    var source = null
    if (!q2)
      source = ssb.query.read(q1)
    else {
      source = many([
        ssb.query.read(q1),
        pull(
          ssb.query.read(q2),
          pull.filter((msg) => !(authors[msg.value.author] && 
                                 participants[msg.value.content.receiver]))
        )
      ])
    }

    if (options.sync) {
      var syncRemaining = q2 ? 2 : 1
      source = pull(
        source,
        pull.filter((msg) => !msg.sync || (msg.sync && syncRemaining-- === 1))
      )
    }

    // Add validation check
    var source = pull(
      source,
      pull.asyncMap(function (msg, cb) {
        if (msg.sync)
          return cb(null, msg)
        else
          return api.valid(msg, function (err, msg) {
            if (err) msg.invalid = err
            else msg.valid = true
            return cb(null, msg)
          })
      }),
      pull.filter(function (msg) {
        if (msg.sync) return true
        else if (options.valid && msg.valid) return true
        else if (options.invalid && msg.invalid) return true
        else return false
      })
    )

    return source
  }
}

function identities (ssb, api) {

  function usedId (opts) {
    var tokenType = opts.tokenType

    var f1 = {
      value: {
        content: {
          type: { $in: [ util.createType, util.giveType, util.burnType ] }
        } } }

    var f2 = {
      value: {
        content: {
          type: util.giveType
    } } }

    if (tokenType) {
      f1.value.content.tokenType = tokenType
      f2.value.content.tokenType = tokenType
    }

    var q1 = { query: [{ "$filter": f1 }], limit: 1 }
    var q2 = { query: [{ "$filter": f2 }], limit: 1 }


    return pull(
      pull.asyncMap(function (id, cb) {
        f1.value.author = id
        f2.value.content.receiver = id

        pull(
          source =  many([
            ssb.query.read(q1),
            ssb.query.read(q2),
          ]),
          pull.take(1),
          pull.collect(function (err, ary) {
            if (err) return cb(err)
            else if (ary.length === 0)
              return cb(null, null)
            else
              return cb(null, id)
          })
        )
      }),
      pull.filter((id) => id !== null)
    )
  }

  function used (opts) {
    var tokenType = opts.tokenType

    var f1 = {
      value: {
        content: {
          type: { $in: [ util.createType, util.giveType, util.burnType ] }
        } } }

    var f2 = { value: { content: { type: util.giveType } } }

    if (tokenType) {
      f1.value.content.tokenType = tokenType 
      f2.value.content.tokenType = tokenType
    }

    return pull(
      many([
        ssb.query.read({
          query: [
            // Obtain unique author ids
            { $filter: f1 },
            { $reduce: { 'id': ['value', 'author'] } },
            { $map: 'id' }
          ]
        }),
        ssb.query.read({
          query: [
            // Obtain unique receiver ids
            { $filter: f2 },
            { $reduce: { 'id': ['value', 'content', 'receiver' ] } },
            { $map: 'id' }
          ]
        })
      ]),
      pull.unique()
    )
  }

  function alias (opts, cb) {
    var author = opts.author
    var id = opts.id
    var name = opts.name

    if (!name || (typeof name !== "string"))
      return cb(new Error("Invalid name " + name + 
                          ", expected a string"))

    if (!ref.isFeedId(id))
      return cb(new Error("Invalid id " + id +
                          ", expected a SSB Log ID"))

    if (author && !ref.isFeedId(author))
      return cb(new Error("Invalid author " + author +
                          ", expected a SSB Log ID"))

    if (opts.author) 
      ssb.identities.publishAs({
        id: author,
        content: {
          type: 'about',
          about: id,
          name: name
        },
        private: false
      }, cb)
    else 
      ssb.publish({
        type: 'about',
        about: id,
        name: name
      }, cb)
  }

  function create (opts, cb) {
    cb = cb || opts

    if (typeof opts === "undefined")
      opts = {}

    if (opts.alias && typeof opts.alias !== "string")
      return cb(new Error("Invalid alias " + args.alias + 
                          ", expected a string"))

    if (!ssb.identities) {
      return cb(new Error("Install ssb.identities " +
                          "(https://github.com/ssbc/ssb-identities) " +
                          "in ssb-server to create an identity."))
    }
      

    ssb.identities.create(function (err, id) {
      if (err) return cb(err)

      if (opts.alias) {
        alias({ 
          name: opts.alias,
          author: id,
          id: id
        }, function (err, msg) {
          if (err) return cb(err)
          return cb(null, { 
            author: msg.value.author, 
            id: msg.value.content.about, 
            name: msg.value.content.name})
        })
      } else {
        return cb(null, { id: id })
      }
    })
  }

  function list (opts, cb) {
    cb = cb || opts

    if (typeof cb === "object")
      cb = null

    if (typeof opts === "function" ||
        !opts)
      opts = {}

    if (opts.tokenType) 
      opts.used=true

    var source = null
    if (opts.used) {
      if (!opts.own) {
        source = used(opts)
      } else {
        source = defer.source()

        ssb.identities.list(function (err, ids) {
          if (err) source.resolve(pull.error(err))
          else source.resolve(pull.values(ids))
        })

        source = pull(
          source,
          usedId({ tokenType: opts.tokenType })
        )
      }
    } else {
      source = defer.source()

      ssb.identities.list(function (err, ids) {
        if (err) source.resolve(pull.error(err))
        else source.resolve(pull.values(ids))
      })

      // Traverse all messages to find other ids
      if (!opts.own) {
        source = pull(
          many([
            source, 
            pull(
              ssb.query.read({
                query: [
                  // Obtain unique author ids
                  { $reduce: { id: ['value', 'author'] } },
                  { $map: 'id' }
                ]
              }),
            ),
            ssb.links2.read({
              query: [ 
                // Obtain unique destination ids
                { $filter: { dest: { $prefix: '@' } } },
                { $reduce: { id: [ 'dest' ] } },
                { $map: 'id' },
              ]
            })
          ]),
          pull.unique()
        )
      }
    }

    if (cb) {
      pull(
        source,
        pull.collect(cb)
      )
    } else 
      return source
  }

  function follow (followee, opts, cb) {
    if (!ref.isFeed(followee))
      return cb(new Error("identities.follow: Invalid log ID " + followee +
                          ", expected an SSB Log ID")) 

    if (opts.author && !ref.isFeed(opts.author))
      return cb(new Error("identities.follow: Invalid opts.author " + opts.author +
                          ", expected an SSB Log ID")) 

    cb = cb || opts

    if (typeof opts === 'function')
      opts = {}

    content = {
      type: 'contact',
      contact: followee,
      following: true
    }
  
    if (opts.author) 
      ssb.identities.publishAs({
        id: author,
        content: content,
        private: false
      }, cb)
    else 
      ssb.publish(content, cb)
  }

  return {
    alias: alias,
    create: create,
    follow: follow,
    list: list

  }
}

// Return the "tangle", i.e. directed acyclic graph of sources from operation
// 'id' to the roots, as a dictionary { id: { src1: true, ... }, ... }
function ancestors (ssb, api) {
  return function ancestors (sources, opts, cb) {
    var tangle = { }
    var queue = [ ]
    var notfound = [ ]
    var count = 0

    cb = cb || opts
    if (typeof cb !== "function")
      throw new Error("Invalid callback " + cb +
                      ", expected a function with signature " +
                      "cb(err, tangle)")

    if (api._debugFlag)
      cb = wrap(cb, 2, [sources])

    if (typeof opts === "function")
      opts = {}

    opts.recurse = typeof opts.recurse === 'undefined' ? true : opts.recurse

    if (!Array.prototype.isPrototypeOf(sources))
      sources = [ sources ]

    // Support both direct Message Ids and the source format, e.g. { id: MsgId }, 
    // of create and give operations
    sources.forEach(function (s) {
      var id = s.id || s
      tangle[id] = {}
      queue.push(id)
    })

    function next () {
      if (queue.length === 0) {
        if (count !== Object.keys(tangle).length)
          return cb(new Error("Internal implementation error"))

        if (notfound.length > 0) {
          var err = new Error("Sources not found: " + 
                               JSON.stringify(notfound))
          err.notFound = true
          err.sources = notfound
          err.tangle = tangle
          return cb(err, tangle)
        } else {
          return cb(null, tangle)
        }
      }

      var id = queue.pop()
      ssb.get({ id: id, meta: true }, function (err, msg) {
        count += 1

        if (err) { 
          if (err.notFound) {
            notfound.push(id)
            tangle[id] = false

            // Queue next with the event queue,
            // otherwise errors thrown inside recursive
            // calls are caught by ssb.get
            return setImmediate(next)
          } else {
            var err_ =  new Error("Error retrieving message " + id +
                                  ": \n" + err.message)
            console.error(err_)
            err_.err = err
            return cb(err_)
          }
        }

        var op = msg.value.content
        if (!util.isOp(op)) {
          var err = new Error("Invalid operation " + JSON.stringify(op))
          err.invalid = true
          return cb(err)
        }

        if (opts.recurse && op.sources) {
          op.sources.forEach(function (s) {
            var sId = s.id || s
            if (!tangle[sId]) {
              tangle[sId] = {}
              queue.push(sId)
            }
            
            tangle[id][sId] = s.amount || true
          })
        }

        // Queue next with the event queue,
        // otherwise errors thrown inside recursive
        // calls are caught by ssb.get
        return setImmediate(next)
      })
    }

    next()
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
  return function create (amount, options, cb) {
    if (typeof cb !== 'function') {
      throw new Error("tokens.create: Invalid callback of type '" + 
                       (typeof cb) + "', " +
                      " expected function with signature " +
                      "cb(err,msg)")
    }
    if (api._debugFlag)
      cb = wrap(cb, 2, [amount,options])

    if (typeof options === 'string') {
      options = { name: options }
    }

    if (typeof options !== 'object') {
      return cb(new Error("create: Invalid options '" + 
                       (typeof options) + "'"))
    }

    if (options.author) {
      if (!ref.isFeed(options.author)) {
        return cb(new Error("create: Invalid options.author, " +
                            "expected SSB Log ID instead of '" + 
                             options.author + "'."))
      }

      if (!ssb.identities) {
        return cb(new Error("Install ssb.identities " +
                            "(https://github.com/ssbc/ssb-identities) " +
                            "in ssb-server to specify another author."))
      }
    }
    
    // Get author log id
    ssb.whoami(function (err, log) {
      if (err) return cb(err)

      var author = options.author || log.id 

      // Create op
      var createOp = {
        type: util.createType,
        amount: amount,
        name: options.name,
        unit: options.unit || '',
        decimals: options.decimals || 0,
        description: options.description || null
      }
      createOp.tokenType = api.tokenType(author, createOp)

      var msgValue = {
        author: author,
        content: createOp
      }

      api.validate.requirements.create(msgValue, function (err) {
        if (err) return cb(err)  

        function done (err, msg) {
          if (err) return cb(err)
          cb(null, msg)
        }

        if (!(options.author) && author == log.id) {
          ssb.publish(createOp, done)
        } else {
          ssb.identities.publishAs({ 
            id: author,
            content: createOp,
            private: false
          }, done)
        }
      })
    })
  }
}

function checkSource(s) {
  if (typeof s === 'object') {
    if (typeof s.amount !== 'undefined' && 
        typeof s.amount !== 'number' &&
        typeof s.amount !== 'null') 
      return new Error("Invalid source amount " + s.amount + " for source " + 
                        JSON.stringify(s) + 
                        ", expected number instead of " + typeof s.amount)

    if (s.id && !ref.isMsgId(s.id))
      return new Error("Invalid source id " + s.id + " for source " +
                        JSON.stringify(s) +
                        ", expected SSB_MESSAGE_ID ")

    if (s.tokenType && typeof s.tokenType !== "string")
      return new Error("Invalid source token type " + s.tokenType + 
                       " for source " + JSON.stringify(s) +
                        ", expected string")

    if (!s.id && !s.tokenType) 
      return new Error("Invalid source " + JSON.stringify(s) +
                        ", expected either 'id' or 'tokenType'")

    return null
  } else return new Error("Invalid source " + JSON.stringify(s) +
                          ", expected object instead of " + typeof s)
}

function give (ssb,api)  {
  return function give (sources, receiver, options, cb) {

    // Type and Syntactic Validation
    cb = cb || options
    if (typeof cb !== 'function') 
      throw new Error("Invalid callback of type '" + (typeof cb) +
                      ", expected a function with signature cb(err, msg)")

    if (api._debugFlag)
      cb = wrap(cb, 2, [sources, receiver, options])
    
    if (typeof sources === 'string') {
      if (!ref.isMsgId(sources)) {
        return cb(new Error("Invalid source " + JSON.stringify(sources) +
                        ", expected SSB Message ID"))
      }
      // 'null' will be replaced by unspent from source
      sources = [ { amount: null, id: sources } ]     
    } else if (Array.prototype.isPrototypeOf(sources) && sources.length > 0) {
      for (var i = 0; i < sources.length; ++i) {
        var s = sources[i]
        var err = checkSource(s)
        if (err !== null) return cb(err)
      }
    } else {
      var err = checkSource(sources)
      if (err !== null) return cb(err)
      sources = [ sources ]
    }

    if (!ref.isFeed(receiver))
      return cb(new Error("Invalid receiver " + JSON.stringify(receiver) + 
                      ", expected a SSB Log ID"))

    if (typeof options === 'function') 
      options = {}
    
    if (typeof options !== 'object' )
      return cb(new Error("Invalid options " + JSON.stringify(options) +
                      ", expected an object"))

    options.author = options.author || null
    if (options.author) {
      if (!ref.isFeed(options.author))
        return cb(new Error("Invalid options.author " +
                        JSON.stringify(options.author) +
                        ", expected SSB Log ID"))

      if (!ssb.identities)
        return cb(new Error("Install ssb.identities " +
                        "(https://github.com/ssbc/ssb-identities) " +
                        " in ssb-server to specify another author."))
    }

    ssb.whoami(function (err, author) {
      if (err) return cb(new Error("Error retrieving default author: \n" + 
                                   err.message))

      author = options.author || author.id

      pull(
        pull.values(sources),
        pull.asyncMap(function (s, cb) {
          if (ref.isMsgId(s)) {
            api.unspent(s, author, function (err, unspent, msg) {
              if (err) return cb(new Error("Error retrieving unspent tokens " +
                                           "for source " + s + 
                                           " with owner " + author + ": \n" + 
                                           err.message))

              var op = msg.value.content
              return cb(null, { 
                amount: unspent, 
                id: s , 
                tokenType: op.tokenType
              })
            })
          } else if (s.id) {
            api.unspent(s.id, author, function (err, unspent, msg) {
              if (err) return cb(new Error("Error retrieving unspent tokens " +
                                           "for source " + s.id + 
                                           " with owner " + author + ": \n" + 
                                           err.message ))

              var op = msg.value.content
              return cb(null, { 
                amount: s.amount || unspent, 
                id: s.id,
                tokenType: op.tokenType
              })
            })
          } else if (s.tokenType) {
            api.balance(s.tokenType, author, function (err, bal) {
              if (err) return cb(new Error("Error retrieving balance for " + 
                                           s.tokenType + " with owner " + 
                                           author + ": \n" + err.message))

              if (!s.amount) return cb(null, Object.values(bal.unspent))

              var requested = s.amount
              var sources = []
              Object.values(bal.unspent).forEach(function (s_) {
                if (requested > 0) {
                  var amount = Math.min(requested, s_.amount)
                  requested -= amount
                  sources.push({ 
                    amount: amount, 
                    id: s_.id, 
                    tokenType: s_.tokenType 
                  })
                }
              })

              if (requested > 0)
                return cb(new Error("Insufficient unspent amounts of " + 
                                    "token type " + s.tokenType +
                                    " in remaining sources " + 
                                    JSON.stringify(Object.values(bal.unspent)) +
                                    " to fulfill the requested amount of " + 
                                    s.amount))

              return cb(null, sources)
            })
          } else {
            return cb(new Error("Unsupported source " + JSON.stringify(s)))
          }
        }),
        pull.collect(function (err, ary) {
          if (err) return cb(err) 

          var _sources = flatten(ary)

          if (_sources.length === 0)
            return cb(new Error("Invalid requested sources " + 
                                JSON.stringify(sources) + 
                                ", no operation found"))

          var msgValue = {
            author: author,
            content: {
              type: "tokens/" + meta['api-version'] + "/give",
              sources: _sources.map((s) => ({ 
                amount: s.amount, 
                id: s.id 
              }) ),
              amount: _sources.map((s) => s.amount).reduce(sum,0),
              receiver: receiver,
              description: options.description || null,
              tokenType: _sources[0].tokenType
            }
          }
          
          api.validate.requirements(msgValue, function (err, msgValue) {
            if (err) return cb(new Error("Error validating message value " + 
                                          JSON.stringify(msgValue, null, 2) + 
                                         ": \n" + err.message))

            if (!options.author) {
              ssb.publish(msgValue.content, cb)
            } else {
              ssb.identities.publishAs({ 
                id: options.author,
                content: msgValue.content,
                private: false
              }, cb)
            }
          })
        })
      )
    })
  }
}

function burn (ssb,api)  {
  return function (sources, options, cb) {
    cb = cb || options

    // Type and Syntactic Validation
    cb = cb || options
    if (typeof cb !== 'function') 
      throw new Error("Invalid callback of type '" + (typeof cb) +
                      ", expected a function with signature cb(err, msg)")

    if (api._debugFlag)
      cb = wrap(cb, 2, [sources, options])
    
    if (typeof sources === 'string') {
      if (!ref.isMsgId(sources)) {
        return cb(new Error("Invalid source " + JSON.stringify(sources) +
                        ", expected SSB Message ID"))
      }
      // 'null' will be replaced by unspent from source
      sources = [ { amount: null, id: sources } ]     
    } else if (Array.prototype.isPrototypeOf(sources) && sources.length > 0) {
      var sources = sources.slice(0) // Avoid modifying input array
      for (var i = 0; i < sources.length; ++i) {
        var s = sources[i]
        if (ref.isMsgId(s)) {
          s = { id: s }
          sources[i] = s
        }
        var err = checkSource(s)
        if (err !== null) return cb(err)
      }
    } else {
      var err = checkSource(sources)
      if (err !== null) return cb(err)
      sources = [ sources ]
    }

    if (typeof options === 'function') 
      options = {}
    
    if (typeof options !== 'object' )
      return cb(new Error("Invalid options " + JSON.stringify(options) +
                      ", expected an object"))

    options.author = options.author || null
    if (options.author) {
      if (!ref.isFeed(options.author))
        return cb(new Error("Invalid options.author " + 
                        JSON.stringify(options.author) +
                        ", expected SSB Log ID"))

      if (!ssb.identities)
        return cb(new Error("Install ssb.identities " +
                        "(https://github.com/ssbc/ssb-identities) " +
                        " in ssb-server to specify another author."))
    }

    ssb.whoami(function (err, author) {
      if (err) return cb(new Error("Error retrieving default author: \n" + 
                                   err.message))

      author = options.author || author.id

      pull(
        pull.values(sources),
        pull.asyncMap(function (s, cb) {
          api.unspent(s.id, author, function (err, unspent, msg) {
            if (err) return cb(new Error("Error retrieving unspent tokens " +
                                         "for " + s.id + 
                                          " with owner " + author + ": \n" + 
                                         err.message))

            var op = msg.value.content
            var adjective = (unspent === 0) ? 'completely' : 'partially'
            if (unspent !== op.amount)
              return cb(new Error("Invalid source " + s.id +
                                  " for burning, already " + adjective + 
                                  " spent"))

            return cb(null, { 
              amount: unspent, 
              id: s.id , 
              tokenType: op.tokenType
            })
          })
        }),
        pull.collect(function (err, ary) {
          if (err) return cb(err) 

          var _sources = flatten(ary)

          if (_sources.length === 0)
            return cb(new Error("Invalid requested sources " + 
                                JSON.stringify(sources) + 
                                ", no operation found"))

          var msgValue = {
            author: author,
            content: {
              type: "tokens/" + meta['api-version'] + "/burn",
              sources: _sources.map((s) => ({ 
                amount: s.amount, 
                id: s.id 
              }) ),
              amount: _sources.map((s) => s.amount).reduce(sum,0),
              description: options.description || null,
              tokenType: _sources[0].tokenType
            }
          }
          
          api.validate.requirements(msgValue, function (err, msgValue) {
            if (err) return cb(new Error("Error validating message value " + 
                                          JSON.stringify(msgValue, null, 2) + 
                                         ": \n" + err.message))

            if (!options.author) {
              ssb.publish(msgValue.content, cb)
            } else {
              ssb.identities.publishAs({ 
                id: options.author,
                content: msgValue.content,
                private: false
              }, cb)
            }
          })
        })
      )
    })
  }
}


function valid (ssb, api) {
  var invalidCache = {}
  var validCache = {}
  
  function valid (msg, options, cb) {
    cb = cb || options
    if (api._debugFlag)
      cb = wrap(cb, 2, [msg, options])

    if (typeof options === "function") {
      options = {}
    }

    if (!msg.key || !msg.value) 
      return cb(Error("Invalid message object, should have a 'key'" +
                      " and a 'value' property"), msg)

    var expected = "%" + ssbKeys.hash(JSON.stringify(msg.value, null, 2))
    if (expected !== msg.key)
      return cb(Error("Inconsistent msg.key and msg.value," +
                      " key was " + msg.key + " but expected " + expected), msg)

    var err = reqMsg(msg.value)
    if (err) return cb(err, msg)

    if (!util.isOp(msg.value.content))
      return cb(new Error("Invalid msg value " + 
                           JSON.stringify(msg.value) + 
                          ", expected an ssb-tokens operation"), msg)

    if (invalidCache[msg.key])
      return cb(new Error("Invalid " + msg.key + ", invalidated previously."), msg)

    // TODO: Handle forks once SSB supports it, for now 
    //       invalid messages from forks are stored in the same way
    //       Maybe ssb-ooo can retrieve forked messages?
    
    // TODO: Optimize memory usage with validation frontier
    //var author = msg.value.author
    //if (frontier[author].value.sequence >= msg.value.sequence)
    //  return cb(null, msg)  // Msg is valid
    
    if (validCache[msg.key])
      return cb(null, msg)

    api.validate.requirements(msg.value, function (err) {
      if (err) {
        if (err.notFound) return cb(err, msg)

        if (msg.key) 
          invalidCache[msg.key] = true
        return cb(err, msg)
      } else {
        validCache[msg.key] = true
        return cb(null, msg)
      }
    })
  }

  return {
    method: valid,
    cache: {
      validated: function (msg) { 
        return validCache[msg.key] || invalidCache[msg.key]
      },
      clear: function (msg) {
        validCache = {}
        invalidCache = {}
      },
      serialize: function () {
        return JSON.stringify({
          validCache: validCache,
          invalidCache: invalidCache
        }, null, 2)
      },
      restore: function (str) {
        var cache = JSON.parse(str) 
        
        if (!cache.validCache || !cache.invalidCache)
          throw new Error("Invalid restoration string," +
                          "expected 'validCache' and 'invalidCache' " +
                          "properties")

        validCache = cache.validCache
        invalidCache = cache.invalidCache
      }
    }
  }
}

var meta = {
  name: "tokens",
  version: "0.1.0",
  "api-version": util['api-version'],
  manifest: {
    ancestors: 'async',
    balance: 'async', 
    burn: 'async',
    create: 'async', 
    debug: 'sync',
    give: 'async',
    help: 'sync',
    operations: 'source',
    identities: {
      alias: 'async',
      create: 'async',
      follow: 'async',
      list: 'async'
    },
    types: 'async',
    valid: 'async',
    validate: {
      format: 'sync',
      requirements: 'async'
    }
  },
  init: function (ssb, config) {
    if (!ssb.query) throw new Error("ssb.query " +
                                    "(https://github.com/ssbc/ssb-query) " +
                                    "is required on ssb-server.")

    // Set properties first to preserve lexicographic order
    var api = {
      ancestors: null,
      balance: null,
      burn: null,
      create: null,
      debug: null,
      _debugFlag: false,
      flag: null,
      give: null,
      help: null,
      identities: null,
      operations: null,
      tokenType: null,
      trace: null,
      unflag: null,
      unspent: null,
      valid: null,
      validate: {}
    }
    api['create'] = create(ssb,api)
    api['debug'] = function (bool) { api._debugFlag = !!bool }
    api['give'] = give(ssb,api)
    api['burn'] = burn(ssb,api) 
    api['balance'] = balance(ssb,api)
    api['identities'] = identities(ssb,api)
    api['operations'] = operations(ssb,api)
    api['types'] = types(ssb,api)
    api['unspent'] = unspent(ssb,api)
    var validObj = valid(ssb,api)
    api['valid'] = validObj.method 
    api['validate'].cache = validObj.cache
    api['validate'].format = format(ssb,api)
    api['validate'].requirements = requirements(ssb,api)


    api['flag'] = function (cb) { return cb(null)  }
    api['help'] = function () { return { 
        description: 'Tokens for community economics.', 
        commands: {} 
    } } 
    api['trace'] = function (cb) { return cb(null)  }
    api['unflag'] = function (cb) { return cb(null)  }
    api['tokenType'] = tokenType
    api['ancestors'] = ancestors(ssb,api)

    return api
  }
}

module.exports = meta
