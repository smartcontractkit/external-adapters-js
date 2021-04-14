# Chainlink External Adapter for BookMaker Ratings

### Environment Variables

| Required? |     Name      |                              Description                               | Options | Defaults to |
| :-------: | :-----------: | :--------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | AUTH_USERNAME | An authentication username that can be obtained from the data provider |         |             |
|    ✅     | AUTH_PASSWORD | An authentication password that can be obtained from the data provider |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |             Options              | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [game-odds](#Game-Odds-Endpoint) |  game-odds  |

---

## Game Odds Endpoint

Gets the odds on the outcomes for the selected game (returns [home odds, away odds])

### Input Params

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|    ✅     | `gameIds` | The game ID to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "gameIds": "1589487"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "odds": [
      [
        1589487,
        null,
        null,
        {
          "1533336033": [9, 180, 1, 1, 0, { "1": [1.236] }, "0", 1],
          "1533336034": [9, 181, 1, 1, 0, { "1": [4.105] }, "0", 1]
        },
        null,
        [],
        [],
        [],
        0
      ]
    ],
    "externalRbIds": {
      "1": 513072,
      "2": 510742,
      "3": 510821,
      "4": 726203,
      "5": 666278,
      "6": null,
      "7": 890119,
      "8": 1026500,
      "9": null,
      "10": 309556,
      "11": 309559,
      "12": 309546,
      "13": 1083548,
      "14": null,
      "15": null,
      "16": 460086,
      "17": 738474,
      "18": 309562,
      "19": 309795,
      "20": 1176540,
      "21": 956512,
      "22": 751562,
      "23": 309680,
      "24": 542539,
      "25": 309627,
      "26": null,
      "27": null,
      "28": null,
      "29": null,
      "31": 816504,
      "32": 309519,
      "33": null,
      "34": null,
      "35": 1774637,
      "36": null,
      "37": null
    },
    "version": 1618441288,
    "result": [1.236, 4.105]
  },
  "result": [1.236, 4.105],
  "statusCode": 200
}
```
