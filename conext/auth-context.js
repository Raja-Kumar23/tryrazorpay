"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      // Load orders from localStorage for this user
      if (user) {
        const savedOrders = localStorage.getItem(`orders_${user.uid}`)
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders))
        }
      } else {
        setOrders([])
      }
    })

    return () => unsubscribe()
  }, [])

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setOrders([])
  }

  const addOrder = (order) => {
    const newOrder = {
      ...order,
      id: Date.now(),
      date: new Date().toISOString(),
      status: "Confirmed",
    }
    const updatedOrders = [newOrder, ...orders]
    setOrders(updatedOrders)
    if (user) {
      localStorage.setItem(`orders_${user.uid}`, JSON.stringify(updatedOrders))
    }
    return newOrder
  }

  return <AuthContext.Provider value={{ user, loading, logout, orders, addOrder }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
