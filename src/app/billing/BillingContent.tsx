"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Crown, Star, Zap } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import MobileBillingPage from "@/components/MobileBillingPage";

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

export default function BillingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [plans, setPlans] = useState<Record<string, PlanData>>({});
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState<{ [key: string]: string }>({});
  const [appliedCoupon, setAppliedCoupon] = useState<{ [key: string]: any }>({});
  const [couponError, setCouponError] = useState<{ [key: string]: string }>({});
  const [couponLoading, setCouponLoading] = useState<{ [key: string]: boolean }>({});
  const [finalAmount, setFinalAmount] = useState<{ [key: string]: number | null }>({});
  const [couponApplied, setCouponApplied] = useState<{ [key: string]: boolean }>({});
  const [couponSuccessMessage, setCouponSuccessMessage] = useState<{ [key: string]: string }>({});
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [animatedPrice, setAnimatedPrice] = useState<{ [key: string]: number }>({});
  const [priceBreakdown, setPriceBreakdown] = useState<{ [key: string]: any }>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planResponse, pricingResponse] = await Promise.all([
          fetch("/api/user-plan"),
          fetch("/api/plan-pricing")
        ]);

        if (planResponse.ok) {
          const contentType = planResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const planData = await planResponse.json();
            setPlanInfo(planData);
          } else {
            console.error("Plan response is not JSON:", await planResponse.text());
          }
        } else {
          console.error("Plan response not ok:", planResponse.status, await planResponse.text());
        }

        if (pricingResponse.ok) {
          const contentType = pricingResponse.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const pricingData = await pricingResponse.json();
            setPlans(pricingData);
          } else {
            console.error("Pricing response is not JSON:", await pricingResponse.text());
          }
        } else {
          console.error("Pricing response not ok:", pricingResponse.status, await pricingResponse.text());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchData();
    }
  }, [session]);

  // Initialize animated prices
  useEffect(() => {
    if (Object.keys(plans).length > 0) {
      const initialPrices: { [key: string]: number } = {};
      Object.keys(plans).forEach(planName => {
        const plan = plans[planName];
        initialPrices[planName] = billingCycle === 'annual' && planName !== 'Free'
          ? Math.round(plan.price * 12 * 0.8)
          : plan.price;
      });
      setAnimatedPrice(initialPrices);
    }
  }, [plans, billingCycle]);

  const applyCoupon = async (targetPlan: string) => {
    const trimmedCode = couponCode[targetPlan]?.trim();
    if (!trimmedCode) {
      setCouponError({ ...couponError, [targetPlan]: "Please enter a coupon code" });
      return;
    }

    setCouponLoading({ ...couponLoading, [targetPlan]: true });
    setCouponError({ ...couponError, [targetPlan]: "" });

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponCode: trimmedCode, targetPlan, billingCycle }),
      });

      if (response.ok) {
        const data = await response.json();
        setAppliedCoupon({ ...appliedCoupon, [targetPlan]: data.coupon });
        setFinalAmount({ ...finalAmount, [targetPlan]: data.pricing.finalAmount });
        setCouponError({ ...couponError, [targetPlan]: "" });
        setCouponCode({ ...couponCode, [targetPlan]: "" }); // Clear input after successful application
        setCouponApplied({ ...couponApplied, [targetPlan]: true });
        setCouponSuccessMessage({ ...couponSuccessMessage, [targetPlan]: `Coupon "${data.coupon.code}" applied successfully!` });

        // Update price breakdown for the selected plan
        setPriceBreakdown({
          ...priceBreakdown,
          [targetPlan]: {
            originalPrice: data.pricing.originalAmount,
            discountAmount: data.pricing.discountAmount,
            finalAmount: data.pricing.finalAmount,
            discountType: data.coupon.discountType,
            discountValue: data.coupon.discountValue,
          }
        });

        // Animate price change
        setAnimatedPrice({
          ...animatedPrice,
          [targetPlan]: data.pricing.finalAmount
        });
      } else {
        const errorData = await response.json();
        setCouponError({ ...couponError, [targetPlan]: errorData.error || "Failed to apply coupon" });
        setAppliedCoupon({ ...appliedCoupon, [targetPlan]: null });
        setFinalAmount({ ...finalAmount, [targetPlan]: null });
        setCouponApplied({ ...couponApplied, [targetPlan]: false });
      }
    } catch (error) {
      console.error('Coupon apply error:', error);
      setCouponError({ ...couponError, [targetPlan]: "Failed to apply coupon. Please try again." });
      setAppliedCoupon({ ...appliedCoupon, [targetPlan]: null });
      setFinalAmount({ ...finalAmount, [targetPlan]: null });
    } finally {
      setCouponLoading({ ...couponLoading, [targetPlan]: false });
    }
  };

  const removeCoupon = (targetPlan: string) => {
    setAppliedCoupon({ ...appliedCoupon, [targetPlan]: null });
    setFinalAmount({ ...finalAmount, [targetPlan]: null });
    setCouponCode({ ...couponCode, [targetPlan]: "" });
    setCouponError({ ...couponError, [targetPlan]: "" });
    setCouponApplied({ ...couponApplied, [targetPlan]: false });
    setCouponSuccessMessage({ ...couponSuccessMessage, [targetPlan]: "" });
    setPriceBreakdown({ ...priceBreakdown, [targetPlan]: undefined });
    // Reset animated price for this plan
    const plan = plans[targetPlan];
    const resetPrice = billingCycle === 'annual' && targetPlan !== 'Free'
      ? Math.round(plan.price * 12 * 0.8)
      : plan.price;
    setAnimatedPrice({ ...animatedPrice, [targetPlan]: resetPrice });
  };

  const handleUpgrade = async (targetPlan: string) => {
    try {
      const planPrice = plans[targetPlan]?.price ?? 0;
      const basePrice = billingCycle === 'annual' && targetPlan !== 'Free'
        ? Math.round(planPrice * 12 * 0.8)
        : planPrice;
      const breakdown = priceBreakdown[targetPlan];
      const originalAmount = breakdown?.originalPrice ?? basePrice;
      const discountAmount = breakdown?.discountAmount ?? 0;
      const finalAmountValue = breakdown?.finalAmount ?? basePrice;
      const appliedCouponCode = appliedCoupon?.[targetPlan]?.code || undefined;

      const response = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan,
          couponCode: appliedCouponCode,
          originalAmount,
          discountAmount,
          finalAmount: finalAmountValue,
          billingCycle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Free upgrade success
          alert(data.message || `Successfully upgraded to ${targetPlan}!`);
          window.location.reload();
        } else if (data.orderId) {
          // Initialize Razorpay checkout
          const options = {
            key: data.key,
            amount: data.amount,
            currency: data.currency,
            order_id: data.orderId,
            name: "Fluenzy AI",
            description: `${targetPlan} Plan Upgrade`,
            handler: async function (response: any) {
              // Verify payment on backend
              const verifyRes = await fetch("/api/verify-razorpay-payment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: data.orderId,
                  plan: targetPlan,
                  couponCode: appliedCouponCode || null,
                  originalAmount,
                  discountAmount,
                  finalAmount: finalAmountValue,
                  billingCycle,
                }),
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json().catch(() => ({}));
                if (verifyData?.receiptUrl) {
                  window.open(verifyData.receiptUrl, "_blank");
                }
                alert(`Payment successful! You have been upgraded to ${targetPlan}.`);
                window.location.reload();
              } else {
                alert("Payment verification failed. Please contact support.");
              }
            },
            prefill: {
              email: "", // Will be filled from session
              contact: "",
            },
            theme: {
              color: "#7c3aed",
            },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
        } else {
          alert("Unexpected response");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create order:', errorData);
        alert(errorData.error || "Failed to create order");
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert("An error occurred. Please try again.");
    }
  };

  const getUpgradeOptions = () => {
    if (!planInfo) return [];

    const currentPlan = planInfo.plan;

    if (currentPlan === 'Standard') {
      return []; // No upgrades available
    }

    if (currentPlan === 'Free') {
      return ['Standard', 'Pro'];
    }

    if (currentPlan === 'Pro') {
      return ['Standard'];
    }

    return [];
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'Free': return Star;
      case 'Standard': return Crown;
      case 'Pro': return Zap;
      default: return Star;
    }
  };

  // Show skeleton cards while loading — NEVER a full-page blocking "Loading..." text
  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        {/* Current Plan Skeleton */}
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-green-500/20" />
            <div className="h-5 w-48 rounded bg-current opacity-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-current opacity-10" />
              <div className="h-7 w-16 rounded bg-current opacity-10" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-current opacity-10" />
              <div className="h-7 w-16 rounded bg-current opacity-10" />
            </div>
          </div>
        </div>
        {/* Upgrade Options Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-40 rounded bg-current opacity-10 animate-pulse" />
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20" />
                  <div className="space-y-2">
                    <div className="h-5 w-24 rounded bg-current opacity-10" />
                    <div className="h-3 w-40 rounded bg-current opacity-10" />
                    <div className="h-6 w-20 rounded bg-current opacity-10" />
                  </div>
                </div>
                <div className="h-9 w-32 rounded bg-purple-500/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session?.user || !planInfo) {
    return null;
  }

  const upgradeOptions = getUpgradeOptions();

  if (isMobile) {
    return (
      <MobileBillingPage
        planInfo={planInfo}
        plans={plans}
        upgradeOptions={upgradeOptions}
        billingCycle={billingCycle}
        setBillingCycle={setBillingCycle}
        animatedPrice={animatedPrice}
        priceBreakdown={priceBreakdown}
        couponCode={couponCode}
        setCouponCode={setCouponCode}
        couponLoading={couponLoading}
        couponApplied={couponApplied}
        couponError={couponError}
        couponSuccessMessage={couponSuccessMessage}
        appliedCoupon={appliedCoupon}
        applyCoupon={applyCoupon}
        removeCoupon={removeCoupon}
        handleUpgrade={handleUpgrade}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-full p-1 border border-slate-700/50">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              billingCycle === 'monthly'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              billingCycle === 'annual'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-300 hover:text-white'
            }`}
          >
            Annual
            <span className="ml-2 bg-green-500 text-xs px-2 py-1 rounded-full text-white">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="border-green-500/50 bg-green-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              {React.createElement(getPlanIcon(planInfo.plan), { size: 16, className: "text-green-400" })}
            </div>
            Current Plan - {planInfo.planName}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Price</p>
              <p className="text-2xl font-bold">
                {planInfo.price > 0 ? `₹${planInfo.price}` : 'Free'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Limit</p>
              <p className="text-2xl font-bold">
                {planInfo.isUnlimited ? 'Unlimited' : planInfo.monthlyLimit}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Current Usage</p>
            <p className="text-lg font-semibold">
              {planInfo.currentUsage} / {planInfo.isUnlimited ? 'Unlimited' : planInfo.monthlyLimit}
            </p>
          </div>

          {planInfo.renewalDate && (
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date</p>
              <p className="text-lg font-semibold">
                {new Date(planInfo.renewalDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {upgradeOptions.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Upgrades</h2>
          <div className="grid gap-4">
            {upgradeOptions.map((planName) => {
              const planData = plans[planName];
              const Icon = getPlanIcon(planName);
              const displayPrice = finalAmount !== null && appliedCoupon ? finalAmount : (planData?.price || 0);

              return (
                <Card key={planName} className="border-purple-500/30 bg-purple-500/5">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Icon size={24} className="text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">{planName}</h3>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">
                              {
                                planName === 'Standard' ? 'Unlimited' :
                                planName === 'Pro' ? '100' : '3'
                              } sessions per month
                            </p>

                            <p className="text-lg font-semibold text-foreground">
                              {priceBreakdown[planName] ? (
                                <>
                                  <span className="line-through text-muted-foreground">₹{priceBreakdown[planName].originalPrice}</span>
                                  <span className="ml-2 text-green-600">₹{priceBreakdown[planName].finalAmount}</span>
                                  <span className="text-gray-400 ml-2">
                                    /{billingCycle === 'annual' ? 'year' : 'month'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <motion.span
                                    key={animatedPrice[planName] || (billingCycle === 'annual' && planName !== 'Free' ? Math.round(planData.price * 12 * 0.8) : planData.price)}
                                    initial={{ scale: 1 }}
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.3 }}
                                    className="text-2xl font-bold text-white"
                                  >
                                    ₹{animatedPrice[planName] || (billingCycle === 'annual' && planName !== 'Free' ? Math.round(planData.price * 12 * 0.8) : planData.price)}
                                  </motion.span>
                                  <span className="text-gray-400 ml-2">
                                    /{billingCycle === 'annual' ? 'year' : 'month'}
                                  </span>
                                  {billingCycle === 'annual' && planName !== 'Free' && (
                                    <div className="text-sm text-green-400 mt-1">
                                      Save ₹{planData.price * 12 - Math.round(planData.price * 12 * 0.8)} annually
                                    </div>
                                  )}
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUpgrade(planName)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Upgrade to {planName}
                      </Button>
                    </div>

                    {/* Coupon Section */}
                    <div className="border-t border-purple-500/20 pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">Have a coupon?</span>
                        </div>

                        {appliedCoupon[planName] ? (
                          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-green-700">{appliedCoupon[planName].code}</span>
                              <span className="text-xs text-green-600">
                                ({appliedCoupon[planName].discountType === 'PERCENTAGE'
                                  ? `${appliedCoupon[planName].discountValue}% off`
                                  : `₹${appliedCoupon[planName].discountValue} off`})
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCoupon(planName)}
                              className="text-green-700 hover:text-green-800 hover:bg-green-500/20"
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={couponCode[planName] || ''}
                              onChange={(e) => setCouponCode({ ...couponCode, [planName]: e.target.value.toUpperCase() })}
                              placeholder="Enter coupon code"
                              disabled={couponLoading[planName]}
                              className="flex-1"
                            />
                            <Button
                              onClick={() => applyCoupon(planName)}
                              disabled={couponLoading[planName] || !couponCode[planName]?.trim() || couponApplied[planName]}
                              size="sm"
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              {couponLoading[planName] ? "Applying..." : "Apply"}
                            </Button>
                          </div>
                        )}

                        {couponSuccessMessage[planName] && (
                          <p className="text-sm text-green-600">{couponSuccessMessage[planName]}</p>
                        )}

                        {couponError[planName] && (
                          <p className="text-sm text-red-600">{couponError[planName]}</p>
                        )}

                        {/* Price Details Block */}
                        {appliedCoupon[planName] && priceBreakdown[planName] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50/50"
                          >
                            <h4 className="text-sm font-semibold text-foreground mb-3">Price Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span>Original Price:</span>
                                <span>₹{priceBreakdown[planName].originalPrice} / {billingCycle === 'annual' ? 'year' : 'month'}</span>
                              </div>
                              <div className="flex justify-between text-green-400">
                                <span>Discount ({priceBreakdown[planName].discountValue}{priceBreakdown[planName].discountType === 'PERCENTAGE' ? '%' : '₹'}):</span>
                                <span>-₹{priceBreakdown[planName].discountAmount}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-white border-t border-gray-600 pt-1">
                                <span>You Save:</span>
                                <span>₹{priceBreakdown[planName].discountAmount}</span>
                              </div>
                              <hr className="my-2" />
                              <div className="flex justify-between font-semibold">
                                <span>Final Payable:</span>
                                <span className="text-green-700">₹{priceBreakdown[planName].finalAmount} / {billingCycle === 'annual' ? 'year' : 'month'}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-6 text-center">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">You&apos;re on the Highest Plan!</h3>
            <p className="text-muted-foreground">
              You have access to unlimited training sessions. No further upgrades available.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
