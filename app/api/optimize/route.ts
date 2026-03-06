import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
// 导入 AI SDK 中的流式文本处理函数，适合中文文本的平滑流式传输
import { smoothStream, streamText } from 'ai'

// 设置合理的最大响应时间，避免长时间等待
export const maxDuration = 60

// 创建一个适合中文文本的 OpenAI 兼容客户端，连接到 Moonshot AI 的 API
const moonshot = createOpenAICompatible({
  name: 'moonshot',
  baseURL: 'https://api.moonshot.cn/v1',
  apiKey: process.env.MOONSHOT_API_KEY || ''
})

// 创建一个适合中文文本的分词器，使用 Intl.Segmenter 进行细粒度的分词，适合流式传输
const zhSegmenter = new Intl.Segmenter('zh-CN', { granularity: 'grapheme' })

// 系统提示，指导模型以专业招聘专家的身份进行分析和建议
const SYSTEM_PROMPT = `你是一位资深招聘专家，拥有 15 年以上的人力资源和简历筛选经验。你曾为腾讯、字节跳动、阿里巴巴等一线互联网公司招聘过大量优秀人才。

你的任务是：
1. 分析候选人的简历与目标职位描述（JD）的匹配度
2. 给出专业的简历优化建议
3. 提供具体、可执行的改进方案

输出格式要求：

## 匹配度评分
给出一个 0-100 的匹配度评分，并简要说明理由。

## 优势分析
列出简历中与 JD 高度匹配的 3-5 个亮点。

## 改进建议
针对简历中的不足之处，给出 3-5 条具体改进建议。

## 推荐优化后的简历片段
提供 1-2 个具体的简历段落优化示例，展示如何用更专业、更有说服力的方式表达同样的经历。

回答语言：使用中文，专业且友好。`

export async function POST (req: Request) {
  try {
    // 从请求体中提取简历和职位描述，进行基本的验证和清理
    const body = await req.json()
    // 使用 trim() 去除多余的空白，确保输入的有效性
    const resume = typeof body?.resume === 'string' ? body.resume.trim() : ''
    // 同样处理职位描述，确保输入的有效性
    const jobDescription =
      typeof body?.jobDescription === 'string' ? body.jobDescription.trim() : ''

    console.log('[API] Received request:', {
      resumeLength: resume?.length,
      jobDescriptionLength: jobDescription?.length
    })

    if (!resume || !jobDescription) {
      console.error('[API] Missing required fields:', {
        hasResume: !!resume,
        hasJobDescription: !!jobDescription
      })
      return new Response(JSON.stringify({ error: '请提供简历和职位描述' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('[API] Starting stream with Moonshot AI')
    const result = streamText({
      // 使用适合中文文本的流式文本处理函数，确保输出的流畅性和专业性
      model: moonshot('moonshot-v1-8k'), // 选择适合中文文本的模型，确保分析的准确性和专业性
      system: SYSTEM_PROMPT, // 使用精心设计的系统提示，指导模型以专业招聘专家的身份进行分析和建议
      messages: [
        {
          role: 'user',
          content: `请分析以下简历与职位描述的匹配度，并提供优化建议：

=== 职位描述 (JD) ===
${jobDescription}

=== 简历内容 ===
${resume}`
        }
      ],
      // 设置适当的温度，保持输出的专业性和一致性
      temperature: 0.7,
      // 设置合理的超时时间，避免长时间等待
      abortSignal: req.signal,
      // 使用平滑流式传输，适合中文文本，减少卡顿感
      experimental_transform: smoothStream({
        delayInMs: 18,
        chunking: zhSegmenter
      })
    })

    console.log('[API] Stream created, returning response', result)
    return result.toTextStreamResponse({
      // 设置适合中文文本的响应头，确保流式传输的性能和兼容性
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no'
      }
    })
  } catch (error) {
    console.error('[API] Error in /api/optimize:', error)
    return new Response(
      JSON.stringify({
        error: '服务暂时不可用，请稍后重试',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' } // 确保错误响应的内容类型正确，方便前端处理
      }
    )
  }
}
