#!/usr/bin/env node
var args = require('minimist')(process.argv)
var fs = require('fs')
var path = require('path')
var ssbClient = require('ssb-client')
var ssbKeys = require('ssb-keys')
var debug = require('debug')('ssb-tokens')
var createPeerStream = require('dgram-broadcast')
var multiaddress = require('multiserver-address')
var pull = require('pull-stream')
var Server = require('../src/server.js')
var home = require('os-homedir')


function help () {
  process.stderr.write(fs.readFileSync(path.join(__dirname, '..', 'help/index.txt')))
  process.exit(1)
}

if (args._.length <= 2) help()

var command = args._[2]
var TOPICS = fs.readdirSync(path.join(__dirname, '../help')) 
if (command === 'help') {
  if (args._.length === 3) help()

  var topic = args._[3].toLowerCase() 
  var topicFile = topic + '.txt'
  if (TOPICS.indexOf(topicFile) < 0) {
    process.stderr.write("No help available on topic: '" + topic + "'")
    process.exit(1)
  }

  process.stdout.write(fs.readFileSync(path.join(__dirname, '../help', topicFile)))
  process.exit(0)
}

var SSB_TOKENS_DIR = args['dir'] || 'ssb-tokens'

debug('using local database and config in ~/.' + SSB_TOKENS_DIR)

if (command === 'init') {
  try {
    require('./' + command)(null, args, function (err) {
      if (err) 
        console.error(err.message)
    })
  } catch (err) {
    console.error(err)
  }
} else {

  var ssbTokensPath = path.join(home(), '.' + SSB_TOKENS_DIR)
  if (!fs.existsSync(ssbTokensPath) && command !== 'init') {
    console.error('Invalid or inexisting local database at path ' + ssbTokensPath + '.') 
    console.error("You can initialize a new one with 'ssb-tokens init'.")
    process.exit(1)
  }

  ssbClient(null, SSB_TOKENS_DIR, function (err, ssb, config) {
    if (command === 'init') {
      debug('skip starting an ssb-server with init command')
    } else if (err) {
      if (err.message !== "could not connect to sbot") {
        console.error(err)
        return process.exit(1)
      }

      debug('could not connect to a running ssb instance, starting a new one')
      var ssb = Server({ appname: SSB_TOKENS_DIR })

      // show connection updates when debugging
      if (debug.enabled) { 
        pull(
          ssb.conn.peers(),
          pull.asyncMap(function (peers, cb) {
            if (peers.length === 0)
              return cb(null, null)

            pull(
              pull.values(peers),
              pull.asyncMap(function (p, cb) {
                var logId = p[1].key
                var state = p[1].state
                ssb.about.socialValue(
                  { key: 'name', dest: p[1].key},
                  function (err, name) { 
                    if (err) return cb(err)
                    return cb(null, 'remote @' + ( name || logId) + ' ' + state + 
                                    ' on ' + (p[1].type || p[1].inferredType)  + ' at ' +
                                    p[0])
                  })
              }),
              pull.collect(function (err, peersStatus) {
                if (err) return cb(err)
                return cb(null, peersStatus.join('\n')) 
              })
            )
          }),
          pull.filter((s) => s !== null),
          pull.drain(debug)
        )
      }
    } else {
      debug('connected to an existing running ssb instance with ssb-client')
    }

    function close () {
      // Leave time for finishing setup before closing,
      // otherwise ssb-connection-scheduler tries closing
      // ConnDB twice
      if (ssb && ssb.close)
        setTimeout(function () { ssb.close() }, 250)
    }

    if (command !== 'init' && !ssb.tokens) {
      console.error("ssb-tokens not installed on running server instance")
      return close()
    }

    var supported = {
      ancestors: true,
      balance: true,
      burn: true,
      create: true,
      give: true,
      identities: true,
      init: true,
      operations: true,
      show: true,
      types: true,
      unspent: true,
      valid: true
    }

    if (args._.length >= 2 && !supported[command]) {
      console.error("ssb-tokens: invalid command '" + command + "'")
      close()
    } else {
      try {
        require('./' + command)(ssb, args, function (err) {
          if (err) 
            console.error(err.message)

          close()
        })
      } catch (err) {
        console.error(err)
        close()
      }
    } 
  })
}
