module.exports = class Period {
  /**
   * @param {object} obj
   * @param {number} obj.year Year
   * @param {string} obj.term "HT" or "VT"
   * @param {number} obj.period
   */
  constructor ({ year, term, period }) {
    if (period > 5) {
      throw new Error(
        `Wrong format. Period [P${period}] does not exist. Should be from 0 to 5`
      )
    }

    if (Period.getTerm(period) !== term) {
      throw new Error(
        `Wrong format. [${term}-P${period}] does not exist. Valids are HT-P0, HT-P1, HT-P2, VT-P3, VT-P4, VT-P5`
      )
    }

    this.year = year
    this.term = term
    this.period = period
  }

  /** Alternative constructor from a String instead of passing "year", "term", "period" */
  static fromString (str) {
    const matching = str.match(/^(\d{4})-(VT|HT)-P(\d)$/)

    if (!matching) {
      throw new Error(
        'Wrong format. String must be formatted as "YYYY-TT-PP" (example: "2019-VT-P3")'
      )
    }

    const [, year, term, period] = matching

    return new Period({
      year: parseInt(year, 10),
      term,
      period: parseInt(period, 10)
    })
  }

  /** Get the term associated with a period number */
  static getTerm (periodNumber) {
    if (periodNumber <= 2) {
      return 'HT'
    } else {
      return 'VT'
    }
  }

  /**
   * Get a range of periods between (period - startOffset) and (period + endOffset)
   * @param {Period} period
   */
  static range (period, startOffset, endOffset) {
    const length = endOffset - startOffset + 1
    const offsets = Array.from({ length }, (x, i) => i + startOffset)

    return offsets.map(v => period.add(v))
  }

  /** Return a string representation of the Period */
  toString () {
    return `${this.year}-${this.term}-P${this.period}`
  }

  /** Return the Period in "<year><term>" format (where term is 1 or 2) */
  toKoppsTermString () {
    const koppsTerm = this.term === 'VT' ? 1 : 2

    return `${this.year}${koppsTerm}`
  }

  /** Return the Period in "<year><term><period>" format (where term is 1 or 2) */
  toKoppsPeriodString () {
    const koppsTerm = this.term === 'VT' ? 1 : 2

    return `${this.year}${koppsTerm}P${this.period}`
  }

  /** Return the next period */
  next () {
    let newYear = this.year
    let newPeriod = this.period + 1

    if (newPeriod === 3) {
      newYear = newYear + 1
    }

    if (newPeriod === 6) {
      newPeriod = 0
    }

    return new Period({
      year: newYear,
      term: Period.getTerm(newPeriod),
      period: newPeriod
    })
  }

  /** Return the previous period */
  prev () {
    let newYear = this.year
    let newPeriod = this.period - 1

    if (newPeriod === 2) {
      newYear = newYear - 1
    }

    if (newPeriod === -1) {
      newPeriod = 5
    }

    return new Period({
      year: newYear,
      term: Period.getTerm(newPeriod),
      period: newPeriod
    })
  }

  /** Add "n" periods to the Period
   * @returns {Period}
   */
  add (n) {
    if (n > 0) {
      return this.next().add(n - 1)
    } else if (n < 0) {
      return this.prev().add(n + 1)
    }

    return this
  }
}
