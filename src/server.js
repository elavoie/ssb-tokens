var fs = require('fs')
var path = require('path')

module.exports = function (opts) {
  // Start a server similar to the command-line ssb-server,
  // but we disable plugins we don't need.
  var SecretStack = require('secret-stack')
  var caps = require('ssb-caps')
  var Server = SecretStack({ caps })
  .use(require('ssb-db'))
  //.use(require('ssb-private1'))  // For private messages (disabled)
  //.use(require('ssb-onion'))     // For Tor routing of messages (disabled)
  //
  // Following two disabled until this issue is fixed: 
  //   https://github.com/ssbc/multiserver/issues/73
  //.use(require('ssb-unix-socket')) // For connection to another unix process (disabled)
  //.use(require('ssb-no-auth'))     // For connection without authentication on the same device (disabled)
  
  //.use(require('ssb-plugins'))   // To load plugins running in different processes (disabled)
  .use(require('ssb-master'))      // Enable other SSB ids to have the same full priviledges as the local main ID
  //.use(require('ssb-gossip'))    // Manage peer connections (disabled, superseded by ssb-conn)
  .use(require('ssb-conn'))        // Manage peer connections (supersedes ssb-gossip)
  //.use(require('ssb-local'))     // Advertise yourself on the local network, depends on ssb-gossip (disabled, superseded by ssb-lan)
  .use(require('ssb-lan'))         // Discover peers on the lan
  //.use(require('ssb-replicate'))   // Management of replication process (disabled, superseded by ssb-ebt and ssb-replication-scheduler)
  .use(require('ssb-friends'))     // Manage the social graph
  //.use(require('ssb-blobs'))     // Out-of-order gossip dissemination of arbitrary data (disabled)
  //.use(require('ssb-invite'))    // Invite peers to a pub for high availability replication (disabled) 
  .use(require('ssb-logging'))     // Debug info on the console
  .use(require('ssb-query'))       // Filter-Map-Reduce queries on ssb-db
  .use(require('ssb-links'))       // Abstracts references within messages into 'source' and 'dest' for easier queries 
  //.use(require('ssb-ws'))        // Starts a web server and enables websocket connections (disabled) 
  .use(require('ssb-ebt'))         // Efficient replication of logs using epidemic broadcast trees
  .use(require('ssb-replication-scheduler')) // Initiate replication based on social graph and availability of peers
  .use(require('ssb-ooo'))         // Out-of-order log message retrieval from friends through a flooding protocol

  // Modules required for ssb-tokens proper
  Server
  //.use(require('ssb-db'))       // already provided previously
  //.use(require('ssb-query'))    // already provided previously
  //.use(require('ssb-links'))    // already provided previously
  .use(require('../identities'))  // same as ssb-identities but allows recovering keys
                                  // locally through get method
  .use(require('ssb-backlinks'))  // Dependency of ssb-about, depends on ssb-links
  .use(require('ssb-about'))      // Resolving aliases as about messages
  .use(require('../'))            // ssb-tokens

  config = require('ssb-config/inject')(opts.appname, opts)
  var ssb = Server(config)

  // save an updated list of methods this server has made public
  // in a location that ssb-client will know to check
  var manifest = ssb.getManifest()
  fs.writeFileSync(
    path.join(config.path, 'manifest.json'), // ~/.ssb/manifest.json
    JSON.stringify(manifest)
  )

  return ssb
}
