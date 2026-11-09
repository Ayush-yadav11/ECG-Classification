// The beat explorer: 30 beats from the test file with the network's five class scores.
// data/ecg.json is written by the last cell of ECG_classification.ipynb.

const NAMES = { N: 'normal', S: 'supraventricular ectopic', V: 'ventricular ectopic', F: 'fusion', Q: 'paced or unknown' };
const $ = (id) => document.getElementById(id);
const fmt = (p) => (p >= 0.9995 ? '> 99.9%' : `${(p * 100).toFixed(1)}%`);

function path(vals, w = 560, h = 200, pad = 10) {
  const n = vals.length;
  return vals.map((v, i) => `${i ? 'L' : 'M'}${((i / (n - 1)) * w).toFixed(1)} ${(h - pad - v * (h - 2 * pad)).toFixed(1)}`).join(' ');
}

function trimMean(vals) {
  let end = vals.length;
  for (let i = vals.length - 1; i >= 0; i -= 1) { if (vals[i] > 0.02) { end = Math.min(vals.length, i + 3); break; } }
  return vals.slice(0, end);
}

async function main() {
  const data = await fetch('data/ecg.json').then((r) => r.json());
  const list = $('ex-list');
  const classes = data.classes;
  const rate = data.sample_rate_hz;

  list.innerHTML = data.samples.map((s, i) => {
    const ok = s.label === s.predicted;
    const ms = Math.round((s.signal.length / rate) * 1000);
    const p = s.proba[classes.indexOf(s.predicted)];
    return `<li class="ui-win__row${i === 13 ? ' is-sel' : ''}" data-row data-i="${i}" tabindex="0" role="button" aria-label="Beat ${i + 1}, labelled ${s.label}, predicted ${s.predicted}${ok ? '' : ', wrong'}">`
      + `<span class="ui-avatar" data-tone="${classes.indexOf(s.label) + 1}">${s.label}</span>`
      + `<span class="ui-win__txt"><span class="ui-win__who">Beat ${i + 1} · ${NAMES[s.label]}${ok ? '' : '<span class="miss">Missed</span>'}</span><span class="ui-win__sub">${ms} ms · predicted ${s.predicted}, ${fmt(p)}</span></span>`
      + `<span class="ui-win__st">${s.predicted}</span></li>`;
  }).join('');

  const show = (i) => {
    const s = data.samples[i];
    const ok = s.label === s.predicted;
    const top = classes.indexOf(s.predicted);
    $('ex-title').textContent = `Beat ${i + 1} of ${data.samples.length}`;
    $('ex-label').textContent = `labelled ${s.label}, ${NAMES[s.label]}`;
    $('ex-len').textContent = `${Math.round((s.signal.length / rate) * 1000)} ms`;
    $('ex-beat').setAttribute('d', path(s.signal));
    $('ex-mean').setAttribute('d', path(trimMean(data.mean_beats[s.predicted])));
    $('ex-verdict').textContent = `Predicted ${s.predicted}, ${fmt(s.proba[top])} sure`;
    $('ex-ok').textContent = ok ? 'right' : `wrong: it is ${s.label}`;
    $('ex-p').innerHTML = classes.map((c, k) => `<div${k === top ? ' class="is-top"' : ''}><span>${c}</span><i style="--w:${Math.round(s.proba[k] * 100)}%"></i><em>${fmt(s.proba[k])}</em></div>`).join('');
  };
  const pick = (li) => {
    list.querySelectorAll('.is-sel').forEach((el) => el.classList.remove('is-sel'));
    li.classList.add('is-sel');
    show(+li.dataset.i);
  };
  list.addEventListener('click', (e) => { const li = e.target.closest('[data-row]'); if (li) pick(li); });
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const li = e.target.closest('[data-row]');
    if (li) { e.preventDefault(); pick(li); }
  });
}

main().catch((err) => console.error('explorer: could not load data/ecg.json', err));
