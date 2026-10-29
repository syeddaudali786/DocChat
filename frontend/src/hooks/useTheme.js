import { useCallback, useEffect, useState } from 'react'

const KEY = 'theme' // 'light' | 'dark'; absent means follow the system
const media = window.matchMedia('(prefers-color-scheme: dark)')

function readSaved() {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export default function useTheme() {
  const [saved, setSaved] = useState(readSaved)
  const [systemDark, setSystemDark] = useState(media.matches)
  const isDark = saved ? saved === 'dark' : systemDark

  useEffect(() => {
    const onChange = (e) => setSystemDark(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
  }, [isDark])

  const toggle = useCallback(() => {
    const next = isDark ? 'light' : 'dark'
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // storage unavailable: the choice just won't persist
    }
    setSaved(next)
  }, [isDark])

  return { isDark, toggle }
}
