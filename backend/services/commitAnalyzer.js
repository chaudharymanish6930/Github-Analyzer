const analyzeCommits = (repos) => {
  let score = 0;

  repos.forEach(repo => {
    if (repo.stargazers_count > 5) score += 10;
    if (repo.forks_count > 2) score += 5;
    if (repo.description) score += 5;
  });

  return score;
};

module.exports = { analyzeCommits };