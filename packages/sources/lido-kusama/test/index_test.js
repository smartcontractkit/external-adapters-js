const assert = require('chai').assert;
const createRequest = require('../index.js').createRequest;

describe('createRequest', () => {
    const jobID = '1';

    context('successful calls', () => {
        it('request STKSM price', () => {
            createRequest({}, (statusCode, data) => {
                assert.equal(statusCode, 200);
                assert.equal(data.jobRunID, jobID);
                assert.isNotEmpty(data.data);
                assert.isAbove(Number(data.result), 0);
            });
        });
    });
});
