const axios = require("axios");

const getUserData = async (username) => {
  const user = await axios.get(`https://api.github.com/users/${username}`);
  const repos = await axios.get(user.data.repos_url);

  return {
    user: user.data,
    repos: repos.data
  };
};

// 🔥 NEW FUNCTION
const getRepoCommits = async (username, repoName) => {
  const commits = await axios.get(
    `https://api.github.com/repos/${username}/${repoName}/commits`
  );

  return commits.data;
};

module.exports = { getUserData, getRepoCommits };