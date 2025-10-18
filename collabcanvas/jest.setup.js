import "@testing-library/jest-dom";
import { randomUUID } from "crypto";

// Mock crypto.randomUUID for tests
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = randomUUID;
}

// Mock Firebase modules for tests
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInAnonymously: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Call callback with null user by default
    callback(null);
    return jest.fn(); // Return unsubscribe function
  }),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
  })),
  query: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    fromDate: jest.fn((date) => date),
  },
}));

// Mock Konva for thumbnail generation
jest.mock("konva", () => ({
  default: {
    Stage: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      destroy: jest.fn(),
      toDataURL: jest.fn(() => "data:image/jpeg;base64,mockThumbnail"),
    })),
    Layer: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      draw: jest.fn(),
    })),
    Rect: jest.fn(),
    Circle: jest.fn(),
    Line: jest.fn(),
    Text: jest.fn(),
  },
}));
