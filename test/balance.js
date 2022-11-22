var tape = require('tape')
var meta = require('../')
var util = require('util')
var ref = require('ssb-ref')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var debug = require('debug')

module.exports = function run (ssb) {

  tape('balance: correct create', function (t) {
    ssb.identities.create(function (err, creator) {
    t.error(err)

    ssb.tokens.create(10, { name: 'Shells', author: creator }, function (err, msg) {
    t.error(err)

    ssb.tokens.balance(msg.value.content.tokenType, creator, function (err, balance) {
    t.error(err)

    t.equal(balance.owner, creator)
    t.equal(balance.tokenType, msg.value.content.tokenType)
    t.equal(balance.amount.toString(), "10")
    t.equal(balance.all[balance.created[0]].value
                                .content.amount.toString(), "10")
    t.equal(balance.unspent[balance.created[0]].amount.toString(),"10")
    t.end()
    }) }) })
  })

  tape('balance: correct create + give', function (t) {
    ssb.identities.create(function (err, creator) {
    t.error(err)

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.create(10, { name: 'Shells', author: creator }, function (err, createMsg) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1 }, 
    receiver, 
    { author: creator }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.balance(createMsg.value.content.tokenType, creator, function (err, balance) {
    t.error(err)

    t.ok(balance)
    t.equal(balance.owner, creator)
    t.equal(balance.amount.toString(), "9")    
    t.equal(balance.created.length, 1)    
    t.equal(balance.all[balance.created[0]].value
                               .content.amount.toString(), "10")    
    t.equal(balance.unspent[balance.created[0]]
                                   .amount.toString(), "9")    
    t.equal(balance.given.length, 1)
    t.equal(balance.all[balance.given[0]].value
                               .content.amount.toString(), "1")

    ssb.tokens.balance(giveMsg.value.content.tokenType, receiver, function (err, balance) {
    t.error(err)
      
    t.ok(balance)
    t.equal(balance.owner, receiver)
    t.equal(balance.amount.toString(), "1")    
    t.equal(balance.received.length, 1)
    t.equal(balance.all[balance.received[0]].value
                               .content.amount, "1")    
    t.equal(balance.unspent[balance.received[0]].amount.toString(), "1")    
    t.end()
    }) }) }) }) }) })
  })

  tape('balance: correct create + burn', function (t) {
    ssb.identities.create(function (err, creator) {
    t.error(err)

    ssb.tokens.create(10, { name: 'Shells', author: creator }, function (err, createMsg) {
    t.error(err)

    ssb.tokens.burn(
    createMsg.key, 
    { author: creator }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(createMsg.value.content.tokenType, creator, function (err, balance) {
    t.error(err)

    t.ok(balance)
    t.equal(balance.owner, creator)
    t.equal(balance.amount.toString(), "0")    
    t.equal(balance.created.length, 1)    
    t.equal(balance.all[balance.created[0]].value
                               .content.amount.toString(), "10")    
    t.equal(balance.unspent[balance.created[0]], undefined)    
    t.equal(balance.burnt.length, 1)
    t.equal(balance.all[balance.burnt[0]].value
                   .content.amount.toString(), "10")
    t.end()
    }) }) }) }) 
  })

  tape('balance: correct create + give + burn', function (t) {
    ssb.identities.create(function (err, creator) {
    t.error(err)

    ssb.identities.create(function (err, receiver) {
    t.error(err)

    ssb.tokens.create(10, { name: 'Shells', author: creator }, function (err, createMsg) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1 }, 
    receiver, 
    { author: creator }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.burn(
    giveMsg.key,
    { author: receiver }, function (err, burnMsg) {
    t.error(err)

    ssb.tokens.balance(giveMsg.value.content.tokenType, receiver, function (err, balance) {
    t.error(err)
    
    t.ok(balance)
    t.equal(balance.owner, receiver)
    t.equal(balance.amount.toString(), "0")    
    t.equal(balance.received.length, 1)    
    t.equal(balance.all[balance.received[0]].value
                   .content.amount.toString(), "1")    
    t.equal(balance.unspent[balance.received[0]], undefined)    
    t.equal(balance.burnt.length, 1)
    t.equal(balance.all[balance.burnt[0]].value
                    .content.amount.toString(), "1")
    t.end()
    }) }) }) }) }) })
  })

  tape('balance: correct gift to oneself', function (t) {
    ssb.identities.create(function (err, creator) {
    t.error(err)

    ssb.tokens.create(2, { name: 'Shells', author: creator }, function (err, createMsg) {
    t.error(err)

    ssb.tokens.give(
    { id: createMsg.key, amount: 1 }, 
    creator, 
    { author: creator }, function (err, giveMsg) {
    t.error(err)

    ssb.tokens.balance(giveMsg.value.content.tokenType, creator, function (err, balance) {
    t.error(err)

    t.ok(balance)
    t.equal(balance.owner, creator)
    t.equal(balance.amount.toString(), "2")
    t.equal(balance.created.length, 1)
    t.equal(balance.unspent[balance.created[0]].amount.toString(), "1")
    t.equal(balance.received.length, 1)
    t.equal(balance.unspent[balance.received[0]].amount.toString(), "1")
    t.equal(balance.given.length, 1)
    t.equal(balance.all[balance.given[0]].value
                   .content.amount.toString(), "1")
    t.end()
    }) }) }) })
  })

  tape('balance: invalid callback', function (t) {
    try {
      ssb.tokens.balance('tokentype', 'creator', 'cb')
    } catch (err) {
      t.true(err)
      t.end()
    }
  })

  tape('balance: invalid tokenType', function (t) {
    ssb.tokens.balance(42, 'creator', function (err, balance) {
      t.true(err)
      t.end()
    })
  })

  tape('balance: invalid owner', function (t) {
    ssb.tokens.balance('blaablaablaablaa', 'creator', function (err, balance) {
      t.true(err)
      t.end()
    })
  })

  tape('balance: invalid create', function (t) {
    ssb.publish({
      type: "tokens/" + meta['api-version'] + '/create',
      amount: 1,
      name: 'Shells',
      unit: '',
      description: null,
      tokenType: 'invalidtokentype'
    }, function (err, msg) {
    t.error(err)

    ssb.tokens.balance(
    msg.value.content.tokenType, 
    msg.value.author, function (err, balance) {
    t.error(err)

    t.equal(balance.owner, msg.value.author)
    t.equal(balance.tokenType, msg.value.content.tokenType)
    t.equal(balance.amount.toString(), "0")
    t.equal(balance.created.length, 0)
    t.equal(Object.values(balance.all).length, 0)
    t.end()
    }) })
  })

  tape('balance: missing source', function (t) {
    var missing = "%newmissingsourcebalance5EDeJGGhp8AVt76fJM7A=.sha256"
    var receiver = "@GPe4O9BjBgfb9KMwcxub0MaNWyl3lKsJiGV1RwPjnFU=.ed25519"

    ssb.publish({
      type: "tokens/" + meta['api-version'] + '/give',
      amount: "1",
      receiver: receiver,
      sources: [ { id: missing, amount: "1" } ],
      description: null,
      tokenType: 'invalidtokentype'
    }, function (err, msg) {
    t.error(err)

    ssb.tokens.valid(msg, function (err, msg) {
    t.true(err)

    ssb.tokens.balance(
    msg.value.content.tokenType, 
    msg.value.author, function (err, balance) {
    t.error(err)

    t.equal(balance.owner, msg.value.author)
    t.equal(balance.tokenType, msg.value.content.tokenType)
    t.equal(balance.amount.toString(), "0")
    t.equal(balance.given.length, 0)
    t.equal(Object.values(balance.all).length, 1)
    t.ok(balance.all[balance.missing.operations[0]])

    ssb.tokens.balance(
    msg.value.content.tokenType, 
    receiver, function (err, balance) {
    t.error(err)

    t.equal(balance.owner, receiver)
    t.equal(balance.tokenType, msg.value.content.tokenType)
    t.equal(balance.amount.toString(), "0")
    t.equal(balance.received.length, 0)
    t.equal(Object.values(balance.all).length, 1)
    t.ok(balance.all[balance.missing.operations[0]])
    t.end()
    }) }) }) })
  })
}

