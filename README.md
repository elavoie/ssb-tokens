# SSB-Tokens

````Tokens for community economics. Built with [Secure-Scuttlebutt](https://scuttlebutt.nz/).````

## Quick Start

```
    npm install -g ssb-tokens
```

## Command-Line Interface

### [create](./help/create.txt): Create new tokens from thin air!

```
    ssb-tokens create
```

### [give](./help/give.txt): Give some of your tokens to someone else!

```
    ssb-tokens give
```

### [burn](./help/burn.txt): Destroy some of your tokens!

```
    ssb-tokens burn
```

### [trace](./help/trace.txt): trace the history of transactions behind tokens!

```
    ssb-tokens trace
```

### [list](./help/list.txt): Summarize all your token holdings (or those of others)!

```
    ssb-tokens list
```

## Example Applications

For each example, the participants are 
mentioned with their SSB aliases (ex: "@ssb_alias"). When
necessary, specific messages are mentioned with an SSB message
ID (ex: "%ssb_msg_id").

### 1. Scuttleflotilla Crowdfunding

Each backer receives tokens that can later be exchanged for a
ride on the boat, or other services offered by the crew.

#### Creation

@initiator:

```
    ssb-tokens create 100 "Alchemist Token" 
    # Announce project. For each @backer, do:
    ssb-tokens give 1 "Alchemist Token" "@backer"
```

#### Exchanges

@backer:

```
    # Gift to/Trade with friends
    ssb-tokens give 1 "Alchemist Token" "@friend"
```

#### Redeeming

@friend:

```
    # Redeems a token for a ride on the Alchemist
    ssb-tokens give 1 "Alchemist Token" "@initiator"
    # Outputs: "%redeemed_token" message ID
```

@initiator:

```
    ssb-tokens burn "%redeemed_token"
```

See [./test/alchemist.js](./test/alchemist.js) for implementation
of this example with the [API](doc/api.md) instead of the 
command-line interface.

### 2. Community Supported Agriculture

Farmer sells credits for baskets of products at the beginning of a season. Once
the products are ready, the basket is bought with the credits. To help the
farmer, participants can buy more than their share of baskets in a given week
and sell the surpluses to other participants using the same credits.

#### Creation

@farmer (beginning of season):

```
    ssb-tokens create 1500 "Farmer Basket Credit"
    # For each of the ~150 @buyer, @buyer buys ~10 baskets and @farmer does:
    ssb-tokens give 10 "Farmer Basket Credit" @buyer
```

#### Redeeming with Implicit Community Distribution

@buyer1 asks @buyer2 to redeem their basket in a given week:

```
    ssb-tokens give 1 "Farmer Basket Credit" @buyer2 
```

@buyer2 redeems both baskets at the same time:

```
    ssb-tokens give 2 "Farmer Basket Credit" @farmer
    # Outputs: %baskets_redeemed
```

@farmer burns the basket credits:

```
    ssb-tokens burn %baskets_redeemed
```

See [./test/csa.js](./test/csa.js) for implementation
of this example with the [API](doc/api.md) instead of the 
command-line interface.

#### Redeeming with Explicit Distributor

@distributor offers a distribution service to buyers:

```
    ssb-tokens create 1500 "Distribution Credit"
```

@buyer buys the home delivery:

```
    ssb-tokens give 10 "EUR" @distributor 
    ssb-tokens give 1 "Farmer Basket Credit" @distributor
    # Outputs: %basket_transfer
```

@distributor gives a distribution credit linked to the actual product:

```
    ssb-tokens give 1 "Distribution Credit" --desc="%basket_transfer" @buyer
    # Outputs: %distribution_credit
```

@distributor redeems the basket from @farmer:

```
    ssb-tokens give 1 %basket_transfer @farmer
    # Outputs: %basket_redeeming
```

@buyer redeems the basket from @distributor:

```
    ssb-tokens give %distribution_credit @distributor
    # Outputs: %distribution_redeeming
```

@farmer burns the basket credit:

```
    ssb-tokens burn %basket_redeeming 
```

@distributor burns the distribution credit:

```
    ssb-tokens burn %distribution_redeeming 
```

See [./test/csa-w-distributor.js](./test/csa-w-distributor.js) for
implementation of this example with the [API](doc/api.md) instead of the
command-line interface.

### 3. Fidelity Program

Small shops create fidelity credits that can be exchanged later for products
and services (ex: Each sandwich bought gives one credit; 20 credits give one
free sandwich.).

@customer buys a sandwich from @shop:

```
    ssb-tokens give 5 "EUR" @shop
```

@shop gives fidelity points to @customer:

```
    ssb-tokens create 1 "Shop Point"
    ssb-tokens give 1 "Shop Point" @customer
```

After 10 sandwiches, @customer redeems the points for a free sandwich:

```
    ssb-tokens give 10 "Shop Point" @shop
    # Outputs: %redeemed_points
```

@shop burns the points:

```
    ssb-tokens burn %redeemed_points
```

See [./test/fidelity.js](./test/fidelity.js) for
implementation of this example with the [API](doc/api.md) instead of the
command-line interface.

### 4. Sweat-Equity Open Source Development

Volunteers receive "hours" credits for their work helping to improve SSB.
Once SSB starts having revenues, a percentage of those revenues is used
to buy back volunteer credits from the oldest to the newest.

@volunteer spent 2h fixing issues
@maintainer records the help:

```
    ssb-tokens create 2 "SSB-Tokens Hour" --unit "Hour"
    ssb-tokens give 2 "SSB-Tokens Hour" @volunteer
```

@backer donates to @maintainer:

```
    ssb-tokens give 20 "USD" @maintainer
```

@maintainer offers to buy back some volunteer hours at 10$/h.
@volunteer redeems one (and keeps the other as social recognition):

```
    ssb-tokens give 1 "SSB-Tokens Hour" @maintainer
    # Outputs: %redeemed_hour
```

@maintainer completes the transaction:

```
    ssb-tokens give 10 "USD" @volunteer
    ssb-tokens burn %redeemed_hour
```

See [./test/osd.js](./test/osd.js) for implementation of this example with the
[API](doc/api.md) instead of the command-line interface.

# Related Work

1. EuroToken: https://repository.tudelft.nl/islandora/object/uuid%3A132faae8-6883-454f-a8ce-94735340dce9?collection=education
