const { expect, test, describe } = require("@jest/globals");

const {_getCourseRoundData} = require("./index");

describe("getCourseRoundData", () => {
  it('should not throw',async ()=>{
   await _getCourseRoundData()
  })
});
