import { NextRequest, NextResponse } from 'next/server';
import { ProcessingPipeline } from '@/lib/pipeline';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = getSupabaseServer();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: pres, error: fetchError } = await supabase
      .from('presentations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !pres || pres.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    const pipeline = new ProcessingPipeline(id);
    
    // In a real production app with Cloud Run / Lambda, 
    // we might trigger an asynchronous task here because of the 30s timeout.
    // For now, we run it and expect the client to poll for status.
    // Note: We don't 'await' it if we want it to be background, but that doesn't work well 
    // in Vercel/Next.js without Edge/SWR/Polling.
    // For AI Studio, we'll run it synchronously but the UI will poll for progress.
    const result = await pipeline.run();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Processing Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
