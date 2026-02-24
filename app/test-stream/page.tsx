"use client";

import { useState } from "react";

export default function TestStreamPage() {
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const testStream = async () => {
    setIsLoading(true);
    setError("");
    setResponse("");

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resume: "测试简历内容",
          jobDescription: "测试职位描述",
        }),
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setResponse(fullText);
          console.log("Received chunk:", chunk);
        }
      }
    } catch (err) {
      console.error("Stream error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-2xl font-bold">测试流式 API</h1>

        <button
          onClick={testStream}
          disabled={isLoading}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? "测试中..." : "开始测试"}
        </button>

        {error && (
          <div className="mt-4 rounded border border-red-300 bg-red-50 p-4">
            <div className="font-bold text-red-700">错误:</div>
            <div className="text-red-600">{error}</div>
          </div>
        )}

        <div className="mt-6 rounded border border-gray-300 bg-white p-4">
          <div className="mb-2 font-bold">响应内容:</div>
          <pre className="whitespace-pre-wrap text-sm">{response || "等待响应..."}</pre>
        </div>
      </div>
    </div>
  );
}
