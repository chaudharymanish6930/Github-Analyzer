const { getUserData } = require("../services/githubService");
const { analyzeCommits } = require("../services/commitAnalyzer");

const analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const data = await getUserData(username);
    const score = analyzeCommits(data.repos);

    res.json({
      username,
      score,
      repos: data.repos.length,
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching data" });
  }
};

module.exports = { analyzeProfile };