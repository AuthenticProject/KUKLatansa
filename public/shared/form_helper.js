/**
 * form_helper.js
 * Logic for KUK Public Forms
 */

const FormHelper = (() => {
  const SUBMISSIONS_KEY = 'kuk_public_submissions';

  // Make sure MasterDB is available, otherwise alert
  function checkDependencies() {
    if (typeof MasterDB === 'undefined') {
      console.warn("MasterDB is not loaded. Ensure shared/master_db.js is included.");
      return false;
    }
    return true;
  }

  function populateEmployeeDropdown(selectId) {
    if (!checkDependencies()) return;
    
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Default option
    select.innerHTML = '<option value="">-- Pilih Nama Karyawan --</option>';
    
    const emps = MasterDB.getEmployees().filter(e => e.status === 'Active');
    
    // Sort alphabetically
    emps.sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    emps.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `${e.fullName} (${e.unit} - ${e.position})`;
      select.appendChild(opt);
    });
  }

  function generateRef(module) {
    const prefix = module.substring(0, 3).toUpperCase();
    const ran = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${Date.now().toString().slice(-4)}-${ran}`;
  }

  function validateForm(formId) {
    const form = document.getElementById(formId);
    let isValid = true;
    
    // Simple HTML5 validation fallback wrapper + custom class handling
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
      const group = input.closest('.form-group');
      if (!input.value.trim()) {
        if(group) group.classList.add('has-error');
        isValid = false;
      } else {
        if(group) group.classList.remove('has-error');
      }
    });
    
    return isValid;
  }

  function submitForm(formId, moduleName, buildPayload) {
    if (!validateForm(formId)) {
      alert("Mohon lengkapi semua field yang wajib diisi (berwarna merah).");
      return;
    }

    const btn = document.querySelector('#' + formId + ' .btn-submit');
    const spinner = btn.querySelector('.spinner');
    const btnText = btn.querySelector('.btn-text');
    
    // Loading State
    btn.disabled = true;
    if(spinner) spinner.style.display = 'inline-block';
    if(btnText) btnText.textContent = 'Memproses...';

    // Build Payload
    const payload = buildPayload();
    payload.refNumber = generateRef(moduleName);
    payload.module = moduleName;
    payload.timestamp = new Date().toISOString();

    // Simulate network delay
    setTimeout(() => {
      try {
        const subs = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]');
        subs.push(payload);
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));
        
        showSuccess(payload.refNumber);
      } catch (e) {
        showError(e.message);
      }
    }, 1500);
  }

  function showSuccess(ref) {
    document.getElementById('formPanel').classList.remove('active');
    const successPanel = document.getElementById('successPanel');
    successPanel.classList.add('active');
    document.getElementById('refNumberDisplay').textContent = ref;
  }

  function showError(msg) {
    document.getElementById('formPanel').classList.remove('active');
    const errorPanel = document.getElementById('errorPanel');
    errorPanel.classList.add('active');
    if(msg) {
      document.getElementById('errorMsgDisplay').textContent = msg;
    }
  }

  function resetForm(formId) {
    document.getElementById(formId).reset();
    document.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    
    document.getElementById('successPanel').classList.remove('active');
    document.getElementById('errorPanel').classList.remove('active');
    document.getElementById('formPanel').classList.add('active');
    
    const btn = document.querySelector('#' + formId + ' .btn-submit');
    if(btn) {
      btn.disabled = false;
      const spinner = btn.querySelector('.spinner');
      const btnText = btn.querySelector('.btn-text');
      if(spinner) spinner.style.display = 'none';
      if(btnText) btnText.textContent = 'Kirim Pengajuan';
    }
  }

  return {
    populateEmployeeDropdown,
    submitForm,
    resetForm
  };
})();
