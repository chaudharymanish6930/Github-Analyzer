const analyzeCommits = (commits) => {
  let good = 0;
  let bad = 0;

  commits.forEach(c => {
    const msg = c.commit.message.toLowerCase();

    if (msg.length > 15) good++;
    else bad++;
  });

  return { good, bad, total: commits.length };
};

module.exports = { analyzeCommits };