"use strict";
exports.__esModule = true;
/**
 * Facts, contacts and contract versions for one partner, read from its partner.yaml.
 * Usage in a partner's index.mdx:  <PartnerOverview partner="northwind-super" />
 */
var react_1 = require("react");
var Link_1 = require("@docusaurus/Link");
var shared_1 = require("./shared");
var portal_module_css_1 = require("./portal.module.css");
function PartnerOverview(_a) {
    var _b;
    var id = _a.partner;
    var _c = shared_1.usePortalData(), partners = _c.partners, specs = _c.specs;
    var p = partners.find(function (x) { return x.id === id; });
    if (!p)
        return <div className="alert alert--danger">Unknown partner “{id}” — check partner.yaml.</div>;
    return (<div>
      <div className={portal_module_css_1["default"].factGrid}>
        <div className={portal_module_css_1["default"].fact}>
          <div className={portal_module_css_1["default"].factLabel}>Status</div>
          <div className={portal_module_css_1["default"].factValue}>
            <shared_1.StatusPill status={p.status}/>
          </div>
        </div>
        <div className={portal_module_css_1["default"].fact}>
          <div className={portal_module_css_1["default"].factLabel}>Owning team</div>
          <div className={portal_module_css_1["default"].factValue}>
            <code>{(_b = p.owner) !== null && _b !== void 0 ? _b : '—'}</code>
          </div>
        </div>
        {p.contacts.map(function (c) {
        var _a, _b;
        return (<div key={(_a = c.email) !== null && _a !== void 0 ? _a : c.name} className={portal_module_css_1["default"].fact}>
            <div className={portal_module_css_1["default"].factLabel}>{(_b = c.role) !== null && _b !== void 0 ? _b : 'Contact'}</div>
            <div className={portal_module_css_1["default"].factValue}>
              {c.name}
              {c.email && (<>
                  <br />
                  <a href={"mailto:" + c.email}>{c.email}</a>
                </>)}
            </div>
          </div>);
    })}
      </div>

      <table className={portal_module_css_1["default"].table}>
        <thead>
          <tr>
            <th>Version</th>
            <th>Status</th>
            <th>Built from</th>
            <th>Released</th>
            <th>Contract</th>
          </tr>
        </thead>
        <tbody>
          {p.versions.map(function (v) {
        var _a;
        var spec = specs.find(function (s) { return s.partner === p.id && s.version === v.version; });
        return (<tr key={v.version}>
                <td>{spec ? <Link_1["default"] to={spec.route}>{v.version} reference</Link_1["default"]> : v.version}</td>
                <td>
                  <shared_1.StatusPill status={v.status}/>
                  {v.sunset && <div style={{ fontSize: '0.8rem' }}>sunset {v.sunset}</div>}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  master <code>{v.master}</code>
                  {(spec === null || spec === void 0 ? void 0 : spec.info.version) && <> ({spec.info.version})</>}
                  <br />+ {v.overlays.map(function (o) { return o.replace(/^overlays\//, ''); }).join(', ')}
                </td>
                <td>{(_a = v.released) !== null && _a !== void 0 ? _a : '—'}</td>
                <td>{spec && <shared_1.DownloadButtons spec={spec} compact/>}</td>
              </tr>);
    })}
        </tbody>
      </table>
    </div>);
}
exports["default"] = PartnerOverview;
