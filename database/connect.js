const { dotenv } = require("../module");
const knex = require("knex").default({
  client: "mysql2",
  connection: {
    host: process.env.db_host,
    user: process.env.db_username,
    password: process.env.db_password,
    database: process.env.db_name,
    timezone: "asia/bangkok",
    supportBigNumbers:true,
    bigNumberStrings:true,
    typeCast: function(field, next) {
      if (field.type == 'TINY' && field.length == 1) {
          return (field.string() == '1'); // 1 = true, 0 = false
      } 
      return next();
  }
  },
});

module.exports = knex