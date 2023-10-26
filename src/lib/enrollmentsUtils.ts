import { getAntagna } from "./canvas";
import { KoppsRound } from "./kopps";
import { loadMembers } from "./ug";

// The following id:s are taken from the roles in Canvas, found here: https://canvas.kth.se/api/v1/accounts/1/roles?per_page=100
const ANTAGEN_STUDENT = 25;
const REGISTERED_STUDENT = 164;

/**
 * This function is used to support the old ug format, and is needed since UG don't update the old folders, but also doesn't populate the new folders with all data
 *
 */
function getUgNameLadokBase_old(courseCode) {
  const matching = courseCode.match(/^(F?\w{2})(\w{4})$/);

  if (!matching) {
    throw new Error(
      `UG: Wrong course code format [${courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
    );
  }

  const [, prefix, suffix] = matching;

  return `ladok2.kurser.${prefix}.${suffix}`;
}

function getUgNameLadokBase(round: KoppsRound) {
  const matching = round.courseCode.match(/^(F?\w{2})(\w{4})$/);

  if (!matching) {
    throw new Error(
      `UG: Wrong course code format [${round.courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
    );
  }

  const [, prefix, suffix] = matching;

  return `ladok2.kurser.${prefix}.${suffix}.${round.startTerm}.${round.applicationCode}`;
}

// return a list of enrollment objects, prepared to be used for writing csv file.
// One object for adding registered, another obj for removing antagna
// TODO: use shared type for enrollment
async function loadRegisteredStudentEnrollments(round: KoppsRound): Promise<
  {
    section_id: string;
    user_id: string;
    role_id: number;
    status: string;
  }[]
> {
  const ugNameLadokBase = getUgNameLadokBase(round);

  const registeredStudentIds = await loadMembers(
    `${ugNameLadokBase}.registrerad`
  );

  const ugNameLadokBase_old = getUgNameLadokBase_old(round.courseCode);
  const registeredStudentIds_old = await loadMembers(
    `${ugNameLadokBase_old}.registrerade_${round.startTerm}.${round.roundId}`
  );

  // OPTIONAL: should we check in Canvas if the student is antagen?
  const registeredStudentEnrollments = [
    ...registeredStudentIds,
    ...registeredStudentIds_old,
  ].flatMap((kthId) => [
    {
      section_id: round.ladokUid,
      user_id: kthId,
      role_id: REGISTERED_STUDENT,
      status: "active",
    },
    // Remove antagna, since the user is registered he/she shouldn't also be antagen
    {
      section_id: round.ladokUid,
      user_id: kthId,
      role_id: ANTAGEN_STUDENT,
      status: "deleted",
    },
  ]);
  return registeredStudentEnrollments;
}

async function loadAntagnaUnEnrollments(round: KoppsRound) {
  return (await getAntagna(round.ladokUid)).map((kthId) => ({
    section_id: round.ladokUid,
    user_id: kthId,
    role_id: ANTAGEN_STUDENT,
    status: "deleted",
  }));
}

function purgeRegisteredFromAntagna(registeredStudentIds, antagnaStudentIds) {
  return antagnaStudentIds.filter(
    (antagen) => !registeredStudentIds.includes(antagen)
  );
}

async function loadAntagnaEnrollments(
  round: KoppsRound,
  registeredStudentEnrollments: { user_id: string }[] // TODO: use shared type for enrollment
) {
  // Get the Registered students for this round
  const ugNameLadokBase = getUgNameLadokBase(round);
  const ugNameLadokBase_old = getUgNameLadokBase_old(round.courseCode);
  const registeredStudentIds = registeredStudentEnrollments.map(
    (e) => e.user_id
  );

  // Get the antagna students for this round
  // TODO: Also load antagna from the old folders!
  const antagnaStudentIds = await loadMembers(`${ugNameLadokBase}.antagen`);

  return purgeRegisteredFromAntagna(
    registeredStudentIds,
    antagnaStudentIds
  ).map((kthId) => ({
    section_id: round.ladokUid,
    user_id: kthId,
    role_id: ANTAGEN_STUDENT,
    status: "active",
  }));
}

async function loadTeacherEnrollments(round: KoppsRound) {
  const teacherEnrollments = [];
  // eslint-disable-next-line prefer-destructuring
  const roundId = round.roundId;

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
      ...(await loadMembers(ugGroupName)).map((kthId) => ({
        section_id: round.ladokUid,
        user_id: kthId,
        role_id: canvasRoleId,
        status: "active",
      }))
    );
  }
  return teacherEnrollments;
}

export {
  purgeRegisteredFromAntagna,
  loadAntagnaEnrollments,
  loadAntagnaUnEnrollments,
  loadTeacherEnrollments,
  loadRegisteredStudentEnrollments,
};
