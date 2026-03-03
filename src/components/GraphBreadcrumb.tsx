// src/components/GraphBreadcrumb.tsx
import { theme } from '../lib/theme';

interface BreadcrumbItem {
  id: string
  name: string
  level: 'company' | 'project' | 'sub-unit' | 'task'
}

interface GraphBreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate: (id: string, level: string) => void
}

export function GraphBreadcrumb({ items, onNavigate }: GraphBreadcrumbProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 10,
        backgroundColor: `${theme.bgSurface}ee`,
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        border: `1px solid ${theme.border}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={item.id}>
            {!isLast ? (
              <button
                onClick={() => onNavigate(item.id, item.level)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.cyan,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  fontFamily: 'inherit'
                }}
              >
                {item.name}
              </button>
            ) : (
              <span style={{ color: theme.text }}>
                {item.name}
              </span>
            )}

            {!isLast && (
              <span style={{ margin: '0 8px', color: theme.textMuted }}>/</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
