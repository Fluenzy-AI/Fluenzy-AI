"use client";
import React from "react";
import { motion } from "framer-motion";

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
    <section className="py-20 relative overflow-hidden bg-slate-950">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1/2 bg-purple-500/5 blur-[120px]" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h3 className="text-sm uppercase tracking-[0.3em] text-slate-400 font-bold mb-4">
            Trusted by FAANG & Top Tech Companies
          </h3>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Candidates from these companies use Fluenzy AI to master their communication and technical depth.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 items-center">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="flex flex-col items-center justify-center group"
            >
              <div className="relative h-20 w-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all duration-500 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Internal Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <img
                  src={company.logo}
                  alt={company.name}
                  className={`h-8 w-auto relative z-10 object-contain transition-all duration-500 ${
                    company.name === "Apple" || company.name === "Amazon" ? "invert brightness-200" : "brightness-125"
                  } group-hover:scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}
                />
              </div>
              <span className="mt-4 text-[9px] font-black tracking-[0.3em] text-slate-500 group-hover:text-purple-400 uppercase transition-colors">
                {company.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;