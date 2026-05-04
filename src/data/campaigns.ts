import heroImage from '../assets/hero.png'

export type Campaign = {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  year: string
  location: string
  audioLabel: string
}

export const campaigns: Campaign[] = [
  {
    id: 'alley-childhood',
    title: '어린 시절의 골목길',
    subtitle: '낡은 사진 한 장에서 뛰놀던 오후의 소리를 꺼냅니다.',
    description:
      'AI가 사진 속 장면을 읽고, 가족의 목소리로 그때의 냄새와 웃음, 작은 사건들을 다시 기록합니다.',
    image: heroImage,
    year: '1998',
    location: '서울 성북동',
    audioLabel: '골목길 발자국 기록',
  },
  {
    id: 'grandmother-kitchen',
    title: '할머니의 부엌',
    subtitle: '김이 오르던 밥상과 조용한 안부를 목소리로 남깁니다.',
    description:
      '오래된 가족사진 위에 기억의 문장을 얹고, 다시 들을 수 있는 따뜻한 음성 앨범으로 보관합니다.',
    image: heroImage,
    year: '2003',
    location: '전주 한옥마을',
    audioLabel: '부엌의 온기 듣기',
  },
  {
    id: 'graduation-voice',
    title: '졸업식의 목소리',
    subtitle: '꽃다발 너머로 들리던 축하와 떨림을 다시 불러옵니다.',
    description:
      '사진 속 사람과 순간을 단서로 삼아, 잊고 있던 대화와 마음을 짧은 오디오 기록으로 정리합니다.',
    image: heroImage,
    year: '2011',
    location: '부산 남구',
    audioLabel: '축하 인사 재생',
  },
  {
    id: 'family-trip',
    title: '가족 여행의 하루',
    subtitle: '흐린 필름 위에 남은 바람과 농담까지 저장합니다.',
    description:
      '여행 사진을 업로드하면 장소와 계절, 표정을 바탕으로 가족이 함께 들을 수 있는 회상 노트를 만듭니다.',
    image: heroImage,
    year: '2016',
    location: '강릉 주문진',
    audioLabel: '바닷가 기억 열기',
  },
  {
    id: 'old-film-us',
    title: '오래된 필름 속 우리',
    subtitle: '바랜 색감 속에서도 사라지지 않은 이름들을 모읍니다.',
    description:
      'Remory는 사진을 단순한 이미지가 아니라, 목소리와 사연이 함께 숨 쉬는 개인 기록 보관소로 바꿉니다.',
    image: heroImage,
    year: '1987',
    location: '대구 중구',
    audioLabel: '필름 속 이야기',
  },
]
