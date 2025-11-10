"use client";

import { useEffect, useState, useRef } from "react";
import { subscribeTodaySpinTickets } from "@/modules/spin-dorayaki/services";
import { SpinTicket } from "@/modules/spin-dorayaki/types";
import { useAuth } from "@/lib/auth/context";

/**
 * Hook to track new tickets and trigger notifications
 * Returns:
 * - hasNewTickets: boolean indicating if there are new tickets
 * - ticketCount: number of pending tickets
 * - showNotification: boolean to control notification display
 */
export function useNewTicketNotification() {
  const { session, role } = useAuth();
  const [tickets, setTickets] = useState<SpinTicket[]>([]);
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const previousTicketIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.id || role !== "student") {
      return;
    }

    const studentId = session.user.id;
    let isInitialLoad = true;
    
    // Subscribe to real-time ticket updates
    const unsubscribe = subscribeTodaySpinTickets(studentId, (newTickets) => {
      const currentTicketIds = new Set(newTickets.map(t => t.id));
      const previousTicketIds = previousTicketIdsRef.current;

      // Skip notification on initial load
      if (isInitialLoad) {
        isInitialLoad = false;
        setTickets(newTickets);
        previousTicketIdsRef.current = currentTicketIds;
        return;
      }

      // Check if there are new tickets (tickets that weren't in previous set)
      const hasNew = newTickets.some(ticket => !previousTicketIds.has(ticket.id));
      
      // Only show notification if there are new tickets
      if (hasNew) {
        setHasNewTickets(true);
        setShowNotification(true);
        
        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 5000);
      }

      // Update state
      setTickets(newTickets);
      previousTicketIdsRef.current = currentTicketIds;
    });

    return () => {
      unsubscribe();
    };
  }, [session?.user?.id, role]);


  const dismissNotification = () => {
    setShowNotification(false);
    setHasNewTickets(false);
  };

  return {
    hasNewTickets: tickets.length > 0,
    ticketCount: tickets.length,
    showNotification,
    dismissNotification,
  };
}

