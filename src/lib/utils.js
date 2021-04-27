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

function createStartDate(round) {
  const startDate = round.offeredSemesters.find(
    (o) => o.semester === round.firstYearsemester
  ).startDate;

  return `${startDate}T06:00:00Z`;
}

function createEndDate(round) {
  const roundEndDate = round.offeredSemesters.find(
    (o) => o.semester === round.firstYearsemester
  ).endDate;

  const roomEndDate = new Date(roundEndDate);
  roomEndDate.setDate(roomEndDate.getDate() + 60);

  return roomEndDate.toISOString();
}

module.exports = {
  createSisCourseId,
  createLongName,
  createAccountId,
  createStartDate,
  createEndDate,
};
