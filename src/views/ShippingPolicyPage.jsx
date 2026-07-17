import React from "react";
import "./PolicyPage.css";

function ShippingPolicyPage() {
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--policy">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Policies</span>
          <h1 className="page-hero__title">Shipping Policy</h1>
        </div>
      </section>

      <section className="policy-details">
        <div className="policy-details__container">
          <h2>Shipping Policy</h2>
          <p>
            At Braj Madhuri, we strive to deliver authentic spiritual products sourced directly from Braj Dham to devotees worldwide with utmost care and devotion.
          </p>

          <h3>Order Processing</h3>
          <ul>
            <li>All orders are processed within 1–3 business days after order confirmation and payment receipt.</li>
            <li>During festivals, special occasions, or high-order volume periods, processing times may be slightly longer.</li>
            <li>Customers will be notified in case of any significant delay.</li>
          </ul>

          <h3>Shipping Charges</h3>
          <ul>
            <li>Shipping charges are calculated based on the weight, dimensions, and destination of the package.</li>
            <li>Shipping costs are displayed or communicated before order dispatch.</li>
            <li>We do not follow a fixed shipping rate; charges vary according to courier partner rates and package specifications.</li>
          </ul>

          <h3>Domestic Shipping (India)</h3>
          <ul>
            <li>Orders are generally delivered within 3–10 business days after dispatch, depending on the destination and courier service availability.</li>
            <li>Delivery timelines may vary for remote or rural locations.</li>
          </ul>

          <h3>International Shipping</h3>
          <ul>
            <li>We ship worldwide.</li>
            <li>International delivery timelines typically range from 7–21 business days, depending on the destination country, customs clearance, and local courier services.</li>
            <li>Customers are responsible for any customs duties, taxes, or import charges levied by their country.</li>
          </ul>

          <h3>Tracking Information</h3>
          <ul>
            <li>Once the order is dispatched, tracking details will be shared with the customer via WhatsApp, email, or SMS (where applicable).</li>
          </ul>

          <h3>Packaging</h3>
          <ul>
            <li>All products are carefully packed to ensure safe delivery.</li>
            <li>Special attention is given to fragile items such as perfumes, deity accessories, and devotional articles.</li>
          </ul>

          <h3>Delayed or Lost Shipments</h3>
          <ul>
            <li>While we work with reliable courier partners, Braj Madhuri is not liable for delays caused by courier companies, weather conditions, customs clearance, strikes, or other unforeseen circumstances.</li>
            <li>In case of a lost shipment, we will coordinate with the courier partner to resolve the issue as quickly as possible.</li>
          </ul>

          <h3>Incorrect Address</h3>
          <ul>
            <li>Customers are responsible for providing accurate shipping information.</li>
            <li>Braj Madhuri will not be responsible for delays or additional shipping charges arising from incorrect or incomplete addresses.</li>
          </ul>

          <h3>Contact Us</h3>
          <p>For any shipping-related queries, please contact us:</p>
          <p>
            <strong>Braj Madhuri</strong><br />
            WhatsApp: +91 84489 04455<br />
            Email: brajmadhuriofficial@gmail.com
          </p>
          <p>
            We are grateful for the opportunity to serve devotees around the world and bring the blessings of Braj Dham to your doorstep.
          </p>
        </div>
      </section>
    </main>
  );
}

export default ShippingPolicyPage;
