require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { getCourseRoomData } = require("./index");

describe("getCourseRoundData", () => {
  it("should filter course rounds to include only those starting in the past or the near future", async () => {
    const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
    jest.useFakeTimers('modern').setSystemTime(mockedDate)
    
    const  coursesData = await getCourseRoomData(getCourseRoundDataResult);
    expect(coursesData.length).toBe(1);

    expect(coursesData[0].courseCode).toMatch(/F1A5033/) 
  });
});
