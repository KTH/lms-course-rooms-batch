const { Client } = require("ldapts");
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

module.exports = {
  ldapBind,
  ldapUnbind,
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
