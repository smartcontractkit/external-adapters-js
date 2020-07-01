const pizzapi = require('pizzapi');
const { Requester, Validator } = require('@chainlink/external-adapter')

const customParams = {
  address: '',
  firstName: '',
  lastName: '',
  email: ''
}

const createRequest = (input, callback) => {
  const validator = new Validator(callback, input, customParams);
  const params = validator.validated;
  const jobRunID = params.id
  try {
    const address = new pizzapi.Address('' + params.address);
    const customer = new pizzapi.Customer({
      firstName: params.firstName,
      lastName: params.lastName,
      address: params.address,
      email: params.email,
    })
    pizzapi.Util.findNearbyStores(
      address,
      'Delivery',
      function(store) {
        const order = new pizzapi.Order({
          customer,
          storeID: store.ID,
          deliveryMethod: 'Delivery',
        });
        order.addItem(
          new pizzapi.Item(
            {
              code: '14SCREEN',
              options: [],
              quantity: 1
            }
          )
        );
        order.validate(function(result) {
          console.log('Order is valid', result);

          order.place(function(result) {
            console.log('Order placed', result);
            return callback('200', Requester.success(jobRunID, {'data': {}}));
          });
        });
      }
    );
  } catch(error) {
    console.log("error", error);
    return callback(500, Requester.errored(jobRunID, error));
  }
}

module.exports.createRequest = createRequest
