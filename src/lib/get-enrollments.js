const log = require('skog')
const canvas = require('./canvas')
const kopps = require('./kopps')
const ug = require('./ug')

// Roles in Canvas have role_id's. 'Admitted not registered' -> role_id: 25
const antagnaRoleId = 25
/** Functions to get Canvas-ready enrollments */
module.exports = {
  /** Get an array of "unenrollments" of all antagna students in a given period */
  async toRemoveAntagna (period) {
    const courseRounds = await kopps.getCourseRounds(period)
    log.info(
      `Course rounds for un-antagna in ${period}: ${courseRounds.length}`
    )

    const allEnrollments = []
    let nRound = 0
    for (const round of courseRounds) {
      nRound++
      const progress = `${nRound}/${courseRounds.length}`.padStart(7)

      try {
        const roundEnrollments = await canvas.getAntagna(round.sis_id)
        log.debug(
          `CANVAS: ${progress}. Antagna found in [${round.sis_id.padStart(
            12
          )}] : ${roundEnrollments.length}`
        )

        for (const e of roundEnrollments) {
          allEnrollments.push({
            section_id: round.sis_id,
            user_id: e.sis_user_id,
            status: 'deleted',
            role_id: antagnaRoleId
          })
        }
      } catch (err) {
        if (err.name === 'HTTPError' && err.statusCode === 404) {
          log.warn(
            err,
            `CANVAS: ${progress}. Error. [${round.sis_id.padStart(
              12
            )}] not found`
          )
        } else {
          err.message =
            `CANVAS: Error when getting enrollments in [${round.sis_id}]: ` +
            err.message
          throw err
        }
      }
    }

    log.info(
      `CANVAS: Total antagna students in ${period}: ${allEnrollments.length}`
    )
    return allEnrollments
  },

  /** Get an array of antagna "enrollments" in a given period */
  async toAddAntagna (period) {
    const courseRounds = await kopps.getCourseRounds(period)
    log.info(
      `Course rounds for enroll antagna in ${period}: ${courseRounds.length}`
    )
    const allEnrollments = []
    let nRound = 0
    for (const round of courseRounds) {
      nRound++
      const progress = `${nRound}/${courseRounds.length}`.padStart(7)

      try {
        const kthIds = await ug.getAntagna(
          round.course_code,
          period.toKoppsTermString(),
          round.round_id
        )
        log.debug(
          `UG: ${progress}. Antagna found for [${round.sis_id.padStart(12)}]: ${
            kthIds.length
          }`
        )

        for (const id of kthIds) {
          allEnrollments.push({
            section_id: round.sis_id,
            user_id: id,
            status: 'active',
            role_id: antagnaRoleId
          })
        }
      } catch (err) {
        err.message =
          `UG: Error when getting antagna for [${round.sis_id}]: ` + err.message
        throw err
      }
    }

    log.info(`UG: Total "antagna" in ${period}: ${allEnrollments.length}`)
    return allEnrollments
  }
}
