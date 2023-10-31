/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
import log from "skog";
import CanvasApi from "@kth/canvas-api";

let canvasApi: CanvasApi;
if (process.env.NODE_ENV === "test") {
  log.info("NOTE: Not instantiating canvas api since this is a test!");
} else {
  canvasApi = new CanvasApi(
    process.env.CANVAS_API_URL,
    process.env.CANVAS_API_TOKEN
  );
}

interface SisImportBody {
  id: string;
}

// The following id:s are taken from the roles in Canvas, found here: https://canvas.kth.se/api/v1/accounts/1/roles?per_page=100
export const Roles = {
  ANTAGEN_STUDENT: 25,
  REGISTERED_STUDENT: 164,
  TEACHER: 4,
  COURSE_RESPONSIBLE: 9,
  TEACHER_ASSISTANT: 5,
  EXAMINER: 10,
} as const;

export async function uploadCsvZip(fileName) {
  return canvasApi.sendSis<SisImportBody>("accounts/1/sis_imports", fileName);
}

/** Return enrolled people as "Admitted not registered student" in a given section SIS ID */
export async function getAntagna(sectionSisId) {
  try {
    const enrollments = (await canvasApi
      .listItems(`sections/sis_section_id:${sectionSisId}/enrollments`, {
        role_id: [25],
      })
      .toArray()) as any[];

    return enrollments.filter((e) => e.sis_user_id).map((e) => e.sis_user_id);
  } catch (err) {
    if (err.response && err.response.statusCode === 404) {
      log.info(`CANVAS: section ${sectionSisId} not found`);
      return [];
    }
    throw err;
  }
}
