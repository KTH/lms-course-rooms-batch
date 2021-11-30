require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { filterFutureRounds } = require("./index");

describe("filterFutureRounds", () => {
  it("should only include rounds starting in the future, but no longer then 6 months ahead", async () => {
    const { getCourseRoundDataResult, mockedDate } = require("./index.fixture");
    jest.useFakeTimers("modern").setSystemTime(mockedDate);

    const futureRounds = await filterFutureRounds(getCourseRoundDataResult);
    expect(futureRounds.length).toBe(2);
    expect(futureRounds[0].courseCode).toMatch(/F1A5032/);
    expect(futureRounds[1].courseCode).toMatch(/F1A5033/);
  });
});
describe("filterNearFutureRounds", ()=>{
  it("should...", ()=>{

  })
})
