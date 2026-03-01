"use client";
import { Check, Crown, Star, Zap } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface PlanData {
  name: string;
  price: number;
  currency: string;
  status: string;
  updatedAt: string;
}

const planFeatures = {
  Free: {
    description: "Start your interview preparation journey",
    features: [
      "3 interview sessions per month",
      "Basic AI feedback",
      "English conversation practice",
      "Community support",
    ],
    limitations: ["Limited sessions"],
    cta: "Start Free",
    popular: false,
    icon: Star,
    period: "forever",
  },
  Standard: {
    description: "Unlimited training for serious candidates",
    features: [
      "Unlimited interview sessions",
      "Advanced AI feedback & analytics",
      "All training modules unlocked",
      "Priority support",
      "Progress tracking dashboard",
      "Company-specific preparation",
      "Group discussion practice",
    ],
    cta: "Go Standard",
    popular: true,
    icon: Crown,
    period: "per month",
  },
  Pro: {
    description: "Premium training with detailed analytics",
    features: [
      "100 interview sessions per month",
      "Advanced AI feedback & analytics",
      "All training modules unlocked",
      "Priority support",
      "Progress tracking dashboard",
      "Company-specific preparation",
      "Group discussion practice",
    ],
    cta: "Go Pro",
    popular: false,
    icon: Zap,
    period: "per month",
  },
};

const Pricing = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [animatedPrice, setAnimatedPrice] = useState<{ [key: string]: number }>({});
  const [priceBreakdown, setPriceBreakdown] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/admin/plan-pricing');
        if (response.ok) {
          const pricingData = await response.json();

          // Convert to array and merge with features
          const plansArray = Object.entries(pricingData).map(([planName, data]: [string, any]) => ({
            name: planName,
            price: data.price,
            currency: data.currency,
            ...planFeatures[planName as keyof typeof planFeatures],
          }));

          setPlans(plansArray);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        // Fallback to default plans
        setPlans([
          { name: "Free", price: 0, currency: "INR", ...planFeatures.Free },
          { name: "Standard", price: 150, currency: "INR", ...planFeatures.Standard },
          { name: "Pro", price: 20, currency: "INR", ...planFeatures.Pro },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Initialize animated prices
  useEffect(() => {
    if (plans.length > 0) {
      const initialPrices: { [key: string]: number } = {};
      plans.forEach(plan => {
        initialPrices[plan.name] = billingCycle === 'annual' && plan.name !== 'Free'
          ? Math.round(plan.price * 12 * 0.8)
          : plan.price;
      });
      setAnimatedPrice(initialPrices);
    }
  }, [plans, billingCycle]);

  const handleButtonClick = (planName: string) => {
    if (pathname === "/pricing") {
      // On pricing page
      if (planName !== "Free") {
        router.push("/billing");
      } else {
        // Start Free - send unauthenticated users to login
        if (session?.user) {
          router.push("/train");
        } else {
          router.push("/login");
        }
      }
    } else {
      // On landing pages route users to login before training actions
      if (session?.user) {
        router.push("/train");
      } else {
        router.push("/login");
      }
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !selectedPlan) return;

    setApplyingCoupon(true);
    setCouponError('');
    setCouponData(null);

    try {
      const response = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          targetPlan: selectedPlan,
          billingCycle,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCouponData(data);
        // Update price breakdown for the selected plan
        setPriceBreakdown({
          ...priceBreakdown,
          [selectedPlan]: {
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
          [selectedPlan]: data.pricing.finalAmount
        });
      } else {
        setCouponError(data.error);
      }
    } catch (error) {
      setCouponError('Failed to apply coupon. Please try again.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const clearCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setCouponError('');
    setPriceBreakdown({});
    // Reset animated prices
    const resetPrices: { [key: string]: number } = {};
    plans.forEach(plan => {
      resetPrices[plan.name] = billingCycle === 'annual' && plan.name !== 'Free'
        ? Math.round(plan.price * 12 * 0.8)
        : plan.price;
    });
    setAnimatedPrice(resetPrices);
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-full px-4 py-2 sm:px-6 sm:py-3 mb-5 sm:mb-6 border border-purple-500/30 backdrop-blur-sm">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
            <span className="font-medium text-purple-200 text-sm sm:text-base">Flexible Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 sm:mb-6">
            <span className="text-white">Start Training </span>
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 !bg-clip-text text-transparent">
              Free Today
            </span>
          </h2>

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

          <p className="text-base sm:text-xl text-gray-300 max-w-3xl mx-auto">
            Start your journey with our free plan featuring AI-powered training. Upgrade anytime to access unlimited sessions and premium features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-12">Loading plans...</div>
          ) : (
            plans?.map((plan: any, index: number) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className={`relative group ${plan.popular ? "lg:-mt-8" : ""}`}
              >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-primary px-6 py-2 rounded-full text-sm font-bold text-background">
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`h-full glass rounded-2xl sm:rounded-3xl p-5 sm:p-8 border transition-all duration-500 relative overflow-hidden ${
                  plan.popular
                    ? "border-purple-500/60 shadow-2xl shadow-purple-500/30 glow-border"
                    : "border-card-border/50 hover:border-purple-500/60 shadow-2xl hover:shadow-purple-500/30"
                }`}
              >
                {/* Glow effect for popular plan */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-3xl" />
                )}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br ${plan.popular ? "from-purple-500 to-blue-500" : "from-slate-600 to-slate-500"} group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {plan.name}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <motion.span
                      key={animatedPrice[plan.name] || (billingCycle === 'annual' && plan.name !== 'Free' ? Math.round(plan.price * 12 * 0.8) : plan.price)}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.3 }}
                      className="text-4xl sm:text-5xl font-bold text-white group-hover:text-cyan-200 transition-colors duration-300"
                    >
                      {animatedPrice[plan.name] || (billingCycle === 'annual' && plan.name !== 'Free' ? Math.round(plan.price * 12 * 0.8) : plan.price)}
                    </motion.span>
                    <span className="text-gray-400 ml-2">
                      /{billingCycle === 'annual' ? 'year' : plan.period}
                    </span>
                    {billingCycle === 'annual' && plan.name !== 'Free' && (
                      <div className="text-sm text-green-400 mt-1">
                        Save ₹{plan.price * 12 - Math.round(plan.price * 12 * 0.8)} annually
                      </div>
                    )}

                    {/* Price Breakdown for Paid Plans with Coupon */}
                    {plan.price > 0 && priceBreakdown[plan.name] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-purple-500/30"
                      >
                        <div className="text-sm text-gray-300 space-y-1">
                          <div className="flex justify-between">
                            <span>Original Price:</span>
                            <span>₹{priceBreakdown[plan.name].originalPrice}</span>
                          </div>
                          <div className="flex justify-between text-green-400">
                            <span>Discount ({priceBreakdown[plan.name].discountValue}{priceBreakdown[plan.name].discountType === 'percentage' ? '%' : '₹'}):</span>
                            <span>-₹{priceBreakdown[plan.name].discountAmount}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-white border-t border-gray-600 pt-1">
                            <span>You Save:</span>
                            <span>₹{priceBreakdown[plan.name].discountAmount}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Coupon Input for Paid Plans */}
                    {plan.price > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            placeholder="Enter coupon code"
                            value={selectedPlan === plan.name ? couponCode : ''}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              setSelectedPlan(plan.name);
                            }}
                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          />
                          <Button
                            onClick={applyCoupon}
                            disabled={applyingCoupon || !couponCode.trim() || selectedPlan !== plan.name}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                          >
                            {applyingCoupon ? 'Applying...' : 'Apply'}
                          </Button>
                        </div>
                        {couponError && selectedPlan === plan.name && (
                          <p className="text-red-400 text-sm">{couponError}</p>
                        )}
                        {couponData && selectedPlan === plan.name && (
                          <p className="text-green-400 text-sm">Coupon applied successfully!</p>
                        )}
                      </div>
                    )}

                    {/* Message for Free Plan */}
                    {plan.price === 0 && (
                      <div className="mt-4 text-sm text-gray-400">
                        Coupons are applicable only on paid plans.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan?.features?.map((feature: string, idx: number) => (
                    <div key={`feature-${plan.name}-${idx}`} className={"flex items-center space-x-3"}>
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-purple-400" />
                      </div>
                      <span className="text-gray-200">{feature}</span>
                    </div>
                  ))}

                  {plan?.limitations?.map((limitation: string, idx: number) => (
                    <div
                      key={`limitation-${plan.name}-${idx}`}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-gray-400" />
                      </div>
                      <span className="text-gray-400">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  className={`w-full font-semibold py-4 rounded-xl transition-all duration-300 relative overflow-hidden ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/50 glow-effect"
                      : "glass border border-card-border/50 hover:border-purple-500/60 text-gray-200 hover:text-white backdrop-blur-sm"
                  }`}
                  onClick={() => handleButtonClick(plan.name)}
                >
                  {plan.cta}
                </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-gray-300">
            Start training free today. Upgrade when you're ready to unlock unlimited AI-powered interview preparation.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
