import heroImage from '../assets/hero.png'

export type ProfilePhoto = {
  id: string
  title: string
  src: string
  alt: string
  takenAt?: string
  createdAt?: string
  uploadedAt?: string
  location?: string
  hasVoice: boolean
}

export const mockProfilePhotos: ProfilePhoto[] = [
  {
    id: 'photo-001',
    title: 'First Picnic',
    src: heroImage,
    alt: 'A spring picnic photo saved in Remory',
    takenAt: '2026-04-12',
    uploadedAt: '2026-04-15',
    location: 'Seoul Forest',
    hasVoice: true,
  },
  {
    id: 'photo-002',
    title: 'May Window',
    src: heroImage,
    alt: 'A bright May window memory',
    takenAt: '2025-05-08',
    uploadedAt: '2025-05-10',
    location: 'Home',
    hasVoice: false,
  },
  {
    id: 'photo-003',
    title: 'Beach Call',
    src: heroImage,
    alt: 'A summer beach photo with a voice note',
    takenAt: '2024-07-21',
    uploadedAt: '2024-07-22',
    location: 'Gangneung',
    hasVoice: true,
  },
  {
    id: 'photo-004',
    title: 'Blue Afternoon',
    src: heroImage,
    alt: 'A calm summer afternoon photograph',
    createdAt: '2025-08-02',
    uploadedAt: '2025-08-04',
    location: 'Busan',
    hasVoice: true,
  },
  {
    id: 'photo-005',
    title: 'Chuseok Table',
    src: heroImage,
    alt: 'An autumn family table memory',
    takenAt: '2025-09-17',
    uploadedAt: '2025-09-18',
    location: 'Daegu',
    hasVoice: true,
  },
  {
    id: 'photo-006',
    title: 'Fallen Light',
    src: heroImage,
    alt: 'An autumn street photo preserved as a memory',
    takenAt: '2024-11-03',
    uploadedAt: '2024-11-05',
    location: 'Jeonju',
    hasVoice: false,
  },
  {
    id: 'photo-007',
    title: 'Snow Album',
    src: heroImage,
    alt: 'A winter photo from an old family album',
    takenAt: '2026-01-14',
    uploadedAt: '2026-01-16',
    location: 'Pyeongchang',
    hasVoice: true,
  },
  {
    id: 'photo-008',
    title: 'December Room',
    src: heroImage,
    alt: 'A December room photograph waiting for a voice',
    createdAt: '2025-12-24',
    uploadedAt: '2025-12-25',
    location: 'Incheon',
    hasVoice: false,
  },
  {
    id: 'photo-009',
    title: 'Late Summer Film',
    src: heroImage,
    alt: 'A late summer film photo',
    uploadedAt: '2023-06-09',
    location: 'Jeju',
    hasVoice: true,
  },
]
