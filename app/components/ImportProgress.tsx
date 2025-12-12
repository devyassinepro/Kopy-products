/**
 * Component: Import Progress Display
 * Shows real-time progress for bulk/collection imports
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";

interface ImportProgressProps {
  jobId: string;
  onComplete?: () => void;
  onNewImport?: () => void;
}

export function ImportProgress({
  jobId,
  onComplete,
  onNewImport,
}: ImportProgressProps) {
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<any | null>(null);
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
        setJobData(data.job);
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

  // Fetch status on mount and when jobId changes
  useEffect(() => {
    fetchJobStatus();
  }, [jobId]);

  // Auto-refresh every 2 seconds if job is not completed
  useEffect(() => {
    if (!jobData) return;

    if (jobData.jobStatus === "pending" || jobData.jobStatus === "processing") {
      const interval = setInterval(() => {
        fetchJobStatus();
      }, 2000);

      return () => clearInterval(interval);
    } else {
      // Job completed, trigger callback
      if (onComplete) {
        onComplete();
      }
    }
  }, [jobData]);

  // Calculate progress
  const progressPercentage = jobData
    ? Math.round((jobData.processedProducts / jobData.totalProducts) * 100)
    : 0;

  // Status labels
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    processing: "In Progress",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p>Loading progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  if (!jobData) {
    return null;
  }

  return (
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
            <strong>Source shop:</strong> {jobData.sourceShop}
          </span>
          <span>
            <strong>Status:</strong>{" "}
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                background:
                  jobData.jobStatus === "completed"
                    ? "#d4edda"
                    : jobData.jobStatus === "failed"
                      ? "#f8d7da"
                      : jobData.jobStatus === "processing"
                        ? "#d1ecf1"
                        : "#f0f0f0",
                color:
                  jobData.jobStatus === "completed"
                    ? "#155724"
                    : jobData.jobStatus === "failed"
                      ? "#721c24"
                      : jobData.jobStatus === "processing"
                        ? "#0c5460"
                        : "#333",
              }}
            >
              {statusLabels[jobData.jobStatus] || jobData.jobStatus}
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
            Progress: {jobData.processedProducts} / {jobData.totalProducts}{" "}
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
                jobData.jobStatus === "completed"
                  ? "#28a745"
                  : jobData.jobStatus === "failed"
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

      {jobData.recentProducts && jobData.recentProducts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Recent Products ({jobData.recentProducts.length})</h3>
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: "#f9f9f9",
                  borderBottom: "2px solid #ddd",
                }}
              >
                <tr>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Product
                  </th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Status
                  </th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Price
                  </th>
                  <th style={{ padding: "10px", textAlign: "left" }}>
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobData.recentProducts
                  .slice()
                  .reverse()
                  .map((product: any, index: number) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #eee",
                        background:
                          product.status === "success"
                            ? "#f0fdf4"
                            : product.status === "failed"
                              ? "#fef2f2"
                              : "#fef9e7",
                      }}
                    >
                      <td style={{ padding: "10px" }}>
                        <div>
                          <strong>{product.title || product.handle}</strong>
                        </div>
                        {product.error && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#dc2626",
                              marginTop: "4px",
                            }}
                          >
                            {product.error}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "10px" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            background:
                              product.status === "success"
                                ? "#22c55e"
                                : product.status === "failed"
                                  ? "#ef4444"
                                  : "#f59e0b",
                            color: "white",
                          }}
                        >
                          {product.status === "success"
                            ? "✓ Success"
                            : product.status === "failed"
                              ? "✗ Failed"
                              : "⏳ Processing"}
                        </span>
                      </td>
                      <td style={{ padding: "10px" }}>
                        {product.sourcePrice && product.destinationPrice ? (
                          <div>
                            <div style={{ fontSize: "12px", color: "#666" }}>
                              ${product.sourcePrice.toFixed(2)}
                            </div>
                            <div style={{ fontSize: "14px", fontWeight: "bold" }}>
                              → ${product.destinationPrice.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: "#999" }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: "10px", fontSize: "12px", color: "#666" }}>
                        {product.completedAt
                          ? new Date(product.completedAt).toLocaleTimeString()
                          : product.startedAt
                            ? new Date(product.startedAt).toLocaleTimeString()
                            : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {jobData.recentProducts.length === 50 && (
            <div
              style={{
                padding: "10px",
                background: "#f0f9ff",
                borderRadius: "4px",
                marginTop: "10px",
                fontSize: "14px",
              }}
            >
              <strong>Note:</strong> Only the 50 most recent products are
              displayed.
            </div>
          )}
        </div>
      )}

      {(jobData.jobStatus === "processing" ||
        jobData.jobStatus === "pending") && (
        <div
          style={{
            padding: "15px",
            background: "#d1ecf1",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0 }}>
            <strong>Note:</strong> The import is running in the background. You
            can safely leave this page, the import will continue. This page
            refreshes automatically.
          </p>
        </div>
      )}

      {jobData.jobStatus === "completed" && (
        <div
          style={{
            padding: "15px",
            background: "#d4edda",
            borderRadius: "4px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, color: "#155724" }}>
            <strong>Import completed!</strong> {jobData.successfulImports}{" "}
            product(s) imported successfully.
          </p>
        </div>
      )}

      {jobData.jobStatus === "failed" && (
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

      {jobData.errors && jobData.errors.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Errors encountered ({jobData.errors.length})</h3>
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
            {jobData.errors.map((err: any, index: number) => (
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
          <div>Created on: {new Date(jobData.createdAt).toLocaleString()}</div>
          {jobData.startedAt && (
            <div>
              Started on: {new Date(jobData.startedAt).toLocaleString()}
            </div>
          )}
          {jobData.completedAt && (
            <div>
              Completed on: {new Date(jobData.completedAt).toLocaleString()}
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
        {jobData.jobStatus === "completed" && onNewImport && (
          <s-button onClick={onNewImport}>New import</s-button>
        )}
        <s-button onClick={() => navigate("/app/history")}>
          View history
        </s-button>
        {(jobData.jobStatus === "processing" ||
          jobData.jobStatus === "pending") && (
          <s-button onClick={fetchJobStatus}>Refresh now</s-button>
        )}
      </div>
    </>
  );
}
