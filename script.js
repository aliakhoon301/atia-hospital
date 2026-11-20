
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyY_67COuUfnqy29S9b1r-kG3zDBUNs3k9MKgAG2oHNvHO-4pt1OOh9GuySvUP-iMFR/exec";
    const DOCS = [
      { n: "Dr. Safia Zafar", s: "Anesthesiologist", q: "MCPS", y: 9, f: "Rs 1,500" },
      { n: "Dr. Zahid Iqbal", s: "Dermatologist", q: "MCPS", y: 9, f: "Rs 1,500" },
      { n: "Dr. Talat Sultan", s: "Pediatrician", q: "DCH", y: 9, f: "Rs 3,500" },
      { n: "Dr. Kelash C Dhanani", s: "Chest Specialist", q: "abc", y: 9, f: "Rs 1,200" },
      { n: "Dr. Shaheen Zaffar", s: "Gynecologist", q: "", y: 20, f: "Rs 1,800" },
      { n: "Dr. Uzma Riaz", s: "Gynecologist", q: "", y: 20, f: "Ask at reception" },
      { n: "Dr. Muhammd Kamran", s: "Pediatrician", q: "", y: 10, f: "Ask at reception" }
    ];
    const $ = id => document.getElementById(id);
    const sel = $("sp");
    [...new Set(DOCS.map(d => d.s))].sort().forEach(s => sel.add(new Option(s, s)));
    function render() {
      const q = $("q").value.trim().toLowerCase(), s = sel.value;
      const r = DOCS.filter(d => (!s || d.s === s) && d.n.toLowerCase().includes(q));
      $("empty").hidden = r.length > 0;
      $("list").innerHTML = r.map(d => {
        const i = d.n.replace("Dr. ", "").split(" ").map(w => w[0]).join("");
        return `<div class="card doc">
          <div class="av">${i}</div>
        <h3>${d.n}</h3>
        <span class="tag">${d.s}</span>
    <div class="meta">${d.q ? d.q + " · " : ""}${d.y ? d.y + " yr" + (d.y > 1 ? "s" : "") + " experience" : "Experience not listed"}</div>
    <div class="meta">Atia General Hospital, Malir</div><div class="fee">${d.f}</div>
    <button class="btn p" data-n="${d.n}">Book appointment</button></div>`
      }).join("");
    }
    $("q").oninput = render; sel.onchange = render; render();
    const dlg = $("dlg");
const FORM_HTML = dlg.innerHTML;
let cur = "", busy = false;
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const booked = () => { try { return JSON.parse(localStorage.getItem("atia_booked") || "[]"); } catch (e) { return []; } };
const remember = k => { try { localStorage.setItem("atia_booked", JSON.stringify([...booked(), k])); } catch (e) {} };
const keyOf = (phone, doc, name) => phone.replace(/\D/g, "") + "|" + doc + "|" + name.toLowerCase().replace(/\s+/g, " ").trim();
const showMsg = (html, err) => { $("msg").innerHTML = '<div class="ok"' + (err ? ' style="color:#c0392b"' : '') + '>' + html + '</div>'; };

$("list").onclick = e => {
  const b = e.target.closest("button"); if (!b) return;
  dlg.innerHTML = FORM_HTML; cur = b.dataset.n;
  $("dn").textContent = "with " + cur;
  $("dt").min = new Date().toISOString().slice(0, 10);
  dlg.showModal();
};

function thanks(d) {
  dlg.innerHTML = '<h3 style="margin:0">Thank you, ' + esc(d.name) + '!</h3>' +
    '<p class="meta">Your appointment request with <b>' + esc(d.doctor) + '</b>' +
    (d.date ? ' for <b>' + esc(d.date) + '</b>' : '') +
    ' has been received. The hospital will call you on ' + esc(d.phone) + ' to confirm.</p>' +
    '<div class="row"><button class="btn p" data-close>Close</button></div>';
}

dlg.addEventListener("click", async e => {
  const t = e.target;
  if (t.id === "cx" || t.hasAttribute("data-close")) { dlg.close(); return; }
  if (t.id !== "go" || busy) return;

  const data = { doctor: cur, name: $("pn").value.trim(), phone: $("ph").value.trim(),
                 date: $("dt").value, reason: $("nt").value.trim() };
  if (!data.name || !data.phone) { showMsg("Please enter your name and phone.", true); return; }

  const k = keyOf(data.phone, cur, data.name);
if (booked().includes(k)) { showMsg("This patient has already requested an appointment with " + esc(cur) + ".", true); return; }

  busy = true; t.disabled = true; t.textContent = "Sending…";
  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(data) });
    const out = await res.json();
    if (out.ok) { remember(k); thanks(data); }
    else if (out.error === "duplicate") showMsg("This phone number already has a request with " + esc(cur) + ". Please call the hospital to change it.", true);
    else throw new Error(out.error);
  } catch (err) {
    showMsg("Could not send your request. Please call the hospital.", true);
  } finally {
    busy = false;
    if (t.isConnected) { t.disabled = false; t.textContent = "Send request"; }
  }
});