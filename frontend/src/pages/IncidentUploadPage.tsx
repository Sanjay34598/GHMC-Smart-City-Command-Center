import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { ShieldAlert, XCircle, FileText } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { FormField } from '@/components/forms/FormField'
import { Dropdown } from '@/components/forms/Dropdown'
import { LocationPicker } from '@/components/forms/LocationPicker'
import { ProgressBar } from '@/components/forms/ProgressBar'
import { SubmitButton } from '@/components/forms/SubmitButton'
import { RootLayout } from '@/components/layout/RootLayout'
import { createIncident } from '@/lib/incidents'

const categories = [
  'Fire',
  'Flood',
  'Earthquake',
  'Road Accident',
  'Building Collapse',
  'Landslide',
  'Other',
]

const schema = z.object({
  title: z.string().trim().min(3, 'Use at least 3 characters.').max(160),
  description: z.string().trim().min(10, 'Add at least 10 characters.').max(5000),
  category: z.string().min(1, 'Select an incident category.'),
  severity: z.string().min(1, 'Select an emergency level.'),
  latitude: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90.')
    .max(90, 'Latitude must be between -90 and 90.'),
  longitude: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180.')
    .max(180, 'Longitude must be between -180 and 180.'),
  image: z
    .instanceof(File, { message: 'Upload an incident image.' })
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
      'Use a JPG, PNG, or WEBP image.',
    )
    .refine((file) => file.size <= 10 * 1024 * 1024, 'Image must not exceed 10 MB.'),
})

type IncidentForm = z.infer<typeof schema>

const inputClass =
  'h-11 w-full border border-border bg-primary px-3 text-xs text-textPrimary font-mono uppercase tracking-widest placeholder:text-textSecondary focus:outline-none focus:border-info transition-colors'

export function IncidentUploadPage() {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [locationLoading, setLocationLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    resetField,
    control,
    formState: { errors, isSubmitting },
  } = useForm<IncidentForm>({ resolver: zodResolver(schema), defaultValues: { category: '', severity: '' } })

  const image = useWatch({ control, name: 'image' })

  const submit = async (values: IncidentForm) => {
    setSubmitError(null)
    setProgress(0)
    try {
      const data = await createIncident(values, setProgress)
      navigate(`/incidents/${data.id}`)
    } catch (error) {
      const detail =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined
      setSubmitError(detail ?? 'We could not submit your report. Please try again.')
      setProgress(0)
    }
  }

  const locate = (latitude: number, longitude: number) => {
    setValue('latitude', latitude, { shouldValidate: true })
    setValue('longitude', longitude, { shouldValidate: true })
    setLocationLoading(false)
  }

  const RightContextPanel = (
    <div className="flex flex-col h-full bg-panel text-textPrimary">
      <div className="p-4 border-b border-border bg-[#1A202C]">
        <h3 className="text-[10px] font-bold text-textSecondary uppercase tracking-widest flex items-center gap-2">
          <FileText className="size-3" /> Report Guidelines
        </h3>
      </div>
      <div className="p-5 space-y-4 text-xs text-textSecondary leading-relaxed">
        <p>Ensure that all submitted images clearly show the extent of the damage or incident without obstructing critical details.</p>
        <p>Location coordinates are automatically populated when you pick a spot on the map, ensuring precise GIS tracking.</p>
        <p className="border-l-2 border-critical pl-3 py-1 bg-critical/5 text-critical font-bold">For immediate life-threatening emergencies, bypass this system and directly dispatch units via the Command Center.</p>
      </div>
    </div>
  )

  return (
    <RootLayout rightPanel={RightContextPanel}>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <header className="border-b border-border pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight text-textPrimary flex items-center gap-3">
            File Incident Report
          </h1>
          <p className="text-xs font-bold text-textSecondary uppercase tracking-widest mt-1">Manual Entry & Evidence Upload</p>
        </header>

        <form onSubmit={handleSubmit(submit)} className="panel p-6" noValidate>
          <div className="grid gap-6 sm:grid-cols-2">
            <FormField id="title" label="Incident Title" error={errors.title?.message}>
              <input id="title" placeholder="Brief descriptor" className={inputClass} {...register('title')} />
            </FormField>
            <FormField id="category" label="Category" error={errors.category?.message}>
              <Dropdown
                id="category"
                error={Boolean(errors.category)}
                options={[
                  { label: 'Select category', value: '' },
                  ...categories.map((item) => ({ label: item, value: item })),
                ]}
                {...register('category')}
              />
            </FormField>
          </div>

          <div className="mt-6">
            <FormField id="description" label="Description" hint="Factual details for responders." error={errors.description?.message}>
              <textarea id="description" rows={4} placeholder="Operational details" className={`${inputClass} h-auto py-3`} {...register('description')} />
            </FormField>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <FormField id="severity" label="Severity Level" error={errors.severity?.message}>
              <Dropdown
                id="severity"
                error={Boolean(errors.severity)}
                options={[
                  { label: 'Select emergency level', value: '' },
                  ...['Low', 'Medium', 'High', 'Critical'].map((item) => ({ label: item, value: item })),
                ]}
                {...register('severity')}
              />
            </FormField>
            <div className="pt-7">
              <LocationPicker
                isLoading={locationLoading}
                onLocation={locate}
                onError={(message) => {
                  setError('latitude', { message })
                  setLocationLoading(false)
                }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <FormField id="latitude" label="Latitude" error={errors.latitude?.message}>
              <input id="latitude" inputMode="decimal" placeholder="e.g. 17.3850" className={inputClass} {...register('latitude', { valueAsNumber: true })} />
            </FormField>
            <FormField id="longitude" label="Longitude" error={errors.longitude?.message}>
              <input id="longitude" inputMode="decimal" placeholder="e.g. 78.4867" className={inputClass} {...register('longitude', { valueAsNumber: true })} />
            </FormField>
          </div>

          <div className="mt-8">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-textSecondary">Visual Evidence</p>
            <ImageUploader
              file={image}
              error={errors.image?.message}
              onChange={(file) => setValue('image', file, { shouldValidate: true })}
              onRemove={() => resetField('image')}
            />
          </div>

          {isSubmitting && (
            <div className="mt-8 border border-info/30 bg-info/5 p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-info">System Processing Flow</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Uploading Image Data', active: progress >= 0 },
                  { label: 'Geospatial Location Sync', active: progress >= 10 },
                  { label: 'Category Classification', active: progress >= 30 },
                  { label: 'YOLOv11 Object Detection', active: progress >= 50 },
                  { label: 'Gemini AI Severity Analysis', active: progress >= 70 },
                  { label: 'Multi-Agent Coordination Protocol', active: progress >= 85 },
                  { label: 'Dispatching Emergency Teams', active: progress >= 95 },
                ].map((step, idx) => (
                  <div key={idx} className={`flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest transition-colors duration-500 ${step.active ? 'text-textPrimary font-bold' : 'text-textSecondary'}`}>
                    <div className={`flex items-center justify-center size-4 rounded-full border ${step.active ? 'border-info bg-info/20' : 'border-border bg-primary'}`}>
                      {step.active && <div className="size-1.5 rounded-full bg-info animate-pulse" />}
                    </div>
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <ProgressBar value={progress} />
              </div>
            </div>
          )}

          {submitError && (
            <div className="mt-6 flex items-start gap-3 border border-critical/30 bg-critical/10 p-4 text-[10px] font-bold uppercase tracking-widest text-critical">
              <XCircle className="size-4 shrink-0" />
              {submitError}
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-border pt-6">
            <SubmitButton isLoading={isSubmitting} />
          </div>
        </form>
      </div>
    </RootLayout>
  )
}
