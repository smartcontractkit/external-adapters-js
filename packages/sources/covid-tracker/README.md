# Chainlink External Adapter for COVID Tracker

![1.4.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/covid-tracker/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Notice: The COVID Tracking Project is ending all data collection on March 7, 2021. The existing API will continue to work until May 2021, but will only include data up to March 7, 2021.

Base URL https://api.covidtracking.com/v1

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |      Options       | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------: | :-----: |
|           | endpoint | The endpoint to use | string | [us](#us-endpoint) |  `us`   |

## Us Endpoint

`us` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |                              Description                              | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :-------------------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           | date |         | The date to query formatted by `[YEAR][MONTH][DAY]` (e.g. `20201012`) |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
