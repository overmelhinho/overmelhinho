/**
 * Dicionário de entidades HTML nomeadas mais comuns
 */
const NAMED_ENTITIES: Record<string, string> = {
    amp: '&',
    apos: "'",
    quot: '"',
    lt: '<',
    gt: '>',
    nbsp: ' ',
    bull: '•',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    ccedil: 'ç',
    Ccedil: 'Ç',
    aacute: 'á',
    eacute: 'é',
    iacute: 'í',
    oacute: 'ó',
    uacute: 'ú',
    Aacute: 'Á',
    Eacute: 'É',
    Iacute: 'Í',
    Oacute: 'Ó',
    Uacute: 'Ú',
    atilde: 'ã',
    otilde: 'õ',
    Atilde: 'Ã',
    Otilde: 'Õ',
    acirc: 'â',
    ecirc: 'ê',
    ocirc: 'ô',
    Acirc: 'Â',
    Ecirc: 'Ê',
    Ocirc: 'Ô',
    agrave: 'à',
    Agrave: 'À',
    uuml: 'ü',
    Uuml: 'Ü',
};

/**
 * Decodifica com segurança entidades HTML numéricas (decimais/hexadecimais) e nomeadas.
 * Converte códigos como &#128525; em emojis reais (😍) e entidades comuns (&amp;, &nbsp;, etc).
 */
export function decodeHtmlEntities(str?: string | null): string {
    if (!str) return '';
    return str
        .replace(/&#(\d+);/g, (_, dec) => {
            try {
                return String.fromCodePoint(parseInt(dec, 10));
            } catch {
                return '';
            }
        })
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
            try {
                return String.fromCodePoint(parseInt(hex, 16));
            } catch {
                return '';
            }
        })
        .replace(/&([a-zA-Z]+);/g, (match, entity) => {
            const lower = entity.toLowerCase();
            if (entity in NAMED_ENTITIES) return NAMED_ENTITIES[entity];
            if (lower in NAMED_ENTITIES) return NAMED_ENTITIES[lower];
            return match;
        });
}

