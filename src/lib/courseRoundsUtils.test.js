const { expect, describe, it } = require("@jest/globals");

const courseRoundsUtils = require("./courseRoundsUtils");

describe("shouldHaveAntagna", () => {
  const mockedDate = new Date("2021-02-01T00:00:01Z");
  beforeAll(() => {
    jest.useFakeTimers("modern").setSystemTime(mockedDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });


  it("should have antagna if the course starts in the future", () => {
    
    const courseRound = {
      firstYearsemester: "20211",
      offeredSemesters: [
        { semester: "20211", startDate: "2021-06-28", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.shouldHaveAntagna(courseRound);
    expect(result).toEqual(true);
  }); 

  it("should NOT have antagna if the course started four days ago", () => {
    const courseRound = {
      firstYearsemester: "20211",
      offeredSemesters: [
        { semester: "20211", startDate: "2021-01-28", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.shouldHaveAntagna(courseRound);
    expect(result).toEqual(false);
  }); 

  it("should have antagna if the course started two days ago", () => {
    const courseRound = {
      firstYearsemester: "20211",
      offeredSemesters: [
        { semester: "20211", startDate: "2021-01-31", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.shouldHaveAntagna(courseRound);
    expect(result).toEqual(true);
  }); 
});
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
 it("should return false even if the first semester in the array is in the far future", () => {
    const courseRound = {
      firstYearsemester: "20201",
      offeredSemesters: [
        { semester: "20222", startDate: "2022-06-01", endDate: "2022-10-23" },
        { semester: "20201", startDate: "2020-01-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound);
    expect(result).toEqual(false);
  }); 
});
