const got = require("got");
const log = require("skog");

/** Singleton object wrapping API calls to Kopps. */
module.exports = {
  async getCourseRounds(semester) {
    let courseRounds = [];
    try {
      log.debug(`Reaching Kopps endpoint /courses/offerings for ${semester}`);
      const response = await got({
        prefixUrl: process.env.KOPPS_API_URL,
        timeout: 300 * 1000,
        url: "courses/offerings",
        responseType: "json",
        searchParams: {
          from: semester,
          skip_coordinator_info: true,
        },
      });

      courseRounds = response.body;
    } catch (err) {
      const error = new Error(
        "Error reaching Kopps endpoint /courses/offerings: " + err.message
      );
      error.code = err.code;
      error.name = err.name;
      throw error;
    }

    const cleanCourseRounds = courseRounds.filter(
      (c) =>
        c.state &&
        c.first_period &&
        c.offering_id !== undefined &&
        c.first_semester &&
        c.course_code
    );

    if (cleanCourseRounds.length < courseRounds.length) {
      log.warn(
        `Response from KOPPS: Found ${
          courseRounds.length - cleanCourseRounds.length
        } course rounds without the properties [state, first_period, offering_id, first_semester, course_code]. They will be ignored`
      );
    }

    log.debug(`KOPPS: cleanCourseRounds: ${cleanCourseRounds.length}`);

    return cleanCourseRounds
      .filter((c) => c.state === "Godkänt" || c.state === "Fullsatt")
      .map((c) => ({
        courseCode: c.course_code,
        firstYearsemester: c.first_yearsemester,
        roundId: c.offering_id,
        shortName: c.short_name,
        language: c.language,
        schoolCode: c.school_code,
        ladokUid: c.course_round_applications[0].ladok_uid,
        title: {
          sv: c.course_name,
          en: c.course_name_en,
        },
        startTerm: c.first_yearsemester,
        offeredSemesters: c.offered_semesters.map((offered) => ({
          semester: offered.semester,
          startDate: offered.start_date,
          endDate: offered.end_date,
        })),
      }));
  },
};
