"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Search, UserPlus, Star, Home, Users, MessageCircle, Video, Sparkles, ArrowRight } from "lucide-react";
import { VillageHeader, WoodenFrame, ParchmentNote, ScrollContainer, PixelButton, SignPlank } from "@/components/village";

// Activity feed items for Town Crier
const activityItems = [
  {
    icon: UserPlus,
    text: "VillagerLuna joined the party!",
    time: "2 mins ago",
    bgColor: "bg-[#f48c25]/20",
  },
  {
    icon: Heart,
    text: "New match found!",
    time: "15 mins ago",
    bgColor: "bg-red-100",
    iconColor: "text-red-500 fill-red-500",
  },
  {
    icon: Star,
    text: "Quest updated: 'First Date'",
    time: "1 hour ago",
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600 fill-yellow-600",
  },
  {
    icon: MessageCircle,
    text: "New message in Tavern!",
    time: "2 hours ago",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-500",
  },
];

// Stats for the landing page
const stats = [
  { value: "50K+", label: "Villagers", icon: Users },
  { value: "2M+", label: "Matches", icon: Heart },
  { value: "10K+", label: "Daily Quests", icon: Star },
];

// Features
const features = [
  {
    icon: Heart,
    title: "Smart Matching",
    description: "AI-powered algorithm finds your perfect match based on interests and vibes",
    color: "bg-primary-red",
  },
  {
    icon: MessageCircle,
    title: "Ice Breakers",
    description: "Fun questions to start meaningful conversations naturally",
    color: "bg-accent-blue",
  },
  {
    icon: Sparkles,
    title: "Vibe Matching",
    description: "Connect through music tastes and discover new friends who share your sound",
    color: "bg-accent-pink",
  },
  {
    icon: Users,
    title: "Community Feed",
    description: "Share moments, join events, and engage with the community",
    color: "bg-accent-yellow",
  },
  {
    icon: Video,
    title: "Video Dating",
    description: "Real-time video calls to meet and vibe with matches instantly",
    color: "bg-landscape-green",
  },
  {
    icon: Star,
    title: "Rich Profiles",
    description: "Express yourself with photos, prompts, and personality insights",
    color: "bg-primary-orange",
  },
];

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{
        backgroundColor: "#76c442",
        backgroundImage:
          "linear-gradient(45deg, #63a632 25%, transparent 25%), linear-gradient(-45deg, #63a632 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #63a632 75%), linear-gradient(-45deg, transparent 75%, #63a632 75%)",
        backgroundSize: "40px 40px",
        backgroundPosition: "0 0, 0 20px, 20px -20px, -20px 0px",
      }}
    >
      {/* Header - Wood Grain */}
      <VillageHeader
        title="Peerzee Village"
        showSearch={true}
        searchPlaceholder="Search the village..."
        onSearchChange={setSearchQuery}
        navItems={[
          { label: "Tavern", href: "/chat" },
          { label: "Market", href: "/discover" },
        ]}
        rightContent={
          <div className="flex gap-2">
            <Link
              href="/login"
              className="bg-[#A07048] hover:bg-[#b08055] text-parchment px-4 py-1 font-pixel text-xl border-4 border-wood-dark hover:translate-y-[2px] transition-all duration-75"
              style={{ boxShadow: "2px 2px 0 #4A3B32" }}
            >
              Login
            </Link>
          </div>
        }
      />

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-10">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sidebar: Signpost */}
          <aside className="lg:col-span-3 hidden lg:flex flex-col items-center mt-10">
            {/* Pole Top */}
            <div className="w-4 h-4 bg-wood-dark mb-[-4px] rounded-t-full"></div>
            {/* Pole */}
            <div className="w-6 bg-[#8B5E3C] border-x-4 border-wood-dark h-[400px] flex flex-col items-center gap-8 py-8 relative">
              {/* Sign 1: Village Map - pointing left */}
              <Link href="/discover" className="absolute top-8 -left-6 w-52">
                <SignPlank direction="left">Village Map</SignPlank>
              </Link>

              {/* Sign 2: My Homestead - pointing right */}
              <Link href="/profile" className="absolute top-32 -right-6 w-52">
                <SignPlank direction="right">My Homestead</SignPlank>
              </Link>

              {/* Sign 3: Tavern - pointing left */}
              <Link href="/chat" className="absolute top-56 -left-6 w-52">
                <SignPlank direction="left">Tavern</SignPlank>
              </Link>

              {/* Sign 4: Community - pointing right */}
              <Link href="/community" className="absolute top-80 -right-6 w-52">
                <SignPlank direction="right">Town Square</SignPlank>
              </Link>
            </div>
            {/* Base */}
            <div className="w-16 h-8 wood-grain border-4 border-wood-dark rounded-full mt-[-10px] relative z-10"></div>
          </aside>

          {/* Center: Bulletin Board */}
          <section className="lg:col-span-6 flex flex-col">
            {/* Board Frame */}
            <WoodenFrame variant="cork" className="min-h-[500px] md:min-h-[600px]">
              <div className="p-6 flex items-center justify-center h-full">
                {/* Hero Parchment Note */}
                <ParchmentNote rotation="right" pinColor="red" className="mt-8">
                  <div className="mt-4 space-y-2">
                    <h2 className="font-pixel text-6xl md:text-7xl font-bold leading-[0.85] text-wood-dark drop-shadow-sm">
                      FIND YOUR
                      <br />
                      <span className="text-[#f48c25]">PLAYER 2</span>
                    </h2>
                    <p className="text-2xl text-wood-dark/80 font-medium pt-2 leading-tight">
                      Join the quest for connection in Peerzee Village.
                    </p>
                  </div>

                  {/* Hearts placeholder */}
                  <div className="w-full h-32 bg-[#A07048]/20 border-2 border-wood-dark/20 flex items-center justify-center overflow-hidden my-2">
                    <Heart className="w-16 h-16 text-[#f48c25] fill-[#f48c25] animate-bounce" />
                    <Heart
                      className="w-12 h-12 text-[#f48c25]/60 fill-[#f48c25]/60 animate-bounce ml-[-10px]"
                      style={{ animationDelay: "100ms" }}
                    />
                  </div>

                  {/* CTA Button */}
                  <Link href="/register" className="w-full block">
                    <PixelButton
                      variant="primary"
                      size="lg"
                      className="w-full bg-[#f48c25] hover:bg-[#ff9d42] animate-pixel-pulse"
                    >
                      PRESS START
                    </PixelButton>
                  </Link>
                </ParchmentNote>
              </div>

              {/* Random Post-it notes - decorative */}
              <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-200 border-2 border-wood-dark shadow-md -rotate-6 hidden md:flex items-center justify-center p-2 text-center leading-none z-10">
                <span className="text-lg font-pixel text-wood-dark">LFG: Raid</span>
              </div>
              <div className="absolute bottom-20 right-10 w-28 h-24 bg-pink-200 border-2 border-wood-dark shadow-md rotate-3 hidden md:flex items-center justify-center p-2 text-center leading-none z-10">
                <span className="text-lg font-pixel text-wood-dark">Potion Sale!</span>
              </div>
              <div className="absolute top-20 right-8 w-20 h-20 bg-green-200 border-2 border-wood-dark shadow-md rotate-6 hidden md:flex items-center justify-center p-2 text-center leading-none z-10">
                <span className="text-sm font-pixel text-wood-dark">50% off!</span>
              </div>
            </WoodenFrame>
          </section>

          {/* Right Sidebar: Town Crier Scroll */}
          <aside className="lg:col-span-3 flex flex-col items-center w-full">
            <ScrollContainer
              title="TOWN CRIER"
              subtitle="Latest Updates"
              footer={
                <Link
                  href="/community"
                  className="font-pixel text-xl underline decoration-2 decoration-[#f48c25] underline-offset-2 hover:text-[#f48c25] transition-colors"
                >
                  View All
                </Link>
              }
            >
              {/* Activity List */}
              <div className="space-y-4">
                {activityItems.map((item, index) => (
                  <div key={index}>
                    <div className="flex gap-3 items-start">
                      <div
                        className={`${item.bgColor} p-1 rounded-sm border-2 border-wood-dark/20 shrink-0`}
                      >
                        <item.icon className={`w-5 h-5 ${item.iconColor || "text-wood-dark"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-wood-dark leading-tight">{item.text}</p>
                        <p className="text-xs text-wood-dark/50">{item.time}</p>
                      </div>
                    </div>
                    {index < activityItems.length - 1 && (
                      <div className="h-0.5 w-full bg-wood-dark/10 mt-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollContainer>

            {/* Mobile Only Nav */}
            <div className="lg:hidden w-full max-w-sm mt-8 flex flex-col gap-3">
              <Link href="/discover">
                <PixelButton variant="wood" className="w-full">
                  VILLAGE MAP
                </PixelButton>
              </Link>
              <Link href="/profile">
                <PixelButton variant="wood" className="w-full">
                  MY HOMESTEAD
                </PixelButton>
              </Link>
            </div>
          </aside>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 px-4 md:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div
              className="inline-block bg-parchment border-4 border-wood-dark px-6 py-2 mb-4"
              style={{ boxShadow: "4px 4px 0 #4A3B32" }}
            >
              <h2 className="font-pixel text-4xl text-wood-dark">QUEST FEATURES</h2>
            </div>
            <p className="text-xl text-parchment/90 font-medium">
              Everything you need to find your Player 2
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-parchment border-4 border-wood-dark p-6 hover:translate-y-[-4px] transition-transform"
                style={{ boxShadow: "4px 4px 0 #4A3B32" }}
              >
                <div
                  className={`w-14 h-14 ${feature.color} border-3 border-wood-dark flex items-center justify-center mb-4`}
                  style={{ boxShadow: "2px 2px 0 #4A3B32" }}
                >
                  <feature.icon className="w-7 h-7 text-parchment" />
                </div>
                <h3 className="font-pixel text-2xl text-wood-dark mb-2">{feature.title}</h3>
                <p className="text-wood-dark/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-4 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div
            className="wood-grain border-4 border-wood-dark p-8"
            style={{ boxShadow: "6px 6px 0 #4A3B32" }}
          >
            <div className="grid grid-cols-3 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-10 h-10 text-[#f48c25] mx-auto mb-2" />
                  <p className="font-pixel text-4xl md:text-5xl text-parchment">{stat.value}</p>
                  <p className="text-parchment/70 font-pixel text-lg">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 md:px-10">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="bg-parchment border-4 border-wood-dark p-8 md:p-12"
            style={{ boxShadow: "8px 8px 0 #4A3B32" }}
          >
            <h2 className="font-pixel text-5xl md:text-6xl text-wood-dark mb-4">
              READY TO BEGIN?
            </h2>
            <p className="text-xl text-wood-dark/70 mb-8">
              Join 50,000+ villagers already making meaningful connections. Your quest awaits!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <PixelButton variant="primary" size="lg" className="flex items-center gap-2">
                  CREATE ACCOUNT
                  <ArrowRight className="w-6 h-6" />
                </PixelButton>
              </Link>
              <Link href="/login">
                <PixelButton variant="secondary" size="lg">
                  SIGN IN
                </PixelButton>
              </Link>
            </div>
            <p className="text-sm text-wood-dark/50 mt-6 font-pixel">
              Free forever • No credit card required • Join in 30 seconds
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="wood-grain border-t-4 border-wood-dark py-8 px-4 mt-8"
        style={{ boxShadow: "0 -4px 0 #4A3B32" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-parchment/80 text-sm">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 bg-primary-orange border-3 border-border-dark flex items-center justify-center"
              style={{ boxShadow: "2px 2px 0 #4A3B32" }}
            >
              <Home className="w-6 h-6 text-parchment" />
            </div>
            <span className="font-pixel text-2xl text-parchment">Peerzee Village</span>
          </div>
          <p className="font-pixel text-lg">© 2024 Peerzee Village. All rights reserved.</p>
          <div className="flex gap-6">
            <a className="hover:text-white hover:underline font-pixel" href="#">
              Terms of Service
            </a>
            <a className="hover:text-white hover:underline font-pixel" href="#">
              Privacy Policy
            </a>
            <a className="hover:text-white hover:underline font-pixel" href="#">
              Support Scroll
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
