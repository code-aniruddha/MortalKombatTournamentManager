import { motion } from 'framer-motion';
import { GiGamepad } from 'react-icons/gi';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message = 'Loading Tournament...' }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian">
      <div className="text-center">
        {/* Animated Controller Icon */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="flex justify-center mb-8"
        >
          <GiGamepad className="text-blood text-8xl" style={{ filter: 'drop-shadow(0 0 20px #8B0000)' }} />
        </motion.div>

        {/* Loading Text */}
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-3xl font-bold text-text mb-4"
          style={{ fontFamily: 'Bebas Neue, sans-serif', letterSpacing: '0.1em' }}
        >
          {message}
        </motion.h2>

        {/* Loading Bar */}
        <div className="w-64 h-2 bg-obsidian-light rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-blood via-soul to-gold"
            animate={{
              x: [-256, 256],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{ width: '50%' }}
          />
        </div>

        {/* Mortal Kombat Style Text */}
        <motion.p
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 text-soul text-sm"
          style={{ textShadow: '0 0 10px #00FF41' }}
        >
          PREPARE YOURSELF
        </motion.p>
      </div>
    </div>
  );
}
