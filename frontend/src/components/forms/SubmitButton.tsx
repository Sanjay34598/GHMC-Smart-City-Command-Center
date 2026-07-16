import { LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">{isLoading ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Submitting report</> : <><Send className="mr-2 size-4" />Submit incident report</>}</Button>
}
