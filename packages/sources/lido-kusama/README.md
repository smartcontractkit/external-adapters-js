# lido-dot-ksm-stksm-chainlink-adapter
stKSM is a liquid staking token for **Kusama** chain. This adapter calculates stKSM price in USD using on-chain data: [KSM <-> USD](https://moonriver.moonscan.io/address/0x6e0513145fce707cd743528db7c1cab537de9d1b) and [stKSM <-> KSM](https://moonriver.moonscan.io/address/0x77d4b212770a7ca26ee70b1e0f27fc36da191c53) rates.

<br/>For more details about the Lido On Kusama project, check the following links:
- [Lido On Kusama Dapp](https://kusama.lido.fi/)<br/>
- [Project Repo](https://github.com/mixbytes/lido-dot-ksm)<br/>
- [Documentation](https://docs.kusama.lido.fi/)<br/>

## Install Locally

Install dependencies:

```bash
npm install
```

### Env Vars
export **RPC_URL** var:

```
export RPC_URL=https://rpc.moonriver.moonbeam.network
```

export **PORT** var:

```
export PORT=8080
```

### Test

Run the local tests:

```bash
npm test
```

Natively run the application (defaults to port 8080):

### Run

```bash
npm start
```

```json
{
  "jobRunID": "1",
  "data": {
    "STKSM": 6500000000,
  },
  "result": 6500000000,
  "statusCode": 200
}
```

## Call the external adapter/API server

```bash
curl -X GET -H "content-type:application/json" "http://localhost:8080/"
```

## Docker

If you wish to use Docker to run the adapter, you can build the image by running the following command:

```bash
docker build --tag chainlink-adapter:latest .
```

Then run it with:

```bash
docker run -p 8080:8080 chainlink-adapter:latest
```
