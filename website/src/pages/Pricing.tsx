// Pricing page (/pricing).
// The plan cards are a calculator: billing period (monthly / annual), currency (USD, or INR shown
// as an approximate conversion, remembered on this device) and seats per plan. Prices come from
// /pricing-data.json; until it has loaded the cards show the prices written below. Checkout and
// "Have a code?" links go to verse.ctruh.com as before. (Was the pricing part of public/js/pages.js.)
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const SOURCE_NOTE_USD = "Prices in USD. Taxes calculated at checkout. Final seats and payment are confirmed on Verse.";
const usd = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const savedCurrency = () => { try { if (localStorage.getItem("verse-currency") === "INR") return "INR"; } catch (e) {} return "USD"; };

/** What each plan card shows, or null until /pricing-data.json has loaded. */
function planViews(config, period, currency, seats) {
  if (!config) return null;
  const rate = config.inrPerUsd || 90;
  const money = (value) => (currency === "INR" ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(value * rate)) : usd(value));
  const views = {};
  for (const id of ["free", "starter", "pro", "scale"]) {
    const p = config.plans[id], hasSeats = id !== "free";
    const count = hasSeats ? Math.min(500, Math.max(p.included, Math.floor(Number(seats[id]) || p.included))) : p.included;
    const factor = period === "year" ? config.annualMonths : 1;
    const total = (p.price + Math.max(0, count - p.included) * p.extra) * factor;
    const per = period === "year" ? "year" : "month";
    views[id] = {
      price: money(total),
      period: id === "free" ? "Free forever" : period === "year" ? "/ year" : "/ month",
      note: id === "free" ? "" : period === "year" ? "≈ " + money(Math.round(total / 12)) + " a month, 2 months free" + (currency === "INR" ? " · billed " + usd(total) + " in USD" : "") : currency === "INR" ? "Billed monthly in USD (" + usd(total) + ")" : "Billed monthly",
      seatNote: p.included + " included, then " + money(p.extra * factor) + " / seat / " + per,
      seatLine: p.included + " seats, more at " + money(p.extra * factor) + " / seat / " + per,
      href: "https://verse.ctruh.com/pricing?plan=" + id + "&period=" + period,
    };
  }
  return views;
}

export default function Pricing() {
  const [period, setPeriod] = useState("month");
  const [currency, setCurrency] = useState(savedCurrency);
  const [currencyShown, setCurrencyShown] = useState(false); // the currency buttons/note follow `currency` once data loads or a currency is chosen
  const [config, setConfig] = useState(null);
  const [seats, setSeats] = useState({ starter: "1", pro: "3", scale: "10" });
  const [checkoutOverride, setCheckoutOverride] = useState({}); // checkout link while extra seats are chosen (set on click)
  const inputs = useRef<Record<string, HTMLInputElement>>({}), loaded = useRef(false);
  // Recalculating the cards (only once prices have loaded) also resets the checkout links.
  const recalc = () => { if (loaded.current) setCheckoutOverride({}); };

  useEffect(() => {
    fetch("/pricing-data.json").then((r) => { if (!r.ok) throw Error(); return r.json(); })
      .then((data) => { loaded.current = true; setConfig(data); setCurrencyShown(true); setCheckoutOverride({}); }).catch(() => {});
  }, []);

  // Seat inputs: typing recalculates; leaving the field (change) also tidies the number.
  useEffect(() => {
    const cleanups = Object.entries(inputs.current).map(([id, input]) => {
      const onChange = () => {
        input.value = String(Math.min(500, Math.max(Number(input.min), Math.floor(Number(input.value) || Number(input.min)))));
        const value = input.value; setSeats((s) => ({ ...s, [id]: value })); recalc();
      };
      input.addEventListener("change", onChange);
      return () => input.removeEventListener("change", onChange);
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  const views = planViews(config, period, currency, seats);
  const show = (id, key, fallback) => (views ? views[id][key] : fallback);
  const pressed = (value) => (currencyShown ? currency === value : value === "USD");
  const sourceNote = currencyShown && currency === "INR"
    ? "Prices in rupees are an approximate conversion at ₹" + ((config && config.inrPerUsd) || 90) + " per US$1 and are for reference. You are billed in USD; taxes are calculated at checkout and final seats and payment are confirmed on Verse."
    : SOURCE_NOTE_USD;

  function chooseCurrency(value) {
    try { localStorage.setItem("verse-currency", value); } catch (e) {}
    setCurrency(value); setCurrencyShown(true); recalc();
  }
  function choosePeriod(value) { setPeriod(value); recalc(); }
  const seatInput = (id) => ({
    ref: (el) => (inputs.current[id] = el),
    onInput: (e) => { const value = e.currentTarget.value; setSeats((s) => ({ ...s, [id]: value })); recalc(); },
  });
  // With more seats than included, checkout goes to the Verse pricing page (as before).
  const checkout = (id, fallback) => ({
    href: checkoutOverride[id] ?? show(id, "href", fallback),
    onClick: () => {
      const input = inputs.current[id];
      if (input && Number(input.value) > Number(input.min)) flushSync(() => setCheckoutOverride((o) => ({ ...o, [id]: "https://verse.ctruh.com/pricing?period=" + period + "#plans" })));
    },
  });
  const priceClass = (id) => "plan-price" + (views && views[id].price.length > 6 ? " wide-price" : "");

  return (
    <>
      <header className="page-hero content-width" id="hdr-page-hero">
        <p className="eyebrow">PRICING</p>
        <h1>
          Plans that grow
          <br />
          <span>with your projects.</span>
        </h1>
        <p className="hero-description">
          Start free: every new account gets a 14-day trial with Pro features. Upgrade during the trial for 25% off your first 3 months on monthly plans, or 20% off your first year on annual. Viewers never pay: every published scene opens for everyone.
        </p>
      </header>
      <section className="pricing-content page-band" id="sec-pricing-content">
        <div className="content-width">
          <div className="billing-controls">
            <div className="billing-switch" role="group" aria-label="Billing period">
              <button data-billing="month" aria-pressed={period === "month"} id="btn-monthly" onClick={() => choosePeriod("month")}>Monthly</button>
              <button data-billing="year" aria-pressed={period === "year"} id="btn-annual" onClick={() => choosePeriod("year")}>Annual</button>
            </div>
            <div className="billing-switch currency-switch" role="group" aria-label="Currency">
              <button data-currency="USD" aria-pressed={pressed("USD")} id="btn-usd" onClick={() => chooseCurrency("USD")}>USD $</button>
              <button data-currency="INR" aria-pressed={pressed("INR")} id="btn-inr" onClick={() => chooseCurrency("INR")}>INR ₹</button>
            </div>
            <span>Annual billing: 2 months free</span>
            <a className="text-link" href="https://verse.ctruh.com/pricing#code-form" id="lnk-have-a-code">{"Have a code? "}</a>
          </div>
          <div className="pricing-grid">
            <article className="plan" data-plan-card="free" id="art-plan">
              <h2>Free</h2>
              <p className="plan-audience">Try Verse on your own models.</p>
              <p className={priceClass("free")} data-plan-price="">{show("free", "price", "$0")}</p>
              <span className="plan-period" data-plan-period="">{show("free", "period", "Free forever")}</span>
              <p className="plan-billing-note" data-billing-note="">{show("free", "note", "")}</p>
              <a data-plan-checkout="" className="site-button secondary" href="/studio" id="lnk-start-free">
                Start free
                <span aria-hidden="true" />
              </a>
              <ul className="check-list">
                <li>1 GB storage, 2 GB bandwidth a month</li>
                <li>5,000 API calls a month</li>
                <li>1 Verse Home and 1 film a month</li>
                <li>20 renders a month</li>
                <li>Uploads up to 500 MB</li>
                <li>“Made with Verse Engine by Ctruh” badge on your scenes</li>
                <li>Community support</li>
              </ul>
            </article>
            <article className="plan" data-plan-card="starter" id="art-plan-2">
              <h2>Starter</h2>
              <p className="plan-audience">For the agent or designer sharing a few spaces a month.</p>
              <p className={priceClass("starter")} data-plan-price="">{show("starter", "price", "$29")}</p>
              <span className="plan-period" data-plan-period="">{show("starter", "period", "/ month")}</span>
              <p className="plan-billing-note" data-billing-note="">{show("starter", "note", "Billed monthly")}</p>
              <label className="seat-picker">
                {"Seats "}
                <input type="number" min="1" max="500" step="1" defaultValue="1" data-plan-seats="" aria-label="Starter seats" id="inp-starter-seats" {...seatInput("starter")} />
                <span data-seat-note="">{show("starter", "seatNote", "1 included, then $15 / seat / month")}</span>
              </label>
              <a data-plan-checkout="" className="site-button secondary" id="lnk-choose-starter" {...checkout("starter", "https://verse.ctruh.com/pricing?plan=starter&period=month")}>
                Choose Starter
                <span aria-hidden="true" />
              </a>
              <ul className="check-list">
                <li>10 GB storage, 20 GB bandwidth a month</li>
                <li>50,000 API calls a month</li>
                <li>5 Verse Homes and 5 films a month</li>
                <li>2 room captures, 200 renders a month</li>
                <li>Uploads up to 2 GB</li>
                <li>No Verse badge, private links, analytics</li>
                <li>Email support</li>
              </ul>
            </article>
            <article className="plan popular" data-plan-card="pro" id="art-plan-3">
              <span className="popular-label">Most popular</span>
              <h2>Pro</h2>
              <p className="plan-audience">For the professional who shows spaces every week.</p>
              <p className={priceClass("pro")} data-plan-price="">{show("pro", "price", "$99")}</p>
              <span className="plan-period" data-plan-period="">{show("pro", "period", "/ month")}</span>
              <p className="plan-billing-note" data-billing-note="">{show("pro", "note", "Billed monthly")}</p>
              <label className="seat-picker">
                {"Seats "}
                <input type="number" min="3" max="500" step="1" defaultValue="3" data-plan-seats="" aria-label="Pro seats" id="inp-pro-seats" {...seatInput("pro")} />
                <span data-seat-note="">{show("pro", "seatNote", "3 included, then $15 / seat / month")}</span>
              </label>
              <a data-plan-checkout="" className="site-button" id="lnk-go-pro" {...checkout("pro", "https://verse.ctruh.com/pricing?plan=pro&period=month")}>
                Go Pro
                <span aria-hidden="true" />
              </a>
              <ul className="check-list">
                <li>50 GB storage, 70 GB bandwidth a month</li>
                <li>500,000 API calls a month</li>
                <li>15 Verse Homes and 15 films a month</li>
                <li>5 room captures, 300 renders a month</li>
                <li>{show("pro", "seatLine", "3 seats, more at $15 / seat / month")}</li>
                <li>Uploads up to 10 GB</li>
                <li>Brand kit, lead capture, voice tours, 4K video</li>
                <li>Priority support</li>
              </ul>
            </article>
            <article className="plan" data-plan-card="scale" id="art-plan-4">
              <h2>Scale</h2>
              <p className="plan-audience">For teams and developers running Verse every day.</p>
              <p className={priceClass("scale")} data-plan-price="">{show("scale", "price", "$499")}</p>
              <span className="plan-period" data-plan-period="">{show("scale", "period", "/ month")}</span>
              <p className="plan-billing-note" data-billing-note="">{show("scale", "note", "Billed monthly")}</p>
              <label className="seat-picker">
                {"Seats "}
                <input type="number" min="10" max="500" step="1" defaultValue="10" data-plan-seats="" aria-label="Scale seats" id="inp-scale-seats" {...seatInput("scale")} />
                <span data-seat-note="">{show("scale", "seatNote", "10 included, then $15 / seat / month")}</span>
              </label>
              <a data-plan-checkout="" className="site-button secondary" id="lnk-choose-scale" {...checkout("scale", "https://verse.ctruh.com/pricing?plan=scale&period=month")}>
                Choose Scale
                <span aria-hidden="true" />
              </a>
              <ul className="check-list">
                <li>250 GB storage, 400 GB bandwidth a month</li>
                <li>4,000,000 API calls a month</li>
                <li>60 Verse Homes and 50 films a month</li>
                <li>10 room captures, 500 renders a month</li>
                <li>{show("scale", "seatLine", "10 seats, more at $15 / seat / month")}</li>
                <li>Uploads up to 20 GB</li>
                <li>Priority builds</li>
                <li>Priority support and 99.5% uptime</li>
              </ul>
            </article>
          </div>
          <p className="source-note">{sourceNote}</p>
          <article className="enterprise-plan" id="art-enterprise-plan">
            <div>
              <p className="eyebrow">ENTERPRISE</p>
              <h2>
                Custom allowances.
                <br />
                Custom possibilities.
              </h2>
            </div>
            <div>
              <strong>
                {"From $2,000 "}
                <small>/ month</small>
              </strong>
              <p className="source-note">Billed annually</p>
              <ul>
                <li>SSO</li>
                <li>White-label</li>
                <li>SLA</li>
              </ul>
            </div>
            <a className="site-button" href="#enterprise" id="lnk-talk-to-us">
              Talk to us
              <span aria-hidden="true">→</span>
            </a>
          </article>
        </div>
      </section>
      <section className="comparison-section content-width section-space" id="sec-comparison-section">
        <header className="section-heading" id="hdr-section-heading">
          <p className="eyebrow">COMPARE</p>
          <h2>
            What each plan
            <br />
            includes.
          </h2>
        </header>
        <div className="comparison-scroll" tabIndex={0} role="region" aria-label="Plan comparison. Scroll horizontally to compare all plans.">
          <table id="cmp">
            <thead>
              <tr>
                <th scope="col" />
                <th scope="col">Free</th>
                <th scope="col">Starter</th>
                <th scope="col">Pro</th>
                <th scope="col">Scale</th>
                <th scope="col">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Storage</th>
                <td className="">1 GB</td>
                <td className="">10 GB</td>
                <td className="">50 GB</td>
                <td className="">250 GB</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Bandwidth / month</th>
                <td className="">2 GB</td>
                <td className="">20 GB</td>
                <td className="">70 GB</td>
                <td className="">400 GB</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">API calls / month</th>
                <td className="">5,000</td>
                <td className="">50,000</td>
                <td className="">500,000</td>
                <td className="">4,000,000</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Verse Homes / month</th>
                <td className="">1</td>
                <td className="">5</td>
                <td className="">15</td>
                <td className="">60</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Films / month</th>
                <td className="">1</td>
                <td className="">5</td>
                <td className="">15</td>
                <td className="">50</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Room captures / month</th>
                <td className="">0</td>
                <td className="">2</td>
                <td className="">5</td>
                <td className="">10</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Renders / month</th>
                <td className="">20</td>
                <td className="">200</td>
                <td className="">300</td>
                <td className="">500</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Seats</th>
                <td className="">1</td>
                <td className="">1 + extra</td>
                <td className="">3 + extra</td>
                <td className="">10 + extra</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">Max upload</th>
                <td className="">500 MB</td>
                <td className="">2 GB</td>
                <td className="">10 GB</td>
                <td className="">20 GB</td>
                <td className="">Custom</td>
              </tr>
              <tr>
                <th scope="row">“Made with Verse” badge</th>
                <td className="">On</td>
                <td className="">Off (small corner mark)</td>
                <td className="">Off (small corner mark)</td>
                <td className="">Off (small corner mark)</td>
                <td className="">White-label option</td>
              </tr>
              <tr>
                <th scope="row">Private links</th>
                <td className="no">—</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <th scope="row">Viewer analytics</th>
                <td className="no">—</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <th scope="row">Brand kit + lead capture</th>
                <td className="no">—</td>
                <td className="no">—</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
                <td className="yes">✓</td>
              </tr>
              <tr>
                <th scope="row">Video export</th>
                <td className="">720p</td>
                <td className="">1080p</td>
                <td className="">4K</td>
                <td className="">4K</td>
                <td className="">4K</td>
              </tr>
              <tr>
                <th scope="row">Pay as you go above the plan</th>
                <td className="no">—</td>
                <td className="">Coming soon</td>
                <td className="">Coming soon</td>
                <td className="">Coming soon</td>
                <td className="">Coming soon</td>
              </tr>
              <tr>
                <th scope="row">Support</th>
                <td className="">Community support</td>
                <td className="">Email support</td>
                <td className="">Priority support</td>
                <td className="">Priority support + 99.5% uptime</td>
                <td className="">Named specialist + SLA</td>
              </tr>
              <tr>
                <th scope="row">Over the limit</th>
                <td className="">Stops, upgrade prompt</td>
                <td className="">Upgrade prompt</td>
                <td className="">Upgrade prompt</td>
                <td className="">Upgrade prompt</td>
                <td className="">Contract</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="usage-pricing page-band" id="sec-usage-pricing">
        <div className="content-width">
          <header className="section-heading" id="hdr-section-heading-2">
            <p className="eyebrow">PAY AS YOU GO · COMING SOON</p>
            <h2>
              Go past your allowance,
              <br />
              pay only for the extra.
            </h2>
            <p>
              On Starter, Pro and Scale you will be able to go past an allowance and pay only for what you use. Coming soon. Until then, reaching an allowance asks you to upgrade; nothing is charged for usage.
            </p>
          </header>
          <dl className="usage-rates">
            <div>
              <dt>Bandwidth</dt>
              <dd>$0.80 per GB</dd>
            </div>
            <div>
              <dt>Storage</dt>
              <dd>$0.25 per GB-month</dd>
            </div>
            <div>
              <dt>API calls</dt>
              <dd>$0.20 per 10,000</dd>
            </div>
            <div>
              <dt>Verse Home</dt>
              <dd>$1.00 each</dd>
            </div>
            <div>
              <dt>Film</dt>
              <dd>$0.75 each</dd>
            </div>
            <div>
              <dt>Room capture</dt>
              <dd>$2.00 each</dd>
            </div>
            <div>
              <dt>Render</dt>
              <dd>$0.02 each</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="broker-packs content-width section-space" id="packs">
        <header className="section-heading" id="hdr-section-heading-3">
          <p className="eyebrow">BROKER PACKS</p>
          <h2>
            Prepaid homes and films,
            <br />
            made for WhatsApp.
          </h2>
          <p>One-time packs, used after your plan’s monthly allowance. They never expire.</p>
        </header>
        <div className="pack-grid">
          <article id="art-item">
            <h3>Broker pack 10</h3>
            <p>10 Verse Homes + 10 films, one payment.</p>
            <strong>
              $12
              <small>{" once"}</small>
            </strong>
            <a className="site-button secondary" href="https://verse.ctruh.com/pricing#packs" id="lnk-buy-pack">
              Buy pack
              <span aria-hidden="true" />
            </a>
          </article>
          <article id="art-item-2">
            <h3>Broker pack 50</h3>
            <p>50 Verse Homes + 50 films, one payment.</p>
            <strong>
              $59
              <small>{" once"}</small>
            </strong>
            <a className="site-button secondary" href="https://verse.ctruh.com/pricing#packs" id="lnk-buy-pack-2">
              Buy pack
              <span aria-hidden="true" />
            </a>
          </article>
        </div>
      </section>
      <section className="enterprise-live content-width section-space" id="enterprise">
        <div>
          <p className="eyebrow">ENTERPRISE</p>
          <h2>
            Talk to
            <br />
            <span>a specialist.</span>
          </h2>
          <p>
            Custom allowances and seats: SSO, a custom domain, a white-label viewer and an SLA. Tell us a little about your team and a specialist will call you.
          </p>
          <a className="site-button" href="https://verse.ctruh.com/pricing#enterprise" id="lnk-request-a-callback">
            Request a callback
            <span aria-hidden="true" />
          </a>
          <p className="form-note">Continue on Verse to submit your callback request.</p>
        </div>
        <aside id="asd-item">
          <h3>
            A real person.
            <br />
            Within 30 minutes.
          </h3>
          <p>
            During business hours (IST 10:00–19:00, PT 9:00–18:00, Mon–Fri) a specialist calls you within 30 minutes; otherwise by 10:00 next business day.
          </p>
          <dl>
            <div>
              <dt>Bengaluru</dt>
              <dd>IST 10:00–19:00</dd>
            </div>
            <div>
              <dt>San Francisco</dt>
              <dd>PT 9:00–18:00</dd>
            </div>
          </dl>
          <span>Monday – Friday</span>
        </aside>
      </section>
      <section className="faq-layout content-width section-space" id="sec-faq-layout">
        <header className="section-heading" id="hdr-section-heading-4">
          <p className="eyebrow">FAQ</p>
          <h2>
            Questions,
            <br />
            answered.
          </h2>
        </header>
        <div className="page-faq">
          <details open id="dtl-item">
            <summary id="sum-can-i-try-verse-without-paying">
              Can I try Verse without paying?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes. Every new account gets a 14-day trial with Pro features (5 GB storage, 3 Verse Homes, 3 films and more), then moves to Free. Free has no time limit: 1 GB storage, 1 Verse Home and 1 film a month.
            </p>
          </details>
          <details id="dtl-item-2">
            <summary id="sum-what-happens-when-my-trial-ends">
              What happens when my trial ends?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              You move to Free. Nothing is deleted and your scenes keep opening; creating more needs a plan. Upgrade during the trial for 25% off your first 3 months on monthly plans or 20% off your first year on annual plans.
            </p>
          </details>
          <details id="dtl-item-3">
            <summary id="sum-what-happens-when-i-reach-an-allowance">
              What happens when I reach an allowance?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              We tell you at 80% and again at 100%. At 100% that action stops until you upgrade or your month resets. Published scenes never break: if bandwidth runs out on Free, viewers get a lighter version and you see a notice.
            </p>
          </details>
          <details id="dtl-item-4">
            <summary id="sum-what-is-pay-as-you-go">
              What is pay-as-you-go?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              On paid plans you will be able to go past an allowance and pay only for the extra. It is coming soon; until then, reaching an allowance asks you to upgrade and nothing extra is charged.
            </p>
          </details>
          <details id="dtl-item-5">
            <summary id="sum-what-are-broker-packs">
              What are broker packs?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              One-time prepaid packs of Verse Homes and films, made for WhatsApp: 10 homes and 10 films for $12, or 50 of each for $59. They are used after your plan’s monthly allowance and do not expire.
            </p>
          </details>
          <details id="dtl-item-6">
            <summary id="sum-what-does-annual-billing-save">
              What does annual billing save?
              <span aria-hidden="true">+</span>
            </summary>
            <p>Annual is billed as 10 months: two months free on every plan.</p>
          </details>
          <details id="dtl-item-7">
            <summary id="sum-how-do-extra-seats-work">
              How do extra seats work?
              <span aria-hidden="true">+</span>
            </summary>
            <p>Starter includes 1 seat, Pro 3 and Scale 10. Each extra seat is $15 a month (10× that billed annually).</p>
          </details>
          <details id="dtl-item-8">
            <summary id="sum-do-my-viewers-need-a-plan">
              Do my viewers need a plan?
              <span aria-hidden="true">+</span>
            </summary>
            <p>No. Anyone can open a published scene on any phone or laptop, whatever plan its owner is on.</p>
          </details>
          <details id="dtl-item-9">
            <summary id="sum-what-happens-if-i-cancel-or-downgrade">
              What happens if I cancel or downgrade?
              <span aria-hidden="true">+</span>
            </summary>
            <p>You keep your plan until the end of the period you paid for, then move to the lower plan. Your scenes stay online.</p>
          </details>
          <details id="dtl-item-10">
            <summary id="sum-what-if-a-payment-fails">
              What if a payment fails?
              <span aria-hidden="true">+</span>
            </summary>
            <p>We retry, and your plan keeps working for 7 days while you update your card. After that the account moves to Free.</p>
          </details>
          <details id="dtl-item-11">
            <summary id="sum-i-subscribed-before-these-plans-what-cha">
              I subscribed before these plans. What changes?
              <span aria-hidden="true">+</span>
            </summary>
            <p>Nothing you pay. Existing subscriptions keep their plan and price, and get the new allowances wherever those are higher.</p>
          </details>
          <details id="dtl-item-12">
            <summary id="sum-which-currency-will-i-pay-in">
              Which currency will I pay in?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Customers in India pay in rupees (cards, UPI, net banking); everyone else pays in US dollars. Checkout is run by our payment partner Dodo Payments, the merchant of record, which adds the right sales tax, VAT or GST for your country and issues the invoice.
            </p>
          </details>
          <details id="dtl-item-13">
            <summary id="sum-can-i-use-a-discount-code">
              Can I use a discount code?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes. Enter it at checkout, or open a link with the code in it. One code per purchase unless the code says it can be combined.
            </p>
          </details>
          <details id="dtl-item-14">
            <summary id="sum-can-i-get-a-refund">
              Can I get a refund?
              <span aria-hidden="true">+</span>
            </summary>
            <p>Yes, within 7 days of your first payment or of an annual renewal. See the refund policy at /refunds.</p>
          </details>
        </div>
      </section>
      <p className="checkout-legal content-width">
        {"Prices exclude taxes, which are added at checkout where they apply. Payments are processed by Dodo Payments, our merchant of record. Subscribing means you agree to the "}
        <a href="https://verse.ctruh.com/terms" id="lnk-terms-2">Terms</a>
        {", the "}
        <a href="https://verse.ctruh.com/privacy" id="lnk-privacy-policy">Privacy policy</a>
        {" and the "}
        <a href="https://verse.ctruh.com/refunds" id="lnk-refund-policy">Refund policy</a>
        .
      </p>
    </>
  );
}
