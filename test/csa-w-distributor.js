var tape = require('tape')

module.exports = function run (ssb) {
  tape('Community Supported Agriculture with Distributor', function (t) {
    ssb.identities.create(function (err, distributor) {
    t.error(err)

    ssb.identities.create(function (err, buyer) {
    t.error(err)

    ssb.identities.create(function (err, farmer) {
    t.error(err)

    ssb.tokens.create(
    1, 
    { name: "Farmer Basket Credit", author: farmer },
    function (err, createFCMsg) {
    t.error(err)

    var farmerCredit = createFCMsg.value.content.tokenType

    ssb.tokens.create(
    1, 
    { name: "Distribution Credit", author: distributor }, 
    function (err, createDCMsg) {
    t.error(err)

    var distributorCredit = createDCMsg.value.content.tokenType

    ssb.tokens.create(
    10,
    { name: "EUR", author: buyer }, function (err, createEURMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, tokenType: farmerCredit},
    buyer,
    { author: farmer }, function (err, giveFCMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 10, id: createEURMsg.key },
    distributor,
    { author: buyer }, function (err, giveEURMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, tokenType: farmerCredit},
    distributor,
    { author: buyer }, function (err, giveFCMsg2) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, tokenType: distributorCredit },
    buyer,
    { description: giveFCMsg2.key, author: distributor },
    function (err, giveDCMsg) {
    t.error(err)

    ssb.tokens.give(
    { amount: 1, id: giveFCMsg2.key },
    farmer,
    { author: distributor },
    function (err, redeemFCMsg) {
    t.error(err)

    ssb.tokens.give(
    giveDCMsg.key,
    distributor,
    { author: buyer },
    function (err, redeemDCMsg) {
    t.error(err)

    ssb.tokens.burn(
    redeemFCMsg.key,
    { author: farmer },
    function (err, burnFCMsg) {
    t.error(err)

    ssb.tokens.burn(
    redeemDCMsg.key,
    { author: distributor },
    function (err, burnDCMsg) {
    t.error(err)

    ssb.tokens.balance(farmerCredit, buyer, function (err, bal) {
    t.error(err)
    t.equal(bal.tokenType, farmerCredit)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveFCMsg2.key)

    ssb.tokens.balance(distributorCredit, buyer, function (err, bal) {
    t.error(err)
    t.equal(bal.tokenType, distributorCredit)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveDCMsg.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], redeemDCMsg.key)

    ssb.tokens.balance(farmerCredit, distributor, function (err, bal) {
    t.error(err)
    t.equal(bal.tokenType, farmerCredit)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], giveFCMsg2.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], redeemFCMsg.key)

    ssb.tokens.balance(distributorCredit, distributor, function (err, bal) {
    t.error(err)
    t.equal(bal.tokenType, distributorCredit)
    t.equal(bal.amount.toNumber(), 0)
    t.equal(bal.created.length, 1)
    t.equal(bal.created[0], createDCMsg.key)
    t.equal(bal.received.length, 1)
    t.equal(bal.received[0], redeemDCMsg.key)
    t.equal(bal.given.length, 1)
    t.equal(bal.given[0], giveDCMsg.key)
    t.equal(bal.burnt.length, 1)
    t.equal(bal.burnt[0], burnDCMsg.key)

    t.end()
    }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) })
  })
}
