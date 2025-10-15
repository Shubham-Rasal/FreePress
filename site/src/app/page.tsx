"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import FooterSection from "../components/footer-section"

// Reusable Badge Component
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="px-[14px] py-[6px] bg-white shadow-[0px_0px_0px_4px_rgba(55,50,47,0.05)] overflow-hidden rounded-[90px] flex justify-start items-center gap-[8px] border border-[rgba(2,6,23,0.08)] shadow-xs">
      <div className="w-[14px] h-[14px] relative overflow-hidden flex items-center justify-center">{icon}</div>
      <div className="text-center flex justify-center flex-col text-[#37322F] text-xs font-medium leading-3 font-sans">
        {text}
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [activeCard, setActiveCard] = useState(0)
  const [progress, setProgress] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    const progressInterval = setInterval(() => {
      if (!mountedRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          if (mountedRef.current) {
            setActiveCard((current) => (current + 1) % 3)
          }
          return 0
        }
        return prev + 2 // 2% every 100ms = 5 seconds total
      })
    }, 100)

    return () => {
      clearInterval(progressInterval)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const handleCardClick = (index: number) => {
    if (!mountedRef.current) return
    setActiveCard(index)
    setProgress(0)
  }

  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <div className="flex justify-start items-center">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      FreePress
                    </div>
                  </div>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-start hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                    <a href="#how-it-works" className="flex justify-start items-center hover:text-[#37322F] transition-colors">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        How it works
                      </div>
                    </a>
                    <a href="#under-the-hood" className="flex justify-start items-center hover:text-[#37322F] transition-colors">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Under the hood
                      </div>
                    </a>
                    <a href="https://github.com/Shubham-Rasal/FreePress#readme" target="_blank" rel="noopener noreferrer" className="flex justify-start items-center hover:text-[#37322F] transition-colors">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Docs
                      </div>
                    </a>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <a 
                    href="https://github.com/Shubham-Rasal/FreePress" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#F7F5F3] transition-colors"
                  >
                    <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                      GitHub →
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-[216px] pb-8 sm:pb-12 md:pb-16 flex flex-col justify-start items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full sm:pl-0 sm:pr-0 pl-0 pr-0">
              <div className="w-full max-w-[937px] lg:w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                <div className="self-stretch rounded-[3px] flex flex-col justify-center items-center gap-4 sm:gap-5 md:gap-6 lg:gap-8">
                  <div className="w-full max-w-[748.71px] lg:w-[748.71px] text-center flex justify-center flex-col text-[#37322F] text-[24px] xs:text-[28px] sm:text-[36px] md:text-[52px] lg:text-[80px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-24 font-serif px-2 sm:px-4 md:px-0">
                    FreePress — Publish Without Permission
                  </div>
                  <div className="w-full max-w-[506.08px] lg:w-[506.08px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.80)] sm:text-lg md:text-xl leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-7 font-sans px-2 sm:px-4 md:px-0 lg:text-lg font-medium text-sm">
                    Censorship-resistant publishing powered by WordPress, Tor, IPFS, and Waku. Mirror your site, sign with cryptography, and broadcast to a decentralized discovery network — all from your own machine.
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[497px] lg:w-[497px] flex flex-col justify-center items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10 mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <div className="backdrop-blur-[8.25px] flex justify-start items-center gap-4">
                  <a 
                    href="https://github.com/Shubham-Rasal/FreePress" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#49423D] transition-colors"
                  >
                    <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                    <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                      Get Started on GitHub
                    </div>
                  </a>
                </div>
              </div>

              <div className="absolute top-[232px] sm:top-[248px] md:top-[264px] lg:top-[320px] left-1/2 transform -translate-x-1/2 z-0 pointer-events-none">
                <img
                  src="/mask-group-pattern.svg"
                  alt=""
                  className="w-[936px] sm:w-[1404px] md:w-[2106px] lg:w-[2808px] h-auto opacity-30 sm:opacity-40 md:opacity-50 mix-blend-multiply"
                  style={{
                    filter: "hue-rotate(15deg) saturate(0.7) brightness(1.2)",
                  }}
                />
              </div>

              {/* Architecture Diagram */}
              <div className="w-full max-w-[960px] lg:w-[960px] pt-2 sm:pt-4 pb-6 sm:pb-8 md:pb-10 px-2 sm:px-4 md:px-6 lg:px-11 flex flex-col justify-center items-center gap-2 relative z-5 my-8 sm:my-12 md:my-16 lg:my-16 mb-0 lg:pb-0">
                
              </div>

              <div className="self-stretch border-t border-[#E0DEDB] border-b border-[#E0DEDB] flex justify-center items-start">
                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Left decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 px-0 sm:px-2 md:px-0 flex flex-col md:flex-row justify-center items-stretch gap-0">
                  <FeatureCard
                    title="WordPress + Tor"
                    description="Run WordPress locally in Docker. Mirror your site via Tor onion service for anonymous publishing."
                    isActive={activeCard === 4}
                    progress={activeCard === 0 ? progress : 0}
                    onClick={() => handleCardClick(0)}
                  />
                  <FeatureCard
                    title="IPFS Publishing"
                    description="Static site mirrors are automatically synced to IPFS every 60 seconds for permanent, distributed storage."
                    isActive={activeCard === 1}
                    progress={activeCard === 1 ? progress : 0}
                    onClick={() => handleCardClick(1)}
                  />
                  <FeatureCard
                    title="Waku Discovery"
                    description="Sign manifests with Ed25519 keys and broadcast to Waku network. Others discover and mirror your content."
                    isActive={activeCard === 2}
                    progress={activeCard === 2 ? progress : 0}
                    onClick={() => handleCardClick(2)}
                  />
                </div>

                <div className="w-4 sm:w-6 md:w-8 lg:w-12 self-stretch relative overflow-hidden">
                  {/* Right decorative pattern */}
                  <div className="w-[120px] sm:w-[140px] md:w-[162px] left-[-40px] sm:left-[-50px] md:left-[-58px] top-[-120px] absolute flex flex-col justify-start items-start">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="self-stretch h-3 sm:h-4 rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(3,7,18,0.08)] outline-offset-[-0.25px]"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>


              <section id="how-it-works" className="w-full border-b border-[rgba(55,50,47,0.12)] py-12 sm:py-16">
                <div className="max-w-[1060px] mx-auto px-4 flex flex-col gap-8">
                  <div className="text-center">
                    <h2 className="text-[#49423D] text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight font-sans text-balance">
                      How It Works
                    </h2>
                    <p className="mt-3 text-[#605A57] text-sm sm:text-base leading-7">
                      Launch WordPress locally, mirror via Tor, publish to IPFS, sign with cryptography, and announce to the discovery network.
                    </p>
                  </div>

                  <ol className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">1. Launch the Stack</h3>
                      <pre className="mt-3 p-4 rounded-md bg-[#F7F5F3] text-[#37322F] text-sm overflow-auto">
                        {`git clone https://github.com/Shubham-Rasal/FreePress.git
cd FreePress
docker compose up -d`}
                      </pre>
                      <p className="mt-3 text-[#605A57] text-sm">WordPress, Tor, IPFS, and the frontend run in containers on your machine.</p>
                    </li>
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">2. Create Content</h3>
                      <p className="mt-3 text-[#605A57] text-sm">
                        Access WordPress at localhost:80, write your posts, and build your site. Everything runs locally with no accounts.
                      </p>
                    </li>
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">3. Mirror via Tor</h3>
                      <p className="mt-3 text-[#605A57] text-sm">
                        Click "Create Mirror" to generate a static copy served through your Tor onion address. Automatic syncing to IPFS happens every 60 seconds.
                      </p>
                    </li>
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">4. Sign & Announce</h3>
                      <p className="mt-3 text-[#605A57] text-sm">
                        Generate an Ed25519 keypair, add metadata (title, description, tags), and broadcast your signed manifest to the Waku discovery network.
                      </p>
                    </li>
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">5. Discover Others</h3>
                      <p className="mt-3 text-[#605A57] text-sm">
                        Browse the Explore tab to see publications announced by others. Search by tags, verify signatures, and access content via IPFS or Tor.
                      </p>
                    </li>
                    <li className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                      <h3 className="text-[#37322F] font-semibold">6. Stay Resilient</h3>
                      <p className="mt-3 text-[#605A57] text-sm">
                        Your content is pinned on IPFS and discoverable via Waku. Even when you go offline, mirrors keep your publication accessible.
                      </p>
                    </li>
                  </ol>

                  <div className="p-5 rounded-md border border-[#E0DEDB] bg-white">
                    <h3 className="text-[#37322F] font-semibold">Cryptographic Verification</h3>
                    <p className="mt-3 text-[#605A57] text-sm">
                      Every manifest includes version, site CID, timestamp, publisher public key, and Ed25519 signature. Anyone can verify authenticity without trusting a central authority.
                    </p>
                  </div>
                </div>
              </section>

              <section id="under-the-hood" className="w-full border-b border-[rgba(55,50,47,0.12)] py-12 sm:py-16">
                <div className="max-w-[1060px] mx-auto px-4">
                  <h2 className="text-[#49423D] text-2xl sm:text-3xl md:text-5xl font-semibold leading-tight font-sans text-balance text-center">
                    Under the Hood
                  </h2>
                  <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-left border border-[#E0DEDB] bg-white rounded-md">
                      <thead className="bg-[#F7F5F3]">
                        <tr className="text-[#37322F] text-sm">
                          <th className="px-4 py-3 border-b border-[#E0DEDB]">Layer</th>
                          <th className="px-4 py-3 border-b border-[#E0DEDB]">Technology</th>
                          <th className="px-4 py-3 border-b border-[#E0DEDB]">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="text-[#605A57] text-sm">
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">CMS</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">WordPress + MySQL</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Local content creation</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Anonymity</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Tor (onionize)</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Onion service for site access</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Mirroring</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">wget + torsocks</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Static site generation via Tor</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Storage</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">IPFS (Kubo + Cluster)</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Distributed content storage</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Identity</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Ed25519 keypair</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Cryptographic signing</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Discovery</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Waku (libp2p + protobuf)</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">P2P manifest announcements</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Backend</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">Node.js + Hono</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB]">API for signing and mirroring</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 border-t border-[#E0DEDB] rounded-b-md">Frontend</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB] rounded-b-md">React + TypeScript + Vite</td>
                          <td className="px-4 py-3 border-t border-[#E0DEDB] rounded-b-md">Dashboard UI</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>


              <section className="w-full border-b border-[rgba(55,50,47,0.12)] py-12 sm:py-16">
                <div className="max-w-[900px] mx-auto px-4 text-center">
                  <blockquote className="text-[#49423D] text-lg sm:text-xl font-serif text-pretty">
                    "Censorship-resistant publishing isn't about hoping platforms let you speak. It's about taking control. Run your own stack. Sign your own manifests. Join a network that can't be shut down."
                  </blockquote>
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <a 
                      href="https://github.com/Shubham-Rasal/FreePress" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-full bg-[#37322F] text-white text-sm font-medium hover:bg-[#49423D] transition-colors"
                    >
                      Get Started on GitHub
                    </a>
                    <a
                      href="https://github.com/Shubham-Rasal/FreePress#-quick-start"
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-full bg-white border border-[#E0DEDB] text-[#37322F] text-sm font-medium hover:bg-[#F7F5F3] transition-colors"
                    >
                      Documentation →
                    </a>
                  </div>
                </div>
              </section>

              {/* DocumentationSection /> */}
              {/* TestimonialsSection /> */}
              {/* PricingSection /> */}
              {/* FAQSection /> */}
              {/* CTASection /> */}

              {/* Footer Section */}
              <FooterSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// FeatureCard component definition inline to fix import error
function FeatureCard({
  title,
  description,
  isActive,
  progress,
  onClick,
}: {
  title: string
  description: string
  isActive: boolean
  progress: number
  onClick: () => void
}) {
  return (
    <div
      className={`w-full md:flex-1 self-stretch px-6 py-5 overflow-hidden flex flex-col justify-start items-start gap-2 cursor-pointer relative border-b md:border-b-0 last:border-b-0 ${
        isActive
          ? "bg-white shadow-[0px_0px_0px_0.75px_#E0DEDB_inset]"
          : "border-l-0 border-r-0 md:border border-[#E0DEDB]/80"
      }`}
      onClick={onClick}
    >
      {isActive && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-[rgba(50,45,43,0.08)]">
          <div
            className="h-full bg-[#322D2B] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="self-stretch flex justify-center flex-col text-[#49423D] text-sm md:text-sm font-semibold leading-6 md:leading-6 font-sans">
        {title}
      </div>
      <div className="self-stretch text-[#605A57] text-[13px] md:text-[13px] font-normal leading-[22px] md:leading-[22px] font-sans">
        {description}
      </div>
    </div>
  )
}
