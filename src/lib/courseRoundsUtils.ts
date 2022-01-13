/**
 * Module with functions that contain logic for creating course rounds
 */
import { getCourseRounds } from "./kopps";
import {
  createLongName,
  createAccountId,
  createEndDate,
  createStartDate,
  createSisCourseId,
} from "./utils";

/**
 * Given a Kopps `round`, returns an object that matches the `courses.csv`
 * Canvas SIS Import Format for that round
 *
 * @link https://canvas.instructure.com/doc/api/file.sis_csv.html
 */
function createRoom(round) {
  return {
    course_id: round.sisId,
    short_name: round.sisId,
    long_name: createLongName(round),
    start_date: createStartDate(round),
    end_date: createEndDate(round),
    account_id: createAccountId(round),
    integration_id: round.ladokUid,
    status: "active",
  };
}

/**
 * Given a Kopps `round`, returns an object that matches the `sections.csv`
 * Canvas SIS Import Format for that round
 *
 * @link https://canvas.instructure.com/doc/api/file.sis_csv.html
 */
function createSection(round) {
  return {
    section_id: round.sisId,
    course_id: round.sisId,
    integration_id: round.ladokUid,
    name: `Section for the course ${createLongName(round)}`,
    status: "active",
  };
}

function _addSisId(round) {
  return {
    ...round,
    sisId: createSisCourseId(round),
  };
}

/**
 * Returns a list of Kopps rounds that can be handled at this moment
 */
async function getAllCourseRounds() {
  const today = new Date();
  const lastYear = today.getFullYear() - 1;
  const nextYear = today.getFullYear() + 1;

  const terms = [
    `${lastYear}2`,
    `${today.getFullYear()}1`,
    `${today.getFullYear()}2`,
    `${nextYear}1`,
  ];

  const result = [];

  for (const term of terms) {
    // eslint-disable-next-line no-await-in-loop
    result.push(...(await getCourseRounds(term)));
  }

  return result.map(_addSisId);
}

/**
 * Return `true` if the given `round` is in the future, i.e. aprox 9 months ahead
 * from the current date
 */
function isFarFuture(round) {
  const threshold = 9 * 30 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));
  const now = new Date();

  return startDate.valueOf() - now.valueOf() > threshold;
}

/**
 * Return `true` if the given `round` should include antagna "students", i.e.
 * if its start date was three days ago or later
 */
function shouldHaveAntagna(round) {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));
  const now = new Date();

  return now.valueOf() - startDate.valueOf() < THREE_DAYS;
}

export {
  createRoom,
  createSection,
  getAllCourseRounds,
  isFarFuture,
  shouldHaveAntagna,
  _addSisId,
};