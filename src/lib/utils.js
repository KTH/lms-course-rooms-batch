const terms = { VT: 1, HT: 2, 1: "VT", 2: "HT" };

function createLongName(round) {
  const termNum = round.startTerm[4];
  const term = terms[termNum];
  const title = round.title[round.language === "Svenska" ? "sv" : "en"];
  let result = round.courseCode;
  if (round.shortName) {
    result += ` ${round.shortName}`;
  }
  result += ` ${term}${round.startTerm.substring(2, 4)}-${
    round.roundId
  } ${title}`;
  return result;
}

function createSisCourseId({ courseCode, startTerm, roundId }) {
  const termNum = startTerm[4];
  const shortYear = `${startTerm[2]}${startTerm[3]}`;
  const term = terms[termNum];

  return `${courseCode}${term}${shortYear}${roundId}`;
}

function createAccountId(round) {
  return `${round.schoolCode} - Imported course rounds`;
}

function createEndDate(round) {
  // A round can span multiple semesters. Choose the last end date of all of the semesters to be used as end date for the course round
  const semestersDescending = round.offeredSemesters.sort(
    (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  return semestersDescending[0].endDate;
}

function createStartDate(round) {
  const startDate = round.offeredSemesters.find(
    (o) => o.semester === round.firstYearsemester
  ).startDate;

  return `${startDate}T06:00:00Z`;
}

module.exports = {
  createSisCourseId,
  createLongName,
  createAccountId,
  createStartDate,
  createEndDate,
};
