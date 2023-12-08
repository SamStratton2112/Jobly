const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", ()=>{
    test("works 3 items ", ()=>{
        const data = {
            firstName : "test111",
            lastName : "test111",
            email : "test@test111.com"
        };
        const result = sqlForPartialUpdate(data, {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin",
          });

          expect(result).toEqual({
            setCols: `\"first_name\"=$1, "\last_name\"=$2, "\email\"=$3`,
            values: ['test111', 'test111', 'test@test111.com']
          });
    })
})