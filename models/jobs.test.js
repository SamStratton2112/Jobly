"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 100,
    equity: "0.1",
    companyHandle: 'c1'
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
           title: "new",
           salary: 100,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
        {
           title: "j1",
           salary: 1,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
        },
        {
           title: "j2",
           salary: 20,
           equity: "0.2",
           companyHandle: 'c2',
           id: expect.any(Number)
        },
        {
            title: "j3",
            salary: 300,
            equity: "0.3",
            companyHandle: 'c3',
            id: expect.any(Number)
        }
    ]);
  });
  test("works: by min salary", async function () {
    let jobs = await Job.findAll({ minSalary: 250 });
    expect(jobs).toEqual([
        {
            title: "j3",
            salary: 300,
            equity: "0.3",
            companyHandle: 'c3',
            id: expect.any(Number)
        }
    ]);
  });

  test("works: by equity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
        {
            title: "j1",
            salary: 1,
            equity: "0.1",
            companyHandle: 'c1',
            id: expect.any(Number)
         },
         {
            title: "j2",
            salary: 20,
            equity: "0.2",
            companyHandle: 'c2',
            id: expect.any(Number)
         },
         {
             title: "j3",
             salary: 300,
             equity: "0.3",
             companyHandle: 'c3',
             id: expect.any(Number)
         }
    ]);
  });

  test("works: by min salary & equity", async function () {
    let jobs = await Job.findAll({ minSalary: 150, hasEquity: true });
    expect(jobs).toEqual([
         {
             title: "j3",
             salary: 300,
             equity: "0.3",
             companyHandle: 'c3',
             id: expect.any(Number)
         }
    ]);
  });
});


/************************************** get */

describe("get", function () {
    const newJob = {
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: 'c1'
      };
  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
           title: "new",
           salary: 100,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
    });
    let jobRes = await Job.get(job.id);
    expect(jobRes).toEqual({
        title: "new",
        salary: 100,
        equity: "0.1",
        id: expect.any(Number),
        company: {
            description: "Desc1",
            handle: "c1",
            logoUrl: "http://c1.img",
            name: "C1",
            numEmployees: 1,
        }
      })
    });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
    let newJob = {
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: 'c1'
      };
    let updateData = {
        title: "New",
        salary: 10,
        equity: "0.11",
  };
  test("works", async function () {
    let j = await Job.create(newJob);
    expect(j).toEqual({
           title: "new",
           salary: 100,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
    });
    let job = await Job.update(j.id, updateData);
    expect(job).toEqual({
      id: j.id,
      companyHandle: "c1",
      ...updateData,
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, {
        title: "test",
      });
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
        let j = await Job.create(newJob);
        expect(j).toEqual({
           title: "new",
           salary: 100,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
        });
      await Job.update(j.id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
    let newJob = {
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: 'c1'
      };
  test("works", async function () {
    let j = await Job.create(newJob);
        expect(j).toEqual({
           title: "new",
           salary: 100,
           equity: "0.1",
           companyHandle: 'c1',
           id: expect.any(Number)
        });
    await Job.remove(j.id);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [j.id]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
