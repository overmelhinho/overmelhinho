'use client';

import { useEffect, useRef } from 'react';
import { Sparkles, Briefcase } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

// Tema do mapa: "Vermelhinho" - cinza claro + destaque vermelho
const MAP_STYLE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type Business = {
  id: number;
  nome_fantasia: string;
  logotipo_url?: string;
  status_assinatura?: string;
  tipo_cliente?: string;
  enderecos?: { latitude?: number; longitude?: number; bairro?: string }[];
};

type SearchMapProps = {
  results: Business[];
  highlighted: number | null;
  onHover: (id: number | null) => void;
  onClick: (id: number) => void;
  onMapClick?: () => void;
};

// Coordenadas base das cidades da Serra Gaúcha
const CITY_COORDS: Record<string, [number, number]> = {
  'Farroupilha': [-29.2272, -51.3486],
  'Caxias do Sul': [-29.1682, -51.1794],
  'Bento Gonçalves': [-29.1691, -51.5188],
  'Garibaldi': [-29.2566, -51.5341],
  'Carlos Barbosa': [-29.2974, -51.5034],
  'Flores da Cunha': [-29.0287, -51.1824],
};

// Centro padrão — Caxias do Sul (Serra Gaúcha)
const DEFAULT_CENTER: [number, number] = [-29.1682, -51.1794];

export default function SearchMap({ results, highlighted, onHover, onClick, onMapClick }: SearchMapProps) {
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const { cityName } = useLocation();
  const currentCenter = (cityName && CITY_COORDS[cityName]) ? CITY_COORDS[cityName] : DEFAULT_CENTER;

  useEffect(() => {
    let isMounted = true;

    if (typeof window === 'undefined' || mapRef.current) return;
    if (!mapDivRef.current) return;

    // Importa Leaflet dinamicamente (SSR safe)
    import('leaflet').then((L) => {
      if (!isMounted) return;

      // Fix ícones default Leaflet + NextJS
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Previne erro se o container já possuir mapa
      if ((mapDivRef.current as any)._leaflet_id) {
        (mapDivRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapDivRef.current!, {
        center: currentCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      // Tile layer OpenStreetMap com filtro visual premium
      L.tileLayer(MAP_STYLE_URL, {
        maxZoom: 19,
        className: 'map-tiles',
      }).addTo(map);

      // Controles de zoom posicionados no canto superior direito
      L.control.zoom({ position: 'topright' }).addTo(map);

      if (onMapClick) {
        map.on('click', () => onMapClick());
      }

      mapRef.current = { map, L };
    });

    return () => {
      isMounted = false;
      if (mapRef.current?.map) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza pins quando os resultados mudam
  useEffect(() => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;

    // Limpa markers antigos
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current.clear();

    const validPoints: [number, number][] = [];

    results.forEach((business, idx) => {
      const lat = business.enderecos?.[0]?.latitude;
      const lng = business.enderecos?.[0]?.longitude;
      
      if (!lat || !lng) return;

      validPoints.push([lat, lng]);
      const isFirst = idx === 0;

      // Simulando "Premium" nos índices 1 a 3 para parear com a lista da esquerda
      const isPremium = business.tipo_cliente === 'pagante' || business.tipo_cliente === 'premium';
      const hasLogo = !!business.logotipo_url;

      // Se for premium/pagante E tiver logo próprio, mostra logo arredondado.
      // Caso contrário (gratuito ou sem logo), SEMPRE mostra o ícone genérico (Briefcase ou Estrela se for 1º)
      const iconInnerHtml = (isPremium && hasLogo)
        ? `<img src="${business.logotipo_url}" class="pin-logo w-full h-full object-cover rounded-[1.2rem] p-[2px]" />`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    ${isFirst
          ? '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'
          : '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>'}
                  </svg>`;

      // Custom HTML icon – nossa identidade visual
      const icon = L.divIcon({
        className: '',
        html: `
          <div class="search-map-pin ${isPremium ? 'pin-premium' : ''} ${isFirst ? 'pin-highlight' : ''}" data-id="${business.id}">
            <div class="pin-inner">
              ${iconInnerHtml}
            </div>
            <div class="pin-tail"></div>
            <div class="pin-label">${business.nome_fantasia}</div>
          </div>
        `,
        iconSize: [52, 62],
        iconAnchor: [26, 62],
      });

      const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .on('mouseover', () => onHover(business.id))
        .on('mouseout', () => onHover(null))
        .on('click', (e: any) => {
          L.DomEvent.stopPropagation(e);
          onClick(business.id);
        });

      markersRef.current.set(business.id, marker);
    });

    // Reposiciona o mapa para mostrar todos os pins (com max 500ms de delay para Leaflet carregar)
    if (validPoints.length > 0) {
      setTimeout(() => {
        try {
          map.fitBounds(validPoints, { padding: [60, 60], maxZoom: 15 });
        } catch (_) { /* ignore */ }
      }, 300);
    } else {
      // Se não tem pins (ou a pesquisa limpou), foca na cidade selecionada ou no centro padrão da Serra
      setTimeout(() => {
        try {
          map.setView(currentCenter, 13);
        } catch (_) { /* ignore */ }
      }, 300);
    }
  }, [results, currentCenter]);

  // Destaque de pin ao hover na lista
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      if (!el) return;
      const pinEl = el.querySelector('.search-map-pin');
      if (!pinEl) return;

      if (id === highlighted) {
        pinEl.classList.add('pin-hovered');
      } else {
        pinEl.classList.remove('pin-hovered');
      }
    });
  }, [highlighted]);

  return (
    <>
      <div ref={mapDivRef} className="absolute inset-0 z-0" />

      <style global jsx>{`
        /* ---------- Tiles: visual premium monocromático ---------- */
        .map-tiles {
          filter: grayscale(1) contrast(0.95) brightness(1.1) sepia(0.08);
        }

        /* ---------- Custom Marker ---------- */
        .search-map-pin {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          width: 52px;
        }
        .search-map-pin:hover,
        .search-map-pin.pin-hovered {
          transform: scale(1.3) translateY(-6px);
          z-index: 999 !important;
        }
        .search-map-pin.pin-hovered .pin-label,
        .search-map-pin:hover .pin-label {
          opacity: 1;
          transform: translateX(-50%) scale(1);
        }
        .pin-inner {
          width: 44px;
          height: 44px;
          border-radius: 1.2rem;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 30px -8px rgba(0,0,0,0.15), inset 0 -2px 0 rgba(0,0,0,0.05);
          color: #B70F0A;
          border: 3px solid white;
          transition: background 0.2s, color 0.2s;
        }
        .search-map-pin.pin-highlight .pin-inner,
        .search-map-pin.pin-premium:hover .pin-inner {
          background: #B70F0A;
          color: white;
          box-shadow: 0 16px 40px -10px rgba(183,15,10,0.4);
          border-color: #B70F0A;
        }
        .pin-tail {
          width: 12px;
          height: 12px;
          background: white;
          transform: rotate(45deg) translateY(-6px);
          margin-top: -4px;
          box-shadow: 2px 2px 6px rgba(0,0,0,0.05);
        }
        .search-map-pin.pin-highlight .pin-tail {
          background: #B70F0A;
        }
        .pin-label {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%) scale(0.85);
          background: white;
          color: #1A1A1A;
          font-size: 11px;
          font-weight: 900;
          font-style: italic;
          white-space: nowrap;
          padding: 6px 14px;
          border-radius: 999px;
          box-shadow: 0 8px 24px -4px rgba(0,0,0,0.12);
          border: 2px solid white;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          font-family: 'Playfair Display', serif;
        }

        /* Leaflet zoom control */
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 8px 24px -4px rgba(0,0,0,0.1) !important;
          border-radius: 1.5rem !important;
          overflow: hidden;
        }
        .leaflet-control-zoom a {
          border: none !important;
          color: #B70F0A !important;
          font-weight: 900 !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-size: 18px !important;
          background: white !important;
        }
        .leaflet-control-zoom a:hover {
          background: #FFF5F4 !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid #f3f4f6 !important;
        }
      `}</style>
    </>
  );
}
