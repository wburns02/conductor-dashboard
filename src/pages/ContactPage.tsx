import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '../components/PageTransition'
import GlassCard from '../components/GlassCard'
import AnimatedButton from '../components/AnimatedButton'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Invalid email format'
    if (!form.message.trim()) errs.message = 'Message is required'
    else if (form.message.trim().length < 10)
      errs.message = 'Message must be at least 10 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      setSubmitted(true)
    }
  }

  const reset = () => {
    setForm({ name: '', email: '', message: '' })
    setErrors({})
    setSubmitted(false)
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-20 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <motion.h1
            className="text-4xl sm:text-5xl font-black text-center mb-2 bg-gradient-to-r from-[#00f5a0] to-[#00d4ff] bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-gray-400 text-center mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Every field animates as you type. Watch the magic.
          </motion.p>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-center"
              >
                <GlassCard glowColor="#00f5a0">
                  <div className="p-10">
                    <motion.div
                      className="text-6xl mb-4"
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    >
                      ✅
                    </motion.div>
                    <motion.h2
                      className="text-2xl font-bold text-white mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      Message Sent!
                    </motion.h2>
                    <motion.p
                      className="text-gray-400 mb-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      Thanks, {form.name}! We&apos;ll get back to you at {form.email}.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <AnimatedButton variant="secondary" onClick={reset}>
                        Send Another
                      </AnimatedButton>
                    </motion.div>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard glowColor="#00f5a0">
                  <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
                    {/* Name */}
                    <div>
                      <motion.label
                        className="block text-sm font-medium mb-1.5"
                        animate={{
                          color: focusedField === 'name' ? '#00f5a0' : '#9ca3af',
                        }}
                      >
                        Name
                      </motion.label>
                      <motion.div
                        animate={{
                          boxShadow:
                            focusedField === 'name'
                              ? '0 0 0 2px #00f5a044, 0 0 20px #00f5a022'
                              : '0 0 0 1px rgba(255,255,255,0.08)',
                        }}
                        className="rounded-xl"
                      >
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Your name"
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] text-white placeholder-gray-600 outline-none"
                        />
                      </motion.div>
                      <AnimatePresence>
                        {errors.name && (
                          <motion.p
                            initial={{ opacity: 0, y: -5, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -5, height: 0 }}
                            className="text-[#ff006e] text-xs mt-1"
                          >
                            {errors.name}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Email */}
                    <div>
                      <motion.label
                        className="block text-sm font-medium mb-1.5"
                        animate={{
                          color: focusedField === 'email' ? '#00d4ff' : '#9ca3af',
                        }}
                      >
                        Email
                      </motion.label>
                      <motion.div
                        animate={{
                          boxShadow:
                            focusedField === 'email'
                              ? '0 0 0 2px #00d4ff44, 0 0 20px #00d4ff22'
                              : '0 0 0 1px rgba(255,255,255,0.08)',
                        }}
                        className="rounded-xl"
                      >
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] text-white placeholder-gray-600 outline-none"
                        />
                      </motion.div>
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -5, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -5, height: 0 }}
                            className="text-[#ff006e] text-xs mt-1"
                          >
                            {errors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Message */}
                    <div>
                      <motion.label
                        className="block text-sm font-medium mb-1.5"
                        animate={{
                          color: focusedField === 'message' ? '#8338ec' : '#9ca3af',
                        }}
                      >
                        Message
                      </motion.label>
                      <motion.div
                        animate={{
                          boxShadow:
                            focusedField === 'message'
                              ? '0 0 0 2px #8338ec44, 0 0 20px #8338ec22'
                              : '0 0 0 1px rgba(255,255,255,0.08)',
                        }}
                        className="rounded-xl"
                      >
                        <textarea
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          onFocus={() => setFocusedField('message')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="What's on your mind?"
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] text-white placeholder-gray-600 outline-none resize-none"
                        />
                      </motion.div>
                      <div className="flex justify-between">
                        <AnimatePresence>
                          {errors.message && (
                            <motion.p
                              initial={{ opacity: 0, y: -5, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -5, height: 0 }}
                              className="text-[#ff006e] text-xs mt-1"
                            >
                              {errors.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        <motion.span
                          className="text-xs mt-1 ml-auto"
                          animate={{
                            color: form.message.length >= 10 ? '#00f5a0' : '#6b7280',
                          }}
                        >
                          {form.message.length}/10 min
                        </motion.span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 rounded-full bg-[rgba(255,255,255,0.05)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#00f5a0] to-[#00d4ff]"
                        animate={{
                          width: `${
                            ((form.name ? 33 : 0) +
                              (form.email ? 33 : 0) +
                              (form.message.length >= 10 ? 34 : 0))
                          }%`,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>

                    <AnimatedButton className="w-full">
                      Send Message ✨
                    </AnimatedButton>
                  </form>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  )
}
