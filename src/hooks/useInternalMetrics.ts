import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface DashboardKpis {
  openRate: number;
  actionRate: number;
  totalSent: number;
  totalRead: number;
}

export interface DispatchesByDay {
  day: string;
  whatsapp: number;
  sms: number;
  email: number;
  total: number;
}

export interface RulerResolution {
  reg: string;
  pct: number;
  count: number;
}

export interface RecentDispatch {
  id: number;
  contract_id: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'delivered' | 'read' | 'pending' | 'failed';
  reg: string | null;
  sent_at: string;
}

export interface InternalMetrics {
  kpis: DashboardKpis | null;
  byDay: DispatchesByDay[];
  ruler: RulerResolution[];
  recent: RecentDispatch[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const EMPTY_KPIS: DashboardKpis = { openRate: 0, actionRate: 0, totalSent: 0, totalRead: 0 };

export function useInternalMetrics(): InternalMetrics {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [byDay, setByDay] = useState<DispatchesByDay[]>([]);
  const [ruler, setRuler] = useState<RulerResolution[]>([]);
  const [recent, setRecent] = useState<RecentDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setKpis(EMPTY_KPIS);
      return;
    }
    setLoading(true);
    setError(null);
    const [kpiRes, byDayRes, rulerRes, recentRes] = await Promise.all([
      supabase.rpc('metric_dashboard_kpis'),
      supabase.rpc('metric_dispatches_by_day'),
      supabase.rpc('metric_ruler_resolution'),
      supabase.rpc('metric_recent_dispatches', { p_limit: 10 }),
    ]);

    const err =
      kpiRes.error?.message ??
      byDayRes.error?.message ??
      rulerRes.error?.message ??
      recentRes.error?.message;
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    const kpi = (kpiRes.data as Array<Record<string, number>> | null)?.[0];
    setKpis(
      kpi
        ? {
            openRate: Number(kpi.open_rate ?? 0),
            actionRate: Number(kpi.action_rate ?? 0),
            totalSent: Number(kpi.total_sent ?? 0),
            totalRead: Number(kpi.total_read ?? 0),
          }
        : EMPTY_KPIS,
    );
    setByDay(
      ((byDayRes.data as Array<Record<string, string | number>> | null) ?? []).map((r) => ({
        day: String(r.day),
        whatsapp: Number(r.whatsapp ?? 0),
        sms: Number(r.sms ?? 0),
        email: Number(r.email ?? 0),
        total: Number(r.total ?? 0),
      })),
    );
    setRuler(
      ((rulerRes.data as Array<Record<string, string | number>> | null) ?? []).map((r) => ({
        reg: String(r.reg),
        pct: Number(r.pct ?? 0),
        count: Number(r.count ?? 0),
      })),
    );
    setRecent((recentRes.data as RecentDispatch[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { kpis, byDay, ruler, recent, loading, error, reload };
}
