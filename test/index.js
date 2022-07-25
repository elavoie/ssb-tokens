var tape = require('tape')
var Server = require('ssb-server')
var keys = require('ssb-keys')
var meta = require('../')
var util = require('util')

Server.use(require('ssb-identities'))
Server.use(require('ssb-query'))
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

var tests = [
  require('./help.js'),
  require('./create.js'),
  require('./give.js'),
  require('./burn.js'),
  require('./validate.js'),
  require('./list.js'),
  require('./applications.js')
]
tests.forEach(function (t) { 
  t(ssb) 
})

tape('close', function (t) {
  ssb.close()
  t.end()
})
