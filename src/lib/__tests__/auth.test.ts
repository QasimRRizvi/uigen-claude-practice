import { test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockGet = vi.fn();
const mockSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockGet, set: mockSet })),
}));

const mockSign = vi.fn().mockResolvedValue("signed-token");
const mockSetExpirationTime = vi.fn();
const mockSetIssuedAt = vi.fn();
const mockSetProtectedHeader = vi.fn();
vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: mockSetProtectedHeader.mockReturnThis(),
    setExpirationTime: mockSetExpirationTime.mockReturnThis(),
    setIssuedAt: mockSetIssuedAt.mockReturnThis(),
    sign: mockSign,
  })),
}));

import { getSession, createSession } from "@/lib/auth";
import { jwtVerify, SignJWT } from "jose";

beforeEach(() => {
  vi.clearAllMocks();
});

test("returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);
  expect(await getSession()).toBeNull();
});

test("returns null when JWT verification fails", async () => {
  mockGet.mockReturnValue({ value: "bad-token" });
  vi.mocked(jwtVerify).mockRejectedValue(new Error("invalid signature"));
  expect(await getSession()).toBeNull();
});

test("returns session payload when token is valid", async () => {
  const payload = { userId: "user-1", email: "test@example.com", expiresAt: new Date() };
  mockGet.mockReturnValue({ value: "valid-token" });
  vi.mocked(jwtVerify).mockResolvedValue({ payload } as never);

  const session = await getSession();
  expect(session).toEqual(payload);
});

test("createSession signs a JWT with userId and email", async () => {
  await createSession("user-42", "hello@example.com");

  expect(SignJWT).toHaveBeenCalledWith(
    expect.objectContaining({ userId: "user-42", email: "hello@example.com" })
  );
  expect(mockSign).toHaveBeenCalled();
});

test("createSession sets the auth-token cookie with the signed token", async () => {
  await createSession("user-42", "hello@example.com");

  expect(mockSet).toHaveBeenCalledWith(
    "auth-token",
    "signed-token",
    expect.objectContaining({ httpOnly: true, path: "/" })
  );
});

test("createSession sets cookie expiry ~7 days in the future", async () => {
  const before = Date.now();
  await createSession("user-42", "hello@example.com");
  const after = Date.now();

  const { expires } = mockSet.mock.calls[0][2] as { expires: Date };
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});
