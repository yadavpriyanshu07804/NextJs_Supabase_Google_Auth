'use client'

import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/components/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  RefreshCw,
  MoreVertical,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import Link from "next/link";
import { DeleteConfirmation } from "@/components/DeleteConfirmation";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface UploadRecord {
  id: string;
  pdf_name: string;
  pdf_url: string;
  ppt_url: string;
  exam_name: string;
  extracted_json: any;
  total_questions: number;
  created_at: string;
}

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  const fetchHistory = useCallback(async () => {
    if (!user) return; // Prevent fetch if not logged in
    setLoading(true);
    try {
      const resp = await fetch(`/api/history?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}`);
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setData(result.data);
      setTotalPages(Math.ceil(result.total / result.limit));
      setTotalCount(result.total);
    } catch (err: any) {
      toast.error(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [search, sort, page, user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const resp = await fetch(`/api/history?id=${deleteId}`, { method: 'DELETE' });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      toast.success("Presentation and all files deleted permanently");
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Deletion failed");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const handleRegenerate = async (id: string) => {
    toast.promise(
      (async () => {
        const resp = await fetch(`/api/presentations/${id}/process`, { method: 'POST' });
        const data = await resp.json();
        if (data.error) throw new Error(data.error);
        
        fetchHistory();
        return data;
      })(),
      {
        loading: 'Regenerating presentation...',
        success: 'Regeneration complete!',
        error: (err) => `Failed: ${err.message}`,
      }
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#050505]">
      <Navbar />
      <main className="flex-1 py-8">
        <Container>
          <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Legacy History</h1>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.1em]">Manage and review your previous generations</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearch} className="relative group flex-1 md:flex-none">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full md:w-64 pl-10 pr-4 bg-zinc-900/40 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 transition-all text-sm font-medium"
                />
              </form>
              <select 
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-10 px-4 bg-zinc-900/40 border border-white/10 rounded-xl focus:outline-none text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-zinc-900/60 transition-colors"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </header>

          {loading ? (
            <div className="grid gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 w-full bg-zinc-900/20 rounded-2xl animate-pulse border border-white-[0.03]" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-6 border border-white/5">
                <Clock size={28} />
              </div>
              <h2 className="text-xl font-bold mb-2">No history found</h2>
              <p className="text-sm text-zinc-500 mb-8 max-w-sm">You haven&apos;t generated any presentations yet.</p>
              <Link href="/dashboard">
                <Button variant="outline" className="rounded-xl border-white/10 h-10 px-6 font-bold uppercase text-xs tracking-widest">Go to Dashboard</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {data.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="bg-[#0a0a0a] border border-white/[0.03] hover:border-white/10 rounded-2xl p-4 transition-all duration-300 hover:shadow-xl group">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
                          <FileText size={18} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-white mb-1.5 break-words line-clamp-1 group-hover:text-indigo-100 transition-colors">
                            {item.exam_name || item.pdf_name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar size={12} className="text-zinc-600" /> 
                              {formatDate(item.created_at)}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <RefreshCw size={12} className="text-zinc-600" /> 
                              {item.total_questions} Questions
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/preview/${item.id}`} className="flex-1">
                          <Button variant="secondary" size="sm" className="w-full rounded-lg h-8 text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest gap-1.5">
                            <Eye size={14} /> Preview
                          </Button>
                        </Link>
                        <a href={item.ppt_url} download target="_blank" rel="noreferrer" className="flex-1">
                          <Button size="sm" className="w-full rounded-lg h-8 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest shadow-lg gap-1.5">
                            <Download size={14} /> PPTX
                          </Button>
                        </a>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRegenerate(item.id)}
                          className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white"
                        >
                          <RefreshCw size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => setDeleteId(item.id)}
                          className="w-8 h-8 rounded-lg text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <DeleteConfirmation 
            isOpen={!!deleteId}
            onClose={() => setDeleteId(null)}
            onConfirm={handleConfirmDelete}
            isLoading={isDeleting}
          />

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Showing {data.length} of {totalCount} Records
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-xl h-10 w-10 p-0 border-white/10"
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="flex items-center px-4 text-sm font-bold bg-zinc-900/50 rounded-xl border border-white/5">
                  Page {page} of {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-xl h-10 w-10 p-0 border-white/10"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
}
