const stripe = require('stripe')('sk_test_51QtRQrIzt6ajPAdfypYxZFmOuILMSaIlqvzs65Mp1fVQgSsBoaRIdvzQsJh360HYFFePVUJsPkPMbxexJeFx2Qj400XGu3FJaY');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/create-payment-intent', async (req, res) => {
    try {
        const { price, currency } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: price, // Amount in smallest currency unit (e.g., cents)
            currency: currency, // Example: 'usd'
            payment_method_types: ['card'], // Specify allowed payment methods
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
