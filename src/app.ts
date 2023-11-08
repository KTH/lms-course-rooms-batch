import "./check";

import log from "skog";
import JSZip from "jszip";
import * as csv from "fast-csv";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  loadTeacherEnrollments,
  loadAntagnaEnrollments,
  loadAntagnaUnEnrollments,
  loadRegisteredStudentEnrollments,
} from "./lib/enrollmentsUtils";
import { ldapBind, ldapUnbind } from "./lib/ug";
import {
  getAllCourseRounds,
  isFarFuture,
  createRoom,
  createSection,
  shouldHaveAntagna,
} from "./lib/courseRoundsUtils";
import * as canvas from "./lib/canvas";
import sendBatchOK from "./sendNrdp";

function createCsvSerializer(name) {
  const writer = fs.createWriteStream(name);
  const serializer = csv.format({ headers: true });
  serializer.pipe(writer);
  return serializer;
}

// TODO: add integration test for this function.
// For instance: test that no antagna is added to far future rounds

async function start() {
  log.info(`Run batch. Today is ${new Date()}`);
  const allRounds = (await getAllCourseRounds()).filter(
    (round) => !isFarFuture(round)
  );

  // Create course rooms and sections
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), "sync-"));
  const dir = path.join(baseDir, "csv");
  fs.mkdirSync(dir);
  log.info(`Creating csv files in ${dir}`);

  const coursesCsv = createCsvSerializer(
    `${dir}/lms-course-rooms-batch-courses.csv`
  );
  const sectionsCsv = createCsvSerializer(
    `${dir}/lms-course-rooms-batch-sections.csv`
  );
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

  const enrollmentsCsv = createCsvSerializer(
    `${dir}/lms-course-rooms-batch-enrollments.csv`
  );

  const roundsIncludingAntagnaStudents = allRounds.filter(shouldHaveAntagna);
  const roundsExcludingAntagnaStudents = allRounds.filter(
    (round) => !shouldHaveAntagna(round)
  );

  await ldapBind();
  for (const round of roundsIncludingAntagnaStudents) {
    const registeredStudentEnrollments = await loadRegisteredStudentEnrollments(
      round
    );
    [
      ...registeredStudentEnrollments,
      ...(await loadAntagnaEnrollments(round, registeredStudentEnrollments)),
      ...(await loadTeacherEnrollments(round)),
    ].forEach((enrollment) => enrollmentsCsv.write(enrollment));
  }

  for (const round of roundsExcludingAntagnaStudents) {
    [
      ...(await loadAntagnaUnEnrollments(round)),
      ...(await loadTeacherEnrollments(round)),
      ...(await loadRegisteredStudentEnrollments(round)),
    ].forEach((enrollment) => enrollmentsCsv.write(enrollment));
  }

  await ldapUnbind();

  enrollmentsCsv.end();

  const zipFileName = path.join(baseDir, "files.zip");
  log.info(`Creating zip file ${zipFileName}`);
  const zip = new JSZip();

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
  log.info("TODO: send files to canvas!");
  const result = await canvas.uploadCsvZip(zipFileName);

  log.info(
    `Finished batch successfully. Sis id ${result.body.id} sent to Canvas`
  );
  sendBatchOK();
}

start();
