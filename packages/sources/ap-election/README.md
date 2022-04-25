# Chainlink External Adapter for AP Election

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ap-election/package.json)

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "election",
    "date": "2020-11-08",
    "statePostal": "US",
    "officeID": "P",
    "raceType": "G",
    "resultsType": "l"
  },
  "debug": {
    "cacheKey": "oSruSOaCPx2z6jWowhciPfG0/sY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "electionDate": "2021-06-08",
    "timestamp": "2021-10-12T15:41:05.383Z",
    "races": [
      {
        "test": false,
        "resultsType": "live",
        "raceID": "0",
        "raceType": "General",
        "raceTypeID": "G",
        "officeID": "P",
        "officeName": "President",
        "reportingUnits": [
          {
            "statePostal": "US",
            "stateName": "United States",
            "level": "national",
            "lastUpdated": "2021-06-09T20:35:40.840Z",
            "precinctsReporting": 2584,
            "precinctsTotal": 2584,
            "precinctsReportingPct": 100,
            "candidates": [
              {
                "first": "Donald",
                "last": "Trump",
                "party": "Rep",
                "incumbent": true,
                "candidateID": "51896",
                "polID": "0",
                "ballotOrder": 1,
                "polNum": "49353",
                "voteCount": 280076
              },
              {
                "first": "Joe",
                "last": "Biden",
                "party": "Dem",
                "candidateID": "52107",
                "polID": "0",
                "ballotOrder": 2,
                "polNum": "49500",
                "voteCount": 271187,
                "winner": "X"
              }
            ]
          },
          {
            "statePostal": "VA",
            "stateName": "Virginia",
            "level": "state",
            "lastUpdated": "2021-06-09T20:35:40.840Z",
            "precinctsReporting": 2584,
            "precinctsTotal": 2584,
            "precinctsReportingPct": 100,
            "candidates": [
              {
                "first": "Donald",
                "last": "Trump",
                "party": "Rep",
                "incumbent": true,
                "candidateID": "51896",
                "polID": "0",
                "ballotOrder": 1,
                "polNum": "49353",
                "voteCount": 10000,
                "winner": "X"
              },
              {
                "first": "Joe",
                "last": "Biden",
                "party": "Dem",
                "candidateID": "52107",
                "polID": "0",
                "ballotOrder": 2,
                "polNum": "49500",
                "voteCount": 8000
              }
            ]
          }
        ]
      }
    ],
    "nextrequest": "https://api.ap.org/v2/elections/2021-06-08?format=json&level=state&officeid=A&racetypeid=D&resultstype=l&statepostal=VA&winner=X&minDateTime=2021-06-09T20%3a35%3a40.840Z",
    "precinctsReporting": 2584,
    "precinctsReportingPct": 100,
    "winnerFirstName": "Joe",
    "winnerLastName": "Biden",
    "winnerVoteCount": 271187,
    "winnerCandidateId": "52107",
    "winnerParty": "Dem",
    "candidates": [
      "0x000000000000000000000000000000000000000000000000000000000000cab800000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000004460c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000352657000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006446f6e616c64000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000055472756d70000000000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000000000000000000000000000cb8b00000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000423530000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000344656d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000034a6f6500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005426964656e000000000000000000000000000000000000000000000000000000"
    ],
    "result": "271187,Biden"
  },
  "result": "271187,Biden",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "election",
    "date": "2021-06-08",
    "statePostal": "CA",
    "officeID": "A",
    "raceType": "D",
    "resultsType": "l"
  },
  "debug": {
    "cacheKey": "KEpqOGL74kmCf79VniiKr+JxAzY="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "electionDate": "2021-06-08",
    "timestamp": "2021-10-12T15:41:05.383Z",
    "races": [
      {
        "test": false,
        "resultsType": "live",
        "raceID": "47227",
        "raceType": "Primary",
        "raceTypeID": "D",
        "officeID": "A",
        "officeName": "Attorney General",
        "party": "Dem",
        "reportingUnits": [
          {
            "statePostal": "VA",
            "stateName": "Virginia",
            "level": "state",
            "lastUpdated": "2021-06-09T20:35:40.840Z",
            "precinctsReporting": 2584,
            "precinctsTotal": 2584,
            "precinctsReportingPct": 100,
            "candidates": [
              {
                "first": "Mark",
                "last": "Herring",
                "party": "Dem",
                "incumbent": true,
                "candidateID": "51896",
                "polID": "0",
                "ballotOrder": 1,
                "polNum": "49353",
                "voteCount": 271187,
                "winner": "X"
              },
              {
                "first": "Jerrauld",
                "last": "Jones",
                "party": "Dem",
                "candidateID": "52107",
                "polID": "0",
                "ballotOrder": 2,
                "polNum": "49500",
                "voteCount": 207792
              }
            ]
          }
        ]
      }
    ],
    "nextrequest": "https://api.ap.org/v2/elections/2021-06-08?format=json&level=state&officeid=A&racetypeid=D&resultstype=l&statepostal=VA&winner=X&minDateTime=2021-06-09T20%3a35%3a40.840Z",
    "precinctsReporting": 2584,
    "precinctsReportingPct": 100,
    "winnerFirstName": "Mark",
    "winnerLastName": "Herring",
    "winnerVoteCount": 271187,
    "winnerCandidateId": "51896",
    "winnerParty": "Dem",
    "candidates": [
      "0x000000000000000000000000000000000000000000000000000000000000cab800000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000423530000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000344656d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000044d61726b00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000748657272696e6700000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000000000000000000000000000000000000000cb8b00000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000032bb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000344656d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000084a65727261756c6400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000054a6f6e6573000000000000000000000000000000000000000000000000000000"
    ],
    "result": "271187,Herring"
  },
  "result": "271187,Herring",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
