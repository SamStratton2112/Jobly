"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");


const {
// creates three companies and three users and three jobs
  commonBeforeAll,
// We initiate the transaction that will be the test
  commonBeforeEach,
// We end our transaction of said test with rollback
  commonAfterEach,
// we stop our server 
  commonAfterAll,
// we have access to a hard coded test tokens 
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs*/

describe("POST /jobs", function () {
    const newJob = {
        title: "new",
        salary: 100,
        equity: "0.1",
        companyHandle: 'c1'
    };
  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
        job: {...newJob, id: expect.any(Number)}
    });
  });

  test("Not ok for user", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: 100
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            title: "new",
            salary: "100",
            equity: "0.1",
            companyHandle: 'c1'
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

// /************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
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
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

// /************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get("/jobs");
        let iD = resp.body.jobs[0].id;
        const job = await request(app).get(`/jobs/${iD}`)
        // expect(job.res.text).toEqual({
        //     job:
        //         {id:expect.any(Number),
        //         title:"j1",
        //         salary:1,
        //         equity:"0.1",
        //         company:{
        //             handle:"c1",
        //             name:"C1",
        //             description:"Desc1",
        //             numEmployees:1,
        //             logoUrl:"http://c1.img"}}});
        expect(job.res.text).toEqual(`{\"job\":{\"id\":${iD},\"title\":\"j1\",\"salary\":1,\"equity\":\"0.1\",\"company\":{\"handle\":\"c1\",\"name\":\"C1\",\"description\":\"Desc1\",\"numEmployees\":1,\"logoUrl\":\"http://c1.img\"}}}`);
});

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/123456`);
    expect(resp.statusCode).toEqual(404);
  });
});

// /************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const updatedJob = await request(app)
        .patch(`/jobs/${iD}`)
        .send({
          title: "Updated",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(updatedJob.res.text).toEqual(`{\"job\":{\"id\":${iD},\"title\":\"Updated\",\"salary\":1,\"equity\":\"0.1\",\"companyHandle\":\"c1"}}`);
  });

  test("Does not work for user", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const job = await request(app)
        .patch(`/jobs/${iD}`)
        .send({
          title: "fail",
        })
        .set("authorization", `Bearer ${u1Token}`);
        expect(job.statusCode).toEqual(401);
  });

  test("Does not work unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/123456`)
        .send({
          title: "fail",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "fail",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("invalid request on id", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const updatedJob = await request(app)
        .patch(`/jobs/${iD}`)
        .send({
          id: 100,
        }).set("authorization", `Bearer ${u2Token}`);
    expect(updatedJob.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const updatedJob = await request(app)
        .patch(`/jobs/${iD}`)
        .send({
          title: 100,
        }).set("authorization", `Bearer ${u2Token}`);
    expect(updatedJob.statusCode).toEqual(400);
  });
});

// /************************************** DELETE /jobs/:id */

describe("DELETE /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const job = await request(app).delete(`/jobs/${iD}`).set("authorization", `Bearer ${u2Token}`);
    expect(job.body).toEqual({ deleted: `${iD}` });
  });

  test("Does not work for users", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const job = await request(app).delete(`/jobs/${iD}`).set("authorization", `Bearer ${u1Token}`);
    expect(job.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).get("/jobs");
    let iD = resp.body.jobs[0].id;
    const job = await request(app).delete(`/jobs/${iD}`);
    expect(job.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app).delete(`/jobs/123456`).set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
