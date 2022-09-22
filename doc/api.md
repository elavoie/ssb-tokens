# Application Programming Interface (API)

The API closely follows the [command-line interface](../help/index.txt).  See
[Design](../doc/design.md) for a detailed rationale behind the design.

For all message types below, `<version>=J9oN`.

## Terminology

### Meta-operation

*Def:* A message that [adds](#tokensflagtokens-label-options-cb) or
[removes](#tokensunflagtokens-label-options-cb) information *about* an
[operation](#operation). 

#### Meta-operation Identifier

*Def:* The identifier of a [meta-operation](#meta-operation). Follows the [SSB
Message ID](#ssb-message-id) format.

### Operation

*Def:* A message that [creates](#tokenscreatenumber-currency-options-cb),
[transfers (gives)](#tokensgivetokens-receiver-options-cb), or [destroys
(burns)](#tokensburntokens-options-cb) tokens. 

#### Operation Identifier

*Def:* The identifier of an [operation](#operation).  Follows the [SSB Message
ID](#ssb-message-id) format.

#### *Ancestor* operations

*Def*: Previous operations that provide tokens for the current one.

Immediate ancestors are mentioned in the `source` property of a
[give](#tokensgivetokens-receiver-options-cb) or
[burn](#tokensburntokens-options-cb) message. Transitive ancestors are
mentioned in the `source` property of an ancestor.

#### *Descendant* operations

*Def*: Following operations that source their tokens from the current one.

Descendants are not directly encoded in messages because they are unknown at
the time of writing. They are derived indirectly from the chain of
[ancestors](#ancestor-operations) of later [operations](#operation).

#### *Root* operations

*Def:* Oldest *ancestors* of an operation. Always a
[create](#tokenscreatenumber-currency-options-cb) operation.

### Query

*Def:* An invocation that finds, filters, and organize
[operations](#operations) and [meta-operations](#meta-operation) messages.

### Secure-Scuttlebutt (SSB) Message

*Def:* An immutable message replicated with the [Secure
Scuttlebutt](https://en.wikipedia.org/wiki/Secure_Scuttlebutt) protocol,
created by a single author. The integrity of messages is guaranteed by
[cryptographic
primitives](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds). See the
[Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds).

#### SSB Message Format

```json
{ 
   "key": SSB_MSG_ID, 
   "value": { 
      "author": SSB_LOG_ID, 
      "sequence": Number, 
      "previous": SSB_MSG_ID, 
      "content": {
          ...   // Application-specific
      }, 
      "signature": String
   }
}
```

#### SSB Message ID

*Def:* Hash of the message including signature. 

See 'Message Format' in the [Protocol
Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds).

#### SSB Log ID

*Def:* Public key of the log.

Also known as SSB Feed ID. See ''Keys and identities" in  the [Protocol
Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#keys-and-identities).

### Tokens

*Def:* Units of [exchange](https://en.wikipedia.org/wiki/Medium_of_exchange)
and [accounting](https://en.wikipedia.org/wiki/Unit_of_account) between (SSB)
users. 

Individual tokens are not represented by individual SSB messages: instead, they
are [created](#tokenscreatenumber-currency-options-cb), [transferred
(given)](#tokensgivetokens-receiver-options-cb), or [destroyed
(burned)](#tokensburntokens-options-cb) in bulk.

Any user can create as many tokens as they wish for whichever purpose. The
usefulness of tokens to [store
value](https://en.wikipedia.org/wiki/Store_of_value) therefore depends on: (1)
the behaviour of their creator (ex: how many they create and how often) and (2)
the trust in other users that their creator can fulfill the associated
promises, if any.  Tokens are therefore ill-suited to implement
cryptocurrencies that derive their value from [artificial
scarcity](https://en.wikipedia.org/wiki/Artificial_scarcity), such as
[Bitcoin](https://en.wikipedia.org/wiki/Bitcoin#Mining).

#### *Unspent* tokens

*Def*: Tokens created or previously received, that have not yet been
transferred or destroyed.

In practice, this means the remaining (positive) balance between the total
number of tokens received from
[create](#tokenscreatenumber-currency-options-cb) and
[give](#tokensgivetokens-receiver-options-cb) operations, and the total number
of tokens spent in [give](#tokensgivetokens-receiver-options-cb) and
[burn](#tokensburntokens-options-cb) operations.

## Initialization

```javascript
    var Server = require('ssb-server')
    var config = require('ssb-config')

    // add dependencies (if not already present)
    Server.use(require('ssb-identities'))
    Server.use(require('ssb-query'))
    // add ssb-tokens
    Server.use(require('ssb-tokens'))

    // create the server 
    var ssb = Server(config)

    // call ssb-tokens' operations
    ssb.tokens.create(...)
```

Optionally, the API of ssb-tokens can be advertised for
[ssb-client](https://github.com/ssbc/ssb-client)s through a manifest file:

```javascript
    // (Optional) save the updated list of methods, 
    // including ssb-tokens', for ssb-client
    var fs = require('fs')
    var path = require('path')
    var manifest = server.getManifest()
    fs.writeFileSync(
      path.join(config.path, 'manifest.json'), // ~/.ssb/manifest.json
      JSON.stringify(manifest)
    )
```

`ssb-tokens` must be installed in
[ssb-server](https://github.com/ssbc/ssb-server) rather than in
[ssb-client](https://github.com/ssbc/ssb-client) if there is a possibility of
multiple clients issuing operations for the same `author` (ex:
[giving](#tokensgivetokens-receiver-options-cb) tokens): this guarantees that
the tokens spent in one client will be seen by the others, avoiding invalid
operations.

### Required Plugins `ssb-server`

1. [ssb-query](https://github.com/ssbc/ssb-query)

### Optional Plugins `ssb-server`

1. [ssb-identities](https://github.com/ssbc/ssb-identities) to use the `author`
   option, which can use a different identity than the default.

## Operations

### Common Pre-conditions

1. The private key of `author` is accessible by the running
   [ssb-server](https://github.com/ssbc/ssb-server).
2. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or
   [ssb-client](https://github.com/ssbc/ssb-client) instance,  is correctly
running.

### ssb.tokens.create(amount, options, cb(err, msg))

Create `amount` (Number) of token with properties in `options`.

The callback should have signature `cb(err, msg)`: `err` is `null` if the
operation was successful or `Error` (truthy) otherwise, and `msg` is the
message saved in the SSB Log ([SSB Message Format](#ssb-message-format)).


Options can be the following:

```js
{
    name: String[30],                  // Mandatory
    unit: String[10],                  // Default: ''
    decimals: Number,                  // Default: 0
    description: SSB_MSG_ID || null,   // Default: null
    author: SSB_LOG_ID || null,        // Default: null
}
```

where:

* `name`: is the name given to the token.
* `unit`: is the unit in which the token is denominated (ex: 'USD', 'Hours', or
  custom token code).
* `description`: is an optional [SSB Message ID](#ssb-message-id) whose content
  describes the purpose and conditions of the tokens.
* `decimals`: is a number that represents the largest number of decimals
  supported, when subdividing the token (ex: 2 for cents in `USD`).
* `author`: is the [SSB Log ID](#ssb-log-id) that is creating the tokens. If
  `null`, use the default log ID
  ([ssb-server](https://github.com/ssbc/ssb-server) uses `~/.ssb/secret` by
  default).

For convenience `options=name (String)` is automatically converted to 
`options={ name: name }`, using all other values defaults.

#### Log Effect(s)

`author`'s log is extended with a [SSB Message](#ssb-message-format) with `content`:

```json
{
    "type": "tokens/<version>/create", 
    "amount": amount, // Number
    "name": options.name, // String 
    "unit": options.unit, // String
    "decimals": options.decimals, // Number
    "description": options.description, // String || null
    "tokenType": hash(options.name + options.unit + options.decimals + 
                      options.description + options.description) // String
}
```

#### Errors

Immediately throws an error if one of the inputs is incorrect. Otherwise,
errors are returned through the callback `cb(err)`.

If the default author id cannot be retrieved, errors from `ssb.whoami` will be
returned. Prior to publishing, the message is validated with
`ssb.tokens.validation.requirements`, which may return an error if the
format of the message or the values are not as expected. The message is then
published with `ssb.publish`, if the default identifier is used, or
`ssb.identities.publishAs`, which may also raise errors.

### ssb.tokens.give(sources, receiver, ?options, cb(err, msg))

Give (owned) tokens from `sources` to `receiver` ([SSB Log ID](#ssb-log-id)),
if enough unspent tokens remain.

`sources` can be one of the followings:

* `operation-id` ([SSB Message ID](#ssb-message-id)): gives all the remaining
  [*unspent* tokens](#unspent-tokens) from `operation-id`. 

* `{ amount: Number, id: operation-id }`: gives `amount` from `id`.

* `{ 
     amount: Number, 
     tokenType: String 
   }`: gives `amount` from earliest received tokens that match `token-hash`.

* `[ source, ... ]` :  gives tokens from each source in the list. Each `source`
  should be one of the options above.

The callback should have signature `cb(err, msg)`: `err` is `null` if the
operation was successful or `Error` (truthy) otherwise, and `msg` is the
message saved in the log.

Options can be the following:

```js
{
    author: SSB_LOG_ID || null,           // Default: null
    description: SSB_MSG_ID || null       // Default: null
}
```

where:

* `author`: is the [SSB Log ID](#ssb-log-id) that is giving the tokens. If
  `null`, use the default log ID
([ssb-server](https://github.com/ssbc/ssb-server) uses `~/.ssb/secret` by
default).
* `description`: is an optional [SSB Message ID](#ssb-message-id) whose content
   describes the reason for the transfer.

#### Log Effect(s)

If the operation is successful, `author`'s log is extended with the following
operation:

```json
{
    "type": "tokens/<version>/give",
    "sources": [ { amount: Number, id: operation-id }, ... ],
    "amount": Number,
    "receiver": SSB_LOG_ID,
    "tokenType": String, // Same as operations listed in source
}
```

#### Errors

Immediately throws an error if one of the inputs is incorrect. Otherwise,
errors are returned through the callback `cb(err)`.

If the default author id cannot be retrieved, errors from `ssb.whoami` will be
returned. Prior to publishing, the message is validated with
`ssb.tokens.validation.requirements`, which may return an error if the
values are not as expected. The message is then published with `ssb.publish`,
if the default identifier is used, or `ssb.identities.publishAs`, which may also
raise errors.

Internally uses `ssb.tokens.unspent` and `ssb.tokens.balance`, so will error
if any of those fails. Will also error if available amounts are insufficient
to cover the requested amounts in `sources`.

Common errors and solutions:

    1. `unspent: Inconsistent owner ... for give operation ...` or 
       `unspent: Inconsistent owner ... for create operation ...`: 
       Some source(s) are not owned by `options.author`, change either the
       source(s) or `options.author`.

### ssb.tokens.burn(sources, ?options, cb(err, msg))

Burn the full amounts of `tokens` from `sources`. Sources should not have been
spent, even partially.  

`sources` can be one of the followings:

- `operation-id`

- `{ id: operation-id }`

- `[ operation-id, ... ]` (a list of [Operation ID](#operation-identifier))

The callback should have signature `cb(err, msg)`.  `err` is `null` if the
operation was successful or `Error` (truthy) otherwise. `msg` is an [SSB
Message](#ssb-message).

Options can be the following:

```js
{
    author: SSB_LOG_ID || null,          // Default: ".ssb/secret"
}
```

where:

- `author`: is the [SSB ID](./help/ssb.txt) or 
   [SSB Keys](https://github.com/ssbc/ssb-keys) that is burning the tokens.

Note: To burn a partial amount from a source, first give the partial amount to
yourself. To burn a partially spent source, first give to yourself the
remainder, then burn this last `give` operation.

#### Log Effect(s)

1. `author`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/burn",
    "sources": [ { amount: Number, id: operation_id }, ... ],
    "amount": Number,
    "tokenType": String // Same as operations listed in source
}
```

#### Errors

Immediately throws an error if one of the inputs is incorrect. Otherwise,
errors are returned through the callback `cb(err)`.

If the default author id cannot be retrieved, errors from `ssb.whoami` will be
returned. Prior to publishing, the message is validated with
`ssb.tokens.validation.requirements`, which may return an error if the
values are not as expected. The message is then published with `ssb.publish`,
if the default identifier is used, or `ssb.identities.publishAs`, which may also
raise errors.

Internally uses `ssb.tokens.unspent`, so will error if it fails. Will also
error if `sources` have been partially or completed spent.

## Queries

### Common Pre-conditions

1. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or
   [ssb-client](https://github.com/ssbc/ssb-client) instance, is correctly
running.

### ssb.tokens.ancestors(sources, ?opts, cb(err, tangle))

#### Errors

If some ancestors could not be found, `err.notFound=true` with the list
of missing sources in `err.sources`. It may also be that one of the ancestors
is not a valid operation, in which case `err.invalid=true`. Otherwise,
the underlying ssb storage may have had an internal error, in which case
the `error.message` will be `Error retreiving message ...`.

### ssb.tokens.balance(tokenType, owner, cb(err, balance))

Compute the balance of tokens of `tokenType` owned by `owner` 
[SSB Log ID](#ssb-log-id).

The callback should have signature `cb(err,balance)`. `err` is `null`
if the query was successful. The `balance` is:

```javascript
{
    owner: SSB_LOG_ID,
    tokenType: String,
    amount: Number,
    created: [ SSB_MSG_ID, ... ],  // All create operations by owner
    received: [ SSB_MSG_ID, ... ], // All give operations with owner as receiver  
    given: [ SSB_MSG_ID, ... ],    // All give operations by owner
    burnt: [ SSB_MSG_ID, ... ],    // All burn operations by owner
    unspent: {
      SSB_MSG_ID: {                // Dictionary of all operations with non-zero 
        id: SSB_MSG_ID,            // unspent amounts. unspent properties
        amount: Number,            // are in order of timestamp 
        tokenType: String,
        timestamp: Date
      }, ...
    },                              
    missing: {
      operations: [ SSB_MSG_ID, ... ],   // All operations with missing sources
      sources: { SSB_MSG_ID: true, ... } // Dictionary of missing sources
    }
    all: {
        SSB_MSG_ID: SSB_MSG        // All operations referred previously,
                                   // including operations with missing sources
    }
}
```

Invariants: 

    * `balance.amount` is the total: `created` + `received` - `given` - `burnt`
    * `balance.amount` is the total from the sum of `balance.unspent` amounts
    * all operations in `given` and `burnt` of operations in `created` and
      `received` as sources

#### Errors

Immediately throws an error if one of the inputs is incorrect. Otherwise,
errors are returned through the callback `cb(err)`.

The balance `amount` is computed only from valid messages, i.e., the invalid
messages with the same `tokenType` are silently ignored.

### ssb.tokens.identities.list(?options, cb(err, ids))

List identities. Defaults to all identities appearing in SSB messages.

Options can be the following:

```js
{
    own: Boolean,         // Default: false
    tokenType: String,    // Default: undefined (match any)
    used: Boolean         // Default: false
}
```

where:

- `own`: selects only identities with locally accessible private keys.
- `tokenType`: selects only identities involved in operations with `tokenType`,
               implies `options.used=true`.
- `used`: selects only identities that were used in token operations.

The callback should have signature `cb(err,
ids)`, where `ids` is an array of SSB Log IDs. `err` is `null` if the query was
successful. 

#### Errors

### source = ssb.tokens.operations(?options)

List operations matching `options`.

```js
{
    match: {
        author:      SSB_LOG_ID || [SSB_LOG_ID], // Default: undefined (match any)
        receiver:    SSB_LOG_ID || [SSB_LOG_ID], // Default: undefined (match any)
        participant: SSB_LOG_ID || [SSB_LOG_ID], // Default: undefined (match any)
        operations: {
            create: Boolean, // Default: true (match)
            give: Boolean,   // Default: true (match)
            burn: Boolean    // Default: true (match)
        },
        tokenType: String || [String], // Default: undefined (match any)
    },
    valid: Boolean,   // Default: true (output valid operations)
    invalid: Boolean, // Default: false (do not output invalid operations)
    old: Boolean,     // Default: true (output already received operations)
    live: Boolean,    // Default: false (output incoming operations)
    sync: Boolean     // Default: false (output sync message when all old messages or output)
}
```

where:

- `match.author`: is the [SSB ID](./help/ssb.txt) is the operation author. 
- `match.receiver`: is the [SSB ID](./help/ssb.txt) is the receiver of a `give`.
- `match.participant`: is the [SSB ID](./help/ssb.txt) of either the author OR
                       receiver. Matches if either the operation's author or
                       receiver is in `match.participant`.  Incompatible with
                       the use of either `match.author` and `match.receiver`.
- `match.operations`: are the types of operations. If no type provided,
                      matches all operation types, otherwise, only those
                      provided with an explicit `true` value.
- `match.tokenType`: is the tokenType of operations.
- `valid`: output valid operations if true
- `invalid`: output invalid operations if true
- `old`: output already received operations if true
- `live`: output incoming operations if true

Returns a [pull-stream](https://github.com/pull-stream/pull-stream) source.

#### Errors

Throws an error if options are of the wrong types or do not follow the 
expected format. The pull-stream source may also raise a callback error,
see [ssb-query](https://github.com/ssbc/ssb-query).

### ssb.tokens.types(?options, cb(err, types))

Find `tokenTypes` matching `options`. Returns a dictionary `types` that
associates `tokenTypes` to their properties, as defined on creation messages. 

Options can be the following:

```js
{
    match: {
        author: SSB_LOG_ID,        // Default: undefined (match any)
        decimals: Number,          // Default: undefined (match any)
        description: SSB_MSG_ID,   // Default: undefined (match any)
        name: String,              // Default: undefined (match any) 
        unit: String,              // Default: undefined (match any)
    },
    validate: Boolean              // Default: true      
}
```

where:

- `match.author`: is the [SSB ID](./help/ssb.txt) or 
   [SSB Keys](https://github.com/ssbc/ssb-keys) that created the tokens.
- `match.*` properties, match those of the create operation  (see
  `ssb.tokens.create`).
- `validate`: if `true` (default), returns only tokenTypes of valid create
  operations, otherwise return all tokenTypes even from invalid create messages.

#### Errors

Returns an error if options are of the wrong types or do not follow the 
expected format.


### ssb.tokens.unspent(msgId, owner, seqno?, cb(err, unspent, msg))

Compute the unspent amount from `msg`, as owned by `owner`, up to `owner`'s log
`seqno` (exclusive).

`msgId` is a [SSB Message ID](#ssb-message-id)

`owner` is a [SSB Log ID](#ssb-log-id).

`seqno` is the bound on the sequence number (exclusive) of messages from
`owner` (optional, defaults to frontier).

The callback should have signature `cb(err, unspent, msg)`.  `err` is `null` if
the query was successful or `Error` (truthy) otherwise. `unspent` is the
amount of unspent tokens from `msg` [SSB Message](#ssb-message-format).

#### Errors

Immediately throws an error if one of the inputs is incorrect. Otherwise,
errors are returned through the callback `cb(err)`.

If `msgId` could not be found, or the ancestors of related operations could not
be found,  `err.notFound=true`. If `msgValue` retrieved from `msgId` is
invalid, returns an error. Otherwise, successfully completes.

The unspent amount is computed only from valid messages with the same
`tokenType` as `msgValue.content.tokenType`, i.e., the invalid messages
with the same `tokenType` are silently ignored.

## Validation

### ssb.tokens.valid(msg, ?options, cb(err, msg))

Transitively check whether `msg` is valid. Uses caching to avoid re-validating
the same source twice.

The callback should have signature `cb(err, msg)`. `err` is `null` if the
operation was successful or `Error` (truthy) otherwise. `msg` is the same as
the input.

#### Log Effect(s): None

#### Errors

See `ssb.tokens.validate.requirements`.

### err = ssb.tokens.validate.format(op)

Synchronously check that the syntax of `op` is correct, i.e. that all expected
properties are present, have the right value types, and values are consistent.
Does not retrieve the messages of sources, nor check for consistency with the
source messages properties.

`op` should be an ssb-tokens operation.

Returns `null` if `op` has a correct format, otherwise returns an `Error` with
the first issue encountered.

#### Errors

See the source code for all potential formatting errors.

### ssb.tokens.validate.requirements(msgValue, ?options, cb(err, msgValue))

Asynchronously check that all the values in `msgValue` are correct, i.e. that
they satisfy all the requirements expected for its type.  Retrieves sources'
messages and checks for consistency with the sources properties.

#### Errors

Two types of errors: 
   
    1. `err.notFound=true`: one of the sources of `msgValue` or one of its
       ancestors could not be found;
    2. otherwise, `msgValue`, oone of its sources, one of its sources' ancestors 
       was invalid, in which case `msgValue` is also invalid.

## Debugging

### ssb.tokens.debug(boolean) 

Activate debugging mode if `boolean` is `true`.

In debugging mode, the calling context is saved when the API is invoked. Upon
an error, the calling context can be found on the error returned in a
callback `cb(err, ...)`:

    * `err.caller` provides the stack trace at the entry of the API call
    * `err.args` provides the input arguments to the function invoked

