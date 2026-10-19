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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
/**
 * docusaurus-plugin-cdm (local)
 *
 * Turns a folder of JSON Schema files — the canonical data model — into an
 * interactive graph page:
 *
 *   cdm/<family>/<model>.schema.json   one model per file; the folder is its family
 *   cdm/<family>/family.json           optional { "title", "description" } for the family
 *
 * Relationships are read straight from standard JSON Schema:
 *   allOf: [{ "$ref": "parent.schema.json" }]   → inheritance ("extends")
 *   properties.x: { "$ref": … }                  → composition (embeds a value)
 *   properties.x: { type: array, items: {$ref} } → composition, many
 *   properties.x: { "x-references": … }          → association by id (foreign key)
 *   "x-abstract": true                            → abstract model (not used on its own)
 *   "x-family": "…"                               → overrides the folder-derived family
 *
 * It also scans the published OpenAPI contracts for $refs into the CDM, so
 * every model lists the API operations that use it (directly or via another model).
 */
var node_path_1 = require("node:path");
var promises_1 = require("node:fs/promises");
var yaml_1 = require("yaml");
var HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
var posixRel = function (from, to) { return node_path_1["default"].relative(from, to).split(node_path_1["default"].sep).join('/'); };
/** Resolves a $ref / x-references string relative to the file it appears in. */
var resolveRefFile = function (fromFile, ref) { return node_path_1["default"].resolve(node_path_1["default"].dirname(fromFile), ref.split('#')[0]); };
function describeConstraints(s) {
    var _a;
    var out = [];
    if (s.format)
        out.push("format: " + s.format);
    if (s.pattern)
        out.push("pattern: " + s.pattern);
    if (s.minLength != null)
        out.push("minLength: " + s.minLength);
    if (s.maxLength != null)
        out.push("maxLength: " + s.maxLength);
    if (s.minimum != null)
        out.push("\u2265 " + s.minimum);
    if (s.maximum != null)
        out.push("\u2264 " + s.maximum);
    if (s.minItems != null)
        out.push("minItems: " + s.minItems);
    if (s.maxItems != null)
        out.push("maxItems: " + s.maxItems);
    if (s["const"] !== undefined)
        out.push("const: " + JSON.stringify(s["const"]));
    if (s["default"] !== undefined)
        out.push("default: " + JSON.stringify(s["default"]));
    if (s.readOnly)
        out.push('read-only');
    if (s.writeOnly)
        out.push('write-only');
    if (s.deprecated)
        out.push('deprecated');
    if ((_a = s.examples) === null || _a === void 0 ? void 0 : _a.length)
        out.push("e.g. " + s.examples.map(function (e) { return JSON.stringify(e); }).join(', '));
    for (var _i = 0, _b = Object.entries(s); _i < _b.length; _i++) {
        var _c = _b[_i], k = _c[0], v = _c[1];
        if (k.startsWith('x-') && k !== 'x-references')
            out.push(k + ": " + (typeof v === 'string' ? v : JSON.stringify(v)));
    }
    return out;
}
function cdmPlugin(context, pluginOptions) {
    var options = pluginOptions;
    var dir = node_path_1["default"].resolve(context.siteDir, options.path);
    var base = options.routeBasePath.replace(/\/$/, '');
    function load() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        return __awaiter(this, void 0, void 0, function () {
            var errors, files, _o, loaded, _i, files_1, f, abs, raw, idByFile, seen, _p, loaded_1, l, id, refTarget, describeProp, models, _loop_1, _q, loaded_2, l, _r, _s, m, _t, _u, p, _v, _w, prop, _x, _y, r, ancestorsOf, _loop_2, _z, _0, m, includes, idBySchemaId, _1, _2, m, _loop_3, _3, _4, spec, familyIds, families, _loop_4, _5, familyIds_1, f;
            return __generator(this, function (_6) {
                switch (_6.label) {
                    case 0:
                        errors = [];
                        files = [];
                        _6.label = 1;
                    case 1:
                        _6.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, promises_1["default"].readdir(dir, { recursive: true })];
                    case 2:
                        files = (_6.sent())
                            .filter(function (f) { return f.endsWith('.schema.json'); })
                            .sort();
                        return [3 /*break*/, 4];
                    case 3:
                        _o = _6.sent();
                        return [2 /*return*/, { models: [], families: [], errors: ["CDM folder not found: " + options.path] }];
                    case 4:
                        loaded = [];
                        _i = 0, files_1 = files;
                        _6.label = 5;
                    case 5:
                        if (!(_i < files_1.length)) return [3 /*break*/, 8];
                        f = files_1[_i];
                        abs = node_path_1["default"].join(dir, f);
                        return [4 /*yield*/, promises_1["default"].readFile(abs, 'utf8')];
                    case 6:
                        raw = _6.sent();
                        try {
                            loaded.push({ abs: abs, rel: posixRel(dir, abs), schema: JSON.parse(raw), raw: raw });
                        }
                        catch (e) {
                            errors.push(f + ": invalid JSON (" + e.message + ")");
                        }
                        _6.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8:
                        idByFile = new Map();
                        seen = new Set();
                        for (_p = 0, loaded_1 = loaded; _p < loaded_1.length; _p++) {
                            l = loaded_1[_p];
                            id = (_a = l.schema.title) !== null && _a !== void 0 ? _a : node_path_1["default"].basename(l.abs, '.schema.json');
                            if (seen.has(id)) {
                                errors.push("Duplicate model title \"" + id + "\" in " + l.rel + " \u2014 renamed for the graph.");
                                id = id + " (" + l.rel + ")";
                            }
                            seen.add(id);
                            idByFile.set(l.abs, id);
                        }
                        refTarget = function (fromAbs, ref, where) {
                            if (ref.startsWith('#'))
                                return undefined; // local definitions are not separate models
                            var target = idByFile.get(resolveRefFile(fromAbs, ref));
                            if (!target)
                                errors.push(where + ": unresolved reference \"" + ref + "\"");
                            return target;
                        };
                        describeProp = function (fromAbs, rel, name, s, required) {
                            var _a, _b, _c, _d;
                            var refs = [];
                            var type = '';
                            var add = function (ref, kind) {
                                var t = refTarget(fromAbs, ref, rel + " \u203A " + name);
                                if (t)
                                    refs.push({ model: t, kind: kind });
                                return t !== null && t !== void 0 ? t : ref;
                            };
                            var unionOf = function (list, kind) {
                                return list.map(function (o) { var _a; return (o.$ref ? add(o.$ref, kind) : (_a = o.type) !== null && _a !== void 0 ? _a : 'object'); }).join(' | ');
                            };
                            if (s.$ref)
                                type = add(s.$ref, 'embeds');
                            else if (s.type === 'array' && s.items) {
                                if (s.items.$ref)
                                    type = add(s.items.$ref, 'many') + "[]";
                                else if (s.items.oneOf || s.items.anyOf)
                                    type = "(" + unionOf((_a = s.items.oneOf) !== null && _a !== void 0 ? _a : s.items.anyOf, 'many') + ")[]";
                                else
                                    type = ((_b = s.items.type) !== null && _b !== void 0 ? _b : 'any') + "[]";
                            }
                            else if (s.oneOf || s.anyOf)
                                type = unionOf((_c = s.oneOf) !== null && _c !== void 0 ? _c : s.anyOf, 'embeds');
                            else if (s["enum"])
                                type = 'enum';
                            else if (s["const"] !== undefined)
                                type = typeof s["const"];
                            else
                                type = Array.isArray(s.type) ? s.type.join(' | ') : (_d = s.type) !== null && _d !== void 0 ? _d : 'any';
                            if (typeof s['x-references'] === 'string') {
                                var t = refTarget(fromAbs, s['x-references'], rel + " \u203A " + name + " (x-references)");
                                if (t)
                                    refs.push({ model: t, kind: 'references' });
                            }
                            return {
                                name: name,
                                required: required,
                                type: type,
                                refs: refs,
                                description: s.description,
                                constraints: describeConstraints(s),
                                "enum": s["enum"]
                            };
                        };
                        models = new Map();
                        _loop_1 = function (l) {
                            var s = l.schema;
                            var id = idByFile.get(l.abs);
                            var parts = __spreadArrays([s], ((_b = s.allOf) !== null && _b !== void 0 ? _b : []).filter(function (a) { return !a.$ref; }));
                            var extendsIds = ((_c = s.allOf) !== null && _c !== void 0 ? _c : [])
                                .filter(function (a) { return typeof a.$ref === 'string'; })
                                .map(function (a) { return refTarget(l.abs, a.$ref, l.rel + " \u203A allOf"); })
                                .filter(Boolean);
                            var required = new Set(parts.flatMap(function (p) { var _a; return (_a = p.required) !== null && _a !== void 0 ? _a : []; }));
                            var properties = [];
                            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                                var p = parts_1[_i];
                                for (var _a = 0, _b = Object.entries((_d = p.properties) !== null && _d !== void 0 ? _d : {}); _a < _b.length; _a++) {
                                    var _c = _b[_a], name_1 = _c[0], ps = _c[1];
                                    properties.push(describeProp(l.abs, l.rel, name_1, ps, required.has(name_1)));
                                }
                            }
                            var family = (_e = s['x-family']) !== null && _e !== void 0 ? _e : (l.rel.includes('/') ? l.rel.split('/')[0] : 'ungrouped');
                            models.set(id, {
                                id: id,
                                title: (_f = s.title) !== null && _f !== void 0 ? _f : id,
                                family: family,
                                file: posixRel(context.siteDir, l.abs),
                                schemaId: s.$id,
                                description: s.description,
                                abstract: s['x-abstract'] === true,
                                "extends": extendsIds,
                                subtypes: [],
                                ancestors: [],
                                properties: properties,
                                inherited: [],
                                referencedBy: [],
                                usedIn: [],
                                raw: JSON.stringify(s, null, 2)
                            });
                        };
                        for (_q = 0, loaded_2 = loaded; _q < loaded_2.length; _q++) {
                            l = loaded_2[_q];
                            _loop_1(l);
                        }
                        // ---- 3. derived: subtypes, ancestors, inherited props, referencedBy -------
                        for (_r = 0, _s = models.values(); _r < _s.length; _r++) {
                            m = _s[_r];
                            for (_t = 0, _u = m["extends"]; _t < _u.length; _t++) {
                                p = _u[_t];
                                (_g = models.get(p)) === null || _g === void 0 ? void 0 : _g.subtypes.push(m.id);
                            }
                            for (_v = 0, _w = m.properties; _v < _w.length; _v++) {
                                prop = _w[_v];
                                for (_x = 0, _y = prop.refs; _x < _y.length; _x++) {
                                    r = _y[_x];
                                    (_h = models.get(r.model)) === null || _h === void 0 ? void 0 : _h.referencedBy.push({ model: m.id, property: prop.name, kind: r.kind });
                                }
                            }
                        }
                        ancestorsOf = function (id, trail) {
                            if (trail === void 0) { trail = []; }
                            var m = models.get(id);
                            if (!m)
                                return [];
                            var out = [];
                            for (var _i = 0, _a = m["extends"]; _i < _a.length; _i++) {
                                var p = _a[_i];
                                if (trail.includes(p)) {
                                    errors.push("Inheritance cycle: " + __spreadArrays(trail, [id, p]).join(' → '));
                                    continue;
                                }
                                for (var _b = 0, _c = __spreadArrays(ancestorsOf(p, __spreadArrays(trail, [id])), [p]); _b < _c.length; _b++) {
                                    var a = _c[_b];
                                    if (!out.includes(a))
                                        out.push(a);
                                }
                            }
                            return out;
                        };
                        _loop_2 = function (m) {
                            m.ancestors = ancestorsOf(m.id); // root first
                            var own = new Set(m.properties.map(function (p) { return p.name; }));
                            var shown = new Set(own);
                            for (var _i = 0, _a = __spreadArrays(m.ancestors).reverse(); _i < _a.length; _i++) {
                                var a = _a[_i];
                                var am = models.get(a);
                                var props = am.properties.filter(function (p) { return !shown.has(p.name); }).map(function (p) { return (__assign({}, p)); });
                                props.forEach(function (p) { return shown.add(p.name); });
                                if (props.length)
                                    m.inherited.push({ from: a, properties: props });
                            }
                            // flag own properties that refine an inherited one
                            var inheritedNames = new Set(m.ancestors.flatMap(function (a) { return models.get(a).properties.map(function (p) { return p.name; }); }));
                            for (var _b = 0, _c = m.properties; _b < _c.length; _b++) {
                                var p = _c[_b];
                                if (inheritedNames.has(p.name))
                                    p.overrides = true;
                            }
                            m.subtypes.sort();
                        };
                        for (_z = 0, _0 = models.values(); _z < _0.length; _z++) {
                            m = _0[_z];
                            _loop_2(m);
                        }
                        includes = function (id, seenIds) {
                            if (seenIds === void 0) { seenIds = new Set(); }
                            if (seenIds.has(id))
                                return [];
                            seenIds.add(id);
                            var m = models.get(id);
                            if (!m)
                                return [];
                            var direct = __spreadArrays(m["extends"], m.properties.flatMap(function (p) { return p.refs.filter(function (r) { return r.kind !== 'references'; }).map(function (r) { return r.model; }); }));
                            return __spreadArrays(new Set(direct.flatMap(function (d) { return __spreadArrays([d], includes(d, seenIds)); })));
                        };
                        idBySchemaId = new Map();
                        for (_1 = 0, _2 = models.values(); _1 < _2.length; _1++) {
                            m = _2[_1];
                            if (m.schemaId)
                                idBySchemaId.set(m.schemaId, m.id);
                        }
                        _loop_3 = function (spec) {
                            var specAbs, doc, text, e_1, local, collect, _loop_5, _i, _a, _b, p, item;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        specAbs = node_path_1["default"].resolve(context.siteDir, spec.spec);
                                        _c.label = 1;
                                    case 1:
                                        _c.trys.push([1, 3, , 4]);
                                        return [4 /*yield*/, promises_1["default"].readFile(specAbs, 'utf8')];
                                    case 2:
                                        text = _c.sent();
                                        doc = specAbs.endsWith('.json') ? JSON.parse(text) : yaml_1["default"].parse(text);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        e_1 = _c.sent();
                                        errors.push(spec.spec + ": " + e_1.message);
                                        return [2 /*return*/, "continue"];
                                    case 4:
                                        local = function (pointer) {
                                            return pointer
                                                .replace(/^#\//, '')
                                                .split('/')
                                                .map(function (s) { return s.replace(/~1/g, '/').replace(/~0/g, '~'); })
                                                .reduce(function (n, k) { return n === null || n === void 0 ? void 0 : n[k]; }, doc);
                                        };
                                        collect = function (node, out, visited) {
                                            if (Array.isArray(node))
                                                return node.forEach(function (n) { return collect(n, out, visited); });
                                            if (!node || typeof node !== 'object')
                                                return;
                                            if (typeof node.$id === 'string' && idBySchemaId.has(node.$id))
                                                out.add(idBySchemaId.get(node.$id));
                                            if (typeof node.$ref === 'string') {
                                                var ref = node.$ref;
                                                if (ref.startsWith('#/')) {
                                                    if (!visited.has(ref)) {
                                                        visited.add(ref);
                                                        collect(local(ref), out, visited);
                                                    }
                                                }
                                                else {
                                                    var id = idByFile.get(resolveRefFile(specAbs, ref));
                                                    if (id)
                                                        out.add(id);
                                                }
                                            }
                                            for (var _i = 0, _a = Object.entries(node); _i < _a.length; _i++) {
                                                var _b = _a[_i], k = _b[0], v = _b[1];
                                                if (k !== '$ref')
                                                    collect(v, out, visited);
                                            }
                                        };
                                        _loop_5 = function (p, item) {
                                            var _loop_6 = function (method) {
                                                var op = item === null || item === void 0 ? void 0 : item[method];
                                                if (!op)
                                                    return "continue";
                                                var sections = [
                                                    ['request', op.requestBody],
                                                    ['response', op.responses],
                                                    ['parameter', __spreadArrays(((_k = item.parameters) !== null && _k !== void 0 ? _k : []), ((_l = op.parameters) !== null && _l !== void 0 ? _l : []))],
                                                ];
                                                var whereById = new Map();
                                                for (var _i = 0, sections_1 = sections; _i < sections_1.length; _i++) {
                                                    var _a = sections_1[_i], where = _a[0], node = _a[1];
                                                    var found = new Set();
                                                    collect(node, found, new Set());
                                                    for (var _b = 0, found_1 = found; _b < found_1.length; _b++) {
                                                        var id = found_1[_b];
                                                        if (!whereById.has(id))
                                                            whereById.set(id, new Set());
                                                        whereById.get(id).add(where);
                                                    }
                                                }
                                                var usage = function (where, via) { return ({
                                                    specId: spec.id,
                                                    specLabel: spec.label,
                                                    method: method.toUpperCase(),
                                                    path: p,
                                                    operationId: op.operationId,
                                                    summary: op.summary,
                                                    href: op.operationId ? spec.route + "#operation/" + op.operationId : spec.route,
                                                    where: __spreadArrays(where),
                                                    via: via
                                                }); };
                                                // model → where it appears in this operation, and which directly-used model
                                                // brought it in (undefined = the contract references it directly)
                                                var perOp = new Map();
                                                var note = function (id, where, via) {
                                                    var _a;
                                                    var e = (_a = perOp.get(id)) !== null && _a !== void 0 ? _a : { where: new Set(), via: via, direct: !via };
                                                    where.forEach(function (w) { return e.where.add(w); });
                                                    if (!via) {
                                                        e.direct = true;
                                                        e.via = undefined;
                                                    }
                                                    perOp.set(id, e);
                                                };
                                                for (var _c = 0, whereById_1 = whereById; _c < whereById_1.length; _c++) {
                                                    var _d = whereById_1[_c], id = _d[0], where = _d[1];
                                                    note(id, where);
                                                    for (var _e = 0, _f = includes(id); _e < _f.length; _e++) {
                                                        var inc = _f[_e];
                                                        note(inc, where, id);
                                                    }
                                                }
                                                for (var _g = 0, perOp_1 = perOp; _g < perOp_1.length; _g++) {
                                                    var _h = perOp_1[_g], id = _h[0], e = _h[1];
                                                    models.get(id).usedIn.push(usage(e.where, e.direct ? undefined : e.via));
                                                }
                                            };
                                            for (var _i = 0, HTTP_METHODS_1 = HTTP_METHODS; _i < HTTP_METHODS_1.length; _i++) {
                                                var method = HTTP_METHODS_1[_i];
                                                _loop_6(method);
                                            }
                                        };
                                        for (_i = 0, _a = Object.entries((_j = doc.paths) !== null && _j !== void 0 ? _j : {}); _i < _a.length; _i++) {
                                            _b = _a[_i], p = _b[0], item = _b[1];
                                            _loop_5(p, item);
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _3 = 0, _4 = options.openapiSpecs;
                        _6.label = 9;
                    case 9:
                        if (!(_3 < _4.length)) return [3 /*break*/, 12];
                        spec = _4[_3];
                        return [5 /*yield**/, _loop_3(spec)];
                    case 10:
                        _6.sent();
                        _6.label = 11;
                    case 11:
                        _3++;
                        return [3 /*break*/, 9];
                    case 12:
                        familyIds = __spreadArrays(new Set(__spreadArrays(models.values()).map(function (m) { return m.family; }))).sort();
                        families = [];
                        _loop_4 = function (f) {
                            var meta, _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        meta = {};
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 3, , 4]);
                                        _b = (_a = JSON).parse;
                                        return [4 /*yield*/, promises_1["default"].readFile(node_path_1["default"].join(dir, f, 'family.json'), 'utf8')];
                                    case 2:
                                        meta = _b.apply(_a, [_d.sent()]);
                                        return [3 /*break*/, 4];
                                    case 3:
                                        _c = _d.sent();
                                        return [3 /*break*/, 4];
                                    case 4:
                                        families.push({
                                            id: f,
                                            title: (_m = meta.title) !== null && _m !== void 0 ? _m : f.charAt(0).toUpperCase() + f.slice(1),
                                            description: meta.description,
                                            models: __spreadArrays(models.values()).filter(function (m) { return m.family === f; })
                                                .map(function (m) { return m.id; })
                                                .sort()
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        };
                        _5 = 0, familyIds_1 = familyIds;
                        _6.label = 13;
                    case 13:
                        if (!(_5 < familyIds_1.length)) return [3 /*break*/, 16];
                        f = familyIds_1[_5];
                        return [5 /*yield**/, _loop_4(f)];
                    case 14:
                        _6.sent();
                        _6.label = 15;
                    case 15:
                        _5++;
                        return [3 /*break*/, 13];
                    case 16: return [2 /*return*/, { models: __spreadArrays(models.values()).sort(function (a, b) { return a.id.localeCompare(b.id); }), families: families, errors: errors }];
                }
            });
        });
    }
    return {
        name: 'docusaurus-plugin-cdm',
        getPathsToWatch: function () {
            return __spreadArrays([dir + "/**/*"], options.openapiSpecs.map(function (s) { return node_path_1["default"].resolve(context.siteDir, s.spec); }));
        },
        loadContent: function () {
            return __awaiter(this, void 0, void 0, function () {
                var data, _i, _a, e;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, load()];
                        case 1:
                            data = _b.sent();
                            for (_i = 0, _a = data.errors; _i < _a.length; _i++) {
                                e = _a[_i];
                                console.warn("[cdm] " + e);
                            }
                            return [2 /*return*/, data];
                    }
                });
            });
        },
        contentLoaded: function (_a) {
            var content = _a.content, actions = _a.actions;
            return __awaiter(this, void 0, void 0, function () {
                var dataPath;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, actions.createData('cdm-graph.json', JSON.stringify(content))];
                        case 1:
                            dataPath = _b.sent();
                            actions.addRoute({
                                path: context.baseUrl.replace(/\/$/, '') + base,
                                component: node_path_1["default"].resolve(__dirname, 'components/CdmPage.tsx'),
                                modules: { graph: dataPath },
                                exact: true
                            });
                            return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports["default"] = cdmPlugin;
