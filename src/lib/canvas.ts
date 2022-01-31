/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
import log from "skog";
import CanvasApi from "@kth/canvas-api";

const canvasApi =
  process.env.CANVAS_API_URL !== undefined
    ? new CanvasApi(process.env.CANVAS_API_URL, process.env.CANVAS_API_TOKEN)
    : null;

function _checkCanvasApiAvailable() {
  const errMsg = [];
  if (canvasApi === null) {
    errMsg.push("Missing Canvas API client.");

    if (!process.env.CANVAS_API_URL) {
      errMsg.push("Env var CANVAS_API_URL has not been set.");
    }
  }
  if (errMsg.length > 0) {
    throw new Error(errMsg.join(" "));
  }
}

interface SisImportBody {
  id: string;
}
export async function uploadCsvZip(fileName) {
  _checkCanvasApiAvailable();
  return canvasApi.sendSis<SisImportBody>("accounts/1/sis_imports", fileName);
}

/** Return enrolled people as "Admitted not registered student" in a given section SIS ID */
export async function getAntagna(sectionSisId) {
  _checkCanvasApiAvailable();
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
