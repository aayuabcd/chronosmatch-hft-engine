
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, Float } from "@react-three/drei";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Activity,
  ChevronDown,
  GitBranch,
  Zap,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

const COLORS = {
  background: "#170912",
  wine: "#300f24",
  rose: "#a75a7b",
  gold: "#e7a6a0",
  blush: "#f4dce6",
};

function TradingCore() {
  const group = useRef(null);
  const rings = useRef([]);

  useFrame((state, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * 0.12;
      group.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.25) * 0.1;
    }

    rings.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z += delta * (i % 2 ? -0.12 : 0.1);
      }
    });
  });

  return (
    <group ref={group}>
      <Float
        speed={1.5}
        rotationIntensity={0.15}
        floatIntensity={0.5}
      >
        <mesh>
          <icosahedronGeometry args={[1.6, 2]} />
          <meshPhysicalMaterial
            color={COLORS.wine}
            metalness={0.85}
            roughness={0.16}
            transparent
            opacity={0.7}
            wireframe
          />
        </mesh>

        <mesh>
          <icosahedronGeometry args={[0.9, 1]} />
          <meshStandardMaterial
            color={COLORS.gold}
            emissive={COLORS.rose}
            emissiveIntensity={1.8}
            wireframe
          />
        </mesh>
      </Float>

      {[2.5, 3.2, 4].map((radius, i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          rotation={[0.4 + i * 0.3, i * 0.5, 0]}
        >
          <torusGeometry args={[radius, 0.012, 8, 150]} />
          <meshBasicMaterial
            color={i === 1 ? COLORS.rose : COLORS.gold}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

function TradingWorld() {
  return (
    <div className="world-canvas">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 50 }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={[COLORS.background]} />
        <fog
          attach="fog"
          args={[COLORS.background, 10, 30]}
        />

        <ambientLight intensity={0.5} />

        <pointLight
          position={[3, 4, 5]}
          intensity={35}
          color={COLORS.rose}
        />

        <pointLight
          position={[-5, -2, 2]}
          intensity={20}
          color={COLORS.gold}
        />

        <Stars
          radius={70}
          depth={40}
          count={1700}
          factor={3}
          fade
          speed={0.5}
        />

        <TradingCore />
      </Canvas>
    </div>
  );
}

const tickers = [
  "CHRONOS / ENGINE ACTIVE",
  "PRICE-TIME PRIORITY",
  "ORDER BOOK SIMULATION",
  "EXECUTION ANALYTICS",
  "MARKET DEPTH",
  "LOW-LATENCY RESEARCH",
];

function App() {
  const root = useRef(null);
  const [showTerminal, setShowTerminal] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(".world-canvas", {
        scale: 1.55,
        opacity: 0.25,
        scrollTrigger: {
          trigger: ".cinematic-hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.utils.toArray(".reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 80 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
              trigger: element,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div className="cinematic-app" ref={root}>
      <header className="cinematic-nav">
        <a href="#home" className="logo">
          <Activity size={24} />
          CHRONOS<span>MATCH</span>
        </a>

        <div className="nav-links">
          <a href="#engine">THE ENGINE</a>
          <a href="#experience">EXPERIENCE</a>
          <a href="#terminal">TERMINAL</a>
        </div>

        <span className="nav-status">
          ● SIMULATION MODE
        </span>
      </header>

      <section className="cinematic-hero" id="home">
        <TradingWorld />

        <div className="hero-vignette" />
        <div className="hero-grid" />

        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9 }}
            className="hero-kicker"
          >
            AN INTERACTIVE TRADING ENGINE EXPERIENCE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2 }}
          >
            BEYOND
            <br />
            <span>THE ORDER.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Enter the architecture of high-frequency trading.
            Where every order has a priority, every execution
            has a story, and every microsecond matters.
          </motion.p>

          <motion.a
            href="#engine"
            className="cinematic-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            ENTER THE ENGINE
            <ArrowUpRight size={19} />
          </motion.a>
        </div>

        <div className="hero-coordinate">
          CM / 001 — MATCHING SYSTEM
        </div>

        <a href="#engine" className="scroll-prompt">
          SCROLL TO EXPLORE
          <ChevronDown size={16} />
        </a>
      </section>

      <div className="ticker-track">
        <div className="ticker-content">
          {[...tickers, ...tickers].map((item, i) => (
            <span key={i}>
              {item} <b>✦</b>
            </span>
          ))}
        </div>
      </div>

      <section className="story-section" id="engine">
        <div className="story-index reveal">
          01 — THE ARCHITECTURE
        </div>

        <div className="story-layout">
          <div className="reveal">
            <h2>
              ORDER FROM
              <br />
              <em>CHAOS.</em>
            </h2>

            <p>
              Thousands of decisions. One matching principle.
              ChronosMatch simulates how buy and sell orders
              interact inside a price-time priority matching
              engine.
            </p>

            <div className="story-stat">
              <span>01</span>
              BEST PRICE FIRST
            </div>

            <div className="story-stat">
              <span>02</span>
              EARLIEST ORDER NEXT
            </div>

            <div className="story-stat">
              <span>03</span>
              EXECUTE AND RECORD
            </div>
          </div>

          <div className="order-visual reveal">
            <div className="order-header">
              MATCHING ENGINE / VISUAL DEMO
            </div>

            <div className="order-line buy">
              <span>BUY ORDER</span>
              <strong>10 × ₹100</strong>
            </div>

            <div className="match-beam">
              <Zap size={30} />
              MATCH
            </div>

            <div className="order-line sell">
              <span>SELL ORDER</span>
              <strong>6 × ₹100</strong>
            </div>

            <div className="order-result">
              <span>EXECUTED: 6 SHARES</span>
              <span>REMAINING BUY: 4</span>
            </div>

            <small>
              Illustrative example, not a live order execution.
            </small>
          </div>
        </div>
      </section>

      <section
        className="experience-section"
        id="experience"
      >
        <div className="experience-glow" />

        <div className="experience-inner reveal">
          <div className="story-index">
            02 — THE EXPERIENCE
          </div>

          <h2>
            SEE THE MARKET
            <br />
            <em>DIFFERENTLY.</em>
          </h2>

          <p>
            Explore order-book depth, market imbalance,
            execution history, and performance metrics
            through the existing ChronosMatch trading simulation.
          </p>

          <div className="experience-grid">
            <div>
              <strong>PRICE</strong>
              <span>Priority</span>
            </div>

            <div>
              <strong>TIME</strong>
              <span>Sequence</span>
            </div>

            <div>
              <strong>DEPTH</strong>
              <span>Liquidity</span>
            </div>

            <div>
              <strong>FLOW</strong>
              <span>Execution</span>
            </div>
          </div>
        </div>
      </section>

      <section
        className="terminal-section"
        id="terminal"
      >
        <div className="story-index reveal">
          03 — THE TERMINAL
        </div>

        <h2 className="reveal">
          TAKE <em>CONTROL.</em>
        </h2>

        <p className="reveal">
          The React trading terminal is the next integration
          stage. The existing Streamlit application remains
          available separately.
        </p>

        <div className="terminal-preview reveal">
          <div className="terminal-top">
            <span>
              CHRONOSMATCH / TERMINAL PREVIEW
            </span>

            <span>
              ● FRONTEND MODE
            </span>
          </div>

          <div className="terminal-content">
            <div className="terminal-placeholder">
              <Activity size={52} />

              <h3>ENGINE CONNECTION PENDING</h3>

              <p>
                The Python matching engine will be connected
                to this React frontend through a backend API.
              </p>

              <button
                onClick={() =>
                  setShowTerminal(!showTerminal)
                }
              >
                {showTerminal
                  ? "HIDE DEVELOPMENT STATUS"
                  : "VIEW DEVELOPMENT STATUS"}
              </button>

              {showTerminal && (
                <div className="dev-status">
                  React frontend: in development
                  <br />
                  Python matching engine: existing
                  <br />
                  API integration: pending
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="cinematic-footer">
        <span>CHRONOSMATCH © 2026</span>

        <span>
          AN EDUCATIONAL TRADING SIMULATION
        </span>

        <a
          href="https://github.com/aayuabcd/chronosmatch-hft-engine"
          target="_blank"
          rel="noreferrer"
        >
          <GitBranch size={16} />
          GITHUB
        </a>
      </footer>
    </div>
  );
}

export default App;
