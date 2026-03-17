import { generateText } from 'ai'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { MOONSHOT_VISION_MODEL, moonshot } from '@/lib/moonshot'

export const maxDuration = 60

const MAX_FILE_SIZE = 8 * 1024 * 1024
const PDF_OCR_PAGE_LIMIT = 3

const EXTRACTION_PROMPT = `你是一位严格的文本转录助手。请从用户上传的简历、岗位描述、PDF 或图片中完整提取可见文字。

请严格遵守以下要求：
1. 只返回提取后的正文，不要解释、不要总结、不要补充任何说明。
2. 尽量保留标题、段落、项目符号和换行层次。
3. 如果是双栏、表格或截图，请按从上到下、从左到右整理成可读文本。
4. 如果个别内容无法辨认，用 [无法识别] 标记。
5. 如果文件里几乎没有可用文字，只返回：未识别到可用文本`

const textMimeTypes = new Set([
  'application/json',
  'application/ld+json',
  'application/xml',
  'application/x-yaml',
  'text/csv',
  'text/html',
  'text/markdown',
  'text/plain',
  'text/tab-separated-values',
  'text/xml'
])

const textExtensions = new Set([
  'csv',
  'html',
  'json',
  'md',
  'markdown',
  'txt',
  'tsv',
  'xml',
  'yaml',
  'yml'
])

const imageExtensions = new Set([
  'heic',
  'heif',
  'jpeg',
  'jpg',
  'png',
  'webp'
])

const fieldLabels = {
  resume: '简历',
  jobDescription: '职位描述'
} as const

const pdfWorkerPath = path.join(
  process.cwd(),
  'node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs'
)
const pdfWorkerSource = readFileSync(pdfWorkerPath, 'utf8')

PDFParse.setWorker(
  `data:text/javascript;base64,${Buffer.from(pdfWorkerSource).toString('base64')}`
)

function getExtension(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  return parts.length > 1 ? parts.at(-1) ?? '' : ''
}

function isTextFile(file: File) {
  const extension = getExtension(file.name)
  return file.type.startsWith('text/') ||
    textMimeTypes.has(file.type) ||
    textExtensions.has(extension)
}

function isDocxFile(file: File) {
  const extension = getExtension(file.name)
  return file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
}

function isPdfFile(file: File) {
  const extension = getExtension(file.name)
  return file.type === 'application/pdf' || extension === 'pdf'
}

function isImageOrPdfFile(file: File) {
  const extension = getExtension(file.name)
  return file.type.startsWith('image/') ||
    file.type === 'application/pdf' ||
    imageExtensions.has(extension) ||
    extension === 'pdf'
}

function normalizePdfText(text: string) {
  return text
    .replace(/^--\s*\d+\s+of\s+\d+\s*--$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeMediaType(file: File) {
  if (file.type) {
    return file.type
  }

  const extension = getExtension(file.name)

  if (extension === 'pdf') {
    return 'application/pdf'
  }

  if (extension === 'docx') {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  if (extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }

  if (extension === 'png') {
    return 'image/png'
  }

  if (extension === 'webp') {
    return 'image/webp'
  }

  if (extension === 'heic') {
    return 'image/heic'
  }

  if (extension === 'heif') {
    return 'image/heif'
  }

  return 'application/octet-stream'
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const fieldValue = formData.get('field')

    if (!(file instanceof File)) {
      return Response.json({ error: '请上传文件后再试' }, { status: 400 })
    }

    if (
      typeof fieldValue !== 'string' ||
      !(fieldValue in fieldLabels)
    ) {
      return Response.json({ error: '无效的上传目标' }, { status: 400 })
    }

    if (file.size === 0) {
      return Response.json({ error: '上传的文件为空' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: '文件不能超过 8MB，请压缩后重试' },
        { status: 413 }
      )
    }

    if (isTextFile(file)) {
      const text = (await file.text()).trim()

      if (!text) {
        return Response.json(
          { error: '文本文件中没有可用内容' },
          { status: 422 }
        )
      }

      return Response.json({ mode: 'text', text })
    }

    if (isDocxFile(file)) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const { value } = await mammoth.extractRawText({
        buffer: fileBuffer
      })
      const text = value.trim()

      if (!text) {
        return Response.json(
          { error: 'Word 文档中没有识别到可用文本' },
          { status: 422 }
        )
      }

      return Response.json({ mode: 'text', text })
    }

    if (isPdfFile(file)) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const parser = new PDFParse({ data: fileBuffer })

      try {
        const textResult = await parser.getText()
        const extractedText = normalizePdfText(textResult.text)

        if (extractedText) {
          return Response.json({ mode: 'text', text: extractedText })
        }

        if (!process.env.MOONSHOT_API_KEY) {
          return Response.json(
            {
              error:
                '当前 PDF 更像扫描件，需配置 MOONSHOT_API_KEY 才能继续做 OCR 识别'
            },
            { status: 503 }
          )
        }

        const screenshots = await parser.getScreenshot({
          first: PDF_OCR_PAGE_LIMIT,
          imageDataUrl: false,
          desiredWidth: 1400
        })

        if (!screenshots.pages.length) {
          return Response.json(
            { error: 'PDF 中没有可识别的页面内容' },
            { status: 422 }
          )
        }

        const result = await generateText({
          model: moonshot(MOONSHOT_VISION_MODEL),
          system: EXTRACTION_PROMPT,
          temperature: 0,
          abortSignal: req.signal,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `请提取这份${fieldLabels[fieldValue as keyof typeof fieldLabels]} PDF 中的完整文字内容。这是一个扫描版 PDF，我已将前 ${screenshots.pages.length} 页转换为图片，请按页顺序整合文本。`
                },
                ...screenshots.pages.map((page) => ({
                  type: 'file' as const,
                  data: page.data,
                  filename: `${file.name.replace(/\.pdf$/i, '')}-page-${page.pageNumber}.png`,
                  mediaType: 'image/png'
                }))
              ]
            }
          ]
        })

        const ocrText = result.text.trim()

        if (!ocrText || ocrText === '未识别到可用文本') {
          return Response.json(
            { error: '没有识别到清晰文字，请尝试更清晰的 PDF 或改传图片' },
            { status: 422 }
          )
        }

        return Response.json({ mode: 'vision', text: ocrText })
      } finally {
        await parser.destroy()
      }
    }

    if (!isImageOrPdfFile(file)) {
      return Response.json(
        {
          error:
            '暂时仅支持 TXT、Markdown、JSON、CSV、DOCX、PDF 或图片文件（PNG / JPG / WEBP / HEIC）'
        },
        { status: 415 }
      )
    }

    if (!process.env.MOONSHOT_API_KEY) {
      return Response.json(
        { error: '未配置 MOONSHOT_API_KEY，暂时无法识别图片或 PDF' },
        { status: 503 }
      )
    }

    const mediaType = normalizeMediaType(file)
    const fileData = new Uint8Array(await file.arrayBuffer())
    const fieldLabel = fieldLabels[fieldValue as keyof typeof fieldLabels]

    const result = await generateText({
      model: moonshot(MOONSHOT_VISION_MODEL),
      system: EXTRACTION_PROMPT,
      temperature: 0,
      abortSignal: req.signal,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请提取这份${fieldLabel}中的完整文字内容，保持原始结构，供后续分析直接使用。`
            },
            {
              type: 'file',
              data: fileData,
              filename: file.name,
              mediaType
            }
          ]
        }
      ]
    })

    const text = result.text.trim()

    if (!text || text === '未识别到可用文本') {
      return Response.json(
        { error: '没有识别到清晰文字，请尝试更清晰的截图或 PDF' },
        { status: 422 }
      )
    }

    return Response.json({ mode: 'vision', text })
  } catch (error) {
    console.error('[API] Error in /api/extract-text:', error)
    return Response.json(
      {
        error: '文件识别失败，请稍后再试',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
