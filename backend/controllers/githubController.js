const { getUserData, getRepoCommits } = require("../services/githubService");
const { analyzeCommits } = require("../services/commitAnalyzer");

const analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const data = await getUserData(username);

    let allCommits = [];

    // sirf 3 repos
    for (let i = 0; i < Math.min(3, data.repos.length); i++) {
      const repo = data.repos[i];
      const commits = await getRepoCommits(username, repo.name);
      allCommits = allCommits.concat(commits);
    }

    const result = analyzeCommits(allCommits);

    res.json({
      username,
      totalRepos: data.repos.length,
      commitAnalysis: result
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching commits" });
  }
};

module.exports = { analyzeProfile };