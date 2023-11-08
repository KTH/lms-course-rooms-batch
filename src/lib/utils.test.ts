import { expect, test } from "@jest/globals";
import { KoppsRound } from "./kopps";

import * as utils from "./utils";

test("Canvas shortName should include kopps shortName but not applicationCode", () => {
  const round = {
    courseCode: "SF1625",
    startTerm: "20221",
    applicationCode: "applicationCode",
    shortName: "shortName",
  } as KoppsRound;
  expect(utils.createCanvasShortName(round)).toBe("SF1625 VT22 (shortName)");
});

test("Canvas shortName should include applicationCode", () => {
  const round = {
    courseCode: "SF1625",
    startTerm: "20221",
    applicationCode: "applicationCode",
  } as KoppsRound;
  expect(utils.createCanvasShortName(round)).toBe(
    "SF1625 VT22 (applicationCode)"
  );
});

test("Canvas longName should put paranthesis last", () => {
  const round = {
    language: "Svenska",
    title: { en: "English title", sv: "Svensk titel" },
    courseCode: "SF1625",
    startTerm: "20221",
    applicationCode: "applicationCode",
    shortName: "shortName",
  } as KoppsRound;
  expect(utils.createLongName(round)).toBe(
    "SF1625 VT22 Svensk titel (shortName)"
  );
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
