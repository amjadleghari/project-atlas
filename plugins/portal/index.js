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
exports.__esModule = true;
/**
 * docusaurus-plugin-portal (local)
 *
 *  - Bundles every OpenAPI contract (platform APIs, master Partner Experience
 *    versions, generated partner contracts) into self-contained JSON and YAML
 *    files under /contracts/openapi/, so every reference page can offer downloads.
 *  - Publishes the spec catalogue and partner catalogue as global data for the
 *    API page toolbar, home page and partner pages.
 *  - Adds the /partners index page.
 */
var node_path_1 = require("node:path");
var promises_1 = require("node:fs/promises");
function portalPlugin(context, raw) {
    var options = raw;
    return {
        name: 'docusaurus-plugin-portal',
        getPathsToWatch: function () {
            return options.specs.map(function (s) { return node_path_1["default"].resolve(context.siteDir, s.spec); });
        },
        loadContent: function () {
            var _a, _b;
            return __awaiter(this, void 0, void 0, function () {
                var core, config, outDir, specs, _i, _c, s, file, result, doc;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('@redocly/openapi-core'); })];
                        case 1:
                            core = _d.sent();
                            return [4 /*yield*/, core.createConfig({})];
                        case 2:
                            config = _d.sent();
                            outDir = node_path_1["default"].join(options.downloadsDir, 'openapi');
                            return [4 /*yield*/, promises_1["default"].mkdir(outDir, { recursive: true })];
                        case 3:
                            _d.sent();
                            specs = [];
                            _i = 0, _c = options.specs;
                            _d.label = 4;
                        case 4:
                            if (!(_i < _c.length)) return [3 /*break*/, 9];
                            s = _c[_i];
                            file = node_path_1["default"].resolve(context.siteDir, s.spec);
                            return [4 /*yield*/, core.bundle({ ref: file, config: config })];
                        case 5:
                            result = _d.sent();
                            doc = result.bundle.parsed;
                            return [4 /*yield*/, promises_1["default"].writeFile(node_path_1["default"].join(outDir, s.id + ".json"), JSON.stringify(doc, null, 2) + '\n')];
                        case 6:
                            _d.sent();
                            return [4 /*yield*/, promises_1["default"].writeFile(node_path_1["default"].join(outDir, s.id + ".yaml"), core.stringifyYaml(doc))];
                        case 7:
                            _d.sent();
                            specs.push(__assign(__assign({}, s), { info: { title: (_a = doc.info) === null || _a === void 0 ? void 0 : _a.title, version: (_b = doc.info) === null || _b === void 0 ? void 0 : _b.version }, downloads: { json: "/contracts/openapi/" + s.id + ".json", yaml: "/contracts/openapi/" + s.id + ".yaml" } }));
                            _d.label = 8;
                        case 8:
                            _i++;
                            return [3 /*break*/, 4];
                        case 9: return [2 /*return*/, { specs: specs, partners: options.partners }];
                    }
                });
            });
        },
        contentLoaded: function (_a) {
            var loaded = _a.content, actions = _a.actions;
            return __awaiter(this, void 0, void 0, function () {
                var content, data;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            content = loaded;
                            actions.setGlobalData(content);
                            return [4 /*yield*/, actions.createData('portal-partners.json', JSON.stringify(content))];
                        case 1:
                            data = _b.sent();
                            actions.addRoute({
                                path: context.baseUrl.replace(/\/$/, '') + '/partners',
                                component: node_path_1["default"].resolve(__dirname, 'PartnersIndexPage.tsx'),
                                modules: { data: data },
                                exact: true
                            });
                            return [2 /*return*/];
                    }
                });
            });
        }
    };
}
exports["default"] = portalPlugin;
