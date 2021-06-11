# Chainlink External Adapter for TheRundown

### Environment Variables

| Required? |  Name   |                                         Description                                         | Options | Defaults to |
| :-------: | :-----: | :-----------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://rapidapi.com/therundown/api/therundown) |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                                          Options                                           | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [total-score](#Total-Score-Endpoint), [event](#Event-Endpoint), [events](#Events-Endpoint) | total-score |

---

## Total Score Endpoint

Returns the sum of both teams' scores for a match (match status must be final)

### Input Params

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `matchId` | The ID of the match to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "matchId": "5527455bb80a5e9884153786aeb5f2b2"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "event_id": "5527455bb80a5e9884153786aeb5f2b2",
    "event_uuid": "11ea-fb62-b7f6e800-88a2-1258f92d5a70",
    "sport_id": 2,
    "event_date": "2020-09-20T17:00:00Z",
    "rotation_number_away": 277,
    "rotation_number_home": 278,
    "score": {
      "event_id": "5527455bb80a5e9884153786aeb5f2b2",
      "event_status": "STATUS_FINAL",
      "score_away": 13,
      "score_home": 17,
      "winner_away": 0,
      "winner_home": 1,
      "score_away_by_period": [0, 0, 3, 10],
      "score_home_by_period": [10, 7, 0, 0],
      "venue_name": "Soldier Field",
      "venue_location": "Chicago, IL",
      "game_clock": 0,
      "display_clock": "0.00",
      "game_period": 4,
      "broadcast": "CBS",
      "event_status_detail": "Final"
    },
    "teams": [
      {
        "team_id": 18620,
        "team_normalized_id": 78,
        "name": "New York Giants",
        "is_away": true,
        "is_home": false
      },
      {
        "team_id": 18611,
        "team_normalized_id": 81,
        "name": "Chicago Bears",
        "is_away": false,
        "is_home": true
      }
    ],
    "teams_normalized": [
      {
        "team_id": 78,
        "name": "New York",
        "mascot": "Giants",
        "abbreviation": "NYG",
        "ranking": 0,
        "record": "0-4",
        "is_away": true,
        "is_home": false
      },
      {
        "team_id": 81,
        "name": "Chicago",
        "mascot": "Bears",
        "abbreviation": "CHI",
        "ranking": 0,
        "record": "3-1",
        "is_away": false,
        "is_home": true
      }
    ],
    "schedule": {
      "season_type": "Regular Season",
      "season_year": 2020,
      "week": 2,
      "week_name": "Week 2",
      "week_detail": "Sep 16-22",
      "event_name": "New York at Chicago - 2020-09-20",
      "attendance": "0"
    },
    "lines": {
      "1": {
        "line_id": 10806455,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "2": {
        "line_id": 10806465,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "3": {
        "line_id": 10978226,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "4": {
        "line_id": 10972470,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "6": {
        "line_id": 10972478,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "7": {
        "line_id": 10971009,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "9": {
        "line_id": 10970983,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "10": {
        "line_id": 10970996,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "11": {
        "line_id": 10972462,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "12": {
        "line_id": 10806566,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "15": {
        "line_id": 10972458,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "16": {
        "line_id": 10978258,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "17": {
        "line_id": 10978096,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      },
      "18": {
        "line_id": 10977770,
        "moneyline": [Object],
        "spread": [Object],
        "total": [Object],
        "affiliate": [Object]
      }
    },
    "line_periods": null,
    "result": 30
  },
  "result": 30,
  "statusCode": 200
}
```

## Event Endpoint

Returns data for a specific event

### Input Params

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `eventId` | The ID of the event to query |         |             |

## Events Endpoint

Returns all events within the specified params

### Input Params

| Required? |   Name    |                Description                | Options | Defaults to |
| :-------: | :-------: | :---------------------------------------: | :-----: | :---------: |
|    ✅     | `sportId` |  The ID of the sport to get events from   |         |             |
|    ✅     |  `date`   |        The date to get events from        |         |             |
|           | `status`  | Optional status param to filter events on |         |             |
