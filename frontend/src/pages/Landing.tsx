
import { ArrowRight, ArrowUpRight, Check, Code2, GitBranch, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import "../App.css";

const features = [
  {
    icon: GitBranch,
    title: "Integration Intelligence",
    description:
      "Identify potential mismatches between frontend routes, backend endpoints, and application configurations.",
    tag: "01 / INTEGRATION",
  },
  {
    icon: ShieldCheck,
    title: "Security Analysis",
    description:
      "Surface suspicious code patterns, exposed secrets, and security issues that deserve attention.",
    tag: "02 / SECURITY",
  },
  {
    icon: Zap,
    title: "Dependency Insights",
    description:
      "Inspect project dependencies and identify configuration conflicts and potential compatibility issues.",
    tag: "03 / DEPENDENCIES",
  },
];

const checks = [
  "Frontend and backend routes",
  "Project structure and configuration",
  "Dependency declarations",
  "Security-sensitive patterns",
];

const currentYear = new Date().getFullYear();

function Landing() {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <Link to="/" className="brand">
          <img
  src="/mergex-mark.png"
  alt="MergeX AI Logo"
  className="brand-logo"
/>
        </Link>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
        </div>

        <div className="nav-actions">
          <Link to="/login" className="nav-login">
            Log in
          </Link>
          <Link to="/register" className="primary-button nav-cta">
            Get started <ArrowUpRight size={16} />
          </Link>
        </div>
      </nav>

      <section className="hero page-container">
        <div className="hero-copy">
          <div className="announcement">
            <span className="status-dot" />
            BUILT FOR THE NEXT GENERATION OF SOFTWARE
            <ArrowRight size={14} />
          </div>

          <h1 className="display-font">
            AI writes the code.
            <br />
            <span className="hero-highlight">We make it work</span>
            <br />
            together.
          </h1>

          <p className="hero-description">
            Projects built with different AI coding tools don't always work
            together. MergeX analyzes your codebase to help uncover integration
            gaps, dependency conflicts, and security risks.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="primary-button hero-primary">
              Analyze your project <ArrowUpRight size={18} />
            </Link>

            <a href="#workflow" className="secondary-button">
              Explore the workflow <ArrowRight size={16} />
            </a>
          </div>

          <div className="hero-proof">
            <div className="proof-icon">
              <Check size={15} />
            </div>
            <span>Multi-layer automated inspection:</span>
            <span className="proof-divider">/</span>
            <span>{checks.join(" · ")}</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Illustration of a software analysis pipeline">
          <div className="visual-topline">
            <span>MERGEX / ANALYSIS ENGINE</span>
            <span className="live-indicator">
              <span className="status-dot" /> SYSTEM CONCEPT
            </span>
          </div>

          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />

          <div className="code-window">
            <div className="code-window-header">
              <div className="window-dots">
                <i />
                <i />
                <i />
              </div>
              <span>project-analysis.ts</span>
              <Code2 size={15} />
            </div>

            <div className="code-lines">
              <div><span className="line-number">01</span><span className="code-purple">const</span> project = {"{"}</div>
              <div><span className="line-number">02</span>&nbsp;&nbsp;frontend: <span className="code-green">"React"</span>,</div>
              <div><span className="line-number">03</span>&nbsp;&nbsp;backend: <span className="code-green">"FastAPI"</span>,</div>
              <div><span className="line-number">04</span>&nbsp;&nbsp;checks: <span className="code-green">"integration"</span></div>
              <div><span className="line-number">05</span>{"};"}</div>
              <div className="code-spacer" />
              <div><span className="line-number">06</span><span className="code-purple">await</span> mergex.inspect(project);</div>
            </div>
          </div>

          <div className="analysis-node node-top">
            <span className="node-icon"><GitBranch size={17} /></span>
            <span><strong>Integration</strong><small>Route inspection</small></span>
            <span className="node-status">●</span>
          </div>

          <div className="analysis-node node-bottom">
            <span className="node-icon node-purple"><ShieldCheck size={17} /></span>
            <span><strong>Security</strong><small>Pattern analysis</small></span>
            <span className="node-status">●</span>
          </div>

          <div className="visual-footer">
            <span><Sparkles size={14} /> MULTI-LAYER ANALYSIS</span>
            <span>01 — 04</span>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="page-container trust-inner">
          <span className="trust-label">DESIGNED FOR AI-GENERATED CODE</span>
          <div className="trust-item"><Code2 size={16} /> FRONTEND</div>
          <div className="trust-item"><GitBranch size={16} /> BACKEND</div>
          <div className="trust-item"><ShieldCheck size={16} /> SECURITY</div>
          <div className="trust-item"><Zap size={16} /> DEPENDENCIES</div>
        </div>
      </section>

      <section className="features-section page-container" id="features">
        <div className="section-heading">
          <span className="eyebrow">01 / THE ANALYSIS LAYER</span>
          <h2 className="display-font">
            More than code review.
            <br />
            <span className="muted-heading">A complete picture.</span>
          </h2>
          <p>
            Find the gaps between individual components before they become
            bigger problems.
          </p>
        </div>

        <div className="feature-grid">
          {features.map(({ icon: Icon, title, description, tag }) => (
            <article className="feature-card" key={title}>
              <div className="feature-card-top">
                <span className="feature-icon"><Icon size={21} /></span>
                <ArrowUpRight size={19} className="feature-arrow" />
              </div>
              <span className="feature-tag">{tag}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="page-container workflow-grid">
          <div className="workflow-copy">
            <span className="eyebrow">02 / THE WORKFLOW</span>
            <h2 className="display-font">
              From scattered code
              <br />
              to <span className="hero-highlight">clear answers.</span>
            </h2>
            <p>
              Bring your project into one workspace. MergeX inspects its
              structure, checks for potential problems, and organizes the
              findings into an actionable report.
            </p>
            <Link to="/register" className="primary-button">
              Start your workspace <ArrowRight size={17} />
            </Link>
          </div>

          <div className="workflow-list">
            {[
              ["01", "Import your project", "Start with a project archive. GitHub integration can be added next."],
              ["02", "Inspect the codebase", "Identify frameworks, routes, configurations, and dependencies."],
              ["03", "Review the findings", "See evidence, severity, explanations, and suggested next steps."],
            ].map(([number, title, description]) => (
              <div className="workflow-step" key={number}>
                <span className="workflow-number">{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ArrowUpRight size={17} className="workflow-arrow" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta page-container">
        <div className="cta-glow" />
        <span className="eyebrow">YOUR NEXT BUILD STARTS HERE</span>
        <h2 className="display-font">
          Make every AI-generated
          <br />
          component <span className="hero-highlight">work together.</span>
        </h2>
        <p>One workspace. A clearer view of your entire codebase.</p>
        <Link to="/register" className="primary-button">
          Create your workspace <ArrowUpRight size={17} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="page-container footer-inner">
          <Link to="/" className="brand">
           <img
  src="/mergex-mark.png"
  alt="MergeX AI Logo"
  className="brand-logo"
/>
          </Link>
          <span>AI-assisted software integration intelligence.</span>
          <span>© {currentYear} MergeX AI</span>
        </div>
      </footer>
    </main>
  );
}

export default Landing;

