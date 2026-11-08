import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrdersReview } from "@/components/OrdersReview";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), invalidate: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: mocks.rpc } }));
vi.mock("@/lib/queries", () => ({ ordersQuery: {} }));
vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: [{ id: "order-123", price: 2.7, created_at: "2026-11-08T00:00:00Z", status: "pending", delivery_details: null, delivered_at: null, proxy: { ip: "masked", city: "Nairobi", country: "KE" } }] }),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
}));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

describe("Manual order delivery", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.rpc.mockResolvedValue({ error: null }); });

  it("sends the admin-entered delivery details for the selected order", async () => {
    render(<OrdersReview />);
    fireEvent.click(screen.getByRole("button", { name: "Deliver" }));
    const details = "proxy.example:1080:test-user:test-password\nExpires 2026-12-08";
    fireEvent.change(screen.getByLabelText("Delivery details"), { target: { value: details } });
    fireEvent.click(screen.getByRole("button", { name: "Approve & deliver" }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("deliver_order", { _id: "order-123", _details: details }));
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledWith({ queryKey: ["orders"] }));
  });

  it("does not report delivery success when the admin-only operation is denied", async () => {
    mocks.rpc.mockResolvedValue({ error: { message: "Forbidden" } });
    render(<OrdersReview />);
    fireEvent.click(screen.getByRole("button", { name: "Deliver" }));
    fireEvent.change(screen.getByLabelText("Delivery details"), { target: { value: "proxy.example:1080:user:password" } });
    fireEvent.click(screen.getByRole("button", { name: "Approve & deliver" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Forbidden"));
    expect(mocks.success).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});