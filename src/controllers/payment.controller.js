const Stripe = require("stripe");
// Ensure your .env file has STRIPE_SECRET_KEY
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "A valid amount is required",
      });
    }

    // 1. Create a Customer 
    // In a real app, you'd check if the user already has a stripe_customer_id in your DB
    const customer = await stripe.customers.create();

    // 2. Create an Ephemeral Key
    // Flutter's Stripe SDK requires this for the Payment Sheet to manage saved cards
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2022-11-15' } 
    );

    // 3. Create the Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converts e.g. 10.50 to 1050 cents
      currency: currency || "eur",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    // 4. Return the response
    // Ensure these key names match exactly what you call in Flutter
    res.status(200).json({
      success: true,
      paymentIntent: paymentIntent.client_secret, 
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
    });

  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({
      success: false,
      message: "Stripe PaymentIntent creation failed",
      error: error.message,
    });
  }
};

module.exports = { createPaymentIntent };