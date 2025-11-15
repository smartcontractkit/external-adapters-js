# Chainlink External Adapter: Basic LINK Price Source

This project documents my hands-on experience developing a basic Chainlink price feed adapter within the `external-adapters-js` monorepo. The primary goal was to familiarize myself with the monorepo structure, Chainlink's External Adapter framework, and demonstrate my ability to onboard independently without external assistance. By building this adapter from scratch, I aimed to showcase rapid learning, problem-solving, and proficiency in TypeScript based blockchain development skills directly aligned with roles at Chainlink Labs.

The adapter fetches LINK prices against USDC and ETH from Uniswap V3 pools on Ethereum and Arbitrum, using direct RPC calls for efficiency and decentralization. This exercise not only deepened my understanding of source adapters but also prepared me to contribute to more complex integrations like composites and targets.

## Adapter Generation and Development Notes

- Initiated the adapter using `yarn new source basic-link-price-source` to scaffold the basic structure.
- Followed the generator prompt by running:  
  `yo ./.yarn/cache/node_modules/@chainlink/external-adapter-framework/generator-adapter/generators/app/index.js packages/sources && yarn new tsconfig`
- Leveraged the External Adapter Framework (https://github.com/smartcontractkit/ea-framework-js/tree/main) for oracle interactions, referencing endpoint types (e.g., crypto/price) to ensure compatibility.
- Adapted the logic to a custom crypto price endpoint tailored to LINK-specific queries.
- Encountered an LSP (Language Server Protocol) issue where cached libraries weren't recognized in my editor (Neo Vim)—**TODO: Investigate deeper into LSP configuration for monorepo environments.**
- Temporarily hardcoded parameter descriptions (e.g., "The symbol of symbols of the currency to query") to resolve runtime failures during `yarn server:dist`; **TODO: Review how other adapters handle dynamic descriptions.**
- For testing individual adapters: `export adapter=basic-link-price-source; yarn test $adapter/test/integration`—**TODO: Implement integration tests for this adapter.**

### General Thoughts on the Repository

The CONTRIBUTING.md is straightforward and well-organized, providing clear guidelines for setup, PR processes, and best practices. Having access to numerous existing adapters within the monorepo was invaluable, allowing me to reference real world examples for transports, endpoints, and configurations without needing external documentation. This structure facilitated quick iteration and independent problem-solving, highlighting the repo's design for scalability and collaboration.

## Building and Running the Server

To build and run the adapter:

- Navigate to the adapter's root directory (`packages/sources/basic-link-price-source`).
- Run `yarn build` to compile the TypeScript code.
- Then, start the server with `yarn server:dist` (runs on localhost:8080 by default; override RPC URLs via environment variables if needed, e.g., `RPC_URL_ETHEREUM=https://ethereum-rpc.publicnode.com yarn server:dist`).

## Calling the Adapter

Call the endpoints locally using cURL (assuming the server is running on localhost:8080). These commands query `link-usdc` and `link-eth` on Ethereum and Arbitrum, leveraging default base/quote values for simplicity.

1. **link-usdc on ethereum**:

   ```bash
   curl -X POST http://localhost:8080/ \
     -H 'Content-Type: application/json' \
     -d '{
       "id": "1",
       "data": {
         "endpoint": "link-usdc",
         "base": "LINK",
         "quote": "USDC",
         "chain": "ethereum"
       }
     }'
   ```

2. **link-usdc on arbitrum**:

   ```bash
   curl -X POST http://localhost:8080/ \
     -H 'Content-Type: application/json' \
     -d '{
       "id": "1",
       "data": {
         "endpoint": "link-usdc",
         "base": "LINK",
         "quote": "USDC",
         "chain": "arbitrum"
       }
     }'
   ```

3. **link-eth on ethereum**:

   ```bash
   curl -X POST http://localhost:8080/ \
     -H 'Content-Type: application/json' \
     -d '{
       "id": "1",
       "data": {
         "endpoint": "link-eth",
         "base": "LINK",
         "quote": "ETH",
         "chain": "ethereum"
       }
     }'
   ```

4. **link-eth on arbitrum**:
   ```bash
   curl -X POST http://localhost:8080/ \
     -H 'Content-Type: application/json' \
     -d '{
       "id": "1",
       "data": {
         "endpoint": "link-eth",
         "base": "LINK",
         "quote": "ETH",
         "chain": "arbitrum"
       }
     }'
   ```

## Proposed Enhancements

To extend this project and demonstrate broader expertise in Chainlink's ecosystem:

- **Composite Adapter for Automated Selling**: Build a composite adapter that chains this source adapter to fetch LINK prices, then triggers a target adapter to execute a sell order if the price exceeds predefined thresholds (e.g., x or y). This could be tested on Sepolia testnet, showcasing integration of source, composite, and target adapters for automated trading logic.
- **Cross-Chain Transfer Integration**: Develop an additional composite adapter that, post-sell, transfers the resulting tokens from Ethereum Sepolia to Arbitrum Sepolia using Chainlink CCIP (Cross-Chain Interoperability Protocol). This enhancement would highlight familiarity with testnets, CCIP for secure cross-chain operations, and end-to-end adapter composition for real-world DeFi workflows.

This project underscores my technical curious and self-driven approach to as a long time Fan of Chainlink and experienced engineer
