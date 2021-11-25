require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { _getCourseRoomData } = require("./index");

describe("getCourseRoundData", () => {
  it("should return course objects for each round", async () => {
    const {getCourseRoundDataResult }= require('./index.fixture')

    const { courseData} = await _getCourseRoomData(getCourseRoundDataResult);
    expect(courseData.length).toBe(2);

    // TODO: enrollmentsData
  });
it("should return section objects for each round", async () => {
    const {getCourseRoundDataResult }= require('./index.fixture')

    const { sectionsData } = await _getCourseRoomData(getCourseRoundDataResult);
    expect(sectionsData.length).toBe(2);

    // TODO: enrollmentsData
  });
});
