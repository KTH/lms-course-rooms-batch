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

// ADD NEW COURSE ROOMS
// 1. Determine current semester i.e. 20212 yyyyn n: [1 - spring | 2 - autumn]
// 2. Fetch course rounds from Kopps that start this semester or later
//    NOTE: We need to have some margins, perhaps current semester +/-2 semesters
// 3. Filter by startDate so we only get course rounds where: startDate - preCreationDuration <= today
//    - preCreationDuration -- how far in advance should a course room be created (default: 180 days)
// 4. For each course round create source id and add to CSV
//    - coursesData -- creates course rooms
//    - sectionsData -- creates a section in each course room
//    - enrollmentsData -- all students (both 'admitted-not-registerd', 'registered') and teachers added to section
//    NOTE: students and teachers are ONLY added to sections, never course rooms
// 5. Return data structure
//    NOTE: Send files as an atomic delivery

// REMOVE ADMITTED-NOT-REGISTERED STUDENTS
// NOTE: Students change role from 'admitted-not-registerd' to 'registered', we only remove the former
// - role: admitted-not-registerd = 'antagen'
// - role: registered = 'registrerad student'
// 1. Determine last semester i.e. 20212 yyyyn n: [1 - spring | 2 - autumn]
// 2. Fetch course rounds from Kopps that start last semester or later
//    NOTE: We need to have some margins, perhaps current semester +1/-2 semesters
// 3. Filter by startDate so we only get course rounds where: startDate + purgeDuration <= today
//    - purgeDuration -- how long since course round startDate can a students remain if not registered (default: 3 days)
// 4. For each course round, figure out which students should be removed
//    - enrollmentsCsv -- this is the data that is affected
// 5. Manipulate existing data structure OR return new data structure

// SUBMIT TO CANVAS
// 1. Potentially merge data structures from ADD NEW COURSE ROOMS and REMOVE ADMITTED-NOT-REGISTERED STUDENTS
// 2. Convert data structure to something we can send to Canvas
//    NOTE: We currently use csv-files and Zip them to send as a single file
// 3. Send files to Canvas
// 4. Report result to logging

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
/**course rounds starting in 3 days or sooner. Rounds starting later is skipped. Rounds already started is skipped
 */
async function filterNearFutureRounds(courseRoundDataIn) {
  const futureThreshold = 3 * 24 * 60 * 60 * 1000;
  return courseRoundDataIn.filter((round) => {
    const roundDate =
      new Date(createStartDate(round))
    const now = new Date();
    return roundDate - now <= futureThreshold && roundDate - now >= 0;
  });
}

/* course rounds starting in 6 months or sooner. Rounds starting later is skipped. Rounds already started are skipped
 */
async function filterFutureRounds(courseRoundDataIn) {
  const futureThreshold = 180 * 24 * 60 * 60 * 1000;
  return courseRoundDataIn.filter((round) => {
    const roundDate =
      new Date(createStartDate(round))
    const now = new Date();
    return roundDate - now <= futureThreshold && roundDate - now >= 0;
  });
}
async function filterPastRounds(courseRoundDataIn) {
  return courseRoundDataIn.filter((round) => {
    const roundDate =
      new Date(createStartDate(round))
    const now = new Date();
    return roundDate - now <= 0;
  });
}
async function getStudentsPendingRemoval({
  enrollmentsDataIn,
  courseRoundDataIn,
}) {
  return null;
}
function purgeStudents({ enrollmentsDataIn, studentsPendingRemoval }) {
  return null;
}
async function submitToCanvas({ courseData, sectionsData, enrollmentsData }) {
  return null;
}

module.exports = {
  filterFutureRounds,
  filterNearFutureRounds,
  filterPastRounds,
  getCourseRoundData,
};
