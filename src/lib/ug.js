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
}) {
  try {
    const options = {
      scope,
      filter,
      attributes,
    };

    const { searchEntries } = await ldapClient.search(base, options);
    return searchEntries;
  } catch (err) {
    err.message = "Error in LPDAP: " + err.message;
    throw err;
  }
}

/////////////////////

function createGroupFilter(groupName) {
  return new AndFilter({
    filters: [
      new EqualityFilter({
        attribute: "objectClass",
        value: "group",
      }),
      new EqualityFilter({
        attribute: "CN",
        value: groupName,
      }),
    ],
  });
}

async function searchGroup(filter) {
  const { searchEntries } = await ldapClient.search(
    "OU=UG,DC=ug,DC=kth,DC=se",
    {
      scope: "sub",
      filter,
      timeLimit: 11,
      paged: true,
    }
  );
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
    const { searchEntries } = await ldapClient.search(
      "OU=UG,DC=ug,DC=kth,DC=se",
      {
        scope: "sub",
        filter,
        timeLimit: 10,
        attributes: ["ugKthid", "name"],
        paged: {
          pageSize: 1000,
        },
      }
    );
    usersForMembers.push(...searchEntries);
  }
  return usersForMembers;
}

async function getExaminatorMembers(courseCode) {
  const filter = createGroupFilter(
    `edu.courses.${courseCode.substring(0, 2)}.${courseCode}.examiner`
  );
  return searchGroup(filter, ldapClient);
}

async function loadEnrollments(round) {
  const result = [];
  const ugRoleCanvasRole = [
    // role_id's are defined in Canvas
    { type: "teachers", roleId: 4 },
    { type: "courseresponsible", roleId: 9 },
    { type: "assistants", roleId: 5 },
  ];

  const roundId = round.sisId.slice(-1);

  for (const { type, roleId } of ugRoleCanvasRole) {
    const filter = createGroupFilter(
      `edu.courses.${round.courseCode.substring(0, 2)}.${round.courseCode}.${
        round.startTerm
      }.${roundId}.${type}`
    );
    const members = await searchGroup(filter);
    const users = await getUsersForMembers(members);

    result.push(
      ...users.map((user) => ({
        section_id: round.sisId,
        user_id: user.ugKthid,
        role_id: roleId,
        status: "active",
      }))
    );
  }

  // examinators, role_id: 10
  const examinatorMembers = await getExaminatorMembers(round.courseCode);
  const examinators = await getUsersForMembers(examinatorMembers);

  result.push(
    ...examinators.map((user) => ({
      section_id: round.sisId,
      user_id: user.ugKthid,
      role_id: 10,
      status: "active",
    }))
  );

  console.log(result);

  return result;
  ///////////////////
  // Registered students, role_id: 3
  try {
    let lengthOfInitials;
    if (round.courseCode.length > 6) {
      lengthOfInitials = 3;
    } else {
      lengthOfInitials = 2;
    }
    const courseInitials = round.courseCode.substring(0, lengthOfInitials);
    const courseCodeWOInitials = round.courseCode.substring(lengthOfInitials);
    const filter = createGroupFilter(
      `ladok2.kurser.${courseInitials}.${courseCodeWOInitials}.registrerade_${round.startTerm}.${roundId}`
    );
    const registeredMembers = await searchGroup(filter, ldapClient);
    const registeredStudents = await getUsersForMembers(
      registeredMembers,
      ldapClient
    );
    for (const user of registeredStudents) {
      await csvFile.writeLine(
        [round.sisId, user.ugKthid, 3, "active"],
        fileName
      );
    }
  } catch (err) {
    logger.info(
      err,
      "Could not get registered students for this course. Perhaps there are no students?"
    );
  }
}
///////////////////

module.exports = {
  ldapBind,
  ldapUnbind,
  loadEnrollments,
  async getAntagna(courseCode, term, round) {
    const matching = courseCode.match(/^(F?\w{2})(\w{4})$/);
    if (!matching) {
      throw new Error(
        `UG: Wrong course code format [${courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
      );
    }

    const [, prefix, suffix] = matching;
    const groupName = `ladok2.kurser.${prefix}.${suffix}.antagna_${term}.${round}`;

    log.trace(`UG: Searching members of group "${groupName}"`);
    const groups = await ldapSearch({
      filter: `(&(objectClass=group)(CN=${groupName}))`,
      attributes: ["member"],
    });

    if (groups.length > 1) {
      throw new Error(
        `UG: There is more than one antagna group for ${courseCode} in term ${term}, round ${round}`
      );
    }

    if (groups.length === 0) {
      log.info(`UG: Group [${groupName}] not found.`);
      return [];
    }

    const peopleDNs = Array.isArray(groups[0].member)
      ? groups[0].member
      : [groups[0].member];
    const searchKthIds = peopleDNs
      .filter((dn) => dn)
      .map((dn) =>
        ldapSearch({ base: dn, scope: "base", attributes: ["ugKthId"] })
      );

    const people = (await Promise.all(searchKthIds)).map((r) => r[0].ugKthid);

    log.trace(`UG: Found ${people.length} people in group "${groupName}"`);

    return people;
  },
};
