import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, { url: string; expires: number }>();

export function useSignedUrl(bucket: string, path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    const key = `${bucket}/${path}`;
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      setUrl(cached.url);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (cancelled || !data?.signedUrl) return;
        cache.set(key, { url: data.signedUrl, expires: Date.now() + 3500 * 1000 });
        setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, path]);
  return url;
}

export function SignedImage({
  bucket,
  path,
  alt,
  className,
  fallback,
}: {
  bucket: string;
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const url = useSignedUrl(bucket, path);
  if (!path) return <>{fallback ?? null}</>;
  if (!url) return <div className={className + " bg-muted animate-pulse"} />;
  return <img src={url} alt={alt} className={className} />;
}
