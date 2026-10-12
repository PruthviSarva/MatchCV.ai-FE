import type { ResumeData } from "@/lib/resume";
import { cn } from "@/lib/utils";

/**
 * On-screen preview of the tailored resume.
 *
 * <p>Mirrors the section order and content of the generated DOCX and PDF, so
 * what the user approves here is what the employer receives. It is not the
 * download itself -- the file is rendered server-side, where the layout can be
 * kept strictly ATS-safe without fighting the browser's print engine.
 *
 * <p>Drawn on the paper tokens, which stay white in both themes. A resume
 * preview that goes dark with the rest of the interface would be a lie about
 * what comes out of the printer, and the page it is embedded in is dark enough
 * that the sheet reads as a document sitting on a desk.
 */
export default function ResumeDocument({
  data,
  className,
}: {
  data: ResumeData;
  className?: string;
}) {
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean);

  return (
    <article
      className={cn(
        "mx-auto max-w-[52rem] rounded-xl border border-paper-line/40 bg-paper p-8 " +
          "text-paper-ink shadow-floating sm:p-12",
        className,
      )}
    >
      <header className="text-center">
        <h1 className="text-[1.75rem] font-bold tracking-[-0.01em]">
          {data.name || "Your Name"}
        </h1>
        {contact.length > 0 && (
          <p className="mt-2 text-[0.8125rem] text-paper-ink-muted">
            {contact.join("  |  ")}
          </p>
        )}
      </header>

      {data.summary && (
        <Section title="Professional Summary">
          <p className="leading-relaxed">{data.summary}</p>
        </Section>
      )}

      {data.skills.length > 0 && (
        <Section title="Skills">
          {/*
            A single comma-separated line, matching the exported file exactly.
            Pills would look better here and would misrepresent what gets
            downloaded — and the whole point of this preview is that it does
            not.
          */}
          <p className="leading-relaxed">{data.skills.join(", ")}</p>
        </Section>
      )}

      {data.experience.length > 0 && (
        <Section title="Experience">
          {data.experience.map((role, index) => (
            <div key={index} className="mt-5 first:mt-0">
              <h3 className="font-semibold">
                {[role.role, role.company].filter(Boolean).join(", ")}
              </h3>
              {(role.location || role.duration) && (
                <p className="text-[0.8125rem] italic text-paper-ink-muted">
                  {[role.location, role.duration].filter(Boolean).join("  |  ")}
                </p>
              )}
              <Bullets items={role.description} />
            </div>
          ))}
        </Section>
      )}

      {data.projects.length > 0 && (
        <Section title="Projects">
          {data.projects.map((project, index) => (
            <div key={index} className="mt-5 first:mt-0">
              <h3 className="font-semibold">{project.title}</h3>
              {project.tech && (
                <p className="text-[0.8125rem] italic text-paper-ink-muted">
                  {project.tech}
                </p>
              )}
              <Bullets items={project.description} />
            </div>
          ))}
        </Section>
      )}

      {data.education.length > 0 && (
        <Section title="Education">
          {data.education.map((study, index) => (
            <div key={index} className="mt-4 first:mt-0">
              <h3 className="font-semibold">
                {[study.degree, study.institution].filter(Boolean).join(", ")}
              </h3>
              {study.duration && (
                <p className="text-[0.8125rem] italic text-paper-ink-muted">
                  {study.duration}
                </p>
              )}
            </div>
          ))}
        </Section>
      )}

      {data.certifications.length > 0 && (
        <Section title="Certifications">
          <Bullets items={data.certifications} />
        </Section>
      )}
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-paper-line pb-1.5 text-[0.8125rem] font-bold uppercase tracking-[0.08em]">
        {title}
      </h2>
      <div className="mt-3.5 text-[0.9375rem]">{children}</div>
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null;
  }
  return (
    <ul className="mt-2 ml-5 list-disc space-y-1.5 leading-relaxed marker:text-paper-ink-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
