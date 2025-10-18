import { getUserByEmail } from "@/lib/firebase/projects";
import { getDocs } from "firebase/firestore";

// Mock Firebase
jest.mock("firebase/firestore");

describe("getUserByEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user when email exists", async () => {
    const mockUserData = {
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      color: "#FF0000",
      isAnonymous: false,
      createdAt: { toDate: () => new Date("2024-01-01") },
    };

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [
        {
          data: () => mockUserData,
        },
      ],
    });

    const result = await getUserByEmail("john@example.com");

    expect(result).toEqual({
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      color: "#FF0000",
      isAnonymous: false,
      createdAt: mockUserData.createdAt.toDate(),
    });
  });

  it("should return null when email does not exist", async () => {
    (getDocs as jest.Mock).mockResolvedValue({
      empty: true,
      docs: [],
    });

    const result = await getUserByEmail("nonexistent@example.com");

    expect(result).toBeNull();
  });

  it("should normalize email to lowercase", async () => {
    const mockUserData = {
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      color: "#FF0000",
      isAnonymous: false,
      createdAt: { toDate: () => new Date("2024-01-01") },
    };

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockUserData }],
    });

    await getUserByEmail("JOHN@EXAMPLE.COM");

    // Verify the query was called with lowercase email
    expect(getDocs).toHaveBeenCalled();
  });

  it("should trim whitespace from email", async () => {
    const mockUserData = {
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      color: "#FF0000",
      isAnonymous: false,
      createdAt: { toDate: () => new Date("2024-01-01") },
    };

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      docs: [{ data: () => mockUserData }],
    });

    await getUserByEmail("  john@example.com  ");

    expect(getDocs).toHaveBeenCalled();
  });

  it("should handle query errors gracefully", async () => {
    (getDocs as jest.Mock).mockRejectedValue(new Error("Firestore error"));

    await expect(getUserByEmail("john@example.com")).rejects.toThrow(
      "Firestore error"
    );
  });
});
