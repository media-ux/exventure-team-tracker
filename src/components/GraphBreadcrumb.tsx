// src/components/GraphBreadcrumb.tsx

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
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        fontFamily: 'sans-serif',
        fontSize: '16px'
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
                  color: '#1976d2',
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
              <span style={{ color: '#000000' }}>
                {item.name}
              </span>
            )}

            {!isLast && (
              <span style={{ margin: '0 8px', color: '#666' }}>›</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
