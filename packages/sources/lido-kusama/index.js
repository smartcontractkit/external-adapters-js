const { Validator, AdapterError } = require('@chainlink/external-adapter');
const { ethers } = require('ethers');
const {
    AGGREGATOR_PROXY,
    AGGREGATOR_PROXY_ABI,
    RATE_PROVIDER,
    RATE_PROVIDER_ABI,
    OUTPUT_DECIMALS,
    RPC_URL,
} = require('./constants');

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const proxy = new ethers.Contract(
    AGGREGATOR_PROXY,
    AGGREGATOR_PROXY_ABI,
    provider
);

const rateProvider = new ethers.Contract(
    RATE_PROVIDER,
    RATE_PROVIDER_ABI,
    provider
);

// Get KSM <-> stKSM rate
const getKsmStKsmRate = async () => {
    return await rateProvider.getVirtualPrice();
};

// Get KSM price in USD
const getKsmPriceUsd = async () => {
    return await proxy.latestRoundData();
};

// Get proxy decimals
const getProxyDecimals = async () => {
    return await proxy.decimals();
};

// Create a request
const createRequest = (input, callback) => {
    // The Validator helps you validate the Chainlink request data
    const validator = new Validator(callback, input);
    const jobRunID = validator.validated.id;

    Promise.all([getKsmStKsmRate(), getKsmPriceUsd(), getProxyDecimals()])
    .then(values => {
        const ksmStKsmRate = values[0].div(ethers.utils.parseUnits('1', 10));
        const ksmPriceUsd = values[1].answer;
        const proxyDecimals = values[2];

        const data = {
            STKSM: ksmPriceUsd.mul(ethers.utils.parseUnits('1', 8)).div(ksmStKsmRate)
            .mul(ethers.utils.parseUnits('1', OUTPUT_DECIMALS))
            .div(ethers.utils.parseUnits('1', proxyDecimals))
            .toNumber()
        };

        callback(200, {
            jobRunID,
            data,
            result: data.STKSM,
            statusCode: 200
        });
    })
    .catch(error => {
        callback(500, {
            jobRunID,
            status: 'errored',
            error: new AdapterError(error),
            statusCode: 500
        });
    });
};

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest;
