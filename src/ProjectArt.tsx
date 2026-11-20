interface Props {
  name: string;
}

export default function ProjectArt({ name }: Props) {
  if (name === "pixl") {
    return (
      <div className="project-art project-art--pixl" aria-hidden="true">
        <div className="pixl-scene">
          <div className="pixl-scene-top"><span>WORLD / 01</span><span>✳ ✳ ✳</span></div>
          <svg viewBox="0 0 320 165" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <defs>
              <pattern id="pixl-ground" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M24 0H0V24" fill="none" stroke="#3b7273" strokeWidth="1" opacity=".28"/>
              </pattern>
            </defs>
            <rect width="320" height="165" fill="#102b38"/>
            <rect width="320" height="165" fill="url(#pixl-ground)"/>
            <path d="M0 136h55v-22h45V86h51V64h46V39h38" fill="none" stroke="#598a80" strokeWidth="13" strokeLinecap="square" opacity=".52"/>
            <path d="M245 0v31h19v21h25v30h31" fill="none" stroke="#2b738a" strokeWidth="22"/>
            <g fill="#549b7f"><rect x="26" y="43" width="35" height="35"/><rect x="20" y="50" width="47" height="21"/><rect x="266" y="114" width="32" height="32"/><rect x="260" y="120" width="44" height="20"/></g>
            <g fill="#2a654d"><rect x="41" y="78" width="6" height="16"/><rect x="280" y="146" width="6" height="15"/></g>
            <g transform="translate(173 85)">
              <rect x="0" y="14" width="25" height="25" fill="#9bd4eb"/>
              <rect x="5" y="0" width="15" height="16" fill="#e7bd92"/>
              <rect x="3" y="0" width="19" height="6" fill="#121a35"/>
              <rect x="5" y="39" width="6" height="12" fill="#6b9dcc"/>
              <rect x="15" y="39" width="6" height="12" fill="#6b9dcc"/>
            </g>
            <g fill="#8fd5dc"><rect x="91" y="27" width="6" height="6"/><rect x="108" y="18" width="6" height="6"/><rect x="236" y="134" width="6" height="6"/></g>
            <g stroke="#6fc2da" strokeWidth="2" opacity=".65"><path d="M170 35h19m-10-9v18"/><path d="M78 138h15m-8-8v15"/></g>
          </svg>
          <div className="pixl-scene-foot"><span>explore · build · ship</span><span>↗</span></div>
        </div>
      </div>
    );
  }

  if (name === "aether") {
    return (
      <div className="project-art project-art--aether" aria-hidden="true">
        <div className="aether-window">
          <div className="aether-horizon" />
          <div className="aether-dock">
            <span>⌘</span><span>◩</span><span>▣</span><span>♪</span>
            <span className="aether-dock-time">14:37</span>
          </div>
        </div>
      </div>
    );
  }

  if (name === "x") {
    return (
      <div className="project-art project-art--x" aria-hidden="true">
        <div className="x-mini-terminal">
          <div className="mini-window-header"><i /><i /><i /><span>~/x</span></div>
          <div className="x-waveform">
            {[12, 27, 42, 18, 50, 31, 21, 38, 14].map((height, index) => (
              <span key={index} style={{ height: `${height}px` }} />
            ))}
          </div>
          <span className="x-terminal-line"><b>›</b> listening...</span>
        </div>
      </div>
    );
  }

  if (name === "pixie") {
    return (
      <div className="project-art project-art--pixie" aria-hidden="true">
        <div className="pixie-thread">
          <div className="pixie-thread-title"><span className="pixie-avatar">p</span> pixie / assistant</div>
          <div className="pixie-message"><span>›</span> /pixie help</div>
          <div className="pixie-reply"><span>✓</span> ready to help</div>
        </div>
      </div>
    );
  }

  if (name === "ripple") {
    return (
      <div className="project-art project-art--ripple" aria-hidden="true">
        <div className="ripple-screen">
          <div className="mini-window-header"><i /><i /><i /><span>ripple / simulation</span></div>
          <svg viewBox="0 0 320 125" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <g fill="none" stroke="#619add" opacity=".65">
              <circle cx="147" cy="75" r="18"/><circle cx="147" cy="75" r="38"/><circle cx="147" cy="75" r="61"/>
              <circle cx="147" cy="75" r="85" opacity=".35"/>
              <path d="M20 106C66 36 97 95 147 75s86-53 150-35"/>
            </g>
            <g fill="#9ecbff"><circle cx="147" cy="75" r="6"/><circle cx="69" cy="87" r="4"/><circle cx="235" cy="45" r="5"/><circle cx="277" cy="65" r="3"/></g>
            <g stroke="#85acd8" strokeWidth="2"><path d="M255 86h43m-43 13h43m-43 13h43"/></g>
          </svg>
        </div>
      </div>
    );
  }

  if (name === "portfolio") {
    return (
      <div className="project-art project-art--portfolio" aria-hidden="true">
        <div className="portfolio-browser">
          <div className="mini-window-header"><i /><i /><i /><span>querencia.art / projects</span></div>
          <div className="portfolio-mini-grid">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return null;
}
