import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const rawHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.hostname || '';
  const hostname = rawHost.split(':')[0].toLowerCase();

  // 0. Redirecionamento de Host Canônico (Padroniza https://www.overmelhinho.com.br sem loop)
  if (hostname === 'overmelhinho.com.br') {
    const canonicalUrl = new URL(request.url);
    canonicalUrl.host = 'www.overmelhinho.com.br';
    canonicalUrl.protocol = 'https:';
    canonicalUrl.port = '';
    return NextResponse.redirect(canonicalUrl, 301);
  }

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

  // 1. Redirecionamento de Empresas Legadas (outros estados exceto /rs que possui Route Handler direto 301): /{estado}/{cidade}/{slug}/{id}
  const clientMatch = pathname.match(/^\/([a-z]{2})\/([^\/]+)\/([^\/]+)\/(\d+)$/i);
  if (clientMatch && clientMatch[1].toLowerCase() !== 'rs') {
    const id = clientMatch[4];
    return getRedirect(`/cliente/${id}`);
  }

  // 2. Redirecionamento de Categorias Legadas: /-{slug}-;cat{id}.php ou /{slug};cat{id}.php
  // Exemplo: /-advocacia-;cat846.php (redireciona diretamente para /busca?q={slug} em salto único 301)
  const categoryMatch = pathname.match(/^\/?-?(.+?)-?;cat(\d+)\.php$/i);
  if (categoryMatch) {
    const rawSlug = categoryMatch[1].replace(/^-+|-+$/g, '');
    const cleanTerm = rawSlug.replace(/[-_]+/g, ' ').trim();
    const sp = new URLSearchParams();
    sp.set('q', cleanTerm || rawSlug);
    return getRedirect('/busca', sp);
  }

  // 2.5. Redirecionamento de busca que caiu direto no /busca com parâmetro segmento, id_subcategoria ou id_categoria (numérico, ignorando '0')
  if (pathname === '/busca' && (searchParams.has('segmento') || searchParams.has('id_categoria') || searchParams.has('id_subcategoria'))) {
    const getValidSegment = () => {
      for (const key of ['id_subcategoria', 'id_categoria', 'segmento']) {
        const val = searchParams.get(key);
        if (val && /^[1-9]\d*$/.test(val)) {
          return val;
        }
      }
      return null;
    };
    const segmento = getValidSegment();
    if (segmento) {
      const sp = new URLSearchParams();
      sp.set('id_categoria', segmento);
      
      const cityId = searchParams.get('city_id') || searchParams.get('id_cidade');
      if (cityId && /^[1-9]\d*$/.test(cityId)) {
        sp.set('id_cidade', cityId);
      }
      
      const term = searchParams.get('palavra') || searchParams.get('q');
      if (term) {
        sp.set('palavra', term);
      }
      
      return NextResponse.rewrite(new URL(`/api/legacy-busca?${sp.toString()}`, request.url));
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

  // 4. Redirecionamento de busca legada: /busca.php?palavra=... (reescreve internamente para /api/legacy-busca garantindo 1 salto)
  if (pathname === '/busca.php') {
    const term = searchParams.get('palavra') || '';
    const getValidSegment = () => {
      for (const key of ['id_subcategoria', 'id_categoria']) {
        const val = searchParams.get(key);
        if (val && /^[1-9]\d*$/.test(val)) {
          return val;
        }
      }
      return null;
    };
    const idCategoria = getValidSegment();
    const idCidade = searchParams.get('id_cidade') || searchParams.get('city_id');

    if (idCategoria) {
      const sp = new URLSearchParams();
      sp.set('id_categoria', idCategoria);
      if (idCidade && /^[1-9]\d*$/.test(idCidade)) sp.set('id_cidade', idCidade);
      if (term) sp.set('palavra', term);
      return NextResponse.rewrite(new URL(`/api/legacy-busca?${sp.toString()}`, request.url));
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
