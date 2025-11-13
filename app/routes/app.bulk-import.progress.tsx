/**
 * Page: Bulk import job progress tracking
 */

import { useState, useEffect } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useSearchParams, useNavigate } from "react-router";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return Response.json({});
};

export default function BulkImportProgress() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch job status
  const fetchJobStatus = async () => {
    if (!jobId) return;

    try {
      const formData = new FormData();
      formData.append("jobId", jobId);

      const response = await fetch("/api/bulk/job-status", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setJob(data.job);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error("Error fetching job status:", err);
      setError("Error retrieving status");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch status on load
  useEffect(() => {
    fetchJobStatus();
  }, [jobId]);

  // Auto-refresh every 2 seconds if job is not completed
  useEffect(() => {
    if (!job) return;

    if (job.jobStatus === "pending" || job.jobStatus === "processing") {
      const interval = setInterval(() => {
        fetchJobStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [job]);

  // If no jobId
  if (!jobId) {
    return (
      <s-page title="Error">
        <s-section>
          <s-card>
            <p>No job ID provided.</p>
            <s-button onClick={() => navigate("/app/bulk-import")}>
              Back to bulk import
            </s-button>
          </s-card>
        </s-section>
      </s-page>
    );
  }

  // Calculate progress
  const progressPercentage = job
    ? Math.round((job.processedProducts / job.totalProducts) * 100)
    : 0;

  // Status labels
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    processing: "In Progress",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };

  return (
    <s-page title="Bulk Import Tracking">
      <s-section>
        <s-card>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ color: "red" }}>Error: {error}</p>
              <s-button onClick={() => navigate("/app/bulk-import")}>
                Back to bulk import
              </s-button>
            </div>
          ) : job ? (
            <>
              <h2 style={{ marginTop: 0 }}>Import Status</h2>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span>
                    <strong>Source shop:</strong> {job.sourceShop}
                  </span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        background:
                          job.jobStatus === "completed"
                            ? "#d4edda"
                            : job.jobStatus === "failed"
                              ? "#f8d7da"
                              : job.jobStatus === "processing"
                                ? "#d1ecf1"
                                : "#f0f0f0",
                        color:
                          job.jobStatus === "completed"
                            ? "#155724"
                            : job.jobStatus === "failed"
                              ? "#721c24"
                              : job.jobStatus === "processing"
                                ? "#0c5460"
                                : "#333",
                      }}
                    >
                      {statusLabels[job.jobStatus] || job.jobStatus}
                    </span>
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: "30px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span>
                    Progress: {job.processedProducts} / {job.totalProducts}{" "}
                    products
                  </span>
                  <span>{progressPercentage}%</span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "30px",
                    background: "#f0f0f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercentage}%`,
                      height: "100%",
                      background:
                        job.jobStatus === "completed"
                          ? "#28a745"
                          : job.jobStatus === "failed"
                            ? "#dc3545"
                            : "#007bff",
                      transition: "width 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {progressPercentage > 10 && `${progressPercentage}%`}
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "15px",
                  marginBottom: "30px",
                }}
              >
                <div
                  style={{
                    padding: "15px",
                    background: "#f8f9fa",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {job.totalProducts}
                  </div>
                  <div style={{ color: "#666" }}>Total</div>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#d4edda",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#155724",
                    }}
                  >
                    {job.successfulImports}
                  </div>
                  <div style={{ color: "#155724" }}>Successful</div>
                </div>

                <div
                  style={{
                    padding: "15px",
                    background: "#f8d7da",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#721c24",
                    }}
                  >
                    {job.failedImports}
                  </div>
                  <div style={{ color: "#721c24" }}>Failed</div>
                </div>
              </div>

              {(job.jobStatus === "processing" ||
                job.jobStatus === "pending") && (
                <div
                  style={{
                    padding: "15px",
                    background: "#d1ecf1",
                    borderRadius: "4px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <strong>Note:</strong> The import is running in the
                    background. You can safely leave this page, the import will
                    continue. This page refreshes automatically.
                  </p>
                </div>
              )}

              {job.jobStatus === "completed" && (
                <div
                  style={{
                    padding: "15px",
                    background: "#d4edda",
                    borderRadius: "4px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: 0, color: "#155724" }}>
                    <strong>Import completed!</strong> {job.successfulImports}{" "}
                    product(s) imported successfully.
                  </p>
                </div>
              )}

              {job.jobStatus === "failed" && (
                <div
                  style={{
                    padding: "15px",
                    background: "#f8d7da",
                    borderRadius: "4px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: 0, color: "#721c24" }}>
                    <strong>Error:</strong> The import failed.
                  </p>
                </div>
              )}

              {job.errors && job.errors.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3>Errors encountered ({job.errors.length})</h3>
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      padding: "10px",
                      background: "#f8f9fa",
                    }}
                  >
                    {job.errors.map((err: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: "8px",
                          marginBottom: "8px",
                          background: "white",
                          borderRadius: "4px",
                          borderLeft: "3px solid #dc3545",
                        }}
                      >
                        {err.productId && (
                          <div>
                            <strong>Product:</strong> {err.productId}
                          </div>
                        )}
                        <div style={{ color: "#666" }}>{err.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: "20px" }}>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  <div>Created on: {new Date(job.createdAt).toLocaleString()}</div>
                  {job.startedAt && (
                    <div>
                      Started on: {new Date(job.startedAt).toLocaleString()}
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      Completed on: {new Date(job.completedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "20px",
                }}
              >
                <s-button onClick={() => navigate("/app/bulk-import")}>
                  New import
                </s-button>
                <s-button onClick={() => navigate("/app/history")}>
                  View history
                </s-button>
                {(job.jobStatus === "processing" ||
                  job.jobStatus === "pending") && (
                  <s-button onClick={fetchJobStatus}>
                    Refresh now
                  </s-button>
                )}
              </div>
            </>
          ) : null}
        </s-card>
      </s-section>
    </s-page>
  );
}
