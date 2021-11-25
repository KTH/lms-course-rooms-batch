require("dotenv").config();
const { expect, test, describe } = require("@jest/globals");

const { _getCourseRoomData } = require("./index");

describe("getCourseRoundData", () => {
  it("should not throw", async () => {
    const {getCourseRoundDataResult }= require('./index.fixture')
    const { courseData } = await _getCourseRoomData(getCourseRoundDataResult);
    expect(courseData.length).toBe(2);
  });
});
