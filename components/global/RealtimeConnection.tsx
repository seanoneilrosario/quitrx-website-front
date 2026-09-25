"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccountCustomer } from "@/hooks/useAccountCustomer";
import { socket } from "@/lib/realtime/socket";

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

export default function RealtimeConnection() {
  const queryClient = useQueryClient();
  const { customer, refreshCustomer } = useAccountCustomer();
  const customerId = customer?.id;
  const customerKey = customerId ?? customer?.email;

  useEffect(() => {
    if (!customerKey) return;

    const invalidateOrders = () => {
      // The list and detail queries are scoped to the signed-in customer.
      void queryClient.invalidateQueries({
        predicate: ({ queryKey }) => queryKey[0] === "api"
          && typeof queryKey[1] === "string"
          && (queryKey[1] === "/api/orders" || queryKey[1].startsWith("/api/orders/"))
          && queryKey[2] === customerKey,
      });
    };
    const handleCustomerChanged = (data: unknown) => {
      const changedCustomer = record(record(data)?.customer);
      if (typeof changedCustomer?.id !== "string" || changedCustomer.id !== customerId) return;
      // Fetch through our authenticated API; never trust event data as account state.
      void refreshCustomer();
    };
    const handleCustomerDeleted = (data: unknown) => {
      const id = record(data)?.id;
      if (typeof id !== "string" || id !== customerId) return;
      void refreshCustomer();
      invalidateOrders();
    };
    const handleOrderUpdated = (data: unknown) => {
      const order = record(record(data)?.order);
      if (typeof order?.id !== "string") return;
      // Some events contain only an order ID. Refetch only this account's
      // authenticated queries, including its list and any open order details.
      if (typeof order.customerId === "string" && order.customerId !== customerId) return;
      invalidateOrders();
    };
    let hasConnected = false;
    const handleConnect = () => {
      // Initial data has just been fetched. Only reconcile after a reconnect.
      if (!hasConnected) {
        hasConnected = true;
        return;
      }
      void refreshCustomer();
      invalidateOrders();
    };
    const handleConnectError = (error: Error) => {
      if (process.env.NODE_ENV !== "production") console.warn("Realtime connection failed:", error.message);
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("customer.created", handleCustomerChanged);
    socket.on("customer.updated", handleCustomerChanged);
    socket.on("customer.deleted", handleCustomerDeleted);
    socket.on("order.updated", handleOrderUpdated);
    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("customer.created", handleCustomerChanged);
      socket.off("customer.updated", handleCustomerChanged);
      socket.off("customer.deleted", handleCustomerDeleted);
      socket.off("order.updated", handleOrderUpdated);
      socket.disconnect();
    };
  }, [customerId, customerKey, queryClient, refreshCustomer]);

  return null;
}
