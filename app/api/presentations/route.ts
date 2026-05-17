import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { pdf_url, title, theme_color, theme } = await req.json();
    const supabase = getSupabaseServer();
    
    // Get the user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('presentations')
      .insert([
        {
          user_id: user.id,
          title,
          pdf_url,
          status: 'pending',
          theme: theme || { themeColor: theme_color || '#8b5cf6', accentColor: '#ffffff', layout: 'standard' }
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
