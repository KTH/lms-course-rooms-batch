/* eslint-disable import/first */
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
  const allRounds = (await getAllCourseRounds())
    .filter((round) => !isFarFuture(round))
    // TODO: remove this line!
    .filter((r) => r.sisId.match("A11IYAVT221"));

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

  const roundsIncludingAntagnaStudents = allRounds.filter(shouldHaveAntagna);
  const roundsExcludingAntagnaStudents = allRounds.filter(
    (round) => !shouldHaveAntagna(round)
  );

  for (const round of roundsExcludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaUnEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  await ldapBind();
  for (const round of roundsIncludingAntagnaStudents) {
    // eslint-disable-next-line no-await-in-loop
    (await loadAntagnaEnrollments(round)).forEach((enrollment) =>
      enrollmentsCsv.write(enrollment)
    );
  }

  for (const round of [
    ...roundsExcludingAntagnaStudents,
    ...roundsIncludingAntagnaStudents,
  ]) {
    /* eslint-disable */
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
  const result = await canvas.uploadCsvZip(zipFileName);

  log.info(
    `Finished batch successfully. Sis id ${result.body.id} sent to Canas`
  );
}

start();
