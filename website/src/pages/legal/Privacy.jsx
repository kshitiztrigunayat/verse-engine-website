// Privacy Policy (/privacy). Text copied from the production page https://verse.ctruh.com/privacy; styled like it by
// public/css/legal.css.
export default function Privacy() {
  return (
    <>
      <p className="mono" style={{ marginTop: "28px" }}>Legal</p>
      <h1>Privacy Policy</h1>
      <p className="meta">Effective 20 October 2026 · Ctruh Technologies Private Limited</p>
      <h2>1. Who is responsible</h2>
      <p>
        {"Ctruh Technologies Private Limited (\"Ctruh\", \"we\") runs Verse and decides how the personal data described here is used. For paid plans, Dodo Payments acts as merchant of record and is responsible for the payment data it collects at checkout. Contact: "}
        <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
        {". Grievance Officer under Indian law (IT Rules, 2011 and the Digital Personal Data Protection Act, 2023): Jayant Siktia, Director, CEO's Office, Ctruh Technologies Private Limited, 3rd Floor, Obeya Silk, Siddappa Layout, Madiwala Post, Bommanahalli, Bengaluru, Karnataka 560068, India · "}
        <a href="mailto:legal@ctruh.com">legal@ctruh.com</a>
        .
      </p>
      <h2>2. What we collect and why</h2>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Where it comes from</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Account</strong>
                : the name you give, an account id, a secret account token, plan and subscription status, Studio seat members, brand-kit logo
              </td>
              <td>You, in Studio</td>
              <td>To run your account, apply your plan and show your brand</td>
            </tr>
            <tr>
              <td>
                <strong>Uploads</strong>
                : 3D models, floor plans, images and the files we derive from them (compiled scenes, previews, furnished layouts, exports)
              </td>
              <td>You, through the browser, the plug-ins, the API or WhatsApp</td>
              <td>To convert, store and stream your scenes to the people you share them with</td>
            </tr>
            <tr>
              <td>
                <strong>Viewer analytics</strong>
                : per-scene opens and, every ~2 s while a scene is open, a row with a random session id, position and view direction in the scene, and whether it was streaming or stalled
              </td>
              <td>The viewer and embeds</td>
              <td>
                {"To show owners where visitors went and to fix slow loading. No IP address is stored with these rows. Viewers opt out with Do-Not-Track, "}
                <code>?analytics=0</code>
                {", or the embed option "}
                <code>analytics: false</code>
                .
              </td>
            </tr>
            <tr>
              <td>
                <strong>WhatsApp</strong>
                : your phone number, WhatsApp profile name, the messages and files you send and our replies
              </td>
              <td>You, by messaging Verse on WhatsApp (via Meta)</td>
              <td>To answer you and turn your files into scenes; to follow up if you asked us to</td>
            </tr>
            <tr>
              <td>
                <strong>Enterprise callback</strong>
                : name, company, phone, email, team size, use case, message
              </td>
              <td>The form on /pricing</td>
              <td>To call you back as promised</td>
            </tr>
            <tr>
              <td>
                <strong>Payments</strong>
                : Dodo (or Razorpay) collects card / UPI details, billing address and tax details. We receive only the customer and subscription ids, status, plan and period dates — never card numbers.
              </td>
              <td>The payment provider</td>
              <td>To apply the plan you bought</td>
            </tr>
            <tr>
              <td>
                <strong>Technical logs</strong>
                : IP address, user agent, request paths, errors; a rate-limit counter keyed by a hash of the IP
              </td>
              <td>Your browser or client</td>
              <td>Security, abuse prevention, rate limits and debugging</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Legal bases where these apply: performing our contract with you (account, uploads, plan), your consent (WhatsApp, callback, optional analytics), and our legitimate interests (security, product improvement). We do not sell personal data and do not use it for third-party advertising.
      </p>
      <h2>3. Cookies</h2>
      <p>
        {"Verse uses only cookies it needs to work: a sign-in cookie holding your session after you log in, and on staging/preview sites a cookie that remembers the site password. We do not use advertising or cross-site tracking cookies. The viewer may keep small preferences (such as theme or currency) in your browser's local storage."}
      </p>
      <h2>4. Who we share with</h2>
      <ul>
        <li>
          <strong>Hosting and storage</strong>
          {" (Railway, and an S3-compatible object store where enabled) — to run the service and keep backups."}
        </li>
        <li>
          <strong>Dodo Payments</strong>
          {" (merchant of record) and "}
          <strong>Razorpay</strong>
          {" — to take payments."}
        </li>
        <li>
          <strong>Meta (WhatsApp Cloud API)</strong>
          {" — to send and receive WhatsApp messages."}
        </li>
        <li>
          <strong>Anthropic</strong>
          {" — to generate Ask Verse answers from the text of your question."}
        </li>
        <li>
          <strong>An email provider</strong>
          {" (Resend) — to send transactional and sales emails."}
        </li>
        <li>
          <strong>Viewers</strong>
          {" — anyone you give a scene link or embed to sees that scene."}
        </li>
        <li>Authorities, when the law requires it.</li>
      </ul>
      <p>
        {"Some of these providers process data outside India, including in the United States. "}
        <em>[Counsel to confirm cross-border transfer wording under the DPDP Act / GDPR.]</em>
      </p>
      <h2>5. How long we keep it</h2>
      <ul>
        <li>Account-owned scenes: as long as your account exists, or until you delete them.</li>
        <li>Scenes uploaded without an account: they may be removed automatically when storage is needed, least recently viewed first.</li>
        <li>
          {"Viewer analytics raw rows: a rolling window (about the last 64 MB of rows); owners' aggregated heatmaps and counts are kept with the scene."}
        </li>
        <li>Metadata backups: 30 days.</li>
        <li>
          {"WhatsApp conversations and callback leads: "}
          <em>[retention period to be set — proposed 24 months]</em>
          .
        </li>
        <li>Billing records: as long as tax law requires.</li>
      </ul>
      <h2>6. Your rights</h2>
      <p>
        {"You can ask to access, correct or delete your personal data, withdraw consent, or nominate someone to act for you, by writing to "}
        <a href="mailto:hello@ctruh.com">hello@ctruh.com</a>
        . We will answer within 30 days. You can also complain to the data protection authority where you live. Deleting your account deletes its scenes; payment records held by Dodo or Razorpay are governed by their policies.
      </p>
      <h2>7. Security</h2>
      <p>
        Data travels over HTTPS. Account tokens are compared in constant time and kept in state files that are never publicly served; payment webhooks are signature-checked. No system is perfectly secure; we will notify you and the authorities of a breach as the law requires.
      </p>
      <h2>8. Children</h2>
      <p>Verse is for businesses and adults. It is not directed at children under 18, and we do not knowingly collect their data.</p>
      <h2>9. Changes</h2>
      <p>We will post changes here and, for material changes, tell account holders before they take effect.</p>
    </>
  );
}
