
'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

type BackendIncident = {
  [key: string]: any;
};

interface Props {
  incident: BackendIncident | null;
  onClose: () => void;
}

function formatKey(key: string) {
  return key
    .replace(/^u_/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function isProbablyDateString(s: string) {
  if (!s) return false;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return !isNaN(Date.parse(s));
  return false;
}

function isURL(s: string) {
  return /^https?:\/\//i.test(s);
}

function ValueRenderer({ value }: { value: unknown }): ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-white/50">—</span>;

  if (typeof value === 'string') {
    if (isURL(value)) {
      return (
        <a href={value} target="_blank" rel="noreferrer" className="text-emerald-300 underline decoration-emerald-400/50 underline-offset-2">
          {value}
        </a>
      );
    }
    if (isProbablyDateString(value)) {
      return <span>{new Date(value).toLocaleString()}</span>;
    }
    return <span>{value}</span>;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    const allPrimitive = value.every((v) => v === null || ['string', 'number', 'boolean'].includes(typeof v));
    if (allPrimitive) {
      return <span>{value.map((v) => String(v ?? '—')).join(', ')}</span>;
    }
    return (
      <div className="space-y-2">
        {value.map((item, idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-white/5 p-2">
            <ValueRenderer value={item} />
          </div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (('display_value' in obj && (obj as any).display_value) || ('value' in obj && 'link' in obj)) {
      const display = (obj as any).display_value ?? (obj as any).value;
      const link = (obj as any).link as string | undefined;
      return (
        <div className="flex items-center gap-2">
          <span>{String(display)}</span>
          {link && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
            >
              View
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-2">
        {keys.map((k) => (
          <div key={k} className="grid grid-cols-3 gap-2">
            <div className="col-span-1 text-xs uppercase tracking-wide text-white/50">{formatKey(k)}</div>
            <div className="col-span-2 text-sm text-white/90">
              <ValueRenderer value={obj[k]} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
}

export function ClosedIncidentDrawer({ incident, onClose }: Props) {
  if (!incident) return null;

  const preferredOrder = [
    'number',
    'short_description',
    'state',
    'category',
    'u_ai_category',
    'closed_at',
    'close_notes',
    'notify',
    'sys_id',
  ];

  const keys = Object.keys(incident);
  const orderedKeys = [
    ...preferredOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferredOrder.includes(k)),
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col rounded-l-3xl border-l border-white/5 bg-[var(--surface)]"
        aria-label="Closed incident details"
      >
        <div className="flex items-start justify-between border-b border-white/5 p-6">
          <div>
            <p className="text-sm text-white/60">{incident.number ?? incident.sys_id ?? 'Incident'}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">
              {incident.short_description ?? 'Closed Incident'}
            </h3>
            {incident.closed_at && (
              <p className="text-sm text-white/60">Closed {new Date(incident.closed_at).toLocaleString()}</p>
            )}
          </div>
          <button
            type="button"
            className="text-white/70 hover:text-white"
            aria-label="Close drawer"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="h-full px-6 py-4">
          <section className="space-y-3 rounded-2xl border border-white/5 bg-white/5 p-4">
            <h4 className="section-title mb-2">Incident Fields</h4>
            <div className="grid grid-cols-1 gap-3">
              {orderedKeys.map((key) => (
                <div key={key} className="grid grid-cols-3 gap-2 rounded-xl border border-white/5 bg-transparent p-3">
                  <div className="col-span-1 text-xs font-semibold uppercase tracking-wide text-white/60">
                    {formatKey(key)}
                  </div>
                  <div className="col-span-2 whitespace-pre-wrap break-words text-sm text-white/90">
                    <ValueRenderer value={incident[key]} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollArea>
      </aside>
    </div>
  );
}

export default ClosedIncidentDrawer;
