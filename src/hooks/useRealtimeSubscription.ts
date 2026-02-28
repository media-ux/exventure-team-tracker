// src/hooks/useRealtimeSubscription.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type ChannelState = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'CONNECTING';

interface UseRealtimeSubscriptionOptions<T> {
  table: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: T) => void;
  onDelete?: (payload: { old: T }) => void;
  enabled?: boolean; // Default true, allows conditional subscription
}

export function useRealtimeSubscription<T extends Record<string, unknown>>({
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeSubscriptionOptions<T>) {
  const [channelState, setChannelState] = useState<ChannelState>('CONNECTING');

  useEffect(() => {
    if (!enabled) {
      setChannelState('CLOSED');
      return;
    }

    const channel: RealtimeChannel = supabase
      .channel(`${table}-changes-${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onInsert?.(payload.new as T);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onUpdate?.(payload.new as T);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table },
        (payload: RealtimePostgresChangesPayload<T>) => {
          onDelete?.(payload as unknown as { old: T });
        }
      )
      .subscribe((status) => {
        // Map Supabase status to our ChannelState type
        if (status === 'SUBSCRIBED') {
          setChannelState('SUBSCRIBED');
        } else if (status === 'CLOSED') {
          setChannelState('CLOSED');
        } else if (status === 'CHANNEL_ERROR') {
          setChannelState('CHANNEL_ERROR');
        } else {
          setChannelState('CONNECTING');
        }
      });

    // CRITICAL: Cleanup to prevent memory leaks (Pitfall 1 from research)
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled]); // Do NOT include callbacks - they change on every render

  const isConnected = channelState === 'SUBSCRIBED';

  return { channelState, isConnected };
}
