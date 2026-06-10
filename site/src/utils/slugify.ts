/**
 * Gera um slug legível por URL (sem acentos, caracteres especiais ou espaços).
 */
export function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
}
