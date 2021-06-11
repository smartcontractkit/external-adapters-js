# Chainlink External Adapter for Sportsdataio

Adapter got get data from Sportsdata.io

### Environment Variables

| Required? |        Name        |      Description       | Options | Defaults to |
| :-------: | :----------------: | :--------------------: | :-----: | :---------: |
|           | NFL_SCORES_API_KEY | API key for NFL scores |         |             |
|           | MMA_SCORES_API_KEY | API key for MMA scores |         |             |

---

### Input Parameters

| Required? | Name  |   Description    |   Options   | Defaults to |
| :-------: | :---: | :--------------: | :---------: | :---------: |
|           | sport | The sport to use | [nfl](#NFL) |     nfl     |

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
|    ✅     | endpoint | The endpoint to query | [schedule](#MMA-Schedule), [event](#MMA-Event) |             |

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
