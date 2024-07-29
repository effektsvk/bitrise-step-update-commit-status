const accessToken = process.env.GITHUB_ACCESS_TOKEN;
const commitRef = process.env.COMMIT_REF;
const repo = process.env.REPO_NAME;
const owner = process.env.REPO_OWNER;
const bitriseStatus = process.env.BITRISE_BUILD_STATUS;
const buildUrl = process.env.BITRISE_BUILD_URL;
const buildNumber = process.env.BITRISE_BUILD_NUMBER;

(async () => {
  const getCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${commitRef}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.sha',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (getCommitResponse.ok) {
    const commitSha = await getCommitResponse.text();
    const state = bitriseStatus === "0" ? "success" : "failure";

    const newStatusResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/statuses/${commitSha}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        target_url: buildUrl,
        context: `ci/bitrise/${buildNumber}`,
        state,
        description: state === "success" ? 'The build succeeded' : 'The build failed',
      }),
    });

    if (newStatusResponse.ok) {
      console.log("Successfully updated status");
    } else {
      throw new Error("Failed to update status");
    }
  } else {
    throw new Error("Failed to get statuses and commit");
  }
})();
