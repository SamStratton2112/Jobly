"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * 
   *Filters optional (minEmployees, maxEmployees, name)
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    let query =`SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
                FROM companies`
    const {minEmployees, maxEmployees, name} = filters;
    let whereDetails = [];
    let queryDetails = [];

    // Throw error is max is greater than min
    if(minEmployees > maxEmployees){
      throw new BadRequestError("Min employees must be less than max employees!");
    }
    // If there is a value for minEmployees, push the value to queryDetails and then push the $(length totalused as index num) to whereDetails 
    if(minEmployees !== undefined){
      queryDetails.push(minEmployees);
      whereDetails.push(`num_employees >= $${queryDetails.length}`);
    }
    // If there is a value for maxEmployees, push the value to queryDetails and then push the $(length total used as index num) to whereDetails 
    if (maxEmployees !== undefined) {
      queryDetails.push(maxEmployees);
      whereDetails.push(`num_employees <= $${queryDetails.length}`);
    }
    // If there is a value for name, push the value to queryDetails and then push the $(length used as index num) to whereDetails 
    if (name) {
      queryDetails.push(`%${name}%`);
      whereDetails.push(`name ILIKE $${queryDetails.length}`);
    }
    // if whereDetails has values then include them joined by space AND space. 
    if (whereDetails.length > 0) {
      query += " WHERE " + whereDetails.join(" AND ");
    }
    // query the correct where details
    const companiesRes = await db.query(query, queryDetails);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const coJobs = await db.query(
      `SELECT id,title,salary,equity,company_handle AS companyHandle
      FROM jobs
      WHERE company_handle = $1`,
      [handle]
    );
    const jobs = coJobs.rows
    const company = companyRes.rows[0];
    if (!company) throw new NotFoundError(`No company: ${handle}`);
    const co = {...company, jobs}

    return co;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    let handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
