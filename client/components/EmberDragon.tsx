"use client"

import { motion } from "framer-motion"

interface EmberDragonProps {
  isListening?: boolean
  isSpeaking?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function EmberDragon({ isListening = false, isSpeaking = false, size = "md" }: EmberDragonProps) {
  const sizeClasses = {
    sm: "w-20 h-20 md:w-24 md:h-24",
    md: "w-32 h-32 md:w-40 md:h-40",
    lg: "w-48 h-48 md:w-64 md:h-64",
    xl: "w-64 h-64 md:w-80 md:h-80"
  }

  return (
    <motion.div
      className={`relative ${sizeClasses[size]}`}
      animate={isSpeaking ? { y: [0, -8, 0] } : isListening ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, repeat: isSpeaking || isListening ? Infinity : 0, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Body */}
        <ellipse cx="100" cy="130" rx="55" ry="45" className="fill-primary" />

        {/* Belly scales */}
        <ellipse cx="100" cy="135" rx="35" ry="32" className="fill-secondary" />
        <path d="M85 115 Q100 120 115 115 Q100 125 85 115" className="fill-secondary/80" />
        <path d="M80 130 Q100 135 120 130 Q100 145 80 130" className="fill-secondary/80" />
        <path d="M85 145 Q100 150 115 145 Q100 155 85 145" className="fill-secondary/80" />

        {/* Tail */}
        <motion.path
          d="M45 140 Q20 150 15 170 Q10 185 25 180 Q35 175 30 165 Q28 155 45 145"
          className="fill-primary"
          animate={isSpeaking ? { d: [
            "M45 140 Q20 150 15 170 Q10 185 25 180 Q35 175 30 165 Q28 155 45 145",
            "M45 140 Q15 145 10 165 Q5 180 20 178 Q32 173 28 162 Q25 152 45 145",
            "M45 140 Q20 150 15 170 Q10 185 25 180 Q35 175 30 165 Q28 155 45 145"
          ]} : {}}
          transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0, ease: "easeInOut" }}
        />
        {/* Tail spikes */}
        <path d="M20 168 L8 162 L18 175" className="fill-accent" />

        {/* Head */}
        <ellipse cx="100" cy="75" rx="45" ry="40" className="fill-primary" />

        {/* Snout */}
        <ellipse cx="100" cy="95" rx="25" ry="18" className="fill-primary" />

        {/* Nostrils */}
        <ellipse cx="90" cy="98" rx="4" ry="3" className="fill-foreground/30" />
        <ellipse cx="110" cy="98" rx="4" ry="3" className="fill-foreground/30" />

        {/* Horns */}
        <path d="M60 50 Q55 30 65 25 Q70 35 68 48" className="fill-accent" />
        <path d="M140 50 Q145 30 135 25 Q130 35 132 48" className="fill-accent" />

        {/* Small horns */}
        <path d="M72 42 Q70 32 78 30 Q80 38 76 44" className="fill-accent/80" />
        <path d="M128 42 Q130 32 122 30 Q120 38 124 44" className="fill-accent/80" />

        {/* Ears/frills */}
        <path d="M52 65 Q35 55 40 70 Q45 75 55 70" className="fill-accent/60" />
        <path d="M148 65 Q165 55 160 70 Q155 75 145 70" className="fill-accent/60" />

        {/* Eyes */}
        <g>
          {/* Left eye */}
          <ellipse cx="78" cy="70" rx="14" ry="16" fill="white" />
          <motion.ellipse
            cx="80"
            cy="72"
            rx="9"
            ry="10"
            fill="#2D3748"
            animate={isListening ? { scaleY: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          />
          <circle cx="84" cy="68" r="4" fill="white" />
          {/* Subtle glow */}
          <motion.ellipse
            cx="80"
            cy="72"
            rx="9"
            ry="10"
            className="fill-accent/30"
            animate={isSpeaking ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          />

          {/* Right eye */}
          <ellipse cx="122" cy="70" rx="14" ry="16" fill="white" />
          <motion.ellipse
            cx="120"
            cy="72"
            rx="9"
            ry="10"
            fill="#2D3748"
            animate={isListening ? { scaleY: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.5, repeat: isListening ? Infinity : 0 }}
          />
          <circle cx="124" cy="68" r="4" fill="white" />
          <motion.ellipse
            cx="120"
            cy="72"
            rx="9"
            ry="10"
            className="fill-accent/30"
            animate={isSpeaking ? { opacity: [0, 0.5, 0] } : { opacity: 0 }}
            transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
          />
        </g>

        {/* Cheek blush */}
        <circle cx="55" cy="82" r="8" className="fill-accent/30" />
        <circle cx="145" cy="82" r="8" className="fill-accent/30" />

        {/* Mouth/smile */}
        <motion.path
          d="M85 105 Q100 115 115 105"
          className="stroke-foreground/40 fill-none"
          strokeWidth="2.5"
          strokeLinecap="round"
          animate={isSpeaking ? { d: [
            "M85 105 Q100 115 115 105",
            "M85 105 Q100 120 115 105",
            "M85 105 Q100 115 115 105"
          ] } : {}}
          transition={{ duration: 0.25, repeat: isSpeaking ? Infinity : 0 }}
        />

        {/* Wings */}
        <motion.g
          animate={isSpeaking ? { rotate: [-3, 3, -3] } : {}}
          transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
          style={{ transformOrigin: "55px 110px" }}
        >
          <path
            d="M55 105 Q20 85 15 110 Q12 125 25 120 Q35 115 40 125 Q45 115 55 120"
            className="fill-primary"
          />
          <path
            d="M25 108 Q30 100 35 108"
            className="stroke-secondary/50 fill-none"
            strokeWidth="2"
          />
          <path
            d="M35 112 Q40 104 45 112"
            className="stroke-secondary/50 fill-none"
            strokeWidth="2"
          />
        </motion.g>
        <motion.g
          animate={isSpeaking ? { rotate: [3, -3, 3] } : {}}
          transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
          style={{ transformOrigin: "145px 110px" }}
        >
          <path
            d="M145 105 Q180 85 185 110 Q188 125 175 120 Q165 115 160 125 Q155 115 145 120"
            className="fill-primary"
          />
          <path
            d="M165 108 Q170 100 175 108"
            className="stroke-secondary/50 fill-none"
            strokeWidth="2"
          />
          <path
            d="M155 112 Q160 104 165 112"
            className="stroke-secondary/50 fill-none"
            strokeWidth="2"
          />
        </motion.g>

        {/* Feet */}
        <ellipse cx="75" cy="172" rx="18" ry="10" className="fill-primary" />
        <ellipse cx="125" cy="172" rx="18" ry="10" className="fill-primary" />
        {/* Claws */}
        <circle cx="62" cy="175" r="4" className="fill-accent" />
        <circle cx="72" cy="178" r="4" className="fill-accent" />
        <circle cx="82" cy="175" r="4" className="fill-accent" />
        <circle cx="118" cy="175" r="4" className="fill-accent" />
        <circle cx="128" cy="178" r="4" className="fill-accent" />
        <circle cx="138" cy="175" r="4" className="fill-accent" />
      </svg>

      {/* Voice indicator rings */}
      {(isListening || isSpeaking) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className={`absolute rounded-full border-4 ${isSpeaking ? 'border-accent' : 'border-primary'}`}
            initial={{ width: "100%", height: "100%", opacity: 0.6 }}
            animate={{
              width: ["100%", "140%"],
              height: ["100%", "140%"],
              opacity: [0.6, 0]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className={`absolute rounded-full border-4 ${isSpeaking ? 'border-accent' : 'border-primary'}`}
            initial={{ width: "100%", height: "100%", opacity: 0.6 }}
            animate={{
              width: ["100%", "140%"],
              height: ["100%", "140%"],
              opacity: [0.6, 0]
            }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          />
        </div>
      )}
    </motion.div>
  )
}
