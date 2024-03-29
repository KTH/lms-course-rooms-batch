import got from "got";
import log from "skog";

class KoppsError extends Error {
  code: number;
}

export interface KoppsRound {
  courseCode: string;
  firstYearsemester: string;
  roundId: string;
  shortName: string;
  language: string;
  schoolCode: string;
  ladokUid: string;
  applicationCode: string;
  title: {
    sv: string;
    en: string;
  };
  startTerm: string;
  offeredSemesters: {
    semester: string;
    startDate: string;
    endDate: string;
  }[];
}

/** Singleton object wrapping API calls to Kopps. */
export async function getCourseRounds(term): Promise<KoppsRound[]> {
  let courseRounds = [];
  try {
    log.debug(`Reaching Kopps endpoint /courses/offerings for ${term}`);
    const response = await got({
      prefixUrl: process.env.KOPPS_API_URL,
      timeout: 300 * 1000,
      url: "courses/offerings",
      responseType: "json",
      searchParams: {
        from: term,
        skip_coordinator_info: true,
      },
    });

    courseRounds = response.body as [];
  } catch (err) {
    const error = new KoppsError(
      "Error reaching Kopps endpoint /courses/offerings: " + err.message
    );
    error.code = err.code;
    error.name = err.name;
    throw error;
  }

  const cleanCourseRounds = courseRounds
    .filter((c) => c.state)
    .filter((c) => c.first_period)
    .filter((c) => c.offering_id !== undefined)
    .filter((c) => c.first_semester)
    .filter((c) => c.course_code);

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
      applicationCode:
        c.course_round_applications[0].course_round_application_code,
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
}
