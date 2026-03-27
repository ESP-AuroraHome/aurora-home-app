import "@testing-library/jest-dom";

if (typeof window !== "undefined") {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }
}
