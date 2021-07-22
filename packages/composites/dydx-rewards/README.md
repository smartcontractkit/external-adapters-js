# Chainlink dYdX Rewards Composite Adapter

The goal of this system is to calculate and publish, via a decentralized network of oracle signers, the DYDX token
rewards earned by traders using the dYdX layer 2 exchange. Rewards are stored in a Merkle tree, which contains the
cumulative rewards earned by each user since the start of the distribution program.

## Configuration

The adapter takes the following environment variables:

| Required? |     Name      |                      Description                      | Options | Defaults to |
| :-------: | :-----------: | :---------------------------------------------------: | :-----: | :---------: |
|    ✅     | `PRIVATE_KEY` | Private key of account used to make special callbacks |         |             |
|    ✅     |   `RPC_URL`   |                  RPC URL of ETH node                  |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Parameters

| Required? |  Name  |    Description     |       Options        | Defaults to |
| :-------: | :----: | :----------------: | :------------------: | :---------: |
|           | method | The method to call | [poke](#Poke-Method) |    poke     |

---

## Poke Method

### Input Params

| Required? |           Name           |                                Description                                | Options | Defaults to |
| :-------: | :----------------------: | :-----------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   traderRewardsAmount    |       Maximum rewards distributed each epoch as trading incentives        |         |             |
|    ✅     | marketMakerRewardsAmount |     Maximum rewards distributed each epoch as market maker incentives     |         |             |
|    ✅     |         ipnsName         | The fixed IPNS name to which all oracle rewards data is published by dYdX |         |             |
|    ✅     |     traderScoreAlpha     |         Is a parameter used in the calculation of trader rewards          |         |             |
|    ✅     |     callbackAddress      |                                                                           |         |             |
|    ✅     |         newEpoch         |                                                                           |         |             |
|    ✅     |    activeRootIpfsCid     |                                                                           |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "traderRewardsAmount": 5e23,
    "marketMakerRewardsAmount": 2e23,
    "ipnsName": "k51qzi5uqu5dlkb9yviadsfl3uxndbkyhf4n97u1t1np5e9f67zwmjz6yk9m9k",
    "traderScoreAlpha": 700000000000000000,
    "newEpoch": 0,
    "activeRootIpfsCid": "bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1,
  "statusCode": 200,
  "data": {
    "result": 1
  }
}
```
