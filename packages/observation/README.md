## Observation

### Motivation

The purpose of this tool is to provide developers a way to compare the values being returned from an EA deployed in staging vs production. This is useful
for soak tests where we want to ensure that any code refactors to an EA still behaves the same way as it does on production.

### Prerequisites

- The script hits Chainlink's internal deployments which are behind Chainlink's internal VPN. As a result you must be connected to the VPN prior to
  running the script.

### Instructions

1. Configure the EA in the `config.ts` file.

Example

```
export const config: Config = {
  outputFileName: 'anchor-bluna-ea.csv',
  adapterName: 'anchor',
  testDurationInSeconds: 12 * 3600,
  reqIntervalInSeconds: 30,
  request: {
    id: '1',
    data: {
      from: 'BLUNA',
      quote: 'USD',
    },
  },
}

```

2. Build package `yarn build`

3. Run script `yarn start`.

4. A csv file should be generated once the script finishes running. A snippet of the file is shown below. This CSV file can be exported to Excel or an online
   graphing application such as https://www.csvplot.com/ to compare the values returned by the EA in staging vs production.

```
round,staging,production,timestamp

0, 9470068052, 9470068052, 2022-03-24T09:46:14.940Z

1, 9470068052, 9470068052, 2022-03-24T09:46:46.555Z

2, 9468068038, 9468068038, 2022-03-24T09:47:18.122Z
```
