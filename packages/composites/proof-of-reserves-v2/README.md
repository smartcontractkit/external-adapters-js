# PROOF_OF-RESERVES-2

![1.1.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/proof-of-reserves-v2/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |                Name                |                                                                             Description                                                                              |  Type  | Options | Default |
| :-------: | :--------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |          ${PROVIDER}\_URL          | The URL for the given ${PROVIDER} used in request params. The used provider name is converted to upper-snake-case to determine the name of the environment variable. | string |         |         |
|           | MAX_RESPONSE_TEXT_IN_ERROR_MESSAGE |                                     How many characters of a response may be included in an error message before trunctating it                                      | number |         |  `200`  |
|           |       BACKGROUND_EXECUTE_MS        |                                      The amount of time the background execute should sleep before performing the next request                                       | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |                 Name                 | Aliases |                                                                                                          Description                                                                                                           |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :----------------------------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|           |             addressLists             |         |                                                                                  Address lists available for compoments to reference by name.                                                                                  | object[] |         |         |            |                |
|    ✅     |          addressLists.name           |         |                                                                                                 The name of the address list.                                                                                                  |  string  |         |         |            |                |
|           |        addressLists.provider         |         |                                                 Identifier of the service to query for addresses. This corresponse to the prefix of the environment variable {provider}\_URL.                                                  |  string  |         |         |            |                |
|           |         addressLists.params          |         |                                                                 JSON string encoding the parameters to be passed to the provider when querying for addresses.                                                                  |  string  |         |         |            |                |
|           |    addressLists.addressArrayPath     |         |                                                                        The object path to find the array of addresses in the result from the provider.                                                                         |  string  |         |         |            |                |
|           |          addressLists.fixed          |         |                                                                  A fixed JSON-encoded array of address objects in the format expected by the balance source.                                                                   |  string  |         |         |            |                |
|           |         addressLists.ripcord         |         |                                                                              If the ripcord is enabled, the adapter will respond with a 503 error                                                                              |  object  |         |         |            |                |
|    ✅     |      addressLists.ripcord.path       |         |                                                                       The object path to find the ripcord value in the result from the balance provider.                                                                       |  string  |         |         |            |                |
|    ✅     |  addressLists.ripcord.disabledValue  |         |                                     The value of the ripcord field that indicates the ripcord is disabled. If the value at the path matches this value, the response is considered valid.                                      |  string  |         |         |            |                |
|           |            balanceSources            |         |                                                                                Describe how to fetch balances given an a provided address list.                                                                                | object[] |         |         |            |                |
|    ✅     |         balanceSources.name          |         |                                                                                      Used by components to reference this balance source.                                                                                      |  string  |         |         |            |                |
|    ✅     |       balanceSources.provider        |         |                                                  Identifier of the service to query for balances. This corresponse to the prefix of the environment variable {provider}\_URL.                                                  |  string  |         |         |            |                |
|    ✅     |        balanceSources.params         |         |                                                                  JSON string encoding the parameters to be passed to the provider when querying for balances.                                                                  |  string  |         |         |            |                |
|           |   balanceSources.addressArrayPath    |         |                                                                    The object path to place the array of addresses in the request to the balances provider.                                                                    |  string  |         |         |            |                |
|           |   balanceSources.balancesArrayPath   |         |                          The object path to find the array of balances in the result from the balances provider. If absent, it means a single balance is returned and pointed to by the balancePath.                           |  string  |         |         |            |                |
|    ✅     |      balanceSources.balancePath      |         |                                                               The object path to find the balance in an array item or directly in the balance provider response                                                                |  string  |         |         |            |                |
|           |     balanceSources.decimalsPath      |         | The object path to find the number of decimals to scale the fixed point balance in an array item (or directly in the balance provider response). If absent, the balance is considered to be an unscaled floating point number. |  string  |         |         |            |                |
|           |        balanceSources.ripcord        |         |                                                                              If the ripcord is enabled, the adapter will respond with a 503 error                                                                              |  object  |         |         |            |                |
|    ✅     |     balanceSources.ripcord.path      |         |                                                                       The object path to find the ripcord value in the result from the balance provider.                                                                       |  string  |         |         |            |                |
|    ✅     | balanceSources.ripcord.disabledValue |         |                                     The value of the ripcord field that indicates the ripcord is disabled. If the value at the path matches this value, the response is considered valid.                                      |  string  |         |         |            |                |
|    ✅     |              components              |         |                                                           Individual components of the total reserves. To be converted to the same currency and then added together.                                                           | object[] |         |         |            |                |
|    ✅     |           components.name            |         |                                                                                           The name or description of the component.                                                                                            |  string  |         |         |            |                |
|    ✅     |         components.currency          |         |                                       The symbol of the currency in which the balance of the component is reported. This is only used to determine if the balance needs to be converted                                        |  string  |         |         |            |                |
|           |        components.addressList        |         |                                                                                    The name of the address list to use for this component.                                                                                     |  string  |         |         |            |                |
|    ✅     |       components.balanceSource       |         |                                                                                      Name of the balance source to use to fetch balances.                                                                                      |  string  |         |         |            |                |
|           |        components.conversions        |         |                             List of conversions to apply. Each conversion is formatted as "A/B" where "A" and "B" refer to the from/to of a conversion defined in the conversions input parameter.                             | string[] |         |         |            |                |
|           |             conversions              |         |       Describes how to convert the balances of the components to the same currency if they are not already reported in the same currency. If a component requires an inverse conversion, this is derived automatically.        | object[] |         |         |            |                |
|    ✅     |           conversions.from           |         |                                                                                          The symbol of the currency to convert from.                                                                                           |  string  |         |         |            |                |
|    ✅     |            conversions.to            |         |                                                                                           The symbol of the currency to convert to.                                                                                            |  string  |         |         |            |                |
|    ✅     |         conversions.provider         |         |                                              Identifier of the service to query for conversion rates. This corresponse to the prefix of the environment variable {provider}\_URL.                                              |  string  |         |         |            |                |
|    ✅     |          conversions.params          |         |                                                              JSON string encoding the parameters to be passed to the provider when querying for conversion rates.                                                              |  string  |         |         |            |                |
|    ✅     |         conversions.ratePath         |         |                                                                          The object path to find the conversion rate in the result from the provider.                                                                          |  string  |         |         |            |                |
|           |       conversions.decimalsPath       |         |              The object path to find the number of decimals to scale the fixed point conversion rate in the result from the provider. If absent, the result is considered to be an unscaled floating point number              |  string  |         |         |            |                |
|           |               schedule               |         |                                                           If the current time is outside the given schedule, the endpoint will respond with an HTTP 409 error code.                                                            |  object  |         |         |            |                |
|    ✅     |       schedule.feedDescription       |         |                                                          Description used to identify which feed is requested outside the schedule when errors are found in the logs.                                                          |  string  |         |         |            |                |
|    ✅     |          schedule.timezone           |         |                                                                              Timezone to use for the schedule, e.g. "UTC" or "America/New_York".                                                                               |  string  |         |         |            |                |
|           |            schedule.daily            |         |                                                   Daily time ranges when the endpoint should be active. If start comes after end, the range is considered to span midnight.                                                    | object[] |         |         |            |                |
|    ✅     |         schedule.daily.start         |         |                                                                                                Start time in 24h format "HH:mm"                                                                                                |  string  |         |         |            |                |
|    ✅     |          schedule.daily.end          |         |                                                                                                 End time in 24h format "HH:mm"                                                                                                 |  string  |         |         |            |                |
|    ✅     |            resultDecimals            |         |                                                                                     Number of decimals to use for the fixed point result.                                                                                      |  number  |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves",
    "addressLists": [
      {
        "name": "BTC addresses",
        "provider": "por-address-list",
        "params": "{\"endpoint\":\"solvBtcAddress\"}",
        "addressArrayPath": "data.result"
      }
    ],
    "balanceSources": [
      {
        "name": "por-indexer",
        "provider": "por-indexer",
        "params": "{\"minConfirmations\": 6}",
        "addressArrayPath": "addresses",
        "balancePath": "result"
      }
    ],
    "components": [
      {
        "name": "BTC reserves",
        "currency": "BTC",
        "addressList": "BTC addresses",
        "balanceSource": "por-indexer",
        "conversions": ["BTC/USD"]
      }
    ],
    "conversions": [
      {
        "from": "BTC",
        "to": "USD",
        "provider": "view-function-multi-chain",
        "params": "{\"endpoint\":\"calculated-multi-function\",\"functionCalls\":[{\"name\":\"result\",\"address\":\"0x6ce185860a4963106506C203335A2910413708e9\",\"network\":\"arbitrum\",\"signature\":\"function latestAnswer() external view returns (int256)\"},{\"name\":\"decimals\",\"address\":\"0x6ce185860a4963106506C203335A2910413708e9\",\"network\":\"arbitrum\",\"signature\":\"function decimals() external view returns (uint8)\"}]}",
        "ratePath": "result",
        "decimalsPath": "data.decimals"
      }
    ],
    "schedule": {
      "feedDescription": "My test feed",
      "timezone": "America/New_York",
      "daily": [
        {
          "start": "03:00",
          "end": "11:59"
        },
        {
          "start": "12:00",
          "end": "02:59"
        }
      ]
    },
    "resultDecimals": 18
  }
}
```

---

MIT License
