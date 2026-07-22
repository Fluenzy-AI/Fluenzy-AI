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
      "2 training sessions per module",
      "1 interview guide session",
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
      "300 training sessions per module",
      "30 interview guide sessions",
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
      "30 training sessions per module",
      "10 interview guide sessions",
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
          const plansArray = Object.entries(pricingData)
            .filter(([planName]) => planName in planFeatures) // Only include plans we have features for
            .map(([planName, data]: [string, any]) => ({
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
    <section id="pricing" className="py-24 relative overflow-hidden bg-background text-foreground">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 sm:px-6 sm:py-3 mb-5 sm:mb-6 backdrop-blur-sm">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
            <span className="font-semibold text-red-600 dark:text-red-400 text-sm sm:text-base">Flexible Pricing</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-tight">
            <span className="text-foreground">Start Training </span>
            <span className="bg-gradient-to-r from-red-600 to-rose-600 !bg-clip-text text-transparent">
              Free Today
            </span>
          </h2>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-card border border-border rounded-full p-1 shadow-sm">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <span className="ml-2 bg-emerald-600 text-xs px-2 py-0.5 rounded-full text-white font-bold">Save 20%</span>
              </button>
            </div>
          </div>

          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
            Start your journey with our free plan featuring AI-powered training. Upgrade anytime to access unlimited sessions and premium features.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8 max-w-6xl mx-auto">
          {loading ? (
            <div className="col-span-3 text-center py-12 text-muted-foreground">Loading plans...</div>
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
                  <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <div
                className={`h-full bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 border transition-all duration-500 relative flex flex-col justify-between ${
                  plan.popular
                    ? "border-red-500/50 shadow-xl shadow-red-500/10 ring-2 ring-red-500/20"
                    : "border-border hover:border-red-500/40 shadow-md hover:shadow-xl"
                }`}
              >
                <div>
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 ${plan.popular ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg" : "bg-red-500/10 text-red-600 dark:text-red-400"} transition-transform duration-300`}>
                      {plan.icon ? <plan.icon className="w-7 h-7" /> : <Star className="w-7 h-7" />}
                    </div>

                    <h3 className="text-2xl font-black mb-2 text-foreground">
                      {plan.name}
                    </h3>
                    <p className="text-sm font-medium text-muted-foreground mb-4">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <motion.span
                        key={animatedPrice[plan.name] || (billingCycle === 'annual' && plan.name !== 'Free' ? Math.round(plan.price * 12 * 0.8) : plan.price)}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3 }}
                        className="text-4xl sm:text-5xl font-black text-foreground tracking-tight"
                      >
                        {animatedPrice[plan.name] || (billingCycle === 'annual' && plan.name !== 'Free' ? Math.round(plan.price * 12 * 0.8) : plan.price)}
                      </motion.span>
                      <span className="text-sm font-semibold text-muted-foreground ml-1.5">
                        /{billingCycle === 'annual' ? 'year' : plan.period}
                      </span>
                      {billingCycle === 'annual' && plan.name !== 'Free' && (
                        <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          Save ₹{plan.price * 12 - Math.round(plan.price * 12 * 0.8)} annually
                        </div>
                      )}

                      {/* Price Breakdown for Paid Plans with Coupon */}
                      {plan.price > 0 && priceBreakdown[plan.name] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-3 bg-muted rounded-xl border border-border"
                        >
                          <div className="text-xs text-muted-foreground space-y-1 font-medium">
                            <div className="flex justify-between">
                              <span>Original Price:</span>
                              <span>₹{priceBreakdown[plan.name].originalPrice}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Discount ({priceBreakdown[plan.name].discountValue}{priceBreakdown[plan.name].discountType === 'percentage' ? '%' : '₹'}):</span>
                              <span>-₹{priceBreakdown[plan.name].discountAmount}</span>
                            </div>
                            <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
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
                              className="flex-1 px-3 py-2 text-xs bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:border-red-500 focus:outline-none font-medium"
                            />
                            <Button
                              onClick={applyCoupon}
                              disabled={applyingCoupon || !couponCode.trim() || selectedPlan !== plan.name}
                              className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl disabled:opacity-50"
                            >
                              {applyingCoupon ? 'Applying...' : 'Apply'}
                            </Button>
                          </div>
                          {couponError && selectedPlan === plan.name && (
                            <p className="text-red-500 text-xs font-semibold">{couponError}</p>
                          )}
                          {couponData && selectedPlan === plan.name && (
                            <p className="text-emerald-600 text-xs font-semibold">Coupon applied successfully!</p>
                          )}
                        </div>
                      )}

                      {/* Message for Free Plan */}
                      {plan.price === 0 && (
                        <div className="mt-3 text-xs font-medium text-muted-foreground">
                          Coupons are applicable only on paid plans.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3.5 mb-8">
                    {plan?.features?.map((feature: string, idx: number) => (
                      <div key={`feature-${plan.name}-${idx}`} className="flex items-start space-x-3 text-left">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mt-0.5">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm font-semibold text-foreground/90 leading-snug">{feature}</span>
                      </div>
                    ))}

                    {plan?.limitations?.map((limitation: string, idx: number) => (
                      <div
                        key={`limitation-${plan.name}-${idx}`}
                        className="flex items-start space-x-3 text-left opacity-75"
                      >
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center mt-0.5">
                          <div className="w-2.5 h-0.5 bg-muted-foreground rounded-full" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground leading-snug">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className={`w-full font-bold py-3.5 rounded-xl transition-all duration-300 shadow-md ${
                    plan.popular
                      ? "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-red-500/25 hover:scale-[1.02]"
                      : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 hover:scale-[1.02]"
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
