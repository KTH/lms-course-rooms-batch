const { expect, test } = require("@jest/globals");

const utils = require("./utils");

test("should choose the latest date", () => {
  const courseRound = {
    offeredSemesters: [
      {
        semester: "20211",
        endDate: "2021-06-08",
      },
      {
        semester: "20212",
        endDate: "2021-12-10",
      },
      {
        semester: "20202",
        endDate: "2020-12-31",
      },
    ],
  };
  const endDate = utils.createEndDate(courseRound, 10);
  expect(endDate).toBe("2021-12-20");
});
