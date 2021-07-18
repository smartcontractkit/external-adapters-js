# Chainlink External Adapter for Sportsdataio

Adapter got get data from Sportsdata.io

### Environment Variables

| Required? |        Name        |      Description       | Options | Defaults to |
| :-------: | :----------------: | :--------------------: | :-----: | :---------: |
|           | NFL_SCORES_API_KEY | API key for NFL scores |         |             |
|           | MMA_STATS_API_KEY | API key for MMA stats |         |             |
|           | CFB_SCORES_API_KEY | API key for CFB scores |         |             |

---

### Input Parameters

| Required? | Name  |   Description    |   Options   | Defaults to |
| :-------: | :---: | :--------------: | :---------: | :---------: |
|           | sport | The sport to use | [nfl](#NFL), [mma](#MMA), [ncaa-fb](#ncaa-fb) |     nfl     |

---

## NFL

### Input Parameters

| Required? |   Name   |      Description      |                     Options                      | Defaults to |
| :-------: | :------: | :-------------------: | :----------------------------------------------: | :---------: |
|           | endpoint | The endpoint to query | [schedule](#NFL-Schedule), [scores](#NFL-Scores) |  schedule   |

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

---

## MMA

### Input Parameters

| Required? |   Name   |      Description      |                    Options                     | Defaults to |
| :-------: | :------: | :-------------------: | :--------------------------------------------: | :---------: |
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

| Required? |   Name   |      Description      |                     Options                      | Defaults to |
| :-------: | :------: | :-------------------: | :----------------------------------------------: | :---------: |
|           | endpoint | The endpoint to query | [schedule](#ncaa-fb-schedule), [scores](#ncaa-fb-scores) |  schedule   |

### NCAA-FB Schedule

This endpoint is an alias for [scores](#ncaa-fb-scores).

### NCAA-FB Scores

Get NCAA FB scores

#### Input Parameters

| Required? |  Name  |          Description          | Options | Defaults to |
| :-------: | :----: | :---------------------------: | :-----: | :---------: |
|    ✅     | season | The season to get scores from |         |             |
