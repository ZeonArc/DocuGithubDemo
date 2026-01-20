import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Page Transition Variants
const pageVariants = {
    initial: { opacity: 0, y: 10, scale: 0.99 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.99 }
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5
} as const;

interface AnimationLayoutProps {
    children: ReactNode;
}

export default function AnimationLayout({ children }: AnimationLayoutProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full h-full flex-1"
        >
            {children}
        </motion.div>
    );
}
