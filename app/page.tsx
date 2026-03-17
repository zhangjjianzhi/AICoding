import Link from "next/link";

const featureCards = [
  {
    title: "智能分析",
    description: "对照 JD 识别关键词、经验缺口和表达亮点。",
    tone: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
    path: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    title: "流式输出",
    description: "生成过程中实时看到评分、建议和优化示例。",
    tone: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300",
    path: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  },
  {
    title: "移动友好",
    description: "手机端支持相册上传、拍照导入和自适应布局。",
    tone: "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300",
    path: "M8.625 9.75A.375.375 0 019 9.375h6a.375.375 0 01.375.375v4.5a.375.375 0 01-.375.375H9a.375.375 0 01-.375-.375v-4.5z M9 18.75h6m-7.5 3h9A2.25 2.25 0 0018.75 19.5V4.5A2.25 2.25 0 0016.5 2.25h-9A2.25 2.25 0 005.25 4.5v15A2.25 2.25 0 007.5 21.75z",
  },
];

const steps = [
  {
    eyebrow: "Step 1",
    title: "导入简历",
    description: "支持直接粘贴，也支持上传截图、PDF 或拍照识别。",
  },
  {
    eyebrow: "Step 2",
    title: "补充 JD",
    description: "粘贴职位要求或上传岗位截图，系统会自动提取文本。",
  },
  {
    eyebrow: "Step 3",
    title: "生成优化建议",
    description: "快速得到匹配度评分、改写方向和可直接参考的示例。",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.24),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(129,140,248,0.18),_transparent_25%),linear-gradient(180deg,_#f8fbff,_#eef4ff_48%,_#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_26%),radial-gradient(circle_at_80%_20%,_rgba(99,102,241,0.18),_transparent_24%),linear-gradient(180deg,_#020617,_#0f172a_48%,_#020617_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30 dark:opacity-15" />

      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <section className="grid items-center gap-10 lg:min-h-[72vh] lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-4">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-medium tracking-[0.24em] text-blue-700 uppercase shadow-sm dark:border-blue-900/80 dark:bg-slate-950/70 dark:text-blue-200">
                AI Resume Studio
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                让简历和目标职位
                <span className="block text-blue-600 dark:text-blue-300">
                  更快对上频道
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg lg:mx-0">
                上传简历、DOCX、拍一张岗位截图，或直接粘贴文本。系统会自动提取内容，分析匹配度，并输出可直接落地的优化建议。
              </p>
            </div>

            <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full bg-slate-950 px-8 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:ring-offset-2 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-white/50"
              >
                进入工作台
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 px-8 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              >
                了解流程
              </a>
            </div>

            <div className="grid gap-3 text-left sm:grid-cols-3">
              {[
                ["自动提取", "支持图片 / PDF / DOCX / 文本"],
                ["移动端优化", "相册与拍照都可导入"],
                ["实时反馈", "边生成边查看分析"],
              ].map(([title, description]) => (
                <div
                  key={title}
                  className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70 dark:shadow-[0_16px_60px_rgba(2,6,23,0.4)]"
                >
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">
                    {title}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-blue-200/50 via-transparent to-violet-200/40 blur-2xl dark:from-blue-900/30 dark:to-violet-900/30" />
            <div className="relative rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-[0_32px_120px_rgba(15,23,42,0.12)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/72 dark:shadow-[0_32px_120px_rgba(2,6,23,0.52)] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    工作台预览
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950 dark:text-white">
                    手机 / 桌面双端适配
                  </h2>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium text-white dark:bg-white dark:text-slate-950">
                  Live
                </span>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 dark:border-slate-800 dark:bg-slate-900/80">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
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
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-950 dark:text-white">
                        简历导入
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        上传 DOCX / PDF / 图片，或直接拍照识别
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      匹配度
                    </div>
                    <div className="mt-3 text-4xl font-semibold text-slate-950 dark:text-white">
                      86
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      项目成果表达清晰，但缺少针对岗位关键词的突出。
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                      推荐动作
                    </div>
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      <li>补充业务指标与结果量化</li>
                      <li>前置目标岗位的核心技能词</li>
                      <li>将经历改写为更强行动导向</li>
                    </ul>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-4 text-white dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">一句话总结</div>
                      <div className="mt-1 text-sm leading-6 text-slate-300">
                        不用反复切换设备，手机上也能完成完整导入、分析与查看。
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                      Mobile Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mt-12 space-y-6 sm:mt-16">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-blue-700 dark:text-blue-300">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              三步完成简历诊断
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
              首页和工作台都按屏幕宽度自适应排版，桌面端看全局，移动端也能顺手完成操作。
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/72 dark:shadow-[0_18px_70px_rgba(2,6,23,0.44)]"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}
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
                      d={feature.path}
                    />
                  </svg>
                </span>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.title}
                className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {step.eyebrow}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-slate-950 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
