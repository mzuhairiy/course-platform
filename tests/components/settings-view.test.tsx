import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/server/actions/profile", () => ({
  updateProfileAction: vi.fn(),
  changePasswordAction: vi.fn(),
}));

import { SettingsView } from "@/components/features/settings/settings-view";

const USER = {
  name: "Budi Santoso",
  email: "budi@example.com",
  image: null,
  bio: null,
  role: "STUDENT" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SettingsView unsaved-changes guard", () => {
  it("navigates home directly when there are no unsaved changes", async () => {
    const user = userEvent.setup();
    render(<SettingsView user={USER} />);

    await user.click(screen.getByTestId("settings-back-button"));

    expect(pushMock).toHaveBeenCalledWith("/");
    expect(
      screen.queryByTestId("unsaved-changes-dialog"),
    ).not.toBeInTheDocument();
  });

  it("shows the confirm dialog when leaving with unsaved profile edits", async () => {
    const user = userEvent.setup();
    render(<SettingsView user={USER} />);

    await user.type(screen.getByTestId("name-input"), "x");
    await user.click(screen.getByTestId("settings-back-button"));

    expect(await screen.findByTestId("unsaved-changes-dialog")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();

    // Confirming the dialog navigates home.
    await user.click(screen.getByTestId("unsaved-confirm-leave"));
    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
