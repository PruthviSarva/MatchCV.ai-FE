"use client";

import { useState } from "react";
import axios from "axios";
import DefaultTemplate from "./components/templates/DefaultTemplate";
import type { ResumeData } from "./types/resume";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(source: JsonObject, key: string) {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value];
  }

  return [];
}

function toObjectArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function parseResumeResponse(content: string): ResumeData {
  const withoutCodeFence = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = withoutCodeFence.indexOf("{");
  const end = withoutCodeFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("OpenAI response did not contain a JSON object.");
  }

  const parsed = JSON.parse(withoutCodeFence.slice(start, end + 1));

  if (!isObject(parsed)) {
    throw new Error("OpenAI response JSON was not an object.");
  }

  return {
    name: getString(parsed, "name"),
    email: getString(parsed, "email"),
    phone: getString(parsed, "phone"),
    summary: getString(parsed, "summary"),
    skills: toStringArray(parsed.skills),
    experience: toObjectArray(parsed.experience).map((exp) => ({
      company: getString(exp, "company"),
      role: getString(exp, "role"),
      duration: getString(exp, "duration"),
      description: toStringArray(exp.description),
    })),
    projects: toObjectArray(parsed.projects).map((project) => ({
      title: getString(project, "title"),
      description: toStringArray(project.description),
    })),
    education: toObjectArray(parsed.education).map((edu) => ({
      institution: getString(edu, "institution"),
      degree: getString(edu, "degree"),
      duration: getString(edu, "duration"),
    })),
  };
}

export default function Home() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [rawResponse, setRawResponse] = useState("");
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const pdfToText = (await import("react-pdftotext")).default;
      const text = await pdfToText(file);
      setResumeText(text);
    } catch (error) {
      console.error("PDF Extraction Error:", error);
      setParseError("Could not read text from this PDF. Try another file.");
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setParseError("");
    setRawResponse("");
    setResumeData(null);

    const prompt = `
You are an expert ATS resume tailoring assistant.

TASK:
1. Analyze the provided resume.
2. Analyze the provided job description.
3. Tailor the resume according to the JD.
4. Optimize ATS keywords.
5. Keep information truthful.
6. Do not add fake experience.
7. Return ONLY valid JSON.
8. Every experience and project description must be an array of bullet strings.

JSON FORMAT:
{
  "name": "",
  "email": "",
  "phone": "",
  "summary": "",
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "duration": "",
      "description": []
    }
  ],
  "projects": [
    {
      "title": "",
      "description": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "duration": ""
    }
  ]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

    try {
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
          },
        }
      );

      const aiResponse = String(res.data.choices[0].message.content ?? "");
      setRawResponse(aiResponse);

      const parsed = parseResumeResponse(aiResponse);
      setResumeData(parsed);
    } catch (error) {
      console.error(error);
      setParseError(
        error instanceof Error
          ? error.message
          : "Unable to parse the OpenAI response."
      );
    }

    setLoading(false);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-950 md:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="no-print mb-8">
          <h1 className="mb-8 text-4xl font-bold">
            AI Resume Tailoring Agent
          </h1>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-semibold">
              Upload raw resume PDF
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="mb-6 block w-full text-sm"
            />

            <label className="mb-2 block text-sm font-semibold">
              Job description
            </label>
            <textarea
              className="mb-6 h-60 w-full rounded-lg border border-slate-300 p-4"
              placeholder="Paste Job Description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-black px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              {loading ? "Generating..." : "Tailor Resume"}
            </button>

            {parseError && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {parseError}
              </p>
            )}
          </div>
        </section>

        {rawResponse && (
          <details className="no-print mb-8 rounded-lg border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer font-semibold">
              Raw OpenAI JSON
            </summary>
            <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-4 text-sm text-slate-50">
              {rawResponse}
            </pre>
          </details>
        )}

        {resumeData && (
          <section className="space-y-6">
            <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-bold">
                Resume Preview
              </h2>

              <button
                onClick={handleDownloadPdf}
                className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white"
              >
                Download PDF
              </button>
            </div>

            <div className="resume-print-area">
              <DefaultTemplate data={resumeData} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
