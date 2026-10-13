import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import {
  BiographyBlock,
  SourceLink,
  WomanDetails,
  WomanProfile,
  WomanRecord
} from '../models/woman-record.model';

export type {
  BiographyBlock,
  SourceLink,
  WomanDetails,
  WomanProfile,
  WomanRecord
} from '../models/woman-record.model';

export interface MapFilters {
  regions: string[];
  categories: string[];
  centuries: string[];
}

interface RawDataStructure {
  profiles?: unknown;
  details?: unknown;
}

interface DataStructure {
  profiles: WomanProfile[];
  details: (Partial<WomanDetails> & { id: string })[];
}

@Injectable({
  providedIn: 'root'
})
export class MapDataService {
  private readonly http = inject(HttpClient);
  private readonly jsonPath = 'assets/data/women-data.json';

  private readonly womenRecords$: Observable<WomanRecord[]> = this.getLocalData().pipe(
    map((data) => this.mergeLocalData(this.normalizeDataStructure(data))),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  private getLocalData(): Observable<RawDataStructure> {
    return this.http.get<RawDataStructure>(this.jsonPath);
  }

  getAllWomenRecords(): Observable<WomanRecord[]> {
    return this.womenRecords$;
  }

  getAllProfiles(): Observable<WomanProfile[]> {
    return this.getAllWomenRecords().pipe(
      map((records) => records.map((record) => this.toProfile(record)))
    );
  }

  getProfileById(id: string): Observable<WomanProfile | undefined> {
    return this.getAllProfiles().pipe(map((profiles) => profiles.find((p) => p.id === id)));
  }

  getDetailsById(id: string): Observable<WomanDetails | undefined> {
    return this.getAllWomenRecords().pipe(
      map((records) => records.find((record) => record.id === id)),
      map((record) => (record ? this.toDetails(record) : undefined))
    );
  }

  filter(filters: MapFilters): Observable<WomanProfile[]> {
    return this.getAllProfiles().pipe(
      map((profiles) =>
        profiles.filter((woman) => {
          const matchesRegion =
            filters.regions.length === 0 || filters.regions.includes(woman.region);
          const matchesCategories =
            filters.categories.length === 0 ||
            filters.categories.some((cat) => woman.categories.includes(cat));
          const matchesCentury =
            filters.centuries.length === 0 || filters.centuries.includes(woman.century);

          return matchesRegion && matchesCategories && matchesCentury;
        })
      )
    );
  }

  getRegions(): string[] {
    return [
      'Минская область',
      'Гомельская область',
      'Брестская область',
      'Витебская область',
      'Гродненская область',
      'Могилевская область'
    ];
  }

  getCategories(): string[] {
    return ['Наука', 'Искусство', 'Спорт', 'Общественная деятельность'];
  }

  getCenturies(): string[] {
    return ['XII век', 'XVIII век', 'XIX век', 'XX век', 'XXI век'];
  }

  private mergeLocalData(data: DataStructure): WomanRecord[] {
    return data.profiles.map((profile) => {
      const details = data.details.find((item) => item.id === profile.id);
      return {
        ...profile,
        heroImage: details?.heroImage || profile.images[0] || 'assets/stockWoman.webp',
        previewImages: details?.previewImages || profile.images,
        fullBiography: (details?.fullBiography as BiographyBlock[]) || [],
        sources: (details?.sources as SourceLink[]) ?? []
      };
    });
  }

  private normalizeDataStructure(value: RawDataStructure | null | undefined): DataStructure {
    if (!value || typeof value !== 'object') {
      return { profiles: [], details: [] };
    }

    return {
      profiles: this.normalizeArray<WomanProfile>(value.profiles),
      details: this.normalizeArray<Partial<WomanDetails> & { id: string }>(value.details)
    };
  }

  private normalizeArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is T => !!item && typeof item === 'object');
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, T>).filter(
        (item): item is T => !!item && typeof item === 'object'
      );
    }

    return [];
  }

  private toProfile(record: WomanRecord): WomanProfile {
    return {
      id: record.id,
      name: record.name,
      birth: record.birth,
      death: record.death,
      region: record.region,
      city: record.city,
      categories: record.categories,
      century: record.century,
      shortInfo: record.shortInfo,
      coordinates: record.coordinates,
      images: record.images
    };
  }

  private toDetails(record: WomanRecord): WomanDetails {
    return {
      id: record.id,
      heroImage: record.heroImage,
      previewImages: record.previewImages,
      fullBiography: record.fullBiography as BiographyBlock[],
      sources: record.sources ?? []
    };
  }
}