import { Client, SearchOptions } from "ldapts";
import { EqualityFilter } from "ldapts/filters";
import log from "skog";

let ldapClient: Client;
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
  // base = "OU=UG,DC=ref,DC=ug,DC=kth,DC=se",
  base = "OU=UG,DC=ug,DC=kth,DC=se",
  // We are typing the input search options by picking from the SearchOptions interface
  filter = "" as SearchOptions["filter"],
  attributes = [] as SearchOptions["attributes"],
  scope = "sub" as SearchOptions["scope"],
  timeLimit = 10 as SearchOptions["timeLimit"],
  ...extraOptions
}) {
  try {
    const options: SearchOptions = {
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
  const kthIds = [];
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
    kthIds.push(...searchEntries);
  }
  return kthIds;
}

async function loadMembers(groupName) {
  const members = await searchGroup(groupName);
  return (await getUsersForMembers(members)).map((user) => user.ugKthid);
}

export { ldapBind, ldapUnbind, loadMembers };
