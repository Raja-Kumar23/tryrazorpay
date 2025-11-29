import "./styles.css"

export const metadata = {
  title: "Razorpay Payment Integration",
  description: "Shop the best products online with secure Razorpay payments",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
