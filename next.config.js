/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath = isGitHubActions && repoName ? `/${repoName}` : "";

/** @type {import("next").NextConfig} */
const config = {
	output: "export",
	basePath,
	assetPrefix: basePath || undefined,
	trailingSlash: true,
	images: {
		unoptimized: true,
	},
};

export default config;
