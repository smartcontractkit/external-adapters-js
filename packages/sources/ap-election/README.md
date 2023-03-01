# Chainlink External Adapter for AP Election

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ap-election/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The AP Election adapter fetches the latest election results provided by the Associated Press API and returns the winner of a given election.

Base URL https://api.ap.org/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :---------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.ap.org/v2` |
|    ✅     |   API_KEY    |             | string |         |                         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [election](#election-endpoint) | `election` |

## Election Endpoint

This endpoint fetches the results from an election and reports back a winner. This adapter adds several restrictions on top of AP Election's API.

- Adapter only accepts a single state postal code
- Adapter will only return races where a winner has already been declared.

`election` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                                                                                    Description                                                                                     |  Type  |           Options            | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :--------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    date     |         |                                                                  The date of the election formatted as YYYY-MM-DD                                                                  | string |                              |         |            |                |
|    ✅     | statePostal |         |                                                The state's two letter code e.g CA. `US` to get the results of a nationwide election                                                | string |                              |         |            |                |
|           |  officeID   |         |                    The office ID the election is for. List can be found here https://aphelp.ap.org/Content/SupportDocs/Elections/API/#t=Office_ID_Examples.htm                     | string |                              |         |            |                |
|           |   raceID    |         |                                                                          The race ID the election is for                                                                           | string |                              |         |            |                |
|           |  raceType   |         | The race type the election is for. The race type can be `D(Dem Primary)`, `R(GOP Primary)`, `G(General)`, `E(Dem Caucus)`, `S(GOP Caucus)`, `X(Open Primary or special use cases)` | string | `D`, `E`, `G`, `R`, `S`, `X` |   `D`   |            |                |
|           | resultsType |         |                                                                                                                                                                                    | string |                              |   `l`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
