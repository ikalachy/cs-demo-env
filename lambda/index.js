const axios = require("axios");

// const OPENAI = process.env.AWS_REGION;
// const CONTENTSTACK_ENVIRONMENT = process.env.CONTENTSTACK_ENVIRONMENT;
const CONTENTSTACK_API_KEY = process.env.CONTENTSTACK_API_KEY;
const CONTENTSTACK_DELIVERY_TOKEN = process.env.CONTENTSTACK_DELIVERY_TOKEN;
const CONTENTSTACK_API_HOST = "https://api.contentstack.io";

exports.handler = async (event) => {
  console.log("request: " + JSON.stringify(event));
  //   console.log("token: " + CONTENTSTACK_DELIVERY_TOKEN);
  //   console.log("key: " + CONTENTSTACK_API_KEY);

  // const url = `${CONTENTSTACK_API_HOST}/v3/${event.rawPath}?${event?.rawQueryString}`;

  const query = Object.keys(event.queryStringParameters)
    .map(
      (el) =>
        // console.log("element", el)
        `${el}=${event.queryStringParameters[el]}`
    )
    .join("&");

  const url = `${CONTENTSTACK_API_HOST}/v3${event.path}?${query}`;

  console.log("url", url);
  let result = {};
  try {
    result = await axios.get(url, {
      headers: {
        method: "GET",
        access_token: `${CONTENTSTACK_DELIVERY_TOKEN}`,
        api_key: `${CONTENTSTACK_API_KEY}`,
        Host: "api.contentstack.io",
        "Accept-Encoding": "gzip, deflate, br"
      }
    });
  } catch (error) {
    return {
      isBase64Encoded: false,
      statusCode: error.status,
      headers: {
        "access-control-allow-headers": "*",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "*"
      },
      body: JSON.stringify(error)
    };
  }

  return {
    isBase64Encoded: false,
    statusCode: 200,
    headers: {
      "access-control-allow-headers": "*",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "*"
    },
    body: JSON.stringify(result.data)
  };
};
