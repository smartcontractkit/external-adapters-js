# Chainlink External Adapter for TheRundown

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/therundown/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

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

There are no examples for this endpoint.

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

There are no examples for this endpoint.

---

## Event Endpoint

Returns data for a specific event

`event` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |         Description          |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :--------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | eventId |         | The ID of the event to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
