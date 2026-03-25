const { analyzeWithAI } = require("./aiAnalyzer");

const analyzeCommits = async (commits) => {
  let good = 0;
  let bad = 0;

  for (let c of commits) {
    const msg = c.commit.message;

    // 🔥 small filter (fast)
    if (msg.length < 5) {
      bad++;
      continue;
    }

    const result = await analyzeWithAI(msg);

    if (result.toLowerCase().includes("good")) {
      good++;
    } else {
      bad++;
    }
  }

  return {
    good,
    bad,
    total: commits.length
  };
};

module.exports = { analyzeCommits };