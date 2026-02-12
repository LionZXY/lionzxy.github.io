import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import './App.css'

// SVG Icons
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="40" height="40">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" width="26" height="26">
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="white" strokeWidth="2"/>
    <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="2"/>
    <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
  </svg>
)

const TelegramIcon = ({ color = 'white' }) => (
  <svg viewBox="0 0 24 24" fill={color} width="26" height="26">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

// Leaflet Map Component
function LeafletMap() {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (mapInstanceRef.current) return
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
      }).setView([51.49, -0.06], 10)

      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Custom pulsing marker - larger to match original
      const markerIcon = L.divIcon({
        className: 'map-marker-custom',
        html: '<div class="map-pin-outer"><div class="map-pin-inner"></div></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      L.marker([51.4805, -0.005], { icon: markerIcon }).addTo(map)

      mapInstanceRef.current = map
    })
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
}

// Generate contribution graph data (seeded for consistency)
function generateContributions() {
  const weeks = 16
  const days = 7
  const cells = []
  let seed = 42
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      seed = (seed * 16807 + 0) % 2147483647
      const rand = seed / 2147483647
      let level = 0
      if (rand > 0.25) level = 1
      if (rand > 0.45) level = 2
      if (rand > 0.65) level = 3
      if (rand > 0.82) level = 4
      cells.push(level)
    }
  }
  return cells
}

const contribColors = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
const contributions = generateContributions()

function BentoCard({ children, className = '', size = '1x1', delay = 0, href }) {
  const sizeClass = `card-${size}`
  const Tag = href ? 'a' : 'div'
  const linkProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Tag
      className={`card ${sizeClass} ${className} card-animate`}
      style={{ animationDelay: `${delay}ms` }}
      {...linkProps}
    >
      <div className="phantom-border" />
      {children}
    </Tag>
  )
}

function GitHubCard() {
  return (
    <BentoCard size="2x2" className="github-card" delay={100} href="https://github.com/lionzxy">
      <div className="card-inner">
        <div className="github-header">
          <GitHubIcon />
          <button className="follow-btn">Follow</button>
        </div>
        <div className="github-name">Nikita Kulikov</div>
        <div className="contribution-graph">
          <div className="contrib-months">
            <span>Nov</span>
            <span>Dec</span>
            <span>Jan</span>
            <span>Feb</span>
          </div>
          <div className="contrib-grid">
            {contributions.map((level, i) => (
              <div key={i} className="contrib-cell" style={{ backgroundColor: contribColors[level] }} />
            ))}
          </div>
          <div className="contrib-footer">911 contributions in the last year</div>
        </div>
      </div>
    </BentoCard>
  )
}

function MapCard() {
  return (
    <BentoCard size="2x1" className="map-card" delay={200} href="https://www.google.com/maps/@51.48,-0.005,11z">
      <div className="card-inner">
        <LeafletMap />
        <div className="map-overlay">London, UK</div>
      </div>
    </BentoCard>
  )
}

function TelegramChannelCard() {
  return (
    <BentoCard size="2x1" className="tg-channel-card" delay={300} href="https://t.me/localhost_ru">
      <div className="card-inner">
        <div className="tg-channel-info">
          <div className="card-icon" style={{ background: '#d6ecfa' }}>
            <TelegramIcon color="#2AABEE" />
          </div>
          <div className="card-title" style={{ fontSize: '0.9rem', lineHeight: 1.3 }}>
            On russian language: My Telegram Channel
          </div>
          <div className="card-subtitle">t.me</div>
        </div>
        <img src="/images/tg-channel.jpg" alt="Telegram Channel" className="tg-channel-img" />
      </div>
    </BentoCard>
  )
}

function LinkedInCard() {
  return (
    <BentoCard size="1x1" className="social-card" delay={350} href="https://linkedin.com/in/nikita-kulikov">
      <div className="card-inner">
        <div className="card-icon" style={{ background: '#0A66C2' }}>
          <LinkedInIcon />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="card-title">My CV</div>
          <div className="card-subtitle">linkedin.com</div>
        </div>
      </div>
    </BentoCard>
  )
}

function TwitterCard() {
  return (
    <BentoCard size="1x1" className="social-card" delay={400} href="https://twitter.com/lionzxy">
      <div className="card-inner">
        <div className="card-icon" style={{ background: '#55acee' }}>
          <TwitterIcon />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="card-title">Twitter</div>
          <div className="card-subtitle">@lionzxy</div>
          <div style={{ paddingTop: '8px' }}>
            <button className="social-follow-btn twitter-blue">Follow</button>
          </div>
        </div>
      </div>
    </BentoCard>
  )
}

function InstagramCard() {
  return (
    <BentoCard size="1x1" delay={450} href="https://instagram.com/lionzxy">
      <div className="card-inner">
        <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
          <InstagramIcon />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="card-title">@lionzxy</div>
          <div style={{ paddingTop: '8px' }}>
            <button className="social-follow-btn instagram-blue">
              Follow <span className="follower-count">123</span>
            </button>
          </div>
        </div>
      </div>
    </BentoCard>
  )
}

function TelegramCard() {
  return (
    <BentoCard size="1x1" delay={500} href="https://t.me/lionzxy">
      <div className="card-inner">
        <div className="card-icon" style={{ background: '#d8dce2' }}>
          <TelegramIcon color="#2AABEE" />
        </div>
        <div style={{ marginTop: 'auto' }}>
          <div className="card-title">Nikita Kulikov</div>
          <div className="card-subtitle">t.me</div>
        </div>
      </div>
    </BentoCard>
  )
}

function App() {
  return (
    <div className="bento-page">
      <div className="bento-container">
        <div className="profile-section">
          <img src="/images/avatar.jpg" alt="Nikita Kulikov" className="avatar profile-animate" style={{ animationDelay: '0ms' }} />
          <h1 className="profile-name profile-animate" style={{ animationDelay: '80ms' }}>Nikita Kulikov</h1>
          <p className="profile-bio profile-animate" style={{ animationDelay: '160ms' }}>
            Mobile Engineer in Flipper Devices. UK Global Talent, ex-Snapchat, ex-Yandex, ex-VK
          </p>
        </div>
        <div className="bento-grid">
          <GitHubCard />
          <MapCard />
          <TelegramChannelCard />
          <LinkedInCard />
          <TwitterCard />
          <InstagramCard />
          <TelegramCard />
        </div>
      </div>
    </div>
  )
}

export default App
