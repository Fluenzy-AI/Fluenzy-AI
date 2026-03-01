"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, ExternalLink, CheckCircle2, XCircle, RefreshCw, Gift, Download, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PaymentRecord {
  id: string;
  paymentId: string | null;
  orderId: string | null;
  plan: string | null;
  billingCycle: string | null;
  paymentCurrency: string | null;
  originalAmount: number | null;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string | null;
  status: string;
  couponUsed: string | null;
  couponType: string | null;
  date: string;
  receipt: {
    receiptUrl: string | null;
    invoiceNumber: string;
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  paid: { label: "Paid", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
  free_via_coupon: { label: "Free (Coupon)", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Gift },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: RefreshCw },
};

export default function BillingHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPaymentHistory();
    }
  }, [session]);

  const sendInvoice = async (payment: PaymentRecord) => {
    try {
      setSendingInvoiceId(payment.id);
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: payment.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to send invoice. Please try again.");
        return;
      }
      toast.success(data.message || "Invoice sent to your registered email!");
    } catch {
      toast.error("Failed to send invoice. Please check your connection.");
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const downloadPdf = async (payment: PaymentRecord) => {
    try {
      setDownloadingId(payment.id);
      const res = await fetch(`/api/payment-history/${payment.id}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to generate PDF");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") || "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match ? match[1] : `FluenzyAI_Statement_${payment.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payment-history");
      if (!res.ok) throw new Error("Failed to fetch payment history");
      const data = await res.json();
      setPayments(data.payments || []);
    } catch (err) {
      setError("Could not load payment history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatAmount = (amount: number, currency: string | null) => {
    const symbol = (currency || "INR") === "INR" ? "₹" : "$";
    return `${symbol}${amount.toLocaleString("en-IN")}`;
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/billing">
              <ArrowLeft size={16} className="mr-1" />
              Back to Billing
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Receipt size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-sm text-muted-foreground">All your transactions and invoices</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="p-4 text-center text-red-400">{error}</CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && payments.length === 0 && (
          <Card className="border-slate-700/50">
            <CardContent className="p-12 text-center space-y-4">
              <Receipt size={48} className="text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-lg font-semibold text-muted-foreground">No transactions yet</h3>
              <p className="text-sm text-muted-foreground">
                Your payment history will appear here after you upgrade your plan.
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/billing">View Plans</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Records */}
        {payments.length > 0 && (
          <div className="space-y-3">
            {payments.map((payment, index) => {
              const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.paid;
              const StatusIcon = statusCfg.icon;
              const hasDiscount = payment.discountAmount > 0;
              const isDownloading = downloadingId === payment.id;
              const isSendingInvoice = sendingInvoiceId === payment.id;

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-700/50 hover:border-purple-500/30 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Left: Plan + Date */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <StatusIcon size={18} className="text-purple-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">
                                {payment.plan || "Plan"} Plan
                              </span>
                              {payment.billingCycle && (
                                <Badge variant="outline" className="text-xs capitalize">
                                  {payment.billingCycle}
                                </Badge>
                              )}
                              <Badge className={`text-xs border ${statusCfg.color}`}>
                                {statusCfg.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {formatDate(payment.date)}
                            </p>
                            {payment.orderId && (
                              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                                Order: {payment.orderId}
                              </p>
                            )}
                            {payment.couponUsed && (
                              <p className="text-xs text-green-400 mt-0.5">
                                Coupon applied: {payment.couponUsed}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right: Amount + Receipt */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            {hasDiscount && payment.originalAmount != null && (
                              <p className="text-sm line-through text-muted-foreground">
                                {formatAmount(payment.originalAmount, payment.paymentCurrency)}
                              </p>
                            )}
                            <p className={`text-xl font-bold ${
                              payment.status === "failed" ? "text-red-400" : ""
                            }`}>
                              {payment.status === "failed"
                                ? "Not charged"
                                : payment.finalAmount === 0
                                ? "Free"
                                : formatAmount(payment.finalAmount, payment.paymentCurrency)}
                            </p>
                            {hasDiscount && (
                              <p className="text-xs text-green-400">
                                Saved {formatAmount(payment.discountAmount, payment.paymentCurrency)}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap justify-end">
                            {/* Email invoice to registered address */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 border-purple-500/40 hover:border-purple-500/70 hover:bg-purple-500/10"
                              onClick={() => sendInvoice(payment)}
                              disabled={isSendingInvoice || isDownloading}
                              title="Email invoice to your registered email"
                            >
                              {isSendingInvoice ? (
                                <><Loader2 size={12} className="animate-spin" />Sending...</>
                              ) : (
                                <><Mail size={12} />Email</>  
                              )}
                            </Button>

                            {/* PDF download — available for every status */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1"
                              onClick={() => downloadPdf(payment)}
                              disabled={isDownloading || isSendingInvoice}
                            >
                              {isDownloading ? (
                                <><Loader2 size={12} className="animate-spin" />Generating...</>
                              ) : (
                                <><Download size={12} />PDF</>
                              )}
                            </Button>

                            {/* External receipt link if available */}
                            {payment.receipt?.receiptUrl && (
                              <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                                <a href={payment.receipt.receiptUrl} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink size={12} className="mr-1" />
                                  Receipt
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center pb-4">
          Showing {payments.length} transaction{payments.length !== 1 ? "s" : ""}. For billing support, contact us.
        </p>
      </div>
    </div>
  );
}
