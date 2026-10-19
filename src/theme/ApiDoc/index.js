"use strict";
exports.__esModule = true;
/**
 * Wraps Redocusaurus' API page with a toolbar: breadcrumb, version and status,
 * and JSON / YAML downloads of the bundled contract.
 */
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Redoc_1 = require("@theme/Redoc");
var Link_1 = require("@docusaurus/Link");
var router_1 = require("@docusaurus/router");
var useDocusaurusContext_1 = require("@docusaurus/useDocusaurusContext");
var shared_1 = require("@site/src/components/portal/shared");
var portal_module_css_1 = require("@site/src/components/portal/portal.module.css");
var trim = function (p) { return p.replace(/\/+$/, ''); };
function ApiDoc(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j;
    var layoutProps = _a.layoutProps, specProps = _a.specProps;
    var siteConfig = useDocusaurusContext_1["default"]().siteConfig;
    var pathname = router_1.useLocation().pathname;
    var _k = shared_1.usePortalData(), specs = _k.specs, partners = _k.partners;
    var base = trim(siteConfig.baseUrl);
    var spec = specs.find(function (s) { return trim(base + s.route) === trim(pathname); });
    var partner = (spec === null || spec === void 0 ? void 0 : spec.partner) ? partners.find(function (p) { return p.id === spec.partner; }) : undefined;
    var info = (_c = (_b = specProps.spec) === null || _b === void 0 ? void 0 : _b.info) !== null && _c !== void 0 ? _c : {};
    var generated = info['x-generated-from'];
    return (<Layout_1["default"] title={(_d = info.title) !== null && _d !== void 0 ? _d : 'API reference'} description={(_e = info.summary) !== null && _e !== void 0 ? _e : info.description} {...layoutProps}>
      {spec && (<div className={portal_module_css_1["default"].bar}>
          <div className={portal_module_css_1["default"].barInner}>
            <div className={portal_module_css_1["default"].barMain}>
              <span className={portal_module_css_1["default"].crumbs}>
                {partner ? (<>
                    <Link_1["default"] to="/partners">Partners</Link_1["default"]> / <Link_1["default"] to={"/partners/" + partner.id + "/"}>{partner.name}</Link_1["default"]> /
                  </>) : (<>API reference /</>)}
              </span>
              <span className={portal_module_css_1["default"].barTitle}>{spec.label}</span>
              {info.version && <span className={portal_module_css_1["default"].barMeta}>v{info.version}</span>}
              <shared_1.StatusPill status={spec.status}/>
              {generated && (<span className={portal_module_css_1["default"].barMeta}>
                  generated from <code>master/{spec.version && partner ? (_f = partner.versions.find(function (v) { return v.version === spec.version; })) === null || _f === void 0 ? void 0 : _f.master : ''}</code>{' '}
                  + {(_h = (_g = generated.overlays) === null || _g === void 0 ? void 0 : _g.length) !== null && _h !== void 0 ? _h : 0} overlay{((_j = generated.overlays) === null || _j === void 0 ? void 0 : _j.length) === 1 ? '' : 's'}
                </span>)}
            </div>
            <shared_1.DownloadButtons spec={spec}/>
          </div>
        </div>)}
      <Redoc_1["default"] {...specProps}/>
    </Layout_1["default"]>);
}
exports["default"] = ApiDoc;
