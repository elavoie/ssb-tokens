# Application Programming Interface (API)

The API closely follows the [command-line interface](../help/index.txt).  See [Design](../doc/design.md) for a detailed rationale behind the design.

For all message types below, `<version>=J9oN`.

## Terminology

### Meta-operation

*Def:* A message that [adds](#tokensflagtokens-label-options-cb) or [removes](#tokensunflagtokens-label-options-cb) information *about* an [operation](#operation). 

#### Meta-operation Identifier

*Def:* The identifier of a [meta-operation](#meta-operation). Follows the [SSB Message ID](#ssb-message-id) format.

### Operation

*Def:* A message that [creates](#tokenscreatenumber-currency-options-cb), [transfers (gives)](#tokensgivetokens-recipient-options-cb), or [destroys (burns)](#tokensburntokens-options-cb) tokens. 

#### Operation Identifier

*Def:* The identifier of an [operation](#operation).  Follows the [SSB Message ID](#ssb-message-id) format.

#### *Ancestor* operations

*Def*: Previous operations that provide tokens for the current one.

Immediate ancestors are mentioned in the `source` property of a [give](#tokensgivetokens-recipient-options-cb) or [burn](#tokensburntokens-options-cb) message. Transitive ancestors are mentioned in the `source` property of an ancestor.

#### *Descendant* operations

*Def*: Following operations that source their tokens from the current one.

Descendants are not directly encoded in messages because they are unknown at the time of writing. They are derived indirectly from the chain of [ancestors](#ancestor-operations) of later [operations](#operation).

#### *Root* operations

*Def:* Oldest *ancestors* of an operation. Always a [create](#tokenscreatenumber-currency-options-cb) operation.

### Query

*Def:* An invocation that finds, filters, and organize [operations](#operations) and [meta-operations](#meta-operation) messages.

### Secure-Scuttlebutt (SSB) Message

*Def:* An immutable message replicated with the [Secure Scuttlebutt](https://en.wikipedia.org/wiki/Secure_Scuttlebutt) protocol, created by a single owner.

The integrity of messages is guaranteed by [cryptographic primitives](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds). See 'Message Format' in the [Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds).

#### SSB Message ID

*Def:* Hash of the message including signature. 

See 'Message Format' in the [Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds).

#### SSB Log ID

*Def:* Public key of the log.

Also known as SSB Feed ID. See ''Keys and identities" in  the [Protocol Guide](https://ssbc.github.io/scuttlebutt-protocol-guide/#keys-and-identities).

### Tokens

*Def:* Units of [exchange](https://en.wikipedia.org/wiki/Medium_of_exchange) and [accounting](https://en.wikipedia.org/wiki/Unit_of_account) between (SSB) users. 

Individual tokens are not represented by individual SSB messages: instead, they are [created](#tokenscreatenumber-currency-options-cb), [transferred (given)](#tokensgivetokens-recipient-options-cb), or [destroyed (burned)](#tokensburntokens-options-cb) in bulk.

Any user can create as many tokens as they wish for whichever purpose. The usefulness of tokens to [store value](https://en.wikipedia.org/wiki/Store_of_value) therefore depends on: (1) the behaviour of their creator (ex: how many they create and how often) and (2) the trust in other users that their creator can fulfill the associated promises, if any.  Tokens are therefore ill-suited to implement cryptocurrencies that derive their value from [artificial scarcity](https://en.wikipedia.org/wiki/Artificial_scarcity), such as [Bitcoin](https://en.wikipedia.org/wiki/Bitcoin#Mining).

#### *Unspent* tokens

*Def*: Tokens created or previously received, that have not yet been transferred or destroyed.

In practice, this means the remaining (positive) balance between the total number of tokens received from [create](#tokenscreatenumber-currency-options-cb) and [give](#tokensgivetokens-recipient-options-cb) operations, and the total number of tokens spent in [give](#tokensgivetokens-recipient-options-cb) and [burn](#tokensburntokens-options-cb) operations.

## Initialization

```javascript
    var Server = require('ssb-server')
    var config = require('ssb-config')

    // add ssb-tokens and dependencies
    Server.use(require('ssb-tokens'))

    // create the server 
    var ssb = Server(config)

    // call ssb-tokens' operations
    ssb.tokens.create(...)
```

Optionally, the API of ssb-tokens can be advertised for [ssb-client](https://github.com/ssbc/ssb-client)s through a manifest file:

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

`ssb-tokens` must be installed in [ssb-server](https://github.com/ssbc/ssb-server) rather than in [ssb-client](https://github.com/ssbc/ssb-client) if there is a possibility of multiple clients issuing operations for the same `owner` (ex: [giving](#tokensgivetokens-recipient-options-cb) tokens): this guarantees that the tokens spent in one client will be seen by the others, avoiding invalid operations.

### Required Plugins `ssb-server`

1. [ssb-query](https://github.com/ssbc/ssb-query)

### Optional Plugins `ssb-server`

1. [ssb-identities](https://github.com/ssbc/ssb-identities) to use the `owner` option, which can use a different identity than the default.

## Operations

### Common Pre-conditions

1. The private key of `owner` is accessible by the running [ssb-server](https://github.com/ssbc/ssb-server).
2. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance,  is correctly running.

### ssb.tokens.create(amount, currency, ?options, cb(err,msg))

Create `amount` (Number) of type `currency` (String), with `currency` at most 30 characters long.

The callback should have signature `cb(err, msg)`: `err` is `null` if the operation was successful or `Error` (truthy) otherwise, and `msg` is the message saved in the log, augmented with its assigned `id` ([SSB Message ID](#ssb-message-id)), and its `owner` ([SSB Log ID](#ssb-log-id)).

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,       // Default: null
    description: SSB_MSG_ID || null,   // Default: null
    "smallest-unit": Number            // Default: 1
}
```

where:

* `owner`: is the [SSB Log ID](#ssb-log-id) that is creating the tokens. If `null`, use the default log ID ([ssb-server](https://github.com/ssbc/ssb-server) uses `~/.ssb/secret` by default).
* `description`: is an optional [SSB Message ID](#ssb-message-id) whose content describes the purpose and conditions of the tokens.
* `smallest-unit`: is a number that represents the smallest undivisible unit of the currency (ex: `0.01` for cents in `USD`).

#### => Log Effect(s)

`owner`'s log is extended with:

```json
{
    "type": "tokens/<version>/create", 
    "amount": amount, (Number)
    "currency": currency, (String)
    "description": options.description, (String || null)
    "smallest-unit": options["smallest-unit"] (Number),
    "token-hash": hash(currency + options.description + options["smallest-unit"]) (String)
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.give(source, recipient, ?options, cb(err, msg))

Give (owned) tokens from `source` to `recipient` ([SSB Log ID](#ssb-log-id)). 

`source` can be one of the followings:

* `operation-id` ([SSB Message ID](#ssb-message-id)): gives all the remaining [*unspent* tokens](#unspent-tokens) from `id`. 

* `{ amount: Number, id: operation-id }`: gives `amount` from `id`.

* `{ 
     amount: Number, 
     "token-hash": String 
   }`: gives `amount` from earliest received tokens that match `token-hash`.

* `[ source, ... ]` :  gives tokens from each source in the list. Each `source` should have an `amount` and `operation-id`.

The callback should have signature `cb(err, msg)`: `err` is `null` if the operation was successful or `Error` (truthy) otherwise, and `msg` is the message saved in the log, augmented with its assigned `id` ([SSB Message ID](#ssb-message-id)), and its `owner` ([SSB Log ID](#ssb-log-id)).

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,           // Default: null
}
```

where:

* `owner`: is the [SSB Log ID](#ssb-log-id) that is giving the tokens. If `null`, use the default log ID ([ssb-server](https://github.com/ssbc/ssb-server) uses `~/.ssb/secret` by default).

#### Pre-Conditions

`tokens` must be owned by `owner`, i.e. `owner` either created or received the tokens from others, and has not burned them already.

The total number of [*unspent* tokens](#spent-tokens), prior to this operation, is greater or equal to the `number` of tokens given, for each pair of `number` and `operation-id`.

[Ancestor operations](#ancestors-operation) of `tokens` must be valid, i.e. fulfill their pre-conditions.

Let `roots` be the [*root* operations](#root-operations) of `tokens`:

1. All `roots` must have the same `token-hash`.
2. `amount` is an integer multiple of `roots['smallest-unit']`.

#### => Log Effect(s)

1. `owner`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/give",
    "token-hash": String, // Same as operations listed in source
    "source": [ { amount: Number, id: operation-id }, ... ],
    "amount": Number,
    "recipient": SSB_LOG_ID
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.burn(source, ?options, cb)

Burn (owned) `tokens`.

`source` can be one of the followings:

- `operation-id`

- `[ operation-id, ... ]` (a list of [Operation ID](#operation-identifier))

The callback should have signature `cb(err)`.  `err` is `null` if the operation was successful or `Error` (truthy) otherwise.

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,          // Default: ".ssb/secret"
}
```

where:

- `owner`: is the [SSB ID](./help/ssb.txt) or [SSB Keys](https://github.com/ssbc/ssb-keys) that is giving the tokens.

#### Pre-conditions

Let `roots` be the *roots* of `source`:

1. All `roots` must have the same `token-hash`.
2. All operations should not be the source of any give operation, i.e. the full amount of the source
   should be available to burn.

To burn a subset of the available amount from source, first give to oneself a partial amount then burn the self-given tokens.

#### => Log Effect(s)

1. `owner`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/burn",
    "token-hash": String, // Same as operations listed in source
    "source": [ operation_id, ... ],
    "amount": Number
}
```

in which each source `amount` is the total amount for each listed `operation`, and the operation `amount` is the total amount for all operations listed.  The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

## Meta-Operations

### Common Pre-conditions

1. The private key of `witness` ([SSB Log ID](#ssb-log-id)) is accessible by the running [ssb-server](https://github.com/ssbc/ssb-server).
2. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance, is correctly running.

### ssb.tokens.flag(operations, label, ?options, cb)

Flag `tokens` with `label`.

`operations` is a list of [Operation ID](#operation-identifier).`label` is a String of 50 characters or less. The meaning of `label` is up to users/applications.

`options` can be the following:

```javascript
{
    witness: SSB_ID || null,            // Default: null
    description: SSB_MSG_ID || null     // Defaults: null    
}
```

where:

* `witness`: is the [SSB Log ID](#ssb-log-id) that is flagging the tokens.

* `description` is an optional [SSB Message ID](./help/ssb.txt) whose content describes the meaning of the label.

#### => Log Effect(s):

1. `witness`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/flag",
    "source": operations,
    "label": label,
    "description": options.description
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `witness` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.unflag(flag, options?, cb)

Remove previously assigned flag `label` from `tokens`.

`flag` is the [Operation ID](#operation-identifier) of the previous flag message to undo.

`options` can be the following:

```javascript
{
    witness: SSB_ID || null,          // Default: ".ssb/secret"  
}
```

where:

- `witness`: is the [SSB_Log ID](#ssb-log-id) that is unflagging the operations.

#### => Log Effect(s):

1. `witness`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/unflag",
    "flag": SSB_MSG_ID
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `witness` ([SSB Log ID](#ssb-log-id))'s log.

## Queries

### Common Pre-conditions

1. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance, is correctly running.

### ssb.tokens.list(filter, ?options, cb(err,tokens))

List the current state of tokens that match `filter`.

`filter` can have the following options to include only tokens that match:
```javascript
{
    owner: SSB_LOG_ID,
    currency: String,
    description: SSB_MSG_ID,
    "smallest-unit": Number,
    "token-hash": String
}
```

`options` can be the following:

```js
{
    stateless: Boolean  // If true, omit all properties related to state 
}
```

The callback should have signature `cb(err, tokens)`. `err` is `null` if the operation was successful or `Error` (truthy) otherwise. `tokens` is `[token, ...]` that match `filter`. Each `token` has the following properties:

```javascript
{
    currency: String,
    description: SSB_MSG_ID || null,
    "smallest-unit": Number,
    "token-hash": String,

    // (Omitted when options.stateless=true)
    owner: SSB_LOG_ID, 
    balance: Number,
    created: [ operation, ... ],
    received: [ operation, ... ],
    given: [ operation, ... ],
    burnt: [ operation, ... ],
    all: { operation_id: operation, ... }
}  
```

Each [operation](#operation) has the following properties added:
```javascript
    id: SSB_MSG_ID,
    author: SSB_LOG_ID,  
    unspent: Number   // Remaining amount available for spending
```

Each `token` maintains the following invariants, given `sum = (a,b) => a+b`:
```javascript
    balance =  created.map( (op) => op.unspent ).reduce(sum, 0) +
              received.map( (op) => op.unspent ).reduce(sum, 0)

    balance =  created.map( (op) =>  op.amount ).reduce(sum, 0) +
              received.map( (op) =>  op.amount ).reduce(sum, 0) +
                 given.map( (op) => -op.amount ).reduce(sum, 0) +
                 burnt.map( (op) => -op.amount ).reduce(sum, 0)
```

Moreover:
    1. All operations in `given` and `burnt` have operations in `created` and `received` as `source`. 

#### => Log Effect(s): None

### ssb.tokens.trace(tokens, ?options, cb)

Trace the history of `tokens`.

`tokens` can be one of the followings:

- `operation-id` ([SSB Message ID](./help/ssb.txt)): shows the *ancestors* of [Operation ID](#operation-identifier).

- `[ operation-id, ...]` (a list of [Operation ID](#operation-identifier)): shows the ancestors of [Operation ID](#operation-identifier)s.

The callback should have signature `cb(err, dag, operations)`. `err` is `null` if the operation was successful or `Error` (truthy) otherwise. `dag = [ tokens... ]` is a directed acyclic graph where each `operation-id`  of `tokens` is a  tip of the graph. `operations = { operation-id: operation, ... }` for each `operation-id` appearing in `dag`. For each operation, the [Operation ID](#operation-identifier) listed in `source` is replaced by the referred [operation](#operation), and the following properties are added:

```javascript
{
    id: operation_id,
    valid: true || Error(msg),
    unspent: number,
    flags: [ label, ... ]
}
```

where `operation_id` is the corresponding [Operation ID](#operation-identifier), `valid` is `true` if all *ancestors* are valid and the operation fulfills its pre-conditions, `unspent` is the number of unspent tokens, and `flags` are the flags on this operation.

#### => Log Effect(s): None
