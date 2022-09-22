var util = require('../src/util')

function create (ssb, msgValue, options, cb) {
  var op = msgValue.content
  var creator = msgValue.author

  function format(creator, op) {
    var str = creator + " created " + op.amount + 
              " " + JSON.stringify(op.name) + " "

    if (op.unit) 
      str += "denominated in " + op.unit + " "

    if (op.decimals)
      str += "divisible to " + op.decimals + " decimals " 

    if (op.description)
      str += "associated to promise " + op.description + " "

    str += "(tokenType: " + op.tokenType + ")."
    return str
  }

  if (typeof options.alias === 'undefined' || options.alias) {
    ssb.about.socialValue({ key: 'name', dest: creator }, function (err, name) {
      if (err) return cb(err)

      if (name) 
        return cb(null, format('@'+name, op))
      else
        return cb(null, format(creator, op))
    })
  } else {
    return cb(null, format(creator, op))
  }
}

function give (ssb, msgValue, options, cb) {
  var op = msgValue.content
  var giver = msgValue.author
  var receiver = op.receiver
  var tokenName = ''

  function format(giver, name, receiver, op) {
    var str = giver + " gave " + op.amount + ' ' + tokenName +
              " to " + receiver + " "

    if (op.description)
      str += "with description " + op.description + " "

    str += "(tokenType: " + op.tokenType + ")."
    return str
  }

  if (typeof options.alias === 'undefined' || options.alias) {
    ssb.about.socialValue({ key: 'name', dest: giver}, function (err, name) {
      if (err) return cb(err)
      if (name) giver = "@" + name

      ssb.about.socialValue({ key: 'name', dest: receiver}, function (err, name) {
        if (err) return cb(err)
        if (name) receiver = "@" + name

        ssb.tokens.types({ match: { tokenType: op.tokenType } }, function (err, tt) {
          if (err) return cb(err)
          
          tokenName = JSON.stringify(tt[op.tokenType].name)
          return cb(null, format(giver, tokenName, receiver, op))
        })
      })
    })
  } else {
    return cb(null, format(giver, tokenName, receiver, op))
  }
}

function burn (ssb, msgValue, options, cb) {
  var op = msgValue.content
  var burner = msgValue.author
  var tokenName = ''

  function format(burner, tokenName, op) {
    var str = burner + " burnt " + op.amount + " "

    if (tokenName !== '')
      str += tokenName + ' '

    if (op.description)
      str += "with description " + op.description + " "

    str += "(tokenType: " + op.tokenType + ")."
    return str
  }

  if (typeof options.alias === 'undefined' || options.alias) {
    ssb.about.socialValue({ key: 'name', dest: burner}, function (err, name) {
      if (err) return cb(err)
      if (name) burner = "@" + name

      ssb.tokens.types({ match: { tokenType: op.tokenType } }, function (err, tt) {
        if (err) return cb(err)
        
        tokenName = JSON.stringify(tt[op.tokenType].name)
        return cb(null, format(burner, tokenName, op))
      })
    })
  } else {
    return cb(null, format(burner, tokenName, op))
  }
}

module.exports = function humane (ssb, msg, options, cb) {
  if (!msg.value) 
    return cb(new Error('Invalid message ' + JSON.stringify(msg))) 

  var op = msg.value.content
  if (util.isCreate(op)) return create(ssb, msg.value, options, cb)
  else if (util.isGive(op)) return give(ssb, msg.value, options, cb)
  else if (util.isBurn(op)) return burn(ssb, msg.value, options, cb)
  else throw new Error("Unimplemented " + JSON.stringify(op))
}
