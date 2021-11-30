module.exports = {
  mockedDate: new Date("2021-01-01T00:00:01Z"),
  getCourseRoundDataResult: [
    // start in the past
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
        { semester: "20202", startDate: "2020-12-01", endDate: "2022-10-23" },
      ],
    },
    // start in the far future
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
        { semester: "20202", startDate: "2021-07-02", endDate: "2022-10-23" },
      ],
    },
    // Start in the near future
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
        { semester: "20202", startDate: "2021-02-01", endDate: "2022-10-23" },
      ],
    },
  ],
};
