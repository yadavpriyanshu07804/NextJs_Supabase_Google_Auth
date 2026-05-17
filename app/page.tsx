'use client'

import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { FileText, Wand2, Download, Zap, Sparkles, ArrowRight, Presentation } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505]">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 md:pt-24 pb-20 md:pb-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-indigo-500/5 blur-[120px]" />
          </div>
          
          <Container>
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400"
              >
                <Sparkles size={12} />
                <span>Powered by Gemini 1.5 Flash</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-[1.1]"
              >
                PDF to PowerPoint <br className="hidden sm:block" /> in <span className="italic font-light">Seconds</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-8 md:mt-10 w-full max-w-4xl text-base md:text-lg lg:text-xl text-zinc-400 leading-relaxed font-medium"
              >
                Transform messy question papers into beautifully formatted slide decks. 
                AI-powered extraction, instant generation, no account required.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-10 md:mt-12 flex flex-wrap justify-center gap-4 md:gap-6"
              >
                <Link href="/dashboard">
                  <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg font-bold bg-white text-black hover:bg-zinc-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] rounded-xl">
                    Start Generating <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg border-white/10 bg-white/5 hover:bg-white/10 rounded-xl">
                  Watch Demo
                </Button>
              </motion.div>
            </div>
          </Container>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 border-y border-white/5 bg-zinc-950/50">
          <Container>
            <div className="grid gap-6 md:gap-8 md:grid-cols-3">
              {[
                {
                  icon: <FileText className="text-indigo-400" size={24} />,
                  title: "Smart Extraction",
                  desc: "Our AI precisely identifies question boundaries, numbering, and sub-parts from any layout."
                },
                {
                  icon: <Zap className="text-indigo-400" size={24} />,
                  title: "Instant PPTX",
                  desc: "Generates native PowerPoint files with one question per slide, ready for your presentation."
                },
                {
                  icon: <Download className="text-indigo-400" size={24} />,
                  title: "Public Storage",
                  desc: "Upload, generate, and share. Files are stored securely and available for instant download."
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="glass p-8 md:p-10 rounded-3xl"
                >
                  <div className="mb-6 w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white">{feature.title}</h3>
                  <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </Container>
        </section>
      </main>
      
      <footer className="border-t border-white/5 py-12 bg-black">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                <Presentation size={14} className="text-white" />
              </div>
              <span className="font-bold">QuickPPT AI</span>
            </div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">
              Built with Next.js, Supabase & Gemini Turbo &bull; 2026
            </p>
            <div className="flex items-center gap-8 text-xs font-semibold text-zinc-500">
              <Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors uppercase tracking-widest">Terms</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
