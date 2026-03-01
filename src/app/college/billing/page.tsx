"use client";
import { useEffect, useRef, useState } from "react";
import CollegeProtectedLayout from "../components/CollegeProtectedLayout";
import { useCollegeAdmin } from "@/contexts/CollegeAdminContext";
import {
  CreditCard, Users, Calendar, CheckCircle, AlertTriangle,
  Tag, Upload, ChevronRight, Zap, Building2, Clock,
  Receipt, RefreshCw, XCircle, Info, Shield,
} from "lucide-react";

const PLAN_PRICE: Record<string, number> = { Free: 0, Standard: 150, Pro: 20, Enterprise: 0 };

type Step = 1 | 2 | 3;

interface BillingInfo {
  id: string; collegeName: string; email: string; allocatedPlan: string;
  totalSeats: number; usedSeats: number; remainingSeats: number;
  planExpiresAt: string | null; isExpired: boolean;
}
interface Transaction {
  id: string; razorpayOrderId: string; razorpayPaymentId?: string;
  plan: string; seats: number; pricePerSeat: number; subtotal: number;
  couponCode?: string; couponDiscount: number; gstAmount: number;
  finalAmount: number; status: string; invoiceId?: string;
  validFrom?: string; validTill?: string; createdAt: string;
}

declare global { interface Window { Razorpay: unknown; } } // eslint-disable-line @typescript-eslint/no-explicit-any

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true); s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function StatusBadge({ status }: { status: string }) {
  const m: Record<string, string> = {
    paid: "bg-green-500/15 text-green-400 border-green-500/20",
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    failed: "bg-red-500/15 text-red-400 border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${m[status] ?? m.pending}`}>
      {status === "paid" && <CheckCircle className="w-3 h-3" />}
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status === "failed" && <XCircle className="w-3 h-3" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
const fmt = (n: number) => `â‚¹${n.toLocaleString("en-IN")}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function CollegeBillingPage() {
  const { token } = useCollegeAdmin();

  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [tab, setTab] = useState<"checkout" | "history">("checkout");
  const [step, setStep] = useState<Step>(1);
  const [seats, setSeats] = useState(20);
  const [applyGst, setApplyGst] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [emailErrors, setEmailErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponResult, setCouponResult] = useState<{
    valid: boolean; discountType: string; discountValue: number; error?: string;
  } | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState("");
  const [successInfo, setSuccessInfo] = useState<{
    invoiceId: string; validTill: string; studentsActivated: number;
  } | null>(null);

  const fetchBilling = async () => {
    if (!token) return;
    setLoadingBilling(true);
    try {
      const res = await fetch("/api/college/billing", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBillingInfo(data.college);
        setTransactions(data.transactions ?? []);
      }
    } finally { setLoadingBilling(false); }
  };

  useEffect(() => { fetchBilling(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const pricePerSeat = PLAN_PRICE[billingInfo?.allocatedPlan ?? "Standard"] ?? 150;
  const subtotal = pricePerSeat * seats;
  const couponDiscount = couponResult?.valid
    ? couponResult.discountType === "PERCENTAGE"
      ? Math.round((subtotal * couponResult.discountValue) / 100)
      : Math.min(couponResult.discountValue, subtotal)
    : 0;
  const discounted = subtotal - couponDiscount;
  const gstAmount = applyGst ? Math.round(discounted * 0.18) : 0;
  const finalAmount = discounted + gstAmount;

  const parseEmails = (raw: string, domain?: string) => {
    const lines = raw.split(/[\n,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
    const unique = [...new Set(lines)];
    const dups = lines.filter((e, i) => lines.indexOf(e) !== i);
    const valid: string[] = [], invalid: string[] = [];
    unique.forEach((e) => {
      if (domain && !e.endsWith(`@${domain}`)) invalid.push(e);
      else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) valid.push(e);
      else invalid.push(e);
    });
    setParsedEmails(valid); setEmailErrors(invalid); setDuplicates([...new Set(dups)]);
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const c = ev.target?.result as string; setEmailInput(c); parseEmails(c, billingInfo?.email.split("@")[1]); };
    reader.readAsText(file);
  };

  useEffect(() => { if (emailInput) parseEmails(emailInput, billingInfo?.email.split("@")[1]); }, [emailInput, billingInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponResult(null);
    try {
      const res = await fetch("/api/college/billing/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, plan: billingInfo?.allocatedPlan ?? "Standard", seats }),
      });
      const data = await res.json();
      if (res.ok) setCouponResult({ valid: true, ...data.coupon });
      else setCouponResult({ valid: false, discountType: "", discountValue: 0, error: data.error });
    } catch { setCouponResult({ valid: false, discountType: "", discountValue: 0, error: "Network error" }); }
    finally { setCouponLoading(false); }
  };

  const handlePay = async () => {
    setPayError(""); setPayLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) { setPayError("Failed to load payment gateway."); setPayLoading(false); return; }
    try {
      const res = await fetch("/api/college/billing/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: billingInfo?.allocatedPlan, seats, studentEmails: parsedEmails, couponCode: couponResult?.valid ? couponCode : undefined, applyGst }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error ?? "Failed to create order."); setPayLoading(false); return; }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay({
        key: data.keyId ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(data.amount * 100),
        currency: data.currency,
        name: "Fluenzy AI College Portal",
        description: `${billingInfo?.allocatedPlan ?? "Standard"} Plan — ${seats} seats (1 month)`,
        order_id: data.orderId,
        prefill: data.prefill,
        theme: { color: "#6366f1" },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          const vRes = await fetch("/api/college/billing/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ ...response, transactionId: data.transactionId }),
          });
          const vData = await vRes.json();
          if (vRes.ok && vData.success) {
            setSuccessInfo({ invoiceId: vData.invoiceId, validTill: vData.validTill, studentsActivated: vData.studentsActivated });
            fetchBilling(); setStep(1); setEmailInput(""); setParsedEmails([]); setCouponCode(""); setCouponResult(null);
          } else setPayError(vData.error ?? "Payment verification failed.");
          setPayLoading(false);
        },
        modal: { ondismiss: () => setPayLoading(false) },
      });
      rzp.on("payment.failed", (r: { error: { description: string } }) => { setPayError(r.error?.description ?? "Payment failed."); setPayLoading(false); });
      rzp.open();
    } catch { setPayError("Something went wrong. Please try again."); setPayLoading(false); }
  };

  const canProceedStep2 = seats >= 1;
  const canProceedStep3 = parsedEmails.length > 0 && parsedEmails.length <= seats && emailErrors.length === 0;
  const canPay = canProceedStep3 && finalAmount >= 0;

  return (
    <CollegeProtectedLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2"><CreditCard className="w-6 h-6 text-indigo-400" /> Billing & Plans</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your institution&apos;s subscription and seats</p>
          </div>
          <button onClick={fetchBilling} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {successInfo && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-300 font-semibold">Payment successful! ðŸŽ‰</p>
              <p className="text-slate-400 text-sm mt-1">
                Invoice <span className="text-white font-medium">{successInfo.invoiceId}</span> Â· {successInfo.studentsActivated} student(s) activated Â· Valid till <span className="text-white font-medium">{fmtDate(successInfo.validTill)}</span>
              </p>
            </div>
            <button onClick={() => setSuccessInfo(null)} className="ml-auto text-slate-500 hover:text-slate-300"><XCircle className="w-4 h-4" /></button>
          </div>
        )}

        {!loadingBilling && billingInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Zap className="w-4 h-4 text-indigo-400" />, label: "Current Plan", value: billingInfo.allocatedPlan, sub: "" },
              { icon: <Users className="w-4 h-4 text-purple-400" />, label: "Total Seats", value: String(billingInfo.totalSeats), sub: `${billingInfo.usedSeats} used Â· ${billingInfo.remainingSeats} remaining` },
              { icon: <Calendar className="w-4 h-4 text-cyan-400" />, label: "Valid Till", value: billingInfo.planExpiresAt ? fmtDate(billingInfo.planExpiresAt) : "â€”", sub: billingInfo.isExpired ? "Expired" : "Active" },
              { icon: <Building2 className="w-4 h-4 text-emerald-400" />, label: "Institution", value: billingInfo.collegeName, sub: billingInfo.email },
            ].map((c) => (
              <div key={c.label} className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">{c.icon}<span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{c.label}</span></div>
                <p className="text-white font-semibold truncate">{c.value}</p>
                {c.sub && <p className={`text-xs mt-0.5 truncate ${c.sub === "Expired" ? "text-red-400" : "text-slate-500"}`}>{c.sub}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-slate-800">
          {(["checkout", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-1 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${tab === t ? "text-indigo-400 border-indigo-500" : "text-slate-500 border-transparent hover:text-slate-300"}`}>
              {t === "checkout" ? "ðŸ›’ New Purchase" : "ðŸ“‹ Billing History"}
            </button>
          ))}
        </div>

        {tab === "checkout" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            <div className="space-y-5">

              {/* Step indicator */}
              <div className="flex items-center gap-3">
                {[["1","Select Seats"],["2","Upload Students"],["3","Review & Pay"]].map(([num,lbl],i) => {
                  const s = (i+1) as Step; const done = step > s; const active = step === s;
                  return (
                    <div key={num} className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${done?"bg-green-500 text-white":active?"bg-indigo-500 text-white":"bg-slate-800 text-slate-500 border border-slate-700"}`}>
                        {done ? <CheckCircle className="w-4 h-4" /> : num}
                      </div>
                      <span className={`text-xs font-medium hidden sm:block ${active?"text-indigo-300":done?"text-green-400":"text-slate-600"}`}>{lbl}</span>
                      {i < 2 && <div className={`w-8 h-px flex-shrink-0 ${done?"bg-green-500/50":"bg-slate-700"}`} />}
                    </div>
                  );
                })}
              </div>

              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-bold text-white">Select Number of Seats</h2>

                  {billingInfo && (
                    <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl px-4 py-3">
                      <Zap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-indigo-300">{billingInfo.allocatedPlan} Plan</p>
                        <p className="text-xs text-slate-400">{fmt(pricePerSeat)}/student/month · Contact your institution admin to change plan</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" /> Number of Students (Seats)</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setSeats(Math.max(1,seats-1))} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm">âˆ’</button>
                        <input type="number" min={1} max={10000} value={seats} onChange={(e) => setSeats(Math.max(1,Math.min(10000,Number(e.target.value))))}
                          className="w-20 text-center bg-slate-800 border border-slate-700 rounded-lg py-1 text-white text-sm focus:outline-none focus:border-indigo-500" />
                        <button onClick={() => setSeats(Math.min(10000,seats+1))} className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-sm">+</button>
                      </div>
                    </div>
                    <input type="range" min={1} max={500} value={Math.min(seats,500)} onChange={(e) => setSeats(Number(e.target.value))}
                      className="w-full h-1.5 appearance-none rounded-full bg-slate-700 accent-indigo-500" />
                    <div className="flex justify-between text-xs text-slate-600 mt-1"><span>1</span><span>500</span></div>
                  </div>

                  <div className="flex items-center justify-between bg-[#0d1427]/70 border border-slate-700/40 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2"><Info className="w-4 h-4 text-slate-400" /><span className="text-sm text-slate-300">Apply GST (18%)</span><span className="text-xs text-slate-500">for registered businesses</span></div>
                    <button onClick={() => setApplyGst(!applyGst)} className={`relative w-10 h-5 rounded-full transition-colors ${applyGst?"bg-indigo-500":"bg-slate-700"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${applyGst?"translate-x-5":"translate-x-0.5"}`} />
                    </button>
                  </div>

                  <button onClick={() => setStep(2)} disabled={!canProceedStep2}
                    className="flex items-center gap-2 ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all">
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-300 text-sm">â† Back</button>
                    <h2 className="text-lg font-bold text-white">Upload Student Emails</h2>
                  </div>
                  <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Upload CSV File</label>
                      <button onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 text-sm transition-all w-full justify-center">
                        <Upload className="w-4 h-4" /> Click to upload CSV (one email per row or comma-separated)
                      </button>
                      <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCSV} />
                    </div>
                    <div className="flex items-center gap-2"><div className="flex-1 h-px bg-slate-700/60" /><span className="text-xs text-slate-500">or enter manually</span><div className="flex-1 h-px bg-slate-700/60" /></div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Paste Emails <span className="text-slate-500 font-normal">(comma / newline separated)</span></label>
                      <textarea value={emailInput} onChange={(e) => setEmailInput(e.target.value)} rows={6}
                        placeholder={`student1@university.ac.in\nstudent2@university.ac.in`}
                        className="w-full bg-[#0f172a]/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-mono" />
                    </div>
                    {(parsedEmails.length>0||emailErrors.length>0||duplicates.length>0) && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="flex items-center gap-1 bg-green-500/10 text-green-400 border border-green-500/20 px-3 py-1 rounded-full"><CheckCircle className="w-3 h-3" />{parsedEmails.length} valid</span>
                        {emailErrors.length>0 && <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full"><XCircle className="w-3 h-3" />{emailErrors.length} invalid</span>}
                        {duplicates.length>0 && <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-3 py-1 rounded-full"><AlertTriangle className="w-3 h-3" />{duplicates.length} duplicates removed</span>}
                        {parsedEmails.length>seats && <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full"><AlertTriangle className="w-3 h-3" />Exceeds {seats} seats</span>}
                      </div>
                    )}
                    {emailErrors.length>0 && (
                      <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3">
                        <p className="text-xs font-semibold text-red-400 mb-1.5">Invalid / wrong domain emails:</p>
                        <div className="space-y-0.5 max-h-24 overflow-y-auto">
                          {emailErrors.slice(0,10).map((e) => <p key={e} className="text-xs text-red-400/70 font-mono">{e}</p>)}
                          {emailErrors.length>10 && <p className="text-xs text-red-400/50">+{emailErrors.length-10} more</p>}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setStep(3)} disabled={!canProceedStep3}
                    className="flex items-center gap-2 ml-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all">
                    Review & Pay <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setStep(2)} className="text-slate-500 hover:text-slate-300 text-sm">â† Back</button>
                    <h2 className="text-lg font-bold text-white">Review & Pay</h2>
                  </div>
                  <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-5 space-y-3">
                    <p className="text-sm font-semibold text-slate-300 mb-2">Order Summary</p>
                    {[["Plan",`${billingInfo?.allocatedPlan ?? "—"} Plan`],["Price per student",`${fmt(pricePerSeat)} / month`],["Students (seats)",String(seats)],["Validity","1 month"]].map(([k,v]) => (
                      <div key={k} className="flex justify-between text-sm"><span className="text-slate-500">{k}</span><span className="text-slate-200">{v}</span></div>
                    ))}
                    <div className="border-t border-slate-700/50 pt-3 flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-white font-semibold">{fmt(subtotal)}</span></div>
                    {couponDiscount>0 && <div className="flex justify-between text-sm text-green-400"><span className="flex items-center gap-1"><Tag className="w-3 h-3" />Coupon ({couponCode})</span><span>âˆ’{fmt(couponDiscount)}</span></div>}
                    {gstAmount>0 && <div className="flex justify-between text-sm text-slate-400"><span>GST (18%)</span><span>+{fmt(gstAmount)}</span></div>}
                    <div className="border-t border-slate-700/50 pt-3 flex justify-between"><span className="text-white font-bold">Total Amount</span><span className="text-indigo-300 font-extrabold text-xl">{fmt(finalAmount)}</span></div>
                  </div>
                  <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-5">
                    <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400" />{parsedEmails.length} Students to Activate</p>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {parsedEmails.slice(0,20).map((e) => <span key={e} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{e}</span>)}
                      {parsedEmails.length>20 && <span className="text-xs bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">+{parsedEmails.length-20} more</span>}
                    </div>
                  </div>
                  {payError && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 flex-shrink-0" />{payError}</div>}
                  <button onClick={handlePay} disabled={!canPay||payLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base shadow-xl shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-700 transition-all">
                    {payLoading ? <><RefreshCw className="w-5 h-5 animate-spin" />Processingâ€¦</> : <><CreditCard className="w-5 h-5" />Pay {fmt(finalAmount)} via Razorpay</>}
                  </button>
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-600"><Shield className="w-3 h-3" />Secured by Razorpay Â· Card data never stored</div>
                </div>
              )}
            </div>

            {/* Sidebar: live calculator + coupon */}
            <div className="space-y-4">
              <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl p-5 sticky top-6">
                <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-indigo-400" />Pricing Breakdown</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Plan</span><span className="text-slate-200 font-medium">{billingInfo?.allocatedPlan ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Price / student</span><span className="text-slate-200">{fmt(pricePerSeat)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Seats</span><span className="text-slate-200">{seats}</span></div>
                  <div className="flex justify-between border-t border-slate-700/50 pt-2"><span className="text-slate-500">Subtotal</span><span className="text-white font-semibold">{fmt(subtotal)}</span></div>
                  {couponDiscount>0 && <div className="flex justify-between text-green-400"><span>Coupon discount</span><span>âˆ’{fmt(couponDiscount)}</span></div>}
                  {gstAmount>0 && <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span>+{fmt(gstAmount)}</span></div>}
                  <div className="flex justify-between border-t border-slate-700/50 pt-2">
                    <span className="text-white font-bold">Total</span><span className="text-indigo-300 font-extrabold text-lg">{fmt(finalAmount)}</span>
                  </div>
                  <p className="text-xs text-slate-600 pt-1">Per month Â· cancel anytime</p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <label className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" />Have a coupon?</label>
                  <div className="flex gap-2">
                    <input type="text" value={couponCode} onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                      placeholder="COLLEGE20" className="flex-1 bg-[#0f172a]/80 border border-slate-700/60 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500" />
                    <button onClick={validateCoupon} disabled={!couponCode.trim()||couponLoading}
                      className="px-3 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs font-semibold disabled:opacity-40 transition-colors">
                      {couponLoading ? "â€¦" : "Apply"}
                    </button>
                  </div>
                  {couponResult && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${couponResult.valid?"text-green-400":"text-red-400"}`}>
                      {couponResult.valid
                        ? <><CheckCircle className="w-3 h-3" />{couponResult.discountType==="PERCENTAGE"?`${couponResult.discountValue}% off`:`â‚¹${couponResult.discountValue} off`} applied!</>
                        : <><XCircle className="w-3 h-3" />{couponResult.error}</>}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-emerald-300">Secure Payments</p>
                  <p className="text-xs text-slate-500 mt-0.5">Powered by Razorpay. TLS encrypted. No card data stored.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-indigo-400" />Transaction History</h2>
            {loadingBilling ? <p className="text-slate-500 text-sm">Loadingâ€¦</p>
              : transactions.length === 0 ? (
                <div className="text-center py-16 text-slate-500"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No transactions yet</p></div>
              ) : (
                <div className="bg-[#0d1427]/70 border border-slate-700/40 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          {["Invoice / Order","Plan","Seats","Amount","Coupon","Status","Valid Till","Date"].map((h) => (
                            <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-3">
                              <p className="text-slate-300 font-mono text-xs">{tx.invoiceId ?? tx.razorpayOrderId.slice(-12)}</p>
                              {tx.razorpayPaymentId && <p className="text-xs text-slate-600 font-mono mt-0.5">{tx.razorpayPaymentId}</p>}
                            </td>
                            <td className="px-4 py-3"><span className="text-slate-300 font-medium">{tx.plan}</span><p className="text-xs text-slate-600">{fmt(tx.pricePerSeat)}/student</p></td>
                            <td className="px-4 py-3 text-slate-300">{tx.seats}</td>
                            <td className="px-4 py-3"><p className="text-white font-semibold">{fmt(tx.finalAmount)}</p>{tx.couponDiscount>0&&<p className="text-xs text-green-400">âˆ’{fmt(tx.couponDiscount)} coupon</p>}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{tx.couponCode ?? "â€”"}</td>
                            <td className="px-4 py-3"><StatusBadge status={tx.status} /></td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{tx.validTill ? fmtDate(tx.validTill) : "â€”"}</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{fmtDate(tx.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </CollegeProtectedLayout>
  );
}
