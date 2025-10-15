import { motion } from 'framer-motion';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className="rounded-full bg-[color:var(--bg-card)] p-6 mb-4 border-2 border-dashed border-[color:var(--border-default)]">
        {Icon && <Icon size={48} className="text-[color:var(--primary)] opacity-60" />}
      </div>
      <h3 className="text-lg font-semibold text-[color:var(--fg-primary)] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
        {title}
      </h3>
      <p className="text-sm text-[color:var(--fg-secondary)] text-center max-w-md mb-6">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
