'use client'
import { useState, useRef } from 'react'

type State = 'idle' | 'uploading' | 'done' | 'error'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export function ImportClient() {
  const [state, setState] = useState<State>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    if (!file) return
    setState('uploading')
    setErrorMsg('')

    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/import', {
        method: 'POST',
        body: form,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `Upload failed (${res.status})`)
      }

      const data: ImportResult = await res.json()
      setResult(data)
      setState('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('error')
    }
  }

  return (
    <>
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif', fontSize: 36,
        fontWeight: 700, color: '#fff', marginBottom: 8,
      }}>
        Import from Goodreads
      </h1>
      <div style={{ fontSize: 13, color: '#567', marginBottom: 40 }}>
        Bring your reading history into Shelf.
      </div>

      {(state === 'idle' || state === 'error') && (
        <div style={{
          background: '#1c2028', borderRadius: 6, padding: 32,
        }}>
          <div style={{ fontSize: 14, color: '#9ab', lineHeight: 1.7, marginBottom: 24 }}>
            Export your Goodreads library from{' '}
            <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer"
              style={{ color: '#C4603A', textDecoration: 'none', fontWeight: 600 }}>
              goodreads.com/review/import
            </a>
            , then upload the CSV file here.
          </div>

          <div style={{
            border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 6,
            padding: 32, textAlign: 'center', marginBottom: 24,
            cursor: 'pointer',
          }} onClick={() => inputRef.current?.click()}>
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <div style={{ fontSize: 14, color: '#ccc', fontWeight: 600, marginBottom: 4 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: '#567' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 14, color: '#789', marginBottom: 4 }}>
                  Click to select a CSV file
                </div>
                <div style={{ fontSize: 12, color: '#456' }}>
                  Maximum 500 books per import
                </div>
              </div>
            )}
          </div>

          {state === 'error' && errorMsg && (
            <div style={{ fontSize: 13, color: '#c44', marginBottom: 16, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file}
            style={{
              background: file ? '#C4603A' : 'rgba(255,255,255,0.07)',
              color: file ? '#fff' : '#567',
              border: 'none', borderRadius: 4,
              padding: '10px 28px', fontSize: 13, fontWeight: 700,
              fontFamily: 'inherit',
              cursor: file ? 'pointer' : 'not-allowed',
              transition: 'background 0.15s',
            }}
          >
            Import Books
          </button>
        </div>
      )}

      {state === 'uploading' && (
        <div style={{
          background: '#1c2028', borderRadius: 6, padding: 48,
          textAlign: 'center',
        }}>
          <div style={{
            width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: '#C4603A', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <div style={{ fontSize: 15, color: '#ccc', fontWeight: 600, marginBottom: 6 }}>
            Importing your books...
          </div>
          <div style={{ fontSize: 13, color: '#567' }}>
            This may take a few minutes for large libraries. Please keep this tab open.
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {state === 'done' && result && (
        <div style={{
          background: '#1c2028', borderRadius: 6, padding: 32,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#567', textTransform: 'uppercase', marginBottom: 20,
          }}>
            Import Complete
          </div>

          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#C4603A' }}>
                {result.imported}
              </div>
              <div style={{ fontSize: 12, color: '#567' }}>imported</div>
            </div>
            <div>
              <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#789' }}>
                {result.skipped}
              </div>
              <div style={{ fontSize: 12, color: '#567' }}>skipped</div>
            </div>
            {result.errors.length > 0 && (
              <div>
                <div style={{ fontSize: 32, fontFamily: 'Cormorant Garamond, serif', fontWeight: 700, color: '#c44' }}>
                  {result.errors.length}
                </div>
                <div style={{ fontSize: 12, color: '#567' }}>errors</div>
              </div>
            )}
          </div>

          {result.errors.length > 0 && (
            <div style={{
              background: 'rgba(204,68,68,0.08)', borderRadius: 4,
              padding: 16, marginBottom: 24, maxHeight: 200, overflowY: 'auto',
            }}>
              {result.errors.map((err, i) => (
                <div key={i} style={{ fontSize: 12, color: '#c88', marginBottom: 4 }}>
                  {err}
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/journal" style={{
              background: '#C4603A', color: '#fff', border: 'none',
              borderRadius: 4, padding: '10px 24px', fontSize: 13,
              fontWeight: 700, textDecoration: 'none', fontFamily: 'inherit',
            }}>
              View Journal
            </a>
            <button onClick={() => {
              setState('idle')
              setFile(null)
              setResult(null)
            }} style={{
              background: 'rgba(255,255,255,0.07)', color: '#9ab',
              border: 'none', borderRadius: 4, padding: '10px 20px',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              cursor: 'pointer',
            }}>
              Import More
            </button>
          </div>
        </div>
      )}
    </>
  )
}
