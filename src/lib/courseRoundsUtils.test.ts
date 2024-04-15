import { expect, describe, it } from "@jest/globals";

import * as courseRoundsUtils from "./courseRoundsUtils";
import { KoppsRound } from "./kopps";

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
    const result = courseRoundsUtils.shouldHaveAntagna(
      courseRound as KoppsRound
    );
    expect(result).toEqual(true);
  });

  it("should NOT have antagna if the course started four days ago", () => {
    const courseRound = {
      firstYearsemester: "20211",
      offeredSemesters: [
        { semester: "20211", startDate: "2021-01-28", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.shouldHaveAntagna(
      courseRound as KoppsRound
    );
    expect(result).toEqual(false);
  });

  it("should have antagna if the course started two days ago", () => {
    const courseRound = {
      firstYearsemester: "20211",
      offeredSemesters: [
        { semester: "20211", startDate: "2021-01-31", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.shouldHaveAntagna(
      courseRound as KoppsRound
    );
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

  it("should return true if the course round starts in more than apx 9 months", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2021-10-30", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound as KoppsRound);
    expect(result).toEqual(true);
  });

  it("should return false if the course round starts in less than apx 9 months", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2021-09-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound as KoppsRound);
    expect(result).toEqual(false);
  });

  it("should return false if the course round has already started", () => {
    const courseRound = {
      firstYearsemester: "20202",
      offeredSemesters: [
        { semester: "20202", startDate: "2019-06-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound as KoppsRound);
    expect(result).toEqual(false);
  });

  it("should pick the right startDate in 'offeredSemesters' array", () => {
    const courseRound = {
      firstYearsemester: "20201",
      offeredSemesters: [
        { semester: "20222", startDate: "2022-19-01", endDate: "2022-10-23" },
        { semester: "20201", startDate: "2020-01-01", endDate: "2022-10-23" },
      ],
    };
    const result = courseRoundsUtils.isFarFuture(courseRound as KoppsRound);
    expect(result).toEqual(false);
  });
});

describe("createTerms", () => {
  it("Should create a term object", () => {
    const fakeRound = {
      firstYearsemester: "20231",
    };
    const result = courseRoundsUtils.createTerms(fakeRound as KoppsRound);
    expect(result.name).toEqual("VT 2023");
  });
});
