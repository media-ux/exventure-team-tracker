// src/components/ConnectionIndicator.tsx
import { ChannelState } from '../hooks/useRealtimeSubscription';

interface ConnectionIndicatorProps {
  channelState: ChannelState;
}

const statusConfig: Record<ChannelState, { label: string; color: string; bgColor: string; icon: string }> = {
  SUBSCRIBED: {
    label: 'Live',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: '\u25CF' // ● solid circle
  },
  CONNECTING: {
    label: 'Connecting...',
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: '\u25D0' // ◐ half circle
  },
  CLOSED: {
    label: 'Disconnected',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: '\u25CB' // ○ empty circle
  },
  CHANNEL_ERROR: {
    label: 'Connection Error',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: '\u2715' // ✕ X mark
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
        fontWeight: 500
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
