import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { streamText } from 'ai';

export const maxDuration = 60;

const moonshot = createOpenAICompatible({
  name: 'moonshot',
  baseURL: 'https://api.moonshot.cn/v1',
  apiKey: process.env.MOONSHOT_API_KEY || '',
});

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

回答语言：使用中文，专业且友好。`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resume, jobDescription } = body;

    console.log('[API] Received request:', { resumeLength: resume?.length, jobDescriptionLength: jobDescription?.length });

    if (!resume || !jobDescription) {
      console.error('[API] Missing required fields:', { hasResume: !!resume, hasJobDescription: !!jobDescription });
      return new Response(JSON.stringify({ error: '请提供简历和职位描述' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('[API] Starting stream with Moonshot AI');
    const result = streamText({
      model: moonshot('moonshot-v1-8k'),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `请分析以下简历与职位描述的匹配度，并提供优化建议：

=== 职位描述 (JD) ===
${jobDescription}

=== 简历内容 ===
${resume}`,
        },
      ],
      temperature: 0.7,
    });

    console.log('[API] Stream created, returning response', result);
    return result.toTextStreamResponse({
      headers: {
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Error in /api/optimize:', error);
    return new Response(
      JSON.stringify({ error: '服务暂时不可用，请稍后重试', details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
