"use strict";
exports.__esModule = true;
var react_1 = require("react");
var Layout_1 = require("@theme/Layout");
var Link_1 = require("@docusaurus/Link");
var Heading_1 = require("@theme/Heading");
var shared_1 = require("@site/src/components/portal/shared");
var portal_module_css_1 = require("@site/src/components/portal/portal.module.css");
function PartnersIndexPage(_a) {
    var data = _a.data;
    var masters = data.specs.filter(function (s) { return s.group === 'master'; });
    return (<Layout_1["default"] title="Partners" description="Partner contracts and documentation">
      <main className="container margin-vert--lg">
        <Heading_1["default"] as="h1">Partners</Heading_1["default"]>
        <p>
          Each partner gets its own contract, generated from the master Partner Experience API with that partner's
          OpenAPI overlays, plus its own onboarding notes and changelog.
        </p>
        <p>
          Master versions:{' '}
          {masters.map(function (m, i) { return (<react_1["default"].Fragment key={m.id}>
              {i > 0 && ' · '}
              <Link_1["default"] to={m.route}>{m.label}</Link_1["default"]>
            </react_1["default"].Fragment>); })}
        </p>
        <div className={portal_module_css_1["default"].grid}>
          {data.partners.map(function (p) { return (<div key={p.id} className={portal_module_css_1["default"].card}>
              <div className={portal_module_css_1["default"].cardHead}>
                <Link_1["default"] to={"/partners/" + p.id + "/"} className={portal_module_css_1["default"].cardTitle}>
                  {p.name}
                </Link_1["default"]>
                <shared_1.StatusPill status={p.status}/>
              </div>
              {p.summary && <p className={portal_module_css_1["default"].cardSummary}>{p.summary}</p>}
              <ul className={portal_module_css_1["default"].versionList}>
                {p.versions.map(function (v) {
        var spec = data.specs.find(function (s) { return s.partner === p.id && s.version === v.version; });
        return (<li key={v.version}>
                      {spec ? <Link_1["default"] to={spec.route}>{v.version}</Link_1["default"]> : <strong>{v.version}</strong>}
                      <shared_1.StatusPill status={v.status}/>
                      <span style={{ color: 'var(--ifm-color-emphasis-700)' }}>
                        master {v.master}
                        {v.sunset ? " \u00B7 sunset " + v.sunset : ''}
                      </span>
                      {spec && (<span style={{ marginLeft: 'auto' }}>
                          <shared_1.DownloadButtons spec={spec} compact/>
                        </span>)}
                    </li>);
    })}
              </ul>
              <div className={portal_module_css_1["default"].cardFoot}>
                <span>{p.owner ? "Owner " + p.owner : ''}</span>
                <Link_1["default"] to={"/partners/" + p.id + "/"}>Partner docs →</Link_1["default"]>
              </div>
            </div>); })}
        </div>
      </main>
    </Layout_1["default"]>);
}
exports["default"] = PartnersIndexPage;
