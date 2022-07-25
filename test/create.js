var tape = require('tape')
var meta = require('../')

module.exports = function run (ssb) {
  tape('api.format.create: ', function (t) {


  })

  tape('api.create: no callback', function (t) {
    try {
      ssb.tokens.create()
      t.fail('should throw')
    } catch (e) {
      t.ok(e)
      t.end()
    }
  })

  tape('api.create: invalid token amount', function (t) {
    ssb.tokens.create('10', 'Shells', function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('api.create: invalid currency', function (t) {
    ssb.tokens.create(10, 20, function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('api.create: invalid currency length', function (t) {
    ssb.tokens.create(10, 'this is a very long currency string', function (err, msg) {
      t.true(err)
      t.end()
    })
  })

  tape('api.create: 10 Shells with no options', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.notOk(err)
      t.ok(msg.id)
      t.equal(msg.type, 'tokens/' + meta['api-version'] + '/create')
      t.equal(msg.amount, 10)
      t.equal(msg.currency, 'Shells')
      t.equal(msg.description, null)
      t.equal(msg['smallest-unit'], 1)
      ssb.get(msg.id, function (err, ssbMsg) {
        t.false(err)
        t.equal(ssbMsg.content.type, 'tokens/' + meta['api-version'] + '/create')
        t.equal(ssbMsg.content.amount, 10)
        t.equal(ssbMsg.content.currency, 'Shells')
        t.equal(ssbMsg.content.description, null)
        t.equal(ssbMsg.content['smallest-unit'], 1)
        t.end()
      })
    })
  })

  tape('api.create: different owner', function (t) {
    ssb.identities.create(function (err, owner) {
      t.notOk(err)
      ssb.tokens.create(10, 'Shells', { owner: owner }, function (err, msg) {
        t.notOk(err)
        t.ok(msg.id)
        t.equal(msg.owner, owner)
        t.equal(msg.type, 'tokens/' + meta['api-version'] + '/create')
        t.equal(msg.amount, 10)
        t.equal(msg.currency, 'Shells')
        t.equal(msg.description, null)
        t.equal(msg['smallest-unit'], 1)
        t.end()
      })
    })
  })

  tape('api.create: use description', function (t) {
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
          t.equal(msg.amount, 10)
          t.equal(msg.currency, 'Shells')
          t.equal(msg.description, ssbMsg.key)
          t.equal(msg['smallest-unit'], 1)
          t.end()
        })
    })
  })

  tape('api.create: use an invalid description', function (t) {
    ssb.tokens.create(10, 'Shells', { description: '%malformed_id'}, 
      function (err, msg) {
        t.true(err)
        t.end()
      })
  })

  tape('api.create: use an invalid amount/smallest-unit combination', function (t) {
    ssb.tokens.create(10.33, 'Shells', { 'smallest-unit': 0.1 }, 
      function (err, msg) {
        t.true(err)
        t.end()
      })
  })
}
