const axios = require('axios');

const CONTENTSTACK_API_KEY = process.env.CONTENTSTACK_API_KEY;
const CONTENTSTACK_DELIVERY_TOKEN = process.env.CONTENTSTACK_DELIVERY_TOKEN;
const CONTENTSTACK_MANAGEMENT_TOKEN = process.env.CONTENTSTACK_MANAGEMENT_TOKEN;

const CONTENTSTACK_AUTOMATIONS_API_KEY = process.env.CONTENTSTACK_AUTOMATIONS_API_KEY;
// const CONTENTSTACK_AUTOMATIONS_UID = process.env.CONTENTSTACK_AUTOMATIONS_UID;

const CONTENTSTACK_API_HOST = 'https://api.contentstack.io';
const CONTENTSTACK_APP_HOST = 'https://app.contentstack.com';

const AUTOMATION = 'automations-api';
const V3 = 'v3';

const requestHandlers = {
  GET: proxyGET,
  PUT: proxyPUT,
  POST: proxyPOST,
};

exports.handler = async function (event, context) {
  console.log('request: ' + JSON.stringify(event));

  let httpMethod = event['httpMethod'];

  if (httpMethod in requestHandlers) {
    return requestHandlers[httpMethod](event);
  }

  return response(405, {
    message: `Invalid HTTP Method: ${httpMethod}`,
  });
};

// GET
async function proxyGET(event) {
  const url = constructProxyUrl(event);
  console.log('url', url);

  let result = {};

  try {
    result = await axios.get(url, {
      headers: {
        method: 'GET',
        access_token: `${CONTENTSTACK_DELIVERY_TOKEN}`,
        api_key: `${CONTENTSTACK_API_KEY}`,
        Host: 'api.contentstack.io',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
  } catch (error) {
    return response(400, { errorStatus: error.status, errorMessage: error?.message });
  }

  console.log('from api : ', JSON.stringify(result.data));
  return response(200, result.data);
}

// POSTs
async function proxyPOST(event) {
  const url = constructProxyUrl(event);
  const headers = constructHeaders(event);
  const body =
    event.path === '/assets' ? Buffer.from(event.body, 'base64') : JSON.parse(event?.body);

  // console.log('POST url', url);
  // console.log('POST headers', JSON.stringify(headers));
  // console.log('POST body', event?.body);

  let result = {};

  try {
    result = await axios.post(url, body, {
      headers: headers,
      // transformRequest: (formData) => formData,
    });
  } catch (error) {
    return response(500, { errorStatus: error.status, errorMessage: error?.message });
  }

  // console.log('from api : ', JSON.stringify(result.data));
  return response(200, result.data);
}

// PUTs
async function proxyPUT(event) {
  const url = constructProxyUrl(event);
  const headers = constructHeaders(event);

  console.log('PUT url', url);
  // console.log('POST body', event?.body);

  let result = {};

  try {
    result = await axios.put(url, JSON.parse(event.body || {}), {
      headers: headers,
    });
  } catch (error) {
    // console.log('error put: ', JSON.stringify(error));
    return response(400, { errorStatus: error.status, errorMessage: error?.message });
  }

  console.log('from api : ', JSON.stringify(result.data));
  return response(200, result.data);
}

// response template

function response(status, data) {
  return {
    isBase64Encoded: false,
    statusCode: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Origin': '*',
      'X-Requested-With': '*',
    },
    body: JSON.stringify(data),
  };
}

const parseQueryParams = (event) => {
  if (
    currentStage(event) === AUTOMATION ||
    event['httpMethod'] === 'POST' ||
    event['httpMethod'] === 'PUT'
  )
    return '';

  return Object.keys(event.queryStringParameters)
    .map(
      (el) =>
        // console.log("element", el)
        `${el}=${event.queryStringParameters[el]}`,
    )
    .join('&');
};

const constructProxyUrl = (event) => {
  const query = parseQueryParams(event);
  const stage = currentStage(event);
  console.log('constructProxyUrl stage: ', stage);

  // it's app call
  // `https://${APP}/automations-api/run/${automation_uid}`,
  if (stage !== V3) return `${CONTENTSTACK_APP_HOST}/automations-api${event.path}`;

  // 1. it's api call
  // `https://${API}/v3/content_types/${content_type_uid}/entries/${entry_uid}`
  return `${CONTENTSTACK_API_HOST}/v3${event.path}?${query}`;
};

const currentStage = (event) => {
  return event?.requestContext?.stage || V3;
};

const constructHeaders = (event) => {
  const additional = event.path === '/assets' ? event.headers : {};
  return {
    ...additional,
    ...constructAuthHeaders(event),
    // method: event['httpMethod'],
    // 'Content-Type': event.path === '/assets' ? 'multipart/form-data' : 'application/json', // event.headers['content-type']
    Host:
      event?.requestContext?.stage === AUTOMATION ? 'app.contentstack.com' : 'api.contentstack.io',
    'Accept-Encoding': 'gzip, deflate, br',
    Accept: '*/*',
  };
};

const constructAuthHeaders = (event) => {
  let auth = {
    access_token: `${CONTENTSTACK_DELIVERY_TOKEN}`,
    api_key: `${CONTENTSTACK_API_KEY}`,
  };

  const method = event['httpMethod'];

  if (method === 'POST' && currentStage(event) !== V3)
    return { 'ah-http-key': `${CONTENTSTACK_AUTOMATIONS_API_KEY}` };

  if (method === 'PUT' || method === 'POST' || event.path === '/assets')
    return { ...auth, authorization: `${CONTENTSTACK_MANAGEMENT_TOKEN}` };

  return auth;
};
