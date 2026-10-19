"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
/**
 * docusaurus-plugin-arazzo (local)
 *
 * Scans a folder for Arazzo 1.0.x documents and generates:
 *   - <routeBasePath>                a catalogue of every workflow
 *   - <routeBasePath>/<file-slug>    one page per Arazzo document
 *
 * Each step is resolved against its OpenAPI source description so the page can
 * show the HTTP method + path and deep-link to the matching Redoc operation.
 * A Mermaid flowchart is generated for every workflow (rendered by
 * @docusaurus/theme-mermaid), including onSuccess / onFailure branches.
 */
var node_path_1 = require("node:path");
var promises_1 = require("node:fs/promises");
var yaml_1 = require("yaml");
var HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
var ARAZZO_FILE = /\.arazzo\.(ya?ml|json)$/i;
function slugify(file) {
    return file.replace(ARAZZO_FILE, '').replace(/[^a-zA-Z0-9-_]+/g, '-').toLowerCase();
}
function decodePointer(p) {
    return p
        .replace(/^#?\//, '')
        .split('/')
        .map(function (s) { return decodeURIComponent(s).replace(/~1/g, '/').replace(/~0/g, '~'); });
}
function loadOpenApi(file) {
    var _c;
    return __awaiter(this, void 0, void 0, function () {
        var core, config, result, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('@redocly/openapi-core'); })];
                case 1:
                    core = _g.sent();
                    return [4 /*yield*/, core.createConfig({})];
                case 2:
                    config = _g.sent();
                    return [4 /*yield*/, core.bundle({ ref: file, config: config })];
                case 3:
                    result = _g.sent();
                    if ((_c = result === null || result === void 0 ? void 0 : result.bundle) === null || _c === void 0 ? void 0 : _c.parsed)
                        return [2 /*return*/, result.bundle.parsed];
                    return [3 /*break*/, 5];
                case 4:
                    _d = _g.sent();
                    return [3 /*break*/, 5];
                case 5:
                    _f = (_e = yaml_1["default"]).parse;
                    return [4 /*yield*/, promises_1["default"].readFile(file, 'utf8')];
                case 6: return [2 /*return*/, _f.apply(_e, [_g.sent()])];
            }
        });
    });
}
function indexOperations(doc) {
    var _c, _d;
    var byId = {};
    var byPointer = {};
    for (var _i = 0, _e = Object.entries((_c = doc === null || doc === void 0 ? void 0 : doc.paths) !== null && _c !== void 0 ? _c : {}); _i < _e.length; _i++) {
        var _f = _e[_i], p = _f[0], item = _f[1];
        for (var _g = 0, HTTP_METHODS_1 = HTTP_METHODS; _g < HTTP_METHODS_1.length; _g++) {
            var method = HTTP_METHODS_1[_g];
            var op = item === null || item === void 0 ? void 0 : item[method];
            if (!op)
                continue;
            var entry = {
                method: method.toUpperCase(),
                path: p,
                summary: op.summary,
                operationId: op.operationId
            };
            if (op.operationId)
                byId[op.operationId] = entry;
            byPointer["/paths/" + p.replace(/~/g, '~0').replace(/\//g, '~1') + "/" + method] = entry;
        }
    }
    return { byId: byId, byPointer: byPointer, title: (_d = doc === null || doc === void 0 ? void 0 : doc.info) === null || _d === void 0 ? void 0 : _d.title };
}
function redocHref(route, operationId) {
    if (!route)
        return undefined;
    return operationId ? route + "#operation/" + operationId : route;
}
function resolveStep(step, sources) {
    var _c, _d;
    var openapiSources = Object.values(sources).filter(function (s) { return s.type === 'openapi'; });
    if (step.operationId) {
        var raw = String(step.operationId);
        var m = raw.match(/^\$sourceDescriptions\.([^.]+)\.(.+)$/);
        var candidates = m ? [sources[m[1]]].filter(Boolean) : openapiSources;
        var opId = m ? m[2] : raw;
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
            var src = candidates_1[_i];
            var op = src.byId[opId];
            if (op) {
                return __assign(__assign({ kind: 'operation', source: src.name, sourceTitle: (_c = src.title) !== null && _c !== void 0 ? _c : src.name }, op), { operationId: opId, raw: raw, href: redocHref(src.route, opId) });
            }
        }
        return { kind: 'operation', source: m === null || m === void 0 ? void 0 : m[1], operationId: opId, raw: raw };
    }
    if (step.operationPath) {
        var raw = String(step.operationPath);
        var m = raw.match(/^\{\$sourceDescriptions\.([^.]+)\.url\}#(.+)$/);
        var src = m ? sources[m[1]] : undefined;
        if (src && m) {
            var segments = decodePointer(m[2]);
            var key = "/paths/" + segments
                .slice(1, -1)
                .join('/')
                .replace(/~/g, '~0')
                .replace(/\//g, '~1') + "/" + segments.at(-1);
            var op = src.byPointer[key];
            if (op) {
                return __assign(__assign({ kind: 'operation', source: src.name, sourceTitle: (_d = src.title) !== null && _d !== void 0 ? _d : src.name }, op), { raw: raw, href: redocHref(src.route, op.operationId) });
            }
        }
        return { kind: 'operation', source: m === null || m === void 0 ? void 0 : m[1], raw: raw };
    }
    if (step.workflowId) {
        var raw = String(step.workflowId);
        var m = raw.match(/^\$sourceDescriptions\.([^.]+)\.(.+)$/);
        if (m)
            return { kind: 'workflow', workflowId: m[2], source: m[1], raw: raw };
        return { kind: 'workflow', workflowId: raw, raw: raw, href: "#workflow-" + raw };
    }
    return { kind: 'unknown', raw: '' };
}
/** Mermaid-safe label text. */
function esc(s) {
    return String(s)
        .replace(/"/g, '#quot;')
        .replace(/</g, '#lt;')
        .replace(/>/g, '#gt;');
}
function buildMermaid(workflow, steps) {
    var ids = new Map(steps.map(function (s, i) { return [s.stepId, "s" + i]; }));
    var lines = ['flowchart TD', '  start(["Start"])'];
    var endNodes = new Set();
    var failNodes = [];
    steps.forEach(function (s, i) {
        var _c;
        var t = s.target;
        var detail = '';
        if (t.kind === 'operation') {
            detail = t.method && t.path ? t.method + " " + t.path : (_c = t.operationId) !== null && _c !== void 0 ? _c : t.raw;
            if (t.sourceTitle)
                detail += "<br/><i>" + esc(t.sourceTitle) + "</i>";
        }
        else if (t.kind === 'workflow') {
            detail = "\u21B3 workflow " + t.workflowId;
        }
        lines.push("  " + ids.get(s.stepId) + "[\"<b>" + esc(s.stepId) + "</b><br/>" + esc(detail).replace(/#lt;(\/?)(i|br\/)#gt;/g, '<$1$2>') + "\"]");
    });
    if (steps.length)
        lines.push("  start --> s0");
    var targetOf = function (action, from) {
        if (action.type === 'end') {
            endNodes.add('done');
            return 'done';
        }
        if (action.type === 'retry')
            return from;
        if (action.type === 'goto') {
            if (action.stepId && ids.has(action.stepId))
                return ids.get(action.stepId);
            if (action.workflowId) {
                var wf = "wf_" + String(action.workflowId).replace(/[^a-zA-Z0-9_]/g, '_');
                lines.push("  " + wf + "[[\"workflow " + esc(action.workflowId) + "\"]]");
                return wf;
            }
        }
        return undefined;
    };
    steps.forEach(function (s, i) {
        var _c, _d, _e;
        var id = ids.get(s.stepId);
        var next = i < steps.length - 1 ? "s" + (i + 1) : 'done';
        var onSuccess = Array.isArray(s.raw.onSuccess) ? s.raw.onSuccess : [];
        var unconditional = onSuccess.some(function (a) { return !a.criteria || a.criteria.length === 0; });
        for (var _i = 0, onSuccess_1 = onSuccess; _i < onSuccess_1.length; _i++) {
            var a = onSuccess_1[_i];
            var to = targetOf(a, id);
            if (to)
                lines.push("  " + id + " -->|\"" + esc((_c = a.name) !== null && _c !== void 0 ? _c : a.type) + "\"| " + to);
        }
        if (!unconditional) {
            if (next === 'done')
                endNodes.add('done');
            lines.push("  " + id + " --> " + next);
        }
        var onFailure = Array.isArray(s.raw.onFailure) ? s.raw.onFailure : [];
        for (var _f = 0, onFailure_1 = onFailure; _f < onFailure_1.length; _f++) {
            var a = onFailure_1[_f];
            if (a.type === 'end') {
                var f = "fail" + failNodes.length;
                failNodes.push(f);
                lines.push("  " + f + "([\"Stop: " + esc((_d = a.name) !== null && _d !== void 0 ? _d : 'failure') + "\"])");
                lines.push("  " + id + " -.->|\"failure\"| " + f);
            }
            else {
                var to = targetOf(a, id);
                if (to)
                    lines.push("  " + id + " -.->|\"" + esc(a.type === 'retry' ? "retry" + (a.retryLimit ? " \u00D7" + a.retryLimit : '') : (_e = a.name) !== null && _e !== void 0 ? _e : 'on failure') + "\"| " + to);
            }
        }
    });
    if (endNodes.has('done') || steps.length === 0)
        lines.push('  done(["Done"])');
    lines.push('  classDef fail fill:#fdecea,stroke:#d93025,color:#a50e0e');
    lines.push('  classDef term fill:#e6f4ea,stroke:#1e8e3e,color:#0d652d');
    if (failNodes.length)
        lines.push("  class " + failNodes.join(',') + " fail");
    lines.push('  class start,done term');
    return lines.join('\n');
}
function loadDoc(siteDir, dir, file, opts) {
    var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    return __awaiter(this, void 0, void 0, function () {
        var abs, raw, doc, errors, specRoutes, sources, _i, _r, sd, entry, specPath, published, _s, _t, _u, _v, e_1, workflows, slug;
        return __generator(this, function (_w) {
            switch (_w.label) {
                case 0:
                    abs = node_path_1["default"].join(dir, file);
                    return [4 /*yield*/, promises_1["default"].readFile(abs, 'utf8')];
                case 1:
                    raw = _w.sent();
                    doc = file.endsWith('.json') ? JSON.parse(raw) : yaml_1["default"].parse(raw);
                    errors = [];
                    if (!(doc === null || doc === void 0 ? void 0 : doc.arazzo))
                        errors.push('Missing top-level "arazzo" version field.');
                    specRoutes = new Map(opts.openapiSpecs.map(function (s) { return [node_path_1["default"].resolve(siteDir, s.spec), s]; }));
                    sources = {};
                    _i = 0, _r = (_c = doc === null || doc === void 0 ? void 0 : doc.sourceDescriptions) !== null && _c !== void 0 ? _c : [];
                    _w.label = 2;
                case 2:
                    if (!(_i < _r.length)) return [3 /*break*/, 9];
                    sd = _r[_i];
                    entry = {
                        name: sd.name,
                        type: (_d = sd.type) !== null && _d !== void 0 ? _d : 'openapi',
                        url: sd.url,
                        byId: {},
                        byPointer: {}
                    };
                    if (!(entry.type === 'openapi' && sd.url && !/^https?:/i.test(sd.url))) return [3 /*break*/, 7];
                    specPath = node_path_1["default"].resolve(node_path_1["default"].dirname(abs), sd.url);
                    published = specRoutes.get(specPath);
                    entry.route = published === null || published === void 0 ? void 0 : published.route;
                    _w.label = 3;
                case 3:
                    _w.trys.push([3, 5, , 6]);
                    _t = (_s = Object).assign;
                    _u = [entry];
                    _v = indexOperations;
                    return [4 /*yield*/, loadOpenApi(specPath)];
                case 4:
                    _t.apply(_s, _u.concat([_v.apply(void 0, [_w.sent()])]));
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _w.sent();
                    entry.loadError = "Could not load " + sd.url + ": " + ((_e = e_1 === null || e_1 === void 0 ? void 0 : e_1.message) !== null && _e !== void 0 ? _e : e_1);
                    errors.push(entry.loadError);
                    return [3 /*break*/, 6];
                case 6:
                    if (published && !entry.title)
                        entry.title = published.label;
                    _w.label = 7;
                case 7:
                    sources[sd.name] = entry;
                    _w.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9:
                    workflows = ((_f = doc === null || doc === void 0 ? void 0 : doc.workflows) !== null && _f !== void 0 ? _f : []).map(function (wf) {
                        var _c, _d, _e, _f, _g;
                        var steps = ((_c = wf.steps) !== null && _c !== void 0 ? _c : []).map(function (st) {
                            var _c, _d, _e, _f, _g, _h, _j, _k;
                            return ({
                                stepId: st.stepId,
                                description: (_c = st.description) !== null && _c !== void 0 ? _c : null,
                                target: resolveStep(st, sources),
                                parameters: (_d = st.parameters) !== null && _d !== void 0 ? _d : null,
                                requestBody: st.requestBody
                                    ? {
                                        contentType: (_e = st.requestBody.contentType) !== null && _e !== void 0 ? _e : null,
                                        yaml: yaml_1["default"].stringify((_f = st.requestBody.payload) !== null && _f !== void 0 ? _f : st.requestBody).trimEnd()
                                    }
                                    : null,
                                successCriteria: (_g = st.successCriteria) !== null && _g !== void 0 ? _g : null,
                                onSuccess: (_h = st.onSuccess) !== null && _h !== void 0 ? _h : null,
                                onFailure: (_j = st.onFailure) !== null && _j !== void 0 ? _j : null,
                                outputs: (_k = st.outputs) !== null && _k !== void 0 ? _k : null,
                                raw: st
                            });
                        });
                        return {
                            workflowId: wf.workflowId,
                            summary: (_d = wf.summary) !== null && _d !== void 0 ? _d : null,
                            description: (_e = wf.description) !== null && _e !== void 0 ? _e : null,
                            dependsOn: (_f = wf.dependsOn) !== null && _f !== void 0 ? _f : null,
                            inputs: wf.inputs ? yaml_1["default"].stringify(wf.inputs).trimEnd() : null,
                            outputs: (_g = wf.outputs) !== null && _g !== void 0 ? _g : null,
                            mermaid: buildMermaid(wf, steps),
                            steps: steps.map(function (_c) {
                                var _raw = _c.raw, rest = __rest(_c, ["raw"]);
                                return rest;
                            })
                        };
                    });
                    slug = slugify(file);
                    return [2 /*return*/, {
                            slug: slug,
                            permalink: opts.routeBasePath.replace(/\/$/, '') + "/" + slug,
                            file: node_path_1["default"].relative(siteDir, abs),
                            fileName: file,
                            arazzo: (_g = doc === null || doc === void 0 ? void 0 : doc.arazzo) !== null && _g !== void 0 ? _g : null,
                            title: (_j = (_h = doc === null || doc === void 0 ? void 0 : doc.info) === null || _h === void 0 ? void 0 : _h.title) !== null && _j !== void 0 ? _j : file,
                            version: (_l = (_k = doc === null || doc === void 0 ? void 0 : doc.info) === null || _k === void 0 ? void 0 : _k.version) !== null && _l !== void 0 ? _l : null,
                            summary: (_o = (_m = doc === null || doc === void 0 ? void 0 : doc.info) === null || _m === void 0 ? void 0 : _m.summary) !== null && _o !== void 0 ? _o : null,
                            description: (_q = (_p = doc === null || doc === void 0 ? void 0 : doc.info) === null || _p === void 0 ? void 0 : _p.description) !== null && _q !== void 0 ? _q : null,
                            sources: Object.values(sources).map(function (_c) {
                                var _a = _c.byId, _b = _c.byPointer, s = __rest(_c, ["byId", "byPointer"]);
                                return s;
                            }),
                            workflows: workflows,
                            raw: raw,
                            errors: errors
                        }];
            }
        });
    });
}
function arazzoPlugin(context, pluginOptions) {
    var options = pluginOptions;
    var dir = node_path_1["default"].resolve(context.siteDir, options.path);
    var base = options.routeBasePath.replace(/\/$/, '');
    return {
        name: 'docusaurus-plugin-arazzo',
        getPathsToWatch: function () {
            return __spreadArrays([dir + "/**/*"], options.openapiSpecs.map(function (s) { return node_path_1["default"].resolve(context.siteDir, node_path_1["default"].dirname(s.spec), '**/*'); }));
        },
        loadContent: function () {
            return __awaiter(this, void 0, void 0, function () {
                var files, _c, docs, _i, docs_1, d, _d, _e, e, out, _f, docs_2, d, parsed;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0:
                            files = [];
                            _g.label = 1;
                        case 1:
                            _g.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, promises_1["default"].readdir(dir, { recursive: true })];
                        case 2:
                            files = (_g.sent()).filter(function (f) { return ARAZZO_FILE.test(f); }).sort();
                            return [3 /*break*/, 4];
                        case 3:
                            _c = _g.sent();
                            files = [];
                            return [3 /*break*/, 4];
                        case 4: return [4 /*yield*/, Promise.all(files.map(function (f) { return loadDoc(context.siteDir, dir, f, options); }))];
                        case 5:
                            docs = _g.sent();
                            for (_i = 0, docs_1 = docs; _i < docs_1.length; _i++) {
                                d = docs_1[_i];
                                for (_d = 0, _e = d.errors; _d < _e.length; _d++) {
                                    e = _e[_d];
                                    console.warn("[arazzo] " + d.file + ": " + e);
                                }
                            }
                            if (!options.downloadsDir) return [3 /*break*/, 11];
                            out = node_path_1["default"].join(options.downloadsDir, 'arazzo');
                            return [4 /*yield*/, promises_1["default"].mkdir(out, { recursive: true })];
                        case 6:
                            _g.sent();
                            _f = 0, docs_2 = docs;
                            _g.label = 7;
                        case 7:
                            if (!(_f < docs_2.length)) return [3 /*break*/, 11];
                            d = docs_2[_f];
                            parsed = d.fileName.endsWith('.json') ? JSON.parse(d.raw) : yaml_1["default"].parse(d.raw);
                            return [4 /*yield*/, promises_1["default"].writeFile(node_path_1["default"].join(out, d.slug + ".arazzo.yaml"), d.fileName.endsWith('.json') ? yaml_1["default"].stringify(parsed) : d.raw)];
                        case 8:
                            _g.sent();
                            return [4 /*yield*/, promises_1["default"].writeFile(node_path_1["default"].join(out, d.slug + ".arazzo.json"), JSON.stringify(parsed, null, 2) + '\n')];
                        case 9:
                            _g.sent();
                            d.downloads = { yaml: "/contracts/arazzo/" + d.slug + ".arazzo.yaml", json: "/contracts/arazzo/" + d.slug + ".arazzo.json" };
                            _g.label = 10;
                        case 10:
                            _f++;
                            return [3 /*break*/, 7];
                        case 11: return [2 /*return*/, { docs: docs }];
                    }
                });
            });
        },
        contentLoaded: function (_c) {
            var loaded = _c.content, actions = _c.actions;
            return __awaiter(this, void 0, void 0, function () {
                var createData, addRoute, content, index, indexPath, _i, _d, d, dataPath;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            createData = actions.createData, addRoute = actions.addRoute;
                            content = loaded;
                            index = content.docs.map(function (d) { return ({
                                title: d.title,
                                version: d.version,
                                summary: d.summary,
                                permalink: d.permalink,
                                file: d.file,
                                workflows: d.workflows.map(function (w) { return ({ workflowId: w.workflowId, summary: w.summary, steps: w.steps.length }); })
                            }); });
                            return [4 /*yield*/, createData('arazzo-index.json', JSON.stringify(index))];
                        case 1:
                            indexPath = _e.sent();
                            addRoute({
                                path: context.baseUrl.replace(/\/$/, '') + base,
                                component: node_path_1["default"].resolve(__dirname, 'components/ArazzoIndexPage.tsx'),
                                modules: { index: indexPath },
                                exact: true
                            });
                            _i = 0, _d = content.docs;
                            _e.label = 2;
                        case 2:
                            if (!(_i < _d.length)) return [3 /*break*/, 5];
                            d = _d[_i];
                            return [4 /*yield*/, createData("arazzo-" + d.slug + ".json", JSON.stringify(d))];
                        case 3:
                            dataPath = _e.sent();
                            addRoute({
                                path: context.baseUrl.replace(/\/$/, '') + d.permalink,
                                component: node_path_1["default"].resolve(__dirname, 'components/ArazzoDocPage.tsx'),
                                modules: { doc: dataPath },
                                exact: true
                            });
                            _e.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 2];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports["default"] = arazzoPlugin;
