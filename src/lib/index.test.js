require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { groupCourseRoundsByStartdate } = require("./index");

describe("groupCourseRoundsByStartdate", () => {
  it("PAST_AND_FUTURE_ROUNDS should only include rounds starting in 6 months or sooner", async () => {
    const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
    jest.useFakeTimers('modern').setSystemTime(mockedDate)
    
    const  {PAST_AND_FUTURE_ROUNDS}= await groupCourseRoundsByStartdate(getCourseRoundDataResult);
    expect(PAST_AND_FUTURE_ROUNDS.length).toBe(1);

    expect(PAST_AND_FUTURE_ROUNDS[0].courseCode).toMatch(/F1A5033/) 
  });
});
