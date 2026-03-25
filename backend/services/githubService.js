const axios = require("axios");

const getUserData = async (username) => {
  const user = await axios.get(`https://api.github.com/users/${username}`);
  const repos = await axios.get(user.data.repos_url);

  return {
    user: user.data,
    repos: repos.data,
  };
};

module.exports = { getUserData };