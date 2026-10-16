import Link from "next/link";

const services = [
  {
    title: "BESPOKE EXPERIENCE",
    description: "Explore our bespoke designs crafted just for you.",
    linkLabel: "EXPLORE DESIGNS →",
    href: "/shop",
  },
  {
    title: "CUSTOM DESIGN SERVICES",
    description: "Bring your vision to life with personalised designs.",
    linkLabel: "EXPLORE CUSTOM DESIGNS →",
    href: "/shop",
  },
  {
    title: "ONLINE CONSULTATION",
    description: "Let's create something beautiful together.",
    linkLabel: "BOOK A CONSULTATION →",
    href: "/faq",
  },
  {
    title: "MASTER TAILORING SERVICE",
    description: "Expert tailoring with attention to fit, finish and the finer details.",
    linkLabel: "VIEW SERVICES →",
    href: "/faq",
  },
  {
    title: "SAREE PLEATING SERVICE",
    description: "Choose from two saree pleating options for a graceful and flawless drape.",
    linkLabel: "VIEW OPTIONS →",
    href: "/faq",
  },
  {
    title: "FULL BODY MEASUREMENT SERVICE",
    description: "Personalised measurements for a comfortable, flattering fit.",
    linkLabel: "",
    href: "",
  },
  {
    title: "SAREE ACCESSORISING SERVICE",
    description: "Thoughtfully curated accessories to complete your look.",
    linkLabel: "EXPLORE ACCESSORIES →",
    href: "/shop",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-w-0 bg-[#F5EBDD] text-[#171813]">
      <section className="px-5 sm:px-[3%] pt-14 sm:pt-20 pb-10 sm:pb-14">
        <div className="max-w-3xl mx-auto text-center">
          <span className="mh-eyebrow">TAILORING BY LISHA ENTERPRISE</span>
          <h1
            className="mt-3 text-[34px] sm:text-[52px] leading-[1.05] text-[#171813] break-words"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            TAILORING &amp; PERSONALISED SERVICES
          </h1>
          <p className="mt-4 text-sm sm:text-base text-[#595B53] leading-relaxed max-w-xl mx-auto">
            Thoughtfully curated services to bring you a perfect fit, with attention to every detail.
          </p>
        </div>
      </section>

      <section className="px-5 sm:px-[3%] pb-14 sm:pb-20">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {services.map((service) => (
            <div
              key={service.title}
              className="min-w-0 border border-[#D8D5CD] bg-[#F5EBDD] rounded-none p-6 sm:p-8 flex flex-col"
            >
              <h2
                className="text-[15px] sm:text-base tracking-[0.14em] uppercase text-[#171813] leading-snug"
                style={{ fontFamily: "var(--font-cormorant)", fontWeight: 600 }}
              >
                {service.title}
              </h2>
              <p className="mt-3 text-sm text-[#595B53] leading-relaxed flex-1">
                {service.description}
              </p>
              {service.href ? (
                <Link
                  href={service.href}
                  className="mt-6 inline-flex items-center gap-3 self-start text-[12px] tracking-[0.14em] uppercase text-[#171813] border-b border-[#171813] pb-1 hover:opacity-70 transition-opacity"
                >
                  {service.linkLabel}
                </Link>
              ) : (
                <span className="mt-6" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 sm:px-[3%] pb-16 sm:pb-24">
        <div className="max-w-[1200px] mx-auto bg-[#061B2A] text-[#F5EBDD] rounded-none px-6 sm:px-12 py-14 sm:py-20 text-center">
          <h2
            className="text-[30px] sm:text-[46px] leading-[1.05] text-[#F5EBDD] break-words"
            style={{ fontFamily: "var(--font-cormorant)" }}
          >
            READY TO GET STARTED?
          </h2>
          <Link
            href="/faq"
            className="mt-7 inline-flex items-center justify-center border border-white/80 text-white rounded-none px-8 py-4 text-[12px] tracking-[0.16em] uppercase hover:bg-white hover:text-[#061B2A] transition-colors"
          >
            CONTACT US →
          </Link>
        </div>
      </section>
    </div>
  );
}
