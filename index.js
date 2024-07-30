const { execSync } = require('child_process');

const accessToken = process.env.GITHUB_ACCESS_TOKEN;
const commitRef = process.env.COMMIT_REF;
const repo = process.env.REPO_SLUG;
const owner = process.env.REPO_OWNER;
const bitriseStatus = process.env.BITRISE_BUILD_STATUS;
const isPending = process.env.IS_PENDING;
const buildUrl = process.env.BITRISE_BUILD_URL;
const buildNumber = process.env.BITRISE_BUILD_NUMBER;
const isBuildFailed = process.env.IS_BUILD_FAILED;

(async () => {
  if (isBuildFailed === undefined && bitriseStatus === '1') {
    execSync(`envman add --key IS_BUILD_FAILED --value true`);
  }

  console.log(`Fetching commit info for ${commitRef} on ${owner}/${repo}`);
  console.log(`URL: https://api.github.com/repos/${owner}/${repo}/commits/${commitRef}`);
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
    const state = bitriseStatus === "0"
        ? isPending === "true"
          ? "pending"
          : "success"
        : "failure";
    const description = state === "success"
      ? 'The build succeeded'
      : state === "failure"
        ? 'The build failed'
        : state === "pending"
          ? 'The build is pending'
          : 'The build failed';
        
    console.log(`Updating status for ${commitSha} to ${state} with description ${description}`);
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
        description,
      }),
    });

    if (newStatusResponse.ok) {
      console.log("Successfully updated status");
    } else {
      throw new Error("Failed to update status");
    }
  } else {
    throw new Error("Failed to get statuses and commit: " + getCommitResponse.statusText);
  }
})();
