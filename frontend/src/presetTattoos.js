export function getAssetUrl(path) {
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}

export const PRESET_TATTOOS = [
  {
    id: 'preset_posht',
    name: 'ظرفیت پشت پر است، از جلو خنجر بزنید',
    category: 'random',
    categoryName: 'رندوم',
    icon: '🗡️',
    filename: 'posht.png',
    desc: 'نوشته تتو فارسی با فونت فوق‌العاده بولد و خوانا'
  },
  {
    id: 'preset_madar',
    name: 'رفیق بیکلک مادر',
    category: 'random',
    categoryName: 'رندوم',
    icon: '❤️',
    filename: 'madar.png',
    desc: 'تتو نوشته اصیل و ماندگار با خط بولد و نشان قلب'
  },
  {
    id: 'preset_wolf',
    name: 'گرگ هندسی (Geometric Wolf)',
    category: 'geometric',
    categoryName: 'هندسی و مدرن',
    icon: '🐺',
    filename: 'wolf.png',
    desc: 'طرح مدرن با سطوح هندسی و زوایای کریستالی'
  },
  {
    id: 'preset_dragon',
    name: 'اژدهای شرقی (Eastern Dragon)',
    category: 'myth',
    categoryName: 'اساطیری و کهن',
    icon: '🐉',
    filename: 'dragon.png',
    desc: 'طرح مواج مارپیچی با جزییات پولک و شاخ'
  },
  {
    id: 'preset_skull',
    name: 'جمجمه و رز (Skull & Rose)',
    category: 'dark',
    categoryName: 'دارک و گوتیک',
    icon: '💀',
    filename: 'skull.png',
    desc: 'جمجمه نئوسنتی با گل رزهای شکوفا در پایه'
  },
  {
    id: 'preset_mandala',
    name: 'ماندالای عرفانی (Sacred Mandala)',
    category: 'geometric',
    categoryName: 'هندسی و مدرن',
    icon: '✨',
    filename: 'mandala.png',
    desc: 'طرح تقارن شعاعی ۱۶ پر با هندسه مقدس'
  },
  {
    id: 'preset_snake',
    name: 'مار کبرای سلطنتی (King Cobra)',
    category: 'animals',
    categoryName: 'حیوانات و نمادها',
    icon: '🐍',
    filename: 'snake.png',
    desc: 'کبرای آماده حمله با کلاهک باز و پترن عینک'
  },
  {
    id: 'preset_lion',
    name: 'شیر شاهوار (Majestic Lion)',
    category: 'animals',
    categoryName: 'حیوانات و نمادها',
    icon: '🦁',
    filename: 'lion.png',
    desc: 'چهره پرصلابت شیر با یال‌های شعله‌گون'
  },
  {
    id: 'preset_rose',
    name: 'رز سیاه گوتیک (Gothic Black Rose)',
    category: 'nature',
    categoryName: 'طبیعت و گل',
    icon: '🌹',
    filename: 'rose.png',
    desc: 'رز مشکی پرپر با ساقه پر از خار و برگ'
  },
  {
    id: 'preset_butterfly',
    name: 'شاپرک جمجمه‌ای (Death Moth)',
    category: 'dark',
    categoryName: 'دارک و گوتیک',
    icon: '🦋',
    filename: 'butterfly.png',
    desc: 'شاپرک با نشان اسکلت بر سینه و هلال ماه'
  },
  {
    id: 'preset_compass',
    name: 'قطب‌نمای وایکینگ (Vegvisir)',
    category: 'myth',
    categoryName: 'اساطیری و کهن',
    icon: '🧭',
    filename: 'compass.png',
    desc: 'قطب‌نمای باستانی نوردیک با ۸ شاخه رونیک'
  },
  {
    id: 'preset_dagger',
    name: 'خنجر و افعی (Serpent Dagger)',
    category: 'dark',
    categoryName: 'دارک و گوتیک',
    icon: '🗡️',
    filename: 'dagger.png',
    desc: 'خنجر قرون وسطایی پیچیده شده با مار'
  },
  {
    id: 'preset_moon_sun',
    name: 'خورشید و ماه کیهانی (Celestial)',
    category: 'symbols',
    categoryName: 'نمادین و کیهانی',
    icon: '☀️',
    filename: 'moon_sun.png',
    desc: 'پیوستگی ماه و خورشید با پرتوهای آتشین'
  },
  {
    id: 'preset_eagle',
    name: 'عقاب اوج‌گیرنده (Soaring Eagle)',
    category: 'animals',
    categoryName: 'حیوانات و نمادها',
    icon: '🦅',
    filename: 'eagle.png',
    desc: 'عقاب با بال‌های گشوده و نگاه تیزبین'
  },
  {
    id: 'preset_tribal',
    name: 'بازوبند مائوری (Polynesian Band)',
    category: 'tribal',
    categoryName: 'تریبال و سنتی',
    icon: '🔱',
    filename: 'tribal.png',
    desc: 'نقوش دندان کوسه و نیزه‌های جنگجویان'
  },
  {
    id: 'preset_phoenix',
    name: 'ققنوس آتشین (Rising Phoenix)',
    category: 'myth',
    categoryName: 'اساطیری و کهن',
    icon: '🔥',
    filename: 'phoenix.png',
    desc: 'ققنوس اساطیری برآمده از آتش و بال‌های سوزان'
  },
  {
    id: 'preset_koi',
    name: 'ماهی کوی ژاپنی (Japanese Koi)',
    category: 'myth',
    categoryName: 'اساطیری و کهن',
    icon: '🐟',
    filename: 'koi.png',
    desc: 'نماد پشتکار و شکوه در فرهنگ ژاپن'
  },
  {
    id: 'preset_scorpion',
    name: 'عقرب شکارچی (Desert Scorpion)',
    category: 'animals',
    categoryName: 'حیوانات و نمادها',
    icon: '🦂',
    filename: 'scorpion.png',
    desc: 'عقرب بندبند با نیش خمیده و چنگال‌های تیز'
  }
];

export const TATTOO_CATEGORIES = [
  { id: 'all', label: 'همه طرح‌ها' },
  { id: 'random', label: 'رندوم (Random)' },
  { id: 'geometric', label: 'هندسی و مدرن' },
  { id: 'dark', label: 'دارک و گوتیک' },
  { id: 'myth', label: 'اساطیری و ژاپنی' },
  { id: 'animals', label: 'حیوانات و پرندگان' },
  { id: 'nature', label: 'طبیعت و گل' },
  { id: 'tribal', label: 'تریبال و سنتی' },
  { id: 'symbols', label: 'نمادین و کیهانی' }
];
