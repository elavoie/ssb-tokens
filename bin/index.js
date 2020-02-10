#!/usr/bin/env node
var args = require('minimist')(process.argv)
var fs = require('fs')
var path = require('path')
var api = require('../src/index.js')

function help () {
  process.stderr.write(fs.readFileSync(path.join(__dirname, '..', 'help/index.txt')))
  process.exit(1)
}

if (args.help || args._.length <= 2) help()

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

var COMMANDS = Object.keys(api) 
if (args._.length >= 2 && COMMANDS.indexOf(args._[2]) < 0) {
  process.stderr.write("ssb-coin: invalid command '" + args._[2] + "'")
  process.exit(1)
}

console.log(args)
console.log(api)

