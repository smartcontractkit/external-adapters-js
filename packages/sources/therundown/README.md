# Chainlink External Adapter for TheRundown

![1.2.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/therundown/package.json)

Base URL https://therundown-therundown-v1.p.rapidapi.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                         Description                                         |  Type  | Options |                      Default                       |
| :-------: | :----------: | :-----------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://rapidapi.com/therundown/api/therundown) | string |         |                                                    |
|           | API_ENDPOINT |                                                                                             | string |         | `https://therundown-therundown-v1.p.rapidapi.com/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                          Options                                          |    Default    |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [event](#event-endpoint), [events](#events-endpoint), [total-score](#totalscore-endpoint) | `total-score` |

## TotalScore Endpoint

Returns the sum of both teams' scores for a match (match status must be final)

`total-score` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |         Description          | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :--------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | matchId |         | The ID of the match to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "total-score",
    "matchId": "5527455bb80a5e9884153786aeb5f2b2"
  },
  "debug": {
    "cacheKey": "ryGC9W88xHG0R1Sa+pavq5CMmeU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "event_id": "5527455bb80a5e9884153786aeb5f2b2",
    "event_uuid": "11ea-fb62-b7f6e800-8bef-8a4dcc350d17",
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
      "score_away_by_period": [
        0,
        0,
        3,
        10
      ],
      "score_home_by_period": [
        10,
        7,
        0,
        0
      ],
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
        "record": "4-7",
        "is_away": true,
        "is_home": false
      },
      {
        "team_id": 81,
        "name": "Chicago",
        "mascot": "Bears",
        "abbreviation": "CHI",
        "ranking": 0,
        "record": "4-7",
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
        "moneyline": {
          "line_id": 10806455,
          "moneyline_away": 190,
          "moneyline_away_delta": 0,
          "moneyline_home": -230,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T17:02:29.872469Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10806455,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 1,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -110,
          "point_spread_away_money_delta": -8,
          "point_spread_home_money": -110,
          "point_spread_home_money_delta": -2,
          "date_updated": "2020-09-20T17:02:29.879369Z",
          "format": "American"
        },
        "total": {
          "line_id": 10806455,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 1,
          "total_over": 43,
          "total_over_delta": 0,
          "total_under": 43,
          "total_under_delta": 0,
          "total_over_money": -110,
          "total_over_money_delta": -5,
          "total_under_money": -110,
          "total_under_money_delta": -5,
          "date_updated": "2020-09-20T17:02:29.889256Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 1,
          "affiliate_name": "5Dimes",
          "affiliate_url": "https://bit.ly/3rKIuBh"
        }
      },
      "2": {
        "line_id": 10806465,
        "moneyline": {
          "line_id": 10806465,
          "moneyline_away": 180,
          "moneyline_away_delta": 0,
          "moneyline_home": -220,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T16:17:25.542016Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10806465,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 2,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -115,
          "point_spread_away_money_delta": -5,
          "point_spread_home_money": -105,
          "point_spread_home_money_delta": 5,
          "date_updated": "2020-09-20T16:17:25.551993Z",
          "format": "American"
        },
        "total": {
          "line_id": 10806465,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 2,
          "total_over": 42.5,
          "total_over_delta": -0.5,
          "total_under": 42.5,
          "total_under_delta": -0.5,
          "total_over_money": -110,
          "total_over_money_delta": 0,
          "total_under_money": -110,
          "total_under_money_delta": 0,
          "date_updated": "2020-09-20T15:47:53.589026Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 2,
          "affiliate_name": "Bovada",
          "affiliate_url": "https://www.bovada.lv/"
        }
      },
      "3": {
        "line_id": 10978226,
        "moneyline": {
          "line_id": 10978226,
          "moneyline_away": 196,
          "moneyline_away_delta": 0,
          "moneyline_home": -222,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T17:01:58.698796Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10978226,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 3,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -105,
          "point_spread_away_money_delta": 0,
          "point_spread_home_money": -105,
          "point_spread_home_money_delta": 0,
          "extended_spreads": [
            {
              "affiliate_id": 3,
              "point_spread_away": 2,
              "point_spread_away_delta": 0,
              "point_spread_home": -2,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 162,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -187,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 2.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -2.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 151,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -174,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 3,
              "point_spread_away_delta": 0,
              "point_spread_home": -3,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 131,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -150,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 3.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -3.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 108,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -122,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 4,
              "point_spread_away_delta": 0,
              "point_spread_home": -4,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 102,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -114,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 4.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -4.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -105,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -105,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 5,
              "point_spread_away_delta": 0,
              "point_spread_home": -5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -111,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -100,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 5.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -5.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -117,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 104,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 6,
              "point_spread_away_delta": 0,
              "point_spread_home": -6,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -128,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 113,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 6.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -6.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -138,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 121,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 7,
              "point_spread_away_delta": 0,
              "point_spread_home": -7,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -159,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 139,
              "point_spread_home_money_delta": 0
            }
          ],
          "date_updated": "2020-09-20T17:01:58.705943Z",
          "format": "American"
        },
        "total": {
          "line_id": 10978226,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 3,
          "total_over": 42.5,
          "total_over_delta": 0,
          "total_under": 42.5,
          "total_under_delta": 0,
          "total_over_money": -108,
          "total_over_money_delta": 0,
          "total_under_money": -103,
          "total_under_money_delta": 0,
          "extended_totals": [
            {
              "affiliate_id": 3,
              "total_over": 40,
              "total_over_delta": 0,
              "total_under": 40,
              "total_under_delta": 0,
              "total_over_money": -150,
              "total_over_money_delta": 0,
              "total_under_money": 131,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 40.5,
              "total_over_delta": 0,
              "total_under": 40.5,
              "total_under_delta": 0,
              "total_over_money": -140,
              "total_over_money_delta": 0,
              "total_under_money": 123,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 41,
              "total_over_delta": 0,
              "total_under": 41,
              "total_under_delta": 0,
              "total_over_money": -131,
              "total_over_money_delta": 0,
              "total_under_money": 115,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 41.5,
              "total_over_delta": 0,
              "total_under": 41.5,
              "total_under_delta": 0,
              "total_over_money": -121,
              "total_over_money_delta": 0,
              "total_under_money": 107,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 42,
              "total_over_delta": 0,
              "total_under": 42,
              "total_under_delta": 0,
              "total_over_money": -115,
              "total_over_money_delta": 0,
              "total_under_money": 101,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 42.5,
              "total_over_delta": 0,
              "total_under": 42.5,
              "total_under_delta": 0,
              "total_over_money": -108,
              "total_over_money_delta": 0,
              "total_under_money": -103,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 43,
              "total_over_delta": 0,
              "total_under": 43,
              "total_under_delta": 0,
              "total_over_money": -101,
              "total_over_money_delta": 0,
              "total_under_money": -113,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 43.5,
              "total_over_delta": 0,
              "total_under": 43.5,
              "total_under_delta": 0,
              "total_over_money": 107,
              "total_over_money_delta": 0,
              "total_under_money": -122,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 44,
              "total_over_delta": 0,
              "total_under": 44,
              "total_under_delta": 0,
              "total_over_money": 114,
              "total_over_money_delta": 0,
              "total_under_money": -130,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 44.5,
              "total_over_delta": 0,
              "total_under": 44.5,
              "total_under_delta": 0,
              "total_over_money": 121,
              "total_over_money_delta": 0,
              "total_under_money": -138,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 45,
              "total_over_delta": 0,
              "total_under": 45,
              "total_under_delta": 0,
              "total_over_money": 132,
              "total_over_money_delta": 0,
              "total_under_money": -151,
              "total_under_money_delta": 0
            }
          ],
          "date_updated": "2020-09-20T16:46:40.741951Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 3,
          "affiliate_name": "Pinnacle",
          "affiliate_url": "https://www.pinnacle.com/en/rtn"
        }
      },
      "4": {
        "line_id": 10972470,
        "moneyline": {
          "line_id": 10972470,
          "moneyline_away": 190,
          "moneyline_away_delta": 0,
          "moneyline_home": -220,
          "moneyline_home_delta": 0,
          "moneyline_draw": -220,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T16:16:59.033795Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10972470,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 4,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -110,
          "point_spread_away_money_delta": 2,
...
```

---

## Events Endpoint

Returns all events within the specified params

`events` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | sportId |         |  The ID of the sport to get events from   |        |         |         |            |                |
|    ✅     |  date   |         |        The date to get events from        | string |         |         |            |                |
|           | status  |         | Optional status param to filter events on | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "events",
    "sportId": 2,
    "date": "2020-09-20T17:00:00Z"
  },
  "debug": {
    "cacheKey": "MKMCnYblR+gdTWjNZN/REeM1+Mo="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "meta": {
      "delta_last_id": "11ec-569a-b9a53737-8102-3bb48f0cb234"
    },
    "events": [
      {
        "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
        "event_uuid": "11ea-fb62-b7f6e800-8a04-d157674beab4",
        "sport_id": 2,
        "event_date": "2020-09-20T17:00:00Z",
        "rotation_number_away": 279,
        "rotation_number_home": 280,
        "score": {
          "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
          "event_status": "STATUS_FINAL",
          "score_away": 30,
          "score_home": 33,
          "winner_away": 0,
          "winner_home": 1,
          "score_away_by_period": [
            7,
            3,
            7,
            13
          ],
          "score_home_by_period": [
            14,
            10,
            6,
            3
          ],
          "venue_name": "Nissan Stadium",
          "venue_location": "Nashville, TN",
          "game_clock": 0,
          "display_clock": "0.00",
          "game_period": 4,
          "broadcast": "CBS",
          "event_status_detail": "Final"
        },
        "teams": [
          {
            "team_id": 18618,
            "team_normalized_id": 71,
            "name": "Jacksonville Jaguars",
            "is_away": true,
            "is_home": false
          },
          {
            "team_id": 18609,
            "team_normalized_id": 72,
            "name": "Tennessee Titans",
            "is_away": false,
            "is_home": true
          }
        ],
        "teams_normalized": [
          {
            "team_id": 71,
            "name": "Jacksonville",
            "mascot": "Jaguars",
            "abbreviation": "JAX",
            "ranking": 0,
            "record": "2-10",
            "is_away": true,
            "is_home": false
          },
          {
            "team_id": 72,
            "name": "Tennessee",
            "mascot": "Titans",
            "abbreviation": "TEN",
            "ranking": 0,
            "record": "8-4",
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
          "event_name": "Jacksonville at Tennessee - 2020-09-20",
          "attendance": "0"
        },
        "lines": {
          "1": {
            "line_id": 10806469,
            "moneyline": {
              "line_id": 10806469,
              "moneyline_away": 285,
              "moneyline_away_delta": 0,
              "moneyline_home": -345,
              "moneyline_home_delta": 0,
              "moneyline_draw": 0.0001,
              "moneyline_draw_delta": 0,
              "date_updated": "2020-09-20T17:02:26.362883Z",
              "format": "American"
            },
            "spread": {
              "line_id": 10806469,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 1,
              "point_spread_away": 7.5,
              "point_spread_away_delta": 0.5,
              "point_spread_home": -7.5,
              "point_spread_home_delta": -0.5,
              "point_spread_away_money": -135,
              "point_spread_away_money_delta": -25,
              "point_spread_home_money": 115,
              "point_spread_home_money_delta": 15,
              "date_updated": "2020-09-20T17:02:26.370213Z",
              "format": "American"
            },
            "total": {
              "line_id": 10806469,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 1,
              "total_over": 44.5,
              "total_over_delta": 0,
              "total_under": 44.5,
              "total_under_delta": 0,
              "total_over_money": -110,
              "total_over_money_delta": -5,
              "total_under_money": -110,
              "total_under_money_delta": -5,
              "date_updated": "2020-09-20T17:02:26.37797Z",
              "format": "American"
            },
            "affiliate": {
              "affiliate_id": 1,
              "affiliate_name": "5Dimes",
              "affiliate_url": "https://bit.ly/3rKIuBh"
            }
          },
          "2": {
            "line_id": 10806515,
            "moneyline": {
              "line_id": 10806515,
              "moneyline_away": 270,
              "moneyline_away_delta": 0,
              "moneyline_home": -340,
              "moneyline_home_delta": 0,
              "moneyline_draw": 0.0001,
              "moneyline_draw_delta": 0,
              "date_updated": "2020-09-20T16:37:10.853705Z",
              "format": "American"
            },
            "spread": {
              "line_id": 10806515,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 2,
              "point_spread_away": 7,
              "point_spread_away_delta": 0,
              "point_spread_home": -7,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -120,
              "point_spread_away_money_delta": -5,
              "point_spread_home_money": 100,
              "point_spread_home_money_delta": 205,
              "date_updated": "2020-09-20T16:52:15.334402Z",
              "format": "American"
            },
            "total": {
              "line_id": 10806515,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 2,
              "total_over": 44.5,
              "total_over_delta": 0.5,
              "total_under": 44.5,
              "total_under_delta": 0.5,
              "total_over_money": -110,
              "total_over_money_delta": 5,
              "total_under_money": -110,
              "total_under_money_delta": -5,
              "date_updated": "2020-09-20T14:17:09.327781Z",
              "format": "American"
            },
            "affiliate": {
              "affiliate_id": 2,
              "affiliate_name": "Bovada",
              "affiliate_url": "https://www.bovada.lv/"
            }
          },
          "3": {
            "line_id": 10978227,
            "moneyline": {
              "line_id": 10978227,
              "moneyline_away": 254,
              "moneyline_away_delta": 0,
              "moneyline_home": -295,
              "moneyline_home_delta": 0,
              "moneyline_draw": 0.0001,
              "moneyline_draw_delta": 0,
              "date_updated": "2020-09-20T16:57:31.899769Z",
              "format": "American"
            },
            "spread": {
              "line_id": 10978227,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 3,
              "point_spread_away": 7,
              "point_spread_away_delta": 0,
              "point_spread_home": -7,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -116,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 105,
              "point_spread_home_money_delta": 0,
              "extended_spreads": [
                {
                  "affiliate_id": 3,
                  "point_spread_away": 4.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -4.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": 124,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": -141,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": 119,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": -135,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 5.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -5.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": 113,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": -128,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 6,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -6,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": 106,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": -119,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 6.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -6.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -101,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": -110,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 7,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -7,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -116,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 105,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 7.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -7.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -133,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 119,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 8,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -8,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -140,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 124,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 8.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -8.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -147,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 129,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 9,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -9,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -152,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 133,
                  "point_spread_home_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "point_spread_away": 9.5,
                  "point_spread_away_delta": 0,
                  "point_spread_home": -9.5,
                  "point_spread_home_delta": 0,
                  "point_spread_away_money": -157,
                  "point_spread_away_money_delta": 0,
                  "point_spread_home_money": 137,
                  "point_spread_home_money_delta": 0
                }
              ],
              "date_updated": "2020-09-20T17:01:52.428116Z",
              "format": "American"
            },
            "total": {
              "line_id": 10978227,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 3,
              "total_over": 44.5,
              "total_over_delta": 0,
              "total_under": 44.5,
              "total_under_delta": 0,
              "total_over_money": -108,
              "total_over_money_delta": -2,
              "total_under_money": -103,
              "total_under_money_delta": 2,
              "extended_totals": [
                {
                  "affiliate_id": 3,
                  "total_over": 42,
                  "total_over_delta": 0,
                  "total_under": 42,
                  "total_under_delta": 0,
                  "total_over_money": -152,
                  "total_over_money_delta": 0,
                  "total_under_money": 133,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 42.5,
                  "total_over_delta": 0,
                  "total_under": 42.5,
                  "total_under_delta": 0,
                  "total_over_money": -144,
                  "total_over_money_delta": 0,
                  "total_under_money": 126,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 43,
                  "total_over_delta": 0,
                  "total_under": 43,
                  "total_under_delta": 0,
                  "total_over_money": -136,
                  "total_over_money_delta": 0,
                  "total_under_money": 119,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 43.5,
                  "total_over_delta": 0,
                  "total_under": 43.5,
                  "total_under_delta": 0,
                  "total_over_money": -126,
                  "total_over_money_delta": 0,
                  "total_under_money": 111,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 44,
                  "total_over_delta": 0,
                  "total_under": 44,
                  "total_under_delta": 0,
                  "total_over_money": -118,
                  "total_over_money_delta": 0,
                  "total_under_money": 104,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 44.5,
                  "total_over_delta": 0,
                  "total_under": 44.5,
                  "total_under_delta": 0,
                  "total_over_money": -108,
                  "total_over_money_delta": 0,
                  "total_under_money": -103,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 45,
                  "total_over_delta": 0,
                  "total_under": 45,
                  "total_under_delta": 0,
                  "total_over_money": 100,
                  "total_over_money_delta": 0,
                  "total_under_money": -113,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 45.5,
                  "total_over_delta": 0,
                  "total_under": 45.5,
                  "total_under_delta": 0,
                  "total_over_money": 109,
                  "total_over_money_delta": 0,
                  "total_under_money": -124,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 46,
                  "total_over_delta": 0,
                  "total_under": 46,
                  "total_under_delta": 0,
                  "total_over_money": 116,
                  "total_over_money_delta": 0,
                  "total_under_money": -132,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 46.5,
                  "total_over_delta": 0,
                  "total_under": 46.5,
                  "total_under_delta": 0,
                  "total_over_money": 122,
                  "total_over_money_delta": 0,
                  "total_under_money": -139,
                  "total_under_money_delta": 0
                },
                {
                  "affiliate_id": 3,
                  "total_over": 47,
                  "total_over_delta": 0,
                  "total_under": 47,
                  "total_under_delta": 0,
                  "total_over_money": 131,
                  "total_over_money_delta": 0,
                  "total_under_money": -150,
                  "total_under_money_delta": 0
                }
              ],
              "date_updated": "2020-09-20T17:01:52.437031Z",
              "format": "American"
            },
            "affiliate": {
              "affiliate_id": 3,
              "affiliate_name": "Pinnacle",
              "affiliate_url": "https://www.pinnacle.com/en/rtn"
            }
          },
          "4": {
            "line_id": 10972471,
            "moneyline": {
              "line_id": 10972471,
              "moneyline_away": 250,
              "moneyline_away_delta": 0,
              "moneyline_home": -300,
              "moneyline_home_delta": 0,
              "moneyline_draw": -300,
              "moneyline_draw_delta": 0,
              "date_updated": "2020-09-20T16:51:46.694957Z",
              "format": "American"
            },
            "spread": {
              "line_id": 10972471,
              "event_id": "0e5fee98ccd3e67128f6ad1d1cf5c01e",
              "affiliate_id": 4,
              "point_spread_away": 7,
...
```

---

## Event Endpoint

Returns data for a specific event

`event` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |         Description          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :--------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | eventId |         | The ID of the event to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "event",
    "eventId": "5527455bb80a5e9884153786aeb5f2b2"
  },
  "debug": {
    "cacheKey": "87PwMXhXfS/lNxqJnqHJhgKzx1U="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "event_id": "5527455bb80a5e9884153786aeb5f2b2",
    "event_uuid": "11ea-fb62-b7f6e800-8bef-8a4dcc350d17",
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
      "score_away_by_period": [
        0,
        0,
        3,
        10
      ],
      "score_home_by_period": [
        10,
        7,
        0,
        0
      ],
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
        "record": "4-7",
        "is_away": true,
        "is_home": false
      },
      {
        "team_id": 81,
        "name": "Chicago",
        "mascot": "Bears",
        "abbreviation": "CHI",
        "ranking": 0,
        "record": "4-7",
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
        "moneyline": {
          "line_id": 10806455,
          "moneyline_away": 190,
          "moneyline_away_delta": 0,
          "moneyline_home": -230,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T17:02:29.872469Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10806455,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 1,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -110,
          "point_spread_away_money_delta": -8,
          "point_spread_home_money": -110,
          "point_spread_home_money_delta": -2,
          "date_updated": "2020-09-20T17:02:29.879369Z",
          "format": "American"
        },
        "total": {
          "line_id": 10806455,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 1,
          "total_over": 43,
          "total_over_delta": 0,
          "total_under": 43,
          "total_under_delta": 0,
          "total_over_money": -110,
          "total_over_money_delta": -5,
          "total_under_money": -110,
          "total_under_money_delta": -5,
          "date_updated": "2020-09-20T17:02:29.889256Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 1,
          "affiliate_name": "5Dimes",
          "affiliate_url": "https://bit.ly/3rKIuBh"
        }
      },
      "2": {
        "line_id": 10806465,
        "moneyline": {
          "line_id": 10806465,
          "moneyline_away": 180,
          "moneyline_away_delta": 0,
          "moneyline_home": -220,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T16:17:25.542016Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10806465,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 2,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -115,
          "point_spread_away_money_delta": -5,
          "point_spread_home_money": -105,
          "point_spread_home_money_delta": 5,
          "date_updated": "2020-09-20T16:17:25.551993Z",
          "format": "American"
        },
        "total": {
          "line_id": 10806465,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 2,
          "total_over": 42.5,
          "total_over_delta": -0.5,
          "total_under": 42.5,
          "total_under_delta": -0.5,
          "total_over_money": -110,
          "total_over_money_delta": 0,
          "total_under_money": -110,
          "total_under_money_delta": 0,
          "date_updated": "2020-09-20T15:47:53.589026Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 2,
          "affiliate_name": "Bovada",
          "affiliate_url": "https://www.bovada.lv/"
        }
      },
      "3": {
        "line_id": 10978226,
        "moneyline": {
          "line_id": 10978226,
          "moneyline_away": 196,
          "moneyline_away_delta": 0,
          "moneyline_home": -222,
          "moneyline_home_delta": 0,
          "moneyline_draw": 0.0001,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T17:01:58.698796Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10978226,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 3,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -105,
          "point_spread_away_money_delta": 0,
          "point_spread_home_money": -105,
          "point_spread_home_money_delta": 0,
          "extended_spreads": [
            {
              "affiliate_id": 3,
              "point_spread_away": 2,
              "point_spread_away_delta": 0,
              "point_spread_home": -2,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 162,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -187,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 2.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -2.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 151,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -174,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 3,
              "point_spread_away_delta": 0,
              "point_spread_home": -3,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 131,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -150,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 3.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -3.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 108,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -122,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 4,
              "point_spread_away_delta": 0,
              "point_spread_home": -4,
              "point_spread_home_delta": 0,
              "point_spread_away_money": 102,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -114,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 4.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -4.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -105,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -105,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 5,
              "point_spread_away_delta": 0,
              "point_spread_home": -5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -111,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": -100,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 5.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -5.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -117,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 104,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 6,
              "point_spread_away_delta": 0,
              "point_spread_home": -6,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -128,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 113,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 6.5,
              "point_spread_away_delta": 0,
              "point_spread_home": -6.5,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -138,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 121,
              "point_spread_home_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "point_spread_away": 7,
              "point_spread_away_delta": 0,
              "point_spread_home": -7,
              "point_spread_home_delta": 0,
              "point_spread_away_money": -159,
              "point_spread_away_money_delta": 0,
              "point_spread_home_money": 139,
              "point_spread_home_money_delta": 0
            }
          ],
          "date_updated": "2020-09-20T17:01:58.705943Z",
          "format": "American"
        },
        "total": {
          "line_id": 10978226,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 3,
          "total_over": 42.5,
          "total_over_delta": 0,
          "total_under": 42.5,
          "total_under_delta": 0,
          "total_over_money": -108,
          "total_over_money_delta": 0,
          "total_under_money": -103,
          "total_under_money_delta": 0,
          "extended_totals": [
            {
              "affiliate_id": 3,
              "total_over": 40,
              "total_over_delta": 0,
              "total_under": 40,
              "total_under_delta": 0,
              "total_over_money": -150,
              "total_over_money_delta": 0,
              "total_under_money": 131,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 40.5,
              "total_over_delta": 0,
              "total_under": 40.5,
              "total_under_delta": 0,
              "total_over_money": -140,
              "total_over_money_delta": 0,
              "total_under_money": 123,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 41,
              "total_over_delta": 0,
              "total_under": 41,
              "total_under_delta": 0,
              "total_over_money": -131,
              "total_over_money_delta": 0,
              "total_under_money": 115,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 41.5,
              "total_over_delta": 0,
              "total_under": 41.5,
              "total_under_delta": 0,
              "total_over_money": -121,
              "total_over_money_delta": 0,
              "total_under_money": 107,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 42,
              "total_over_delta": 0,
              "total_under": 42,
              "total_under_delta": 0,
              "total_over_money": -115,
              "total_over_money_delta": 0,
              "total_under_money": 101,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 42.5,
              "total_over_delta": 0,
              "total_under": 42.5,
              "total_under_delta": 0,
              "total_over_money": -108,
              "total_over_money_delta": 0,
              "total_under_money": -103,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 43,
              "total_over_delta": 0,
              "total_under": 43,
              "total_under_delta": 0,
              "total_over_money": -101,
              "total_over_money_delta": 0,
              "total_under_money": -113,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 43.5,
              "total_over_delta": 0,
              "total_under": 43.5,
              "total_under_delta": 0,
              "total_over_money": 107,
              "total_over_money_delta": 0,
              "total_under_money": -122,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 44,
              "total_over_delta": 0,
              "total_under": 44,
              "total_under_delta": 0,
              "total_over_money": 114,
              "total_over_money_delta": 0,
              "total_under_money": -130,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 44.5,
              "total_over_delta": 0,
              "total_under": 44.5,
              "total_under_delta": 0,
              "total_over_money": 121,
              "total_over_money_delta": 0,
              "total_under_money": -138,
              "total_under_money_delta": 0
            },
            {
              "affiliate_id": 3,
              "total_over": 45,
              "total_over_delta": 0,
              "total_under": 45,
              "total_under_delta": 0,
              "total_over_money": 132,
              "total_over_money_delta": 0,
              "total_under_money": -151,
              "total_under_money_delta": 0
            }
          ],
          "date_updated": "2020-09-20T16:46:40.741951Z",
          "format": "American"
        },
        "affiliate": {
          "affiliate_id": 3,
          "affiliate_name": "Pinnacle",
          "affiliate_url": "https://www.pinnacle.com/en/rtn"
        }
      },
      "4": {
        "line_id": 10972470,
        "moneyline": {
          "line_id": 10972470,
          "moneyline_away": 190,
          "moneyline_away_delta": 0,
          "moneyline_home": -220,
          "moneyline_home_delta": 0,
          "moneyline_draw": -220,
          "moneyline_draw_delta": 0,
          "date_updated": "2020-09-20T16:16:59.033795Z",
          "format": "American"
        },
        "spread": {
          "line_id": 10972470,
          "event_id": "5527455bb80a5e9884153786aeb5f2b2",
          "affiliate_id": 4,
          "point_spread_away": 4.5,
          "point_spread_away_delta": 0,
          "point_spread_home": -4.5,
          "point_spread_home_delta": 0,
          "point_spread_away_money": -110,
          "point_spread_away_money_delta": 2,
...
```

---

MIT License
