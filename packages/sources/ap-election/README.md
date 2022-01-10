# Chainlink External Adapter for Ap-election

Version: 1.1.1

The AP Election adapter fetches the latest election results provided by the Associated Press API and returns the winner of a given election.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [election](#election-endpoint) | `election` |

---

## Election Endpoint

`election` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                                                                                    Description                                                                                     |  Type  |           Options            | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :--------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    date     |         |                                                                  The date of the election formatted as YYYY-MM-DD                                                                  | string |                              |         |            |                |
|    ✅     | statePostal |         |                                                The state's two letter code e.g CA. `US` to get the results of a nationwide election                                                | string |                              |         |            |                |
|           |  officeID   |         |                    The office ID the election is for. List can be found here https://aphelp.ap.org/Content/SupportDocs/Elections/API/#t=Office_ID_Examples.htm                     | string |                              |         |            |                |
|           |   raceID    |         |                                                                          The race ID the election is for                                                                           | string |                              |         |            |                |
|           |  raceType   |         | The race type the election is for. The race type can be `D(Dem Primary)`, `R(GOP Primary)`, `G(General)`, `E(Dem Caucus)`, `S(GOP Caucus)`, `X(Open Primary or special use cases)` | string | `D`, `R`, `G`, `E`, `S`, `X` |   `D`   |            |                |
|           | resultsType |         |                                                                                                                                                                                    | string |                              |   `l`   |            |                |

There are no examples for this endpoint.
