const { Client } = require("ldapts");
const { EqualityFilter } = require("ldapts/filters");
const log = require("skog");

// const memoizee = require('memoizee')
let ldapClient;
async function ldapBind() {
  ldapClient = new Client({
    url: process.env.UG_URL,
  });

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

// const cacheStats = {
//   total: 0,
//   fail: 0,
// };

// TODO: this cached function returns 30% less enrollments then the original. If we are 
// to cache, make sure that it works properly
//
// async function _getKthId(dn) {
//   // cacheStats.fail++;
//   return ldapSearch({ base: dn, scope: "base", attributes: ["ugKthId"] }).then(
//     (entries) => entries[0].ugKthid
//   );
// }

// getKthId = memoizee(_getKthId);


/*
 * For string array with ldap keys for users, fetch every user object
 */
async function getUsersForMembers(members) {
  const kthIds = [];
  for (const member of members) {
    // const kthId = await getKthId(member);
    // kthIds.push(kthId);

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
    kthIds.push(...searchEntries);
  }
  return kthIds;
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

async function loadMembers(groupName) {
  const members = await searchGroup(groupName);
  return (await getUsersForMembers(members)).map((user) => user.ugKthid);
}

async function loadEnrollments(round, { includeAntagna = false } = {}) {
  const teacherEnrollments = [];
  // TODO: round ID already exists as its own field in Kopps. Use it instead of
  //       converting to SIS ID and then back to round ID
  const roundId = round.sisId.slice(-1);

  // Teacher enrollments
  // prettier-ignore
  const ugNameEduBase = `edu.courses.${round.courseCode.substring(0, 2)}.${round.courseCode}`;
  const teacherRoles = [
    {
      canvasRoleId: 4,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.teachers`,
    },
    {
      canvasRoleId: 9,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.courseresponsible`,
    },
    {
      canvasRoleId: 5,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.assistants`,
    },
    {
      canvasRoleId: 10,
      ugGroupName: `${ugNameEduBase}.examiner`,
    },
  ];

  for (const { canvasRoleId, ugGroupName } of teacherRoles) {
    teacherEnrollments.push(
      // eslint-disable-next-line no-await-in-loop
      ...(await getEnrollmentCsvData(round.sisId, canvasRoleId, ugGroupName))
    );
  }

  // Student enrollments
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);

  const registeredStudentsEnrollments = await getEnrollmentCsvData(
    round.sisId,
    3,
    `${ugNameLadokBase}.registrerade_${round.startTerm}.${roundId}`
  );
  let antagnaStudentsEnrollments = [];

  if (includeAntagna) {
    antagnaStudentsEnrollments = await getEnrollmentCsvData(
      round.sisId,
      25,
      `${ugNameLadokBase}.antagna_${round.startTerm}.${roundId}`
    );

    for (const antagnaEnrollment of antagnaStudentsEnrollments) {
      const isRegistered = registeredStudentsEnrollments.find(
        (regEnr) => regEnr.user_id === antagnaEnrollment.user_id
      );

      if (isRegistered) {
        // NOTE: Check in Canvas that the student has no longer antagna role
        // otherwise this can provoke false SIS Import Errors
        antagnaEnrollment.status = "deleted";
      }
    }
  }

  return [
    ...teacherEnrollments,
    ...registeredStudentsEnrollments,
    ...antagnaStudentsEnrollments,
  ];
}

/// ////////////////

module.exports = {
  ldapClient,
  ldapBind,
  ldapUnbind,
  loadEnrollments,
  loadMembers,
};
