"user strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/* Related functions for jobs*/

class Job {
    /**Create a job, update db, return new job
     * 
     * data sould be {title, salary, equity, company_handle}
     * 
     * returns {id, title, salary, equity, company_handle}
     * 
     * throw bad error request if job already exists 
     */
    static async create({title, salary, equity, companyHandle}){
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
           [title, salary, equity, companyHandle]
        )
        const job = result.rows[0];
        console.log(job)
        return job
    }
    /**Find all Jobs.
     * 
     * optional filters: 
     * - title
     * - minSalary
     * - hasEquity
     * 
     * returns [{id, title, salary, equity, company_handle}, ...]
     */
    static async findAll({ minSalary, hasEquity, title } = {}){
        let query = 
            `SELECT id,
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs`;
        let whereDetails = [];
        let queryDetails = [];

        // if a filter exists, add it to where details/ query details
        
        if(title !== undefined){
            queryDetails.push(`%${title}%`);
            whereDetails.push(`title ILIKE $${queryDetails.length}`);
        }
        if(minSalary !== undefined){
            queryDetails.push(minSalary);
            whereDetails.push(`salary >= $${queryDetails.length}`);
        }
        if(hasEquity === true){
            whereDetails.push(`equity > 0`);
        }
        if (whereDetails.length > 0) {
            query += " WHERE " + whereDetails.join(" AND ");
          }
      
        const allJobs = await db.query(query, queryDetails);
        return allJobs.rows;
    }
    /** Given  a job id, return information about said job
     * 
     * returns {id, title, salary, equity, company_handle}
     * where company is { handle, name, description, numEmployees, logoUrl }
     * 
     * throws NotFoundError if not found
    */
   static async get(id){
        const jobRes = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        const company = await db.query(
            `SELECT handle, 
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`, 
            [job.companyHandle]
            );
        delete job.companyHandle;
         job.company = company.rows[0];

        return job;
   }
   /** Update job data with `data`.
   * Only changes provided feilds.
   * Data can include: {title, salary, equity}
   * Returns {id, title, salary, equity, company_handle}
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity"
        });
    let jobVarIdx = "$" + (values.length + 1);
    const query =   `UPDATE jobs 
                    SET ${setCols} 
                    WHERE id = ${jobVarIdx}
                    RETURNING id, 
                    title, 
                    salary, 
                    equity, 
                    company_handle AS "companyHandle"`
    const result = await db.query(query, [...values, id ]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job with id: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No Job with id: ${id}`);
  }
}


module.exports = Job;
