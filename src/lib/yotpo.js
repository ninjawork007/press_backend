const moment = require('moment');

async function authenticate () {
  const axios = require('axios').default;

const options = {
  method: 'POST',
  url: 'https://api.yotpo.com/oauth/token',
  headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
    data: {
      client_id: process.env.YOTPO_API_KEY,
      client_secret: process.env.YOTPO_SECRET_KEY,
      grant_type: 'client_credentials'
    }
};

return axios
  .request(options)
  .then(function (response) {
    console.log(response.data);
    return response.data.access_token
  })
  .catch(function (error) {
    console.error(error);
    return null
  });
}

async function sendOrder ({order, products, profile}) {
  let utoken = await authenticate()
    const axios = require('axios').default;

const options = {
  method: 'POST',
  url: `https://api.yotpo.com/apps/${process.env.YOTPO_API_KEY}/purchases/`,
  headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
  data: {
    products,
    // customer: {
    //   custom_properties: [{name: 'membership_type', value: 'Annual'}],
    //   state: 'Boston',
    //   country: 'US',
    //   address: '5th Av.'
    // },
    // custom_properties: [{name: 'order_history', value: '5'}],
    email: order.email,
    customer_name: profile.name,
    order_id: order.id,
    platform: 'general',
    order_date: moment().format('YYYY-MM-DD'),
    utoken,
    app_key: process.env.YOTPO_API_KEY,
  }
};

axios
  .request(options)
  .then(function (response) {
    // console.log(response.data);
    console.log("send order to yotpo")
    return response
  })
  .catch(function (error) {
    console.log("Error sending order to Yotpo");
    console.error(error);

    console.error(error.response.data.errors);
  });
}

async function sendV3Order ({order, line_items}) {
  let utoken = await authenticate()
    const axios = require('axios').default;

    const options = {
      method: 'POST',
      url: `https://api.yotpo.com/core/v3/stores/${YOTPO_API_KEY}/orders`,
      headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
      data: {
        order: {
          external_id: 'sk34m',
          order_date: moment(),
          customer: {
            external_id: order.profile,
            email: order.email,
            // phone_number: '+14155552671',
            // first_name: 'Tom',
            // last_name: 'Smith',
            // accepts_sms_marketing: true,
            accepts_email_marketing: true
          },
          // billing_address: {
          //   address1: '96 Coffee Street',
          //   address2: '',
          //   city: 'Hudson',
          //   company: 'null',
          //   state: 'New York',
          //   zip: '13420',
          //   province_code: 'NY',
          //   country_code: 'US',
          //   phone_number: '+5556251199'
          // },
          // shipping_address: {
          //   address1: '96 Coffee Street',
          //   address2: '',
          //   city: 'Hudson',
          //   company: 'null',
          //   state: 'New York',
          //   zip: '13420',
          //   province_code: 'NY',
          //   country_code: 'US',
          //   phone_number: '+5556251199'
          // },
          // custom_properties: {key: 'value', key2: 'value2'},
          line_items
        }
      }
    };

// const options = {
//   method: 'POST',
//   url: `https://api.yotpo.com/apps/${process.env.YOTPO_API_KEY}/purchases/`,
//   headers: {Accept: 'application/json', 'Content-Type': 'application/json'},
//   data: {
//     products,
//     // customer: {
//     //   custom_properties: [{name: 'membership_type', value: 'Annual'}],
//     //   state: 'Boston',
//     //   country: 'US',
//     //   address: '5th Av.'
//     // },
//     // custom_properties: [{name: 'order_history', value: '5'}],
//     email: order.email,
//     customer_name: order.email,
//     order_id: order.id,
//     platform: 'general',
//     order_date: moment().format('YYYY-MM-DD'),
//     utoken,
//     app_key: process.env.YOTPO_API_KEY,
//   }
// };

axios
  .request(options)
  .then(function (response) {
    // console.log(response.data);
    console.log("sent order to yotpo")
    return response
  })
  .catch(function (error) {
    console.log("Error sending order to Yotpo");
    console.error(error);

    console.error(error.response.data.errors);
  });
}


module.exports = {
    sendOrder,
    sendV3Order
  }

