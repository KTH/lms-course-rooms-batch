const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");

const { getCourseRounds } = require("./kopps");
// const { loadEnrollments, ldapBind, ldapUnbind } = require("./ug");
const canvas = require("./canvas");
const {
  createLongName,
  createSisCourseId,
  createAccountId,
  createEndDate,
  createStartDate,
} = require("./utils");

const admittedThreshold = 3 * 24 * 60 * 60 * 1000;
const courseRoomThreshold = 180 * 24 * 60 * 60 * 1000;

function createCsvSerializer(name) {
  const writer = fs.createWriteStream(name);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);
  return serializer;
}

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
 * Returns course rounds that start last year autumn semester or later
 * @returns {Promise<CourseRoundData[]>}
 */
async function getCourseRoundData() {
  const today = new Date();
  const lastYear = today.getFullYear() - 1;
  const nextYear = today.getFullYear() + 1;

  const semesters = [
    `${lastYear}2`,
    `${today.getFullYear()}1`,
    `${today.getFullYear()}2`,
    `${nextYear}1`,
  ];

  const result = [];

  for (const semester of semesters) {
    // eslint-disable-next-line no-await-in-loop
    result.push(...(await getCourseRounds(semester)));
  }

  return result;
}
function filterNewlyStartedOrFutureRounds(courseRoundDataIn) {
  const newlyCreatedAndAllFutureRounds = courseRoundDataIn.filter((round) => {
    const roundDate = new Date(createStartDate(round));
    const now = new Date();
    return roundDate >= now - admittedThreshold;
  });
  return removeRoundsInTheFarFuture(newlyCreatedAndAllFutureRounds);
}

function removeRoundsInTheFarFuture(courseRoundDataIn) {
  return courseRoundDataIn.filter((round) => {
    const roundDate = new Date(createStartDate(round));
    const now = new Date();
    return roundDate - now <= courseRoomThreshold;
  });
}
function filterRoundsStartedInThePast(courseRoundDataIn) {
  const admittedThreshold = 3 * 24 * 60 * 60 * 1000;
  return courseRoundDataIn.filter((round) => {
    const roundDate = new Date(createStartDate(round));
    const now = new Date();
    return roundDate <= now - admittedThreshold;
  });
}

async function submitToCanvas({ courseData, sectionsData, enrollmentsData }) {
  return null;
}

module.exports = {
  removeRoundsInTheFarFuture,
  filterNewlyStartedOrFutureRounds,
  filterRoundsStartedInThePast,
  getCourseRoundData,
};
