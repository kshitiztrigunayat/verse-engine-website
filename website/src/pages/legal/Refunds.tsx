// Refund Policy (/refunds). Text copied from the production page https://verse.ctruh.com/refunds; styled like it by
// public/css/legal.css.
export default function Refunds() {
  return (
    <>
      <p className="mono" style={{ marginTop: "28px" }}>Legal</p>
      <h1>Refund Policy</h1>
      <p className="meta">Effective 20 October 2026 · Ctruh Technologies Private Limited</p>
      <h2>Summary</h2>
      <ul>
        <li>
          <strong>New subscriptions:</strong>
          {" if Verse is not right for you, ask within "}
          <strong>
            <span data-refund-days="">7</span>
            {" days"}
          </strong>
          {" of your first payment for a paid plan (Pro or Studio, monthly or annual) and we refund that payment in full."}
        </li>
        <li>
          <strong>Annual renewals:</strong>
          {" ask within "}
          <span data-refund-days="">7</span>
          {" days of the renewal charge and we refund it in full."}
        </li>
        <li>
          <strong>Monthly renewals</strong>
          {" are not refunded; cancel any time and the plan runs to the end of the month you paid for."}
        </li>
        <li>
          <strong>Cancelling</strong>
          {" never deletes your scenes. After the paid period the account moves to Free and its limits apply."}
        </li>
      </ul>
      <h2>How refunds are handled</h2>
      <p>
        {"Paid plans are sold by "}
        <strong>Dodo Payments as merchant of record</strong>
        {" (Razorpay for some customers in India). Refunds go back to the original payment method through them, including any tax charged. Write to "}
        <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
        {" from your account (include your account id or the invoice) or use the customer portal linked from "}
        <a href="/billing">/billing</a>
        . Once approved, a refund usually reaches you in 5–10 business days, depending on your bank or card issuer.
      </p>
      <h2>Plan changes</h2>
      <p>
        Upgrades take effect immediately and are charged pro rata for the rest of the period. Downgrades take effect at the end of the current period, with no refund for the remainder of the higher plan.
      </p>
      <h2>Extra Studio seats</h2>
      <p>
        Seats follow the subscription they belong to: within the refund window they are refunded with it; seats removed later stop billing from the next period.
      </p>
      <h2>When a refund may be refused</h2>
      <p>
        {"Repeated refund requests on new subscriptions, or accounts suspended for breaking the "}
        <a href="/terms">terms</a>
        . Nothing here limits rights you have under consumer law.
      </p>
      <h2>Enterprise</h2>
      <p>Enterprise contracts set their own payment and refund terms.</p>
      <h2>Failed payments and chargebacks</h2>
      <p>
        If a renewal fails, the plan keeps working for a 7-day grace period, then the account moves to Free; nothing is refunded or owed for that time. Please contact us before opening a chargeback; we can usually fix it faster.
      </p>
      <h2>Contact</h2>
      <p>
        {"Ctruh Technologies Private Limited · 3rd Floor, Obeya Silk, Siddappa Layout, Madiwala Post, Bommanahalli, Bengaluru, Karnataka 560068, India · "}
        <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
      </p>
    </>
  );
}
