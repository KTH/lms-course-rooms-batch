import { getAntagna, Roles } from "./canvas";
import { KoppsRound } from "./kopps";
import { loadMembers } from "./ug";

type CanvasCsvEnrollment = {
  section_id: string;
  user_id: string;
  role_id: (typeof Roles)[keyof typeof Roles];
  status: "active" | "deleted";
};

/**
 * This function is used to support the old ug format, and is needed since UG don't update the old folders, but also doesn't populate the new folders with all data
 *
 */
function getUgNameLadokBase_old(courseCode): string {
  const matching = courseCode.match(/^(F?\w{2})(\w{4})$/);

  if (!matching) {
    throw new Error(
      `UG: Wrong course code format [${courseCode}]. Format should be "XXXYYYY" (example: "AAA1111")`
    );
  }

  const [, prefix, suffix] = matching;

  return `ladok2.kurser.${prefix}.${suffix}`;
}

function getUgNameLadokBase(round: KoppsRound): string {
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
async function loadRegisteredStudentEnrollments(
  round: KoppsRound
): Promise<CanvasCsvEnrollment[]> {
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
      role_id: Roles.REGISTERED_STUDENT,
      status: "active" as const,
    },
    // Remove antagna, since the user is registered he/she shouldn't also be antagen
    {
      section_id: round.ladokUid,
      user_id: kthId,
      role_id: Roles.ANTAGEN_STUDENT,
      status: "deleted" as const,
    },
  ]);
  return registeredStudentEnrollments;
}

async function loadAntagnaUnEnrollments(
  round: KoppsRound
): Promise<CanvasCsvEnrollment[]> {
  return (await getAntagna(round.ladokUid)).map((kthId) => ({
    section_id: round.ladokUid,
    user_id: kthId,
    role_id: Roles.ANTAGEN_STUDENT,
    status: "deleted",
  }));
}

function purgeRegisteredFromAntagna(
  registeredStudentIds: string[],
  antagnaStudentIds: string[]
): string[] {
  return antagnaStudentIds.filter(
    (antagen) => !registeredStudentIds.includes(antagen)
  );
}

async function loadAntagnaEnrollments(
  round: KoppsRound,
  registeredStudentEnrollments: CanvasCsvEnrollment[]
): Promise<CanvasCsvEnrollment[]> {
  // Get the Registered students for this round
  const ugNameLadokBase = getUgNameLadokBase(round);
  const ugNameLadokBase_old = getUgNameLadokBase_old(round.courseCode);
  const registeredStudentIds = registeredStudentEnrollments.map(
    (e) => e.user_id
  );

  // Get the antagna students for this round
  const antagnaStudentIds = [
    ...(await loadMembers(`${ugNameLadokBase}.antagen`)),
    ...(await loadMembers(
      `${ugNameLadokBase_old}.antagna_${round.startTerm}.${round.roundId}`
    )),
  ];

  return purgeRegisteredFromAntagna(
    registeredStudentIds,
    antagnaStudentIds
  ).map((kthId) => ({
    section_id: round.ladokUid,
    user_id: kthId,
    role_id: Roles.ANTAGEN_STUDENT,
    status: "active" as const,
  }));
}

async function loadTeacherEnrollments(
  round: KoppsRound
): Promise<CanvasCsvEnrollment[]> {
  const teacherEnrollments = [];
  const roundId = round.roundId;

  // Teacher enrollments
  // prettier-ignore
  const ugNameEduBase = `edu.courses.${round.courseCode.substring(0, 2)}.${round.courseCode}`;
  const teacherRoles = [
    {
      canvasRoleId: Roles.TEACHER,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.teachers`,
    },
    {
      canvasRoleId: Roles.COURSE_RESPONSIBLE,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.courseresponsible`,
    },
    {
      canvasRoleId: Roles.TEACHER_ASSISTANT,
      ugGroupName: `${ugNameEduBase}.${round.startTerm}.${roundId}.assistants`,
    },
    {
      canvasRoleId: Roles.EXAMINER,
      ugGroupName: `${ugNameEduBase}.examiner`,
    },
  ];

  for (const { canvasRoleId, ugGroupName } of teacherRoles) {
    teacherEnrollments.push(
      ...(await loadMembers(ugGroupName)).map((kthId) => ({
        section_id: round.ladokUid,
        user_id: kthId,
        role_id: canvasRoleId,
        status: "active" as const,
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
  CanvasCsvEnrollment,
};
