import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MapComponent } from './components/map-component/map-component';
import { WomanDetailComponent } from './components/woman-detail/woman-detail.component';
import { HistoryContextComponent } from './components/history-context/history-context.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'map', component: MapComponent },
  { path: 'history-context', component: HistoryContextComponent },
  { path: 'woman/:id', component: WomanDetailComponent },
  { path: '**', redirectTo: '' }
];
