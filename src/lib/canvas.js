/**
 * Singleton object, wrapping `@kth/canvas-api`. Exposes specific functions for this app.
 */
const log = require('skog')
const CanvasApi = require('@kth/canvas-api')
const csv = require('fast-csv')
const tempy = require('tempy')
const fs = require('fs')
const Joi = require('@hapi/joi')

const canvasApi = CanvasApi(
  process.env.CANVAS_API_URL,
  process.env.CANVAS_API_TOKEN
)

const enrollmentSchema = Joi.object().keys({
  user_id: Joi.required(),
  section_id: Joi.required(),
  status: Joi.required(),
  role_id: Joi.required()
})

/** Normalize the enrollments array to fit the schema */
function normalizeEnrollments (enrollments) {
  return enrollments
    .filter(
      e => enrollmentSchema.validate(e, { stripUnknown: true }).error === null
    )
    .map(e => enrollmentSchema.validate(e, { stripUnknown: true }).value)
}

module.exports = {
  normalizeEnrollments,

  /** Return enrolled people as "Admitted not registered student" in a given section SIS ID */
  async getAntagna (sectionSisId) {
    const enrollments = await canvasApi
      .list(`/sections/sis_section_id:${sectionSisId}/enrollments`, {
        role_id: [25]
      })
      .toArray()

    const cleanedEnrollments = enrollments
      .filter(e => e.sis_user_id)
      .map(e => ({ sis_user_id: e.sis_user_id }))

    if (enrollments.length > cleanedEnrollments.length) {
      log.warn(
        `CANVAS: There are ${enrollments.length -
          cleanedEnrollments.length} people without SIS ID enrolled as "antagna" in section [${sectionSisId}]`
      )
    }

    return cleanedEnrollments
  },

  /** Send enrollments to Canvas using a CSV file */
  async sendEnrollments (enrollments) {
    const normalized = normalizeEnrollments(enrollments)

    if (enrollments.length > normalized.length) {
      log.error(
        `SIS IMPORT: There are ${enrollments.length -
          normalized.length} enrollments that are not going to be sent to Canvas due to incorrect formatting. Please check what you send to "Canvas.sendEnrollments"`
      )
    }

    const file = tempy.file({ name: 'lms-antagna-enrollments.csv' })
    const writer = fs.createWriteStream(file)
    log.debug(`SIS IMPORT: Created tmp file [${file}]`)

    const stream = csv.format({ headers: true })
    stream.pipe(writer)

    normalized.forEach(e => stream.write(e))
    stream.end()

    await new Promise((resolve, reject) => {
      writer.on('error', reject)
      writer.on('finish', resolve)
    })

    log.debug(`SIS IMPORT: File [${file}] ready to be sent to Canvas`)

    const { body: response } = await canvasApi.sendSis(
      '/accounts/1/sis_imports',
      file
    )
    const url = `${process.env.CANVAS_API_URL}/accounts/1/sis_imports/${
      response.id
    }`
    log.info(
      `SIS IMPORT: correctly created with ID [${response.id}]. Details: ${url}`
    )
  }
}
