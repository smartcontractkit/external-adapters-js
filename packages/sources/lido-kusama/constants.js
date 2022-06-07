const RPC_URL = process.env.RPC_URL || 'https://rpc.moonriver.moonbeam.network';

const AGGREGATOR_PROXY = '0x6e0513145FCE707Cd743528DB7C1cAB537DE9d1B';
const RATE_PROVIDER = '0x77D4b212770A7cA26ee70b1E0f27fC36da191c53';

const OUTPUT_DECIMALS = 8;

const AGGREGATOR_PROXY_ABI = [
    {
        'inputs': [],
        'name': 'decimals',
        'outputs': [
            {
                'internalType': 'uint8',
                'name': '',
                'type': 'uint8'
            }
        ],
        'stateMutability': 'view',
        'type': 'function'
    },
    {
        'inputs': [],
        'name': 'latestRoundData',
        'outputs': [
            {
                'internalType': 'uint80',
                'name': 'roundId',
                'type': 'uint80'
            },
            {
                'internalType': 'int256',
                'name': 'answer',
                'type': 'int256'
            },
            {
                'internalType': 'uint256',
                'name': 'startedAt',
                'type': 'uint256'
            },
            {
                'internalType': 'uint256',
                'name': 'updatedAt',
                'type': 'uint256'
            },
            {
                'internalType': 'uint80',
                'name': 'answeredInRound',
                'type': 'uint80'
            }
        ],
        'stateMutability': 'view',
        'type': 'function'
    }
];

const RATE_PROVIDER_ABI = [
    {
        'inputs': [],
        'name': 'getVirtualPrice',
        'outputs': [
            {
                'internalType': 'uint256',
                'name': '',
                'type': 'uint256'
            }
        ],
        'stateMutability': 'view',
        'type': 'function'
    }
];

module.exports = {
    AGGREGATOR_PROXY,
    AGGREGATOR_PROXY_ABI,
    RATE_PROVIDER,
    RATE_PROVIDER_ABI,
    OUTPUT_DECIMALS,
    RPC_URL
};
