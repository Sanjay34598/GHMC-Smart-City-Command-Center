import { useId, useRef, useState } from 'react'
import { ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024

type ImageUploaderProps = { file?: File; error?: string; onChange: (file: File) => void; onRemove: () => void }

export function ImageUploader({ file, error, onChange, onRemove }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const [isDragging, setIsDragging] = useState(false)
  const previewUrl = file ? URL.createObjectURL(file) : undefined
  const selectFile = (candidate?: File) => {
    if (!candidate) return
    onChange(candidate)
  }
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files.item(0) ?? undefined) }
  return <div><input ref={inputRef} id={inputId} type="file" className="sr-only" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} />{file && previewUrl ? <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60"><img src={previewUrl} alt="Selected incident evidence" className="h-56 w-full object-cover" /><div className="flex items-center justify-between gap-4 p-3"><p className="min-w-0 truncate text-sm text-slate-300">{file.name}</p><Button type="button" variant="secondary" onClick={() => { onRemove(); if (inputRef.current) inputRef.current.value = '' }} className="shrink-0 px-3"><Trash2 className="mr-1.5 size-4" />Remove</Button></div></div> : <label htmlFor={inputId} onDragOver={(event) => { event.preventDefault(); setIsDragging(true) }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition ${isDragging ? 'border-accent bg-cyan-400/10' : error ? 'border-red-500 bg-red-500/5' : 'border-slate-700 bg-slate-950/40 hover:border-cyan-400/60 hover:bg-slate-900/80'}`}><span className="grid size-12 place-items-center rounded-full bg-primary/15 text-cyan-300"><UploadCloud className="size-6" /></span><span className="mt-4 font-semibold text-slate-100">Drop an image here, or click to browse</span><span className="mt-2 text-sm text-slate-400">JPG, PNG, or WEBP · up to 10 MB</span><span className="mt-4 inline-flex items-center text-sm font-semibold text-cyan-300"><ImagePlus className="mr-1.5 size-4" />Choose image</span></label>}{error && <p className="mt-2 text-xs font-medium text-red-400" role="alert">{error}</p>}<input type="hidden" value={file ? 'selected' : ''} readOnly />{file && (!ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE) && <p className="mt-2 text-xs font-medium text-red-400">Choose a JPG, PNG, or WEBP image smaller than 10 MB.</p>}</div>
}
