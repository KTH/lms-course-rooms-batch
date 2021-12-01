require("dotenv").config();
const { expect, test, describe, beforeAll, afterAll } = require("@jest/globals");

const { getCourseRoundDataResult} = require("./index.fixture");
const { removeRoundsInTheFarFuture, filterNewlyStartedOrFutureRounds, filterPastRounds} = require("./index");

beforeAll(()=>{
    const { mockedDate } = require("./index.fixture");
    jest.useFakeTimers("modern").setSystemTime(mockedDate);
})

afterAll(()=>{
  jest.useRealTimers()
})

describe("removeRoundsInTheFarFuture", () => {
  it("should include all past and future rounds, except those starting in more then 6 months", async () => {
    const futureRounds = await removeRoundsInTheFarFuture(getCourseRoundDataResult);
    const courseCodes = futureRounds.map(r => r.courseCode)

    expect(futureRounds.length).toBe(3);
    expect(courseCodes).toContain('F1A5031')
    expect(courseCodes).toContain('F1A5032')
    expect(courseCodes).toContain('F1A5033')
  });
});
describe("filterNewlyStartedOrFutureRounds", ()=>{
  it("should include rounds started in the last 3 days, or starting in the future, but not those starting in more then 6 months", async ()=>{
    const rounds = await filterNewlyStartedOrFutureRounds(getCourseRoundDataResult);
    const courseCodes = rounds.map(r => r.courseCode)
    expect(courseCodes).toContain('F1A5032')
    expect(courseCodes).toContain('F1A5033')
    expect(rounds.length).toBe(2)
  })
})
describe.skip("filterPastRounds", ()=>{
  it("should include rounds started more then 3 days ago", async ()=>{
    const nearFutureRounds = await filterPastRounds(getCourseRoundDataResult);
    expect(nearFutureRounds.length).toBe(1)
    expect(nearFutureRounds[0].courseCode).toMatch('F1A5031')
  })
})
