"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getCertificateTypeName } from "@/lib/certificate-utils";

interface CertificateData {
  certificateNumber: string;
  type: string;
  candidateName: string;
  position?: string;
  department?: string;
  organization: string;
  issuedDate: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  qrCodeDataUrl?: string;
}

interface VerificationResponse {
  valid: boolean;
  status?: string;
  certificate?: CertificateData;
  error?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateNumber = params.certificateNumber as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationResponse | null>(null);

  useEffect(() => {
    async function verify() {
      setLoading(true);
      try {
        const res = await fetch(`/api/verify/${certificateNumber}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setData({ valid: false, error: "Verification failed" });
      }
      setLoading(false);
    }
    if (certificateNumber) verify();
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-8 max-w-md w-full">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-400">Invalid Certificate</h1>
            <p className="text-slate-400">
              {data?.status === "REVOKED"
                ? "This certificate has been revoked"
                : data?.error || "Certificate not found or invalid"}
            </p>
            {data?.status === "REVOKED" && data.revocationReason && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 text-left">
                <p className="text-xs text-red-400 font-semibold mb-1">Revocation Reason:</p>
                <p className="text-sm text-slate-300">{data.revocationReason}</p>
              </div>
            )}
            <p className="text-xs text-slate-600">Certificate ID: {certificateNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  const cert = data.certificate!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Certificate Verified</h1>
          <p className="text-green-100">This is a valid certificate issued by {cert.organization}</p>
        </div>

        {/* Certificate Details */}
        <div className="p-8 space-y-6">
          <div className="text-center pb-6 border-b border-white/10">
            <p className="text-sm text-slate-500 mb-2">Certificate Number</p>
            <p className="text-xl font-mono font-bold text-white">{cert.certificateNumber}</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-slate-500 mb-1">Certificate Type</p>
              <p className="text-sm text-white font-semibold">{getCertificateTypeName(cert.type)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Issued Date</p>
              <p className="text-sm text-white">{new Date(cert.issuedDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Issued To</p>
              <p className="text-lg text-white font-bold">{cert.candidateName}</p>
            </div>
            
            {cert.position && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Position</p>
                <p className="text-sm text-white">{cert.position}</p>
              </div>
            )}
            
            {cert.department && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Department</p>
                <p className="text-sm text-white">{cert.department}</p>
              </div>
            )}
            
            {cert.startDate && cert.endDate && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Duration</p>
                <p className="text-sm text-white">
                  {new Date(cert.startDate).toLocaleDateString("en-IN")} to {new Date(cert.endDate).toLocaleDateString("en-IN")}
                  {cert.duration && ` (${cert.duration})`}
                </p>
              </div>
            )}
          </div>

          {/* QR Code */}
          {cert.qrCodeDataUrl && (
            <div className="text-center py-4">
              <img src={cert.qrCodeDataUrl} alt="QR Code" className="w-32 h-32 mx-auto border-2 border-white/10 rounded-lg" />
              <p className="text-xs text-slate-500 mt-2">Scan to verify</p>
            </div>
          )}

          {/* Status Badge */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 font-semibold">Status: VALID</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">This certificate is authentic and has not been revoked</p>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-xs text-slate-600">
              Issued by <strong className="text-slate-400">{cert.organization}</strong>
            </p>
            <p className="text-xs text-slate-700 mt-1">
              This verification was performed on {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}