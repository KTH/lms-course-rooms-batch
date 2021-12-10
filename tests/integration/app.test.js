const fs = require("fs");
const path = require("path");
const os = require("os");

const {
  describe,
  it,
  beforeEach,
  afterEach,
  expect,
} = require("@jest/globals");
const { generateFiles } = require("../../src/app");

jest.mock("../../src/lib/kopps");
jest.mock("../../src/lib/ug");
jest.mock("../../src/lib/canvas");

describe("Integration test", () => {
  let tmpDirectory;
  const mockedDate = new Date("2021-02-01T00:00:01Z");

  beforeEach(() => {});

  afterEach(() => {
    // fs.rmSync(tmpDirectory, { recursive: true, force: true });
  });

  it("should generate the right csv files", async () => {
    tmpDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "lms-course-rooms-batch-test-")
    );
    jest.useFakeTimers("modern").setSystemTime(mockedDate);

    await generateFiles(tmpDirectory);

    const courses = fs.readFileSync(path.join(tmpDirectory, "courses.csv"), {
      encoding: "utf-8",
    });
    const sections = fs.readFileSync(path.join(tmpDirectory, "sections.csv"), {
      encoding: "utf-8",
    });
    const enrollments = fs.readFileSync(
      path.join(tmpDirectory, "enrollments.csv"),
      {
        encoding: "utf-8",
      }
    );
    expect(courses).toMatchInlineSnapshot(`
      "course_id,short_name,long_name,start_date,end_date,account_id,integration_id,status
      F1A5032HT201,F1A5032HT201,\\"F1A5032 HT20-1 Higher Seminars in Architecture, Part 1\\",2020-08-24T06:00:00Z,2020-12-22,ABE - Imported course rounds,9b0d0c43-1f45-11eb-8cc0-572d7a6040c3,active
      F1A5033HT201,F1A5033HT201,\\"F1A5033 HT20-1 Högre seminarium i arkitektur, del 2\\",2020-08-24T06:00:00Z,2021-08-07,ABE - Imported course rounds,bb4e1176-0a27-11eb-8ba4-c0dab51d4050,active
      F1A5033HT201,F1A5033HT201,\\"F1A5033 HT20-1 Högre seminarium i arkitektur, del 2\\",2021-03-22T06:00:00Z,2021-08-07,ABE - Imported course rounds,1e81cd39-a7e3-11eb-ac57-8aefac1049b6,active
      AE5042VT211,AE5042VT211,AE5042 VT21-1 Individuell läskurs: Arkitektur,2021-03-22T06:00:00Z,2021-08-07,ABE - Imported course rounds,c4f5bea2-0fb1-11ec-b333-2f4ecb82462b,active"
    `);
    expect(sections).toMatchInlineSnapshot(`
      "section_id,course_id,integration_id,name,status
      F1A5032HT201,F1A5032HT201,9b0d0c43-1f45-11eb-8cc0-572d7a6040c3,\\"Section for the course F1A5032 HT20-1 Higher Seminars in Architecture, Part 1\\",active
      F1A5033HT201,F1A5033HT201,bb4e1176-0a27-11eb-8ba4-c0dab51d4050,\\"Section for the course F1A5033 HT20-1 Högre seminarium i arkitektur, del 2\\",active
      F1A5033HT201,F1A5033HT201,1e81cd39-a7e3-11eb-ac57-8aefac1049b6,\\"Section for the course F1A5033 HT20-1 Högre seminarium i arkitektur, del 2\\",active
      AE5042VT211,AE5042VT211,c4f5bea2-0fb1-11ec-b333-2f4ecb82462b,Section for the course AE5042 VT21-1 Individuell läskurs: Arkitektur,active"
    `);
    expect(enrollments).toMatchInlineSnapshot(`
      "section_id,user_id,role_id,status
      F1A5032HT201,uantagna1,25,deleted
      F1A5032HT201,uantagna2,25,deleted
      F1A5033HT201,uantagna1,25,deleted
      F1A5033HT201,uantagna3,25,deleted
      F1A5032HT201,uteacher1,4,active
      F1A5032HT201,uteacher2,4,active
      F1A5032HT201,uteacher1,9,active
      F1A5032HT201,uteacher1,5,active
      F1A5032HT201,uexaminer1,10,active
      F1A5032HT201,uexaminer2,10,active
      F1A5032HT201,ustudent1,3,active
      F1A5032HT201,ustudent1,25,deleted
      F1A5032HT201,ustudent2,3,active
      F1A5032HT201,ustudent2,25,deleted
      F1A5032HT201,ustudent3,3,active
      F1A5032HT201,ustudent3,25,deleted
      F1A5033HT201,uteacher1,4,active
      F1A5033HT201,ustudent1,3,active
      F1A5033HT201,ustudent1,25,deleted
      F1A5033HT201,ustudent2,3,active
      F1A5033HT201,ustudent2,25,deleted
      F1A5033HT201,uteacher1,4,active
      F1A5033HT201,ustudent1,3,active
      F1A5033HT201,ustudent1,25,deleted
      F1A5033HT201,ustudent2,3,active
      F1A5033HT201,ustudent2,25,deleted"
    `);
  });
});
