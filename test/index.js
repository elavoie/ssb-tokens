var tape = require('tape')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var meta = require('../')
var util = require('util')

Server.use(require('ssb-identities'))
Server.use(require('ssb-query'))
Server.use(require('ssb-backlinks'))
Server.use(require('ssb-about'))
Server.use(require('ssb-links'))
Server.use(meta)

var ssb = Server({
  temp: 'ssb-tokens:test:index.js',
  caps: {
    sign: require('crypto')
      .randomBytes(32).toString('base64'),
    shs: require('crypto')
      .randomBytes(32).toString('base64')
  }
})

ssb.tokens.debug(true)

var tests = [
  require('./help.js'),
  require('./format.js'),
  require('./requirements.js'),
  require('./valid.js'),
  require('./unspent.js'),
  require('./balance.js'),
  require('./types.js'),
  require('./create.js'),
  require('./give.js'),
  require('./burn.js'),
  require('./alchemist.js'),
  require('./csa.js'),
  require('./csa-w-distributor.js'),
  require('./fidelity.js'),
  require('./osd.js'),
  require('./identities/list.js'),
  require('./operations.js')
]
tests.forEach(function (t) { 
  t(ssb) 
})

tape('close', function (t) {
  ssb.close(function (err) {
    t.error(err)
    t.end()
  })
})
