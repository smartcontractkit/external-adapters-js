# CBTC Proof of Reserves Rollout Document

## Overview

This feed provides Proof of Reserves for CBTC by comparing Bitcoin reserves against Canton token supply. The **btc-por** adapter queries the DLC.Link decentralised attester network to fetch xpub keys and deposit account IDs, then independently calculates Taproot (P2TR) vault addresses using BIP32 derivation. These calculated addresses are verified against the attester-provided addresses. The adapter then queries the Bitcoin blockchain via Electrs-compatible RPC endpoints to sum UTXOs across all verified vault addresses, returning the total reserves in satoshis.

The **canton-por** adapter queries the same attester network to retrieve the total CBTC supply minted on the Canton network. Each node runs 4 instances of each adapter, each connected to a different attester, providing redundancy and enabling consensus across multiple decentralised sources.

## Deployment Configuration

### Per Node

Each node runs **8 External Adapters**:

- **4x btc-por**: Bitcoin reserves from 4 different attesters
- **4x canton-por**: Canton CBTC supply from 4 different attesters (attesterSupply endpoint only)

### Attesters (Select 4 from list)

| ID  | Attester URL                                               | Status |
| --- | ---------------------------------------------------------- | ------ |
| 1   | `https://mainnet.dlc.link/attestor-1`                      | TBD    |
| 2   | `http://dlc.mainnet.nethermind.io:8811`                    | TBD    |
| 3   | `http://dlc.ibtc.dsrvlabs.net:8811`                        | TBD    |
| 4   | `http://ibtc-attestor.pn.prod.fcstech.de:8080`             | TBD    |
| 5   | `http://att01.dlc.mainnet.republiccrypto-source.info:8811` | TBD    |

### Bitcoin RPC Endpoints (Electrs-compatible)

Each NOP uses their dedicated endpoint. Replace `API_KEY` with the key shared via 1Password.

| NOP             | URL                                                                                |
| --------------- | ---------------------------------------------------------------------------------- |
| Test            | `https://por.bcy-p.metalhosts.com/test/API_KEY/bitcoin/mainnet-indexer`            |
| Chainlayer      | `https://por.bcy-p.metalhosts.com/chainlayer/API_KEY/bitcoin/mainnet-indexer`      |
| Dextract        | `https://por.bcy-p.metalhosts.com/dextract/API_KEY/bitcoin/mainnet-indexer`        |
| Fiews           | `https://por.bcy-p.metalhosts.com/fiews/API_KEY/bitcoin/mainnet-indexer`           |
| Galaxy          | `https://por.bcy-p.metalhosts.com/galaxy/API_KEY/bitcoin/mainnet-indexer`          |
| LinkForest      | `https://por.bcy-p.metalhosts.com/linkforest/API_KEY/bitcoin/mainnet-indexer`      |
| LinkPool        | `https://por.bcy-p.metalhosts.com/linkpool/API_KEY/bitcoin/mainnet-indexer`        |
| LinkRiver       | `https://por.bcy-p.metalhosts.com/linkriver/API_KEY/bitcoin/mainnet-indexer`       |
| Newroad         | `https://por.bcy-p.metalhosts.com/newroad/API_KEY/bitcoin/mainnet-indexer`         |
| PierTwo         | `https://por.bcy-p.metalhosts.com/piertwo/API_KEY/bitcoin/mainnet-indexer`         |
| SNZPool         | `https://por.bcy-p.metalhosts.com/snzpool/API_KEY/bitcoin/mainnet-indexer`         |
| SyncNode        | `https://por.bcy-p.metalhosts.com/syncnode/API_KEY/bitcoin/mainnet-indexer`        |
| ValidationCloud | `https://por.bcy-p.metalhosts.com/validationcloud/API_KEY/bitcoin/mainnet-indexer` |
| Inotel          | `https://por.bcy-p.metalhosts.com/inotel/API_KEY/bitcoin/mainnet-indexer`          |
| SimplyVC        | `https://por.bcy-p.metalhosts.com/simplyvc/API_KEY/bitcoin/mainnet-indexer`        |
| Tiingo          | `https://por.bcy-p.metalhosts.com/tiingo/API_KEY/bitcoin/mainnet-indexer`          |

### API Key Distribution (1Password)

| NOP             | 1Password Link                                                                    | Contact                                                             |
| --------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Tiingo          | [Link](https://share.1password.com/s#yyQUC8tU7owjGVVqChs3hWri9IlWkXqqoDZ0TapNqRk) | devops@linkpool.io                                                  |
| Galaxy          | [Link](https://share.1password.com/s#HTflWh4WHIcZPxHeGMODQIhBG5D42sWN_nbKNM9UplA) | george.gatheca@galaxy.com, bce-sre@galaxy.com                       |
| LinkForest      | [Link](https://share.1password.com/s#5_9pXx30O5dYZCeqhEWv8IKkZmdkPREde0o9RMx906o) | andrew@linkforest.io                                                |
| Newroad         | [Link](https://share.1password.com/s#XxEzx1_H83FnNRuGslLM4iLh3qAQTWJ4l9VgpMzVMYs) | kasper@newroad.network                                              |
| SNZPool         | [Link](https://share.1password.com/s#7KNKpJj1QZg056arylnk-92LKaeUAq4OZsusQD5P-LI) | shuai.yuan@snzholding.com                                           |
| SyncNode        | [Link](https://share.1password.com/s#gmZXtlx4F8jhuFhHnZkDlAJCyLttqB5dLSik6OcaHwc) | g@syncnode.ro                                                       |
| ValidationCloud | [Link](https://share.1password.com/s#6OXqmAUVqOqeA731rtN6At-dceAKoYXmiFwiLdOrC-o) | Kevin.matthews@validationcloud.io, matt.anderton@validationcloud.io |
| LinkRiver       | [Link](https://share.1password.com/s#DI3GG7J4CC9UMvRP54zDWFdkXn29v69Fx-OHnuxjLqI) | infra@linkriver.io                                                  |
| Chainlayer      | [Link](https://share.1password.com/s#6QXVibinlQ-LQsj3qOS70jA1XAIsmTrWRPpLex2xERA) | chainlink@chainlayer.io                                             |
| PierTwo         | [Link](https://share.1password.com/s#WRAgEyovOeh-XG6ucJfVEdCv8lEOTouqb7fseefuwHg) | chainlink@piertwo.com                                               |
| Dextrac         | [Link](https://share.1password.com/s#agMkCt3-fJRtOZlgRMph6Y2VVpaZzrjX0sT5DVTrR-4) | devlin@trace.link                                                   |
| SimplyVC        | [Link](https://share.1password.com/s#kgAL-Qfs9665Q3lSIHbfzydUtdmVs7M6e7TWv1ZNmC8) | jacques@simply-vc.com.mt, subscriptions@simply-vc.com.mt            |
| Fiews           | [Link](https://share.1password.com/s#u2jcko7hCVmnMCvf04pnpVoVY8CsDHeUvT_A6QUlttE) | cadams@fiews.io, dcliche@fiews.io                                   |
| Inotel          | [Link](https://share.1password.com/s#nS02n3dAVOFI6iy7Q3mVcCeduxgBLwCuxyJaHGgxbKw) | dan@inotel.ro, marius@inotel.ro                                     |
| LinkPool        | [Link](https://share.1password.com/s#tK_4WFIwpKzzXMgYnEy9n_3MUURaX1hn2ECUj7BFmXo) | devops@linkpool.io                                                  |

## EA Configuration

### btc-por Configuration

```bash
ATTESTER_API_URL=<attester_url>      # One of 4 attesters
CHAIN_NAME=canton-mainnet            # Filter for mainnet addresses
BITCOIN_RPC_ENDPOINT=<btc_rpc_url>   # Shared per node
MIN_CONFIRMATIONS=6                  # Default: 6 blocks
```

### canton-por Configuration

```bash
ATTESTER_API_URL=<attester_url>      # One of 4 attesters
# Note: CANTON_API_URL not needed (using attesterSupply only)
```

## Calculated Stream Configuration

### V9 Schema Mapping

```rust
pub struct ReportDataV9 {
...
    pub nav_per_share: BigInt,          // btc_quantity / canton_quantity
    pub nav_date: u64,                  // EA query timestamp
    pub aum: BigInt,                    // Bitcoin quantity (satoshis)
    pub ripcord: u32,                   // Not used (default: 0/false)
}
```

### Calculation Logic

Each node receives 4 responses from each adapter type (one per attester). The **median** value is taken from the 4 responses for both btc_quantity and canton_quantity before performing the calculation.

```
nav_per_share = median(btc_quantity) / median(canton_quantity)
aum           = median(btc_quantity) (from btc-por, in satoshis)
nav_date      = EA query timestamp
ripcord       = 0 (not used)
```

**Note**: The report output values are scaled to **18 decimal places** as is standard for Data Streams.

## Verification

### Test btc-por

```bash
curl -s -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"data":{}}' | jq -r .result
# Expected: Bitcoin reserves in satoshis (e.g., "1431265468")
```

### Test canton-por

```bash
curl -s -X POST http://localhost:8084 \
  -H "Content-Type: application/json" \
  -d '{"data":{}}' | jq -r .result
# Expected: CBTC supply scaled by 10^10 (e.g., "143127387999")
```
