/* eslint-disable no-use-before-define */
module.exports = {
  loadMembers(groupName) {
    if (!fixtures[groupName]) {
      throw new Error(`No fixture for group name ${groupName}`);
    }
    return fixtures[groupName];
  },

  ldapBind() {},
  ldapUnbind() {},
};

const fixtures = {
  "edu.courses.F1.F1A5032.20202.1.teachers": ["uteacher1", "uteacher2"],
  "edu.courses.F1.F1A5032.20202.1.courseresponsible": ["uteacher1"],
  "edu.courses.F1.F1A5032.20202.1.assistants": ["uteacher1"],
  "edu.courses.F1.F1A5032.examiner": ["uexaminer1", "uexaminer2"],

  "ladok2.kurser.F1A.5032.registrerade_20202.1": [
    "ustudent1",
    "ustudent2",
    "ustudent3",
  ],
  "ladok2.kurser.F1A.5032.antagna_20202.1": ["ustudent1"],

  // F1A5033
  "edu.courses.F1.F1A5033.20202.1.teachers": ["uteacher1"],
  "edu.courses.F1.F1A5033.20202.1.courseresponsible": [],
  "edu.courses.F1.F1A5033.20202.1.assistants": [],
  "edu.courses.F1.F1A5033.examiner": [],

  "ladok2.kurser.F1A.5033.registrerade_20202.1": ["ustudent1", "ustudent2"],
  "ladok2.kurser.F1A.5033.antagna_20202.1": ["ustudent1"],

  // AE5042
  "edu.courses.AE.AE5042.20211.1.teachers": [],
  "edu.courses.AE.AE5042.20211.1.courseresponsible": [],
  "edu.courses.AE.AE5042.20211.1.assistants": [],
  "edu.courses.AE.AE5042.examiner": [],

  "ladok2.kurser.AE.5042.registrerade_20211.1": [],
  "ladok2.kurser.AE.5042.antagna_20211.1": [],

  // FAF3008-1
  "edu.courses.FA.FAF3008.20201.1.teachers": [],
  "edu.courses.FA.FAF3008.20201.1.courseresponsible": [],
  "edu.courses.FA.FAF3008.20201.1.assistants": [],
  "edu.courses.FA.FAF3008.examiner": [],

  "ladok2.kurser.FAF.3008.registrerade_20201.1": [],
  "ladok2.kurser.FAF.3008.antagna_20201.1": [],

  // FAF3008-2
  "edu.courses.FA.FAF3008.20201.2.teachers": [],
  "edu.courses.FA.FAF3008.20201.2.courseresponsible": [],
  "edu.courses.FA.FAF3008.20201.2.assistants": [],

  "ladok2.kurser.FAF.3008.registrerade_20201.2": [],
  "ladok2.kurser.FAF.3008.antagna_20201.2": [],
};
