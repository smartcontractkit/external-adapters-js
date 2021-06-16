# Chainlink External Adapter for SportsDataIO

Adapter got get data from Sportsdata.io

### Environment Variables

| Required? |        Name         |                  Description                  | Options | Defaults to |
| :-------: | :-----------------: | :-------------------------------------------: | :-----: | :---------: |
|           | NFL_SCORES_API_KEY  |   An API key that gives access to NFL data    |         |             |
|           | MMA_SCORES_API_KEY  |   An API key that gives access to MMA data    |         |             |
|           | SOCCER_ODDS_API_KEY | An API key required to access Soccer oddsdata |         |             |
### Input Parameters

| Required? | Name  |   Description    |                   Options                   | Defaults to |
| :-------: | :---: | :--------------: | :-----------------------------------------: | :---------: |
|     ✅     | sport | The sport to use | [nfl](#NFL), [mma](#MMA), [soccer](#Soccer) |     nfl     |

---

## Soccer

| Required? |   Name   |     Description     | Options | Defaults to |
| :-------: | :------: | :-----------------: | :-----: | :---------: |
|     ✅     | endpoint | The endpoint to use |  odds   |      -      |

### Odds - Input Params

| Required? |  Name  |                        Description                        |    Options     | Defaults to |
| :-------: | :----: | :-------------------------------------------------------: | :------------: | :---------: |
|           | `date` |     The date of the Soccer event in YYYY-MM-DD format     |  A valid date  |    Today    |
|           | `live` |                Used to retrieve live data                 |      true      |    false    |
|     ✅     | `team` | Filter results to team names only including passed string | A valid string |      -      |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "sport": "soccer",
    "endpoint": "odds",
    "date": "2021-06-12",
    "team": "Sporting Kansas City"
  }
}
```

### Sample Output

Odds are ordered as follows: HomeTeamOdds, DrawMoneyLine, AwayMoneyLine

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": [-1500,3650,3100]
  },
  "result":[-1500,3650,3100],
  "statusCode": 200
}
```

---
## NFL

| Required? |   Name   |      Description      |                     Options                      | Defaults to |
| :-------: | :------: | :-------------------: | :----------------------------------------------: | :---------: |
|           | endpoint | The endpoint to query | [schedule](#NFL-Schedule), [scores](#NFL-Scores) |  schedule   |

### NFL Schedule

Get the NFL schedule

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|     ✅     | season | The season to get events from |         |             |

### NFL Scores

Get NFL scores

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|     ✅     | season | The season to get scores from |         |             |

---

## MMA

### Input Parameters

| Required? |   Name   |      Description      |                    Options                     | Defaults to |
| :-------: | :------: | :-------------------: | :--------------------------------------------: | :---------: |
|     ✅     | endpoint | The endpoint to query | [schedule](#MMA-Schedule), [event](#MMA-Event) |             |

### MMA Schedule

Get the MMA schedule

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|     ✅     | league | The league to get events from |         |             |
|     ✅     | season | The season to get events from |         |             |

### MMA Event

Get data on specific MMA event

#### Input Parameters

| Required? |  Name   |      Description      | Options | Defaults to |
| :-------: | :-----: | :-------------------: | :-----: | :---------: |
|     ✅     | eventId | The event ID to query |         |             |

