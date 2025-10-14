# FTSE_SFTP

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ftse-sftp/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |       SFTP_HOST       |                            SFTP server hostname or IP address                             | string |         |         |
|           |       SFTP_PORT       |                                     SFTP server port                                      | number |         |  `22`   |
|    ✅     |     SFTP_USERNAME     |                             SFTP username for authentication                              | string |         |         |
|    ✅     |     SFTP_PASSWORD     |                             SFTP password for authentication                              | string |         |         |
|           | SFTP_READY_TIMEOUT_MS |           How long (in milliseconds) to wait for the SSH handshake to complete            | number |         | `30000` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [sftp](#sftp-endpoint) | `sftp`  |

## Sftp Endpoint

`sftp` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                      Description                       |  Type  |                                  Options                                   | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :----------------------------------------------------: | :----: | :------------------------------------------------------------------------: | :-----: | :--------: | :------------: |
|    ✅     | instrument |         | Abstract identifier of the index to fetch the data for | string | `FTSE100INDEX`, `Russell1000INDEX`, `Russell2000INDEX`, `Russell3000INDEX` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "sftp",
    "instrument": "FTSE100INDEX"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "sftp",
    "instrument": "Russell1000INDEX"
  }
}
```

Request:

```json
{
  "data": {
    "endpoint": "sftp",
    "instrument": "Russell2000INDEX"
  }
}
```

Request:

```json
{
  "data": {
    "endpoint": "sftp",
    "instrument": "Russell3000INDEX"
  }
}
```

</details>

---

MIT License
