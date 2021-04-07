# Chainlink External Adapter for Paypal

External adapter connecting to the [Paypal payouts API](https://developer.paypal.com/docs/api/payments.payouts-batch/v1/) using the [Paypal payout SDK](https://github.com/paypal/Payouts-NodeJS-SDK)

**Disclaimer**  
In order to use this adapter, you will need to create an account with and obtain credentials from PayPal and agree to and comply with PayPal’s applicable terms, conditions and policies. In no event will SmartContract Chainlink Limited SEZC be liable for your or your user’s failure to comply with any or all of PayPal’s terms, conditions or policies or any other applicable license terms.

### Environment Variables

| Required? |      Name       |                                       Description                                        |      Options      | Defaults to |
| :-------: | :-------------: | :--------------------------------------------------------------------------------------: | :---------------: | :---------: |
|    ✅     |   `CLIENT_ID`   | [API access credential](https://developer.paypal.com/docs/api/overview/#get-credentials) |                   |             |
|    ✅     | `CLIENT_SECRET` | [API access credential](https://developer.paypal.com/docs/api/overview/#get-credentials) |                   |             |
|           |     `MODE`      |                 Parameter for determining a live or sandbox environment                  | `sandbox`, `live` |  `sandbox`  |

---

### Input Parameters

| Required? |   Name   |        Description         |                                  Options                                   | Defaults to  |
| :-------: | :------: | :------------------------: | :------------------------------------------------------------------------: | :----------: |
|           | endpoint | The Paypal endpoint to use | [`sendpayout`](#Send-Payout-Endpoint), [`getpayout`](#Get-Payout-Endpoint) | `sendpayout` |

---

## Send Payout Endpoint

Endpoint used to send currency to a specified receiver.

### Input Params

| Required? |       Name       |                    Description                    |                                  Options                                   | Defaults to |
| :-------: | :--------------: | :-----------------------------------------------: | :------------------------------------------------------------------------: | :---------: |
|    ✅     |     `amount`     |            Amount to send as a string             |                                                                            |             |
|           |    `currency`    |      Three-character ISO-4217 currency code.      | [options](https://developer.paypal.com/docs/api/reference/currency-codes/) |    `USD`    |
|    ✅     |    `receiver`    | Specified receiver matching the `recipient_type`  |                                                                            |             |
|           | `recipient_type` |              The type of `receiver`               |                       `EMAIL`, `PHONE`, `PAYPAL_ID`                        |   `EMAIL`   |
|           |      `note`      |              Custom note for payout               |                                                                            |             |
|           | `sender_item_id` |       Custom sender-specified ID for payout       |                                                                            |             |
|           | `email_subject`  | Custom email subject for the payment notification |                                                                            |             |
|           | `email_message`  | Custom email message for the payment notification |                                                                            |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "sendpayout",
    "amount": "1.00",
    "receiver": "test@test.com",
    "recipient_type": "EMAIL",
    "note": "test transaction",
    "sender_item_id": "0x00",
    "email_subject": "hello!",
    "email_message": "this is the first tx"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": {
    "batch_header": {
      "payout_batch_id": "EVFRQ73UQ3PQU",
      "batch_status": "PENDING",
      "sender_batch_header": {
        "sender_batch_id": "mqr",
        "recipient_type": "EMAIL",
        "email_subject": "hello!",
        "email_message": "this is the first tx"
      }
    },
    "links": [
      {
        "href": "https://api.sandbox.paypal.com/v1/payments/payouts/EVFRQ73UQ3PQU",
        "rel": "self",
        "method": "GET",
        "encType": "application/json"
      }
    ]
  },
  "statusCode": 201,
  "data": {
    "result": {
      "batch_header": {
        "payout_batch_id": "EVFRQ73UQ3PQU",
        "batch_status": "PENDING",
        "sender_batch_header": {
          "sender_batch_id": "mqr",
          "recipient_type": "EMAIL",
          "email_subject": "hello!",
          "email_message": "this is the first tx"
        }
      },
      "links": [
        {
          "href": "https://api.sandbox.paypal.com/v1/payments/payouts/EVFRQ73UQ3PQU",
          "rel": "self",
          "method": "GET",
          "encType": "application/json"
        }
      ]
    }
  }
}
```

## Get Payout Endpoint

Endpoint used to get information about a transaction or batch of transactions.

### Input Params

| Required? |    Name     |               Description                |     Options     | Defaults to |
| :-------: | :---------: | :--------------------------------------: | :-------------: | :---------: |
|    ✅     | `payout_id` | ID of the payout batch or item to lookup |                 |             |
|           |   `type`    |         Type of payout to lookup         | `ITEM`, `BATCH` |   `BATCH`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "getpayout",
    "payout_id": "Y7L245ABZLPZU",
    "type": "ITEM"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": {
    "payout_item_id": "Y7L245ABZLPZU",
    "transaction_id": "96877893GC888820F",
    "activity_id": "322381265N9335843",
    "transaction_status": "SUCCESS",
    "payout_item_fee": {
      "currency": "USD",
      "value": "0.02"
    },
    "payout_batch_id": "DNPMSBKRYB4AN",
    "sender_batch_id": "a513191600c8fc240450ba26fd99e784",
    "payout_item": {
      "recipient_type": "EMAIL",
      "amount": {
        "currency": "USD",
        "value": "1.00"
      },
      "note": "Here's your payment",
      "receiver": "test@test.com",
      "sender_item_id": "001",
      "recipient_wallet": "PAYPAL"
    },
    "time_processed": "2021-04-07T15:35:13Z",
    "links": [
      {
        "href": "https://api.sandbox.paypal.com/v1/payments/payouts-item/Y7L245ABZLPZU",
        "rel": "self",
        "method": "GET",
        "encType": "application/json"
      },
      {
        "href": "https://api.sandbox.paypal.com/v1/payments/payouts/DNPMSBKRYB4AN",
        "rel": "batch",
        "method": "GET",
        "encType": "application/json"
      }
    ]
  },
  "statusCode": 200,
  "data": {
    "result": {
      "payout_item_id": "Y7L245ABZLPZU",
      "transaction_id": "96877893GC888820F",
      "activity_id": "322381265N9335843",
      "transaction_status": "SUCCESS",
      "payout_item_fee": {
        "currency": "USD",
        "value": "0.02"
      },
      "payout_batch_id": "DNPMSBKRYB4AN",
      "sender_batch_id": "a513191600c8fc240450ba26fd99e784",
      "payout_item": {
        "recipient_type": "EMAIL",
        "amount": {
          "currency": "USD",
          "value": "1.00"
        },
        "note": "Here's your payment",
        "receiver": "test@test.com",
        "sender_item_id": "001",
        "recipient_wallet": "PAYPAL"
      },
      "time_processed": "2021-04-07T15:35:13Z",
      "links": [
        {
          "href": "https://api.sandbox.paypal.com/v1/payments/payouts-item/Y7L245ABZLPZU",
          "rel": "self",
          "method": "GET",
          "encType": "application/json"
        },
        {
          "href": "https://api.sandbox.paypal.com/v1/payments/payouts/DNPMSBKRYB4AN",
          "rel": "batch",
          "method": "GET",
          "encType": "application/json"
        }
      ]
    }
  }
}
```

## Testing
For [integration testing](./test/integration), the [environment variables](#Environment-Variables) described above must be set.

Additionally, the following is required:
* For [`integration/getPayout.test.ts`](./test/integration/getPayout.test.ts), the following environment variables need to be set with parameters that can be retrieved by the `CLIENT_ID` and `CLIENT_SECRET` in the `sandbox`
```bash
export PAYOUT_ID_BATCH='batch payout ID'
export PAYOUT_ID_ITEM='batch item payout ID'
```
* For [`integration/sendPayout.test.ts`](./test/integration/sendPayout.test.ts), the account associated with the `CLIENT_ID` and `CLIENT_SECRET` in the `sandbox` must have a balance that can be sent.
