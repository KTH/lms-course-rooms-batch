require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { _getCourseRoomData } = require("./index");

describe("getCourseRoundData", () => {
  it("should filter course rounds to include only those starting in the past or the near future", async () => {
    const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
    jest.useFakeTimers('modern').setSystemTime(mockedDate)
    
    const { courseData, sectionsData } = await _getCourseRoomData(getCourseRoundDataResult);
    expect(courseData.length).toBe(1);
    expect(sectionsData.length).toBe(1);

    expect(courseData[0].course_id).toMatch(/F1A5033/) 
    expect(sectionsData[0].course_id).toMatch(/F1A5033/) 

  });
});
