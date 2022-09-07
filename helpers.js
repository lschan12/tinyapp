const getUserByEmail = (newEmail, database) => {
  for (let userId in database) {
    if (database[userId].email === newEmail) {
      return database[userId];
    }
  }
  return null;
};

module.exports = getUserByEmail;