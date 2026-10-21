
const ambientStyles = `
  .ambient-root {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
    background: #060b18;
  }

  html.light-mode .ambient-root {
    display: none !important;
  }

  .ambient-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }
  .ambient-orb-1 {
    width: 650px; height: 650px;
    background: radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%);
    top: -200px; left: -150px;
    animation: ambientOrbFloat1 10s ease-in-out infinite;
  }
  .ambient-orb-2 {
    width: 550px; height: 550px;
    background: radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%);
    bottom: -150px; left: 35%;
    animation: ambientOrbFloat2 12s ease-in-out infinite;
  }
  .ambient-orb-3 {
    width: 450px; height: 450px;
    background: radial-gradient(circle, rgba(14,165,233,0.2) 0%, transparent 70%);
    top: 25%; right: -120px;
    animation: ambientOrbFloat3 14s ease-in-out infinite;
  }

  @keyframes ambientOrbFloat1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(40px, 60px) scale(1.08); }
  }
  @keyframes ambientOrbFloat2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(-50px, -40px) scale(1.05); }
  }
  @keyframes ambientOrbFloat3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%      { transform: translate(30px, 50px) scale(1.06); }
  }

  .ambient-grid {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .ambient-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }
  .ambient-particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(96, 165, 250, 0.45);
    animation: ambientDrift linear infinite;
  }
  @keyframes ambientDrift {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    10%  { opacity: 0.8; }
    90%  { opacity: 0.3; }
    100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
  }
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.5 + 3) % 100}%`,
  dur: `${9 + (i * 0.8) % 14}s`,
  delay: `${(i * 0.7) % 10}s`,
  size: `${1 + (i % 3)}px`,
}));

export default function AmbientBackground() {
  return (
    <>
      <style>{ambientStyles}</style>
      <div className="ambient-root" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
        <div className="ambient-grid" />
        <div className="ambient-particles">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="ambient-particle"
              style={{
                left: p.left,
                width: p.size,
                height: p.size,
                animationDuration: p.dur,
                animationDelay: p.delay,
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
