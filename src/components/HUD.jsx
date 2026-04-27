import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store'

const KEY = ({ children }) => (
  <span style={{
    display:'inline-block', background:'rgba(244,208,63,0.15)',
    border:'1px solid rgba(244,208,63,0.5)', borderRadius:5,
    padding:'2px 8px', color:'#f4d03f', fontSize:11, fontWeight:'bold',
    margin:'0 2px', letterSpacing:1,
  }}>{children}</span>
)

export default function HUD() {
  const {
    loaded, resetCar, soundEnabled, toggleSound, activeSection, setActiveSection,
    isDayMode, toggleDayMode, autoDrive, toggleAutoDrive,
    cameraMode, setCameraMode, currentSpeed,
    navTarget, isNavigating, navigateTo,
    showMap, setShowMap,
  } = useGameStore()
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    if (loaded) {
      const t = setTimeout(() => setShowControls(false), 8000)
      return () => clearTimeout(t)
    }
  }, [loaded])

  if (!loaded) return null

  return (
    <>
      {/* ── Top-right toolbar ── */}
      <div style={{ position:'fixed', top:18, right:18, zIndex:100, display:'flex', gap:10 }}>
        <Btn onClick={resetCar}>↺ Reset</Btn>
        <Btn onClick={toggleSound}>{soundEnabled ? '🔊' : '🔇'}</Btn>
      </div>

      {/* ── Logo + toggles top-left ── */}
      <div style={{ position:'fixed', top:18, left:18, zIndex:100, display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{
          fontFamily:'"Courier New",monospace', color: isDayMode ? '#1a3355' : '#f4d03f',
          fontSize:13, letterSpacing:3, fontWeight:'bold',
          background: isDayMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)',
          border: isDayMode ? '1px solid rgba(26,51,85,0.3)' : '1px solid rgba(244,208,63,0.25)',
          borderRadius:8, padding:'8px 14px',
          transition: 'all 0.8s ease',
        }}>
          SS · PORTFOLIO
        </div>

        {/* Day / Night toggle */}
        <ToggleBtn onClick={toggleDayMode} isDayMode={isDayMode}>
          <span style={{ fontSize:14 }}>{isDayMode ? '☀️' : '🌙'}</span>
          {isDayMode ? 'DAY' : 'NIGHT'}
        </ToggleBtn>

        {/* Auto Drive toggle */}
        <ToggleBtn onClick={toggleAutoDrive} isDayMode={isDayMode} active={autoDrive}>
          <span style={{ fontSize:14 }}>{autoDrive ? '🤖' : '🎮'}</span>
          {autoDrive ? 'AUTO' : 'MANUAL'}
        </ToggleBtn>

        {/* Camera Mode */}
        <div style={{ display:'flex', gap:5 }}>
          {[
            { mode: 'follow',    icon: '📷', label: 'CHASE' },
            { mode: 'topdown',   icon: '🔭', label: 'TOP' },
            { mode: 'cinematic', icon: '🎬', label: 'CINE' },
          ].map(({ mode, icon, label }) => (
            <ToggleBtn
              key={mode}
              onClick={() => setCameraMode(mode)}
              isDayMode={isDayMode}
              active={cameraMode === mode}
              small
            >
              {icon} {label}
            </ToggleBtn>
          ))}
        </div>
      </div>

      {/* ── Controls hint ── */}
      <div style={{
        position:'fixed', bottom:22, left:22, zIndex:100,
        opacity: showControls ? 1 : 0,
        transition:'opacity 2s ease',
        pointerEvents:'none',
      }}>
        <Panel>
          <div style={{ color:'#f4d03f', fontWeight:'bold', letterSpacing:3, fontSize:11, marginBottom:10 }}>CONTROLS</div>
          <Row><KEY>W</KEY><KEY>A</KEY><KEY>S</KEY><KEY>D</KEY> &nbsp;/&nbsp; <KEY>↑↓←→</KEY> &nbsp; Move</Row>
          <Row><KEY>SPACE</KEY> &nbsp; Jump</Row>
          <Row><KEY>SHIFT</KEY> &nbsp; Boost</Row>
          <Row><KEY>C</KEY> &nbsp; Camera Mode</Row>
          <Row><KEY>T</KEY> &nbsp; Auto Drive</Row>
          <div style={{ marginTop:10, color:'#555577', fontSize:10, letterSpacing:2 }}>
            DRIVE NEAR GLOWING CUBES TO EXPLORE
          </div>
        </Panel>
      </div>

      {/* ── Car Controls UI ── */}
      <div style={{
        position:'fixed', bottom:22, left:'50%', transform:'translateX(-50%)', zIndex:100,
        display:'flex', gap:12, alignItems:'flex-end'
      }}>
        <CarSettings />
        <QuickNav />
      </div>

      {/* ── Navigation indicator ── */}
      {isNavigating && (
        <div style={{
          position:'fixed', top:'50%', left:'50%', transform:'translate(-50%, -50%)',
          zIndex:150, pointerEvents:'none',
          fontFamily:'"Courier New",monospace', textAlign:'center',
        }}>
          <div style={{
            background:'rgba(0,0,0,0.7)', border:'1px solid rgba(244,208,63,0.4)',
            borderRadius:12, padding:'12px 24px',
            animation:'navPulse 1.5s ease-in-out infinite',
          }}>
            <div style={{ color:'#f4d03f', fontSize:11, letterSpacing:3, marginBottom:4 }}>NAVIGATING TO</div>
            <div style={{ color:'#fff', fontSize:16, fontWeight:'bold', letterSpacing:2 }}>
              {navTarget?.toUpperCase() || ''}
            </div>
            <div style={{ color:'#888', fontSize:9, marginTop:4, letterSpacing:2 }}>
              PRESS WASD TO CANCEL
            </div>
          </div>
          <style>{`@keyframes navPulse{0%,100%{opacity:0.85;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.03)}}`}</style>
        </div>
      )}

      {/* ── Speed indicator ── */}
      <SpeedIndicator currentSpeed={currentSpeed} />

      {/* ── Section modal ── */}
      {activeSection && activeSection !== 'map' && (
        <div style={{
          position:'fixed', inset:0, zIndex:200,
          display:'flex', alignItems:'center', justifyContent:'center',
          background:'rgba(0,0,0,0.72)', backdropFilter:'blur(6px)',
          animation:'fadeIn 0.3s ease',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setActiveSection(null) }}
        >
          <div style={{
            background:'#080d14', border:'1px solid rgba(244,208,63,0.35)',
            borderRadius:16, padding:'36px 42px', maxWidth:580, width:'92%',
            color:'#dde', fontFamily:'"Courier New",monospace',
            position:'relative', boxShadow:'0 0 60px rgba(244,208,63,0.08)',
            maxHeight:'85vh', overflowY:'auto',
          }}>
            <button onClick={() => setActiveSection(null)} style={{
              position:'absolute', top:14, right:18,
              background:'none', border:'none', color:'#556', cursor:'pointer', fontSize:22,
            }}>✕</button>
            {activeSection === 'about'      && <AboutContent />}
            {activeSection === 'projects'   && <ProjectsContent />}
            {activeSection === 'contact'    && <ContactContent />}
            {activeSection === 'skills'     && <SkillsContent />}
            {activeSection === 'awards'     && <AwardsContent />}
            {activeSection === 'experience' && <ExperienceContent />}
            {activeSection === 'milestones' && <MilestonesContent />}
          </div>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
      )}

      {/* ── Map Overlay ── */}
      {(showMap || activeSection === 'map') && (
        <MapOverlay 
          onClose={() => { setShowMap(false); setActiveSection(null); }} 
          navigateTo={(s) => { setShowMap(false); setActiveSection(null); navigateTo(s) }} 
          carPosition={useGameStore.getState().carPosition} 
        />
      )}
    </>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const Btn = ({ onClick, children, active = false }) => (
  <button onClick={onClick} style={{
    background: active ? 'rgba(244,208,63,0.2)' : 'rgba(0,0,0,0.6)', 
    border: active ? '1px solid #f4d03f' : '1px solid rgba(244,208,63,0.35)',
    borderRadius:8, color:'#f4d03f', padding:'7px 14px', cursor:'pointer',
    fontFamily:'"Courier New",monospace', fontSize:12, letterSpacing:1,
    transition: 'all 0.2s',
  }}>{children}</button>
)

const ToggleBtn = ({ onClick, children, isDayMode, active, small }) => (
  <button onClick={onClick} style={{
    display:'flex', alignItems:'center', gap:6,
    background: active
      ? (isDayMode ? 'rgba(26,51,85,0.2)' : 'rgba(244,208,63,0.2)')
      : (isDayMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'),
    border: active
      ? (isDayMode ? '1px solid #1a3355' : '1px solid #f4d03f')
      : (isDayMode ? '1px solid rgba(26,51,85,0.3)' : '1px solid rgba(244,208,63,0.35)'),
    borderRadius:8, padding: small ? '5px 8px' : '7px 14px', cursor:'pointer',
    fontFamily:'"Courier New",monospace', fontSize: small ? 10 : 12, letterSpacing: small ? 1 : 2,
    color: isDayMode ? '#1a3355' : '#f4d03f',
    transition: 'all 0.3s ease',
  }}>{children}</button>
)

const Panel = ({ children }) => (
  <div style={{
    background:'rgba(0,0,0,0.78)', border:'1px solid rgba(244,208,63,0.2)',
    borderRadius:12, padding:'14px 18px', color:'#ccc',
    fontFamily:'"Courier New",monospace', fontSize:12, lineHeight:2.0,
  }}>{children}</div>
)
const Row = ({ children }) => <div style={{ marginBottom:2 }}>{children}</div>

function CarSettings() {
  const { carSpeed, setCarSpeed, selectedCar, setSelectedCar } = useGameStore()
  return (
    <Panel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15, width: 280 }}>
        <div>
          <div style={{ color:'#f4d03f', fontSize:10, letterSpacing:2, marginBottom:8 }}>VEHICLE</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn active={selectedCar === 'cyber'} onClick={() => setSelectedCar('cyber')}>CYBER</Btn>
            <Btn active={selectedCar === 'modern'} onClick={() => setSelectedCar('modern')}>MODERN</Btn>
            <Btn active={selectedCar === 'sporty'} onClick={() => setSelectedCar('sporty')}>SPORTY</Btn>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color:'#f4d03f', fontSize:10, letterSpacing:2, marginBottom:8 }}>
            <span>MAX SPEED</span>
            <span>{carSpeed}</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="35" 
            value={carSpeed} 
            onChange={(e) => setCarSpeed(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f4d03f' }}
          />
        </div>
      </div>
    </Panel>
  )
}

const NAV_SECTIONS = [
  { section:'about',      icon:'🏢', label:'ABOUT',      color:'#3498db' },
  { section:'awards',     icon:'🏆', label:'AWARDS',     color:'#f1c40f' },
  { section:'experience', icon:'📜', label:'EXPERIENCE', color:'#bdc3c7' },
  { section:'contact',    icon:'💼', label:'CONTACT',    color:'#e67e22' },
  { section:'projects',   icon:'🚓', label:'PROJECTS',   color:'#e74c3c' },
  { section:'milestones', icon:'🚀', label:'MILESTONES', color:'#9b59b6' },
  { section:'map',        icon:'🗺️', label:'MAP HUB',    color:'#f39c12' },
  { section:'skills',     icon:'🏥', label:'SKILLS',     color:'#2ecc71' },
]

function QuickNav() {
  const { navigateTo, isNavigating, navTarget } = useGameStore()
  return (
    <Panel>
      <div style={{ display:'flex', flexDirection:'column', gap:10, minWidth:130 }}>
        <div style={{ color:'#f4d03f', fontSize:10, letterSpacing:2, marginBottom:2 }}>NAVIGATE</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {NAV_SECTIONS.map(({ section, icon, label, color }) => (
            <button
              key={section}
              onClick={() => navigateTo(section)}
              disabled={isNavigating}
              style={{
                display:'flex', alignItems:'center', gap:8,
                background: navTarget === section ? `${color}33` : 'rgba(255,255,255,0.04)',
                border: navTarget === section ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
                borderRadius:6, padding:'5px 10px', cursor: isNavigating ? 'not-allowed' : 'pointer',
                fontFamily:'"Courier New",monospace', fontSize:10, letterSpacing:1,
                color: navTarget === section ? color : '#aab',
                opacity: isNavigating && navTarget !== section ? 0.4 : 1,
                transition:'all 0.3s ease',
              }}
            >
              <span style={{ fontSize:13 }}>{icon}</span> {label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function SpeedIndicator({ currentSpeed }) {
  const displaySpeed = Math.min(Math.round(currentSpeed * 20), 999)

  return (
    <div style={{
      position:'fixed', bottom:22, right:22, zIndex:100,
      fontFamily:'"Courier New",monospace',
      background:'rgba(0,0,0,0.6)', border:'1px solid rgba(244,208,63,0.2)',
      borderRadius:10, padding:'10px 16px', textAlign:'center', minWidth:80,
    }}>
      <div style={{ color:'#f4d03f', fontSize:22, fontWeight:'bold' }}>{displaySpeed}</div>
      <div style={{ color:'#556', fontSize:9, letterSpacing:2 }}>KM/H</div>
      {/* Speed bar */}
      <div style={{ marginTop:6, height:3, background:'#222', borderRadius:2, overflow:'hidden' }}>
        <div style={{
          width: `${Math.min(displaySpeed / 5, 100)}%`,
          height:'100%',
          background: displaySpeed > 400 ? '#ff4444' : displaySpeed > 200 ? '#f4d03f' : '#3498db',
          borderRadius:2,
          transition: 'width 0.15s ease, background 0.3s ease',
        }} />
      </div>
    </div>
  )
}

// ── Section content panels ───────────────────────────────────────────────────
const Title = ({ color = '#f4d03f', children }) => (
  <div style={{
    color, fontSize:20, fontWeight:'bold', letterSpacing:4,
    marginBottom:22, textTransform:'uppercase',
    borderBottom:'1px solid rgba(244,208,63,0.18)', paddingBottom:12,
  }}>{children}</div>
)

function AboutContent() {
  return (
    <>
      <Title>About Me</Title>
      <p style={{ lineHeight:1.9, color:'#bbc', marginBottom:16 }}>
        Hi! I'm <span style={{ color:'#f4d03f', fontWeight:'bold' }}>Swadhinjit Sahoo</span> — a full-stack developer
        and creative technologist passionate about building immersive, meaningful digital experiences.
      </p>
      <p style={{ lineHeight:1.9, color:'#99a', marginBottom:16 }}>
        Inspired by pioneers like Bruno Simon, I believe the web should be playful, memorable, and alive.
        I specialize in real-time 3D, scalable backends, and pixel-perfect UIs.
      </p>
      <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginTop:20, color:'#778', fontSize:12 }}>
        {['🎓 B.Tech CS', '🌍 India', '💻 3+ Yrs Exp', '🎮 Game Dev Hobbyist'].map(t => (
          <span key={t} style={{ background:'rgba(244,208,63,0.06)', border:'1px solid rgba(244,208,63,0.15)', borderRadius:6, padding:'5px 10px' }}>{t}</span>
        ))}
      </div>
    </>
  )
}

function ProjectsContent() {
  const projects = [
    { name:'Portfolio 3D', desc:'This very site — an interactive 3D game-world portfolio.', tech:'Three.js · R3F · Rapier · React', color:'#3498db' },
    { name:'DevConnect',   desc:'Real-time collaborative coding with WebRTC pair programming.', tech:'Node.js · WebRTC · Socket.io · Monaco', color:'#2ecc71' },
    { name:'AstroTrack',  desc:'Live 3D solar system using real NASA Horizons API data.', tech:'Three.js · NASA API · D3', color:'#9b59b6' },
    { name:'ShopFlow',    desc:'E-commerce platform with WebXR augmented-reality product preview.', tech:'React · WebXR · Stripe · Postgres', color:'#e67e22' },
  ]
  return (
    <>
      <Title>Projects</Title>
      {projects.map(p => (
        <div key={p.name} style={{ marginBottom:14, padding:'12px 16px', background:'rgba(255,255,255,0.03)', border:`1px solid ${p.color}33`, borderRadius:10 }}>
          <div style={{ color:p.color, fontWeight:'bold', marginBottom:5 }}>◆ {p.name}</div>
          <div style={{ color:'#aab', fontSize:12, marginBottom:6, lineHeight:1.6 }}>{p.desc}</div>
          <div style={{ color:'#556', fontSize:10, letterSpacing:1 }}>{p.tech}</div>
        </div>
      ))}
    </>
  )
}

function SkillsContent() {
  const cats = [
    { label:'Frontend', color:'#3498db', skills:['React','Three.js','WebGL','GLSL','TypeScript','Next.js','Tailwind'] },
    { label:'Backend',  color:'#2ecc71', skills:['Node.js','Python','PostgreSQL','Redis','GraphQL','REST','Docker'] },
    { label:'Tools',    color:'#e67e22', skills:['Git','AWS','Figma','Blender','WebXR','Rapier','R3F'] },
  ]
  return (
    <>
      <Title>Skills</Title>
      {cats.map(c => (
        <div key={c.label} style={{ marginBottom:18 }}>
          <div style={{ color:c.color, fontSize:11, letterSpacing:3, marginBottom:10 }}>{c.label}</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {c.skills.map(s => (
              <span key={s} style={{
                background:`${c.color}18`, border:`1px solid ${c.color}55`,
                color:c.color, padding:'5px 12px', borderRadius:20, fontSize:11, letterSpacing:1,
              }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function ContactContent() {
  return (
    <>
      <Title>Contact</Title>
      <p style={{ color:'#aab', lineHeight:1.9, marginBottom:24 }}>
        Open to freelance projects, full-time roles, and creative collaborations. Let's make something great.
      </p>
      {[
        { icon:'📧', label:'Email',    value:'swadhinjit@example.com',      color:'#e74c3c' },
        { icon:'🐙', label:'GitHub',   value:'github.com/swadhinjit',       color:'#aaa' },
        { icon:'💼', label:'LinkedIn', value:'linkedin.com/in/swadhinjit',  color:'#3498db' },
        { icon:'🐦', label:'Twitter',  value:'@swadhinjit',                 color:'#1da1f2' },
      ].map(({ icon, label, value, color }) => (
        <div key={label} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14, fontSize:13 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <span style={{ color:'#445', width:72, letterSpacing:1, fontSize:11 }}>{label}</span>
          <span style={{ color }}>{value}</span>
        </div>
      ))}
    </>
  )
}

function AwardsContent() {
  return (
    <>
      <Title color="#f1c40f">Awards & Certifications</Title>
      <div style={{ color:'#aab', lineHeight:1.9, marginBottom:16 }}>
        <div style={{ color:'#f1c40f', fontWeight:'bold' }}>◆ AWS Certified Solutions Architect</div>
        <div style={{ fontSize:11 }}>Amazon Web Services — 2025</div>
      </div>
      <div style={{ color:'#aab', lineHeight:1.9, marginBottom:16 }}>
        <div style={{ color:'#f1c40f', fontWeight:'bold' }}>◆ Hackathon Winner: Web3 Global</div>
        <div style={{ fontSize:11 }}>First place in decentralized applications track — 2024</div>
      </div>
      <div style={{ color:'#aab', lineHeight:1.9 }}>
        <div style={{ color:'#f1c40f', fontWeight:'bold' }}>◆ Frontend Masters: WebGL Mastery</div>
        <div style={{ fontSize:11 }}>Advanced creative coding and shaders certification — 2023</div>
      </div>
    </>
  )
}

function ExperienceContent() {
  return (
    <>
      <Title color="#bdc3c7">Work Experience</Title>
      <div style={{ color:'#aab', lineHeight:1.9, marginBottom:16 }}>
        <div style={{ color:'#bdc3c7', fontWeight:'bold', fontSize:14 }}>Senior Frontend Engineer</div>
        <div style={{ color:'#fff' }}>TechNova Inc. | 2024 - Present</div>
        <ul style={{ paddingLeft:20, marginTop:6, fontSize:12 }}>
          <li>Lead developer for a 3D e-commerce configurator.</li>
          <li>Improved bundle size by 40% and rendering performance by 60FPS.</li>
        </ul>
      </div>
      <div style={{ color:'#aab', lineHeight:1.9 }}>
        <div style={{ color:'#bdc3c7', fontWeight:'bold', fontSize:14 }}>Full Stack Developer</div>
        <div style={{ color:'#fff' }}>Creative Solutions Agency | 2022 - 2024</div>
        <ul style={{ paddingLeft:20, marginTop:6, fontSize:12 }}>
          <li>Built scalable dashboards using React and Node.js.</li>
          <li>Mentored junior developers and introduced TypeScript.</li>
        </ul>
      </div>
    </>
  )
}

function MilestonesContent() {
  return (
    <>
      <Title color="#9b59b6">Key Milestones</Title>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center', marginTop:20 }}>
        <div style={{ background:'rgba(155, 89, 182, 0.1)', border:'1px solid rgba(155, 89, 182, 0.3)', padding:20, borderRadius:12, width:'45%', textAlign:'center' }}>
          <div style={{ color:'#9b59b6', fontSize:28, fontWeight:'bold' }}>1M+</div>
          <div style={{ color:'#aab', fontSize:10, letterSpacing:1, marginTop:4 }}>LINES OF CODE</div>
        </div>
        <div style={{ background:'rgba(155, 89, 182, 0.1)', border:'1px solid rgba(155, 89, 182, 0.3)', padding:20, borderRadius:12, width:'45%', textAlign:'center' }}>
          <div style={{ color:'#9b59b6', fontSize:28, fontWeight:'bold' }}>50+</div>
          <div style={{ color:'#aab', fontSize:10, letterSpacing:1, marginTop:4 }}>PROJECTS DEPLOYED</div>
        </div>
        <div style={{ background:'rgba(155, 89, 182, 0.1)', border:'1px solid rgba(155, 89, 182, 0.3)', padding:20, borderRadius:12, width:'45%', textAlign:'center' }}>
          <div style={{ color:'#9b59b6', fontSize:28, fontWeight:'bold' }}>10+</div>
          <div style={{ color:'#aab', fontSize:10, letterSpacing:1, marginTop:4 }}>OPEN SOURCE PRs</div>
        </div>
        <div style={{ background:'rgba(155, 89, 182, 0.1)', border:'1px solid rgba(155, 89, 182, 0.3)', padding:20, borderRadius:12, width:'45%', textAlign:'center' }}>
          <div style={{ color:'#9b59b6', fontSize:28, fontWeight:'bold' }}>5</div>
          <div style={{ color:'#aab', fontSize:10, letterSpacing:1, marginTop:4 }}>YEARS EXPERIENCE</div>
        </div>
      </div>
    </>
  )
}

function MapOverlay({ onClose, navigateTo, carPosition }) {
  const mapPoints = [
    { id: 'about',      label: '🏢 OFFICE',     color: '#3498db', x: 30, y: 10 },
    { id: 'awards',     label: '🏆 AWARDS',     color: '#f1c40f', x: 70, y: 10 },
    { id: 'projects',   label: '🚓 POLICE',     color: '#e74c3c', x: 90, y: 30 },
    { id: 'milestones', label: '🚀 MILESTONES', color: '#9b59b6', x: 90, y: 70 },
    { id: 'contact',    label: '💼 TECH LAB',   color: '#e67e22', x: 70, y: 90 },
    { id: 'experience', label: '📜 EXPERIENCE', color: '#bdc3c7', x: 30, y: 90 },
    { id: 'map',        label: '🗺️ MAP HUB',    color: '#f39c12', x: 10, y: 70 },
    { id: 'skills',     label: '🏥 HOSPITAL',   color: '#2ecc71', x: 10, y: 30 },
  ]
  
  // Map world pos to 0-100% (world bounds are -200 to 200 on X and Z)
  // X maps to left (0-100), Z maps to top (0-100)
  const carX = Math.max(0, Math.min(100, (carPosition[0] + 200) / 400 * 100))
  const carY = Math.max(0, Math.min(100, (carPosition[2] + 200) / 400 * 100))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s ease',
      fontFamily: '"Courier New",monospace',
    }}>
      <div style={{
        position: 'relative', width: '85vw', height: '85vh', maxWidth: 800, maxHeight: 700,
        background: 'rgba(10, 15, 25, 0.95)', border: '1px solid rgba(244, 208, 63, 0.4)',
        borderRadius: 20, boxShadow: '0 0 80px rgba(0, 0, 0, 0.8)',
        padding: 24, display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ color: '#f4d03f', fontSize: 24, fontWeight: 'bold', letterSpacing: 4 }}>
            SECTOR MAP
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#aab', fontSize: 28, cursor: 'pointer',
            padding: 0, lineHeight: 1
          }}>✕</button>
        </div>
        
        {/* Map Area */}
        <div style={{ position: 'relative', width: '100%', flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          
          {/* Grid lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '10% 10%' }} />
          
          {/* Cross lines connecting points */}
          <div style={{ position: 'absolute', top: '50%', left: '10%', right: '10%', height: 2, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '10%', bottom: '10%', width: 2, background: 'rgba(255,255,255,0.1)' }} />

          {/* Center node */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 16, height: 16, borderRadius: '50%', border: '2px solid #f4d03f', background: '#000'
          }} />

          {/* Checkpoints */}
          {mapPoints.map(p => (
            <button key={p.id} onClick={() => navigateTo(p.id)} style={{
              position: 'absolute', top: `${p.y}%`, left: `${p.x}%`, transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', padding: 10,
              zIndex: 10
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', background: p.color,
                boxShadow: `0 0 20px ${p.color}`, border: '2px solid #fff',
                animation: 'pulseGlow 2s infinite alternate'
              }} />
              <div style={{
                background: 'rgba(0,0,0,0.8)', color: p.color, border: `1px solid ${p.color}`,
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap'
              }}>{p.label}</div>
            </button>
          ))}

          {/* Car position indicator */}
          <div style={{
            position: 'absolute', top: `${carY}%`, left: `${carX}%`, transform: 'translate(-50%, -50%)',
            width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '16px solid #fff',
            filter: 'drop-shadow(0 0 8px #fff)', zIndex: 20, pointerEvents: 'none',
            transition: 'all 0.5s ease-out'
          }} />
        </div>
      </div>
      <style>{`
        @keyframes pulseGlow { from { opacity: 0.6; transform: scale(0.9); } to { opacity: 1; transform: scale(1.1); } }
      `}</style>
    </div>
  )
}
