const bcrypt = require("bcrypt");

function validPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function genPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}

module.exports = {
  genPassword,
  validPassword,
};
