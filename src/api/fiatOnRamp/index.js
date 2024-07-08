const { providers } = require("./providers");

const getQuote = async (body) => {
  const { account, fiatCurrency, amountToSpend, cryptoToBuy, provider } = body;
  if (!account || !fiatCurrency || !amountToSpend || !provider) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error:
          "Please define params: account, fiatCurrency, amountToSpend, cryptoToBuy, provider",
      }),
    };
  }
  if (!providers[provider]) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: "Invalid provider",
      }),
    };
  }
  const result = await providers.topper.getQuote({
    account,
    fiatCurrency,
    amountToSpend,
  });
  if (result.error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: result.error ?? "Failed to get quote",
      }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({
      account,
      fiatCurrency,
      fiatBaseAmount: result.data.simulation.origin.amount,
      cryptoCurrency: cryptoToBuy,
      cryptoAmount: result.data.simulation.destination.amount,
      bootstrapToken: result.bootstrapToken,
      checkoutUrl: result.checkoutUrl,
    }),
  };
};

module.exports = { getQuote };
