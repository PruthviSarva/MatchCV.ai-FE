import type { ResumeData } from "../../types/resume";

interface Props {
  data: ResumeData;
}

export default function DefaultTemplate({ data }: Props) {
  return (
    <article className="mx-auto max-w-4xl border border-slate-200 bg-white p-10 text-black shadow-lg">
      <h1 className="text-4xl font-bold">
        {data.name || "Your Name"}
      </h1>

      <div className="mt-2 text-sm text-gray-700">
        {data.email && <p>{data.email}</p>}
        {data.phone && <p>{data.phone}</p>}
      </div>

      {data.summary && (
        <section className="mt-8">
          <h2 className="border-b pb-2 text-2xl font-bold">
            Summary
          </h2>

          <p className="mt-3 text-gray-800">
            {data.summary}
          </p>
        </section>
      )}

      {data.skills.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b pb-2 text-2xl font-bold">
            Skills
          </h2>

          <div className="mt-3 flex flex-wrap gap-2">
            {data.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded bg-gray-200 px-3 py-1"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {data.experience.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b pb-2 text-2xl font-bold">
            Experience
          </h2>

          {data.experience.map((exp, index) => (
            <div key={index} className="mt-5">
              <h3 className="text-xl font-semibold">
                {exp.role}
              </h3>

              <p className="text-gray-700">
                {[exp.company, exp.duration].filter(Boolean).join(" - ")}
              </p>

              {exp.description.length > 0 && (
                <ul className="ml-6 mt-2 list-disc">
                  {exp.description.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.projects.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b pb-2 text-2xl font-bold">
            Projects
          </h2>

          {data.projects.map((project, index) => (
            <div key={index} className="mt-5">
              <h3 className="text-xl font-semibold">
                {project.title}
              </h3>

              {project.description.length > 0 && (
                <ul className="ml-6 mt-2 list-disc">
                  {project.description.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {data.education.length > 0 && (
        <section className="mt-8">
          <h2 className="border-b pb-2 text-2xl font-bold">
            Education
          </h2>

          {data.education.map((edu, index) => (
            <div key={index} className="mt-4">
              <h3 className="font-semibold">
                {edu.degree}
              </h3>

              <p>{edu.institution}</p>

              <p className="text-sm text-gray-600">
                {edu.duration}
              </p>
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
