require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { _getCourseRoomData } = require("./index");

describe("getCourseRoundData", () => {
  it("should filter out course rounds that starts in the far future", async () => {
    const {getCourseRoundDataResult, mockedDate }= require('./index.fixture')
    jest.useFakeTimers('modern').setSystemTime(mockedDate)
    
    const { courseData} = await _getCourseRoomData(getCourseRoundDataResult);
    console.log(courseData)
    expect(courseData.length).toBe(1);
    expect(courseData[0].courseCode).toEqual('F1A5033')

  });

  it.skip("should return section objects for each round", async () => {
    const {getCourseRoundDataResult }= require('./index.fixture')

    const { sectionsData } = await _getCourseRoomData(getCourseRoundDataResult);
    expect(sectionsData.length).toBe(2);

    // TODO: enrollmentsData
  });
});
