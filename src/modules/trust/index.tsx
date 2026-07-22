"use client";
import React from "react";
import { motion } from "framer-motion";
import Card3D from "@/components/ui/Card3D";

const companies = [
  { name: "Google", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Amazon", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Meta", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" },
  { name: "Netflix", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
];

const TrustSection = () => {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-20 md:py-24">
      <div className="absolute left-1/2 top-1/2 h-2/3 w-full -translate-x-1/2 -translate-y-1/2 bg-purple-500/5 blur-[120px]" />

      <div className="container relative z-10 mx-auto px-4 md:px-8 xl:px-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="mb-10 text-center md:mb-12"
        >
          <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-400 sm:text-sm">
            Trusted by FAANG & Top Tech Companies
          </h3>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            Candidates from these companies use Fluenzy AI to master their communication and technical depth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mobile-logo-rail"
        >
          <div className="mobile-logo-track mobile-logo-track-ltr">
            {[...companies, ...companies].map((company, index) => (
              <div key={`${company.name}-${index}`} className="group relative mx-2 shrink-0">
                <Card3D depth={25} glowColor="rgba(168, 85, 247, 0.3)">
                  <div className="flex h-24 w-44 md:h-28 md:w-52 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 px-4 backdrop-blur-md transition-all duration-300 group-hover:border-purple-500/40 group-hover:bg-slate-900/90 shadow-xl">
                    <img
                      src={company.logo}
                      alt={company.name}
                      loading="lazy"
                      className={`h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-110 ${
                        company.name === "Apple" || company.name === "Amazon" ? "invert brightness-200" : "brightness-125"
                      }`}
                    />
                  </div>
                </Card3D>
                <span className="mt-3 block text-center text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
