import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import paymentService from "../services/paymentService";

/**
 * Hook to check user's subscription status
 * @returns {Object} { subscription, loading, hasActiveSubscription }
 */
export function useSubscription() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || authLoading) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const response = await paymentService.getSubscriptionStatus();
        if (response.success && response.data) {
          setSubscription(response.data);
        } else {
          setSubscription(null);
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [isAuthenticated, authLoading]);

  const hasActiveSubscription = subscription?.status === "active";

  return {
    subscription,
    loading,
    hasActiveSubscription,
  };
}

