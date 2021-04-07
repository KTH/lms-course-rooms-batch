const { expect, test } = require("@jest/globals");
const Period = require("./period");

test("Period throws if given format is wrong", () => {
  expect(() => Period.fromString("2019VT-P1")).toThrow();
});

test("Period throws if the term is not valid", () => {
  // year should be 4 digits
  expect(() => Period.fromString("20-VT-P3")).toThrow();

  // Period from 6 to 9 do not exist
  expect(() => Period.fromString("2019-VT-P6")).toThrow();
  expect(() => Period.fromString("2019-VT-P7")).toThrow();
  expect(() => Period.fromString("2019-VT-P8")).toThrow();
  expect(() => Period.fromString("2019-VT-P9")).toThrow();

  // HT only matches with Periods 0, 1, 2
  expect(() => Period.fromString("2019-VT-P0")).toThrow();
  expect(() => Period.fromString("2019-VT-P1")).toThrow();
  expect(() => Period.fromString("2019-VT-P2")).toThrow();

  // VT only matches with Periods 3, 4, 5
  expect(() => Period.fromString("2019-HT-P3")).toThrow();
  expect(() => Period.fromString("2019-HT-P4")).toThrow();
  expect(() => Period.fromString("2019-HT-P5")).toThrow();
});

test("Period.previous() returns the previous period", () => {
  expect(Period.fromString("2018-VT-P4").prev().toString()).toBe("2018-VT-P3");
  expect(Period.fromString("2018-HT-P0").prev().toString()).toBe("2018-VT-P5");
  expect(Period.fromString("2018-HT-P2").prev().toString()).toBe("2018-HT-P1");
  expect(Period.fromString("2018-VT-P3").prev().toString()).toBe("2017-HT-P2");
});

test("Period.nextPeriod() returns the previous period", () => {
  expect(Period.fromString("2018-VT-P3").next().toString()).toBe("2018-VT-P4");
  expect(Period.fromString("2018-VT-P5").next().toString()).toBe("2018-HT-P0");
  expect(Period.fromString("2018-HT-P1").next().toString()).toBe("2018-HT-P2");
  expect(Period.fromString("2018-HT-P2").next().toString()).toBe("2019-VT-P3");
});

test("Period.toKoppsTermString() formats correctly", () => {
  expect(Period.fromString("2019-VT-P3").toKoppsTermString()).toBe("20191");
  expect(Period.fromString("2019-HT-P0").toKoppsTermString()).toBe("20192");
});

test("Period.toKoppsPeriodString() formats correctly", () => {
  expect(Period.fromString("2019-VT-P3").toKoppsPeriodString()).toBe("20191P3");
  expect(Period.fromString("2019-HT-P0").toKoppsPeriodString()).toBe("20192P0");
});

test("Period.add() returns the correct term", () => {
  const current = Period.fromString("2020-HT-P2");
  expect(current.add(-5).toString()).toBe("2020-VT-P3");
  expect(current.add(-4).toString()).toBe("2020-VT-P4");
  expect(current.add(-3).toString()).toBe("2020-VT-P5");
  expect(current.add(-2).toString()).toBe("2020-HT-P0");
  expect(current.add(-1).toString()).toBe("2020-HT-P1");
  expect(current.add(0).toString()).toBe("2020-HT-P2");
  expect(current.add(1).toString()).toBe("2021-VT-P3");
  expect(current.add(2).toString()).toBe("2021-VT-P4");
  expect(current.add(3).toString()).toBe("2021-VT-P5");
  expect(current.add(4).toString()).toBe("2021-HT-P0");
  expect(current.add(5).toString()).toBe("2021-HT-P1");
});

test("Period.range() returns a range of periods", () => {
  const current = Period.fromString("2020-HT-P2");
  const expected = [
    "2020-VT-P3",
    "2020-VT-P4",
    "2020-VT-P5",
    "2020-HT-P0",
    "2020-HT-P1",
    "2020-HT-P2",
    "2021-VT-P3",
    "2021-VT-P4",
    "2021-VT-P5",
    "2021-HT-P0",
    "2021-HT-P1",
  ];

  expect(Period.range(current, -5, 5).map((c) => c.toString())).toStrictEqual(
    expected
  );
});
