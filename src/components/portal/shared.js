"use strict";
exports.__esModule = true;
exports.DownloadIcon = exports.DownloadButtons = exports.StatusPill = exports.usePortalData = void 0;
var react_1 = require("react");
var useGlobalData_1 = require("@docusaurus/useGlobalData");
var useBaseUrl_1 = require("@docusaurus/useBaseUrl");
var portal_module_css_1 = require("./portal.module.css");
function usePortalData() {
    return useGlobalData_1.usePluginData('docusaurus-plugin-portal');
}
exports.usePortalData = usePortalData;
var STATUS_CLASS = {
    current: portal_module_css_1["default"].ok,
    active: portal_module_css_1["default"].ok,
    onboarding: portal_module_css_1["default"].info,
    deprecated: portal_module_css_1["default"].warn,
    sunset: portal_module_css_1["default"].warn,
    retired: portal_module_css_1["default"].muted
};
/** Status shown as a labelled pill (never colour alone). */
function StatusPill(_a) {
    var _b;
    var status = _a.status;
    if (!status)
        return null;
    return <span className={portal_module_css_1["default"].pill + " " + ((_b = STATUS_CLASS[status]) !== null && _b !== void 0 ? _b : '')}>{status}</span>;
}
exports.StatusPill = StatusPill;
/** JSON + YAML download buttons for a bundled contract. */
function DownloadButtons(_a) {
    var spec = _a.spec, compact = _a.compact;
    var json = useBaseUrl_1["default"](spec.downloads.json);
    var yaml = useBaseUrl_1["default"](spec.downloads.yaml);
    return (<span className={portal_module_css_1["default"].downloads}>
      <a className={portal_module_css_1["default"].dl + " " + (compact ? portal_module_css_1["default"].dlCompact : '')} href={json} download={spec.id + ".json"}>
        <DownloadIcon /> JSON
      </a>
      <a className={portal_module_css_1["default"].dl + " " + (compact ? portal_module_css_1["default"].dlCompact : '')} href={yaml} download={spec.id + ".yaml"}>
        <DownloadIcon /> YAML
      </a>
    </span>);
}
exports.DownloadButtons = DownloadButtons;
function DownloadIcon() {
    return (<svg width="14" height="14" viewBox="0 0 16 16" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 12.5h10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>);
}
exports.DownloadIcon = DownloadIcon;
