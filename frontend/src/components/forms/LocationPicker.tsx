import { Crosshair } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type LocationPickerProps = { onLocation: (latitude: number, longitude: number) => void; onError: (message: string) => void; isLoading: boolean }
export function LocationPicker({ onLocation, onError, isLoading }: LocationPickerProps) {
  const detect = () => {
    if (!navigator.geolocation) { onError('Location is not available in this browser.'); return }
    navigator.geolocation.getCurrentPosition((position) => onLocation(position.coords.latitude, position.coords.longitude), () => onError('We could not determine your location. Enter coordinates manually.'), { enableHighAccuracy: true, timeout: 10_000 })
  }
  return <Button type="button" variant="secondary" onClick={detect} disabled={isLoading} className="w-full"><Crosshair className="mr-2 size-4 text-accent" />{isLoading ? 'Detecting location…' : 'Detect current location'}</Button>
}
