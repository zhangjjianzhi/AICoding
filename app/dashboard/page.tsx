"use client";

import { useState, type ChangeEvent } from "react";
import { useCompletion } from "@ai-sdk/react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MAX_UPLOAD_SIZE = 8 * 1024 * 1024;
const FILE_ACCEPT =
  ".txt,.md,.markdown,.json,.csv,.xml,.yaml,.yml,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

type UploadTarget = "resume" | "jobDescription";
type UploadMethod = "file" | "camera";

type UploadState = {
  isUploading: boolean;
  fileName?: string;
  sourceLabel?: string;
  charCount?: number;
  error?: string;
};

const createInitialUploadStates = (): Record<UploadTarget, UploadState> => ({
  resume: { isUploading: false },
  jobDescription: { isUploading: false },
});

const fieldConfig = {
  resume: {
    title: "简历内容",
    placeholder: "粘贴你的简历内容，支持纯文本格式...",
    hint: "支持粘贴或上传 TXT、Markdown、DOCX、PDF、图片截图；手机端可相册选择或直接拍照导入。",
    iconClasses: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    path: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  jobDescription: {
    title: "职位描述 (JD)",
    placeholder: "粘贴目标职位的职位描述...",
    hint: "建议导入完整岗位职责、核心要求和加分项，分析会更精准。",
    iconClasses: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    path: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z",
  },
} as const;

function formatCharCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default function DashboardPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [uploadStates, setUploadStates] = useState(createInitialUploadStates);

  const {
    completion,
    isLoading,
    error,
    complete,
    stop,
    setCompletion,
  } = useCompletion({
    api: "/api/optimize",
    streamProtocol: "text",
    experimental_throttle: 16,
    onFinish: (prompt: string, completion: string, ...ags) => {
      console.log("Analysis completed", {
        prompt,
        completionLength: completion.length,
        completion,
        ags,
      });
    },
    onError: (error) => {
      console.error("Completion error:", error);
    },
  });

  const hasCompletion = completion.trim().length > 0;
  const hasDraftContent =
    resumeText.trim().length > 0 || jobDescription.trim().length > 0;
  const isAnyUploading = Object.values(uploadStates).some(
    (state) => state.isUploading,
  );

  const updateUploadState = (
    target: UploadTarget,
    nextState: Partial<UploadState>,
  ) => {
    setUploadStates((previous) => ({
      ...previous,
      [target]: {
        ...previous[target],
        ...nextState,
      },
    }));
  };

  const setFieldValue = (target: UploadTarget, value: string) => {
    if (target === "resume") {
      setResumeText(value);
      return;
    }

    setJobDescription(value);
  };

  const handleAnalyze = () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      alert("请填写或上传简历和职位描述");
      return;
    }

    stop();
    setCompletion("");
    void complete("分析简历", {
      body: {
        resume: resumeText,
        jobDescription,
      },
    });
  };

  const resetAll = () => {
    stop();
    setCompletion("");
    setResumeText("");
    setJobDescription("");
    setUploadStates(createInitialUploadStates());
  };

  const handleFileUpload = async (
    target: UploadTarget,
    file: File,
    method: UploadMethod,
  ) => {
    if (file.size > MAX_UPLOAD_SIZE) {
      updateUploadState(target, {
        isUploading: false,
        error: "文件不能超过 8MB，请压缩后重试。",
      });
      return;
    }

    updateUploadState(target, {
      isUploading: true,
      error: undefined,
      fileName: file.name,
      sourceLabel: method === "camera" ? "拍照识别中" : "文件导入中",
      charCount: undefined,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", target);

      const response = await fetch("/api/extract-text", {
        method: "POST",
        body: formData,
      });

      let payload:
        | {
            error?: string;
            mode?: "text" | "vision";
            text?: string;
          }
        | undefined;

      try {
        payload = (await response.json()) as typeof payload;
      } catch {
        payload = undefined;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "导入失败，请稍后再试");
      }

      const extractedText = payload?.text?.trim();

      if (!extractedText) {
        throw new Error("没有识别到可用文本，请更换更清晰的文件。");
      }

      setFieldValue(target, extractedText);
      updateUploadState(target, {
        isUploading: false,
        error: undefined,
        fileName: file.name,
        sourceLabel:
          method === "camera"
            ? "拍照识别完成"
            : payload?.mode === "vision"
              ? "图片 / PDF 提取完成"
              : "文本导入完成",
        charCount: extractedText.length,
      });
    } catch (uploadError) {
      updateUploadState(target, {
        isUploading: false,
        error:
          uploadError instanceof Error
            ? uploadError.message
            : "导入失败，请稍后再试。",
      });
    }
  };

  const handleFileSelection =
    (target: UploadTarget, method: UploadMethod) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file) {
        return;
      }

      void handleFileUpload(target, file, method);
    };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.22),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(129,140,248,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff,_#eef4ff_52%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a_45%,_#020617_100%)]">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/75 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              返回首页
            </Link>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-900/80 dark:bg-blue-950/60 dark:text-blue-200">
              上传文件 / 相册 / 拍照都支持
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              简历优化工作台
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              先导入简历和 JD，再一键生成更贴近目标岗位的优化建议。
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
        {error && (
          <div className="mb-6 rounded-3xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-700 shadow-sm dark:border-red-900 dark:bg-red-950/70 dark:text-red-200">
            <div className="font-semibold">发生错误</div>
            <div className="mt-1">{error.message}</div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <section className="space-y-6">
            {(["resume", "jobDescription"] as const).map((fieldKey) => {
              const field = fieldConfig[fieldKey];
              const uploadState = uploadStates[fieldKey];
              const value =
                fieldKey === "resume" ? resumeText : jobDescription;

              return (
                <div
                  key={fieldKey}
                  className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70 dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)] sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${field.iconClasses}`}
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d={field.path}
                            />
                          </svg>
                        </span>
                        <div>
                          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                            {field.title}
                          </h2>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            导入后仍可继续手动编辑。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <input
                        id={`${fieldKey}-upload`}
                        type="file"
                        accept={FILE_ACCEPT}
                        className="sr-only"
                        onChange={handleFileSelection(fieldKey, "file")}
                      />
                      <label
                        htmlFor={`${fieldKey}-upload`}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                          />
                        </svg>
                        上传文件
                      </label>

                      <input
                        id={`${fieldKey}-camera`}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleFileSelection(fieldKey, "camera")}
                      />
                      <label
                        htmlFor={`${fieldKey}-camera`}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white sm:hidden"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 7.5h10.5m-10.5 0L5.25 9m1.5-1.5L8.25 9m-1.5 7.5h10.5a2.25 2.25 0 002.25-2.25V9.75A2.25 2.25 0 0017.25 7.5H15l-.879-1.757A1.125 1.125 0 0013.114 5h-2.228a1.125 1.125 0 00-1.007.743L9 7.5H6.75A2.25 2.25 0 004.5 9.75v4.5A2.25 2.25 0 006.75 16.5zm5.25-6a2.625 2.625 0 110 5.25 2.625 2.625 0 010-5.25z"
                          />
                        </svg>
                        拍照导入
                      </label>
                    </div>
                  </div>

                  <div className="mt-5">
                    <textarea
                      value={value}
                      onChange={(event) => {
                        updateUploadState(fieldKey, { error: undefined });
                        setFieldValue(fieldKey, event.target.value);
                      }}
                      placeholder={field.placeholder}
                      className="min-h-[260px] w-full rounded-[24px] border border-slate-200 bg-slate-50/85 px-4 py-4 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20 sm:min-h-[300px]"
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      当前内容 {value.trim() ? `${formatCharCount(value.length)} 字` : "未填写"}
                    </span>
                    {uploadState.isUploading && (
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-200">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-300" />
                        正在识别文件内容...
                      </span>
                    )}
                    {uploadState.fileName && !uploadState.error && !uploadState.isUploading && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                        {uploadState.sourceLabel} · {uploadState.fileName}
                        {uploadState.charCount
                          ? ` · ${formatCharCount(uploadState.charCount)} 字`
                          : ""}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {field.hint}
                  </p>

                  {uploadState.error && (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/70 dark:text-red-200">
                      {uploadState.error}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="rounded-[28px] border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] dark:border-slate-800 dark:bg-slate-900 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-blue-200">
                      输入完成后即可开始分析
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-white">
                      让简历和目标岗位快速对齐
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      简历：{resumeText.trim() ? `${formatCharCount(resumeText.length)} 字` : "未就绪"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      JD：{jobDescription.trim() ? `${formatCharCount(jobDescription.length)} 字` : "未就绪"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      输出：Markdown 流式分析
                    </span>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[240px]">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || isAnyUploading}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        正在生成分析
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                          />
                        </svg>
                        开始优化
                      </>
                    )}
                  </button>

                  {isLoading ? (
                    <button
                      onClick={stop}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
                        />
                      </svg>
                      停止生成
                    </button>
                  ) : (
                    <button
                      onClick={resetAll}
                      disabled={!hasCompletion && !hasDraftContent}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      清空内容
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.1)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/72 dark:shadow-[0_24px_80px_rgba(2,6,23,0.48)] sm:p-6">
              <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                      />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                      分析结果
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      AI 会输出匹配度、优势项、改进建议和简历示例。
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 min-h-[360px] rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-950 sm:p-5 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
                {hasCompletion ? (
                  <div className="prose prose-sm max-w-none text-slate-900 dark:prose-invert dark:text-slate-100">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {completion}
                    </ReactMarkdown>
                    {isLoading && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400" />
                        正在流式生成...
                      </div>
                    )}
                  </div>
                ) : isLoading ? (
                  <div className="flex min-h-[320px] items-center justify-center">
                    <div className="flex flex-col items-center gap-4 text-center text-slate-600 dark:text-slate-300">
                      <svg
                        className="h-12 w-12 animate-pulse"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                      </svg>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          AI 正在建立流式响应
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          结果会实时显示在这里。
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <svg
                      className="mb-4 h-16 w-16 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <p className="text-sm leading-6">
                      先填写或上传简历与职位描述，
                      <br />
                      然后点击“开始优化”获取结果。
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
