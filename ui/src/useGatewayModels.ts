import { useState, useEffect, useCallback } from 'react'
import { API, FALLBACK_MODELS } from './constants'

/**
 * Hook que gere o estado dos modelos disponíveis no gateway
 * e o modelo ativo. Faz fetch automático ao montar.
 */
export function useGatewayModels() {
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS)
  const [gatewayActiveModel, setGatewayActiveModel] = useState<string>('deepseek-v4-flash')

  // ── Fetch available models from gateway ────
  useEffect(() => {
    fetch(`${API}/gateway/models`)
      .then(r => r.json())
      .then(data => {
        if (data.models?.length) {
          setAvailableModels(data.models)
        }
        if (data.active) {
          setGatewayActiveModel(data.active)
        }
      })
      .catch(() => {/* gateway offline, fallback models */})
  }, [])

  const setActiveModel = useCallback(async (model: string) => {
    setGatewayActiveModel(model)
    try {
      await fetch(`${API}/gateway/model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model }),
      })
    } catch {/* silent */}
  }, [])

  return {
    availableModels,
    gatewayActiveModel,
    setGatewayActiveModel,
    setActiveModel,
  }
}
