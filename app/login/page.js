"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth"
import { useAuth } from "@/context/auth-context"
import "../styles.css"

export default function LoginPage() {
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState("phone") // phone or otp
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmationResult, setConfirmationResult] = useState(null)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    // Initialize recaptcha
    if (typeof window !== "undefined" && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
      })
    }
  }, [])

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier)
      setConfirmationResult(confirmation)
      setStep("otp")
    } catch (err) {
      console.error("Error sending OTP:", err)
      setError(err.message || "Failed to send OTP. Please try again.")
      // Reset recaptcha on error
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await confirmationResult.confirm(otp)
      router.push("/")
    } catch (err) {
      console.error("Error verifying OTP:", err)
      setError("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Welcome to My Store</h1>
          <p>Sign in with your phone number to continue</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <div className="phone-input-wrapper">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your phone number"
                  maxLength={10}
                  required
                />
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading || phone.length < 10}>
              {loading ? <span className="loading"></span> : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="login-form">
            <div className="form-group">
              <label htmlFor="otp">Enter OTP</label>
              <p className="otp-sent-text">OTP sent to +91{phone}</p>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                required
                className="otp-input"
              />
            </div>
            <button type="submit" className="login-btn" disabled={loading || otp.length < 6}>
              {loading ? <span className="loading"></span> : "Verify OTP"}
            </button>
            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setStep("phone")
                setOtp("")
                setError("")
              }}
            >
              Change Phone Number
            </button>
          </form>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  )
}
