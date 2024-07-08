const { randomUUID, createPrivateKey } = require("crypto");
const { promisify } = require("util");
const jsonwebtoken = require("jsonwebtoken");
const axios = require("axios");

const TOPPER_API_URL = "https://api.sandbox.topperpay.com";
const TOPPER_CHECKOUT_URL = "https://app.sandbox.topperpay.com";

const getTopperPayload = ({ account, amountToSpend, fiatCurrency }) => {
  return {
    jti: randomUUID(),
    sub: process.env.FIAT_ON_RAMP_TOPPER_WIDGET_ID,
    source: {
      amount: amountToSpend.toFixed(2),
      asset: fiatCurrency,
    },
    target: {
      address: account,
      asset: "ETH",
      network: "ethereum",
      label: "Ecko Wallet - Buy Crypto",
    },
  };
};

const getTopperBootstrapToken = async ({
  account,
  amountToSpend,
  fiatCurrency,
}) => {
  const payload = getTopperPayload({ account, amountToSpend, fiatCurrency });
  const privateKeyJwk = JSON.parse(
    atob(process.env.FIAT_ON_RAMP_TOPPER_BASE64_PRIVATE_KEY)
  );
  const sign = promisify(jsonwebtoken.sign);
  const privateKey = createPrivateKey({
    format: "jwk",
    key: privateKeyJwk,
  });
  const options = {
    algorithm: "ES256",
    keyid: process.env.FIAT_ON_RAMP_TOPPER_KEY_ID,
  };
  return await sign(payload, privateKey, options);
};

const getTopperQuote = async ({ account, amountToSpend, fiatCurrency }) => {
  const bootstrapToken = await getTopperBootstrapToken({
    account,
    amountToSpend,
    fiatCurrency,
  });
  let config = {
    method: "post",
    url: `${TOPPER_API_URL}/simulations`,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    data: JSON.stringify({ bootstrapToken }),
  };
  try {
    const response = await axios.request(config);
    const freshBootstrapToken = await getTopperBootstrapToken({
      account,
      amountToSpend,
      fiatCurrency,
    });
    return {
      data: response.data,
      bootstrapToken: freshBootstrapToken,
      checkoutUrl: `${TOPPER_CHECKOUT_URL}?bt=${freshBootstrapToken}`,
    };
  } catch (error) {
    return { error: error.response.data };
  }
};

module.exports = { getTopperQuote };
