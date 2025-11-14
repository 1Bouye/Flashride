"use client";

import { useState } from "react";
import type { Driver } from "@/types/driver";

type DriverDecision = "approved" | "declined" | "blocked" | "reinstate";

interface DriverReviewCardProps {
  driver: Driver;
  availableActions: DriverDecision[];
  onAction: (
    driverId: string,
    decision: DriverDecision,
    options?: { rejectionReason?: string }
  ) => Promise<void>;
}

export function DriverReviewCard({
  driver,
  availableActions,
  onAction,
}: DriverReviewCardProps) {
  const [isProcessing, setIsProcessing] = useState<DriverDecision | null>(null);
  const submittedDate = new Date(driver.submittedAt).toLocaleString();

  const triggerAction = async (
    decision: DriverDecision,
    options?: { rejectionReason?: string }
  ) => {
    if (isProcessing) {
      return;
    }
    setIsProcessing(decision);
    try {
      await onAction(driver.id, decision, options);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async () => {
    const reason = window.prompt(
      "Please provide a reason for declining this application:",
      driver.rejectionReason ?? ""
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      window.alert("A rejection reason is required.");
      return;
    }

    await triggerAction("declined", { rejectionReason: reason.trim() });
  };

  const renderStatusBadge = () => {
    if (driver.accountStatus === "pending") {
      return <span className="status status-pending">Pending review</span>;
    }
    if (driver.accountStatus === "approved") {
      return <span className="status status-approved">Approved</span>;
    }
    if (driver.accountStatus === "declined") {
      return <span className="status status-declined">Declined</span>;
    }
    if (driver.accountStatus === "blocked") {
      return <span className="status status-blocked">Blocked</span>;
    }
    return null;
  };

  const renderActionButtons = () => {
    return availableActions.map((action) => {
      if (action === "declined") {
        return (
          <button
            key="decline"
            className="decline"
            onClick={handleDecline}
            disabled={isProcessing !== null}
          >
            {isProcessing === "declined" ? "Declining…" : "Decline"}
          </button>
        );
      }
      if (action === "approved") {
        return (
          <button
            key="approve"
            className="approve"
            onClick={() => triggerAction("approved")}
            disabled={isProcessing !== null}
          >
            {isProcessing === "approved" ? "Approving…" : "Approve"}
          </button>
        );
      }
      if (action === "blocked") {
        return (
          <button
            key="block"
            className="block"
            onClick={() => triggerAction("blocked")}
            disabled={isProcessing !== null}
          >
            {isProcessing === "blocked" ? "Blocking…" : "Block"}
          </button>
        );
      }
      if (action === "reinstate") {
        return (
          <button
            key="reinstate"
            className="approve"
            onClick={() => triggerAction("reinstate")}
            disabled={isProcessing !== null}
          >
            {isProcessing === "reinstate" ? "Reinstating…" : "Reinstate"}
          </button>
        );
      }
      return null;
    });
  };

  return (
    <article className="card">
      <div className="card-header">
        <div>
          <h2>{driver.name}</h2>
          <p>Submitted on {submittedDate}</p>
        </div>
        {renderStatusBadge()}
      </div>

      <dl className="details-grid">
        <div>
          <dt>Email</dt>
          <dd>{driver.email}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{driver.phone_number}</dd>
        </div>
        <div>
          <dt>Country</dt>
          <dd>{driver.country}</dd>
        </div>
        <div>
          <dt>Vehicle type</dt>
          <dd>{driver.vehicle_type}</dd>
        </div>
        <div>
          <dt>Registration #</dt>
          <dd>{driver.registration_number}</dd>
        </div>
        <div>
          <dt>Registration date</dt>
          <dd>{driver.registration_date}</dd>
        </div>
        <div>
          <dt>Driving license</dt>
          <dd>{driver.driving_license}</dd>
        </div>
        <div>
          <dt>Vehicle color</dt>
          <dd>{driver.vehicle_color ?? "—"}</dd>
        </div>
        <div>
          <dt>Proposed rate (per km)</dt>
          <dd>{driver.rate}</dd>
        </div>
      </dl>

      <footer className="actions">
        {renderActionButtons()}
      </footer>

      <style jsx>{`
        .card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        h2 {
          margin: 0;
          font-size: 1.4rem;
        }

        p {
          margin: 0.2rem 0 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-weight: 600;
          font-size: 0.85rem;
        }

        .status-pending {
          background: rgba(251, 191, 36, 0.14);
          color: #b45309;
        }

        .status-approved {
          background: rgba(74, 222, 128, 0.16);
          color: #047857;
        }

        .status-declined {
          background: rgba(249, 112, 94, 0.16);
          color: #b91c1c;
        }

        .status-blocked {
          background: rgba(96, 165, 250, 0.16);
          color: #1d4ed8;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin: 0;
        }

        dt {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #94a3b8;
          margin-bottom: 0.3rem;
        }

        dd {
          margin: 0;
          font-size: 1rem;
          color: #0f172a;
        }

        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        button {
          border: none;
          border-radius: 0.75rem;
          padding: 0.65rem 1.25rem;
          font-weight: 600;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .approve {
          background: linear-gradient(135deg, #22c55e, #15803d);
          color: #ffffff;
        }

        .block {
          background: #fef3c7;
          color: #f59e0b;
        }

        .decline {
          background: #f1f5f9;
          color: #ef4444;
        }

        button:not(:disabled):hover {
          transform: translateY(-1px);
        }
      `}</style>
    </article>
  );
}

