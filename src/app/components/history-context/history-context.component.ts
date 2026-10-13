import { DOCUMENT } from '@angular/common';
import {
  Component,
  HostListener,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/* ───────────────────────────── ТИПЫ ───────────────────────────── */

interface WomanProfile {
  id: string;
  name: string;
  images?: string[];
  century?: string;
  birth?: number;
  death?: number;
  city?: string;
  region?: string;
  categories?: string[];
  shortInfo?: string;
  [key: string]: unknown;
}

interface WomenData {
  profiles: Record<string, WomanProfile>;
  details: Record<string, unknown>;
}

interface EraWoman {
  id: string;
  name: string;
  image: string;
  years: string;
  city: string;
  shortInfo: string;
}

interface Era {
  slug: string;
  tag: string;
  title: string;
  years: string;
  lead: string;
  events: { year: string; text: string }[];
  facts: string[];
  accent: string;
  women: EraWoman[];
}

type SymbolViewerKind = 'emblem' | 'flag';

interface SymbolViewerState {
  kind: SymbolViewerKind;
  src: string;
  alt: string;
  title: string;
  detailsLabel: string;
  detailsUrl: string;
}

/* ────────────────────── ИСХОДНЫЕ ЭПОХИ ────────────────────── */

const ERA_DEFS: Omit<Era, 'women'>[] = [
  {
    slug: 'polotsk',
    tag: 'X–XIII век',
    title: 'Полоцкое и Туровское княжества',
    years: '862–1240',
    accent: '#2F6B3F',
    lead:
      'Первые государственные образования на белорусских землях. Здесь появились Полоцк и Туров, сюда пришло христианство, здесь родилась первая святая земли белорусской — Евфросиния Полоцкая.',
    events: [
      { year: '862', text: 'Первое письменное упоминание Полоцка в «Повести временных лет».' },
      { year: '980', text: 'В летописях впервые упоминается Туровское княжество.' },
      { year: '992', text: 'Основание Полоцкой епархии — начало христианизации края.' },
      { year: '1104', text: 'Рождение Евфросинии Полоцкой, первой просветительницы.' },
      { year: '1161', text: 'Завершено строительство Спасо-Преображенской церкви зодчим Иоанном.' }
    ],
    facts: [
      'Витебск (947), Брест (1019), Орша (1067), Пинск (1097) — древнейшие города.',
      'Кривичи, дреговичи, радимичи — восточнославянские племена на территории Беларуси.',
      'Полоцкие князья Рогволод, Изяслав, Всеслав Чародей — первые правители.'
    ]
  },
  {
    slug: 'vkl',
    tag: 'XIII–XVI век',
    title: 'Великое Княжество Литовское',
    years: '1240–1569',
    accent: '#8B4A2F',
    lead:
      'Крупнейшее государство Европы, простиравшееся от Балтики до Чёрного моря. Здесь родилась белорусская письменность, здесь Франциск Скорина напечатал первую книгу, здесь был создан Статут ВКЛ.',
    events: [
      { year: '1240-е', text: 'Объединение балтских и восточнославянских земель в ВКЛ.' },
      { year: '1323', text: 'Вильня становится столицей ВКЛ при Гедимине.' },
      { year: '1517', text: 'Франциск Скорина издаёт «Псалтырь» — первую книгу на восточнославянских землях.' },
      { year: '1529', text: 'Принят Статут ВКЛ — один из первых сводов законов Европы.' },
      { year: '1569', text: 'Люблинская уния: ВКЛ и Польша образуют Речь Посполитую.' }
    ],
    facts: [
      'Старобелорусский язык — государственный язык ВКЛ.',
      'Магдебургское право — самоуправление городов (Брест, Полоцк, Минск).',
      'Расцвет замкового зодчества: Мир, Несвиж, Лида, Крево.'
    ]
  },
  {
    slug: 'rzeczpospolita',
    tag: 'XVI–XVIII век',
    title: 'Речь Посполитая и разделы',
    years: '1569–1795',
    accent: '#6A3E8B',
    lead:
      'Эпоха барокко, магнатских дворцов и утраты государственности. Три раздела Речи Посполитой привели белорусские земли в состав Российской империи.',
    events: [
      { year: '1588', text: 'Третий Статут ВКЛ — вершина правовой мысли эпохи.' },
      { year: '1697', text: 'Старобелорусский язык вытеснен польским из делопроизводства.' },
      { year: '1772', text: 'Первый раздел Речи Посполитой.' },
      { year: '1793', text: 'Второй раздел: центральная Беларусь входит в Российскую империю.' },
      { year: '1795', text: 'Третий раздел: Речь Посполитая прекращает существование.' }
    ],
    facts: [
      'Несвижский и Мирский замки — резиденции магнатов Радзивиллов.',
      'Виленское барокко — уникальный архитектурный стиль.',
      'Тётка (Алоиза Пашкевич), Франтишка Уршуля Радзивилл — деятельницы эпохи.'
    ]
  },
  {
    slug: 'imperia',
    tag: 'XIX — начало XX века',
    title: 'Национальное возрождение',
    years: '1795–1917',
    accent: '#1F5A8B',
    lead:
      'Под властью Российской империи белорусские земли переживают восстания, репрессии и одновременно — рождение новой национальной литературы, газеты «Наша Нива» и первых политических организаций.',
    events: [
      { year: '1830–1831', text: 'Восстание против Российской империи.' },
      { year: '1863–1864', text: 'Восстание Кастуся Калиновского.' },
      { year: '1906', text: 'Выходит газета «Наша Нива» — центр национального движения.' },
      { year: '1917', text: 'Октябрьская революция, начало советского периода.' },
      { year: '1918', text: 'Провозглашение Белорусской Народной Республики (БНР).' }
    ],
    facts: [
      'Франтишек Богушевич, Янка Купала, Якуб Колас — классики новой литературы.',
      'Алоиза Пашкевич (Тётка) — поэтесса и революционерка.',
      'Элиза Ожешко — писательница, номинантка Нобелевской премии.'
    ]
  },
  {
    slug: 'war',
    tag: '1922–1945',
    title: 'БССР и Великая Отечественная',
    years: '1922–1945',
    accent: '#8B1F1F',
    lead:
      'Эпоха созидания и величайшей трагедии. Беларусь потеряла каждого третьего жителя в годы войны, но стала одной из стран-основательниц ООН.',
    events: [
      { year: '1922', text: 'БССР — одна из основательниц СССР.' },
      { year: '1920-е', text: 'Политика белорусизации: развитие языка, школы, науки.' },
      { year: '1941', text: 'Начало Великой Отечественной войны. Оккупация Беларуси.' },
      { year: '1943', text: 'Освобождение первых белорусских городов и деревень.' },
      { year: '1945', text: 'БССР — страна-основательница ООН.' }
    ],
    facts: [
      'Марат Казей, Зина Портнова, Петя Котельников — дети-герои.',
      'Партизанское движение — одно из крупнейших в Европе.',
      '3 июля 1944 — освобождение Минска, ныне День Независимости.'
    ]
  },
  {
    slug: 'modern',
    tag: '1945 — наши дни',
    title: 'Независимая Республика Беларусь',
    years: '1945–2025',
    accent: '#2F6B3F',
    lead:
      'Послевоенное восстановление, обретение независимости и путь к современной Беларуси — стране с развитой экономикой, наукой и культурой.',
    events: [
      { year: '1945–1960-е', text: 'Восстановление городов и сёл, индустриализация.' },
      { year: '1991', text: 'Провозглашение независимости Республики Беларусь.' },
      { year: '1994', text: 'Принятие Конституции, первые президентские выборы.' },
      { year: '2005', text: 'Парк высоких технологий — центр IT-индустрии.' },
      { year: '2024', text: 'Марина Василевская — первая белоруска в космосе.' }
    ],
    facts: [
      'МАЗ, МТЗ, БЕЛАЗ — бренды, известные в мире.',
      'Развитая система образования и здравоохранения.',
      'Беларусь — член ООН, СНГ, ЕАЭС.'
    ]
  }
];

/* ────────────────────── КОМПОНЕНТ ────────────────────── */

@Component({
  selector: 'app-history-context',
  imports: [RouterLink],
  templateUrl: './history-context.component.html',
  styleUrl: './history-context.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HistoryContextComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly hostRef = inject(ElementRef);

  private get host(): HTMLElement {
    return this.hostRef.nativeElement as HTMLElement;
  }

  readonly eras = signal<Era[]>(ERA_DEFS.map((e) => ({ ...e, women: [] })));
  readonly activeSlug = signal<string>(ERA_DEFS[0].slug);
  readonly scrollProgress = signal(0);
  readonly showBackToTop = signal(false);            // 🆕 кнопка «Наверх»

  private readonly SYMBOL_MAP: Record<SymbolViewerKind, SymbolViewerState> = {
    emblem: {
      kind: 'emblem',
      src: 'assets/history-context/Emblem_of_Belarus.svg',
      alt: 'Герб Беларуси',
      title: 'Герб',
      detailsLabel: 'Прочитать подробнее о Гербе',
      detailsUrl: 'https://president.gov.by/ru/gosudarstvo/simvolika/gerb'
    },
    flag: {
      kind: 'flag',
      src: 'assets/history-context/Flag_of_Belarus.svg',
      alt: 'Флаг Беларуси',
      title: 'Флаг',
      detailsLabel: 'Прочитать подробнее о Флаге',
      detailsUrl: 'https://president.gov.by/ru/gosudarstvo/simvolika/flag'
    }
  };

  readonly viewer = signal<SymbolViewerState | null>(null);
  readonly anthemOpen = signal(false);
  readonly anthemDetailsLabel = 'Прочитать подробнее о Гимне';
  readonly anthemDetailsUrl = 'https://president.gov.by/ru/gosudarstvo/simvolika/gimn';
  readonly anthemUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://www.youtube.com/embed/5UIJ44t25bc?autoplay=1'
  );

  private eraObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.http.get<WomenData>('assets/data/women-data.json').subscribe({
      next: (data: WomenData) => this.attachWomen(data.profiles),
      error: (err: unknown) => console.error('women-data.json не загружен', err)
    });
  }

  ngAfterViewInit(): void {
    this.eraObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const slug = (visible.target as HTMLElement).dataset['era'];
          if (slug) this.activeSlug.set(slug);
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0.1, 0.4, 0.7] }
    );

    this.host.querySelectorAll('[data-era]').forEach((el) => {
      this.eraObserver?.observe(el);
    });

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    this.host.querySelectorAll('[data-reveal]').forEach((el) => {
      this.revealObserver?.observe(el);
    });
  }

  ngOnDestroy(): void {
    this.eraObserver?.disconnect();
    this.revealObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onScroll(): void {
    const doc = this.document.documentElement;
    const scrollTop = doc.scrollTop || this.document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;
    this.scrollProgress.set(scrollHeight > 0 ? Math.min(1, scrollTop / scrollHeight) : 0);

    // 🆕 показываем кнопку «Наверх» при скролле > 500px
    const next = scrollTop > 500;
    if (next !== this.showBackToTop()) {
      this.showBackToTop.set(next);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.viewer()) this.closeViewer();
    else if (this.anthemOpen()) this.closeAnthem();
  }

  scrollToEra(slug: string): void {
    const el = this.host.querySelector(`[data-era="${slug}"]`) as HTMLElement | null;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // 🆕 Прыжок к секции символов
  scrollToSymbols(): void {
    const el = this.host.querySelector('#symbols') as HTMLElement | null;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // 🆕 Кнопка «Наверх»
  scrollToTop(): void {
    this.document.defaultView?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openSymbol(kind: SymbolViewerKind): void {
    this.viewer.set(this.SYMBOL_MAP[kind]);
    this.lockScroll();
  }

  closeViewer(): void {
    this.viewer.set(null);
    this.unlockScroll();
  }

  openAnthem(): void {
    this.anthemOpen.set(true);
    this.lockScroll();
  }

  closeAnthem(): void {
    this.anthemOpen.set(false);
    this.unlockScroll();
  }

  private lockScroll(): void {
    this.document.body.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    this.document.body.style.overflow = '';
  }

  private attachWomen(profiles: Record<string, WomanProfile>): void {
    const list = Object.values(profiles);
    const buckets: Record<string, EraWoman[]> = {};
    ERA_DEFS.forEach((e) => (buckets[e.slug] = []));

    for (const w of list) {
      if (!w.images?.length) continue;

      const birth =
        typeof w.birth === 'number' ? w.birth : this.parseYearFromCentury(w.century);
      if (birth == null) continue;

      const slug = this.eraSlugByYear(birth);
      if (!slug) continue;

      buckets[slug]?.push({
        id: w.id,
        name: w.name,
        image: w.images[0],
        years: this.formatYears(w.birth, w.death),
        city: w.city ?? '',
        shortInfo: (w.shortInfo ?? '').split('. ')[0] + '.'
      });
    }

    Object.keys(buckets).forEach((slug) => {
      buckets[slug]?.sort(
        (a, b) => this.extractYear(a.years) - this.extractYear(b.years)
      );
    });

    this.eras.update((prev) =>
      prev.map((e) => ({ ...e, women: (buckets[e.slug] ?? []).slice(0, 4) }))
    );
  }

  private eraSlugByYear(year: number): string | null {
    if (year < 1240) return 'polotsk';
    if (year < 1569) return 'vkl';
    if (year < 1795) return 'rzeczpospolita';
    if (year < 1917) return 'imperia';
    if (year < 1945) return 'war';
    return 'modern';
  }

  private parseYearFromCentury(century?: string): number | null {
    if (!century) return null;
    const match = century.match(/(\d+)/);
    if (!match) return null;
    const c = parseInt(match[1], 10);
    return (c - 1) * 100 + 50;
  }

  private formatYears(birth?: number, death?: number): string {
    const b = typeof birth === 'number' ? birth : null;
    const d = typeof death === 'number' ? death : null;
    if (b && d) return `${b}–${d}`;
    if (b) return `${b} —`;
    return '';
  }

  private extractYear(s: string): number {
    const m = s.match(/\d{3,4}/);
    return m ? parseInt(m[0], 10) : 0;
  }
}