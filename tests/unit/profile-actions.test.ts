import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentUserMock,
  updateUserProfileMock,
  getUserPasswordHashMock,
  updateUserPasswordMock,
  compareMock,
  hashMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getCurrentUserMock: vi.fn(),
  updateUserProfileMock: vi.fn(),
  getUserPasswordHashMock: vi.fn(),
  updateUserPasswordMock: vi.fn(),
  compareMock: vi.fn(),
  hashMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/server/services/user", () => ({
  updateUserProfile: updateUserProfileMock,
  getUserPasswordHash: getUserPasswordHashMock,
  updateUserPassword: updateUserPasswordMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("bcryptjs", () => ({
  default: { compare: compareMock, hash: hashMock },
  compare: compareMock,
  hash: hashMock,
}));

import {
  changePasswordAction,
  updateProfileAction,
} from "@/server/actions/profile";

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUserMock.mockResolvedValue({ id: "user_1", role: "STUDENT" });
});

describe("updateProfileAction", () => {
  it("updates the signed-in user's profile (happy path)", async () => {
    updateUserProfileMock.mockResolvedValue({});

    const result = await updateProfileAction({
      name: "Nama Baru",
      bio: "Halo dunia",
      image: "",
    });

    expect(result).toEqual({ status: "success" });
    // userId comes from the session, never the client; empty strings -> null.
    expect(updateUserProfileMock).toHaveBeenCalledWith("user_1", {
      name: "Nama Baru",
      bio: "Halo dunia",
      image: null,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects an empty name and does not touch the DB", async () => {
    const result = await updateProfileAction({
      name: "",
      bio: "",
      image: "",
    });

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.fieldErrors?.name).toBeTruthy();
    }
    expect(updateUserProfileMock).not.toHaveBeenCalled();
  });
});

describe("changePasswordAction", () => {
  const validInput = {
    currentPassword: "oldpassword",
    newPassword: "newpassword123",
    confirmPassword: "newpassword123",
  };

  it("changes the password when the current one is correct (happy path)", async () => {
    getUserPasswordHashMock.mockResolvedValue({ password: "stored-hash" });
    compareMock.mockResolvedValue(true);
    hashMock.mockResolvedValue("new-hash");
    updateUserPasswordMock.mockResolvedValue({});

    const result = await changePasswordAction(validInput);

    expect(result).toEqual({ status: "success" });
    expect(compareMock).toHaveBeenCalledWith("oldpassword", "stored-hash");
    expect(updateUserPasswordMock).toHaveBeenCalledWith("user_1", "new-hash");
  });

  it("fails when the current password is wrong", async () => {
    getUserPasswordHashMock.mockResolvedValue({ password: "stored-hash" });
    compareMock.mockResolvedValue(false);

    const result = await changePasswordAction(validInput);

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.fieldErrors?.currentPassword).toBeTruthy();
    }
    expect(updateUserPasswordMock).not.toHaveBeenCalled();
  });

  it("fails when the new password and confirmation do not match", async () => {
    const result = await changePasswordAction({
      currentPassword: "oldpassword",
      newPassword: "newpassword123",
      confirmPassword: "different123",
    });

    expect(result.status).toBe("error");
    if (result.status === "error") {
      expect(result.fieldErrors?.confirmPassword).toBeTruthy();
    }
    expect(getUserPasswordHashMock).not.toHaveBeenCalled();
    expect(updateUserPasswordMock).not.toHaveBeenCalled();
  });
});
