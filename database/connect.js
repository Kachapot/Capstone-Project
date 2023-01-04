const { dotenv } = require("../module");

const knex = require("knex").default({
  client: "mysql",
  connection: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_adminsystem',
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