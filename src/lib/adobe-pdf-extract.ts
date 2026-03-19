/**
 * Adobe PDF Services API Integration
 * Extracts text from PDF files using Adobe's cloud-based PDF Services
 */

// Note: Environment variables are loaded at runtime, not build time
// We access them via process.env directly in functions

interface AdobeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AdobeAssetResponse {
  assetID: string;
  uploadUri: string;
}

interface AdobeJobResponse {
  jobID?: string;
  status?: string;
  headers?: {
    location?: string;
    "x-request-id"?: string;
  };
}

/**
 * Get Adobe credentials from environment
 */
function getAdobeCredentials(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.ADOBE_PDF_SERVICES_CLIENT_ID;
  const clientSecret = process.env.ADOBE_PDF_SERVICES_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.warn("[Adobe PDF] Missing credentials - CLIENT_ID:", !!clientId, "CLIENT_SECRET:", !!clientSecret);
    return null;
  }
  
  return { clientId, clientSecret };
}

/**
 * Get Adobe PDF Services access token
 */
async function getAdobeAccessToken(): Promise<string> {
  const creds = getAdobeCredentials();
  if (!creds) {
    throw new Error("Adobe PDF Services credentials not configured");
  }

  console.log("[Adobe PDF] Getting access token...");
  
  const response = await fetch("https://pdf-services.adobe.io/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Adobe PDF] Token error:", error);
    throw new Error(`Failed to get Adobe access token: ${error}`);
  }

  const data: AdobeTokenResponse = await response.json();
  console.log("[Adobe PDF] Access token obtained successfully");
  return data.access_token;
}

/**
 * Upload PDF to Adobe and get asset ID
 */
async function uploadPdfToAdobe(
  accessToken: string,
  pdfBuffer: Buffer,
  fileName: string
): Promise<{ assetID: string; uploadUri: string }> {
  const creds = getAdobeCredentials();
  if (!creds) {
    throw new Error("Adobe PDF Services credentials not configured");
  }

  console.log("[Adobe PDF] Creating asset for upload...");
  
  // Step 1: Request upload URI
  const createAssetResponse = await fetch(
    "https://pdf-services.adobe.io/assets",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": creds.clientId,
      },
      body: JSON.stringify({
        mediaType: "application/pdf",
      }),
    }
  );

  if (!createAssetResponse.ok) {
    const error = await createAssetResponse.text();
    console.error("[Adobe PDF] Create asset error:", error);
    throw new Error(`Failed to create Adobe asset: ${error}`);
  }

  const assetData: AdobeAssetResponse = await createAssetResponse.json();
  console.log("[Adobe PDF] Asset created:", assetData.assetID);

  // Step 2: Upload the PDF file
  console.log("[Adobe PDF] Uploading PDF...");
  const uploadResponse = await fetch(assetData.uploadUri, {
    method: "PUT",
    headers: {
      "Content-Type": "application/pdf",
    },
    body: new Uint8Array(pdfBuffer),
  });

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();
    console.error("[Adobe PDF] Upload error:", error);
    throw new Error(`Failed to upload PDF to Adobe: ${error}`);
  }

  console.log("[Adobe PDF] PDF uploaded successfully");
  return assetData;
}

/**
 * Start PDF text extraction job
 */
async function startExtractJob(
  accessToken: string,
  assetID: string
): Promise<string> {
  const creds = getAdobeCredentials();
  if (!creds) {
    throw new Error("Adobe PDF Services credentials not configured");
  }

  console.log("[Adobe PDF] Starting extraction job...");
  
  const response = await fetch(
    "https://pdf-services.adobe.io/operation/extractpdf",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": creds.clientId,
      },
      body: JSON.stringify({
        assetID: assetID,
        elementsToExtract: ["text"],
      }),
    }
  );

  if (!response.ok && response.status !== 201) {
    const error = await response.text();
    console.error("[Adobe PDF] Start job error:", error);
    throw new Error(`Failed to start extract job: ${error}`);
  }

  // Get the job location from headers
  const location = response.headers.get("location");
  if (!location) {
    throw new Error("No job location returned from Adobe");
  }

  console.log("[Adobe PDF] Extraction job started:", location);
  return location;
}

/**
 * Poll for job completion and get result
 */
async function pollJobStatus(
  accessToken: string,
  jobLocation: string
): Promise<{ downloadUri: string }> {
  const creds = getAdobeCredentials();
  if (!creds) {
    throw new Error("Adobe PDF Services credentials not configured");
  }

  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  console.log("[Adobe PDF] Polling for job completion...");

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(jobLocation, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": creds.clientId,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to poll job status: ${error}`);
    }

    const data = await response.json();

    if (data.status === "done") {
      console.log("[Adobe PDF] Extraction job completed");
      return { downloadUri: data.resource?.downloadUri || data.content?.downloadUri };
    } else if (data.status === "failed") {
      console.error("[Adobe PDF] Job failed:", data.error);
      throw new Error(`Adobe extraction job failed: ${data.error?.message || "Unknown error"}`);
    }

    console.log(`[Adobe PDF] Job status: ${data.status} (attempt ${attempt + 1}/${maxAttempts})`);

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Adobe extraction job timed out");
}

/**
 * Download and extract text from the result ZIP
 */
async function downloadAndExtractText(downloadUri: string): Promise<string> {
  const response = await fetch(downloadUri);
  
  if (!response.ok) {
    throw new Error(`Failed to download extraction result: ${response.statusText}`);
  }

  const zipBuffer = Buffer.from(await response.arrayBuffer());

  // Adobe returns a ZIP file containing structuredData.json
  // We need to extract the text from it
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AdmZip = require("adm-zip");
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();

  let extractedText = "";

  for (const entry of entries) {
    if (entry.entryName === "structuredData.json") {
      const jsonContent = entry.getData().toString("utf8");
      const structured = JSON.parse(jsonContent);

      // Extract text from elements
      if (structured.elements && Array.isArray(structured.elements)) {
        for (const element of structured.elements) {
          if (element.Text) {
            extractedText += element.Text + "\n";
          }
        }
      }
      break;
    }
  }

  return extractedText.trim();
}

/**
 * Main function to extract text from PDF using Adobe PDF Services
 */
export async function extractTextWithAdobe(
  pdfBuffer: Buffer,
  fileName: string = "resume.pdf"
): Promise<{ text: string; success: boolean; error?: string }> {
  try {
    // Validate credentials
    const creds = getAdobeCredentials();
    if (!creds) {
      return {
        text: "",
        success: false,
        error: "Adobe PDF Services credentials not configured",
      };
    }

    console.log("[Adobe PDF] Starting extraction for:", fileName);

    // Step 1: Get access token
    const accessToken = await getAdobeAccessToken();

    // Step 2: Upload PDF
    const { assetID } = await uploadPdfToAdobe(accessToken, pdfBuffer, fileName);

    // Step 3: Start extraction job
    const jobLocation = await startExtractJob(accessToken, assetID);

    // Step 4: Poll for completion
    const { downloadUri } = await pollJobStatus(accessToken, jobLocation);

    // Step 5: Download and extract text
    const text = await downloadAndExtractText(downloadUri);

    console.log(`[Adobe PDF] Extraction complete: ${text.length} characters`);

    return {
      text,
      success: true,
    };
  } catch (error) {
    console.error("[Adobe PDF Extract Error]", error);
    return {
      text: "",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if Adobe PDF Services is configured
 */
export function isAdobeConfigured(): boolean {
  const creds = getAdobeCredentials();
  const configured = !!creds;
  console.log("[Adobe PDF] isAdobeConfigured:", configured);
  return configured;
}
