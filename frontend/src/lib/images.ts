import accidentImg from '@/assets/images/accident.jpg'
import buildingCollapseImg from '@/assets/images/building_collapse.jpeg'
import encroachmentImg from '@/assets/images/encroachment.jpeg'
import fireImg from '@/assets/images/fire.jpeg'
import floodImg from '@/assets/images/flood.jpg'
import garbageOverflowImg from '@/assets/images/garbage_overflow.jpeg'
import illegalParkingImg from '@/assets/images/illegal_parking.jpeg'
import openManholeImg from '@/assets/images/open_manhole.jpeg'
import roadBlockImg from '@/assets/images/road_block.jpg'
import treeFallenImg from '@/assets/images/tree_fallen.jpeg'
import waterLeakImg from '@/assets/images/water_leak.jpg'
import demoPlaceholderImg from '@/assets/images/demo_placeholder.jpg'

import { getImageUrl } from '@/lib/analyses'

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'Fire': fireImg,
  'Flood': floodImg,
  'Garbage Overflow': garbageOverflowImg,
  'Garbage': garbageOverflowImg,
  'Road Block': roadBlockImg,
  'Tree Fallen': treeFallenImg,
  'Water Leak': waterLeakImg,
  'Water Leakage': waterLeakImg,
  'Illegal Parking': illegalParkingImg,
  'Building Collapse': buildingCollapseImg,
  'Open Manhole': openManholeImg,
  'Footpath Encroachment': encroachmentImg,
  'Encroachment': encroachmentImg,
  'Accident': accidentImg,
  'Road Accident': accidentImg,
}

export function getCategoryImage(category: string, userImagePath?: string | null): string {
  // 1. If an uploaded image exists from citizen report (and is not demo_placeholder), return backend URL
  if (userImagePath && userImagePath.trim() && !userImagePath.includes('demo_placeholder')) {
    return getImageUrl(userImagePath)
  }

  // 2. Otherwise automatically display matching category image from assets
  const normCat = (category || '').trim()
  if (CATEGORY_IMAGE_MAP[normCat]) {
    return CATEGORY_IMAGE_MAP[normCat]
  }

  // Case-insensitive match
  const lowerCat = normCat.toLowerCase()
  for (const [key, value] of Object.entries(CATEGORY_IMAGE_MAP)) {
    if (key.toLowerCase() === lowerCat) {
      return value
    }
  }

  // Fallback category asset
  return demoPlaceholderImg
}
