import "./styles.css"
import { AuthProvider } from "@/context/auth-context"

export const metadata = {
  title: "My Store - Shop Online",
  description: "Shop the best products online with secure Razorpay payments",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
