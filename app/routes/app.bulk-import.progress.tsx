/**
 * Page : Suivi de progression d'un job de bulk import
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

  // Fonction pour récupérer le statut du job
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
      setError("Erreur lors de la récupération du statut");
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer le statut au chargement
  useEffect(() => {
    fetchJobStatus();
  }, [jobId]);

  // Auto-refresh toutes les 2 secondes si le job n'est pas terminé
  useEffect(() => {
    if (!job) return;

    if (job.jobStatus === "pending" || job.jobStatus === "processing") {
      const interval = setInterval(() => {
        fetchJobStatus();
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [job]);

  // Si pas de jobId
  if (!jobId) {
    return (
      <s-page title="Erreur">
        <s-section>
          <s-card>
            <p>Aucun job ID fourni.</p>
            <s-button onClick={() => navigate("/app/bulk-import")}>
              Retour à l'import en masse
            </s-button>
          </s-card>
        </s-section>
      </s-page>
    );
  }

  // Calcul de la progression
  const progressPercentage = job
    ? Math.round((job.processedProducts / job.totalProducts) * 100)
    : 0;

  // Statut en français
  const statusLabels: Record<string, string> = {
    pending: "En attente",
    processing: "En cours",
    completed: "Terminé",
    failed: "Échoué",
    cancelled: "Annulé",
  };

  return (
    <s-page title="Suivi de l'import en masse">
      <s-section>
        <s-card>
          {isLoading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Chargement...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p style={{ color: "red" }}>Erreur : {error}</p>
              <s-button onClick={() => navigate("/app/bulk-import")}>
                Retour à l'import en masse
              </s-button>
            </div>
          ) : job ? (
            <>
              <h2 style={{ marginTop: 0 }}>Statut de l'import</h2>

              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                  }}
                >
                  <span>
                    <strong>Boutique source :</strong> {job.sourceShop}
                  </span>
                  <span>
                    <strong>Statut :</strong>{" "}
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
                    Progression : {job.processedProducts} / {job.totalProducts}{" "}
                    produits
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
                  <div style={{ color: "#155724" }}>Réussis</div>
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
                  <div style={{ color: "#721c24" }}>Échoués</div>
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
                    <strong>Note :</strong> L'import est en cours d'exécution en
                    arrière-plan. Vous pouvez quitter cette page en toute
                    sécurité, l'import continuera. Cette page se rafraîchit
                    automatiquement.
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
                    <strong>Import terminé !</strong> {job.successfulImports}{" "}
                    produit(s) importé(s) avec succès.
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
                    <strong>Erreur :</strong> L'import a échoué.
                  </p>
                </div>
              )}

              {job.errors && job.errors.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3>Erreurs rencontrées ({job.errors.length})</h3>
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
                            <strong>Produit :</strong> {err.productId}
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
                  <div>Créé le : {new Date(job.createdAt).toLocaleString()}</div>
                  {job.startedAt && (
                    <div>
                      Démarré le : {new Date(job.startedAt).toLocaleString()}
                    </div>
                  )}
                  {job.completedAt && (
                    <div>
                      Terminé le : {new Date(job.completedAt).toLocaleString()}
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
                  Nouvel import
                </s-button>
                <s-button onClick={() => navigate("/app/history")}>
                  Voir l'historique
                </s-button>
                {(job.jobStatus === "processing" ||
                  job.jobStatus === "pending") && (
                  <s-button onClick={fetchJobStatus}>
                    Rafraîchir maintenant
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
