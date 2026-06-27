import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { cidade: string; slug: string; id: string } }
) {
  const { id } = await params;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://dash.overmelhinho.com.br/api/v1';
    
    // Use the public endpoint which is usually faster and accessible
    const res = await fetch(`${apiUrl}/clientes/public/${id}`);
    
    if (res.ok) {
      const data = await res.json();
      const client = data.data || data; 
      
      // Look for the relationships based on Laravel resource format
      const cidades = client.cidadesAtendidas || client.cidades || [];
      const categorias = client.segmentos || client.categorias || [];
      
      if (cidades.length > 0 && categorias.length > 0) {
        // Use the slug of the first city and first category
        const citySlug = cidades[0].slug;
        const categorySlug = categorias[0].slug;
        const clientSlug = client.slug;
        
        const newUrl = `https://www.overmelhinho.com.br/${citySlug}/${categorySlug}/${clientSlug}`;
        return NextResponse.redirect(newUrl, 301); 
      }
    }
  } catch (err) {
    console.error('Error fetching client for redirect:', err);
  }

  // Fallback
  return NextResponse.redirect('https://www.overmelhinho.com.br', 302);
}
