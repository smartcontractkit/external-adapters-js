# Chainlink External Adapter for Enetpulse

[Enetpulse](https://www.enetpulse.com/)

### Environment Variables

| Required? |     Name     |                                   Description                                   | Options | Defaults to |
| :-------: | :----------: | :-----------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_USERNAME | `username` query string param required for authentication. Contact dataprovider |         |             |
|    ✅     |  API_TOKEN   |  `token` query string param required for authentication. Contact dataprovider   |         |             |

### Input Parameters

| Required? |   Name   |     Description     |                                     Options                                     | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------------------------------: | :---------: |
|    ✅     | endpoint | The endpoint to use | [schedule](#Schedule), [game-details](#Game-Details), [game-score](#Game-Score) |             |

### Schedule

Returns the IDs of the games scheduled for a given date (to be consumed as Large Response).

| Required? |    Name    |      Description      |                              Options                               | Defaults to  |
| :-------: | :--------: | :-------------------: | :----------------------------------------------------------------: | :----------: |
|    ✅     | `leagueId` |     The league ID     | `873678`, `874017`, `874068`, `874287`, `874006` (see table below) |              |
|           |   `date`   | The date of the games |                            `YYYY-MM-DD`                            | Today's date |

`leagueId` details:

| leagueId |    Name    | Country |
| :------: | :--------: | :-----: |
|  873678  |    EPL     | England |
|  874017  |  Ligue 1   | France  |
|  874068  |    Liga    |  Spain  |
|  874287  |  Serie A   |  Italy  |
|  874006  | Bundesliga | Germany |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "schedule",
    "leagueId": 873678,
    "date": "2021-09-19"
  }
}
```

### Sample Output

Result as a `bytes` (from `"[<gameId_1>,...,<gameId_N>]"`).

```json
{
  "jobRunID": "1",
  "result": "0x5b333630393937302c333630393937362c333630393937375d",
  "statusCode": 200,
  "data": {
    "result": "0x5b333630393937302c333630393937362c333630393937375d"
  }
}
```

Result converted to string is: `[3609970,3609976,3609977]`.

### Game Details

Returns the game details.

| Required? |        Name         |                                        Description                                        |     Options     | Defaults to |
| :-------: | :-----------------: | :---------------------------------------------------------------------------------------: | :-------------: | :---------: |
|    ✅     |      `gameId`       |                                        The game ID                                        |                 |             |
|           | `as_large_response` | Returns the details as `bytes` (to be consumed as Large Response), otherwise as an object | `true`, `false` |   `false`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "game-details",
    "gameId": 3609970
  }
}
```

### Sample Output

Both `homeTeam` and `awayTeam` are in `bytes`.

A game that has not started (`gameId` is 3609970):

```json
{
  "jobRunID": "1",
  "result": {
    "homeTeamId": 10204,
    "homeTeam": "0x4272696768746f6e202620486f766520416c62696f6e",
    "awayTeamId": 8197,
    "awayTeam": "0x4c65696365737465722043697479",
    "kickOffTime": "2021-09-19T13:00:00+00:00",
    "status": "notstarted"
  },
  "statusCode": 200,
  "data": {
    "result": {
      "homeTeamId": 10204,
      "homeTeam": "0x4272696768746f6e202620486f766520416c62696f6e",
      "awayTeamId": 8197,
      "awayTeam": "0x4c65696365737465722043697479",
      "kickOffTime": "2021-09-19T13:00:00+00:00",
      "status": "notstarted"
    }
  }
}
```

A game that has finished (`gameId` is 3629115):

```json
{
  "jobRunID": "1",
  "result": {
    "homeTeamId": 8634,
    "homeTeam": "0x42617263656c6f6e61",
    "awayTeamId": 8305,
    "awayTeam": "0x476574616665",
    "kickOffTime": "2021-08-29T15:00:00+00:00",
    "status": "finished"
  },
  "statusCode": 200,
  "data": {
    "result": {
      "homeTeamId": 8634,
      "homeTeam": "0x42617263656c6f6e61",
      "awayTeamId": 8305,
      "awayTeam": "0x476574616665",
      "kickOffTime": "2021-08-29T15:00:00+00:00",
      "status": "finished"
    }
  }
}
```

### Sample Input Large Response

```json
{
  "id": "1",
  "data": {
    "endpoint": "game-details",
    "gameId": 3629115,
    "as_large_response": true
  }
}
```

### Sample Output Large Response

Result as a `bytes` (from `"[<homeTeamId>,<homeTeam as bytes>,<awayTeamId>,<awayTeam as bytes>,<kickOffTime>,<status>]"`).

```json
{
  "jobRunID": "1",
  "result": "0x5b383633342c2242617263656c6f6e61222c383330352c22476574616665222c22323032312d30382d32395431353a30303a30302b30303a3030222c2266696e6973686564225d",
  "statusCode": 200,
  "data": {
    "result": "0x5b383633342c2242617263656c6f6e61222c383330352c22476574616665222c22323032312d30382d32395431353a30303a30302b30303a3030222c2266696e6973686564225d"
  }
}
```

Result converted to string is: `[8634,"Barcelona",8305,"Getafe","2021-08-29T15:00:00+00:00","finished"]`.

### Game Score

Returns the game score.

| Required? |        Name         |                                        Description                                        |     Options     | Defaults to |
| :-------: | :-----------------: | :---------------------------------------------------------------------------------------: | :-------------: | :---------: |
|    ✅     |      `gameId`       |                                        The game ID                                        |                 |             |
|           | `as_large_response` | Returns the details as `bytes` (to be consumed as Large Response), otherwise as an object | `true`, `false` |   `false`   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "game-score",
    "gameId": 3609970
  }
}
```

### Sample Output

A game that has not started (`gameId` is 3609970):

```json
{
  "jobRunID": "1",
  "result": {
    "status": "notstarted",
    "homeTeamScore": 0,
    "awayTeamScore": 0
  },
  "data": {
    "result": {
      "status": "notstarted",
      "homeTeamScore": 0,
      "awayTeamScore": 0
    }
  },
  "statusCode": 200
}
```

A game that has finished (`gameId` is 3629115):

```json
{
  "jobRunID": "1",
  "result": {
    "status": "finished",
    "homeTeamScore": 2,
    "awayTeamScore": 1
  },
  "data": {
    "result": {
      "status": "finished",
      "homeTeamScore": 2,
      "awayTeamScore": 1
    }
  },
  "statusCode": 200
}
```

### Sample Input Large Response

```json
{
  "id": "1",
  "data": {
    "endpoint": "game-score",
    "gameId": 3629115,
    "as_large_response": false
  }
}
```

### Sample Output Large Response

Result as a `bytes` (from `"[<status>,<homeTeamScore>,<awayTeamScore>]"`).

```json
{
  "jobRunID": "1",
  "result": "0x5b2266696e6973686564222c322c315d",
  "data": {
    "result": "0x5b2266696e6973686564222c322c315d"
  },
  "statusCode": 200
}
```

Result converted to string is: `["finished",2,1]`.
