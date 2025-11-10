# creating my first external adapter

below i'll be detailing my experience while implementing a basic chainlink price feed adapter in the external-adapter-js repo.

## generating the adapter

1. called yarn source basic-link-price-source

-

- after running script log output told me to run this:
  yo ./.yarn/cache/node_modules/@chainlink/external-adapter-framework/generator-adapter/generators/app/index.js packages/sources && yarn ne
  w tsconfig

- for adapters use this library to interface with oracles, found it useful to reference which type of call i should use : https://github.com/smartcontractkit/ea-framework-js/tree/main

- switched adapter logic to crypto endpoint for specfic task
-
