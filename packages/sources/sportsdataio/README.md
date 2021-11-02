# Chainlink External Adapter for Sportsdataio

Adapter got get data from Sportsdata.io

### Environment Variables

| Required? |        Name        |      Description       | Options | Defaults to |
| :-------: | :----------------: | :--------------------: | :-----: | :---------: |
|           | NFL_SCORES_API_KEY | API key for NFL scores |         |             |
|           | MMA_STATS_API_KEY  | API key for MMA stats  |         |             |
|           | CFB_SCORES_API_KEY | API key for CFB scores |         |             |

---

### Input Parameters

| Required? | Name  |   Description    |                          Options                           | Defaults to |
| :-------: | :---: | :--------------: | :--------------------------------------------------------: | :---------: |
|           | sport | The sport to use | [nfl](#NFL), [mma](#MMA), [ncaa-fb](#ncaa-fb), [nba](#nba) |     nfl     |

---

## NFL

### Input Parameters

| Required? |   Name   |      Description      |                                                   Options                                                    | Defaults to |
| :-------: | :------: | :-------------------: | :----------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to query | [schedule](#NFL-Schedule), [scores](#NFL-Scores), [current-season](#NFL-current-season), [teams](#NFL-teams) |  schedule   |

### NFL Schedule

Get the NFL schedule

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|    ✅     | season | The season to get events from |         |             |

### NFL Scores

Get NFL scores

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|    ✅     | season | The season to get scores from |         |             |

### NFL Current Season

Year of the current NFL season. This value changes on July 1st.

#### Input Parameters

No input parameters.

### NFL Teams

Gets all active teams.

#### Input Parameters

No input parameters.

---

## MMA

### Input Parameters

| Required? |   Name   |      Description      |                                           Options                                            | Defaults to |
| :-------: | :------: | :-------------------: | :------------------------------------------------------------------------------------------: | :---------: |
|    ✅     | endpoint | The endpoint to query | [schedule](#MMA-Schedule), [event](#MMA-Event), [fight](#MMA-Fight), [leagues](#MMA-Leagues) |             |

### MMA Schedule

Get the MMA schedule

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|    ✅     | league | The league to get events from |         |             |
|    ✅     | season | The season to get events from |         |             |

### MMA Event

Get data on specific MMA event

#### Input Parameters

| Required? |  Name   |      Description      | Options | Defaults to |
| :-------: | :-----: | :-------------------: | :-----: | :---------: |
|    ✅     | eventId | The event ID to query |         |             |

### MMA Fight

Get data on specific MMA fight

#### Input Parameters

| Required? |  Name   |      Description      | Options | Defaults to |
| :-------: | :-----: | :-------------------: | :-----: | :---------: |
|    ✅     | fightId | The fight ID to query |         |             |

### MMA Leagues

Get list of MMA leagues

#### Input Parameters

_None_

---

## NCAA-FB

### Input Parameters

| Required? |   Name   |      Description      |                                               Options                                               | Defaults to |
| :-------: | :------: | :-------------------: | :-------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to query | [schedule](#ncaa-fb-schedule), [scores](#ncaa-fb-scores), [current-season](#ncaa-fb-current-season) |  schedule   |

### NCAA-FB Schedule

This endpoint is an alias for [scores](#ncaa-fb-scores).

### NCAA-FB Scores

Get NCAA FB scores

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|    ✅     | season | The season to get scores from |         |             |

### NCAA-FB Current Season

Year of the current season.

## NBA

### Input Parameters

| Required? |   Name   |      Description      | Options | Defaults to |
| :-------: | :------: | :-------------------: | :-----: | :---------: |
|    ✅     | endpoint | The endpoint to query |         |             |

### NBA Player Stats

Gets the stats for an NBA player for a game

#### Input Parameters

| Required? |   Name   |                                                         Description                                                         |                                                                                                     Options                                                                                                      | Defaults to |
| :-------: | :------: | :-------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|    ✅     |   date   | The date of the game formatted as YYYY-MMM-DD e.g 2021-OCT-11. Adapter assumes date is in the America/Los Angeles timezone. |                                                                                                                                                                                                                  |             |
|    ✅     | playerID |                                          The player ID of the player to query for                                           | You can find a list of player IDs by making a request here https://api.sportsdata.io/v3/nba/scores/json/Players. Docs: https://sportsdata.io/developers/api-documentation/nba#/endpoint/player-details-by-active |             |

### Sample Input

```json
{
  "id": 1,
  "data": {
    "date": "2021-OCT-11",
    "sport": "nba",
    "endpoint": "player-stats",
    "playerID": 20002528
  }
}
```

### Sample Output

Note that the result is a packed version of the data values and their types using the ether utils `solidityPacked` function.

Types

```json
"Season",                 "uint16"
"DateTime",               "uint32"
"Home",                   "bool"
"IsGameOver",             "bool"
"GlobalGameID",           "uint32"
"FieldGoalsMade",         "uint8"
"FieldGoalsAttempted",    "uint8"
"TwoPointersMade",        "uint8"
"TwoPointersAttempted",   "uint8"
"ThreePointersMade",      "uint8"
"ThreePointersAttempted", "uint8"
"FreeThrowsMade",         "uint8"
"FreeThrowsAttempted",    "uint8"
"OffensiveRebounds",      "uint8"
"DefensiveRebounds",      "uint8"
"Rebounds",               "uint8"
"Assists",                "uint8"
"Steals",                 "uint8"
"BlockedShots",           "uint8"
"DoubleDoubles",          "uint8"
"TripleDoubles",          "uint8"
"Points",                 "uint16"
```

```json
{
  "jobRunID": 1,
  "result": "0x07e66164f328000001317318070e05060208030302060809010000000013",
  "statusCode": 200,
  "data": {
    "StatID": 900479,
    "TeamID": 2,
    "PlayerID": 20002528,
    "SeasonType": 2,
    "Season": 2022,
    "Name": "LaMelo Ball",
    "Team": "CHA",
    "Position": "PG",
    "Started": 1,
    "FanDuelSalary": 6000,
    "DraftKingsSalary": 6500,
    "FantasyDataSalary": 6500,
    "YahooSalary": null,
    "InjuryStatus": null,
    "InjuryBodyPart": null,
    "InjuryStartDate": null,
    "InjuryNotes": null,
    "FanDuelPosition": "PG",
    "DraftKingsPosition": "PG",
    "YahooPosition": null,
    "OpponentRank": 7,
    "OpponentPositionRank": 3,
    "GlobalTeamID": 20000002,
    "FantasyDraftSalary": null,
    "FantasyDraftPosition": null,
    "GameID": 17944,
    "OpponentID": 4,
    "Opponent": "MIA",
    "Day": "2021-10-11T00:00:00",
    "DateTime": "2021-10-11T19:30:00",
    "HomeOrAway": "AWAY",
    "IsGameOver": true,
    "GlobalGameID": 20017944,
    "GlobalOpponentID": 20000004,
    "Updated": "2021-10-14T03:15:14",
    "Games": 1,
    "FantasyPoints": 41.1,
    "Minutes": 26,
    "Seconds": 29,
    "FieldGoalsMade": 7,
    "FieldGoalsAttempted": 14,
    "FieldGoalsPercentage": 50,
    "EffectiveFieldGoalsPercentage": 57.1,
    "TwoPointersMade": 5,
    "TwoPointersAttempted": 6,
    "TwoPointersPercentage": 83.3,
    "ThreePointersMade": 2,
    "ThreePointersAttempted": 8,
    "ThreePointersPercentage": 25,
    "FreeThrowsMade": 3,
    "FreeThrowsAttempted": 3,
    "FreeThrowsPercentage": 100,
    "OffensiveRebounds": 2,
    "DefensiveRebounds": 6,
    "Rebounds": 8,
    "OffensiveReboundsPercentage": 8.62,
    "DefensiveReboundsPercentage": 20.91,
    "TotalReboundsPercentage": 15.42,
    "Assists": 9,
    "Steals": 1,
    "BlockedShots": 0,
    "Turnovers": 3,
    "PersonalFouls": 4,
    "Points": 19,
    "TrueShootingAttempts": 15.32,
    "TrueShootingPercentage": 61.3,
    "PlayerEfficiencyRating": 32.97,
    "AssistsPercentage": 59.71,
    "StealsPercentage": 1.83,
    "BlocksPercentage": 0,
    "TurnOversPercentage": 16.37,
    "UsageRatePercentage": 30.53,
    "FantasyPointsFanDuel": 42.1,
    "FantasyPointsDraftKings": 44,
    "FantasyPointsYahoo": 42.1,
    "PlusMinus": 10,
    "DoubleDoubles": 0,
    "TripleDoubles": 0,
    "FantasyPointsFantasyDraft": 44,
    "IsClosed": true,
    "LineupConfirmed": false,
    "LineupStatus": "Active",
    "result": "07e66164f328000001317318070e05060208030302060809010000000013"
  }
}
```
