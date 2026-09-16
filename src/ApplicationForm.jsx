import { useState, useEffect } from 'react'
import { extractDocumentFields } from './lib/gemini'

const FIELD_ORDER = [
  'Full Name', 'Date of Birth', 'Gender', 'Aadhaar Number', 'Mobile Number',
  "Father's or Husband's Name", 'Address', 'Village', 'District', 'State',
  'Bank Account Number', 'IFSC Code', 'Bank Name',
  'Land/Khasra/Khatauni Number', 'Annual Income', 'Category',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ApplicationForm({ schemes, onClose, onRetryLoadSchemes }) {
  const [selectedSchemeId, setSelectedSchemeId] = useState(schemes[0]?.id || '')
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [fields, setFields] = useState(null)
  const [notes, setNotes] = useState(null)
  const [error, setError] = useState(null)
  const [consentGiven, setConsentGiven] = useState(false)

  const selectedScheme = schemes.find((s) => s.id === selectedSchemeId)

  function revokePreviews() {
    previews.forEach((url) => URL.revokeObjectURL(url))
  }

  function handleClose() {
    revokePreviews()
    onClose()
  }

  useEffect(() => {
    if (!selectedSchemeId && schemes.length > 0) {
      setSelectedSchemeId(schemes[0].id)
    }
  }, [schemes, selectedSchemeId])

  function handleFileChange(e) {
    revokePreviews()
    const selected = Array.from(e.target.files || [])
    setFiles(selected)
    setPreviews(selected.map((f) => URL.createObjectURL(f)))
    setFields(null)
    setError(null)
  }

  async function handleExtract() {
    if (files.length === 0 || !selectedScheme) return
    setExtracting(true)
    setError(null)
    try {
      const images = await Promise.all(
        files.map(async (f) => ({ base64: await fileToBase64(f), mimeType: f.type }))
      )
      const docs = Array.isArray(selectedScheme.documents_required)
        ? selectedScheme.documents_required
        : [selectedScheme.documents_required]
      const result = await extractDocumentFields(images, selectedScheme.scheme_name, docs)
      setFields(result.extracted || {})
      setNotes(result.notes || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setExtracting(false)
    }
  }

  function handleFieldChange(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleDownload() {
    const lines = [
      `Application Summary - ${selectedScheme.scheme_name}`,
      '='.repeat(40),
      '',
      ...FIELD_ORDER.map((k) => `${k}: ${fields?.[k] || '(not filled)'}`),
      '',
      'Documents required:',
      ...(Array.isArray(selectedScheme.documents_required) ? selectedScheme.documents_required : [selectedScheme.documents_required]).map((d) => `- ${d}`),
      '',
      `How to apply: ${selectedScheme.how_to_apply}`,
      '',
      'Note: This is a pre-filled summary to help you apply. Please review all details',
      'for accuracy and submit through the official channel listed above - this form',
      'is not an official government submission.',
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedScheme.id}-application-summary.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Apply for a Scheme</h2>
          <button style={styles.closeBtn} onClick={handleClose}>✕</button>
        </div>

        <p style={styles.disclaimer}>
          Your document photos are sent directly to Google's Gemini AI to read the text - they are never stored on our
          servers. However, this app uses Gemini's <strong>free tier</strong>, and Google's terms for the free tier
          allow submitted content to be used to improve Google's products, with possible human review. This is
          different from a paid tier, which guarantees no such use. Please avoid uploading Aadhaar or other highly
          sensitive documents unless you're comfortable with this, or use a document that doesn't show your full ID
          number where possible.
        </p>

        <label style={styles.consentRow}>
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
          />
          <span>I understand and want to continue</span>
        </label>

        {!consentGiven && (
          <p style={styles.consentHint}>Please check the box above to enable document upload.</p>
        )}

        <fieldset disabled={!consentGiven} style={styles.fieldset}>
        {schemes.length === 0 ? (
          <div>
            <p style={styles.consentHint}>Scheme list didn't load. This can happen after a one-time network hiccup.</p>
            <button className="ym-cta" style={styles.extractBtn} onClick={onRetryLoadSchemes}>
              Retry Loading Schemes
            </button>
          </div>
        ) : (
          <>
        <label style={styles.label}>Which scheme are you applying for?</label>
        <select
          style={styles.select}
          value={selectedSchemeId}
          onChange={(e) => { setSelectedSchemeId(e.target.value); setFields(null) }}
        >
          {schemes.map((s) => (
            <option key={s.id} value={s.id}>{s.scheme_name}</option>
          ))}
        </select>

        {selectedScheme && (
          <p style={styles.docsHint}>
            Typically needed: {Array.isArray(selectedScheme.documents_required) ? selectedScheme.documents_required.join(', ') : selectedScheme.documents_required}
          </p>
        )}

        <label style={styles.label}>Upload document photos</label>
        <input type="file" accept="image/*" multiple onChange={handleFileChange} style={styles.fileInput} />

        {previews.length > 0 && (
          <div style={styles.previewRow}>
            {previews.map((src, i) => (
              <img key={i} src={src} alt={`document ${i + 1}`} style={styles.previewImg} />
            ))}
          </div>
        )}

        <button
          className="ym-cta"
          style={styles.extractBtn}
          onClick={handleExtract}
          disabled={files.length === 0 || extracting}
        >
          {extracting ? 'Reading documents...' : 'Extract & Fill Details'}
        </button>

        {error && <p style={styles.errorText}>⚠️ {error}</p>}
        {notes && <p style={styles.notesText}>Note: {notes}</p>}

        {fields && (
          <div style={styles.formSection}>
            <h3 style={styles.formTitle}>Review your details (edit anything that's wrong)</h3>
            {FIELD_ORDER.map((key) => (
              <div key={key} style={styles.fieldRow}>
                <label style={styles.fieldLabel}>{key}</label>
                <input
                  style={styles.fieldInput}
                  value={fields[key] || ''}
                  placeholder="Not found - fill manually"
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                />
              </div>
            ))}
            <button className="ym-cta" style={styles.downloadBtn} onClick={handleDownload}>
              Download Application Summary
            </button>
          </div>
        )}
          </>
        )}
        </fieldset>

        <p style={styles.autoSubmitNote}>
          Note: this creates a summary for you to review and submit yourself - it does not submit anything to the
          government automatically.
        </p>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(20,83,45,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px', zIndex: 50,
  },
  modal: {
    background: 'var(--color-cream)', borderRadius: '16px', padding: '20px',
    maxWidth: '480px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
    fontFamily: 'var(--font-body)',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  title: { margin: 0, fontSize: '19px', color: 'var(--color-forest)', fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--color-charcoal-soft)' },
  disclaimer: { fontSize: '12.5px', color: 'var(--color-charcoal-soft)', lineHeight: 1.5, marginBottom: '10px' },
  consentRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-forest)', marginBottom: '4px', cursor: 'pointer' },
  consentHint: { fontSize: '12px', color: '#b00020', margin: '0 0 12px' },
  fieldset: { border: 'none', padding: 0, margin: 0 },
  autoSubmitNote: { fontSize: '11.5px', color: 'var(--color-charcoal-soft)', marginTop: '14px', fontStyle: 'italic' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--color-forest)', margin: '10px 0 5px' },
  select: { width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.25)', fontSize: '14px', fontFamily: 'inherit' },
  docsHint: { fontSize: '12px', color: 'var(--color-charcoal-soft)', marginTop: '6px' },
  fileInput: { display: 'block', width: '100%', fontSize: '13px' },
  previewRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0' },
  previewImg: { width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(20,83,45,0.2)' },
  extractBtn: {
    marginTop: '14px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: 'var(--color-forest)', color: 'var(--color-cream)', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
  errorText: { color: '#b00020', fontSize: '13px', marginTop: '10px' },
  notesText: { color: '#6b4d0f', fontSize: '12.5px', marginTop: '10px', background: '#f5e6c8', padding: '8px 10px', borderRadius: '8px' },
  formSection: { marginTop: '18px', borderTop: '1px solid rgba(20,83,45,0.12)', paddingTop: '14px' },
  formTitle: { fontSize: '14px', color: 'var(--color-forest)', margin: '0 0 10px' },
  fieldRow: { marginBottom: '9px' },
  fieldLabel: { display: 'block', fontSize: '12px', color: 'var(--color-charcoal-soft)', marginBottom: '3px' },
  fieldInput: { width: '100%', padding: '8px 9px', borderRadius: '7px', border: '1px solid rgba(20,83,45,0.2)', fontSize: '13.5px', fontFamily: 'inherit' },
  downloadBtn: {
    marginTop: '10px', width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: 'var(--color-marigold-dark)', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  },
}
