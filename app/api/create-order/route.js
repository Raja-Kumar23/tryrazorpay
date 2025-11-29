export async function POST(request) {
  try {
    const { amount } = await request.json()

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return Response.json(
        {
          success: false,
          error:
            "Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.",
        },
        { status: 500 },
      )
    }

    // Create Basic Auth header
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    // Use Razorpay REST API with fetch
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      }),
    })

    const order = await response.json()

    if (!response.ok) {
      return Response.json(
        { success: false, error: order.error?.description || "Failed to create order" },
        { status: response.status },
      )
    }

    return Response.json({
      success: true,
      order,
      key_id: keyId,
    })
  } catch (error) {
    console.error("Error creating order:", error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
