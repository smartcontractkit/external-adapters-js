# Northwest Nodes

## Environment Variables

| Required? |      Name      |                 Description                 |   Type   | Options |               Default               |
| :-------: | :------------: | :-----------------------------------------: | :------: | :-----: | :---------------------------------: |
|           | `API_ENDPOINT` | Base URL for Northwest Nodes REST endpoints | `string` |         | `https://api.northwestnodes.com/v2` |
|    ✅     |   `API_KEY`    |       Key for the Northwest Nodes API       | `string` |         |                                     |

---

## Ethereum Staking Single Epoch Endpoint

Supported names for this endpoint are: `staking-ethereum-epoch-single`.

### Input Params

| Required? | Name | Aliases |                                                                                 Description                                                                                  |   Type   | Options |   Default   | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :---------: | :--------: | :------------: |
|    ✅     | `id` |         | The ID of the Ethereum staking Epoch. Defaults to `finalized` to get the latest, can be the numeric ID of a specific epoch within a rolling 90-day, or 21,000 epoch, window. | `string` |         | `finalized` |

### Example

Example request: `https://api.northwestnodes.com/v2/staking/ethereum/epoch/single/finalized`

Example response:

```
{
    "fees": 0.8334600920754772,
    "apr_1d": 0.05333348952037061,
    "apr_7d": 0.04982447950037814,
    "apr_30d": 0.04742649766194572,
    "apr_90d": 0.05334137717711991,
    "rewards": 8.759989702,
    "deposits": 0,
    "end_slot": 6659359,
    "epoch_id": 208104,
    "penalties": -0.040515392,
    "slashings": 0,
    "start_slot": 6659328,
    "base_reward": 0.000003645,
    "withdrawals": 8.187745192,
    "total_return": 9.552934402075477,
    "total_rewards": 9.593449794075477,
    "total_deductions": -0.040515392,
    "total_validators": 776589,
    "active_validators": 612494,
    "attestation_count": 32,
    "total_dep_balance": 19720252.834956083,
    "total_eff_balance": 19599617,
    "pending_validators": 94592,
    "slashed_validators": 252,
    "attestation_penalties": -0.040515392,
    "validator_participation_rate": 0.7886977538955612
}
```

## Ethereum Staking Single Epoch Endpoint

Supported names for this endpoint are: `staking-ethereum-epoch-list`.

### Input Params

| Required? |  Name   | Aliases |                                                               Description                                                               |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | `count` |         | The number of the Ethereum staking Epochs to return. Defaults to `225`, or one day of Epochs. Can be a number ranging from 1 to 21,000. | `number` |         |  `255`  |

### Example

Example request: `https://api.northwestnodes.com/v2/staking/ethereum/epoch/list/225`

Example response:

```
[{
    "fees": 0.8334600920754772,
    "apr_1d": 0.05333348952037061,
    "apr_7d": 0.04982447950037814,
    "apr_30d": 0.04742649766194572,
    "apr_90d": 0.05334137717711991,
    "rewards": 8.759989702,
    "deposits": 0,
    "end_slot": 6659359,
    "epoch_id": 208104,
    "penalties": -0.040515392,
    "slashings": 0,
    "start_slot": 6659328,
    "base_reward": 0.000003645,
    "withdrawals": 8.187745192,
    "total_return": 9.552934402075477,
    "total_rewards": 9.593449794075477,
    "total_deductions": -0.040515392,
    "total_validators": 776589,
    "active_validators": 612494,
    "attestation_count": 32,
    "total_dep_balance": 19720252.834956083,
    "total_eff_balance": 19599617,
    "pending_validators": 94592,
    "slashed_validators": 252,
    "attestation_penalties": -0.040515392,
    "validator_participation_rate": 0.7886977538955612
},
(...)
]
```

---

MIT License
