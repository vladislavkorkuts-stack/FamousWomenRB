import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface WomanProfile {
  id: string;
  name: string;
  images?: string[];
  [key: string]: unknown;
}

interface WomenData {
  profiles: Record<string, WomanProfile>;
  details: Record<string, unknown>;
}

interface FloatingPhoto {
  id: string;
  name: string;
  image: string;
  left: number;       // %
  size: number;       // px
  rotate: number;     // deg
  duration: number;   // сек
  delay: number;      // сек (отрицательный — чтобы начать в середине)
  drift: number;      // px — горизонтальное смещение за время полёта
  opacity: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly photos = signal<FloatingPhoto[]>([]);
  readonly totalWomen = signal(0);

  ngOnInit(): void {
    this.http.get<WomenData>('assets/data/women-data.json').subscribe({
      next: (data) => {
        const profiles = Object.values(data.profiles);
        this.totalWomen.set(profiles.length);
        this.photos.set(this.buildFloatingPhotos(profiles));
      },
      error: (err) => console.error('Не удалось загрузить women-data.json', err)
    });
  }

  private buildFloatingPhotos(profiles: WomanProfile[]): FloatingPhoto[] {
    const withImages = profiles.filter(
      (p): p is WomanProfile & { images: string[] } =>
        Array.isArray(p.images) && p.images.length > 0
    );

    if (withImages.length === 0) return [];

    // Делаем 22 «летающих» фото — можно больше, чем самих женщин,
    // просто переиспользуем картинки для плотности фона.
    const count = 22;
    const result: FloatingPhoto[] = [];

    for (let i = 0; i < count; i++) {
      const p = withImages[i % withImages.length];
      result.push({
        id: `${p.id}-${i}`,
        name: p.name,
        image: p.images[0],
        left: this.rand(0, 95),
        size: this.rand(70, 150),
        rotate: this.rand(-25, 25),
        duration: this.rand(18, 32),     // медленный, плавный полёт
        delay: -this.rand(0, 25),         // отрицательный = старт «в середине»
        drift: this.rand(-120, 120),      // снос по горизонтали
        opacity: this.rand(0.35, 1)    // полупрозрачные, чтобы не мешать
      });
    }

    return result;
  }

  private rand(min: number, max: number): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  }
}