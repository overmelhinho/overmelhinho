import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Redirecionamento de Empresas Legadas: /{estado}/{cidade}/{slug}/{id}
  // Exemplo: /rs/farroupilha/borsoi-dariff-bernardi-adv/101215
  const clientMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)\/([^\/]+)\/(\d+)$/i);
  if (clientMatch) {
    const id = clientMatch[4];
    return new Response(null, { status: 301, headers: { 'Location': `/cliente/${id}` } });
  }

  // 2. Redirecionamento de Categorias Legadas: /-{slug}-;cat{id}.php
  // Exemplo: /-advocacia-;cat846.php
  const categoryMatch = pathname.match(/^\/-(.+)-;cat(\d+)\.php$/i);
  if (categoryMatch) {
    const catId = categoryMatch[2];
    return new Response(null, { status: 301, headers: { 'Location': `/busca?segmento=${catId}` } });
  }

  // 3. Redirecionamento de Vagas Legadas: /empregos/detalhes/{id}
  if (pathname.startsWith('/empregos/detalhes/')) {
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];
    return new Response(null, { status: 301, headers: { 'Location': `/vagas?id=${id}` } });
  }

  // 4. Redirecionamento de busca legada: /busca.php?palavra=...
  if (pathname === '/busca.php') {
    const term = searchParams.get('palavra') || '';
    const idCategoria = searchParams.get('id_categoria');
    const idCidade = searchParams.get('id_cidade');

    if (idCategoria) {
      let relativeUrl = `/api/legacy-busca?id_categoria=${idCategoria}`;
      if (idCidade) relativeUrl += `&id_cidade=${idCidade}`;
      if (term) relativeUrl += `&palavra=${term}`;
      return new Response(null, { status: 301, headers: { 'Location': relativeUrl } });
    }

    return new Response(null, { status: 301, headers: { 'Location': `/busca?q=${term}` } });
  }

  return NextResponse.next();
}

// Configurar quais caminhos o middleware deve observar
export const config = {
  matcher: [
    // Captura os padrões de estado (rs, sc, pr, etc) + categorias + php
    '/((?![_next|api|static|favicon.ico]).*)',
  ],
};
