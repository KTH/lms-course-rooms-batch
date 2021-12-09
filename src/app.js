require("./check");
const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  loadTeacherEnrollments,
  loadAntagnaEnrollments,
  loadAntagnaUnEnrollments,
  loadRegisteredStudentEnrollments,
} = require("./lib/enrollmentsUtils");
const { ldapBind, ldapUnbind } = require("./lib/ug");
const {
  getAllCourseRounds,
  isFarFuture,
  createRoom,
  createSection,
  shouldHaveAntagna,
} = require("./lib/courseRoundsUtils");
const canvas = require("./lib/canvas");

function createCsvSerializer(name) {
  const writer = fs.createWriteStream(name);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);
  return serializer;
}

// TODO: add integration test for this function.
// For instance: test that no antagna is added to far future rounds

// ADD NEW COURSE ROOMS
// 1. Determine current semester i.e. 20212 yyyyn n: [1 - spring | 2 - autumn]
// 2. Fetch course rounds from Kopps that start this semester or later
//    NOTE: We need to have some margins, perhaps current semester +/-2 semesters
// 3. Filter by startDate so we only get course rounds where: startDate - preCreationDuration <= today
//    - preCreationDuration -- how far in advance should a course room be created (default: 180 days)
// 4. For each course round create source id and add to CSV
//    - coursesData -- creates course rooms
//    - sectionsData -- creates a section in each course room

// Enrollments for rounds that should include antagna
// 1. Find course rounds that should include teachers and both antagna and registered students.
// 2. For each course round, take a list of: teachers, antagna (source of thruth: UG) and registered students.
// make sure that no student is in both antagna list and registered list
//
// 3. For each registeredStudent:
//      - Write a line to add registered
//      - Write a line to remove antagen (optional: check in Canvas if its actually antagen)
// 4. For each antagen:
//      - Write a line to add antagen
//
//  5. For each teacher:
//    - Write a line to add them with its correct role (teacher, assistant, examiner, etc).

// Enrollments for rounds that should NOT include antagna
// 1. Find course rounds that should inlcude teachers but only registered students. Antagna should be removed
// 2. For each course round, take a list of: teachers and registered students.
// 3. For each person (teacher, student):
//    - Write a line to add them with its correct role
// 4. For each course round, fetch antagna students in Canvas
// 5. For each antagna student in Canvas write a line to remove them.

// SUBMIT TO CANVAS
// 1. Potentially merge data structures from ADD NEW COURSE ROOMS and REMOVE ADMITTED-NOT-REGISTERED STUDENTS
// 2. Convert data structure to something we can send to Canvas
//    NOTE: We currently use csv-files and Zip them to send as a single file
// 3. Send files to Canvas
// 4. Report result to logging
async function start() {
  /* eslint-disable */
  // START TODO remove this, it's only for test!
  const _Date = global.Date;
  global.Date = function () {
    if (arguments.length) {
      return new _Date(...arguments);
    } else {
      return new _Date("2021-09-01T00:00:01Z");
    }
  };
  global.Date.now = _Date.now;
  // END
  /* eslint-enable */

  log.info("Run batch...");
  log.info(`Today: ${new Date()}`);
  const allRounds = (await getAllCourseRounds()).filter(
    (round) => !isFarFuture(round)
  );

  // Create course rooms and sections
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);
  log.info(`Creating csv files in ${dir}`);

  const coursesCsv = createCsvSerializer(`${dir}/courses.csv`);
  const sectionsCsv = createCsvSerializer(`${dir}/sections.csv`);
  allRounds
    .map((round) => ({
      courseRoom: createRoom(round),
      section: createSection(round),
    }))
    .forEach(({ courseRoom, section }) => {
      coursesCsv.write(courseRoom);
      sectionsCsv.write(section);
    });

  coursesCsv.end();
  sectionsCsv.end();

  const enrollmentsCsv = createCsvSerializer(`${dir}/enrollments.csv`);
  await ldapBind();

  const roundsIncludingAntagnaStudents = allRounds.filter(shouldHaveAntagna);
  const roundsExcludingAntagnaStudents = allRounds.filter(
    (round) => !shouldHaveAntagna(round)
  );

  for (const round of roundsIncludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  for (const round of roundsExcludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaUnEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  // Re-bind, solves the problem with unbound ldap.
  await ldapUnbind();
  await ldapBind();
  for (const round of [
    ...roundsExcludingAntagnaStudents,
    ...roundsIncludingAntagnaStudents,
  ]) {
    /* eslint-disable */
    // TODO: is there a problem here? The antagna works fine, but the teachers fails
    [
      ...(await loadTeacherEnrollments(round)),
      ...(await loadRegisteredStudentEnrollments(round)),
    ].forEach((enrollment) => enrollmentsCsv.write(enrollment));
    /* eslint-enable */
  }

  await ldapUnbind();

  enrollmentsCsv.end();

  const zipFileName = path.join(baseDir, "files.zip");
  log.info(`Creating zip file ${zipFileName}`);
  const zip = new Zip();

  for (const file of fs.readdirSync(dir)) {
    zip.file(file, fs.readFileSync(path.join(dir, file)));
  }

  await new Promise((resolve, reject) => {
    zip
      .generateNodeStream({ type: "nodebuffer", streamFiles: true })
      .pipe(fs.createWriteStream(zipFileName))
      .on("finish", resolve)
      .on("error", reject);
  });

  log.info(`Uploading ${zipFileName} to canvas`);
  const result = await canvas.uploadCsvZip(zipFileName);

  log.info(
    `Finished batch successfully. Sis id ${result.body.id} sent to Canvas`
  );
}

start();
