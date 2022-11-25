// Original version from https://github.com/ssbc/ssb-identities, under MIT license,
// modified to make lookup of identities faster and enable retrieval of private 
// keys locally through 'get' method (not exposed to ssb-client or RPC).
var leftpad = require('left-pad')
var path = require('path')
var mkdirp = require('mkdirp')
var fs = require('fs')
var ssbKeys = require('ssb-keys')
var create = require('ssb-validate').create
var ref = require('ssb-ref')
var unbox = ssbKeys.unbox
var unboxKey = ssbKeys.unboxKey
var unboxBody = ssbKeys.unboxBody

function toTarget (t) {
  return 'object' === typeof t ? t && t.link : t
}

exports.name = 'identities'
exports.version = '1.0.0'
exports.manifest = {
  main: 'sync',
  list: 'async',
  create: 'async',
  publishAs: 'async',
  help: 'sync'
}

exports.init = function (sbot, config) {

  var dir = path.join(config.path, 'identities')
  mkdirp.sync(dir)
  var ready = false
  var keysMap = { }
  fs.readdirSync(dir).filter(function (name) {
    return /^secret_\d+\.butt$/.test(name)
  }).map(function (file) {
    return ssbKeys.loadSync(path.join(dir, file))
  }).forEach(function (k) { keysMap[k.id] = k })


  var keymap = {}
  var locks = {}

  sbot.addUnboxer({
    key: function (content) {
      var keys = Object.values(keysMap)
      for(var i = 0;i < keys.length;i++) {
        var key = ssbKeys.unboxKey(content, keys[i])
        if(key) return key
      }
    },
    value: function (content, key) { return ssbKeys.unboxBody(content, key) }
  })

  return {
    main: function () {
      return sbot.id
    },
    list: function (cb) {
      cb(null, [sbot.id].concat(Object.values(keysMap).map(function (e) { return e.id })))
    },
    create: function (cb) {
      var filename = 'secret_'+leftpad(Object.values(keysMap).length, 2, '0')+'.butt'
      ssbKeys.create(path.join(dir, filename), function (err, newKeys) {
        keysMap[newKeys.id] = newKeys
        cb(err, newKeys.id)
      })
    },
    get: function (id) { 
      if (sbot.id === id) return sbot.keys
      else return keysMap[id] 
    }, // Not exposed through RPC
    add: function (ids) { 
      Object.values(ids).forEach(function (keys) {
        keysMap[keys.id] = keys
      })
    }, // Not exposed through RPC
    publishAs: function (opts, cb) {
      var id = opts.id
      if(locks[id]) return cb(new Error('already writing'))
      var _keys = sbot.id === id ? sbot.keys : keysMap[id]
      if(!_keys) return cb(new Error('must provide id of listed identities'))
      var content = opts.content

      var recps = [].concat(content.recps).map(toTarget)

      if(content.recps && !opts.private)
        return cb(new Error('recps set, but opts.private not set'))
      else if(!content.recps && opts.private)
        return cb(new Error('opts.private set, but content.recps not set'))
      else if(!!content.recps && opts.private) {
        if(!Array.isArray(content.recps) || !~recps.indexOf(id))
          return cb(new Error('content.recps must be an array containing publisher id:'+id+' was:'+JSON.stringify(recps)+' indexOf:'+recps.indexOf(id)))
        content = ssbKeys.box(content, recps)
      }

      locks[id] = true
      sbot.getLatest(id, function (err, data) {
        var state = data ? {
          id: data.key,
          sequence: data.value.sequence,
          timestamp: data.value.timestamp,
          queue: []
        } : {id: null, sequence: null, timestamp: null, queue: []}
        sbot.add(create(state, _keys, config.caps && config.caps.sign, content, Date.now()), function (err, a, b) {
          delete locks[id]
          cb(err, a, b)
        })
      })
    },
    help: function () {
      return require('./help')
    }
  }
}











