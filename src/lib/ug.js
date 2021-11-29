const { Client } = require("ldapts");
const { EqualityFilter } = require("ldapts/filters");
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
    // eslint-disable-next-line no-await-in-loop
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


async function loadAllEnrollments(rounds){
  const result = []
  for (const round of rounds){
    result.push(await loadEnrollments(round, {includeAntagna: true}))
  }
  return results
}

async function loadEnrollments(round, { includeAntagna = false } = {}) {
  const result = [];
  const ugRoleCanvasRole = [
    // role_id's are defined in Canvas
    { type: "teachers", roleId: 4 },
    { type: "courseresponsible", roleId: 9 },
    { type: "assistants", roleId: 5 },
  ];

  const roundId = round.sisId.slice(-1);
  // prettier-ignore
  const ugNameEduBase = `edu.courses.${round.courseCode.substring(0, 2)}.${round.courseCode}`;

  for (const { type, roleId } of ugRoleCanvasRole) {
    result.push(
      // eslint-disable-next-line no-await-in-loop
      ...(await getEnrollmentCsvData(
        round.sisId,
        roleId,
        `${ugNameEduBase}.${round.startTerm}.${roundId}.${type}`
      ))
    );
  }

  // examinators, role_id: 10 FIXME: handle this value in the same way as other role_ids
  result.push(
    ...(await getEnrollmentCsvData(
      round.sisId,
      10,
      `${ugNameEduBase}.examiner`
    ))
  );

  // Registered students, role_id: 3
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);
  result.push(
    ...(await getEnrollmentCsvData(
      round.sisId,
      3,
      `${ugNameLadokBase}.registrerade_${round.startTerm}.${roundId}`
    ))
  );

  if (includeAntagna) {
    result.push(
      ...(await getEnrollmentCsvData(
        round.sisId,
        25,
        `${ugNameLadokBase}.antagna_${round.startTerm}.${roundId}`
      ))
    );
  }

  return result;
}

/// ////////////////

module.exports = {
  ldapBind,
  ldapUnbind,
  loadEnrollments,
  loadAllEnrollments
};
