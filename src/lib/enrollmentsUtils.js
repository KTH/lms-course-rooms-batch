const {loadMembers} = require("./ug")

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


// return a list of enrollment objects, prepared to be used for writing csv file
async function loadRegisteredStudentEnrollments(round){
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);
  const groupName = `${ugNameLadokBase}.registrerade_${round.startTerm}.${roundId}`

  return await (await loadMembers(groupName)).map(kthId => convertToEnrollmentObj(kthId, round))
}

function convertToEnrollmentObj(kthId, round){

  return {
    section_id: round.sisId,
    user_id: kthId,
    role_id: 3,
    status: "active",
  }
}

async function loadAntagnaEnrollments(round){
  // Get the Registered students for this round
  const ugNameLadokBase = getUgNameLadokBase(round.courseCode);
  const registeredStudentIds = await loadMembers(`${ugNameLadokBase}.registrerade_${round.startTerm}.${roundId}`
  )


  // Get the antagna students for this round
  const antagnaStudentIds= await loadMembers(`${ugNameLadokBase}.antagna_${round.startTerm}.${roundId}`
  )

  return purgeRegisteredFromAntagna(registeredStudentIds, antagnaStudentIds)


}

function purgeRegisteredFromAntagna(registeredStudentIds, antagnaStudentIds){
  return antagnaStudentIds.filter(antagen => !registeredStudentIds.includes(antagen))
  
  
}

async function loadTeacherEnrollments(round){}



module.exports = {
  purgeRegisteredFromAntagna
}
