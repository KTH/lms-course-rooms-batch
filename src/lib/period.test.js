const Period = require('./period')
const test = require('ava')

test('Period throws if given format is wrong', t => {
  t.throws(() => Period.fromString('2019VT-P1'))
})

test('Period throws if the term is not valid', t => {
  // year should be 4 digits
  t.throws(() => Period.fromString('20-VT-P3'))

  // Period from 6 to 9 do not exist
  t.throws(() => Period.fromString('2019-VT-P6'))
  t.throws(() => Period.fromString('2019-VT-P7'))
  t.throws(() => Period.fromString('2019-VT-P8'))
  t.throws(() => Period.fromString('2019-VT-P9'))

  // HT only matches with Periods 0, 1, 2
  t.throws(() => Period.fromString('2019-VT-P0'))
  t.throws(() => Period.fromString('2019-VT-P1'))
  t.throws(() => Period.fromString('2019-VT-P2'))

  // VT only matches with Periods 3, 4, 5
  t.throws(() => Period.fromString('2019-HT-P3'))
  t.throws(() => Period.fromString('2019-HT-P4'))
  t.throws(() => Period.fromString('2019-HT-P5'))
})

// prettier-ignore
test('Period.previous() returns the previous period', t => {
  t.is(Period.fromString('2018-VT-P4').prev().toString(), '2018-VT-P3')
  t.is(Period.fromString('2018-HT-P0').prev().toString(), '2018-VT-P5')
  t.is(Period.fromString('2018-HT-P2').prev().toString(), '2018-HT-P1')
  t.is(Period.fromString('2018-VT-P3').prev().toString(), '2017-HT-P2')
})

// prettier-ignore
test('Period.nextPeriod() returns the previous period', t => {
  t.is(Period.fromString('2018-VT-P3').next().toString(), '2018-VT-P4')
  t.is(Period.fromString('2018-VT-P5').next().toString(), '2018-HT-P0')
  t.is(Period.fromString('2018-HT-P1').next().toString(), '2018-HT-P2')
  t.is(Period.fromString('2018-HT-P2').next().toString(), '2019-VT-P3')
})

test('Period.toKoppsTermString() formats correctly', t => {
  t.is(Period.fromString('2019-VT-P3').toKoppsTermString(), '20191')
  t.is(Period.fromString('2019-HT-P0').toKoppsTermString(), '20192')
})

test('Period.toKoppsPeriodString() formats correctly', t => {
  t.is(Period.fromString('2019-VT-P3').toKoppsPeriodString(), '20191P3')
  t.is(Period.fromString('2019-HT-P0').toKoppsPeriodString(), '20192P0')
})

test('Period.add() returns the correct term', t => {
  const current = Period.fromString('2020-HT-P2')
  t.is(current.add(-5).toString(), '2020-VT-P3')
  t.is(current.add(-4).toString(), '2020-VT-P4')
  t.is(current.add(-3).toString(), '2020-VT-P5')
  t.is(current.add(-2).toString(), '2020-HT-P0')
  t.is(current.add(-1).toString(), '2020-HT-P1')
  t.is(current.add(0).toString(), '2020-HT-P2')
  t.is(current.add(1).toString(), '2021-VT-P3')
  t.is(current.add(2).toString(), '2021-VT-P4')
  t.is(current.add(3).toString(), '2021-VT-P5')
  t.is(current.add(4).toString(), '2021-HT-P0')
  t.is(current.add(5).toString(), '2021-HT-P1')
})

test('Period.range() returns a range of periods', t => {
  const current = Period.fromString('2020-HT-P2')
  const expected = [
    '2020-VT-P3',
    '2020-VT-P4',
    '2020-VT-P5',
    '2020-HT-P0',
    '2020-HT-P1',

    '2020-HT-P2',

    '2021-VT-P3',
    '2021-VT-P4',
    '2021-VT-P5',
    '2021-HT-P0',
    '2021-HT-P1'
  ]

  t.deepEqual(Period.range(current, -5, 5).map(c => c.toString()), expected)
})
