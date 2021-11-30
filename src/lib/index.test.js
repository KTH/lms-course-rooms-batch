require("dotenv").config();
const { expect, test, describe, beforeAll, afterAll } = require("@jest/globals");

const { getCourseRoundDataResult} = require("./index.fixture");
const { filterFutureRounds, filterNearFutureRounds} = require("./index");

beforeAll(()=>{
    const { mockedDate } = require("./index.fixture");
    jest.useFakeTimers("modern").setSystemTime(mockedDate);
})

afterAll(()=>{
  jest.useRealTimers()
})

describe("filterFutureRounds", () => {
  it("should only include rounds starting in the future, but no longer then 6 months ahead", async () => {

    const futureRounds = await filterFutureRounds(getCourseRoundDataResult);
    expect(futureRounds.length).toBe(2);
    expect(futureRounds[0].courseCode).toMatch(/F1A5032/);
    expect(futureRounds[1].courseCode).toMatch(/F1A5033/);
  });
});
describe("filterNearFutureRounds", ()=>{
  it("should...", async ()=>{
    const nearFutureRounds = await filterNearFutureRounds(getCourseRoundDataResult);
    expect(nearFutureRounds.length).toBe(1)
    expect(nearFutureRounds[0].courseCode).toMatch('F1A5032')
  })
})
