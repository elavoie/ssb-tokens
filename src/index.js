module.exports = {
  name: "tokens",
  version: "0.1.0",
  manifest: {
    burn: 'async',
    create: 'async', 
    flag: 'async',
    give: 'async',
    help: 'sync',
    list: 'async',
    trace: 'async',
    unflag: 'async'
  },
  init: function (ssb, config) {
    console.log('testing ' + config.temp)
    return {
      burn: function (cb) { return cb(null)  },
      create: function (cb) { return cb(null)  },
      flag: function (cb) { return cb(null)  },
      give: function (cb) { return cb(null)  },
      help: function () { return { description: 'Tokens for community economics.', commands: {} } }, 
      list: function (cb) { return cb(null)  },
      trace: function (cb) { return cb(null)  },
      unflag: function (cb) { return cb(null)  }
    }
  }
}
