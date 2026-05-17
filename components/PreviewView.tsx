'use client'

import { useState, useEffect, useRef } from "react";
import { Container } from "@/components/Container";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Download, 
  Copy, 
  FileDown, 
  CheckCircle2, 
  ListChecks, 
  Timer, 
  Presentation, 
  Layout, 
  Share2, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Info,
  Braces,
  Trash2,
  Settings2
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Question } from "@/lib/gemini";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlideRenderer } from "./SlideRenderer";
import { cn } from "@/lib/utils";
import { RenderedSlide, getRenderedSlides } from "@/lib/slide-utils";
import { JsonView } from "./JsonView";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { DownloadModal } from "./ppt/DownloadModal";

interface PresentationData {
  id: string;
  title: string;
  questions: Question[];
  pptx_url: string;
  stats: {
    totalQuestions: number;
    processingTime: string;
  };
  theme: {
    themeColor: string;
    layout?: 'standard' | 'solving';
  };
}

export function PreviewView({ id }: { id: string }) {
  const [data, setData] = useState<PresentationData | null>(null);
  const [slides, setSlides] = useState<RenderedSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState<'slides' | 'json'>('slides');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPresentation = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data: record, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error("Sync failed.");
      console.error(error);
    } else {
      setData(record);
      const rendered = getRenderedSlides(record.title, record.questions);
      setSlides(rendered);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/presentations/${id}`, { method: 'DELETE' });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      
      toast.success("Presentation deleted permanently");
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    fetchPresentation();
  }, [id]);

  const handleLayoutChange = async (layout: 'standard' | 'solving') => {
    if (!data) return;
    setIsRegenerating(true);
    
    // Update local state for instant feedback in preview
    const updatedData = {
      ...data,
      theme: { ...data.theme, layout }
    };
    setData(updatedData);

    try {
      const response = await fetch(`/api/presentations/${id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout })
      });

      if (!response.ok) throw new Error("Regeneration failed");
      
      const result = await response.json();
      setData(prev => prev ? { ...prev, pptx_url: result.pptx_url } : null);
      toast.success(`Layout changed to ${layout}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== 'slides') return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        setCurrentSlide(prev => Math.max(0, prev - 1));
      } else if (e.key === 'Home') {
        setCurrentSlide(0);
      } else if (e.key === 'End') {
        setCurrentSlide(slides.length - 1);
      }
    };
    
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (document.fullscreenElement) {
        setZoom(1.2);
      } else {
        setZoom(1);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [slides.length, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <Container className="py-20 space-y-12">
            <div className="space-y-4">
                <Skeleton className="h-4 w-24 bg-white/5" />
                <Skeleton className="h-12 w-1/3 bg-white/5" />
            </div>
            <div className="grid grid-cols-4 gap-6">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-white/5 rounded-2xl" />)}
            </div>
            <Skeleton className="h-[400px] w-full bg-white/5 rounded-3xl" />
        </Container>
      </div>
    );
  }

  if (!data || slides.length === 0) return <div className="text-center py-20 text-zinc-500 uppercase tracking-widest font-bold">Data not found.</div>;

  const totalSlides = slides.length;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen flex-col bg-[#050505] text-[#f0f0f0] overflow-hidden">
      <Navbar />
      <main className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out shrink-0 glass border-r border-white/5 flex flex-col overflow-hidden",
          isSidebarOpen ? "translate-x-0 w-64 md:w-64" : "-translate-x-full w-0 md:w-0"
        )}>
            <div className="p-4 border-b border-white/5 grid grid-cols-2 gap-2 shrink-0">
                <Button 
                    variant={activeTab === 'slides' ? 'default' : 'ghost'} 
                    size="sm"
                    className={cn(
                        "text-[9px] uppercase tracking-widest font-bold h-9 rounded-lg",
                        activeTab === 'slides' ? "bg-indigo-600 hover:bg-indigo-700" : "text-zinc-500"
                    )}
                    onClick={() => setActiveTab('slides')}
                >
                    Slides
                </Button>
                <Button 
                    variant={activeTab === 'json' ? 'default' : 'ghost'} 
                    size="sm"
                    className={cn(
                        "text-[9px] uppercase tracking-widest font-bold h-9 rounded-lg",
                        activeTab === 'json' ? "bg-indigo-600 hover:bg-indigo-700" : "text-zinc-500"
                    )}
                    onClick={() => setActiveTab('json')}
                >
                    JSON
                </Button>
            </div>
            
            {activeTab === 'slides' ? (
                <>
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-indigo-400" />
                            <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Thumbnails</span>
                        </div>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-[9px] h-5 px-1.5">{totalSlides}</Badge>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={cn(
                                    "w-full text-left group transition-all relative",
                                    currentSlide === i ? "scale-[1.02]" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-full opacity-0 transition-opacity" style={{ opacity: currentSlide === i ? 1 : 0 }} />
                                <div className={cn(
                                    "aspect-video rounded-lg overflow-hidden border-2 mb-2 transition-all bg-zinc-900 group-hover:shadow-lg group-hover:shadow-indigo-500/10",
                                    currentSlide === i ? "border-indigo-500 shadow-lg shadow-indigo-500/40" : "border-white/5 group-hover:border-white/20"
                                )}>
                                    <div className="w-full h-full transform scale-[0.32] origin-top-left" style={{ width: '312.5%', height: '312.5%' }}>
                                        <SlideRenderer 
                                            slide={slides[i]} 
                                            themeColor={data.theme.themeColor}
                                            title={data.title}
                                            className="h-full w-full shadow-none"
                                            layout={data.theme.layout}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Slide {i + 1}</span>
                                    {slides[i].type === 'title' && <span className="text-[9px] text-indigo-400 font-bold uppercase">Title</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div className="p-8 text-center space-y-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Braces size={24} className="text-indigo-400" />
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-white">JSON Insights</h4>
                    <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tight">
                        Inspect the raw structured data extracted from your PDF source. 
                    </p>
                </div>
            )}
        </aside>

        {/* Main View Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950 relative" ref={containerRef}>
            {activeTab === 'json' ? (
                <div className="flex-1 p-6 md:p-12 overflow-auto custom-scrollbar">
                    <JsonView data={data.questions} title={data.title} />
                </div>
            ) : (
                <>
                    {/* Toolbar / Editor Header */}
                    <div className={cn(
                        "p-2 md:p-3 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shrink-0 z-20",
                        isFullscreen ? "bg-[#050505]/80 backdrop-blur-md absolute top-0 left-0 right-0 px-8" : "bg-[#080808]"
                    )}>
                        <div className="flex items-center gap-2 md:gap-4 overflow-hidden w-full sm:w-auto">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 md:hidden"
                                onClick={toggleSidebar}
                            >
                                <Layout size={16} />
                            </Button>
                            <Badge variant="outline" className="hidden lg:flex bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold px-3 py-1 whitespace-nowrap">
                                PREVIEW
                            </Badge>
                            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-md">
                                {data.title}
                            </h2>
                        </div>

                        {/* Layout Toggles - Center */}
                        <div className="flex bg-zinc-950/50 p-1 rounded-xl border border-white/5 mx-auto">
                            <Button 
                                variant={data.theme.layout !== 'solving' ? 'default' : 'ghost'} 
                                size="sm" 
                                className={cn(
                                    "h-8 text-[9px] font-bold uppercase tracking-widest rounded-lg px-4 gap-2",
                                    data.theme.layout !== 'solving' ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" : "text-zinc-500"
                                )}
                                onClick={() => handleLayoutChange('standard')}
                                disabled={isRegenerating}
                            >
                                <Presentation size={12} />
                                <span className="hidden min-[450px]:inline">Standard</span>
                            </Button>
                            <Button 
                                variant={data.theme.layout === 'solving' ? 'default' : 'ghost'} 
                                size="sm" 
                                className={cn(
                                    "h-8 text-[9px] font-bold uppercase tracking-widest rounded-lg px-4 gap-2",
                                    data.theme.layout === 'solving' ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" : "text-zinc-500"
                                )}
                                onClick={() => handleLayoutChange('solving')}
                                disabled={isRegenerating}
                            >
                                <Layout size={12} />
                                <span className="hidden min-[450px]:inline">Solving Mode</span>
                            </Button>
                        </div>

                        <div className="flex items-center gap-1 md:gap-2 ml-auto sm:ml-0">
                            <div className="hidden sm:flex items-center gap-1 bg-white/[0.03] rounded-lg p-1 border border-white/5">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 md:h-8 md:w-8 text-zinc-400 hover:text-white"
                                    onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}
                                >
                                    <ZoomOut size={14} />
                                </Button>
                                <span className="text-[9px] font-bold w-10 md:w-12 text-center text-zinc-500">{Math.round(zoom * 100)}%</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7 md:h-8 md:w-8 text-zinc-400 hover:text-white"
                                    onClick={() => setZoom(z => Math.min(4, z + 0.1))}
                                >
                                    <ZoomIn size={14} />
                                </Button>
                            </div>
                            <Separator orientation="vertical" className="hidden sm:block h-6 bg-white/5 mx-1" />
                            <div className="flex gap-1">
                                <Button 
                                    onClick={() => setIsDownloadModalOpen(true)}
                                    size="sm" 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-[10px] font-black uppercase tracking-widest h-9 px-4 md:px-5 gap-2 shadow-lg shadow-indigo-500/20 border border-indigo-400/20"
                                >
                                    Export <FileDown size={16} />
                                </Button>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 md:h-9 md:w-9 text-zinc-400 hover:text-red-400 bg-white/5 rounded-lg md:rounded-xl border border-white/5 transition-colors"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                <Trash2 size={16} />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 md:h-9 md:w-9 text-zinc-400 hover:text-white bg-white/5 rounded-lg md:rounded-xl border border-white/5"
                                onClick={toggleFullscreen}
                            >
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </Button>
                        </div>
                    </div>

                    {/* Editor Content (Main Stage) */}
                    <div className="flex-1 bg-[#0a0a0a] flex flex-col relative overflow-hidden">
                        {/* Slide Workspace */}
                        <div className="flex-1 overflow-auto p-4 sm:p-8 md:p-12 lg:p-16 flex items-center justify-center custom-scrollbar relative group/stage">
                            <div 
                                className="relative transition-all duration-300 ease-out preserve-3d"
                                style={{ 
                                    width: '100%',
                                    maxWidth: zoom === 1 ? 'min(calc(100vw - 2rem), calc((100vh - 12rem) * 16 / 9))' : 'none',
                                    aspectRatio: '16/9',
                                    transform: `scale(${zoom})`,
                                    transformOrigin: 'center center',
                                    filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentSlide}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.02 }}
                                        transition={{ duration: 0.25 }}
                                        className="w-full h-full relative"
                                    >
                                        <SlideRenderer 
                                            slide={slides[currentSlide]} 
                                            themeColor={data.theme.themeColor}
                                            title={data.title}
                                            className="rounded-lg h-full shadow-2xl" 
                                            layout={data.theme.layout}
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Floating Controls */}
                            <div className="absolute inset-y-0 left-2 md:left-4 flex items-center pointer-events-none">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={currentSlide === 0}
                                    onClick={() => setCurrentSlide(currentSlide - 1)}
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/5 hover:bg-black/60 text-white pointer-events-auto opacity-100 md:opacity-0 md:group-hover/stage:opacity-100 transition-all -translate-x-0 md:-translate-x-4 md:group-hover/stage:translate-x-0"
                                >
                                    <ChevronLeft size={20} className="md:w-6 md:h-6" />
                                </Button>
                            </div>
                            <div className="absolute inset-y-0 right-2 md:right-4 flex items-center pointer-events-none">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    disabled={currentSlide === totalSlides - 1}
                                    onClick={() => setCurrentSlide(currentSlide + 1)}
                                    className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-black/40 backdrop-blur-md border border-white/5 hover:bg-black/60 text-white pointer-events-auto opacity-100 md:opacity-0 md:group-hover/stage:opacity-100 transition-all translate-x-0 md:translate-x-4 md:group-hover/stage:translate-x-0"
                                >
                                    <ChevronRight size={20} className="md:w-6 md:h-6" />
                                </Button>
                            </div>
                        </div>

                        {/* Bottom Navigation Bar (PowerPoint style) */}
                        <div className={cn(
                            "h-12 md:h-14 border-t border-white/5 flex items-center justify-between px-4 md:px-6 bg-[#080808] shrink-0 z-20",
                            isFullscreen && "hidden"
                        )}>
                            <div className="flex items-center gap-3 md:gap-6">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-zinc-400 hidden md:flex"
                                    onClick={toggleSidebar}
                                >
                                    <Layout size={14} className={isSidebarOpen ? "text-indigo-400" : ""} />
                                </Button>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 whitespace-nowrap">
                                    Slide {currentSlide + 1} of {totalSlides}
                                </span>
                                <div className="hidden min-[450px]:block h-4 w-px bg-white/5" />
                                <div className="hidden min-[450px]:flex items-center gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-zinc-600 hover:text-white"
                                        onClick={() => setShowStats(!showStats)}
                                    >
                                        <Info size={14} className={showStats ? "text-indigo-400" : ""} />
                                    </Button>
                                    <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Props</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="hidden sm:flex items-center gap-1 bg-white/5 rounded-full p-1 px-3 border border-white/10 mr-2 lg:mr-4">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Sync Ready</span>
                                </div>
                                <div className="flex gap-1 md:gap-2">
                                     <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="h-8 text-[10px] bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest px-3 md:px-4 hover:bg-white/10"
                                        onClick={() => setZoom(1)}
                                    >
                                        Reset
                                    </Button>
                                    <Button 
                                        size="sm" 
                                        className="h-8 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-3 md:px-4 shadow-lg shadow-indigo-500/20"
                                        onClick={toggleFullscreen}
                                    >
                                        <span className="hidden sm:inline">Present</span> <Presentation size={12} className="sm:ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Overlay (Bottom Right) */}
                        <AnimatePresence>
                            {showStats && !isFullscreen && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
                                    className="absolute bottom-20 right-8 w-72 glass p-6 rounded-2xl border border-white/5 shadow-2xl z-20"
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                                <ListChecks size={16} className="text-indigo-400" />
                                            </div>
                                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white">Deck Properties</span>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500" onClick={() => setShowStats(false)}>
                                            <ChevronRight size={14} className="rotate-90" />
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500">
                                                <span>Questions</span>
                                                <span className="text-white font-bold">{data.stats.totalQuestions}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-zinc-500">
                                                <span>Processing</span>
                                                <span className="text-white font-bold">{data.stats.processingTime}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3 px-1">
                                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] block">Slide Layout</span>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    className={cn(
                                                        "h-12 bg-white/5 border text-[9px] font-bold uppercase tracking-tight flex-col gap-1 hover:bg-white/10",
                                                        data.theme.layout !== 'solving' ? "border-indigo-500 text-indigo-400" : "border-white/5 text-zinc-500"
                                                    )}
                                                    onClick={() => handleLayoutChange('standard')}
                                                >
                                                    <Presentation size={14} />
                                                    Standard
                                                </Button>
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm"
                                                    className={cn(
                                                        "h-12 bg-white/5 border text-[9px] font-bold uppercase tracking-tight flex-col gap-1 hover:bg-white/10",
                                                        data.theme.layout === 'solving' ? "border-indigo-500 text-indigo-400" : "border-white/5 text-zinc-500"
                                                    )}
                                                    onClick={() => handleLayoutChange('solving')}
                                                >
                                                    <Layout size={14} />
                                                    Solving
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="space-y-3 px-1">
                                            <span className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] block">Active Palette</span>
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 flex-1 rounded-md border border-white/10 shadow-inner" style={{ backgroundColor: data.theme.themeColor }} />
                                                <div className="h-4 flex-1 rounded-md bg-white border border-white/10" />
                                                <div className="h-4 flex-1 rounded-md bg-zinc-800 border border-white/10" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>

        <DeleteConfirmation 
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
            isLoading={isDeleting}
        />

        <DownloadModal 
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
            defaultTitle={data.title}
            presentationId={id}
        />
      </main>
      
      <style jsx global>{`
        .preserve-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </div>
  );
}
