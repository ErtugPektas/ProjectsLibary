import type { APIRoute } from 'astro';
import { incrementPageView, incrementCount } from '../../utils/redis';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const path = body.path || '/';
    
    // Increment specific path views
    await incrementPageView(path);
    
    // Increment daily view count
    const today = new Date().toISOString().split('T')[0];
    await incrementCount(`pv:${today}`);
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
