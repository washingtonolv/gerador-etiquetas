(() => {
  const feedback = document.createElement('div');
  feedback.className = 'ux-progress no-print';
  feedback.setAttribute('role', 'status');
  feedback.hidden = true;
  document.body.append(feedback);
  let serial = 0;
  function validate(field) {
    if (!(field instanceof HTMLInputElement) || field.type !== 'number') return true;
    const valid = field.validity.valid;
    let error = document.getElementById(field.dataset.uxError || '');
    if (!valid && !error) {
      error = document.createElement('p');
      error.id = 'ux-field-' + (++serial);
      error.className = 'ux-field-error no-print';
      field.dataset.uxError = error.id;
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'),error.id].filter(Boolean).join(' '));
      field.parentElement.after(error);
    }
    field.setAttribute('aria-invalid', String(!valid));
    if(error) { error.hidden = valid; error.textContent = 'Digite um número inteiro entre ' + (field.min || '1') + ' e ' + (field.max || 'o limite indicado') + '.'; }
    return valid;
  }
  document.addEventListener('input', e => validate(e.target));
  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (!button || !/Revisar e imprimir|Abrir impressão|^Imprimir$/.test(button.textContent.trim())) return;
    const invalid = [...document.querySelectorAll('input[type=number]')].find(field => field.getClientRects().length && !validate(field));
    if (invalid) { e.preventDefault(); e.stopImmediatePropagation(); invalid.focus(); }
  }, true);
  window.addEventListener('afterprint', () => {
    feedback.hidden = false;
    feedback.textContent = 'A janela de impressão foi fechada. Se você salvou o PDF, confira o arquivo. Para ajustar as etiquetas ou tentar novamente, continue no editor.';
  });
})();
