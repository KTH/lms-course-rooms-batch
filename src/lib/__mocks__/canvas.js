/* eslint-disable no-use-before-define */
module.exports = {
  getAntagna(sisId) {
    if (!fixtures[sisId]) {
      throw new Error(`Nothing available for sis id ${sisId}`);
    }

    return fixtures[sisId];
  },
};

const fixtures = {
  F1A5032HT201: ["uantagna1", "uantagna2"],
  F1A5033HT201: ["uantagna1", "uantagna3"],
};
