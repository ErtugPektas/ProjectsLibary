import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // In production, this can forward to WhatsApp API, Redis, or Email
    console.log('--- YENİ MUTFAK TEKLİF TALEBİ ---', data);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Mutfak teklif talebiniz başarıyla alındı. Uzman mimarlarımız sizinle iletişime geçecektir.' 
    }), {
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
