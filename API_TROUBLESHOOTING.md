# API 调用问题诊断和解决方案

## 问题现象
用户报告调用 `optimize` 接口成功，但没有返回任何信息。

## 代码检查结果

### 1. API Route 代码分析
**文件位置**: `/Users/jz/Desktop/my-projects/vibecoding-demo/app/api/optimize/route.ts`

**发现的问题**:
1. ✅ 使用了 `export const runtime = 'edge';` - Edge Runtime 可能在某些情况下导致环境变量访问问题
2. ✅ 使用 `streamText().toTextStreamResponse()` 返回流式响应 - 代码本身正确
3. ✅ 错误处理基本完善，但缺少详细日志

**已修复**:
- 禁用了 Edge Runtime（注释掉 `export const runtime = 'edge';`），使用默认的 Node.js Runtime
- 添加了详细的控制台日志，便于调试
- 增加了 `temperature` 和 `maxTokens` 参数

### 2. 前端 useCompletion 调用分析
**文件位置**: `/Users/jz/Desktop/my-projects/vibecoding-demo/app/dashboard/page.tsx`

**代码使用方式**:
```typescript
const {
  completion,
  isLoading,
  error,
  complete,
  stop,
} = useCompletion({
  api: "/api/optimize",
  onFinish: (prompt: string, completion: string) => {
    console.log("Analysis completed", completion);
  },
});

// 调用方式
complete("分析简历", {
  body: {
    resume: resumeText,
    jobDescription,
  },
});
```

**发现的问题**:
1. ✅ 缺少 `onError` 回调处理
2. ✅ 错误显示不够详细
3. ✅ 缺少前端调试信息

**已修复**:
- 添加了 `onError` 回调函数
- 增强了错误显示，包括错误堆栈信息
- 添加了开发模式下的调试信息面板
- 在 `handleAnalyze` 中添加了详细的日志输出

### 3. 环境配置检查
**文件位置**: `/Users/jz/Desktop/my-projects/vibecoding-demo/.env.local`

**配置状态**:
```env
MOONSHOT_API_KEY=XXX
```

✅ API Key 配置正确

### 4. 依赖包检查
**已安装的 AI SDK**:
- `@ai-sdk/openai-compatible@2.0.30`
- `@ai-sdk/react@3.0.99`
- `ai@6.0.97`

✅ 版本兼容，没有发现版本冲突

## 根本原因分析

### 最可能的原因
1. **Edge Runtime 环境变量问题**:
   - Edge Runtime 中访问 `process.env` 可能存在限制
   - 某些 AI SDK 在 Edge Runtime 中的行为可能不稳定

2. **流式响应格式问题**:
   - `useCompletion` hook 可能期望特定的响应格式
   - 需要确保 `toTextStreamResponse()` 返回的流包含正确的 Content-Type

3. **网络或 CORS 问题**:
   - 可能存在代理或防火墙阻止流式响应
   - 浏览器可能没有正确处理流式数据

## 已实施的解决方案

### 修复 1: 禁用 Edge Runtime
```typescript
// 修改前
export const runtime = 'edge';

// 修改后
// export const runtime = 'edge';  // 使用 Node.js runtime
```

**理由**: Node.js Runtime 对环境变量和流式处理的兼容性更好。

### 修复 2: 增强日志记录
```typescript
console.log('[API] Received request:', { resumeLength: resume?.length, jobDescriptionLength: jobDescription?.length });
console.log('[API] Starting stream with Moonshot AI');
console.log('[API] Stream created, returning response');
```

**理由**: 便于在服务器控制台中追踪请求流程。

### 修复 3: 添加参数控制
```typescript
const result = streamText({
  model: moonshot('moonshot-v1-8k'),
  system: SYSTEM_PROMPT,
  messages: [...],
  temperature: 0.7,
  maxTokens: 2000,
});
```

**理由**: 明确控制生成参数，避免超时或过长响应。

### 修复 4: 前端错误处理增强
```typescript
onError: (error) => {
  console.error("Completion error:", error);
}
```

**理由**: 捕获并显示任何前端错误。

### 修复 5: 调试信息面板
```typescript
{process.env.NODE_ENV === 'development' && (
  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
    <div>调试信息:</div>
    <div>• isLoading: {String(isLoading)}</div>
    <div>• completion 长度: {completion?.length || 0}</div>
    <div>• resumeText 长度: {resumeText.length}</div>
    <div>• jobDescription 长度: {jobDescription.length}</div>
  </div>
)}
```

**理由**: 实时显示组件状态，便于调试。

## 测试验证

### 直接 API 测试
使用 curl 命令直接测试 API:
```bash
curl -X POST http://localhost:3000/api/optimize \
  -H "Content-Type: application/json" \
  -d '{"resume":"测试简历","jobDescription":"测试职位描述"}'
```

**结果**: ✅ API 返回正确的流式响应

### 测试页面
创建了一个测试页面: `/Users/jz/Desktop/my-projects/vibecoding-demo/app/test-stream/page.tsx`

访问 `http://localhost:3000/test-stream` 可以测试原始的流式响应。

## 后续排查步骤

如果问题仍然存在，请按以下步骤排查：

### 1. 检查浏览器控制台
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页
- 查看 Network 标签页中的 `/api/optimize` 请求

### 2. 检查服务器日志
- 在运行 `npm run dev` 的终端中查看日志
- 查找 `[API]` 前缀的日志输出

### 3. 使用测试页面
- 访问 `http://localhost:3000/test-stream`
- 点击"开始测试"按钮
- 查看响应是否正确显示

### 4. 检查网络状态
- 打开 Network 标签页
- 筛选 XHR/Fetch 请求
- 查看 `/api/optimize` 请求的状态码和响应头
- 确认 Content-Type 是否为 `text/plain` 或 `text/event-stream`

### 5. 验证 API Key
- 确认 API Key 仍然有效
- 检查 Moonshot AI 账户余额
- 验证 API Key 权限

## 可能的备用解决方案

### 方案 A: 使用非流式 API
如果流式响应持续有问题，可以改为使用非流式 API:

```typescript
import { generateText } from 'ai';

// 替换 streamText 为 generateText
const result = await generateText({
  model: moonshot('moonshot-v1-8k'),
  system: SYSTEM_PROMPT,
  messages: [...],
});

return new Response(JSON.stringify({ text: result.text }), {
  headers: { 'Content-Type': 'application/json' },
});
```

前端需要相应地修改为使用 `useChat` 或普通 fetch 调用。

### 方案 B: 添加 CORS 头
如果存在 CORS 问题，在 API Route 中添加:

```typescript
return result.toTextStreamResponse({
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  },
});
```

### 方案 C: 使用不同的 AI SDK
尝试使用官方 OpenAI SDK:

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
});

// 使用 openai.chat.completions.create()
```

## 总结

主要修复内容:
1. ✅ 禁用了 Edge Runtime，改用 Node.js Runtime
2. ✅ 添加了详细的 API 日志
3. ✅ 增强了前端错误处理和显示
4. ✅ 添加了开发模式调试面板
5. ✅ 明确设置了 AI 生成参数

这些修改应该能解决大部分情况下的问题。如果问题仍然存在，请查看服务器控制台和浏览器控制台的详细错误信息，以便进一步诊断。
