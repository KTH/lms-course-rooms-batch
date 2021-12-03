const { expect, describe, it } = require("@jest/globals");

const courseRoundsUtils = require("./courseRoundsUtils");

describe("isFarFuture", () => {
  const mockedDate = new Date("2021-02-01T00:00:01Z");
  beforeAll(() => {
    jest.useFakeTimers("modern").setSystemTime(mockedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("should return true if the course round starts in more then 6 months", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2021-09-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound);
    expect(result).toEqual(true);
  });

  it("should return false if the course round starts within 6 months", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2021-06-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound);
    expect(result).toEqual(false);
  });
  it("should return false if the course round has already started", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2019-06-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound);
    expect(result).toEqual(false);
  });
  // TODO: test multiple offeredSemesters
});
