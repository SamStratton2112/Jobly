const { BadRequestError } = require("../expressError");

// Data is gathered by patch request which passes username, data(req.body) to update()

// Update takes the data and passes it to the following function with 3 valuse to update: firstName, lastName, is_admin

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // take keys from req.body
  const keys = Object.keys(dataToUpdate);
  // handle no keys error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  //for each col (key name in jsToSql) use the colName as the key with the value of $1 which will +=1 for each col
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );
  // we return an array of stings that can be passed to sql
  return {
    setCols: cols.join(", "),
    // turns object into an array of all object values 
    values: Object.values(dataToUpdate)
  };
}

module.exports = { sqlForPartialUpdate };
