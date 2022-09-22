# API Design Rationale

## Independence from Execution Environment

While close to the [command-line interface](./help/index.txt), the API design
however sometimes departs from it or adds additional options to minimize the
dependence on particular execution environments (ex: id specified as
[ssb-keys](https://github.com/ssbc/ssb-keys) to avoid the need of looking into
the ````~/.ssb```` folder).

## Fast Message Lookup

All log messages, created as side-effects of API operations, have a type
````tokens/<version>/<operation>````, where ````<version>```` is the
protocol version, and ````<operation>```` is the operation performed, with a
one-to-one mapping with the API.  The version and operations are encoded in the
type to make lookup faster, i.e. by leveraging indexing made by databases on
message type.

## Random Alphanumeric Protocol Version

The current version of the protocol is defined with 4 random alphanumeric
characters, chosen at the time of designing the API. The version is random to
avoid conflicts with other potential messages that would use the same message
types (ex: ````tokens/<semver>/<operation>````), since the SSB community
does not enforce unicity of message types between applications (i.e. this would
require consensus).

## API Options Match JSON SSB Message Schemas

It may save typing to choose option names in camelCase (and would be more idiomatic to JavaScript), that are different from the usual JSON conventions (ex: `options.smallestUnits` vs `options["smallest-unit"]` used for recorded messages. However, it increases the mental burden to remember the correspondance rules between both. We therefore prefer to use the JSON conventions for API options.



## Play Nice with other SSB Applications

The library can work with a minimal number of operations offered by ssb-server,
so as to avoid unduly loading plugins that are not useful to other applications. Moreover, the connection to [ssb-server](https://github.com/ssbc/ssb-server) is done through [ssb-client](https://github.com/ssbc/ssb-client) for concurrent operations with other currently running applications, such as [Patchwork](https://github.com/ssbc/patchwork) or [Oasis](https://github.com/fraction/oasis).

## No silent failures and useful error messages

Mistakes in usage of API should always lead to explicit error messages. Error
messages should be as explicit as possible to provide the context of the error
and what can be done to fix it. Ideally, there should be no need for debugging
as the full context should be provided by the error itself.
