import { getAntagna } from "./canvas";
import { loadMembers } from "./ug";

// The following id:s are taken from the roles in Canvas, found here: https://canvas.kth.se/api/v1/accounts/1/roles?per_page=100
const ANTAGEN_STUDENT = 25;
const REGISTERED_STUDENT = 164;
const MANUALLY_ADDED_STUDENT = 15;
const ORIGINAL_STUDENT = 3;

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

// return a list of enrollment objects, prepared to be used for writing csv file.
// One object for adding registered, another obj for removing antagna
async function loadRegisteredStudentEnrollments(round) {
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);
  const groupName = `${ugNameLadokBase}.registrerade_${round.startTerm}.${round.roundId}`;

  // OPTIONAL: should we check in Canvas if the student is antagen?
  const registeredStudentEnrollments = (await loadMembers(groupName)).flatMap(
    (kthId) => [
      {
        section_id: round.sisId,
        user_id: kthId,
        role_id: REGISTERED_STUDENT,
        status: "active",
      },
      // Remove antagna, since the user is registered he/she shouldn't also be antagen
      {
        section_id: round.sisId,
        user_id: kthId,
        role_id: ANTAGEN_STUDENT,
        status: "deleted",
      },
      // Remove manually added student, since the user is registered he/she shouldn't be considered as manually handled anymore
      {
        section_id: round.sisId,
        user_id: kthId,
        role_id: MANUALLY_ADDED_STUDENT,
        status: "deleted",
      },
      // Remove the original student role. This is to prevent the users to have double student roles. This is probably temporary, and can be removed once no active course room have any students enrolled with this deprecated role.
      {
        section_id: round.sisId,
        user_id: kthId,
        role_id: ORIGINAL_STUDENT,
        status: "deleted",
      },
    ]
  );
  return registeredStudentEnrollments;
}

async function loadAntagnaUnEnrollments(round) {
  return (await getAntagna(round.sisId)).map((kthId) => ({
    section_id: round.sisId,
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

async function loadAntagnaEnrollments(round) {
  // Get the Registered students for this round
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);
  const registeredStudentIds = await loadMembers(
    `${ugNameLadokBase}.registrerade_${round.startTerm}.${round.roundId}`
  );

  // Get the antagna students for this round
  const antagnaStudentIds = await loadMembers(
    `${ugNameLadokBase}.antagna_${round.startTerm}.${round.roundId}`
  );

  return purgeRegisteredFromAntagna(
    registeredStudentIds,
    antagnaStudentIds
  ).map((kthId) => ({
    section_id: round.sisId,
    user_id: kthId,
    role_id: ANTAGEN_STUDENT,
    status: "active",
  }));
}

async function loadTeacherEnrollments(round) {
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
        section_id: round.sisId,
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
