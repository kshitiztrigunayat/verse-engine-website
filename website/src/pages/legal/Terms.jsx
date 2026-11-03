// Terms of Service (/terms). Text copied from the production page https://verse.ctruh.com/terms; styled like it by
// public/css/legal.css.
export default function Terms() {
  return (
    <>
      <p className="mono" style={{ marginTop: "28px" }}>Legal</p>
      <h1>Terms of Service</h1>
      <p className="meta">Effective 20 October 2026 · Ctruh Technologies Private Limited</p>
      <h2>1. Who we are and what these terms cover</h2>
      <p>
        {"Verse is a product of Ctruh Technologies Private Limited (\"Ctruh\", \"we\", \"us\"). These terms govern your use of Verse: the website, the viewer and embeds, Studio, the editor plug-ins, the API, live tours, Verse Home, video export and Verse on WhatsApp. By creating an account, uploading content or buying a plan you agree to them. If you use Verse for a company, you confirm you may bind it."}
      </p>
      <h2>2. Accounts</h2>
      <p>
        A Verse account is created with a name and is identified by a secret account token. The token is the credential: anyone who has it can act as the account. Keep it safe; we show it once and cannot recover a lost token. You are responsible for activity under your account and for the people you add as Studio seats.
      </p>
      <h2>3. Your content</h2>
      <ul>
        <li>
          <strong>You keep ownership</strong>
          {" of the 3D models, floor plans, images, logos and other files you upload (\"Your Content\")."}
        </li>
        <li>
          {"You grant Ctruh a worldwide, non-exclusive, royalty-free licence to host, store, copy, convert (compile, compress, re-texture, generate previews and furnished layouts), stream and display Your Content "}
          <strong>only to run Verse for you and the viewers you share it with</strong>
          , including showing a published scene to anyone who has its link or embed.
        </li>
        <li>
          {"You confirm you have the rights to everything you upload, and that it does not infringe anyone's rights, break the law, or contain malware."}
        </li>
        <li>A published scene is visible to anyone with its link unless your plan supports private links and you use one.</li>
        <li>
          {"We may remove content that breaks these terms or that we are required to remove by law, and we act on valid notices of infringement sent to "}
          <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
          .
        </li>
      </ul>
      <h2>4. Plans, limits and the Ctruh mark</h2>
      <p>
        {"Verse has Free, Pro, Studio and Enterprise plans. Prices, limits (scenes, upload sizes, tour guests, video resolution, Verse Home conversions per month) and features are shown on "}
        <a href="/pricing">/pricing</a>
        {" and may change; a price change applies from your next billing period after notice. When you reach a limit, Verse asks you to upgrade rather than silently failing. Viewers never need a plan to open a published scene."}
      </p>
      <p>
        {"Scenes on Free show a \"Made with Verse by Ctruh\" badge and exports carry a watermark; Pro and Studio show a small Ctruh mark. You may not remove, hide or obscure the mark by any means, except where an Enterprise contract includes white-labelling."}
      </p>
      <h2>5. Payments</h2>
      <p>
        {"Paid plans are subscriptions billed monthly or annually in advance. Checkout is handled by "}
        <strong>Dodo Payments, which acts as merchant of record</strong>
        {": it sells the subscription to you, charges your card or UPI, calculates and collects applicable taxes (such as GST, VAT or sales tax) and issues your invoice. For customers in India, payments may instead be processed by Razorpay. Their own terms apply to the payment. Subscriptions renew automatically until cancelled. You can cancel at any time from "}
        <a href="/billing">/billing</a>
        {"; your plan keeps working to the end of the period you paid for. If a payment fails, the plan keeps working for a grace period (currently 7 days) and the account then moves to Free. Refunds are covered by the "}
        <a href="/refunds">refund policy</a>
        . Enterprise plans are governed by their signed contract.
      </p>
      <h2>6. Acceptable use</h2>
      <p>
        Do not: upload unlawful, infringing, hateful or sexually explicit content involving minors; attempt to break, overload, scrape or reverse-engineer the service beyond what the published API and SDK allow; get around plan limits, quotas, rate limits or the Ctruh mark; share account tokens outside your organisation; or use Verse on WhatsApp to send spam. We may suspend accounts that do.
      </p>
      <h2>7. Verse on WhatsApp</h2>
      <p>
        When you message the Verse WhatsApp number, the files and messages you send are processed to answer you (questions are answered by our assistant; floor plans become walkable homes; 3D files are published as scenes) and the result is sent back as a link. WhatsApp is operated by Meta under its own terms. A link we send you is a published scene, visible to anyone who has it.
      </p>
      <h2>8. AI features</h2>
      <p>
        Ask Verse and Verse Home use automated and AI systems. Their output (answers, layouts, furnishing, restyles) can be wrong or incomplete. Check it before relying on it, especially for measurements, plans or anything a buyer will rely on.
      </p>
      <h2>9. Availability and changes</h2>
      <p>
        We work to keep Verse available but do not promise uninterrupted service, except where an Enterprise contract includes an SLA. Features may change. We will give reasonable notice before removing a paid feature you rely on.
      </p>
      <h2>10. Disclaimers and liability</h2>
      <p>
        {"Verse is provided \"as is\" to the extent the law allows. To the extent the law allows, Ctruh is not liable for indirect or consequential losses, lost profits or lost data, and our total liability for any claim is limited to the fees you paid us in the 12 months before the claim. Nothing here limits liability that cannot be limited by law. "}
        <em>[Counsel to confirm the cap and carve-outs.]</em>
      </p>
      <h2>11. Ending</h2>
      <p>
        {"You can stop using Verse and cancel at any time. We may suspend or end access for a serious or repeated breach of these terms. On ending, you can ask us to delete your account and scenes (see the "}
        <a href="/privacy">privacy policy</a>
        ).
      </p>
      <h2>12. Law and disputes</h2>
      <p>
        These terms are governed by the laws of India, and the courts at Bengaluru, Karnataka have jurisdiction, without prejudice to any mandatory consumer protections where you live.
      </p>
      <h2>13. Contact</h2>
      <p>
        {"Ctruh Technologies Private Limited · 3rd Floor, Obeya Silk, Siddappa Layout, Madiwala Post, Bommanahalli, Bengaluru, Karnataka 560068, India · "}
        <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
      </p>
    </>
  );
}
