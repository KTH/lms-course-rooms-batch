/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { expect, test } from "@jest/globals";
import { KoppsRound } from "./kopps";

import * as utils from "./utils";

test("Canvas shortName should include kopps shortName but not activityCode", () => {
  const round = {
    courseCode: "cc",
    startTerm: "20221",
    applicationCode: "applicationCode",
    shortName: "shortName",
  } as KoppsRound;
  expect(utils.createCanvasShortName(round)).toBe("cc VT22 (shortName)");
});

test("Canvas shortName should include activityCode", () => {
  const round = {
    courseCode: "cc",
    startTerm: "20221",
    applicationCode: "applicationCode",
  } as KoppsRound;
  expect(utils.createCanvasShortName(round)).toBe("cc VT22 (shortName)");
});

test("should choose the latest date plus 10 days", () => {
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
  const endDate = utils.createEndDate(courseRound as KoppsRound, 10);
  expect(endDate).toBe("2021-12-20");
});
