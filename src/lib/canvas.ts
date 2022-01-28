/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
import log from "skog";
import CanvasApi from "@kth/canvas-api";

const canvasApi = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
);

interface SisImportBody {
  id: string;
}
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
