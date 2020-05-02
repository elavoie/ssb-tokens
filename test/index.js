var tape = require('tape')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var owner = keys.generate()
var meta = require('../')

Server.use(require('ssb-identities'))
Server.use(meta)

var ssb = Server({
  temp: 'ssb-tokens',
  caps: {
    sign: require('crypto')
      .randomBytes(32).toString('base64'),
    shs: require('crypto')
      .randomBytes(32).toString('base64')
  }
})

tape("help on tokens's api", function (t) {
  t.ok(ssb.tokens.help())
  t.end()
})

tape('create - no callback', function (t) {
  try {
    ssb.tokens.create()
    t.fail('should throw')
  } catch (e) {
    t.ok(e)
    t.end()
  }
})

tape('create - invalid token number', function (t) {
  ssb.tokens.create('10', 'Shells', function (err, msg) {
    t.true(err)
    t.end()
  })
})

tape('create - invalid currency', function (t) {
  ssb.tokens.create(10, 20, function (err, msg) {
    t.true(err)
    t.end()
  })
})

tape('create - invalid currency length', function (t) {
  ssb.tokens.create(10, 'this is a very long currency string', function (err, msg) {
    t.true(err)
    t.end()
  })
})

tape('create 10 Shells with no options', function (t) {
  ssb.tokens.create(10, 'Shells', function (err, msg) {
    t.notOk(err)
    t.ok(msg.id)
    t.equal(msg.type, 'tokens/' + meta['api-version'] + '/create')
    t.equal(msg.number, 10)
    t.equal(msg.currency, 'Shells')
    t.equal(msg.description, null)
    t.equal(msg['smallest-unit'], 0.01)
    ssb.get(msg.id, function (err, ssbMsg) {
      t.false(err)
      t.equal(ssbMsg.content.type, 'tokens/' + meta['api-version'] + '/create')
      t.equal(ssbMsg.content.number, 10)
      t.equal(ssbMsg.content.currency, 'Shells')
      t.equal(ssbMsg.content.description, null)
      t.equal(ssbMsg.content['smallest-unit'], 0.01)
      t.end()
    })
  })
  // TODO: Test everything else described in API 
})

tape('create with different owner', function (t) {
  ssb.identities.create(function (err, owner) {
    t.notOk(err)
    ssb.tokens.create(10, 'Shells', { owner: owner }, function (err, msg) {
      t.notOk(err)
      t.ok(msg.id)
      t.equal(msg.owner, owner)
      t.equal(msg.type, 'tokens/' + meta['api-version'] + '/create')
      t.equal(msg.number, 10)
      t.equal(msg.currency, 'Shells')
      t.equal(msg.description, null)
      t.equal(msg['smallest-unit'], 0.01)
      t.end()
    })
  })
})

tape('create with a description', function (t) {
  ssb.publish({ 
    type: 'post', 
    text: '#Shells Tokens\n' +
          'This is my new awesome token!' 
  }, function (err, ssbMsg) {
    t.false(err)
    ssb.tokens.create(10, 'Shells', { description: ssbMsg.key }, 
      function (err, msg) {
        t.false(err)
        t.ok(msg.id)
        t.equal(msg.type, 'tokens/' + meta['api-version'] + '/create')
        t.equal(msg.number, 10)
        t.equal(msg.currency, 'Shells')
        t.equal(msg.description, ssbMsg.key)
        t.equal(msg['smallest-unit'], 0.01)
        t.end()
      })
  })
})

tape('create with an invalid description', function (t) {
  ssb.tokens.create(10, 'Shells', { description: '%malformed_id'}, 
    function (err, msg) {
      t.true(err)
      t.end()
    })
})

tape('create with an invalid number/smallest-unit combination', function (t) {
  ssb.tokens.create(10.33, 'Shells', { 'smallest-unit': 0.1 }, 
    function (err, msg) {
      t.true(err)
      t.end()
    })
})

// TODO: Test everything else described in API 

tape('close', function (t) {
  ssb.close()
  t.end()
})
