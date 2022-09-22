
  /*

  tape('api.balance: filtered by owner', function (t) {
    var creator1 = null
    var creator2 = null
    var tokenType1 = null
    var tokenType2 = null 
    newID().then( (id) => creator1 = id )
    .then( () => newID() ).then( (id) => creator2 = id )
    .then( () => create(1, { name: "Shell1", author: creator1 }) ) 
    .then( (msg) => {
      tokenType1 = msg.value.content.tokenType
      return create(1, { name: "Shell2", author: creator2 }) 
    }) 
    .then( (msg) => {
      tokenType2 = msg.value.content.tokenType
      balance(tokenType1, creator1) 
    })
    .then( (balance) => { 
      log(balance) 
      t.equal(balance.tokenType1, "Shell1")
      t.equal(balance[0].description, null)
      t.equal(balance[0].decimals, 0)
    })
    .then( () => list({ author: creator2 }, { stateless: true }) )
    .then( (balance) => { 
      log(balance) 
      t.equal(balance.length, 1)
      t.equal(balance[0].name, "Shell2")
      t.equal(balance[0].description, null)
      t.equal(balance[0].decimals, 0)
      t.end()
    })
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('api.balance: stateless list not filtered by owner', function (t) {
    list({}, { stateless: true })
    .then( (balance) => t.ok(balance) || log(balance) )
    .then( () => t.end() )
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })

  tape('api.balance: all tokens', function (t) {
    list()
    .then( (balance) =>  t.ok(balance) || log(balance) )
    .then( () => t.end() )
    .catch( (err) => { 
      console.log(err.stack)
      t.fail()
    })
  })
  */
