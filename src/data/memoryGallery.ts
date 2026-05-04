import heroImage from '../assets/hero.png'

export type MemoryGalleryItem = {
  id: number
  title: string
  src: string
  alt: string
  width: string
  top: string
  left: string
  speed: number
  rotate: string
  tone: string
}

export const memoryGallery: MemoryGalleryItem[] = [
  {
    id: 1,
    title: 'Kitchen Warmth',
    src: heroImage,
    alt: 'A warm family memory preserved from an old kitchen photograph',
    width: '280px',
    top: '12vh',
    left: '7vw',
    speed: 0.18,
    rotate: '-2.5deg',
    tone: '#d8a15d',
  },
  {
    id: 2,
    title: 'Graduation Voice',
    src: heroImage,
    alt: 'A graduation day photograph turned into a voice archive',
    width: '430px',
    top: '34vh',
    left: '69vw',
    speed: 0.32,
    rotate: '1.8deg',
    tone: '#b9824a',
  },
  {
    id: 3,
    title: 'Sunday Album',
    src: heroImage,
    alt: 'A quiet Sunday family album memory',
    width: '360px',
    top: '82vh',
    left: '38vw',
    speed: 0.24,
    rotate: '-1deg',
    tone: '#7f6a57',
  },
  {
    id: 4,
    title: 'Film Roll',
    src: heroImage,
    alt: 'A faded film photograph ready to become an audio story',
    width: '240px',
    top: '122vh',
    left: '14vw',
    speed: 0.38,
    rotate: '2.8deg',
    tone: '#c99b6c',
  },
  {
    id: 5,
    title: 'Travel Note',
    src: heroImage,
    alt: 'A family travel photograph with remembered voices',
    width: '500px',
    top: '152vh',
    left: '55vw',
    speed: 0.2,
    rotate: '-1.8deg',
    tone: '#9d7a58',
  },
  {
    id: 6,
    title: 'First Camera',
    src: heroImage,
    alt: 'A first camera memory collected into Remory',
    width: '310px',
    top: '198vh',
    left: '26vw',
    speed: 0.3,
    rotate: '1.2deg',
    tone: '#d8a15d',
  },
  {
    id: 7,
    title: 'Voice Letter',
    src: heroImage,
    alt: 'A photo memory paired with a gentle voice letter',
    width: '230px',
    top: '226vh',
    left: '76vw',
    speed: 0.42,
    rotate: '-3deg',
    tone: '#b9824a',
  },
]
