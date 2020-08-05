const openwhiskCallback = (resolve) => (statusCode, data) => {
    resolve({
        statusCode,
        body: JSON.stringify(data),
        isBase64Encoded: false
    })
}
const openwhiskWrap = (createRequest) => async (params) => {
    return new Promise((resolve) => {
        createRequest(params, openwhiskCallback(resolve))
    })
}

module.exports = {
    openwhiskCallback,
    openwhiskWrap
}