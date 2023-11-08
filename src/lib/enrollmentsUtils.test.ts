import { expect, describe, it } from "@jest/globals";

import * as enrollmentsUtils from "./enrollmentsUtils";

describe("purgeRegisteredFromAntagna", () => {
  it("should return a list of the antagna students who isnt also registered", () => {
    const registeredStudentIds = ["aaa", "bbb"];
    const antagnaStudentIds = ["aaa", "ccc"];
    const result = enrollmentsUtils.purgeRegisteredFromAntagna(
      registeredStudentIds,
      antagnaStudentIds
    );
    expect(result).toEqual(["ccc"]);
  });
});
