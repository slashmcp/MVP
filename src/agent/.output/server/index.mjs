globalThis.__nitro_main__ = import.meta.url;
import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { a as NodeResponse, i as toEventHandler, n as HTTPError, o as serve, r as defineHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { i as withoutTrailingSlash, n as joinURL, r as withLeadingSlash, t as decodePath } from "./_libs/ufo.mjs";
import { a as dispatchChannelRequest, c as s, i as agent_exports, l as installBundledCompiledArtifacts, n as get_clients_exports, o as handleAgentInfoRequest, r as eve_exports, s as health_default$1, t as POST, u as handleHomePageRequest } from "./_libs/eve.mjs";
import { promises } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
//#region #eve-route-handler/GET /
var GET__default = handleHomePageRequest;
//#endregion
//#region #eve-route-handler/GET /eve/v1/health
var health_default = health_default$1;
//#endregion
//#region #eve-route/eve/v1/info
var info_default = async (event) => handleAgentInfoRequest({
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false,
	"mode": "production"
}, event.req);
//#endregion
//#region #nitro/virtual/eve-channel/GET /eve/v1/connections/:name/callback/:token
const config$5 = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var _token_default$2 = (event) => dispatchChannelRequest(event, "GET /eve/v1/connections/:name/callback/:token", config$5);
//#endregion
//#region #nitro/virtual/eve-channel/POST /eve/v1/connections/:name/callback/:token
const config$4 = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var _token_default$1 = (event) => dispatchChannelRequest(event, "POST /eve/v1/connections/:name/callback/:token", config$4);
//#endregion
//#region #nitro/virtual/eve-channel/POST /eve/v1/callback/:token
const config$3 = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var _token_default = (event) => dispatchChannelRequest(event, "POST /eve/v1/callback/:token", config$3);
//#endregion
//#region #nitro/virtual/eve-channel/POST /eve/v1/session
const config$2 = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var session_default = (event) => dispatchChannelRequest(event, "POST /eve/v1/session", config$2);
//#endregion
//#region #nitro/virtual/eve-channel/POST /eve/v1/session/:sessionId
const config$1 = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var _sessionId_default = (event) => dispatchChannelRequest(event, "POST /eve/v1/session/:sessionId", config$1);
//#endregion
//#region #nitro/virtual/eve-channel/GET /eve/v1/session/:sessionId/stream
const config = {
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"dev": false
};
var stream_default = (event) => dispatchChannelRequest(event, "GET /eve/v1/session/:sessionId/stream", config);
//#endregion
//#region .eve/nitro/workflow/workflows-handler.mjs
var workflows_handler_default = async ({ req }) => {
	return await POST(req);
};
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {};
//#endregion
//#region #nitro/virtual/public-assets-node
function readAsset(id) {
	const serverDir = dirname(fileURLToPath(globalThis.__nitro_main__));
	return promises.readFile(resolve(serverDir, public_assets_data_default[id].path));
}
//#endregion
//#region #nitro/virtual/public-assets
const publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
function getAsset(id) {
	return public_assets_data_default[id];
}
//#endregion
//#region ../../node_modules/nitro/dist/runtime/internal/static.mjs
const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = {
	gzip: ".gz",
	br: ".br",
	zstd: ".zst"
};
var static_default = defineHandler((event) => {
	if (event.req.method && !METHODS.has(event.req.method)) return;
	let id = decodePath(withLeadingSlash(withoutTrailingSlash(event.url.pathname)));
	let asset;
	const encodings = [...(event.req.headers.get("accept-encoding") || "").split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(), ""];
	for (const encoding of encodings) for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
		const _asset = getAsset(_id);
		if (_asset) {
			asset = _asset;
			id = _id;
			break;
		}
	}
	if (!asset) {
		if (isPublicAssetURL(id)) {
			event.res.headers.delete("Cache-Control");
			throw new HTTPError({ status: 404 });
		}
		return;
	}
	if (encodings.length > 1) event.res.headers.append("Vary", "Accept-Encoding");
	if (event.req.headers.get("if-none-match") === asset.etag) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	const ifModifiedSinceH = event.req.headers.get("if-modified-since");
	const mtimeDate = new Date(asset.mtime);
	if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
		event.res.status = 304;
		event.res.statusText = "Not Modified";
		return "";
	}
	if (asset.type) event.res.headers.set("Content-Type", asset.type);
	if (asset.etag && !event.res.headers.has("ETag")) event.res.headers.set("ETag", asset.etag);
	if (asset.mtime && !event.res.headers.has("Last-Modified")) event.res.headers.set("Last-Modified", mtimeDate.toUTCString());
	if (asset.encoding && !event.res.headers.has("Content-Encoding")) event.res.headers.set("Content-Encoding", asset.encoding);
	if (asset.size > 0 && !event.res.headers.has("Content-Length")) event.res.headers.set("Content-Length", asset.size.toString());
	return readAsset(id);
});
//#endregion
//#region #nitro/virtual/routing
const findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/",
		method: "GET",
		handler: toEventHandler(GET__default)
	}, $1 = {
		route: "/eve/v1/health",
		method: "GET",
		handler: toEventHandler(health_default)
	}, $2 = {
		route: "/eve/v1/info",
		method: "GET",
		handler: toEventHandler(info_default)
	}, $3 = {
		route: "/eve/v1/session",
		method: "POST",
		handler: toEventHandler(session_default)
	}, $4 = {
		route: "/.well-known/workflow/v1/flow",
		handler: toEventHandler(workflows_handler_default)
	}, $5 = {
		route: "/eve/v1/connections/:name/callback/:token",
		method: "GET",
		handler: toEventHandler(_token_default$2)
	}, $6 = {
		route: "/eve/v1/connections/:name/callback/:token",
		method: "POST",
		handler: toEventHandler(_token_default$1)
	}, $7 = {
		route: "/eve/v1/callback/:token",
		method: "POST",
		handler: toEventHandler(_token_default)
	}, $8 = {
		route: "/eve/v1/session/:sessionId",
		method: "POST",
		handler: toEventHandler(_sessionId_default)
	}, $9 = {
		route: "/eve/v1/session/:sessionId/stream",
		method: "GET",
		handler: toEventHandler(stream_default)
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		if (p === "/") {
			if (m === "GET") return { data: $0 };
		} else if (p === "/eve/v1/health") {
			if (m === "GET") return { data: $1 };
		} else if (p === "/eve/v1/info") {
			if (m === "GET") return { data: $2 };
		} else if (p === "/eve/v1/session") {
			if (m === "POST") return { data: $3 };
		} else if (p === "/.well-known/workflow/v1/flow") return { data: $4 };
		let s = p.split("/"), l = s.length;
		if (l > 1) {
			if (s[1] === "eve") {
				if (l > 2) {
					if (s[2] === "v1") {
						if (l > 3) {
							if (s[3] === "connections") {
								if (l > 5) {
									if (s[5] === "callback") {
										if (l === 7 || l === 6) {
											if (m === "GET") {
												if (l > 6) return {
													data: $5,
													params: {
														"name": s[4],
														"token": s[6]
													}
												};
											}
											if (m === "POST") {
												if (l > 6) return {
													data: $6,
													params: {
														"name": s[4],
														"token": s[6]
													}
												};
											}
										}
									}
								}
							} else if (s[3] === "callback") {
								if (l === 5 || l === 4) {
									if (m === "POST") {
										if (l > 4) return {
											data: $7,
											params: { "token": s[4] }
										};
									}
								}
							} else if (s[3] === "session") {
								if (l === 5 || l === 4) {
									if (m === "POST") {
										if (l > 4) return {
											data: $8,
											params: { "sessionId": s[4] }
										};
									}
								} else if (s[5] === "stream") {
									if (l === 6) {
										if (m === "GET") return {
											data: $9,
											params: { "sessionId": s[4] }
										};
									}
								}
							}
						}
					}
				}
			}
		}
	};
})();
const globalMiddleware = [toEventHandler(static_default)].filter(Boolean);
//#endregion
//#region ../../node_modules/nitro/dist/runtime/internal/error/prod.mjs
const errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new NodeResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
const errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region .eve/compile/compiled-artifacts-bootstrap.mjs
const moduleMap = Object.freeze({ "nodes": Object.freeze({ "__root__": Object.freeze({ "modules": Object.freeze({
	"agent.ts": agent_exports,
	"channels/eve.ts": eve_exports,
	"tools/get_clients.ts": get_clients_exports
}) }) }) });
const metadata = {
	"compile": { "moduleMap": {
		"path": ".eve/compile/module-map.mjs",
		"sha256": "839a45beaf07f226770cb535b90aed10b644da35f60b36c826e681ef54b11f23"
	} },
	"discovery": {
		"diagnostics": {
			"path": ".eve/discovery/diagnostics.json",
			"sha256": "b4e6ac8479fe4f6aba49166ecaae799826dc263454e213a74ff084e2071f81b2"
		},
		"manifest": {
			"path": ".eve/discovery/agent-discovery-manifest.json",
			"sha256": "a6949200685ab4f6b1d8948c322180aab4b246b588b521248e8aa8fc1349ccc6"
		},
		"sourceGraphHash": "156c0de1238b78bcb0cdedb9a41e722dc304e2c85111bd38e266becc26400956",
		"summary": {
			"errors": 0,
			"warnings": 1
		}
	},
	"generator": {
		"name": "eve",
		"version": "0.13.6"
	},
	"kind": "eve-compile-metadata",
	"status": "ready",
	"version": 5
};
const manifest = {
	"agentRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"appRoot": "C:\\Users\\senti\\OneDrive\\Desktop\\MVP\\recruitment-command-center\\src\\agent",
	"channels": [
		{
			"kind": "channel",
			"name": "eve",
			"logicalPath": "channels/eve.ts",
			"method": "POST",
			"urlPath": "/eve/v1/session",
			"sourceId": "channels/eve.ts",
			"sourceKind": "module",
			"adapterKind": "http"
		},
		{
			"kind": "channel",
			"name": "eve",
			"logicalPath": "channels/eve.ts",
			"method": "POST",
			"urlPath": "/eve/v1/session/:sessionId",
			"sourceId": "channels/eve.ts",
			"sourceKind": "module",
			"adapterKind": "http"
		},
		{
			"kind": "channel",
			"name": "eve",
			"logicalPath": "channels/eve.ts",
			"method": "GET",
			"urlPath": "/eve/v1/session/:sessionId/stream",
			"sourceId": "channels/eve.ts",
			"sourceKind": "module",
			"adapterKind": "http"
		}
	],
	"connections": [],
	"config": {
		"compaction": {},
		"model": {
			"id": "anthropic/claude-haiku-4-5-20251001",
			"routing": {
				"kind": "external",
				"provider": "anthropic"
			},
			"contextWindowTokens": 2e5,
			"source": {
				"sourceKind": "module",
				"logicalPath": "agent.ts",
				"sourceId": "agent.ts"
			}
		},
		"name": "agent",
		"source": {
			"sourceKind": "module",
			"logicalPath": "agent.ts",
			"sourceId": "agent.ts"
		}
	},
	"diagnosticsSummary": {
		"errors": 0,
		"warnings": 1
	},
	"disabledFrameworkTools": [],
	"workflowEnabled": false,
	"dynamicInstructions": [],
	"dynamicSkills": [],
	"dynamicTools": [],
	"hooks": [],
	"remoteAgents": [],
	"sandbox": null,
	"sandboxWorkspaces": [],
	"schedules": [],
	"skills": [{
		"description": "Instructions and templates for cross-border recruitment outreach (US to UK) ensuring confidentiality and GDPR compliance.",
		"logicalPath": "skills/recruitment_outreach.md",
		"markdown": "# Recruitment Outreach Skill\n\nThis skill provides instructions and templates for conducting confidential, cross-border recruitment outreach between the US and ION Recruitment Ltd. in Glasgow, Scotland.\n\n## Sourcing & Confidentiality Rules (The \"Hunter\")\n\n1. **Strict Data Minimization**: Never expose a candidate's full Personal Identifiable Information (PII) such as their full name, exact contact details, or current employer in initial communications.\n2. **GDPR Compliance**: Any data collected in the US and sent to the UK firm must comply with GDPR. Always include a \"Data Processing Notice\" when introducing a US candidate to the UK firm.\n3. **Anonymized Output**: When scraping or summarizing profiles, only generate a \"Match Score\" or \"Anonymized Profile Summary\".\n\n## Templates (The \"Bridge\")\n\n### 1. The \"Blind Outreach\" Template (To US Clients/Candidates)\n\n**Subject**: Confidential Opportunity: [Job Title/Niche] Role with Established UK Tech Firm\n\n**Body**:\nHi [Name],\n\nI'm reaching out confidentially on behalf of an established recruitment partner based in the UK. We are currently mapping the market for top-tier professionals in [Technology Stack / Domain] and your background stood out—specifically your experience with [Key Skill/Achievement].\n\nAt this stage, we are operating strictly on a blind basis to protect your privacy and our client's strategic initiatives. If you are open to a brief, exploratory conversation about how this cross-border opportunity could align with your career goals, please let me know. \n\nI'd be happy to share a high-level overview of the role and compensation parameters without requiring a formal commitment.\n\nBest regards,\n[Your Name]\nUS Partner, ION Recruitment Ltd.\n\n---\n\n### 2. The \"UK Intro\" Template (To Glasgow Partners)\n\n**Subject**: Pre-Introduction Summary: Strong US Candidate for [Role Name]\n\n**Body**:\nHi Team,\n\nI have identified a strong US-based candidate for the [Role Name] position. To maintain confidentiality prior to full disclosure, here is the anonymized Pre-Introduction Summary:\n\n- **Match Score**: [Score/100]\n- **Key Expertise**: [Summarize 2-3 main skills, e.g., Senior Full-Stack Developer with 8 years of React/Node.js experience]\n- **Relevant Achievements**: [Highlight 1-2 impressive metrics or project outcomes, anonymized]\n- **Market Alignment**: This candidate is an excellent fit for the UK market because [Reason, e.g., they have extensive experience working with distributed European teams and are familiar with GDPR compliance].\n\n*Data Processing Notice: Please note that upon full introduction, this candidate's data will be processed in accordance with our standard cross-border data protection agreements and GDPR guidelines.*\n\nPlease review this summary. If this profile aligns with your current client requirements, I will authorize the full connection and share their complete CV.\n\nBest regards,\n[Your Name]\nUS Partner\n",
		"name": "recruitment_outreach",
		"sourceId": "skills/recruitment_outreach.md",
		"sourceKind": "markdown"
	}],
	"tools": [{
		"description": "Fetches the client list from the ION Recruitment dashboard API",
		"inputSchema": {
			"$schema": "http://json-schema.org/draft-07/schema#",
			"type": "object",
			"properties": {}
		},
		"logicalPath": "tools/get_clients.ts",
		"name": "get_clients",
		"sourceId": "tools/get_clients.ts",
		"sourceKind": "module"
	}],
	"workspaceResourceRoot": {
		"contentHash": "543c48eed1a589ffa6691275da8e8e69aa609aff1da126dc3325b48246033fd4",
		"logicalPath": "workspace-resources/__root__",
		"rootEntries": ["skills/"]
	},
	"instructions": {
		"name": "instructions",
		"logicalPath": "instructions.md",
		"markdown": "# ION Recruitment Assistant (Eve)\n\nYou are Eve, a Sourcing and Orchestration Agent acting as the domestic US partner for ION Recruitment Ltd. (based in Glasgow, Scotland).\n\n## Your Purpose\nYour primary goal is to facilitate growth by connecting top US technical talent with UK clients confidentially and effectively.\nYou manage the cross-border workflows while adhering strictly to GDPR and confidentiality rules.\n\n## Core Capabilities\n- You can fetch the latest client lists using the `get_clients` tool.\n- You must always follow the instructions laid out in `agent/skills/recruitment_outreach.md` when proposing outreach or handling candidate data.\n\nAlways maintain a tone that aligns with ION's brand: \"professional, driven, and honest\".\n",
		"sourceId": "instructions.md",
		"sourceKind": "markdown"
	},
	"kind": "eve-agent-compiled-manifest",
	"subagentEdges": [],
	"subagents": [],
	"version": 30
};
function installCompiledArtifactsBootstrap() {
	installBundledCompiledArtifacts({
		manifest,
		metadata,
		moduleMap
	});
}
installCompiledArtifactsBootstrap();
function installCompiledArtifactsPlugin() {}
async function __eveInstallCompiledArtifactsStep() {
	return null;
}
s("step//./.eve/compile/compiled-artifacts-bootstrap//__eveInstallCompiledArtifactsStep", __eveInstallCompiledArtifactsStep);
//#endregion
//#region #nitro/virtual/plugins
const plugins = [installCompiledArtifactsPlugin];
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const hooks = new HookableCore();
	const captureError = (error, errorCtx) => {
		const promise = hooks.callHook("error", error, errorCtx)?.catch?.((hookError) => {
			console.error("Error while capturing another error", hookError);
		});
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
			if (promise && typeof errorCtx.event.req.waitUntil === "function") errorCtx.event.req.waitUntil(promise);
		}
	};
	const h3App = createH3App({ onError(error, event) {
		captureError(error, { event });
		return error_handler_default(error, event);
	} });
	h3App.config.onRequest = (event) => {
		return hooks.callHook("request", event)?.catch?.((error) => {
			captureError(error, {
				event,
				tags: ["request"]
			});
		});
	};
	h3App.config.onResponse = (res, event) => {
		return hooks.callHook("response", res, event)?.catch?.((error) => {
			captureError(error, {
				event,
				tags: ["response"]
			});
		});
	};
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks,
		captureError
	};
}
function initNitroPlugins(app) {
	for (const plugin of plugins) try {
		plugin(app);
	} catch (error) {
		app.captureError?.(error, { tags: ["plugin"] });
		throw error;
	}
	return app;
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~middleware"].push(...globalMiddleware);
	return h3App;
}
//#endregion
//#region ../../node_modules/nitro/dist/runtime/internal/app.mjs
const APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	initNitroPlugins(instance);
	return instance;
}
//#endregion
//#region ../../node_modules/nitro/dist/runtime/internal/error/hooks.mjs
function _captureError(error, type) {
	console.error(`[${type}]`, error);
	useNitroApp().captureError?.(error, { tags: [type] });
}
function trapUnhandledErrors() {
	process.on("unhandledRejection", (error) => _captureError(error, "unhandledRejection"));
	process.on("uncaughtException", (error) => _captureError(error, "uncaughtException"));
}
//#endregion
//#region #nitro/virtual/tracing
const tracingSrvxPlugins = [];
//#endregion
//#region ../../node_modules/nitro/dist/presets/node/runtime/node-server.mjs
const _parsedPort = Number.parseInt(process.env.NITRO_PORT ?? process.env.PORT ?? "");
const port = Number.isNaN(_parsedPort) ? 3e3 : _parsedPort;
const host = process.env.NITRO_HOST || process.env.HOST;
const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const nitroApp = useNitroApp();
serve({
	port,
	hostname: host,
	tls: cert && key ? {
		cert,
		key
	} : void 0,
	fetch: nitroApp.fetch,
	plugins: [...tracingSrvxPlugins]
});
trapUnhandledErrors();
var node_server_default = {};
//#endregion
export { node_server_default as default };
