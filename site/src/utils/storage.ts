/**
 * Utilitário para formatar URLs de mídias e logotipos armazenados no Supabase / S3
 */
export const formatStorageUrl = (url?: string | null): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;

    const cleanPath = url.replace(/^\/+/, '');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://spefwgjsltjryxcizype.supabase.co';
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'clientes-media';

    if (cleanPath.startsWith('v1/object/public/')) {
        return `${supabaseUrl}/storage/${cleanPath}`;
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
};

