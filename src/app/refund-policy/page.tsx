"use client";

import { useRouter } from "next/navigation";
import { usePolicies } from "@/hooks/usePolicies";

export default function RefundPolicyPage() {
  const router = useRouter();
  const { policies, loading } = usePolicies();
  const page = policies.refundPolicy;

  return (
    <div className="px-4 py-10 md:px-10 md:py-14 text-[#171813] flex justify-center">
      <div className="w-full max-w-4xl bg-white border border-[#D8D5CD] shadow-sm p-6 md:p-10 space-y-8">
        <header className="space-y-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-[#595B53] hover:text-[#171813] hover:underline cursor-pointer"
          >
            <span aria-hidden="true">←</span>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">{page.title}</h1>
            <p className="mt-2 text-sm md:text-base text-[#595B53] max-w-2xl">{page.subtitle}</p>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#171813] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          page.sections.map((s, i) => (
            <section key={i} className="space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold">{s.heading}</h2>
              <div className="text-sm md:text-base text-[#595B53] leading-relaxed" dangerouslySetInnerHTML={{ __html: s.body }} />
            </section>
          ))
        )}


      </div>
    </div>
  );
}
