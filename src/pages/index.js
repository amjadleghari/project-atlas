"use strict";
exports.__esModule = true;
var Link_1 = require("@docusaurus/Link");
var Layout_1 = require("@theme/Layout");
var Heading_1 = require("@theme/Heading");
var apis_config_1 = require("../../apis.config");
var shared_1 = require("../components/portal/shared");
var index_module_css_1 = require("./index.module.css");
function Home() {
    var _a = shared_1.usePortalData(), specs = _a.specs, partners = _a.partners;
    var apis = specs.filter(function (s) { return s.group === 'platform' || s.group === 'master'; });
    return (<Layout_1["default"] title="Home" description={apis_config_1.site.tagline}>
      <header className={index_module_css_1["default"].hero}>
        <div className="container">
          <Heading_1["default"] as="h1" className={index_module_css_1["default"].title}>
            {apis_config_1.site.name}
          </Heading_1["default"]>
          <p className={index_module_css_1["default"].subtitle}>{apis_config_1.site.tagline}</p>
          <div className={index_module_css_1["default"].actions}>
            <Link_1["default"] className="button button--primary button--lg" to="/docs">
              Get started
            </Link_1["default"]>
            <Link_1["default"] className="button button--secondary button--lg" to="/partners">
              Partner contracts
            </Link_1["default"]>
          </div>
        </div>
      </header>
      <main className="container margin-vert--xl">
        <Heading_1["default"] as="h2">API reference</Heading_1["default"]>
        <div className={index_module_css_1["default"].grid}>
          {apis.map(function (s) { return (<Link_1["default"] key={s.id} to={s.route} className={index_module_css_1["default"].card}>
              <span className={index_module_css_1["default"].badge}>{s.group === 'master' ? 'Master' : 'OpenAPI'}</span>
              <div className={index_module_css_1["default"].cardTitle}>{s.label}</div>
              <p>{s.description}</p>
            </Link_1["default"]>); })}
        </div>

        <Heading_1["default"] as="h2" className="margin-top--xl">
          Explore
        </Heading_1["default"]>
        <div className={index_module_css_1["default"].grid}>
          <Link_1["default"] to="/partners" className={index_module_css_1["default"].card + " " + index_module_css_1["default"].cardAlt}>
            <span className={index_module_css_1["default"].badge + " " + index_module_css_1["default"].badgePartner}>Partners</span>
            <div className={index_module_css_1["default"].cardTitle}>Partner contracts &amp; docs</div>
            <p>
              {partners.map(function (p, i) { return (<span key={p.id}>
                  {i > 0 && ', '}
                  {p.name} <shared_1.StatusPill status={p.status}/>
                </span>); })}
            </p>
          </Link_1["default"]>
          <Link_1["default"] to={apis_config_1.arazzo.routeBasePath} className={index_module_css_1["default"].card + " " + index_module_css_1["default"].cardAlt}>
            <span className={index_module_css_1["default"].badge + " " + index_module_css_1["default"].badgeAlt}>Arazzo</span>
            <div className={index_module_css_1["default"].cardTitle}>Workflows</div>
            <p>Multi-step journeys across APIs, with diagrams and links to every operation.</p>
          </Link_1["default"]>
          <Link_1["default"] to={apis_config_1.cdm.routeBasePath} className={index_module_css_1["default"].card + " " + index_module_css_1["default"].cardAlt}>
            <span className={index_module_css_1["default"].badge + " " + index_module_css_1["default"].badgeCdm}>JSON Schema</span>
            <div className={index_module_css_1["default"].cardTitle}>Canonical data model</div>
            <p>Interactive map of the shared models, their families and inheritance, and where each is used.</p>
          </Link_1["default"]>
          <Link_1["default"] to="/docs/diagrams" className={index_module_css_1["default"].card + " " + index_module_css_1["default"].cardAlt}>
            <span className={index_module_css_1["default"].badge}>Mermaid</span>
            <div className={index_module_css_1["default"].cardTitle}>Diagrams as code</div>
            <p>19 diagram types with copy-ready examples: sequence, state, C4, ER, Gantt and more.</p>
          </Link_1["default"]>
        </div>
      </main>
    </Layout_1["default"]>);
}
exports["default"] = Home;
