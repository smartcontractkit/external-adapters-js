# Chainlink External Adapter for Mistertango

External adapter for Mistertango.

In order to use this adapter, you will need to create an account with and obtain credentials from Mistertango and agree to and comply with Mistertango’s applicable terms, conditions and policies. In no event will SmartContract Chainlink Limited SEZC be liable for your or your user’s failure to comply with any or all of Mistertango’s terms, conditions or policies or any other applicable license terms.

### Environment Variables

| Required? |    Name    |                      Description                      | Options |          Defaults to           |
| :-------: | :--------: | :---------------------------------------------------: | :-----: | :----------------------------: |
|    ✅     |  API_KEY   |   An API key that can be obtained from Mistertango    |         |                                |
|    ✅     | API_SECRET |  An API secret that can be obtained from Mistertango  |         |                                |
|    ✅     |  API_USER  | An API username that can be obtained from Mistertango |         |                                |
|           |  API_URL   |                API url for Mistertango                |         | `publicapi.v2.mistertango.com` |

---

### Input Parameters

| Required? |   Name   |     Description     |                                                   Options                                                   | Defaults to  |
| :-------: | :------: | :-----------------: | :---------------------------------------------------------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | [`getbalance`](#Get-Balance-Endpoint), [`getlist`](#Get-List-Endpoint), [`sendmoney`](#Send-Money-Endpoint) | `getbalance` |

---

## Get Balance Endpoint

Get client balance for current or previous date

### Input Params

| Required? |  Name  |          Description          |   Options    | Defaults to |
| :-------: | :----: | :---------------------------: | :----------: | :---------: |
|           | `date` | Date to query the balance for | `YYYY-MM-DD` |   `today`   |

### Sample Input

```json
{
  "id": "1",
  "data": {}
}
```

### Sample Output

```json

```

## Get list Endpoint

Get transaction list for date or period, newest first, 100 transactions per call

### Input Params

| Required? |    Name    |             Description             |   Options    | Defaults to |
| :-------: | :--------: | :---------------------------------: | :----------: | :---------: |
|           | `dateFrom` | Date from to query the balance for  | `YYYY-MM-DD` | 1 week ago  |
|           | `dateTill` | Date until to query the balance for | `YYYY-MM-DD` |   `today`   |
|           |   `page`   |    Date to query the balance for    |              |      1      |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "getlist",
    "dateFrom": "2020-01-01",
    "dateTill": "2020-01-02",
    "page": 1
  }
}
```

### Sample Output

```json

```

## Send Money Endpoint

Send money to IBAN account

### Input Params

| Required? |    Name     |                 Description                 | Options | Defaults to |
| :-------: | :---------: | :-----------------------------------------: | :-----: | :---------: |
|    ✅     |  `amount`   |               Amount to send                |         |             |
|           | `recipient` |              Name of recipient              |         |             |
|    ✅     |  `account`  | IBAN account number or Mistertango username |         |             |
|    ✅     |  `details`  |     Details/description of the transfer     |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "sendmoney",
    "amount": 0.01,
    "account": "GB33BUKB20201555555555",
    "details": "test transaction"
  }
}
```

### Sample Output

```json

```
