# Chainlink External Adapter for Ap-election

The AP Election adapter fetches the latest election results provided by the Associated Press API and returns the winner of a given election.

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |              Options              | Defaults to |
| :-------: | :------: | :-----------------: | :-------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [election](#Ap-election-Endpoint) |  election   |

---

## Ap-election Endpoint

This endpoint fetches the results from an election and reports back a winner. This adapter adds several restrictions on top of AP Election's API.

- Adapter only accepts a single state postal code
- Adapter will only return races where a winner has already been declared

### Input Params

| Required? |     Name      |                                      Description                                      |                                                             Options                                                              | Defaults to |
| :-------: | :-----------: | :-----------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |    `date`     |                   The date of the election formatted as YYYY-MM-DD                    |                                                                                                                                  |             |
|    ✅     | `statePostal` | The state's two letter code e.g CA. `US` to get the results of a nationwide election. |                                                                                                                                  |             |
|           |  `officeID`   |                          The office ID the election is for.                           |             List can be found here https://aphelp.ap.org/Content/SupportDocs/Elections/API/#t=Office_ID_Examples.htm             |             |
|           |   `raceID`    |                           The race ID the election is for.                            |                                                                                                                                  |             |
|           |  `raceType`   |                           The race type the election is for                           | `D` (Dem Primary), `R` (GOP Primary), `G` (General), `E` (Dem Caucus), `S` (GOP Caucus), `X` (Open Primary or special use cases) |     `D`     |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "date": "2021-06-08",
    "statePostal": "VA",
    "level": "state",
    "officeID": "A",
    "raceType": "D"
  }
}
```

### Sample Output

```json
{
  "jobRunID": 1,
  "result": "271187,Herring",
  "maxAge": 30000,
  "statusCode": 200,
  "data": {
    "electionDate": "2021-06-08",
    "timestamp": "2021-10-18T19:08:23.135Z",
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
  }
}
```
