"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavBar } from "@/components/NavBar";
import { DriverReviewCard } from "@/components/DriverReviewCard";
import { apiRequest } from "@/lib/api-client";
import type { Driver, DriverAccountStatus } from "@/types/driver";

type ReviewDecision = "approved" | "declined" | "blocked" | "reinstate";

interface DriversResponse {
  drivers: Driver[];
}

const statusFilters: Array<{
  label: string;
  value: DriverAccountStatus | "all";
}> = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Blocked", value: "blocked" },
  { label: "Declined", value: "declined" },
  { label: "All", value: "all" },
];

export default function DashboardPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    DriverAccountStatus | "all"
  >("pending");

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("flashride_admin_token")
      : null;

  const loadDrivers = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setFeedback(null);

    try {
      const query =
        selectedStatus && selectedStatus !== "all"
          ? `?status=${selectedStatus}`
          : "?status=all";
      const response = await apiRequest<DriversResponse>({
        endpoint: `/admin/drivers${query}`,
        token,
      });
      setDrivers(response.drivers);
    } catch (error) {
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback("Unable to load drivers.");
      }
      if (
        error instanceof Error &&
        (error.message === "Invalid token" || error.message === "Unauthorized")
      ) {
          window.localStorage.removeItem("flashride_admin_token");
        router.replace("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedStatus, token]);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    void loadDrivers();
  }, [token, loadDrivers, router]);

  const handleDecision = async (
    driverId: string,
    decision: ReviewDecision,
    options?: { rejectionReason?: string }
  ) => {
    if (!token) {
      router.replace("/login");
      return;
    }
    setFeedback(null);

    try {
      await apiRequest<{ success: boolean }>({
        endpoint: `/admin/drivers/${driverId}`,
        method: "PATCH",
        token,
        payload: {
          decision,
          rejectionReason: options?.rejectionReason,
        }
      });

      setDrivers((current) => current.filter((driver) => driver.id !== driverId));

      let successMessage = "Action recorded successfully.";
      if (decision === "approved") {
        successMessage = "Driver approved successfully.";
      } else if (decision === "declined") {
        successMessage = `Driver declined: ${
          options?.rejectionReason ?? "Decision recorded."
        }`;
      } else if (decision === "blocked") {
        successMessage = "Driver blocked successfully.";
      } else if (decision === "reinstate") {
        successMessage = "Driver reinstated successfully.";
      }

      setFeedback(successMessage);
    } catch (error) {
      if (error instanceof Error) {
        setFeedback(error.message);
      } else {
        setFeedback("Unable to record decision. Please try again.");
      }
      return;
    }

    await loadDrivers();
  };

  const deriveActions = (driver: Driver): ReviewDecision[] => {
    if (driver.accountStatus === "pending") {
      return ["declined", "approved"];
    }

    if (driver.accountStatus === "approved") {
      return ["blocked", "declined"];
    }

    if (driver.accountStatus === "blocked") {
      return ["reinstate", "declined"];
    }

    if (driver.accountStatus === "declined") {
      return ["approved"];
    }

    return [];
  };

  return (
    <>
      <AdminNavBar />
      <main className="dashboard">
        <section className="summary">
          <h1>Pending driver registrations</h1>
          <p>
            Review new submissions and activate qualified drivers. You can approve
            or decline each profile below.
          </p>
        </section>

        <nav className="filters">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              className={
                filter.value === selectedStatus ? "filter active" : "filter"
              }
              onClick={() => setSelectedStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </nav>

        {feedback ? <div className="feedback">{feedback}</div> : null}

        {isLoading ? (
          <div className="empty-state">
            <span className="spinner" />
            <p>Loading drivers…</p>
          </div>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <p>No drivers matching the selected filter.</p>
          </div>
        ) : (
          <section className="card-grid">
            {drivers.map((driver) => (
              <DriverReviewCard
                key={driver.id}
                driver={driver}
                availableActions={deriveActions(driver)}
                onAction={handleDecision}
              />
            ))}
          </section>
        )}
      </main>

      <style jsx>{`
        .dashboard {
          padding: 2rem 3rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .summary h1 {
          margin: 0;
          font-size: 2rem;
          color: #0f172a;
        }

        .summary p {
          margin: 0.75rem 0 0;
          color: #64748b;
          max-width: 640px;
        }

        .filters {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-weight: 600;
          transition: background 0.2s ease, color 0.2s ease,
            border-color 0.2s ease;
        }

        .filter.active {
          background: #1d4ed8;
          border-color: #1d4ed8;
          color: #ffffff;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .empty-state {
          background: #ffffff;
          border-radius: 1rem;
          padding: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          gap: 0.75rem;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(102, 92, 255, 0.2);
          border-top-color: #665cff;
          border-radius: 50%;
          animation: spin 0.9s linear infinite;
        }

        .feedback {
          padding: 0.85rem 1rem;
          border-radius: 0.75rem;
          background: #eef2ff;
          color: #312e81;
          font-weight: 600;
          width: fit-content;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            padding: 1.5rem;
          }
        }
      `}</style>
    </>
  );
}

