import Image from "next/image";

export default function Home() {
  return (
    <div className="mx-auto flex w-full flex-1 items-center justify-center px-8 py-24">
      <div className="flex flex-col items-center text-center">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/kyros-logo-21-roman-silver.png"
            alt=""
            aria-hidden
            width={104}
            height={69}
            style={{ height: "auto" }}
            priority
          />

          <h1 className="font-serif text-[3.7rem] font-light leading-none tracking-[0.34em] text-marble">
            KYROS
          </h1>
        </div>

        {/* Meaning */}
        <p className="mt-3 font-serif text-[1.4rem] font-light italic tracking-[0.05em] text-platinum-dim">
          The opportune moment for action
        </p>

        {/* Formula */}
        <div className="mt-9 border-y border-stone-line px-16 py-7">
          <div
            aria-label="P equals I cubed"
            className="flex items-center justify-center gap-5"
          >
            <span className="font-serif text-[3.6rem] font-light leading-none tracking-[0.06em] text-bronze">
              P
            </span>

            <span className="font-serif text-[2.5rem] font-light leading-none text-platinum-dim opacity-40">
              =
            </span>

            <span className="relative inline-block font-serif text-[3.6rem] font-light leading-none tracking-[0.06em] text-marble">
              I
              <sup className="absolute -right-4 -top-4 font-serif text-[1.45rem] font-light leading-none text-marble">
                3
              </sup>
            </span>
          </div>
        </div>

        {/* Laws */}
        <div className="mt-8 flex items-center justify-center gap-8 font-sans text-[0.86rem] uppercase tracking-[0.3em] text-platinum">
          <span>Inversion</span>
          <span className="text-bronze-dim">·</span>
          <span>Incentives</span>
          <span className="text-bronze-dim">·</span>
          <span>Inflection</span>
        </div>

      </div>
    </div>
  );
}