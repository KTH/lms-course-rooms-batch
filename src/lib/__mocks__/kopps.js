/* eslint-disable no-use-before-define */
module.exports = {
  getCourseRounds(term) {
    if (!fixtures[term]) {
      throw new Error(`Nothing available for term ${term}`);
    }

    return fixtures[term];
  },
};

const fixtures = {
  20202: [
    {
      courseCode: "F1A5032",
      firstYearsemester: "20202",
      roundId: "1",
      language: "Engelska",
      schoolCode: "ABE",
      ladokUid: "9b0d0c43-1f45-11eb-8cc0-572d7a6040c3",
      title: {
        sv: "Högre seminarium i arkitektur, del 1",
        en: "Higher Seminars in Architecture, Part 1",
      },
      startTerm: "20202",
      offeredSemesters: [
        {
          semester: "20202",
          startDate: "2020-08-24",
          endDate: "2020-10-23",
        },
      ],
    },
    {
      courseCode: "F1A5033",
      firstYearsemester: "20202",
      roundId: "1",
      language: "Svenska",
      schoolCode: "ABE",
      ladokUid: "bb4e1176-0a27-11eb-8ba4-c0dab51d4050",
      title: {
        sv: "Högre seminarium i arkitektur, del 2",
        en: "Higher Seminars in Architecture, Part 2",
      },
      startTerm: "20202",
      offeredSemesters: [
        {
          semester: "20202",
          startDate: "2020-08-24",
          endDate: "2020-10-23",
        },
        {
          semester: "20211",
          startDate: "2021-03-22",
          endDate: "2021-06-08",
        },
      ],
    },
  ],
  20211: [
    {
      courseCode: "F1A5033",
      firstYearsemester: "20211",
      roundId: "1",
      language: "Svenska",
      schoolCode: "ABE",
      ladokUid: "1e81cd39-a7e3-11eb-ac57-8aefac1049b6",
      title: {
        sv: "Högre seminarium i arkitektur, del 2",
        en: "Higher Seminars in Architecture, Part 2",
      },
      startTerm: "20202",
      offeredSemesters: [
        {
          semester: "20202",
          startDate: "2020-08-24",
          endDate: "2020-10-23",
        },
        {
          semester: "20211",
          startDate: "2021-03-22",
          endDate: "2021-06-08",
        },
      ],
    },
    {
      courseCode: "AE5042",
      firstYearsemester: "20211",
      roundId: "1",
      language: "Svenska",
      schoolCode: "ABE",
      ladokUid: "c4f5bea2-0fb1-11ec-b333-2f4ecb82462b",
      title: {
        sv: "Individuell läskurs: Arkitektur",
        en: "Individual Literature Course: Architecture",
      },
      startTerm: "20211",
      offeredSemesters: [
        {
          semester: "20211",
          startDate: "2021-03-22",
          endDate: "2021-06-08",
        },
      ],
    },
  ],
  20212: [
    {
      courseCode: "FAF3008",
      firstYearsemester: "20212",
      roundId: "2",
      language: "Engelska",
      schoolCode: "ABE",
      ladokUid: "b17ec3b9-cd04-11eb-86ba-df57e5f44566",
      title: {
        sv: "Forskning inom byggvetenskapen",
        en: "Research within Civil and Architectural Engineering",
      },
      startTerm: "20212",
      offeredSemesters: [
        {
          semester: "20212",
          startDate: "2021-08-30",
          endDate: "2021-10-29",
        },
      ],
    },
    {
      courseCode: "FAF3008",
      firstYearsemester: "20212",
      roundId: "1",
      language: "Engelska",
      schoolCode: "ABE",
      ladokUid: "a77ad435-cd04-11eb-86ba-df57e5f44566",
      title: {
        sv: "Forskning inom byggvetenskapen",
        en: "Research within Civil and Architectural Engineering",
      },
      startTerm: "20212",
      offeredSemesters: [
        {
          semester: "20212",
          startDate: "2021-11-01",
          endDate: "2022-01-17",
        },
      ],
    },
  ],
  20221: [],
};
