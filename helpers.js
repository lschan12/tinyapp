const getUserByEmail = (newEmail, database) => {
  for (let userId in database) {
    if (database[userId].email === newEmail) {
      return database[userId];
    }
  }
  return null;
};

const generateRandomString = () => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const urlsForUser = (userId, database) => {
  let output = {};
  for (let url of Object.keys(database)) {
    if (database[url].userId === userId) {
      output[url] = database[url];
    }
  }
  return output;
};


const includesUniqueView = (uniqueId, uniqueViews) => {
  for (let view of uniqueViews) {
    if (view["uniqueId"] === uniqueId) {
      return true;
    }
  }
  return false;
};

module.exports = { getUserByEmail, generateRandomString, urlsForUser, includesUniqueView };