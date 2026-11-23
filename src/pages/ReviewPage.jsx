import React from 'react';
import { motion } from 'framer-motion';
import ReviewForm from '../components/ReviewForm';

export default function ReviewPage() {
  return (
    <motion.div
      className="wf-page-container"
      initial={{ opacity: 0, y: 32, filter: 'blur(18px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReviewForm />
    </motion.div>
  );
}
