const got = require('got')
const log = require('skog')

/** Singleton object wrapping API calls to Kopps. */
module.exports = {
  async getCourseRounds (period) {
    let courseRounds = []
    try {
      log.debug(`Reaching Kopps endpoint /courses/offerings for ${period}`)
      const response = await got({
        baseUrl: process.env.KOPPS_API_URL,
        url: '/courses/offerings',
        json: true,
        query: {
          from: period.toKoppsTermString(),
          skip_coordinator_info: true
        }
      })

      courseRounds = response.body
    } catch (err) {
      err.message =
        'Error reaching Kopps endpoint /courses/offerings: ' + err.message
      throw err
    }

    const cleanCourseRounds = courseRounds
      .filter(c => c.state)
      .filter(c => c.first_period)
      .filter(c => c.offering_id !== undefined)
      .filter(c => c.first_semester)
      .filter(c => c.course_code)

    if (cleanCourseRounds.length < courseRounds.length) {
      log.warn(
        `Response from KOPPS: Found ${courseRounds.length -
          cleanCourseRounds.length} course rounds without the properties [state, first_period, offering_id, first_semester, course_code]. They will be ignored`
      )
    }

    log.debug(`KOPPS: cleanCourseRounds: ${cleanCourseRounds.length}`)

    return cleanCourseRounds
      .filter(c => c.state === 'Godkänt' || c.state === 'Fullsatt')
      .filter(c => c.first_period === period.toKoppsPeriodString())
      .map(c => ({
        course_code: c.course_code,
        round_id: c.offering_id,
        sis_id: `${c.course_code}${c.first_semester}${c.offering_id}`
      }))
  }
}
