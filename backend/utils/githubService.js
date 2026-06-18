const { cachedRequest } = require('../config/github');

const GitHubService = {
  // Fetch user profile
  async getUser(username) {
    return cachedRequest(`/users/${username}`);
  },

  // Fetch all repositories (paginated)
  async getAllRepos(username) {
    let allRepos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const repos = await cachedRequest(`/users/${username}/repos`, {
        per_page: perPage,
        page,
        sort: 'updated',
        type: 'owner'
      });

      allRepos = allRepos.concat(repos);
      if (repos.length < perPage) break;
      page++;
      if (page > 10) break; // Safety cap at 1000 repos
    }

    return allRepos;
  },

  // Fetch single repo
  async getRepo(owner, repo) {
    return cachedRequest(`/repos/${owner}/${repo}`);
  },

  // Fetch repo languages breakdown
  async getRepoLanguages(owner, repo) {
    return cachedRequest(`/repos/${owner}/${repo}/languages`);
  },

  // Fetch repo contributors
  async getRepoContributors(owner, repo) {
    return cachedRequest(`/repos/${owner}/${repo}/contributors`, { per_page: 10 });
  },

  // Fetch commit activity (last year, weekly)
  async getCommitActivity(owner, repo) {
    return cachedRequest(`/repos/${owner}/${repo}/stats/commit_activity`);
  },

  // Compute analytics from repos array
  computeAnalytics(repos) {
    const languages = {};
    let totalStars = 0;
    let totalForks = 0;
    let totalWatchers = 0;
    let totalSize = 0;
    const reposByYear = {};

    repos.forEach(repo => {
      totalStars += repo.stargazers_count || 0;
      totalForks += repo.forks_count || 0;
      totalWatchers += repo.watchers_count || 0;
      totalSize += repo.size || 0;

      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      if (repo.created_at) {
        const year = new Date(repo.created_at).getFullYear();
        reposByYear[year] = (reposByYear[year] || 0) + 1;
      }
    });

    const totalLangCount = Object.values(languages).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / totalLangCount) * 100)
      }));

    const mostStarred = [...repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map(r => ({ name: r.name, stars: r.stargazers_count, language: r.language }));

    return { totalStars, totalForks, totalWatchers, totalSize, languages, topLanguages, reposByYear, mostStarred };
  },

  // Format repo for API response
  formatRepo(repo) {
    return {
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      open_issues_count: repo.open_issues_count,
      size: repo.size,
      default_branch: repo.default_branch,
      topics: repo.topics || [],
      is_fork: repo.fork,
      is_archived: repo.archived,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      pushed_at: repo.pushed_at,
      license: repo.license?.name || null,
      visibility: repo.visibility
    };
  }
};

module.exports = GitHubService;
