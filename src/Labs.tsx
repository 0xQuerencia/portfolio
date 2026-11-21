export default function Labs() {
  return (
    <div className="labs-coming">
      <div className="labs-coming-meta">
        <span>~/labs</span>
        <span className="labs-coming-status"><span aria-hidden="true" /> work in progress</span>
      </div>

      <div className="labs-coming-folder" aria-hidden="true">
        <span className="labs-coming-folder-back" />
        <span className="labs-coming-folder-front"><span>_</span></span>
      </div>

      <h2 id="labs-title" className="labs-coming-heading">labs<span>_</span></h2>
      <p className="labs-coming-title">coming soon.</p>
      <p className="labs-coming-copy">
        a little space for experiments and things i'm building.
        <br />
        not quite ready to show yet.
      </p>
      <a
        className="labs-coming-link"
        href="https://github.com/0xQuerencia"
        target="_blank"
        rel="noopener noreferrer"
      >
        meanwhile, find me on github <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
