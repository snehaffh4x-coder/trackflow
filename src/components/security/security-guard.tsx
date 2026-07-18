"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function SecurityGuard() {
  useEffect(() => {
    // 1. Disable Right Click (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Disable Dragging Images/Elements
    const handleDragStart = (e: DragEvent) => {
      if (e.target instanceof HTMLImageElement) {
        e.preventDefault();
        return false;
      }
    };

    // 4. Advanced DevTools Blocking (Debugger trap + Console overwrite)
    const blockDevTools = () => {
      // Clear console continuously
      const clearConsole = () => {
        if (typeof console !== "undefined" && console.clear) {
          console.clear();
        }
      };
      
      // Override console methods to prevent script output
      if (typeof window !== "undefined") {
        Object.keys(console).forEach(method => {
          if (typeof (console as any)[method] === 'function') {
            (console as any)[method] = function() {};
          }
        });
      }

      // Start the infinite debugger trap
      setInterval(() => {
        const before = new Date().getTime();
        // eslint-disable-next-line no-debugger
        debugger;
        const after = new Date().getTime();
        if (after - before > 100) {
          // DevTools might be open, clear everything
          clearConsole();
          document.body.innerHTML = "";
          window.location.replace("about:blank");
        }
      }, 1000);
    };

    if (process.env.NODE_ENV === "production") {
       blockDevTools();
    }

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("dragstart", handleDragStart);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
