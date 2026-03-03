// src/components/ConnectionIndicator.tsx
import type { ChannelState } from '../hooks/useRealtimeSubscription';
import { theme } from '../lib/theme';

interface ConnectionIndicatorProps {
  channelState: ChannelState;
}

const statusConfig: Record<ChannelState, { label: string; color: string; bgColor: string; icon: string }> = {
  SUBSCRIBED: {
    label: 'Live',
    color: theme.success,
    bgColor: theme.successBg,
    icon: '\u25CF'
  },
  CONNECTING: {
    label: 'Connecting...',
    color: theme.warning,
    bgColor: theme.warningBg,
    icon: '\u25D0'
  },
  CLOSED: {
    label: 'Disconnected',
    color: theme.error,
    bgColor: theme.errorBg,
    icon: '\u25CB'
  },
  CHANNEL_ERROR: {
    label: 'Connection Error',
    color: theme.error,
    bgColor: theme.errorBg,
    icon: '\u2715'
  }
};

export function ConnectionIndicator({ channelState }: ConnectionIndicatorProps) {
  const config = statusConfig[channelState];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '9999px',
        backgroundColor: config.bgColor,
        fontSize: '12px',
        fontWeight: 500,
        border: `1px solid ${config.color}33`,
      }}
    >
      <span style={{ color: config.color, fontSize: '10px' }}>
        {config.icon}
      </span>
      <span style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}
