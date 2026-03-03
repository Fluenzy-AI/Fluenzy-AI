"use client";

import { Crown, Star, Zap, CheckCircle, ArrowRight, History } from "lucide-react";
import Link from "next/link";
import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface PlanInfo {
  plan: string;
  planName: string;
  price: number;
  currency: string;
  monthlyLimit: number | null;
  isUnlimited: boolean;
  currentUsage: number;
  remainingUses: string | number;
  renewalDate: Date | null;
  subscription: any;
}

interface PlanData {
  name: string;
  price: number;
  currency: string;
  monthlyLimit: number | null;
  isUnlimited: boolean;
}

interface MobileBillingPageProps {
  planInfo: PlanInfo;
  plans: Record<string, PlanData>;
  upgradeOptions: string[];
  billingCycle: "monthly" | "annual";
  setBillingCycle: (v: "monthly" | "annual") => void;
  animatedPrice: Record<string, number>;
  priceBreakdown: Record<string, any>;
  couponCode: Record<string, string>;
  setCouponCode: (v: Record<string, string>) => void;
  couponLoading: Record<string, boolean>;
  couponApplied: Record<string, boolean>;
  couponError: Record<string, string>;
  couponSuccessMessage: Record<string, string>;
  appliedCoupon: Record<string, any>;
  applyCoupon: (plan: string) => void;
  removeCoupon: (plan: string) => void;
  handleUpgrade: (plan: string) => void;
}

function getPlanIcon(planName: string) {
  switch (planName) {
    case "Free": return Star;
    case "Standard": return Crown;
    case "Pro": return Zap;
    default: return Star;
  }
}

function getPlanSessions(planName: string) {
  switch (planName) {
    case "Standard": return "Unlimited";
    case "Pro": return "100";
    default: return "3";
  }
}

function getPlanFeatures(planName: string): string[] {
  switch (planName) {
    case "Standard":
      return ["Unlimited sessions/month", "Advanced analytics", "Priority support", "All interview types"];
    case "Pro":
      return ["100 sessions/month", "Full analytics", "Email support", "All interview types"];
    default:
      return ["3 sessions/month", "Basic analytics"];
  }
}

export default function MobileBillingPage({
  planInfo,
  plans,
  upgradeOptions,
  billingCycle,
  setBillingCycle,
  animatedPrice,
  priceBreakdown,
  couponCode,
  setCouponCode,
  couponLoading,
  couponApplied,
  couponError,
  couponSuccessMessage,
  appliedCoupon,
  applyCoupon,
  removeCoupon,
  handleUpgrade,
}: MobileBillingPageProps) {
  const PlanIcon = getPlanIcon(planInfo.plan);
  const usagePercent = planInfo.isUnlimited
    ? 0
    : planInfo.monthlyLimit
    ? Math.min(100, Math.round((planInfo.currentUsage / planInfo.monthlyLimit) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-10">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-4 pt-6 pb-4 border-b border-white/5">
        <h1 className="text-2xl font-black text-white">Subscription</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your plan & billing</p>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* Current Plan Card */}
        <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center">
                <PlanIcon size={18} className="text-green-400" />
              </div>
              <div>
                <p className="text-xs text-green-400 font-medium">CURRENT PLAN</p>
                <p className="text-lg font-bold text-white">{planInfo.planName}</p>
              </div>
            </div>
            <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold px-2.5 py-1 rounded-full">
              Active
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Monthly Price</p>
              <p className="text-xl font-bold text-white">
                {planInfo.price > 0 ? `₹${planInfo.price}` : "Free"}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-1">Sessions Limit</p>
              <p className="text-xl font-bold text-white">
                {planInfo.isUnlimited ? "∞" : planInfo.monthlyLimit}
              </p>
            </div>
          </div>

          {/* Usage bar */}
          {!planInfo.isUnlimited && planInfo.monthlyLimit && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Usage this month</span>
                <span>{planInfo.currentUsage} / {planInfo.monthlyLimit}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePercent}%`,
                    background: usagePercent > 80 ? "#f87171" : "#34d399",
                  }}
                />
              </div>
            </div>
          )}

          {planInfo.renewalDate && (
            <p className="text-xs text-slate-400 mt-3">
              Next billing:{" "}
              <span className="text-slate-300 font-medium">
                {new Date(planInfo.renewalDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </p>
          )}
        </div>

        {/* Billing Toggle */}
        {upgradeOptions.length > 0 && (
          <div className="flex justify-center">
            <div className="bg-slate-800/60 rounded-full p-1 border border-slate-700/50 flex">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                  billingCycle === "annual"
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-slate-400"
                }`}
              >
                Annual
                <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                  -20%
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Plans */}
        {upgradeOptions.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white">Available Upgrades</h2>
            {upgradeOptions.map((planName) => {
              const planData = plans[planName];
              if (!planData) return null;
              const Icon = getPlanIcon(planName);
              const basePrice =
                billingCycle === "annual" && planName !== "Free"
                  ? Math.round(planData.price * 12 * 0.8)
                  : planData.price;
              const displayPrice = animatedPrice[planName] ?? basePrice;

              return (
                <div
                  key={planName}
                  className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-violet-500/5 overflow-hidden"
                >
                  {/* Plan Header */}
                  <div className="p-4 border-b border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Icon size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-lg">{planName}</p>
                          <p className="text-xs text-slate-400">
                            {getPlanSessions(planName)} sessions/month
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {priceBreakdown[planName] ? (
                          <>
                            <p className="text-xs text-slate-400 line-through">
                              ₹{priceBreakdown[planName].originalPrice}
                            </p>
                            <p className="text-xl font-black text-green-400">
                              ₹{priceBreakdown[planName].finalAmount}
                            </p>
                          </>
                        ) : (
                          <>
                            <motion.p
                              key={displayPrice}
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 0.3 }}
                              className="text-xl font-black text-white"
                            >
                              ₹{displayPrice}
                            </motion.p>
                            {billingCycle === "annual" && planName !== "Free" && (
                              <p className="text-xs text-green-400">
                                Save ₹{planData.price * 12 - Math.round(planData.price * 12 * 0.8)}
                              </p>
                            )}
                          </>
                        )}
                        <p className="text-xs text-slate-500">
                          /{billingCycle === "annual" ? "year" : "month"}
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="mt-3 space-y-1.5">
                      {getPlanFeatures(planName).map((f) => (
                        <div key={f} className="flex items-center gap-2">
                          <CheckCircle size={13} className="text-purple-400 flex-shrink-0" />
                          <span className="text-xs text-slate-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon + Upgrade */}
                  <div className="p-4 space-y-3">
                    {/* Coupon section */}
                    <p className="text-xs font-semibold text-slate-300">Have a coupon?</p>

                    {appliedCoupon[planName] ? (
                      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-green-400">{appliedCoupon[planName].code}</p>
                          <p className="text-xs text-green-500">
                            {appliedCoupon[planName].discountType === "PERCENTAGE"
                              ? `${appliedCoupon[planName].discountValue}% off`
                              : `₹${appliedCoupon[planName].discountValue} off`}
                          </p>
                        </div>
                        <button
                          onClick={() => removeCoupon(planName)}
                          className="text-xs text-red-400 border border-red-400/30 rounded-lg px-2.5 py-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={couponCode[planName] || ""}
                          onChange={(e) =>
                            setCouponCode({ ...couponCode, [planName]: e.target.value.toUpperCase() })
                          }
                          placeholder="Enter coupon code"
                          disabled={couponLoading[planName]}
                          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-slate-500 text-sm h-9"
                        />
                        <button
                          onClick={() => applyCoupon(planName)}
                          disabled={couponLoading[planName] || !couponCode[planName]?.trim() || couponApplied[planName]}
                          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold px-3 rounded-lg transition-colors"
                        >
                          {couponLoading[planName] ? "..." : "Apply"}
                        </button>
                      </div>
                    )}

                    {couponSuccessMessage[planName] && (
                      <p className="text-xs text-green-500">{couponSuccessMessage[planName]}</p>
                    )}
                    {couponError[planName] && (
                      <p className="text-xs text-red-400">{couponError[planName]}</p>
                    )}

                    {/* Price breakdown */}
                    {appliedCoupon[planName] && priceBreakdown[planName] && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between text-slate-400">
                          <span>Original</span>
                          <span>₹{priceBreakdown[planName].originalPrice}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>
                            Discount ({priceBreakdown[planName].discountValue}
                            {priceBreakdown[planName].discountType === "PERCENTAGE" ? "%" : "₹"})
                          </span>
                          <span>-₹{priceBreakdown[planName].discountAmount}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold border-t border-white/10 pt-1.5">
                          <span>Final Payable</span>
                          <span className="text-green-400">
                            ₹{priceBreakdown[planName].finalAmount} /
                            {billingCycle === "annual" ? "yr" : "mo"}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Upgrade button */}
                    <button
                      onClick={() => handleUpgrade(planName)}
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      Upgrade to {planName}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Highest plan card */
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-3">
              <Crown size={28} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">You&apos;re on the Highest Plan!</h3>
            <p className="text-sm text-slate-400">
              Unlimited training sessions. No further upgrades available.
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/billing/history"
            className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History size={16} className="text-slate-400" />
              View Payment History
            </div>
            <ArrowRight size={15} className="text-slate-500" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </div>
    </div>
  );
}
