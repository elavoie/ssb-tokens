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

## Operations

### Common Pre-conditions

1. The private key of `owner` is accessible by the running [ssb-server](https://github.com/ssbc/ssb-server).
2. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance,  is correctly running.

### ssb.tokens.create(number, currency, ?options, cb(err,msg))

Create `number` (Number) of type `currency` (String), with `currency` at most 30 characters long.

The callback should have signature `cb(err, msg)`: `err` is `null` if the operation was successful or `Error` (truthy) otherwise, and `msg` is the message saved in the log, augmented with its assigned `id` ([SSB Message ID](#ssb-message-id)), and its `owner` ([SSB Log ID](#ssb-log-id)).

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,       // Default: null
    description: SSB_MSG_ID || null,   // Default: null
    "smallest-unit": Number            // Default: 0.01
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
    "number": number,
    "currency": currency,
    "description": options.description,
    "smallest-unit": options["smallest-unit"]
}
```

The previous message is automatically assigned an`id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.give(tokens, recipient, ?options, cb(err, msg))

Give `tokens` to `recipient` ([SSB Log ID](#ssb-log-id)). 

`tokens` can be one of the followings:

* `operation-id` ([SSB Message ID](#ssb-message-id)): gives all the remaining [*unspent* tokens](#unspent-tokens) from `operation-id`. `operation-id` must be a valid [operation](#operation) and there should be remaining [unspent tokens](#unspent-tokens).

* `[ [number, operation-id], ...]` :  gives `number` tokens from `operation-id` for each pair in the list. `operation-id`s must be valid [operations](#operations), their [root operations](#root-operations)' `currency` and `description` must match, and each `operation-id` must have at least `number` [unspent tokens](#unspent-tokens).

* `number` (Number):  automatically finds the `operation-id`s of [unspent tokens](#unspent-tokens) that match `options.currency` and `options["root-description"]` (match any when `null`). Tokens are spent from oldest to newest.

* `null` : automatically finds the `operation-id`s of [*unspent* tokens](#unspent-tokens) that match `options.currency` and `options["root-description"]` (match any when `null`).  All tokens are spent.

`owner` can only give [*unspent* tokens](#unspent-tokens) they own: all explicitly listed, or implicitly matched, `operation-id`s of `tokens` must have `owner` as `recipient`.

The callback should have signature `cb(err, msg)`: `err` is `null` if the operation was successful or `Error` (truthy) otherwise, and `msg` is the message saved in the log, augmented with its assigned `id` ([SSB Message ID](#ssb-message-id)), and its `owner` ([SSB Log ID](#ssb-log-id)).

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,           // Default: null
    currency: String || null,              // Default: null
    "root-description": SSB_MSG_ID || null // Default: null
}
```

where:

* `owner`: is the [SSB Log ID](#ssb-log-id) that is giving the tokens. If `null`, use the default log ID ([ssb-server](https://github.com/ssbc/ssb-server) uses `~/.ssb/secret` by default).
* `currency` : is the `currency` (String) of [*root* operations](#root-operations). Only keep [*root* operations](#root-operations) that match. Errors if inconsistent with the [*root* operations](#root-operations) of `tokens`'s `operation-id`s.
* `root-description`: is the `description` ([SSB Message ID](#ssb-message-id)) of [*root* operations](#root-operations). Only keep [*root* operations](#root-operations) that match. Errors if inconsistent with the [*root* operations](#root-operations) of `tokens`'s `operation-id`s.

#### Pre-conditions

Let `roots` be the [*root* operations](#root-operations) of `tokens`:

1. All `roots` must have the same `currency`, `description`, and `smallest-unit`.
2. The total number of [*unspent* tokens](#unspent-tokens) owned by `owner` that derive from `roots` is larger than the `number` of `tokens` to give.
3. `number` is an integer multiple of `roots["smallest-unit"]`.
4. Every previous operation reachable from `tokens` must be valid, i.e. fulfill its pre-conditions.

#### => Log Effect(s)

1. `owner`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/give",
    "source": [ [ number, operation-id ], ... ],
    "recipient": SSB_OWNER_ID
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.burn(tokens, ?options, cb)

Burn (owned) `tokens`.

`tokens` can be one of the followings:

- `operation-id`

- `[ operation-id, ...]` (a list of [Operation ID](#operation-identifier))

The callback should have signature `cb(err)`.  `err` is `null` if the operation was successful or `Error` (truthy) otherwise.

Options can be the following:

```js
{
    owner: SSB_LOG_ID || null,          // Default: ".ssb/secret"
    description:  SSB_MSG_ID || null    // Default: null
}
```

where:

- `owner`: is the [SSB ID](./help/ssb.txt) or [SSB Keys](https://github.com/ssbc/ssb-keys) that is giving the tokens.
- `description`: is a [SSB Message ID](./help/ssb.txt) that describes the purpose of the burn.

#### Pre-conditions

Let `roots` be the *roots* of `tokens`:

1. All `roots` must have the same `currency`, `description`, and `smallest-unit`.
2. Every previous operation reachable from `tokens` must be valid, i.e. fulfill its pre-conditions.

#### => Log Effect(s)

1. `owner`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/burn",
    "source": [ operation_id, ... ],
    "description": options.description
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `owner` ([SSB Log ID](#ssb-log-id))'s log.

## Meta-Operations

### Common Pre-conditions

1. The private key of `witness` ([SSB Log ID](#ssb-log-id)) is accessible by the running [ssb-server](https://github.com/ssbc/ssb-server).
2. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance, is correctly running.

### ssb.tokens.flag(tokens, label, ?options, cb)

Flag `tokens` with `label`.

`tokens` is an [Operation ID](#operation-identifier).`label` is a String of 50 characters or less. The meaning of `label` is up to users/applications.

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
    "source": OPERATION_ID,
    "label": label,
    "description": options.description
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `witness` ([SSB Log ID](#ssb-log-id))'s log.

### ssb.tokens.unflag(tokens, label, options?, cb)

Remove previously assigned flag `label` from `tokens`.

`tokens` is an [Operation ID](#operation-identifier).`label` is a String of 50 characters or less. The meaning of `label` is up to users/applications.

`options` can be the following:

```javascript
{
    witness: SSB_ID || SSB_KEYS,          // Default: ".ssb/secret"  
}
```

where:

- `witness`: is the [SSB_Log ID](#ssb-log-id) that is unflagging the tokens.

#### => Log Effect(s):

1. `witness`'s log is extended with the following message:

```json
{
    "type": "tokens/<version>/unflag",
    "source": OPERATION_ID,
    "flag": FLAG_ID,
    "label": label
}
```

The previous message is automatically assigned an `id` ([SSB Message ID](#ssb-message-id)) by SSB for publication in `witness` ([SSB Log ID](#ssb-log-id))'s log.

## Queries

### Common Pre-conditions

1. `ssb`, an [ssb-server](https://github.com/ssbc/ssb-server) or [ssb-client](https://github.com/ssbc/ssb-client) instance, is correctly running.

### ssb.tokens.list(filter, owner, ?options, cb)

List tokens owned by `owner` that match `filter`.

`filter` can be one of the followings:

- `operation-id` ([SSB Message ID](./help/ssb.txt)): show operations that have [Operation ID](#operation-identifier) as an *ancestor*.

- `root-currency` (String): show operations whose *root*s' `currency` match `root-currency`.

- `root-description` ([SSB Message ID](./help/ssb.txt)): show only operations whose *roots'* `description` match `root-description`.

- `null`: show all operations.

`owner` can be one of the followings:

- `SSB_ID`: show operations of tokens owned by [SSB ID](./help/ssb.txt).

- `null`: show operations of tokens owned by anyone.

The callback should have signature `cb(err, result)`. `err` is `null` if the operation was successful or `Error` (truthy) otherwise. `result` is `[operation, ...]` that match `filter` and `owner`. Each [operation](#operation) has the following properties added:

```javascript
{
    id: operation_id,
    flags: [ label, ... ]    
}  
```

`options` can be the following:

```js
{
    status: &#39;spent&#39; || &#39;unspent&#39; || &#39;all&#39;,   // Default: &#39;unspent&#39;
}
```

where:

- `status`: If `spent`, show only [operations](#operation) with tokens completely spent. If `unspent`, show only operations with *unspent* tokens. If `all`, show all operations.

#### => Log Effect(s): None

### ssb.tokens.trace(tokens, ?options, cb)

Trace the history of `tokens`.

`tokens` can be one of the followings:

- `operation-id` ([SSB Message ID](./help/ssb.txt)): shows the *ancestors* of [Operation ID](#operation-identifier).

- `root-currency` (String): shows the *ancestors* of all [operations](#operation) whose *root*'s `currency` matches `root-currency`.

- `root-description` ([SSB Message ID](./help/ssb.txt)): show the ancestors of operations whose *roots'* `description` match `root-description`.

The callback should have signature `cb(err, traces)`. `err` is `null` if the operation was successful or `Error` (truthy) otherwise. `traces = [ trace, ...]` where each `trace` is a recursive tree of operations. For each operation, the [Operation ID](#operation-identifier) listed in `source` is replaced by the referred [operation](#operation), and the following properties are added:

```javascript
{
    id: operation_id,
    valid: true || Error(msg),
    flags: [ label, ... ]
}
```

where `operation_id` is the corresponding [Operation ID](#operation-identifier) and `valid` is `true` if all *ancestors* are valid and the operation fulfills its pre-conditions.

`options` can be the following:

```js
{
    status: &#39;spent&#39; || &#39;unspent&#39; || &#39;all&#39;,   // Default: &#39;unspent&#39;
}
```

where:

- `status`: If `spent`, show only operations with tokens completely spent. If `unspent`, show only operations with *unspent* tokens. If `all`, show all operations. Ignored if `tokens = operation_id`.

#### => Log Effect(s): None
