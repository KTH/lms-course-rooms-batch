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
