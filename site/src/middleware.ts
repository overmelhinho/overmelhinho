import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const getRedirect = (newPath: string, newSearchParams?: URLSearchParams) => {
    const url = request.nextUrl.clone();
    url.pathname = newPath;
    if (newSearchParams) {
      url.search = newSearchParams.toString();
    } else {
      url.search = '';
    }
    return NextResponse.redirect(url, 301);
  };

  // 1. Redirecionamento de Empresas Legadas: /{estado}/{cidade}/{slug}/{id}
  // Exemplo: /rs/farroupilha/borsoi-dariff-bernardi-adv/101215
  const clientMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)\/([^\/]+)\/(\d+)$/i);
  if (clientMatch) {
    const id = clientMatch[4];
    return getRedirect(`/cliente/${id}`);
  }

  // 2. Redirecionamento de Categorias Legadas: /-{slug}-;cat{id}.php
  // Exemplo: /-advocacia-;cat846.php
  const categoryMatch = pathname.match(/^\/-(.+)-;cat(\d+)\.php$/i);
  if (categoryMatch) {
    const catId = categoryMatch[2];
    const sp = new URLSearchParams();
    sp.set('id_categoria', catId);
    return getRedirect('/api/legacy-busca', sp);
  }

  // 2.5. Redirecionamento de busca que caiu direto no /busca com parâmetro segmento (numérico)
  if (pathname === '/busca' && searchParams.has('segmento')) {
    const segmento = searchParams.get('segmento');
    if (segmento && /^\d+$/.test(segmento)) {
      const sp = new URLSearchParams();
      sp.set('id_categoria', segmento);
      // Mantém a cidade caso exista
      if (searchParams.has('city_id')) {
        sp.set('id_cidade', searchParams.get('city_id')!);
      }
      return getRedirect('/api/legacy-busca', sp);
    }
  }

  // 3. Redirecionamento de Vagas Legadas: /empregos/detalhes/{id}
  if (pathname.startsWith('/empregos/detalhes/')) {
    const segments = pathname.split('/');
    const id = segments[segments.length - 1];
    const sp = new URLSearchParams();
    sp.set('id', id);
    return getRedirect('/vagas', sp);
  }

  // 4. Redirecionamento de busca legada: /busca.php?palavra=...
  if (pathname === '/busca.php') {
    const term = searchParams.get('palavra') || '';
    const idCategoria = searchParams.get('id_categoria');
    const idCidade = searchParams.get('id_cidade');

    if (idCategoria) {
      const sp = new URLSearchParams();
      sp.set('id_categoria', idCategoria);
      if (idCidade) sp.set('id_cidade', idCidade);
      if (term) sp.set('palavra', term);
      return getRedirect('/api/legacy-busca', sp);
    }

    const sp = new URLSearchParams();
    if (term) sp.set('q', term);
    return getRedirect('/busca', sp);
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
