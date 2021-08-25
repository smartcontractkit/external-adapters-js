import nock from "nock"

export function mockTiingoResponse() {
    nock("http://localhost:3000")
    .post("/", {"id":"1","data":{"base":"LINK","quote":"USD","endpoint":"price"}})
    .reply(
        200,
        {
            "jobRunID": "1",
            "data": {
              "sources": [],
              "payload": {
                "WETH": {
                  "quote": {
                    "USD": {
                      "price": "1800"
                    }
                  }
                },
                "LINK": {
                    "quote": {
                      "USD": {
                        "price": "2000"
                      }
                    }
                }
              },
              "result": 2000
            },
            "result": 2000,
            "statusCode": 200
        }
    )

    nock("http://localhost:3000")
    .post("/", {"id":"1","data":{"base":"WETH","quote":"USD","endpoint":"price"}})
    .reply(
        200,
        {
            "jobRunID": "1",
            "data": {
              "sources": [],
              "payload": {
                "WETH": {
                  "quote": {
                    "USD": {
                      "price": "1800"
                    }
                  }
                },
                "LINK": {
                    "quote": {
                      "USD": {
                        "price": "2000"
                      }
                    }
                }
              },
              "result": 2000
            },
            "result": 2000,
            "statusCode": 200
        }
    )
}