# Chainlink External Adapter for GraphQL

Version: 1.0.8

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [graphql](#graphql-endpoint) | `graphql` |

---

## Graphql Endpoint

`graphql` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | graphqlEndpoint |         |     The GraphQL endpoint to make a request to      | string |         |         |            |                |
|           |     headers     |         |                                                    |        |         |         |            |                |
|    ✅     |      query      |         |           The GraphQL query as a string            | string |         |         |            |                |
|           |    variables    |         | An object of variables to be passed into the query | object |         |         |            |                |

There are no examples for this endpoint.
