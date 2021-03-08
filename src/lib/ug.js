const { Client } = require("ldapts");
const { AndFilter, EqualityFilter } = require("ldapts/filters");
const log = require("skog");

const ldapClient = new Client({
  url: process.env.UG_URL,
});

async function ldapBind() {
  log.info("Connecting to UG via LDAP...");
  await ldapClient.bind(process.env.UG_USERNAME, process.env.UG_PASSWORD);
}

async function ldapUnbind() {
  log.info("Disconnecting to UG via LDAP...");
  await ldapClient.unbind();
}

async function ldapSearch({
  base = "OU=UG,DC=ug,DC=kth,DC=se",
  filter = "",
  attributes = [],
  scope = "sub",
  timeLimit = 10,
  ...extraOptions
}) {
  try {
    const options = {
      scope,
      timeLimit,
      filter,
      attributes,
      ...extraOptions,
    };

    const { searchEntries } = await ldapClient.search(base, options);
    return searchEntries;
  } catch (err) {
    err.message = "Error in LPDAP: " + err.message;
    throw err;
  }
}

async function searchGroup(groupName) {
  const filter = `(&(objectClass=group)(CN=${groupName}))`;
  const searchEntries = await ldapSearch({
    filter,
    paged: true,
  });
  let members = [];
  if (searchEntries[0] && searchEntries[0].member) {
    if (Array.isArray(searchEntries[0].member)) {
      members = searchEntries[0].member;
    } else {
      members = [searchEntries[0].member];
    }
  }
  return members;
}

/*
 * For string array with ldap keys for users, fetch every user object
 */
async function getUsersForMembers(members) {
  const usersForMembers = [];
  for (const member of members) {
    const filter = new EqualityFilter({
      attribute: "distinguishedName",
      value: member,
    });
    const searchEntries = await ldapSearch({
      filter,
      attributes: ["ugKthid"],
      paged: {
        pageSize: 1000,
      },
    });
    usersForMembers.push(...searchEntries);
  }
  return usersForMembers;
}

function getUgNameLadokBase(courseCode) {
  const matching = courseCode.match(/^(F?\w{2})(\w{4})$/);

  if (!matching) {
    throw new Error(
      `UG: Wrong course code format [${courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
    );
  }

  const [, prefix, suffix] = matching;

  return `ladok2.kurser.${prefix}.${suffix}`;
}

async function getEnrollmentCsvData(sisSectionId, roleId, groupName) {
  const members = await searchGroup(groupName);
  const users = await getUsersForMembers(members);

  return users.map((user) => ({
    section_id: sisSectionId,
    user_id: user.ugKthid,
    role_id: roleId,
    status: "active",
  }));
}

class EducatorsGroupNames {
  constructor(round) {
    // prettier-ignore
    this.ugNameEduBase = `edu.courses.${round.courseCode.substring(0, 2)}.${round.courseCode}`;
    this.startTerm = round.startTerm;
    this.roundId = round.sisId.slice(-1);
  }

  examiner() {
    return `${ugNameEduBase}.examiner`;
  }

  nonExaminer(role) {
    // prettier-ignore
    return `${this.ugNameEduBase}.${this.startTerm}.${this.roundId}.${role}`;
  }
}

class StudentsGroupNames {
  constructor(round) {
    const matching = courseCode.match(/^(F?\w{2})(\w{4})$/);

    if (!matching) {
      throw new Error(
        `UG: Wrong course code format [${courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
      );
    }

    const [, prefix, suffix] = matching;

    this.ugNameLadokBase = `ladok2.kurser.${prefix}.${suffix}`;
    this.startTerm = round.startTerm;
    this.roundId = round.sisId.slice(-1);
  }

  getGroupName(role) {
    // prettier-ignore
    return `${this.ugNameLadokBase}.${role}_${this.startTerm}.${this.roundId}`;
  }
}

async function loadEnrollments(round, { includeAntagna = false } = {}) {
  const result = [];
  const sisId = round.sisId;
  const eduGroups = new EducatorsGroupNames(round);
  const studentGroups = new StudentsGroupNames(round);

  // prettier-ignore
  result.push(
    ...(await getEnrollmentCsvData(sisId, 4, eduGroups.nonExaminer("teachers"))),
    ...(await getEnrollmentCsvData(sisId, 9, eduGroups.nonExaminer("courseresponsible"))),
    ...(await getEnrollmentCsvData(sisId, 5, eduGroups.nonExaminer("assistants"))),
    ...(await getEnrollmentCsvData(sisId, 10, eduGroups.examiner()))
  );

  result.push(
    ...(await getEnrollmentCsvData(
      sisId,
      3,
      studentGroups.getGroupName("registrerade")
    ))
  );

  if (includeAntagna) {
    result.push(
      ...(await getEnrollmentCsvData(
        sisId,
        25,
        studentGroups.getGroupName("antagna")
      ))
    );
  }

  return result;
}

///////////////////

module.exports = {
  ldapBind,
  ldapUnbind,
  loadEnrollments,
};
