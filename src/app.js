require("./check");
const log = require("skog");
const Zip = require("jszip");
const csv = require("fast-csv");
const fs = require("fs");
const path = require("path");
const os = require("os");

const Period = require("./lib/period");
const { getCourseRounds } = require("./lib/kopps");
const {
  loadEnrollments,
  ldapBind,
  ldapUnbind,
  loadAllEnrollments,
} = require("./lib/ug");
const canvas = require("./lib/canvas");
const {
  createLongName,
  createSisCourseId,
  createAccountId,
  createEndDate,
  createStartDate,
} = require("./lib/utils");
const { 
  getCourseRoundData, 
  removeRoundsInTheFarFuture, 
  filterRoundsStartedInThePast, 
  filterNewlyStartedOrFutureRounds
} = require("./lib/index");

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

async function main() {
  log.info('Run batch...')

  await ldapBind();
  const courseRoundData = (await getCourseRoundData())
    .map(r => ({sisId:createSisCourseId(r), ...r})) // Add sisId

  const pastOrFutureRounds = removeRoundsInTheFarFuture(courseRoundData);
  // create courserooms and sections for these rounds
  const roomsCsvData = pastOrFutureRounds.map(createRoom)
  const sectionsCsvData = pastOrFutureRounds.map(createSection)

  // Enroll registered students and teachers for these rounds
  const enrollments = []
  for (const round of pastOrFutureRounds) {
    console.log(`load enrollments for ${round.sisId}`)
    // TODO: requires a round.sisId. Should I handle it here, or rebuild?
    enrollments.push(...await loadEnrollments(round, {
        includeAntagna: false,
      }));
  }

  console.log(enrollments)
  
  // const pastRounds = filterRoundsStartedInThePast(courseRoundData)
  // // Remove antagna from these rounds
  
  // const futureRounds = filterNewlyStartedOrFutureRounds(courseRoundData)
  // // Add antagna to these rounds
  
  // // REMOVE ADMITTED-NOT-REGISTERED STUDENTS
  // const { studentsPendingRemoval } = await getStudentsPendingRemoval({
  //   enrollmentsDataIn: enrollments,
  //   courseRoundDataIn: courseRoundData,
  // });

  // const { enrollmentsData } = purgeStudents({
  //   enrollmentsDataIn,
  //   studentsPendingRemoval,
  // });

  // // SUBMIT TO CANVAS
  // const { result } = await submitToCanvas({
  //   courseData,
  //   sectionsData,
  //   enrollmentsData,
  // });
}
async function start() {
  log.info("Run batch...");
  const currentPeriod = Period.fromString(process.env.CURRENT_PERIOD);

  // "future Periods" are the periods where we are going to create course rooms,
  // enroll students (including antagna)
  // We are currently handling 5 periods
  const futurePeriods = Period.range(currentPeriod, 1, 5);

  await ldapBind();

  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);
  log.info(`Creating csv files in ${dir}`);

  for (const period of futurePeriods) {
    log.info(`Handling ${period}, including admitted`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    // eslint-disable-next-line no-await-in-loop
    for (const round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      // log.info(`Getting enrollments for ${round.sisId}`);
      // log.info(round.dump);

      coursesCsv.write(createRoom(round));
      sectionsCsv.write(createSection(round));

      // eslint-disable-next-line no-await-in-loop
      const enrollments = await loadEnrollments(round, {
        includeAntagna: true,
      });
      for (const enrollment of enrollments) {
        enrollmentsCsv.write(enrollment);
      }
    }

    coursesCsv.end();
    sectionsCsv.end();
    enrollmentsCsv.end();
  }

  // Current and previous where we are going to remove antagna
  // We are currently handling 5 periods
  for (const period of Period.range(currentPeriod, -4, 0)) {
    log.info(`Handling ${period}, removing admitted`);
    const coursesCsv = createCsvSerializer(`${dir}/courses-${period}.csv`);
    const sectionsCsv = createCsvSerializer(`${dir}/sections-${period}.csv`);
    const enrollmentsCsv = createCsvSerializer(
      `${dir}/enrollments-${period}.csv`
    );

    // eslint-disable-next-line no-await-in-loop
    for (const round of await getCourseRounds(period)) {
      round.sisId = createSisCourseId(round);
      // log.info(`Getting enrollments for ${round.sisId}`);

      coursesCsv.write(createRoom(round));
      sectionsCsv.write(createSection(round));

      // eslint-disable-next-line no-await-in-loop
      const enrollments = await loadEnrollments(round);
      for (const enrollment of enrollments) {
        enrollmentsCsv.write(enrollment);
      }

      // eslint-disable-next-line no-await-in-loop
      for (const enrollment of await canvas.getAntagnaToDelete(round.sisId)) {
        enrollmentsCsv.write(enrollment);
      }
    }

    coursesCsv.end();
    sectionsCsv.end();
    enrollmentsCsv.end();
  }

  await ldapUnbind();

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
  await canvas.uploadCsvZip(zipFileName);

  log.info(`Finished batch successfully.`);
}

main();
