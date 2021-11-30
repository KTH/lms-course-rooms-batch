require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { filterFutureRounds } = require("./index");

describe("filterFutureRounds", () => {
  it("should only include rounds starting in 6 months or sooner", async () => {
    const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
    jest.useFakeTimers('modern').setSystemTime(mockedDate)

    const futureRounds = await filterFutureRounds(getCourseRoundDataResult);
    expect(futureRounds.length).toBe(1);

    expect(futureRounds[0].courseCode).toMatch(/F1A5033/) 
  });

  // // it.skip("...", async () => {
  //   const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
  //   jest.useFakeTimers('modern').setSystemTime(mockedDate)

  //   const  futureRounds = await filterFutureRounds(getCourseRoundDataResult);
  //   expect(.length).toBe(1);

  //   expect(PAST_AND_FUTURE_ROUNDS[0].courseCode).toMatch(/F1A5033/) 
  // });
});
