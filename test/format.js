var tape = require('tape')
var util = require('util')
var meta = require('../')

module.exports = function run (ssb) {
  var create = util.promisify(ssb.tokens.create)
  var newID = util.promisify(ssb.identities.create)
  var give = util.promisify(ssb.tokens.give)

  tape('format(createOp): correct', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.false(err)
    t.end()
  }) 

  tape('format(createOp): incorrect type', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/createTypo",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect amount', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: "10",
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect name', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: 20,
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): name too long', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "very very verbose vindicative value",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect unit', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: 10,
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): unit too long', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "very verbose unit",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect decimals', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: "10",
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect infinite decimals', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: Infinity,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect non-integer decimals', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 1.2,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): negative decimals', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: -1,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): decimals too large', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 33,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect description', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: "Free Description!"
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect tokenType', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = 42 
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): tokenType too long', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = '12345678901234567'
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): incorrect negative amount', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: -10,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): invalid characters in name', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin &",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): invalid characters in unit', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10,
      name: "Create Coin",
      unit: "CRC&",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(createOp): invalid combination of amount and decimals', function (t) {
    var createOp = {
      type: "tokens/" + meta["api-version"] + "/create",
      amount: 10.1,
      name: "Create Coin",
      unit: "CRC",
      decimals: 0,
      description: null
    }
    createOp.tokenType = ssb.tokens.tokenType(null, createOp)
    var err = ssb.tokens.validate.format(createOp)
    t.true(err)
    t.end()
  }) 

  tape('format(giveOp): correct', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      t.false(ssb.tokens.validate.format(giveOp))
      t.end()
    })
  })

  tape('format(giveOp): incorrect type', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/giveTypo",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): incorrect receiver', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: "BLA",
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): incorrect tokenType', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: 123
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): tokenType too long', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType + "B"
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): incorrect amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: '1',
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): incorrect sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: { id: msg.key, amount: 1 },
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): too many sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): invalid non-object sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): invalid source amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: '1' } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): invalid source negative amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: -1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): invalid source id', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: 1, id: null } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): invalid source property', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: 1, id: msg.key , additional: null } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): inconsistent amounts', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: 1, id: msg.key } ],
        receiver: msg.value.author,
        amount: 2,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(giveOp): multiple sources with same id', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var giveOp = {
        type: "tokens/" + meta['api-version'] + "/give",
        sources: [ { amount: 1, id: msg.key }, { amount: 1, id: msg.key } ],
        receiver: msg.value.author,
        amount: 2,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(giveOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): correct', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { id: msg.key, amount: 10 } ],
        amount: 10,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      t.false(ssb.tokens.validate.format(burnOp))
      t.end()
    })
  })

  tape('format(burnOp): incorrect type', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burnTypo",
        sources: [ { id: msg.key, amount: 10 } ],
        amount: 10,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): incorrect tokenType', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: 123
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): tokenType too long', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType + "B"
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): incorrect amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { id: msg.key, amount: 1 } ],
        receiver: msg.value.author,
        amount: '1',
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): incorrect sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: { id: msg.key, amount: 1 },
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): too many sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): invalid non-object sources', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): invalid source amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: '1' } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): invalid source negative amount', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: -1 } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): invalid source id', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: 1, id: null } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): invalid source property', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: 1, id: msg.key , additional: null } ],
        receiver: msg.value.author,
        amount: 1,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): inconsistent amounts', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: 1, id: msg.key } ],
        receiver: msg.value.author,
        amount: 2,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })

  tape('format(burnOp): multiple sources with same id', function (t) {
    ssb.tokens.create(10, 'Shells', function (err, msg) {
      t.false(err)

      var burnOp = {
        type: "tokens/" + meta['api-version'] + "/burn",
        sources: [ { amount: 1, id: msg.key }, { amount: 1, id: msg.key } ],
        receiver: msg.value.author,
        amount: 2,
        description: null,
        tokenType: msg.value.content.tokenType
      }

      var err = ssb.tokens.validate.format(burnOp)
      t.true(err)
      t.end()
    })
  })
}
