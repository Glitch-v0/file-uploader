import bcrypt from "bcrypt";

export function validPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function genPassword(password) {
  const saltRounds = 10;
  return bcrypt.hashSync(password, saltRounds);
}
