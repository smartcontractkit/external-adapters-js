# Chainlink External Adapter for IPFS

Version: 1.1.1

An adapter to read and write data from IPFS

## Environment Variables

| Required? |     Name     |                Description                |  Type  | Options |         Default         |
| :-------: | :----------: | :---------------------------------------: | :----: | :-----: | :---------------------: |
|           | API_ENDPOINT | The URL for your IPFS node's API endpoint | string |         | `http://127.0.0.1:5001` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                     Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [read](#read-endpoint), [write](#write-endpoint) | `read`  |

---

## Read Endpoint

`read` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                          Description                           |  Type  |      Options       | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :------------------------------------------------------------: | :----: | :----------------: | :-----: | :--------: | :------------: |
|           |  cid  |         |          The CID to read. Required if IPNS is not set          |        |                    |         |            |     `ipns`     |
|           | ipns  |         |          The IPNS to read. Required if CID is not set          |        |                    |         |            |     `cid`      |
|           | codec |         | The codec to convert the data, if necessary when type is `raw` | string | `json`, `dag-cbor` |         |            |                |
|           | type  |         |                    The type of data to read                    | string |    `raw`, `dag`    |  `raw`  |            |                |

There are no examples for this endpoint.

---

## Write Endpoint

`write` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                          Description                           |  Type  |      Options       |  Default   | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :------------------------------------------------------------: | :----: | :----------------: | :--------: | :--------: | :------------: |
|    ✅     |    data    |         |                       The data to write                        |        |                    |            |            |                |
|           |   codec    |         | The codec to convert the data, if necessary when type is `raw` | string | `json`, `dag-cbor` |            |            |                |
|           | cidVersion |         |                 The CID version to be returned                 | number |                    |            |            |                |
|           |    type    |         |                    The type of data to read                    | string |    `raw`, `dag`    |   `raw`    |            |                |
|           |   format   |         |                     The DAG format to use                      | string |                    | `dag-cbor` |            |                |
|           |  hashAlg   |         |                The DAG hashing algorithm to use                | string |                    | `sha2-256` |            |                |

There are no examples for this endpoint.
