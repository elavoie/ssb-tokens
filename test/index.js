var tape = require('tape')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var owner = keys.generate()

Server
  .use(require('../'))

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

tape('create tokens', function (t) {
  ssb.tokens.create(function (err) {
    t.notOk(err)
    t.end()
  })
})

tape('close', function (t) {
  ssb.close()
  t.end()
})
