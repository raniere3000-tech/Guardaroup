import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, AlertCircle } from "lucide-react";

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();

  const show = useCallback((message, type = "success") => {
    clearTimeout(timer.current);
    setToast({ message, type, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-safe">
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast.key}
              role="status"
              initial={{ y: -40, opacity: 0, scale: 0.95 }}
              animate={{ y: 14, opacity: 1, scale: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="flex items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-lg"
            >
              <span className={`grid size-6 place-items-center rounded-full ${toast.type === "error" ? "bg-red-400" : "bg-sand"} text-ink`}>
                {toast.type === "error" ? <AlertCircle size={15} /> : <Check size={15} strokeWidth={3} />}
              </span>
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
