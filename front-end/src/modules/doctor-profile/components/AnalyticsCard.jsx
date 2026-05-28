import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, duration = 1.2 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : display}</span>;
}

export default function AnalyticsCard({ label, value, index = 0, isDecimal }) {
  return (
    <motion.div
      className="dhp-analytics-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
    >
      <div className="dhp-analytics-value">
        {isDecimal ? value?.toFixed?.(1) ?? value : <AnimatedCounter value={value} />}
      </div>
      <div className="dhp-analytics-label">{label}</div>
    </motion.div>
  );
}
