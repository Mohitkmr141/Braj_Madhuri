import React from "react";
import "./PolicyPage.css";

function ReturnRefundPolicyPage() {
  return (
    <main className="page-shell">
      <section className="page-hero page-hero--policy">
        <div className="page-hero__content reveal">
          <span className="section-eyebrow">Policies</span>
          <h1 className="page-hero__title">Return & Refund Policy</h1>
        </div>
      </section>

      <section className="policy-details">
        <div className="policy-details__container">
          <h2>Braj Madhuri Return & Refund Policy</h2>
          <p>
            At Braj Madhuri, we are committed to providing authentic spiritual products sourced directly from Braj Dham. Due to the sacred and personal nature of many of our products, we maintain the following return and refund policy.
          </p>

          <h3>Returns</h3>
          <ul>
            <li>Returns are accepted only if the product received is damaged, defective, incorrect, or incomplete.</li>
            <li>Requests for returns must be raised within 24 hours of delivery.</li>
            <li>Products must be unused, unopened, and in their original packaging to be eligible for a return.</li>
            <li>Products damaged due to misuse, improper handling, or normal wear and tear are not eligible for return.</li>
          </ul>

          <h3>Refunds and Replacements</h3>
          <p>Refunds or replacements may be approved in the following cases:</p>
          <ul>
            <li>The customer receives a damaged product.</li>
            <li>The customer receives an incorrect product.</li>
            <li>The customer receives an incomplete order.</li>
            <li>The product is lost during transit and confirmed by the courier partner.</li>
          </ul>
          <p>Once the claim is verified, Braj Madhuri may, at its discretion, provide:</p>
          <ul>
            <li>A replacement product, or</li>
            <li>A refund to the original payment method.</li>
          </ul>

          <h3>Mandatory Unboxing Video</h3>
          <p>To ensure a fair and transparent resolution process, a clear, continuous unboxing video is mandatory for all claims related to:</p>
          <ul>
            <li>Damaged products</li>
            <li>Missing items</li>
            <li>Incorrect products</li>
            <li>Transit-related issues</li>
          </ul>
          <p>The video must begin before opening the sealed package and clearly show the package, shipping label, and all contents received.</p>
          <p>Claims submitted without a complete unboxing video may not be eligible for a refund, replacement, or compensation, as the issue cannot be independently verified.</p>

          <h3>Non-Returnable and Non-Refundable Items</h3>
          <p>The following items are not eligible for return or refund unless received damaged or incorrect:</p>
          <ul>
            <li>Perfumes (Itra)</li>
            <li>Consumable products</li>
            <li>Puja and devotional items that have been used</li>
            <li>Customized or specially sourced products</li>
            <li>Products purchased during special sale or clearance events</li>
          </ul>

          <h3>Refund Processing</h3>
          <ul>
            <li>Approved refunds will be processed within 7–10 business days.</li>
            <li>The time taken for the refund to reflect in the customer's account may vary depending on the payment provider or bank.</li>
          </ul>

          <h3>Shipping Charges</h3>
          <ul>
            <li>Shipping charges are non-refundable unless the return is due to an error on the part of Braj Madhuri.</li>
            <li>Any additional shipping costs incurred due to incorrect address details provided by the customer will be borne by the customer.</li>
          </ul>

          <h3>Contact for Claims</h3>
          <p>To report a damaged, incorrect, or incomplete order, please contact us within 24 hours of delivery:</p>
          <p>
            <strong>Braj Madhuri</strong><br />
            WhatsApp: +91 84489 04455
          </p>
          <p>Please share:</p>
          <ul>
            <li>Order number</li>
            <li>Clear photographs (if applicable)</li>
            <li>Complete unboxing video</li>
          </ul>

          <h3>Policy Updates</h3>
          <p>Braj Madhuri reserves the right to modify this Return & Refund Policy at any time without prior notice.</p>
        </div>
      </section>
    </main>
  );
}

export default ReturnRefundPolicyPage;
