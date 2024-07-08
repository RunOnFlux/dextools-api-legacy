const { getTopperQuote } = require("./topper");

const providers = {
  simplex: {
    getQuote: async (body) => {
      const { account, fiatCurrency, amountToSpend, cryptoToBuy, provider } =
        body;
    },
    checkout: (body) => {
      const { payment, provider } = body;
    },
    refresh: (body) => {},
  },
  topper: {
    getQuote: getTopperQuote,
    checkout: (body) => {
      const { payment, provider } = body;
    },
    refresh: (body) => {},
  },
};

module.exports = { providers };
