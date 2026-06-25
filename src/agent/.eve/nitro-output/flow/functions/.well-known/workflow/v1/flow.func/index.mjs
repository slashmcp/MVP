globalThis.__nitro_main__ = import.meta.url;
import { fileURLToPath as __eveFileURLToPath } from "node:url";
import { dirname as __eveDirname } from "node:path";
__eveDirname(__eveFileURLToPath(import.meta.url));
import { i as NodeResponse, n as HTTPError, r as toEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { a as installBundledCompiledArtifacts, i as agent_exports, n as get_clients_exports, o as s, r as eve_exports, t as POST } from "./_libs/eve.mjs";
//#region .eve/nitro/flow/workflow/workflows-handler.mjs
var workflows_handler_default = async ({ req }) => {
	return await POST(req);
};
//#endregion
//#region #nitro/virtual/routing
const findRouteRules = (m, p) => {
	return [];
};
const findRoute = /* @__PURE__ */ (() => {
	const $0 = {
		route: "/.well-known/workflow/v1/flow",
		handler: toEventHandler(workflows_handler_default)
	};
	return (m, p) => {
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		if (p === "/.well-known/workflow/v1/flow") return { data: $0 };
	};
})();
[].filter(Boolean);
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
			"sha256": "d2fef1b66c3eed91ef19e40f7a173c3b4b27b8b08b34f52495ad779b4eb1d538"
		},
		"manifest": {
			"path": ".eve/discovery/agent-discovery-manifest.json",
			"sha256": "dc56b13241445a3e3de6cf0b81fd1a22d127d7959b8d1897cf61744a90db1d82"
		},
		"sourceGraphHash": "0dedc43ff0050175d203d1957081c54ce9c1ae4c0f6ffbcc529a450c7e63ba0b",
		"summary": {
			"errors": 0,
			"warnings": 3
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
		"warnings": 3
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
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
function isrRouteRewrite(reqUrl, xNowRouteMatches) {
	if (xNowRouteMatches) {
		const isrURL = new URLSearchParams(xNowRouteMatches).get("__isr_route");
		if (isrURL) return [decodeURIComponent(isrURL), ""];
	} else {
		const queryIndex = reqUrl.indexOf("?");
		if (queryIndex !== -1) {
			const params = new URLSearchParams(reqUrl.slice(queryIndex + 1));
			const isrURL = params.get("__isr_route");
			if (isrURL) {
				params.delete("__isr_route");
				return [decodeURIComponent(isrURL), params.toString()];
			}
		}
	}
}
//#endregion
//#region ../../node_modules/nitro/dist/presets/vercel/runtime/vercel.web.mjs
const nitroApp = useNitroApp();
var vercel_web_default = { async fetch(req, context) {
	const isrURL = isrRouteRewrite(req.url, req.headers.get("x-now-route-matches"));
	if (isrURL) {
		const { routeRules } = getRouteRules("", isrURL[0]);
		if (routeRules?.isr) req = new Request(new URL(isrURL[0] + (isrURL[1] ? `?${isrURL[1]}` : ""), req.url).href, req);
	}
	req.runtime ??= { name: "vercel" };
	req.runtime.vercel = { context };
	let ip;
	Object.defineProperty(req, "ip", { get() {
		const h = req.headers.get("x-forwarded-for");
		return ip ??= h?.split(",").shift()?.trim();
	} });
	req.waitUntil = context?.waitUntil;
	return nitroApp.fetch(req);
} };
//#endregion
export { vercel_web_default as default };
