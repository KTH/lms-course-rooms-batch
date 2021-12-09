const { expect, describe, it } = require("@jest/globals");

const enrollmentsUtils = require("./enrollmentsUtils");

describe("purgeRegisteredFromAntagna", () => {
  it("should return a list of the antagna students who isnt also registered", () => {
    // (registeredStudentIds, antagnaStudentIds){
    const registeredStudentIds = ["aaa", "bbb"];
    const antagnaStudentIds = ["aaa", "ccc"];
    const result = enrollmentsUtils.purgeRegisteredFromAntagna(
      registeredStudentIds,
      antagnaStudentIds
    );
    expect(result).toEqual(["ccc"]);
  });
});

describe("loadTeacherEnrollments integration test", () => {
  // NOTE: this test is an integration test. Consider moving it somewhere else
  it("should get the correct members given a course round", async () => {
    require("dotenv").config();
    const ug = require("./ug");

    await ug.ldapBind();
    const enrollments = await enrollmentsUtils.loadTeacherEnrollments({
      courseCode: "F1A5032",
      startTerm: "20202",
      roundId: "1",
      sisId: "F1A5032HT201",
    });

    expect(enrollments).toMatchInlineSnapshot(`
      Array [
        Object {
          "role_id": 4,
          "section_id": "F1A5032HT201",
          "status": "active",
          "user_id": "u11q004q",
        },
        Object {
          "role_id": 4,
          "section_id": "F1A5032HT201",
          "status": "active",
          "user_id": "u123h1kw",
        },
        Object {
          "role_id": 9,
          "section_id": "F1A5032HT201",
          "status": "active",
          "user_id": "u123h1kw",
        },
        Object {
          "role_id": 5,
          "section_id": "F1A5032HT201",
          "status": "active",
          "user_id": "u1txgj5h",
        },
        Object {
          "role_id": 10,
          "section_id": "F1A5032HT201",
          "status": "active",
          "user_id": "u123h1kw",
        },
      ]
    `);
    await ug.ldapUnbind();
  }, 10000);
});
