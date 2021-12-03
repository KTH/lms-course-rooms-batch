const { getCourseRounds } = require("./kopps");
const {
  createLongName,
  createAccountId,
  createEndDate,
  createStartDate,
  createSisCourseId,
} = require("./utils");

/**
 * Functions that contain logic
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

function createSection(round) {
  return {
    section_id: round.sisId,
    course_id: round.sisId,
    integration_id: round.ladokUid,
    name: `Section for the course ${createLongName(round)}`,
    status: "active",
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

  return result;
}

function isFarFuture(round) {
  const HALF_YEAR = 180 * 24 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  return startDate - new Date() > HALF_YEAR;
}

function shouldHaveAntagna(round) {
  const THREE_DAYS = 72 * 60 * 60 * 1000;
  const startDate = new Date(createStartDate(round));

  return startDate - new Date() < THREE_DAYS;
}

function addSisId(round) {
  return {
    ...round,
    sisId: createSisCourseId(round),
  };
}

module.exports = {
  createRoom,
  createSection,
  getAllCourseRounds,
  isFarFuture,
  shouldHaveAntagna,
  addSisId,
};
