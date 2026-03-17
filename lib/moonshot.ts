import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

export const moonshot = createOpenAICompatible({
  name: 'moonshot',
  baseURL: 'https://api.moonshot.cn/v1',
  apiKey: process.env.MOONSHOT_API_KEY || ''
})

export const MOONSHOT_TEXT_MODEL =
  process.env.MOONSHOT_TEXT_MODEL || 'moonshot-v1-8k'

export const MOONSHOT_VISION_MODEL =
  process.env.MOONSHOT_VISION_MODEL || 'moonshot-v1-8k-vision-preview'
