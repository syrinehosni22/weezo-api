const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    // 1. Create or retrieve a Customer (Best practice for mobile)
    const customer = await stripe.customers.create();

    // 2. Create an Ephemeral Key (Required for the Flutter Payment Sheet to work reliably)
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' } // Use the version compatible with your SDK
    );

    // 3. Create the Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents dynamically
      currency: currency || "eur",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    // 4. Return all 3 keys to Flutter
    res.status(200).json({
      success: true,
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY // Optional: can send from backend
    });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment intent",
      error: error.message,
    });
  }
};

module.exports = { createPaymentIntent };