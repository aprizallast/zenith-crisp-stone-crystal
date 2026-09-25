//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-BkF96WWd.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/api/coingecko",
			"/api/copilot",
			"/api/dex",
			"/api/inspect",
			"/api/search",
			"/api/tokens",
			"/api/artwork/$address",
			"/api/visitors/leave",
			"/api/visitors/ping"
		],
		preloads: ["/assets/index-DcnVHJHS.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-DcnVHJHS.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: ["/assets/routes-CHK8f-qW.js"]
	}
} });
//#endregion
export { tsrStartManifest };
