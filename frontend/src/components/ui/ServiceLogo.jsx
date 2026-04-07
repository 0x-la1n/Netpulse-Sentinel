import React, { useMemo, useState } from 'react';
import { Activity, Globe, Server } from 'lucide-react';

function inferHostname(target) {
  const raw = String(target || '').trim();
  if (!raw) return '';

  try {
    if (/^https?:\/\//i.test(raw)) {
      return new URL(raw).hostname;
    }

    return new URL(`http://${raw}`).hostname;
  } catch {
    return '';
  }
}

function isIPv4(value) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(String(value || ''));
}

function getBaseIcon(type) {
  const normalized = String(type || '').toUpperCase();

  if (normalized === 'HTTP') return Globe;
  if (normalized === 'PING') return Activity;
  return Server;
}

export function ServiceLogo({ service, sizeClass = 'h-8 w-8', withBadge = true }) {
  const [hasImageError, setHasImageError] = useState(false);

  const host = useMemo(() => inferHostname(service?.target), [service?.target]);
  const isIpLike = isIPv4(host);
  const canUseFavicon = Boolean(host) && !isIpLike;
  const faviconUrl = canUseFavicon
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`
    : '';

  const BaseIcon = getBaseIcon(service?.type);
  const showFavicon = Boolean(faviconUrl) && !hasImageError;

  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      <div className="absolute inset-0 rounded-full border border-slate-700 bg-slate-900/90 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/80 to-slate-950" />

        {showFavicon ? (
          <img
            src={faviconUrl}
            alt={host ? `Logo de ${host}` : 'Logo de servicio'}
            className="relative z-10 h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="relative z-10 h-full w-full flex items-center justify-center">
            <BaseIcon className="h-4 w-4 text-slate-200" />
          </div>
        )}
      </div>

      {showFavicon && withBadge && (
        <span className="absolute -bottom-1 -right-1 z-20 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center shadow-[0_0_0_1px_rgba(51,65,85,0.8)]">
          <BaseIcon className="h-2.5 w-2.5 text-emerald-300" />
        </span>
      )}
    </div>
  );
}
