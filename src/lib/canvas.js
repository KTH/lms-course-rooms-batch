/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
const log = require("skog");
const CanvasApi = require("@kth/canvas-api");

const canvasApi = new CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
);

async function uploadCsvZip(fileName) {
  return canvasApi.sendSis("accounts/1/sis_imports", fileName);
}

module.exports = {
  uploadCsvZip,
  /** Return enrolled people as "Admitted not registered student" in a given section SIS ID */
  async getAntagnaToDelete(sectionSisId) {
    try {
      const enrollments = await canvasApi
        .list(`sections/sis_section_id:${sectionSisId}/enrollments`, {
          role_id: [25],
        })
        .toArray();

      const cleanedEnrollments = enrollments
        .filter((e) => e.sis_user_id)
        .map((e) => ({
          section_id: sectionSisId,
          user_id: e.sis_user_id,
          role_id: 25,
          status: "deleted",
        }));

      if (enrollments.length > cleanedEnrollments.length) {
        log.warn(
          `CANVAS: There are ${
            enrollments.length - cleanedEnrollments.length
          } people without SIS ID enrolled as "antagna" in section [${sectionSisId}]`
        );
      }

      return cleanedEnrollments;
    } catch (err) {
      if (err.response && err.response.statusCode === 404) {
        log.info(`CANVAS: section ${sectionSisId} not found`);
        return [];
      }
      throw err;
    }
  },
};
