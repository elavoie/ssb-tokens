var tape = require('tape')
var meta = require('../')
var util = require('util')
var ref = require('ssb-ref')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var debug = require('debug')

module.exports = function run (ssb) {
  var log = debug('ssb-tokens:test')
  var newID = util.promisify(ssb.identities.create)
  var create = util.promisify(ssb.tokens.create)
  var give = util.promisify(ssb.tokens.give)
  var burn = util.promisify(ssb.tokens.burn)
  var list = util.promisify(ssb.tokens.list)

  tape('create', function (t) {
    var creator = null
    var receiver = null
    var currency = 'Listed Shells'
    var msg = null
    newID().then( (id) => { creator = id; t.ok(ref.isFeed(creator)) } )
    .then( () => newID() )
    .then( (id) => { receiver = id; t.ok(ref.isFeed(receiver)) } )
    .then( () => create(10, currency, { owner: creator }) )
    .then( (_msg) => { 
      msg = _msg; 
      t.ok(msg.id);
    })
    .then( () => list({ owner: creator }) )
    .then( (tokens) => {
      log('create tokens')
      log(tokens)
      t.ok(tokens)
      t.equal(tokens.length, 1)
      t.equal(tokens[0].owner, creator)
      t.equal(tokens[0].currency, currency)
      t.equal(tokens[0].balance, 10)    
      t.equal(tokens[0].created[0].amount, 10)    
      t.equal(tokens[0].created[0].unspent, 10)    
      t.end()
    })
  })

  tape('create+give', function (t) {
    var creator = null
    var receiver = null
    var currency = 'Listed Shells'
    var msg = null
    newID().then( (id) => { creator = id; t.ok(ref.isFeed(creator)) } )
    .then( () => newID() )
    .then( (id) => { receiver = id; t.ok(ref.isFeed(receiver)) } )
    .then( () => create(10, currency, { owner: creator }) )
    .then( () => list({ owner: creator }) )
    .then( (tokens) => {
      t.ok(tokens)
      return give([ { amount: 1, id: tokens[0].created[0].id } ], receiver, { owner: creator }) 
    })
    .then( () => list({ owner: creator }) )
    .then( (tokens) => {
      t.ok(tokens)
      t.equal(tokens.length, 1)
      t.equal(tokens[0].owner, creator)
      t.equal(tokens[0].currency, currency)
      t.equal(tokens[0].balance, 9)    
      t.equal(tokens[0].created.length, 1)    
      t.equal(tokens[0].created[0].amount, 10)    
      t.equal(tokens[0].created[0].unspent, 9)    
      t.equal(tokens[0].given.length, 1)
      t.equal(tokens[0].given[0].amount, 1)
    })
    .then( () => list({ owner: receiver }) )
    .then( (tokens) => {
      log('create+give tokens')
      log(tokens)
      t.ok(tokens)
      t.equal(tokens.length, 1)
      t.equal(tokens[0].owner, receiver)
      t.equal(tokens[0].currency, currency)
      t.equal(tokens[0].balance, 1)    
      t.equal(tokens[0].received.length, 1)
      t.equal(tokens[0].received[0].amount, 1)    
      t.equal(tokens[0].received[0].unspent, 1)    
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('create+burn', function (t) {
    var creator = null
    var currency = 'Listed Shells'
    var msg = null
    newID()
    .then( (id) => create(10, currency, { owner: creator=id }) )
    .then( () => list({ owner: creator }) )
    .then( (tokens) =>  burn(tokens[0].created[0].id, { owner: creator }) )
    .then( (msg) => log(msg) )
    .then( () => list({ owner: creator }) )
    .then( (tokens) => {
      log('create+burn tokens')
      log(tokens)
      t.ok(tokens)
      t.equal(tokens.length, 1)
      t.equal(tokens[0].owner, creator)
      t.equal(tokens[0].currency, currency)
      t.equal(tokens[0].balance, 0)    
      t.equal(tokens[0].created.length, 1)    
      t.equal(tokens[0].created[0].amount, 10)    
      t.equal(tokens[0].created[0].unspent, 0)    
      t.equal(tokens[0].burnt.length, 1)
      t.equal(tokens[0].burnt[0].amount, 10)
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('create+give+burn', function (t) {
    var creator = null
    var receiver = null
    var currency = 'Listed Shells'
    var msg = null
    newID().then( (id) => { creator = id; t.ok(ref.isFeed(creator)) } )
    .then( () => newID() )
    .then( (id) => { receiver = id; t.ok(ref.isFeed(receiver)) } )
    .then( () => create(10, currency, { owner: creator }) )
    .then( (op) => give([ { amount: 1, id: op.id } ], receiver, { owner: creator }) )
    .then( (op) => burn(op.id, { owner: receiver }) )
    .then( () => list({ owner: receiver }) ) 
    .then( (tokens) => {
      log('create+give+burn tokens')
      log(tokens)
      t.ok(tokens)
      t.equal(tokens.length, 1)
      t.equal(tokens[0].owner, receiver)
      t.equal(tokens[0].currency, currency)
      t.equal(tokens[0].balance, 0)    
      t.equal(tokens[0].received.length, 1)    
      t.equal(tokens[0].received[0].amount, 1)    
      t.equal(tokens[0].received[0].unspent, 0)    
      t.equal(tokens[0].burnt.length, 1)
      t.equal(tokens[0].burnt[0].amount, 1)
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('stateless list filtered by owner', function (t) {
    var creator1 = null
    var creator2 = null
    newID().then( (id) => creator1 = id )
    .then( () => newID() ).then( (id) => creator2 = id )
    .then( () => create(1, "Shell1", { owner: creator1 }) ) 
    .then( () => create(1, "Shell2", { owner: creator2 }) ) 
    .then( () => list({ owner: creator1 }, { stateless: true }) )
    .then( (tokens) => { 
      log(tokens) 
      t.equal(tokens.length, 1)
      t.equal(tokens[0].currency, "Shell1")
      t.equal(tokens[0].description, null)
      t.equal(tokens[0]["smallest-unit"], 1)
    })
    .then( () => list({ owner: creator2 }, { stateless: true }) )
    .then( (tokens) => { 
      log(tokens) 
      t.equal(tokens.length, 1)
      t.equal(tokens[0].currency, "Shell2")
      t.equal(tokens[0].description, null)
      t.equal(tokens[0]["smallest-unit"], 1)
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('stateless list not filtered by owner', function (t) {
    list({}, { stateless: true })
    .then( (tokens) => t.ok(tokens) || log(tokens) )
    .then( () => t.end() )
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('list all tokens', function (t) {
    list()
    .then( (tokens) =>  t.ok(tokens) || log(tokens) )
    .then( () => t.end() )
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('give to oneself', function (t) {
    var creator = null
    newID().then( (id) => create(2, "Own tokens", { owner: creator=id }) )
    .then( (op) => log(op) || give({ amount: 1, id: op.id }, op.owner, { owner: creator }) ) 
    .then( (op) => list({ owner: creator }) )
    .then( (tokens) => {
      t.ok(tokens)
      t.equal(tokens.length, 1)
      var tok = tokens[0]
      log(tok)
      t.equal(tok.owner, creator)
      t.equal(tok.balance, 2)
      t.equal(tok.created.length, 1)
      t.equal(tok.created[0].unspent, 1)
      t.equal(tok.received.length, 1)
      t.equal(tok.received[0].unspent, 1)
      t.equal(tok.given.length, 1)
      t.equal(tok.given[0].amount, 1)
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })

  })
}

