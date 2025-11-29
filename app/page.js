"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import "./styles.css"

// Sample products data
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 2999,
    image: "/black-wireless-headphones.png",
  },
  {
    id: 2,
    name: "Smart Watch",
    description: "Fitness tracking smartwatch with heart rate monitor",
    price: 4999,
    image: "/smart-watch-black.jpg",
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    description: "Portable speaker with deep bass and 12-hour battery",
    price: 1999,
    image: "/bluetooth-speaker-portable.jpg",
  },
  {
    id: 4,
    name: "Laptop Stand",
    description: "Ergonomic aluminum laptop stand for better posture",
    price: 1499,
    image: "/laptop-stand-aluminum.jpg",
  },
  {
    id: 5,
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with blue switches",
    price: 3499,
    image: "/mechanical-keyboard-rgb.jpg",
  },
  {
    id: 6,
    name: "Wireless Mouse",
    description: "Ergonomic wireless mouse with precision tracking",
    price: 999,
    image: "/wireless-mouse-ergonomic.jpg",
  },
]

export default function Home() {
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [toast, setToast] = useState({ show: false, message: "" })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, loading, logout, addOrder } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Show toast notification
  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => {
      setToast({ show: false, message: "" })
    }, 2000)
  }

  // Add item to cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id)
      if (existingItem) {
        return prevCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
    showToast(`${product.name} added to cart!`)
  }

  // Update quantity
  const updateQuantity = (productId, change) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity + change } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  // Calculate total
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle Razorpay checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsLoading(true)

    try {
      // Create order on backend
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cartTotal }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create order")
      }

      // Load Razorpay script
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      document.body.appendChild(script)

      script.onload = () => {
        const options = {
          key: data.key_id,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "My Store",
          description: "Order Payment",
          order_id: data.order.id,
          handler: async (response) => {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()

            if (verifyData.success) {
              // Save order
              addOrder({
                items: [...cart],
                total: cartTotal,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
              })
              setCart([])
              setIsCartOpen(false)
              showToast("Payment successful! Order placed.")
            } else {
              showToast("Payment verification failed. Please contact support.")
            }
          },
          prefill: {
            name: user?.displayName || "",
            email: user?.email || "",
            contact: user?.phoneNumber || "",
          },
          theme: {
            color: "#2563eb",
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error("Checkout error:", error)
      showToast("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <span className="loading"></span>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      {/* Header */}
      <header className="header">
        <Link href="/" className="logo">
          My Store
        </Link>
        <nav className="header-nav">
          <Link href="/" className="nav-link active">
            Shop
          </Link>
          <Link href="/orders" className="nav-link">
            My Orders
          </Link>
          <button className="cart-button" onClick={() => setIsCartOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </nav>
      </header>

      {/* Welcome Message */}
      <div className="welcome-banner">Welcome, {user.phoneNumber}</div>

      {/* Main Content */}
      <main className="container">
        <h1 className="page-title">Featured Products</h1>
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image || "/placeholder.svg"} alt={product.name} className="product-image" />
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <p className="product-price">₹{product.price.toLocaleString()}</p>
                <button className="add-to-cart-btn" onClick={() => addToCart(product)}>
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Overlay */}
      <div className={`cart-overlay ${isCartOpen ? "open" : ""}`} onClick={() => setIsCartOpen(false)} />

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${isCartOpen ? "open" : ""}`}>
        <div className="cart-header">
          <h2>Your Cart ({cartCount})</h2>
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
            ×
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="cart-empty">Your cart is empty</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <h4 className="cart-item-name">{item.name}</h4>
                  <p className="cart-item-price">₹{item.price.toLocaleString()}</p>
                  <div className="quantity-controls">
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, -1)}>
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button className="quantity-btn" onClick={() => updateQuantity(item.id, 1)}>
                      +
                    </button>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <button className="checkout-btn" onClick={handleCheckout} disabled={isLoading}>
              {isLoading ? <span className="loading" /> : "Proceed to Payment"}
            </button>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toast.show ? "show" : ""}`}>{toast.message}</div>
    </div>
  )
}
