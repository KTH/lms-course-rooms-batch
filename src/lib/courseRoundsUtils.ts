/**
 * Module with functions that contain logic for creating course rounds
 */
import { getCourseRounds, KoppsRound } from "./kopps";
import {
  createLongName,
  createAccountId,
  createEndDate,
  createStartDate,
  createCanvasShortName,
} from "./utils";

/**
 * Given a Kopps `round`, returns an object that matches the `lms-course-rooms-batch-courses.csv`
 * Canvas SIS Import Format for that round
 *
 * @link https://canvas.instructure.com/doc/api/file.sis_csv.html
 */
function createRoom(round: KoppsRound) {
  return {
    course_id: round.ladokUid,
    short_name: createCanvasShortName(round),
    long_name: createLongName(round),
    start_date: createStartDate(round),
    end_date: createEndDate(round),
    account_id: createAccountId(round),
    term_id: round.firstYearsemester,
    integration_id: undefined,
    status: "active",
  };
}

/**
 * Given a Kopps `round`, returns an object that matches the `lms-course-rooms-batch-sections.csv`
 * Canvas SIS Import Format for that round
 *
 * @link https://canvas.instructure.com/doc/api/file.sis_csv.html
 */
function createSection(round: KoppsRound) {
  return {
    section_id: round.ladokUid,
    course_id: round.ladokUid,
    integration_id: undefined,
    name: createCanvasShortName(round),
    status: "active",
  };
}

function today(): Date {
  const date = new Date();
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(1);
  return date;
}

function createTerm(term: string) {
  return {
    term_id: term,
    name: _createTermName(term),
    status: "active",
  };
}

function _createTermName(term_id: string) {
  if (term_id.endsWith("1")) {
    return `VT ${term_id.slice(0, 4)}`;
  }
  return `HT ${term_id.slice(0, 4)}`;
}

function getTerms(): Array<string> {
  const _today = today();
  const lastYear = _today.getFullYear() - 1;
  const nextYear = _today.getFullYear() + 1;
  return [
    `${lastYear}2`,
    `${_today.getFullYear()}1`,
    `${_today.getFullYear()}2`,
    `${nextYear}1`,
  ];
}

/**
 * Returns a list of Kopps rounds that can be handled at this moment
 */
async function getAllCourseRounds() {
  const terms = getTerms();

  const result = [];

  for (const term of terms) {
    result.push(...(await getCourseRounds(term)));
  }

  return result;
}

/**
 * Return `true` if the given `round` is in the future, i.e. aprox 9 months ahead
 * from the current date
 */
function isFarFuture(round: KoppsRound) {
  const threshold = 9 * 30 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  // TS requires us to call .valueOf() on date obj
  return startDate.valueOf() - today().valueOf() > threshold;
}

/**
 * Return `true` if the given `round` should include antagna "students", i.e.
 * if its start date was three days ago or later
 */
function shouldHaveAntagna(round: KoppsRound) {
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  // TS requires us to call .valueOf() on date obj
  return today().valueOf() - startDate.valueOf() < THREE_DAYS;
}

export {
  createRoom,
  createSection,
  getTerms,
  createTerm,
  getAllCourseRounds,
  isFarFuture,
  shouldHaveAntagna,
};
