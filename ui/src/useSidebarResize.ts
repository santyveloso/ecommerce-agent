import { useState, useRef, useEffect, useCallback } from 'react'

const COLLAPSE_THRESHOLD = 80

export function useSidebarResize() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(150)

  const isResizing = useRef(false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const collapsedRef = useRef(sidebarCollapsed)
  collapsedRef.current = sidebarCollapsed

  const handleResizeStart = useCallback((_e: React.MouseEvent) => {
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const w = Math.max(56, Math.min(150, e.clientX))
      if (w < COLLAPSE_THRESHOLD && !collapsedRef.current) {
        setSidebarCollapsed(true)
      } else if (w > COLLAPSE_THRESHOLD + 20 && collapsedRef.current) {
        setSidebarCollapsed(false)
      }
      setSidebarWidth(collapsedRef.current ? w : Math.max(w, 130))
    }
    const handleMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (sidebarCollapsed) {
        setSidebarWidth(56)
      } else if (sidebarWidth < 130) {
        setSidebarWidth(130)
      }
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [sidebarCollapsed, sidebarWidth])

  return {
    sidebarCollapsed,
    sidebarWidth,
    sidebarRef,
    handleResizeStart,
    setSidebarCollapsed,
    setSidebarWidth,
  }
}
